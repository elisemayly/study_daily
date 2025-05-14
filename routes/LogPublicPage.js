const express = require("express");
const { TravelLog } = require("../models"); // 确保路径正确
const router = express.Router();
const config = require("../config.json");   // 确保路径正确
const crypto = require("crypto");
const { authenticateToken } = require("./auth"); // 确保路径正确
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// --- 响应工具函数 ---
const createSuccessResponse = (message, data = null) => {
  return { success: true, message, data };
};
const createErrorResponse = (message) => {
  return { success: false, message };
};

// --- Multer 配置 ---
const generateFilename = (file) => {
  const ext = path.extname(file.originalname);
  const randomBytes = crypto.randomBytes(8).toString("hex");
  const timestamp = Date.now();
  return `${timestamp}-${randomBytes}${ext}`;
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = config.logUploadPath;
    // console.log(`[Multer Dest] 目标路径: ${uploadPath}, 上传文件: ${file.originalname}`); // 已添加日志
    if (!fs.existsSync(uploadPath)) {
      // console.log(`[Multer Dest] 目录 ${uploadPath} 不存在，尝试创建...`); // 已添加日志
      try {
        fs.mkdirSync(uploadPath, { recursive: true });
        // console.log(`[Multer Dest] 目录 ${uploadPath} 创建成功。`); // 已添加日志
      } catch (err) {
        console.error(`[Multer Dest] 创建目录 ${uploadPath} 失败:`, err);
        return cb(new Error(`无法创建上传目录: ${err.message}`), null);
      }
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueFilename = generateFilename(file);
    // console.log(`[Multer Filename] 为文件 ${file.originalname} 生成文件名: ${uniqueFilename}`); // 已添加日志
    cb(null, uniqueFilename);
  },
});

const fileFilter = (req, file, cb) => {
  // console.log(`[Multer Filter] 检查文件: ${file.fieldname} - ${file.originalname}, mimetype: ${file.mimetype}`); // 已添加日志
  const allowedImageTypes = /jpeg|jpg|png|gif/;
  const allowedVideoTypes = /mp4|mov|quicktime|avi|wmv|mkv/;

  const fileExt = path.extname(file.originalname).toLowerCase().substring(1);

  const isImageField = file.fieldname === "images";
  const isVideoField = file.fieldname === "video";

  if (isImageField && allowedImageTypes.test(fileExt)) {
    // console.log(`[Multer Filter] 接受图片 (基于后缀名): ${file.originalname}`); // 已添加日志
    cb(null, true);
  } else if (isVideoField && allowedVideoTypes.test(fileExt)) {
    // console.log(`[Multer Filter] 接受视频 (基于后缀名): ${file.originalname}`); // 已添加日志
    cb(null, true);
  } else {
    const mimetypeImage = allowedImageTypes.test(file.mimetype);
    const mimetypeVideo = allowedVideoTypes.test(file.mimetype) || file.mimetype === 'video/quicktime';
    if (isImageField && mimetypeImage) {
        // console.log(`[Multer Filter] 接受图片 (基于mimetype): ${file.originalname}`); // 已添加日志
        cb(null, true);
    } else if (isVideoField && mimetypeVideo) {
        // console.log(`[Multer Filter] 接受视频 (基于mimetype): ${file.originalname}`); // 已添加日志
        cb(null, true);
    } else {
        console.log(`[Multer Filter] 拒绝文件: ${file.originalname} (后缀名: ${fileExt}, mimetype: ${file.mimetype})`);
        cb(new Error("不支持的文件类型!"), false); // 这个错误应该会被全局错误处理器捕获
    }
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 200 }, // 200MB
  fileFilter: fileFilter,
}).fields([
  { name: "images", maxCount: 6 },
  { name: "video", maxCount: 1 },
]);

// --- 错误处理辅助函数：删除已上传的文件 ---
const cleanupUploadedFilesOnError = (files) => {
  if (!files) {
    // console.log("[Cleanup] 没有文件需要清理 (files 对象为空)"); // 已添加日志
    return;
  }
  // console.log("[Cleanup] 准备清理文件:", files); // 已添加日志
  const filesToDelete = [
    ...(files.images || []),
    ...(files.video || [])
  ];
  if (filesToDelete.length === 0) {
    // console.log("[Cleanup] 没有具体的文件条目需要删除。"); // 已添加日志
    return;
  }
  filesToDelete.forEach(file => {
    if (file && file.path) {
      fs.unlink(file.path, (unlinkErr) => {
        if (unlinkErr) console.error(`[Cleanup] 删除文件失败 ${file.path}:`, unlinkErr);
        // else console.log(`[Cleanup] 成功删除文件: ${file.path}`); // 已添加日志
      });
    } else {
      // console.warn("[Cleanup] 发现无效的文件条目，无法删除:", file); // 已添加日志
    }
  });
};

// --- 游记发布提交路由 ---
router.post("/upload", authenticateToken, upload, async (req, res, next) => { // upload 作为中间件
  // console.log("[/upload Route] 进入路由处理函数。"); // 已添加日志
  // console.log("[/upload Route] req.body:", req.body ? JSON.stringify(req.body) : 'undefined'); // 已添加日志
  // console.log("[/upload Route] req.files:", req.files ? JSON.stringify(Object.keys(req.files)) : 'undefined'); // 已添加日志

  try {
    const userId = req.user.id;
    const {
      travelId, title, content, state = "待审核",
      travelMonth, percost, rate, destination, topic,
    } = req.body;

    if (!title || !content) {
      // console.log("[/upload Route] 错误: 标题或内容为空。"); // 已添加日志
      if (req.files) { cleanupUploadedFilesOnError(req.files); }
      // 直接返回响应，不再调用 next()，因为这不是一个需要传递给后续错误处理器的“意外”错误
      return res.status(400).json(createErrorResponse("标题和内容不能为空"));
    }

    let imageUrls = []; // <--- 声明并初始化
    if (req.files && req.files.images && req.files.images.length > 0) {
      imageUrls = req.files.images.map((file) => file.filename);
      // console.log("[/upload Route] 处理后的图片文件名:", imageUrls); // 已添加日志
    }

    let videoUrl = null; // <--- 声明并初始化
    if (req.files && req.files.video && req.files.video.length > 0) {
      // Multer 的 .fields([{name: 'video', maxCount: 1}]) 会使得 req.files.video 是一个数组
      videoUrl = req.files.video[0].filename;
      // console.log("[/upload Route] 处理后的视频文件名:", videoUrl); // 已添加日志
    }

    const logData = {
      title,
      content,
      imagesUrl: imageUrls, // 使用上面定义的 imageUrls
      videoUrl: videoUrl,   // 使用上面定义的 videoUrl
      travelMonth,
      // percost,
      rate,
      destination,
      topic,
      userId,
      state,
    };

    let savedLog;
    if (travelId) {
      savedLog = await TravelLog.findByIdAndUpdate(travelId, logData, { new: true });
      if (!savedLog) {
        // console.log("[/upload Route] 错误: 未找到要更新的游记, ID:", travelId); // 已添加日志
        if (req.files) { cleanupUploadedFilesOnError(req.files); }
        return res.status(404).json(createErrorResponse("未找到要更新的游记"));
      }
      // console.log("[/upload Route] 游记更新成功, ID:", travelId); // 已添加日志
      res.status(200).json(createSuccessResponse("游记更新成功！", savedLog));
    } else {
      const travelLogEntry = new TravelLog(logData);
      savedLog = await travelLogEntry.save();
      // console.log("[/upload Route] 新游记发布成功, ID:", savedLog._id); // 已添加日志
      res.status(201).json(createSuccessResponse("游记发布成功！", savedLog));
    }
  } catch (dbErr) {
    console.error("[/upload Route] 数据库操作或后续逻辑错误:", dbErr.message); 
    // console.error(dbErr.stack); // 调试时可以打开完整的堆栈跟踪
    if (req.files) { cleanupUploadedFilesOnError(req.files); }
    next(dbErr); // 将错误传递给 Express 错误处理中间件 (在 server.js 中定义的那个)
  }
});

// --- 游记保存到草稿箱 (保持原样，有警告) ---
router.post("/drafts", authenticateToken, async (req, res) => {
  // console.warn("/drafts 路由仍使用旧的 Base64 方法，需要更新才能处理文件上传。"); // 已添加日志
  const userId = req.user.id;
  const {
    title, content, images, travelMonth, percost, rate, destination, topic, state,
  } = req.body;

  if (!images || !images._parts || !Array.isArray(images._parts[0]) || !Array.isArray(images._parts[0][1])) {
     return res.status(400).json(createErrorResponse("草稿请求格式错误或未更新以支持文件上传"));
  }
  const imageData = images._parts[0][1];
  res.setHeader("content-type", "application/json"); // 这个对于 POST /drafts 可能不需要
  try {
    const imagesUrl = imageData.map((data) => { // <--- 注意，这里的 imagesUrl 是局部变量
      const md5 = crypto.createHash("md5").update(data[0]).digest("hex");
      const ext = data[1];
      return `${md5}.${ext}`;
    });
    // console.log("草稿图片 URLs (旧方法):", imagesUrl); // 已添加日志
    // console.log("注意: 您需要确保有 saveImage (Base64) 的逻辑来保存草稿图片，如果还需要此功能。"); // 已添加日志

    const travelLog = new TravelLog({
      title, content, imagesUrl, travelMonth, percost, rate, destination, topic, userId, state,
    });
    await travelLog.save();
    res.status(201).json(createSuccessResponse("游记已保存为草稿！"));
  } catch (err) {
    console.error("保存草稿失败:", err);
    res.status(500).json(createErrorResponse("保存草稿失败: " + err.message));
  }
});

module.exports = router;