const express = require("express");
const config = require("../config.json");
const { User, TravelLog, Manager, Like, Collect } = require("../models");
const router = express.Router();
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

//验证用户登录状态
const { authenticateToken } = require("./auth");

//获取我发布的笔记
router.get("/getMyLogs", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const selectedFields = {
      _id: 1,
      title: 1,
      imagesUrl: { $slice: 1 }, // 只获取第一张图片作为封面
      videoUrl: 1,              
      likes: 1,
      state: 1,
      userId: 1,
      // 考虑添加 createdAt 用于排序或显示
      // createdAt: 1,
    };

    const travelLogs = await TravelLog.find(
      {
        userId: userId,
        // state: "待审核",
      },
      selectedFields
    )
    .populate("userId", "username userAvatar")
    .sort({ createdAt: -1 }); // 示例：按创建时间降序排序

    const filteredTravelLogs = travelLogs.map((item) => {
      let coverImageUrl = null; // 用于存储处理后的封面图片 URL
      if (item.imagesUrl && item.imagesUrl.length > 0) {
        const firstImage = item.imagesUrl[0];
        if (firstImage && !firstImage.startsWith("http")) {
          coverImageUrl = `${config.baseURL}/${config.logUploadPath}/${firstImage}`;
        } else {
          coverImageUrl = firstImage;
        }
      }

      // --- 2. 处理 videoUrl ---
      let processedVideoUrl = null; // 用于存储处理后的视频 URL
      if (item.videoUrl && item.videoUrl.trim() !== "") { // 检查 videoUrl 是否存在且不为空
        if (!item.videoUrl.startsWith("http")) {
          // 与图片路径拼接逻辑类似
          processedVideoUrl = `${config.baseURL}/${config.logUploadPath}/${item.videoUrl}`;
        } else {
          processedVideoUrl = item.videoUrl;
        }
      }
      // --- videoUrl 处理结束 ---

      let userAvatar = item.userId.userAvatar;
      if (userAvatar && !userAvatar.startsWith("http")) {
        userAvatar = `${config.baseURL}/${config.userAvatarPath}/${userAvatar}`;
      }

      const newItem = {
        _id: item._id,
        title: item.title,
        imageUrl: coverImageUrl,    // 返回处理后的封面图片 URL
        videoUrl: processedVideoUrl, // <--- 3. 将处理后的 videoUrl 添加到返回对象
        // hits: item.hits, 
        likes: item.likes,
        userId: item.userId._id,
        username: item.userId.username,
        userAvatar: userAvatar,
        state: item.state,
        // createdAt: item.createdAt, 
      };
      return newItem;
    });

    res.status(200).json({
      status: "success",
      message: "获取我发布的游记成功",
      data: filteredTravelLogs,
    });
  } catch (error) {
    console.error("获取我发布的游记失败:", error);
    res.status(500).json({ status: "error", message: "出错了，请联系管理员" });
  }
});

//获取我点赞的笔记
router.get("/getMyLikeLogs", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const travelLogs = await Like.aggregate([
      {
        $lookup: {
          from: "travellogs", // travelLogs集合名称
          localField: "travelLogId", // Like集合中的关联字段
          foreignField: "_id", // travelLogs集合中的关联字段
          as: "travelLog", // 存储联结后的用户信息
        },
      },
      {
        $match: {
          $and: [
            { "travelLog.state": "已通过" }, // 查询状态为“已通过”的游记信息
            {
              userId: new ObjectId(userId),
            },
          ],
        },
      },
      {
        // 从文档中选择并返回指定的字段
        $project: {
          userId: 1,
          "travelLog._id": 1,
          "travelLog.title": 1,
          "travelLog.imagesUrl": 1,
          "travelLog.likes": 1,
          "travelLog.videoUrl": 1,
          "travelLog.userId": 1,
          "travelLog.state": 1,
        },
      },
      // { $sample: { size: count } },
    ]);
    // console.log(travelLogs);
    const result = travelLogs
      .filter(t => t.travelLog && t.travelLog.length > 0) // 确保 travelLog 存在
      .sort((a, b) => b.travelLog[0].likes - a.travelLog[0].likes)
      .map((t) => {
        let item = t.travelLog[0];

        let coverImageUrl = null;
        if (item.imagesUrl && item.imagesUrl.length > 0) {
          const firstImage = item.imagesUrl[0];
          if (firstImage && !firstImage.startsWith("http")) {
            coverImageUrl = `${config.baseURL}/${config.logUploadPath}/${firstImage}`;
          } else {
            coverImageUrl = firstImage;
          }
        }

        // --- 处理 videoUrl ---
        let processedVideoUrl = null;
        if (item.videoUrl && item.videoUrl.trim() !== "") {
          if (!item.videoUrl.startsWith("http")) {
            processedVideoUrl = `${config.baseURL}/${config.logUploadPath}/${item.videoUrl}`;
          } else {
            processedVideoUrl = item.videoUrl;
          }
        }
        // --- videoUrl 处理结束 ---

        const newItem = {
          _id: item._id, // travelLog 的 _id
          title: item.title,
          imageUrl: coverImageUrl,
          videoUrl: processedVideoUrl, // 处理后的 videoUrl
          likes: item.likes,
          userId: item.userId, // 这是游记的作者ID
          state: item.state,
          // 如果需要作者的详细信息（如头像、昵称），在 $lookup 后或 $project 前处理关联
        };
        return newItem;
      });
    res
      .status(200)
      .json({ status: "success", message: "get successful", data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "failed",
      message: "获取点赞游记列表失败，请联系管理员",
    }); // 如果出现错误，返回500错误
  }
});

//获取用户收藏的笔记
router.get("/getMyCollectLogs", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const travelLogs = await Collect.aggregate([
      {
        $lookup: {
          from: "travellogs", // travelLogs集合名称
          localField: "travelLogId", // Like集合中的关联字段
          foreignField: "_id", // travelLogs集合中的关联字段
          as: "travelLog", // 存储联结后的用户信息
        },
      },
      {
        $match: {
          $and: [
            { "travelLog.state": "已通过" }, // 查询状态为“已通过”的游记信息
            {
              userId: new ObjectId(userId),
            },
          ],
        },
      },
      {
        // 从文档中选择并返回指定的字段
         $project: {
          userId: 1,
          "travelLog._id": 1,
          "travelLog.title": 1,
          "travelLog.imagesUrl": 1,
          "travelLog.likes": 1,
          "travelLog.videoUrl": 1,
          "travelLog.userId": 1,
          "travelLog.state": 1,
        },
      },
      // { $sample: { size: count } },
    ]);
    // console.log(travelLogs);
    const result = travelLogs
      .filter(t => t.travelLog && t.travelLog.length > 0) // 确保 travelLog 存在
      .sort((a, b) => b.travelLog[0].likes - a.travelLog[0].likes)
      .map((t) => {
        let item = t.travelLog[0];

        let coverImageUrl = null;
        if (item.imagesUrl && item.imagesUrl.length > 0) {
          const firstImage = item.imagesUrl[0];
          if (firstImage && !firstImage.startsWith("http")) {
            coverImageUrl = `${config.baseURL}/${config.logUploadPath}/${firstImage}`;
          } else {
            coverImageUrl = firstImage;
          }
        }

        // --- 处理 videoUrl ---
        let processedVideoUrl = null;
        if (item.videoUrl && item.videoUrl.trim() !== "") {
          if (!item.videoUrl.startsWith("http")) {
            processedVideoUrl = `${config.baseURL}/${config.logUploadPath}/${item.videoUrl}`;
          } else {
            processedVideoUrl = item.videoUrl;
          }
        }
        // --- videoUrl 处理结束 ---

        const newItem = {
          _id: item._id, // 这是 travelLog 的 _id
          title: item.title,
          imageUrl: coverImageUrl,
          videoUrl: processedVideoUrl, // 添加处理后的 videoUrl
          likes: item.likes,
          userId: item.userId, // 这是游记的作者ID
          state: item.state,
          // 如果需要作者的详细信息（如头像、昵称），在 $lookup 后或 $project 前处理关联
        };
        return newItem;
      });
    res
      .status(200)
      .json({ status: "success", message: "get successful", data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "failed",
      message: "获取收藏游记列表失败，请联系管理员",
    }); // 如果出现错误，返回500错误
  }
});

//根据用户id获得他已经通过审核的游记
router.get("/getLogsByUserId/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const selectedFields = {
      _id: 1,
      title: 1,
      imagesUrl: 1,             
      videoUrl: 1,              
      hits: 1,
      userId: 1,
      state: 1,
      createdAt: 1,             
      content: 1,               
      travelMonth: 1,                  
      rate: 1,                  
      destination: 1,           
      topic: 1,                 
    };

    const travelLogs = await TravelLog.find(
      {
        userId: userId, // 根据传入的用户 ID 查询
        state: "已通过",  // 只获取已通过的
      },
      selectedFields
    )
    .populate("userId", "username userAvatar profile") // 可以多获取一些作者信息，如 profile
    .sort({ createdAt: -1 }); // 按创建时间降序排序

    

    const filteredTravelLogs = travelLogs.map((item) => {
      // 处理图片 URL 数组
      const processedImageUrls = item.imagesUrl && Array.isArray(item.imagesUrl)
        ? item.imagesUrl.map(imgName => {
            if (imgName && !imgName.startsWith("http")) {
              return `${config.baseURL}/${config.logUploadPath}/${imgName}`;
            }
            return imgName;
          })
        : []; // 如果 imagesUrl 不存在或是空，则返回空数组

      // 处理视频 URL
      let processedVideoUrl = null;
      if (item.videoUrl && item.videoUrl.trim() !== "") {
        if (!item.videoUrl.startsWith("http")) {
          processedVideoUrl = `${config.baseURL}/${config.logUploadPath}/${item.videoUrl}`;
        } else {
          processedVideoUrl = item.videoUrl;
        }
      }

      let userAvatar = item.userId.userAvatar;
      if (userAvatar && !userAvatar.startsWith("http")) {
        userAvatar = `${config.baseURL}/${config.userAvatarPath}/${userAvatar}`;
      }

      const newItem = {
        _id: item._id,
        title: item.title,
        imagesUrl: processedImageUrls, // 返回处理后的图片 URL 数组
        videoUrl: processedVideoUrl,   // 返回处理后的 videoUrl
        hits: item.hits,
        userId: item.userId._id,         // 作者ID
        username: item.userId.username,  // 作者昵称
        userAvatar: userAvatar,          // 作者头像
        profile: item.userId.profile,    // 作者简介 (如果 populate 了)
        state: item.state,
        createdAt: item.createdAt,
        content: item.content,           // 返回游记内容
        travelMonth: item.travelMonth,
        rate: item.rate,                 // 注意大小写是否与模型一致
        destination: item.destination,
        topic: item.topic,
      };
      return newItem;
    });

    res.status(200).json({
      status: "success",
      message: "获取用户游记成功", // 更新消息
      data: filteredTravelLogs,
    });
  } catch (error) {
    console.error("获取用户游记失败:", error); // 更新日志消息
    res.status(500).json({ status: "error", message: "出错了，请联系管理员" });
  }
});

// 删除游记
router.delete("/deleteLogs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const log = await TravelLog.findByIdAndDelete(id);
    if (!log) {
      return res.status(404).json({ message: "游记不存在" });
    }
    await Manager.deleteOne({ log });
    res.json({ message: "游记删除成功" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "服务器错误" });
  }
});

module.exports = router;
