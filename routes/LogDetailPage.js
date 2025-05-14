const express = require("express");
const { User, TravelLog, Manager } = require("../models"); // 确保 Manager 是否需要
const config = require("../config.json");
const router = express.Router();

// 根据游记id返回游记详细信息
router.get("/findLog/:id", async (req, res) => {
  try {
    const logId = req.params.id;

    // 1. 查询数据库并 populate 作者信息
    const travelLog = await TravelLog.findById(logId)
                              .populate("userId", "username userAvatar profile"); // 保持 populate

    if (!travelLog) {
      return res.status(404).json({ error: "Travel log not found" }); // 保持原始错误格式
    }

    // 2. 处理图片 URLs (与原始逻辑一致，增加健壮性检查)
    if (travelLog.imagesUrl && Array.isArray(travelLog.imagesUrl)) {
      travelLog.imagesUrl = travelLog.imagesUrl.map((imageUrl) => {
        if (imageUrl && typeof imageUrl === 'string' && !imageUrl.startsWith("http")) {
          return `${config.baseURL}/${config.logUploadPath}/${imageUrl}`;
        }
        return imageUrl;
      });
    } else {
      travelLog.imagesUrl = []; // 如果不存在或不是数组，则设为空数组
    }

    // 3. 处理视频 URL 
    if (travelLog.videoUrl && typeof travelLog.videoUrl === 'string' && travelLog.videoUrl.trim() !== "") {
      if (!travelLog.videoUrl.startsWith("http")) {
        travelLog.videoUrl = `${config.baseURL}/${config.logUploadPath}/${travelLog.videoUrl}`;
      }
      // 如果已经是 http URL，则保持不变
    } else {
      // 如果 videoUrl 不存在、不是字符串或为空，可以将其设置为 null 或 undefined
      // 为了让前端的条件渲染 travelLog.videoUrl 能正确工作，设置为 null 或 undefined 都可以
      travelLog.videoUrl = null;
    }
    console.log(`[findLog/${logId}] (原始风格修改后) videoUrl: ${travelLog.videoUrl}`);

    // 4. 处理作者头像 URL (直接修改 travelLog.userId.userAvatar)
    if (travelLog.userId && travelLog.userId.userAvatar && typeof travelLog.userId.userAvatar === 'string') {
      if (!travelLog.userId.userAvatar.startsWith("http")) {
        travelLog.userId.userAvatar = `${config.baseURL}/${config.userAvatarPath}/${travelLog.userId.userAvatar}`;
      }
    }

    
    console.log("返回给前端的游记数据 (直接修改travelLog对象):", JSON.stringify(travelLog.toObject(), null, 2)); // 使用 toObject() 打印纯对象
    res.json(travelLog); // 直接返回 Mongoose 文档对象，它会被序列化为 JSON

  } catch (error) {
    console.error(`获取游记详情失败 (ID: ${req.params.id}):`, error);
    res.status(500).json({ error: "Internal server error" }); // 保持原始错误格式
  }
});

module.exports = router;