import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableWithoutFeedback,
  TouchableOpacity,
  TextInput,
  Animated,
  Platform,
  Modal,
  Dimensions,
  Overlay,
} from "react-native";
import { MaterialIcons, Ionicons, AntDesign } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import ImageSlider from "./component/imageSlider";
import { api, getItemFromAS } from "../../util";
import * as Linking from "expo-linking";
import { color } from "@rneui/base";
import { Video } from 'expo-av'; 

const Toast = Overlay.Toast;

const LogDetailPage = ({ route }) => {
  const { item, setCardLikes, setCardLiked } = route.params; // 主页传来的值
  const logId = item._id;
  const userId = item.userId;
  const userAvatar = item.userAvatar;
  // console.log(userAvatar);
  const userName = item.username;

  const navigation = useNavigation();
  const [isFocused, setIsFocused] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [collected, setCollected] = useState(false);
  const [collects, setCollects] = useState(0);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState(0);
  const [likeScaleValue] = useState(new Animated.Value(1));
  const [collectScaleValue] = useState(new Animated.Value(1));
  const [isImageViewerVisible, setImageViewerVisible] = useState(false); // 控制图片放大模态框的显隐
  const [selectedImageUri, setSelectedImageUri] = useState(null);    // 当前要放大的图片的 URI
  // const [userId, setUserId] = useState("");
  // const [userName, setUserName] = useState("");
  // const [userAvatar, setUserAvatar] = useState("");

  const [travelLog, setTravelLog] = useState(null);

  useEffect(() => {
    // console.log("fetching log detail...");
    checkFocus();
    checkLike(); // 当前用户是否点赞过该游记
    checkCollect(); // 当前用户是否收藏过该游记
    const fetchLogDetail = async () => {
      try {
        const response = await api.get(`/logDetail/findLog/${logId}`);
        const data = await response.data;
        // console.log(data);
        setTravelLog({
          ...data,
          recomRate: mapRate(data.rate),
          editTime: formatDate(data.editTime),
        });
        setCollects(data.collects);
        setLikes(data.likes);
        // setUserId(data.userId._id);
        // setUserName(data.userId.username);
        // setUserAvatar(data.userId.userAvatar);
      } catch (error) {
        console.error(error);
      }
    };
    fetchLogDetail();
    // console.log(travelLog);
  }, []);

  


  const mapRate = (rate) => {
    return parseFloat(rate).toFixed(1);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // 检查当前用户是否关注过该用户
  const checkFocus = async () => {
    // console.log(userId, item._id);
    await api
      .get(`/userInfo/checkFocus/${userId}`)
      .then((response) => {
        setIsFocused(response.data.focused);
      })
      .catch((error) => {
        // console.log(error);
      });
  };

  // 检查当前用户是否点赞过该游记
  const checkLike = async () => {
    // console.log(userId, item._id);
    await api
      .get(`/home/checkLike/${item._id}`)
      .then((response) => {
        setLiked(response.data.liked);
      })
      .catch((error) => {
        // console.log(error);
      });
  };

  // 检查当前用户是否收藏过该游记
  const checkCollect = async () => {
    // console.log(userId, item._id);
    await api
      .get(`/home/checkCollect/${item._id}`)
      .then((response) => {
        setCollected(response.data.collected);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  // 查看游记作者个人页面
  const handleUserPress = async () => {
    let user = await getItemFromAS("userInfo");
    user = JSON.parse(user);
    if (user) {
      let user = await getItemFromAS("userInfo");
      user = JSON.parse(user);
      if (user.userId && user.userId == userId) {
        // navigation.goBack();
        navigation.navigate("MyLog");
      } else {
        navigation.navigate("OtherUserLog", { userId: userId });
      }
    } else {
      Toast.show("请先登录~");
    }
  };

  // 关注用户功能
  const handleFocusPress = async () => {
    let user = await getItemFromAS("userInfo");
    user = JSON.parse(user);
    if (user) {
      // console.log(user);
      const response = await api.post("/userInfo/focus", {
        beFollowedId: userId,
      });
      setIsFocused(response.data.focused);
    } else {
      Toast.show("请先登录~");
    }
  };

  // 分享功能
  const handleSharePress = async () => {
    let user = await getItemFromAS("userInfo");
    user = JSON.parse(user);
    if (user) {
      // console.log(user);
      navigation.navigate("ShareToUser", { logId: logId });
    } else {
      Toast.show("请先登录~");
    }
  };

  // 评论功能
  const handleCommentSubmit = () => {
    if (comment) {
      console.log("提交评论:", comment);
      setComment("");
      setComments(comments + 1);
      setModalVisible(false);
    }
  };

  // 当前用户点赞或取消点赞该游记，数据库同步更新
  const handleLike = async () => {
    let user = await getItemFromAS("userInfo");
    user = JSON.parse(user);
    if (user) {
      await api
        .post("/home/like", {
          travelLogId: item._id,
        })
        .then((response) => {
          setLiked(response.data.liked);
          setLikes(response.data.liked ? likes + 1 : likes - 1);
        })
        .catch((error) => {
          // console.log(error);
        });
    } else {
      Toast.show("请先登录~");
    }
  };

  // 当前用户收藏或取消收藏该游记，数据库同步更新
  const handleCollect = async () => {
    let user = await getItemFromAS("userInfo");
    user = JSON.parse(user);
    if (user) {
      await api
        .post("/home/collect", {
          travelLogId: item._id,
        })
        .then((response) => {
          setCollected(response.data.collected);
          setCollects(response.data.collected ? collects + 1 : collects - 1);
        })
        .catch((error) => {
          // console.log(error);
        });
    } else {
      Toast.show("请先登录~");
    }
  };

  // 点赞or收藏按钮的点击效果
  const handleIconPress = (type) => {
    if (type === "like") {
      handleLike();
      Animated.sequence([
        Animated.timing(likeScaleValue, {
          toValue: 1.2,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(likeScaleValue, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (type === "collect") {
      handleCollect();
      Animated.sequence([
        Animated.timing(collectScaleValue, {
          toValue: 1.2,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(collectScaleValue, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  // 文本链接
  const handleLinkPress = (url) => {
    try {
      Linking.openURL(url);
    } catch (error) {
      console.error("Error opening link:", error);
    }
  };

  // 字符匹配
  const matchText = (text) => {
    matches = text.match(/\S+市/g);
    // 输出匹配到的结果
    if (matches) {
      return matches[0];
    } else {
      return null;
    }
  };

  const handleImagePress = (imageUrl) => { // <--- 这是我们要确保被调用的函数
    console.log("LogDetailScreen: handleImagePress CALLED with URL:", imageUrl); // <--- 在这个函数开头加日志
    
      setSelectedImageUri(imageUrl);
      setImageViewerVisible(true);
    
  };

  // --- 新增函数：关闭图片放大模态框 ---
  const handleCloseImageViewer = () => {
    setImageViewerVisible(false);
    setSelectedImageUri(null); // 清空选中的图片
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#E0F2F1" }}>
      {/* 顶部导航栏 */}
      <View style={styles.topScreen}>
        <View style={styles.leftTopScreen}>
          <TouchableOpacity
            onPress={() => {
              setCardLikes && setCardLikes(likes); // 同步游记卡片的点赞量
              setCardLiked && setCardLiked(liked); // 同步游记卡片的点赞状态
              navigation.goBack();
            }}
          >
            <MaterialIcons
              name="arrow-back-ios"
              size={30}
              style={{ marginLeft: 10 }}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.userInfo} onPress={handleUserPress}>
            {/* 根据传过来的用户Id进行查找，跳到对应的id用户界面 */}
            <View style={styles.avatarContainer}>
              <Image source={{ uri: userAvatar }} style={styles.avatar} />
            </View>
            <View style={styles.nickName}>
              <Text style={styles.nameText}>
                {userName ? userName : "空的昵称"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.leftTopScreen}>
          <TouchableOpacity
            style={[styles.subscribe, isFocused && styles.subscribed]}
            onPress={handleFocusPress}
          >
            <Text
              style={[styles.subscribeText, isFocused && styles.subscribedText]}
            >
              {isFocused ? "已关注" : "关注"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSharePress}>
            <MaterialIcons
              name="ios-share"
              size={30}
              style={{ marginRight: 10, color: "#566573" }}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* 中间的滚动视图 */}
      <ScrollView style={{ flex: 1 }}>
      {travelLog && travelLog.imagesUrl && travelLog.imagesUrl.length > 0 && (
        <ImageSlider
          imageUrls={travelLog.imagesUrl}
          // **在这里添加 onPressImage prop，并传递 handleImagePress 函数**
          onPressImage={handleImagePress} // <--- 核心修改！
        />
      )}
    
  {/* **2. 新增：视频播放器 (如果 videoUrl 存在) ** */}
  {travelLog && travelLog.videoUrl && (
    <View style={styles.videoContainer}>
      <Video
        source={{ uri: travelLog.videoUrl }}
        style={styles.videoPlayer}
        useNativeControls // 使用原生播放控件 (推荐)
        resizeMode={Video.RESIZE_MODE_CONTAIN} // 或 RESIZE_MODE_COVER
        // isLooping // 是否循环播放
        // shouldPlay={false} // 是否在加载后立即播放
        onError={(error) => console.error("详情页视频播放错误:", error, "URL:", travelLog.videoUrl)}
      />
    </View>
  )}
  {/* **视频播放器添加结束** */}

        
        
        {travelLog && <Text style={styles.titleText}>{travelLog.title}</Text>}
        <View style={{ justifyContent: "center", alignItems: "center" }}>
          <View style={styles.labelBox}>
            <View style={styles.label}>
              <Text style={styles.labelText}>地点</Text>
              <TouchableOpacity
                onPress={() => {
                  handleLinkPress("https://www.ctrip.com/");
                }}
              >
                {travelLog && (
                  <Text
                    style={[
                      styles.labelData,
                      {
                        color: "#5499C7",
                        textDecorationLine: "underline",
                        paddingBottom: 0,
                      },
                    ]}
                  >
                    {travelLog.destination
                      ? matchText(travelLog.destination)
                      : "XX"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.label}>
              <Text style={styles.labelText}>出行月份</Text>
              {travelLog && (
                <Text style={[styles.labelData, {}]}>
                  {travelLog.travelMonth}
                </Text>
              )}
            </View>
            <View style={[styles.label, { marginRight: 10 }]}>
              <Text style={styles.labelText}>推荐指数</Text>
              {travelLog && (
                <Text style={[styles.labelData, { color: "#F5B041" }]}>
                  {travelLog.recomRate}
                </Text>
              )}
            </View>
          </View>
        </View>
        <View style={{ marginTop: 10 }}>
          {travelLog && (
            <Text style={styles.contentText}>{travelLog.content}</Text>
          )}
        </View>
        <View style={{ marginTop: 10 }}>
          {travelLog && (
            <Text style={styles.editTime}>
              {travelLog.destination
                ? travelLog.destination.split("\n")[0]
                : ""}
            </Text>
          )}
          {travelLog && (
            <Text style={styles.editTime}>{travelLog.editTime}</Text>
          )}
        </View>
        <View
          style={{ height: 1, backgroundColor: "#D1CFCF", marginVertical: 10 }}
        ></View>
        <View>
          <Text style={styles.contentText}>评论区</Text>
        </View>

        

      </ScrollView>

          
      {/* 底部导航栏 */}
      <View style={styles.bottomScreen}>
        <View style={styles.leftBottomScreen}>
          <TouchableOpacity
            style={styles.commentBox}
            onPress={() => setModalVisible(true)}
          >
            <Text style={{ marginLeft: 20, fontSize: 16, color: "#808B96" }}>
              说点什么吧~
            </Text>
          </TouchableOpacity>
        </View>
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(false);
          }}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.commentInput}>
                <TextInput
                  placeholder="请输入评论"
                  value={comment}
                  onChangeText={(text) => setComment(text)}
                  style={styles.input}
                  multiline={true}
                  numberOfLines={4}
                />
              </View>
              <TouchableOpacity
                onPress={handleCommentSubmit}
                style={styles.submitBtn}
              >
                <Text style={{ color: "white", fontSize: 18 }}>发 送</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        
        <View style={styles.rightBottomScreen}>
          <TouchableOpacity onPress={() => handleIconPress("like")}>
            <Animated.View style={[{ transform: [{ scale: likeScaleValue }] }]}>
              <Ionicons
                name={liked ? "heart" : "heart-outline"}
                size={32}
                color={liked ? "red" : "black"}
              ></Ionicons>
            </Animated.View>
          </TouchableOpacity>
          <Text style={{ marginLeft: 5 }}>{likes}</Text>
          <TouchableOpacity
            onPress={() => handleIconPress("collect")}
            style={{ marginLeft: 10 }}
          >
            <Animated.View
              style={[{ transform: [{ scale: collectScaleValue }] }]}
            >
              <AntDesign
                name={collected ? "star" : "staro"}
                size={32}
                color={collected ? "#F5B041" : "black"}
              ></AntDesign>
            </Animated.View>
          </TouchableOpacity>
          <Text style={{ marginLeft: 5 }}>{collects}</Text>
          <TouchableOpacity style={{ marginLeft: 10 }}>
            {/* 点击事件，点击消息icon可以定位到评论区的开头 */}
            <AntDesign name="message1" size={28} />
          </TouchableOpacity>
          <Text style={{ marginLeft: 5 }}>{comments}</Text>
          {/* comments的数量与评论的数量一致 */}
          
        </View>
      </View>
          
      {/* --- 图片放大模态框 --- */}
      <Modal
        visible={isImageViewerVisible} // 由这个状态控制显隐
        transparent={true}
        onRequestClose={handleCloseImageViewer} // Android 返回键
        animationType="fade"
      >
        <TouchableWithoutFeedback onPress={handleCloseImageViewer}> 
          <View style={styles.imageViewerOverlay}> 
            <TouchableWithoutFeedback onPress={() => { }}>
              <Image
                source={{ uri: selectedImageUri }} // 要放大的图片 URI
                style={styles.imageViewerImage}   // 放大图片的样式
                resizeMode="contain"
                onError={(e) => console.error("放大图片加载失败:", selectedImageUri, e.nativeEvent.error)} // 添加错误处理
              />
            </TouchableWithoutFeedback>
            <TouchableOpacity style={styles.closeButton} onPress={handleCloseImageViewer}>
                <MaterialIcons name="close" size={30} color="white" />
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      
    </View>
  );
};

const styles = StyleSheet.create({
  topScreen: {
    height: 60,
    backgroundColor: "#E0F2F1",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 0,
  },
  leftTopScreen: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 50,
    overflow: "hidden",
    borderBottomWidth: 1,
    borderBlockColor: "#D5D8DC",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  nickName: {
    marginLeft: 10,
  },
  nameText: {
    fontSize: 16,
  },
  subscribe: {
    marginRight: 10,
    width: 60,
    height: 30,
    borderWidth: 1,
    borderColor: "#E74C3C",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  subscribed: {
    borderColor: "#D5D8DC",
    width: 70,
  },
  subscribeText: {
    fontSize: 14,
    color: "#E74C3C",
  },
  subscribedText: {
    color: "#566573",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "#E0F2F1",
  },
  modalContent: {
    backgroundColor: "#E0F2F1",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    height: "50%",
  },
  commentInput: {
    width: "100%",
    height: 160,
    backgroundColor: "#F5F7FA",
    borderRadius: 20,
    marginTop: 20,
  },
  input: {
    padding: 10,
    fontSize: 18,
    textAlignVertical: "top",
  },
  submitBtn: {
    width: 80,
    height: 40,
    backgroundColor: "#3498DB",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  leftBottomScreen: {
    marginLeft: 10,
  },
  commentBox: {
    width: 200,
    height: 40,
    backgroundColor: "#F5F7FA",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  rightBottomScreen: {
    marginRight: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    flex: 1,
    height: 800,
  },
  titleText: {
    fontSize: 22,
    marginBottom: 10,
    marginLeft: 10,
    marginRight: 10,
  },
  labelBox: {
    width: "98%",
    height: 80,
    borderRadius: 20,
    backgroundColor: "#EBF5FB",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    width: 100,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
  },
  labelText: {
    fontSize: 16,
    color: "#808B96",
  },
  labelData: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 5,
  },
  contentText: {
    fontSize: 18,
    paddingHorizontal: 10,
    paddingVertical: 5,
    textAlign: "left",
    marginTop: 10,
  },
  editTime: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    textAlign: "left",
    color: "#808B96",
  },
  bottomScreen: {
    height: 60,
    backgroundColor: "#E0F2F1",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  videoContainer: { // 包裹视频播放器的容器
    marginTop: 10, // 与图片轮播的间距
    marginBottom: 10, // 与下方内容的间距
    // backgroundColor: 'black', // 可以给个背景色
  },
  videoPlayer: { // 视频播放器本身的样式
    width: '100%',
    aspectRatio: 16 / 9, // 保持视频的宽高比 (或者固定高度)
    // height: 250, // 示例固定高度
  },
  linkText: { // 用于地点链接的样式
    color: "#5499C7",
    textDecorationLine: "underline",
    paddingBottom: 0, // 您之前有这个
  },
  // --- 图片放大模态框样式 ---
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)', // 更深的背景
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerImage: {
    width: Dimensions.get('window').width * 0.95, // 占据屏幕宽度的95%
    height: Dimensions.get('window').height * 0.8, // 占据屏幕高度的80%
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 30, // 适配状态栏和顶部空间
    right: 15,
    padding: 8, // 增加点击区域
    // backgroundColor: 'rgba(255,255,255,0.1)', // 可选的背景
    // borderRadius: 20,
  },
});

export default LogDetailPage;
