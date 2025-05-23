import React, { useState, useEffect } from "react";
import { Video } from 'expo-av';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  FlatList,
  Image,
  Button,
  Modal,
  Overlay,
  ImageBackground,
  Platform,
  Alert,
} from "react-native";
import {
  Icon,
  Avatar,
  Tab,
  Card,
  TabView,
  Divider,
  BottomSheet,
  ListItem,
  Badge,
} from "@rneui/themed";
import Drawer from "react-native-drawer";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { TouchableWithoutFeedback } from "@ui-kitten/components/devsupport";
import * as FileSystem from "expo-file-system";
import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";
import { useFocusEffect } from "@react-navigation/native";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import {
  api,
  setAuthHeader,
  storeDataToAS,
  removeValueFromAS,
  getItemFromAS,
} from "../../util";
import colors from "../../src/theme/colors";

const Toast = Overlay.Toast;

//侧边菜单栏
const ContentView = ({ onCloseDrawer }) => {
  const navigation = useNavigation();
  return (
    <View style={sideMenuStyles.container}>
      <View
        style={{
          flex: 8,
          justifyContent: "flex-start",
          paddingLeft: 10,
          // backgroundColor: "#EAEDED",
        }}
      >
        <TouchableOpacity
          onPress={() => {
            onCloseDrawer();
            navigation.navigate("AddUser", { type: 0 });
          }}
        >
          <ListItem style={{ backgroundColor: "#E5E7E9" }}>
            <ListItem.Content style={sideMenuStyles.menuItem}>
              <Icon name="person-add-alt"></Icon>
              <ListItem.Title>发现好友</ListItem.Title>
            </ListItem.Content>
          </ListItem>
        </TouchableOpacity>
        <TouchableOpacity>
          <ListItem style={{ backgroundColor: "#E5E7E9" }}>
            <ListItem.Content style={sideMenuStyles.menuItem}>
              <Icon name="history"></Icon>
              <ListItem.Title>浏览记录</ListItem.Title>
            </ListItem.Content>
          </ListItem>
        </TouchableOpacity>
        <TouchableOpacity>
          <ListItem style={{ backgroundColor: "#E5E7E9" }}>
            <ListItem.Content style={sideMenuStyles.menuItem}>
              <Icon name="sim-card"></Icon>
              <ListItem.Title>免流量</ListItem.Title>
            </ListItem.Content>
          </ListItem>
        </TouchableOpacity>
        <Divider />
        <TouchableOpacity>
          <ListItem style={{ backgroundColor: "#E5E7E9" }}>
            <ListItem.Content style={sideMenuStyles.menuItem}>
              <Icon name="eco"></Icon>
              <ListItem.Title>社区公约</ListItem.Title>
            </ListItem.Content>
          </ListItem>
        </TouchableOpacity>
      </View>
      <View
        style={{
          flex: 1,
          flexDirection: "row",
          justifyContent: "space-evenly",
        }}
      >
        <TouchableOpacity
          onPress={() => {
            onCloseDrawer();
            navigation.navigate("Setting");
          }}
        >
          <View>
            <View
              style={{
                borderRadius: 100,
                backgroundColor: "#F8F9F9",
                padding: 5,
              }}
            >
              <Icon name="settings" color={"#2E4053"}></Icon>
            </View>
            <Text style={{ textAlign: "center" }}>设置</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity>
          <View>
            <View
              style={{
                borderRadius: 100,
                backgroundColor: "#F8F9F9",
                padding: 5,
              }}
            >
              <Icon name="headset" color={"#2E4053"}></Icon>
            </View>
            <Text style={{ textAlign: "center" }}>帮助与客服</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity>
          <View>
            <View
              style={{
                borderRadius: 100,
                backgroundColor: "#F8F9F9",
                padding: 5,
              }}
            >
              <Icon name="qr-code-scanner" color={"#2E4053"}></Icon>
            </View>
            <Text style={{ textAlign: "center" }}>扫一扫</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};
//内容为空组件
const EmyptyItem = ({ name, color, label }) => {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignContent: "center",
      }}
    >
      <Icon name={name} size={96} color={color}></Icon>
      <Text
        style={{
          paddingTop: 10,
          textAlign: "center",
          fontFamily: "serif",
          fontSize: 16,
          color: "#ccc",
          fontWeight: "bold",
        }}
      >
        {label}
      </Text>
    </View>
  );
};

// 长按删除事件
const handleDeleteLog = (id, freshData) => {
  console.log(id);
  Alert.alert(
    "删除游记",
    "确定要删除这条游记吗？",
    [
      {
        text: "取消",
        style: "cancel",
      },
      {
        text: "删除",
        onPress: () => {
          try {
            api.delete(`/myLog/deleteLogs/${id}`).then((res) => {
              console.log(res.data);
              Toast.show("删除成功");
            });
            freshData();
          } catch (error) {
            console.error("Error deleting data:", error);
            Toast.show("删除失败");
          }
        },
      },
    ],
    { cancelable: false }
  );
};

const MyLogPage = () => {
  const navigation = useNavigation();
  const [visible, setVisible] = useState(false);
  const [select, setSelect] = useState(true);
  const [userInfo, setUserInfo] = useState({});
  const [imageUrl, setImageUrl] = useState();
  const [userAvatarUrl, setUserAvatarUrl] = useState();
  const [myLogDatas, setMyLogDatas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false); // 上传照片模态框
  const [likeLogDatas, setLikeLogDatas] = useState([]);
  const [collectLogDatas, setCollectDatas] = useState([]);
  const [userId, setUserId] = useState(false);

  //渲染我的游记组件
  const RenderItemMyLog = ({ value, freshMyLogData }) => {
    console.log("RenderItemMyLog - value:", JSON.stringify(value, null, 2)); // 打印 value 确认 videoUrl
    const navigation = useNavigation();
    const [isVideoError, setIsVideoError] = useState(false); // 用于视频加载失败时回退
  
    // 定义点击行为，避免重复代码
    const handleCardPress = () => {
      if (value.state) {
        if (value.state === "已通过") {
          navigation.navigate("LogDetail", { item: value });
        } else if (value.state === "未发布" || value.state === "待审核" || value.state === "未通过") {
          navigation.navigate("LogPublic", { item: value });
        }
      }
    };
  
    const renderMedia = () => {
      // 优先显示视频 (如果 videoUrl 存在且有效，并且没有加载错误)
      if (value.videoUrl && !isVideoError) {
        return (
          <Video
            source={{ uri: value.videoUrl }}
            style={styles.mediaStyle} // 给视频和图片统一的样式
            controls={true} // 显示播放控件
            resizeMode="cover" // 或 "contain"
            paused={true} // 初始不自动播放
            onError={(error) => {
              console.error("视频加载错误 for:", value.videoUrl, error);
              setIsVideoError(true); // 设置错误状态，以便下次渲染时回退到图片
            }}
            // 可以添加 onLoad 事件来处理加载状态
          />
        );
      }
      // 如果没有视频，或者视频加载失败，则显示图片 (如果 imageUrl 存在)
      else if (value.imageUrl) {
        return (
          <Card.Image
            style={styles.mediaStyle} // 统一的样式
            source={{ uri: value.imageUrl }}
            onError={(error) => console.error("图片加载错误 for:", value.imageUrl, error)}
          />
        );
      }
      // 如果既没有视频也没有图片，可以显示一个占位符
      else {
        return (
          <View style={[styles.mediaStyle, styles.placeholderMedia]}>
            <Text>无媒体内容</Text>
          </View>
        );
      }
    };
  
    return (
      <Card containerStyle={{ borderRadius: 10, padding: 0, overflow: 'hidden' }}>
        <TouchableWithoutFeedback
          onPress={handleCardPress}
          onLongPress={() => {
            // 假设 userInfo 是从外部获取的
            // if (userInfo && userInfo.userId === value.userId) {
            //   handleDeleteLog(value._id, freshMyLogData);
            // }
          }}
        >
          {renderMedia()}
        </TouchableWithoutFeedback>
        <View style={styles.infoContainer}>
          <Text style={styles.titleText} numberOfLines={1}>{value.title}</Text>
          <Badge
            // ... 您的 Badge props ...
            status={ (value.state == "已通过" && "success") ||
              (value.state == "待审核" && "primary") ||
              (value.state == "未通过" && "error") ||
              (value.state == "未发布" && "warning") }
            value={value.state}
          />
        </View>
      </Card>
    );
  };

  //渲染点赞和收藏组件
  const RenderItemOtherLog = ({ value, type }) => {
    // console.log(value);
    const navigation = useNavigation();
    return (
      <Card containerStyle={{ borderRadius: 10, padding: 0 }}>
        <Card.Image
          style={{ padding: 0 }}
          source={{
            uri: value.imageUrl,
          }}
          onPress={async () => {
            if (value.state) {
              await api
                .get(`/home/findAuthor/${value._id}`)
                .then((response) => {
                  console.log(response.data);
                  const newItem = {
                    ...response.data,
                    _id: value._id,
                  };
                  navigation.navigate("LogDetail", {
                    item: newItem,
                  });
                })
                .catch((error) => {
                  console.log(error);
                });

              // navigation.navigate("LogDetail", { item: value });
            }
          }}
        />
        <View
          style={{
            flexDirection: "row",
            // justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
            marginTop: 5,
          }}
        >
          <Text
            style={{
              width: "60%",
              alignItems: "center",
              marginLeft: 10,
            }}
          >
            {value.title}
          </Text>
          <Text
            style={{
              width: "40%",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {selectIcon(type)}
              <Text style={{ fontSize: 16, marginLeft: 3 }}>
                {type === "collect" ? value.collects : value.likes}
              </Text>
            </View>
          </Text>
        </View>
      </Card>
    );
  };

  // 收藏和点赞的icon获取
  const selectIcon = (type) => {
    if (type === "collect") {
      return <AntDesign name={"star"} size={24} color={"#F5B041"}></AntDesign>;
    } else if (type === "like") {
      return <Ionicons name={"heart"} size={24} color={"red"} />;
    } else {
      return <></>;
    }
  };

  // 获取游记数据
  const fetchUserLogData = async () => {
    try {
      setLoading(true);
      await setAuthHeader();
      const response = await api.get("/userInfo/info");
      // console.log(response.data.data);
      setUserInfo(response.data.data);
      setImageUrl(response.data.data.backgroundImage);
      setUserAvatarUrl(response.data.data.userAvatar);
      await storeDataToAS("userInfo", JSON.stringify(response.data.data));
      await fetchMyLogDatas("我的笔记", "/myLog/getMyLogs", setMyLogDatas);
      await fetchCollectLogData();
      setLoading(false);
    } catch (e) {
      setLoading(false);
      console.log(e.response.data.message);
    }
  };

  // 获取我的游记
  const fetchMyLogDatas = async (type, server_url, setFunc) => {
    console.log(type);
    try {
      // const params = {
      //   selectedTopic: selectedTopic,
      //   searchContent: searchContent,
      // };
      const response = await api.get(server_url);
      // console.log(response.data.data);
      if (response.data.data) {
        setFunc(response.data.data);
      }
    } catch (error) {
      // 数据加载失败
      console.log("获取失败", error.response.data.message);
    }
  };

  // 获取点赞的游记
  const fetchLikeLogData = async () => {
    try {
      setLoading(true);
      await setAuthHeader();
      const response = await api.get("/userInfo/info");
      // console.log(response.data.data);
      setUserInfo(response.data.data);
      await storeDataToAS("userInfo", JSON.stringify(response.data.data));
      await fetchMyLogDatas(
        "我的点赞",
        "/myLog/getMyLikeLogs",
        setLikeLogDatas
      );
      setLoading(false);
    } catch (e) {
      console.log(e.response.data.message);
    }
  };

  // 获取收藏的游记
  const fetchCollectLogData = async () => {
    try {
      setLoading(true);
      const response = await api.get("/userInfo/info");
      // console.log(response.data.data);
      setUserInfo(response.data.data);
      await storeDataToAS("userInfo", JSON.stringify(response.data.data));
      await fetchMyLogDatas(
        "我的收藏",
        "/myLog/getMyCollectLogs",
        setCollectDatas
      );
      setLoading(false);
    } catch (e) {
      console.log(e.response.data.message);
    }
  };
  //切换tap
  const changeTapIndex = (e) => {
    setIndex(e);
  };

  //获取当前用户信息
  const getUserDataFromAS = async () => {
    try {
      let user = await getItemFromAS("userInfo");
      user = JSON.parse(user);
      if (user) {
        // setUserInfo(user);
        // setImageUrl(user.backgroundImage);
        // setUserAvatarUrl(user.userAvatar);
        setUserId(user.userId);
      } else {
        setUserId("");
        // clearData();
      }
    } catch (e) {
      // error reading value
      console.log(e);
    }
  };
  const clearData = () => {
    setUserInfo();
    setImageUrl("");
    setUserAvatarUrl("");
    setMyLogDatas([]);
    setLikeLogDatas([]);
    setCollectDatas([]);
  };
  useEffect(() => {
    if (userId) {
      console.log("获取用户数据");
      setIndex(0);
      fetchUserLogData();
      fetchLikeLogData();
      fetchCollectLogData();
    } else {
      clearData();
    }
  }, [userId]);

  useFocusEffect(
    React.useCallback(() => {
      // 在页面获取焦点时执行的操作
      //判断当前用户是否已经发生更改或者变化
      getUserDataFromAS();
      // fetchMyLogDatas();
      // console.log("Screen focused");
      return () => {
        // 在页面失去焦点时执行的清理操作（可选）
        // console.log("Screen unfocused");
      };
    }, [])
  );
  const [index, setIndex] = useState(0);
  // console.log(data);
  const showSideMenu = () => {
    setVisible(true);
  };
  const closeSideMenu = () => {
    setVisible(false);
  };
  // 第一次使用图片上传功能时会先授权
  const verifyPermission = async () => {
    const result = await ImagePicker.getCameraPermissionsAsync();
    // console.log(result);
    if (!result.granted) {
      Toast.show("需要相机权限才能使用相机");
      const askPermission = await ImagePicker.requestCameraPermissionsAsync();
      // console.log(askPermission);
      if (!askPermission.granted) {
        Alert.alert(
          "Insufficient Permissions",
          "You need to grant camera permissions to be able to upload your images",
          [{ text: "OK" }]
        );
        return false;
      }
    }
    return true;
  };
  //用户上传头像或者背景图片
  const uploadImage = async (image, server_url, fieldName, setFunc) => {
    const formaDate = new FormData();
    const url = image.assets[0].uri;
    const suffix = url.substring(url.lastIndexOf(".") + 1);
    try {
      // 读取图片的内容
      const data = await FileSystem.readAsStringAsync(url, {
        encoding: FileSystem.EncodingType.Base64,
      });
      // 提交页面数据
      formaDate.append("images", [data, suffix]);
    } catch (error) {
      console.log("Error reading image file:", error);
    }
    // console.log(formaDate);
    //将背景图上传到服务器
    await api
      .post(
        server_url, // 虚拟机不能使用localhost
        {
          images: formaDate,
        }
      )
      .then((res) => {
        console.log("提交成功:", res.data.data.url);
        // 返回服务器中的url
        let newUrl = res.data.data.url;
        setFunc(newUrl);
        let newUserInfo = { ...userInfo, [fieldName]: newUrl };
        // console.log(newUserInfo);
        storeDataToAS("userInfo", JSON.stringify(newUserInfo));
      })
      .catch((err) => {
        console.log("提交失败:", err.response.data.message);
      });
  };

  // 相册图片上传
  const handleUploadImage = async (uploadUrl, setFieldName, setFunc) => {
    const hasPermission = await verifyPermission();
    if (!hasPermission) {
      return;
    }
    // 返回一个promise对象
    const image = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // 允许选择所有类型的媒体
      allowsEditing: true,
      quality: 0.5,
    });
    if (image) {
      await uploadImage(image, uploadUrl, setFieldName, setFunc);
    }
    // 清空imageData
    setModalVisible(false); // 拍照上传后关闭模态框
  };

  // 拍照上传
  const handleTakeImage = async (uploadUrl, setFieldName, setFunc) => {
    const hasPermission = await verifyPermission();
    if (!hasPermission) {
      return;
    }
    // 返回一个promise对象
    const image = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.5,
    });
    if (image) {
      await uploadImage(image, uploadUrl, setFieldName, setFunc);
    }
    // 获取imageData
    setModalVisible(false); // 拍照上传后关闭模态框
  };

  return (
    <>
      {/* 图片上传方式选择模态框 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
        }}
      >
        <TouchableWithoutFeedback
          style={{ flex: 1 }}
          onPress={() => setModalVisible(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "flex-end",
            }}
          >
            <View
              style={{
                height: "20%",
                backgroundColor: "white",
                borderRadius: 10,
                padding: 20,
                marginTop: 20,
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  if (select) {
                    handleTakeImage(
                      "/userInfo/updateBackgroundImage",
                      "backgroundImage",
                      setImageUrl
                    );
                  } else {
                    handleTakeImage(
                      "/userInfo/updateUserAvatar",
                      "userAvatar",
                      setUserAvatarUrl
                    );
                  }
                }}
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 20 }}>拍照</Text>
              </TouchableOpacity>
              <View
                style={{
                  height: 2,
                  width: "100%",
                  backgroundColor: "#D1CFCF",
                  marginVertical: 10,
                }}
              ></View>
              <TouchableOpacity
                onPress={() => {
                  if (select) {
                    handleUploadImage(
                      "/userInfo/updateBackgroundImage",
                      "backgroundImage",
                      setImageUrl
                    );
                  } else {
                    handleUploadImage(
                      "/userInfo/updateUserAvatar",
                      "userAvatar",
                      setUserAvatarUrl
                    );
                  }
                }}
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 20 }}>从相册上传</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      <Drawer
        type="overlay"
        open={visible}
        content={<ContentView onCloseDrawer={closeSideMenu} />}
        tapToClose={true}
        onClose={closeSideMenu}
        openDrawerOffset={0.3} // 20% gap on the right side of drawer
        panCloseMask={0.3}
        closedDrawerOffset={-3}
        styles={drawerStyles}
        tweenHandler={(ratio) => ({
          main: { opacity: (2 - ratio) / 2 },
        })}
      >
        <View style={styles.container}>
          <View style={styles.user_container}>
            <ImageBackground
              source={imageUrl ? { uri: imageUrl } : {}}
              resizeMode="cover"
              style={styles.background_image}
            />
            <View
              style={{
                ...StyleSheet.absoluteFillObject,
                backgroundColor: "rgba(130, 130, 130, 0.5)",
              }}
            />
            <View style={styles.contentBox}>
              <View style={styles.head_container}>
                {/* <Text>导航头</Text> */}
                <TouchableOpacity onPress={showSideMenu}>
                  <Icon name="menu" size={28} color="#FFF" />
                </TouchableOpacity>
                <View style={{ flexDirection: "row" }}>
                  {userInfo && (
                    <TouchableOpacity
                      style={styles.button}
                      onPress={() => {
                        setSelect(true);
                        setModalVisible(true);
                      }}
                    >
                      {/* <Icon name="image" color="#FFF" /> */}
                      <Icon
                        style={{ alignItems: "flex-end" }}
                        name="image"
                        color="#FFF"
                      />
                      <Text
                        style={
                          styles.buttonLabel
                          // selectedValue === value && styles.selectedLabel,
                        }
                      >
                        设置背景
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={{
                      flexDirection: "row",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                    onPress={() => {
                      navigation.navigate("MyMessage");
                    }}
                  >
                    <AntDesign name="mail" size={24} color="#FFF" />
                    <Text style={[styles.buttonLabel, { marginLeft: 3 }]}>
                      我的消息
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.detail_container}>
                {/* <Text>用户信息</Text> */}
                <View
                  style={{
                    flex: 3,
                    // backgroundColor: "chocolate",
                    flexDirection: "row",
                  }}
                >
                  <View
                    style={{
                      flex: 2,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => {
                        setSelect(false);
                        setModalVisible(true);
                      }}
                    >
                      {userAvatarUrl && (
                        <Avatar
                          size={96}
                          rounded
                          source={{
                            uri: userAvatarUrl,
                          }}
                        />
                      )}
                    </TouchableOpacity>
                  </View>

                  <View
                    style={{
                      flex: 3,
                      alignItems: "flex-start",
                      justifyContent: "center",
                    }}
                  >
                    {userInfo ? (
                      <Text
                        style={{
                          fontWeight: "bold",
                          color: "#FFF",
                          fontSize: 20,
                          fontFamily: "serif",
                        }}
                      >
                        {userInfo && userInfo.username}
                      </Text>
                    ) : (
                      <TouchableOpacity
                        onPress={() => {
                          navigation.navigate("Login");
                        }}
                      >
                        <Text
                          style={{
                            fontWeight: "bold",
                            color: "#FFF",
                            fontSize: 20,
                            fontFamily: "serif",
                          }}
                        >
                          游客请登录
                        </Text>
                      </TouchableOpacity>
                    )}
                    <Text
                      style={{
                        color: "#FFF",
                        fontSize: 15,
                        fontFamily: "serif",
                        marginTop: 5,
                      }}
                    >
                      游客号:{userInfo ? userInfo.customId : ""}
                    </Text>
                  </View>
                </View>
                <View style={{ flex: 1, justifyContent: "center" }}>
                  <Text
                    style={{
                      color: "#FFF",
                      paddingLeft: 20,
                      fontFamily: "serif",
                      fontWeight: "bold",
                    }}
                  >
                    {userInfo ? userInfo.profile : "期待与你相遇"}
                  </Text>
                </View>
                <View
                  style={{
                    flex: 2,
                    // backgroundColor: "cornsilk",
                    flexDirection: "row",
                    // justifyContent: "space-evenly",
                    alignContent: "center",
                  }}
                >
                  <View style={{ ...styles.box_center, flex: 1 }}>
                    <TouchableOpacity
                      onPress={() => {
                        navigation.navigate("AddUser", { type: 1 });
                      }}
                    >
                      <Text style={styles.text_center}>
                        {userInfo ? userInfo.follow : 0}
                      </Text>
                      <Text style={styles.text_center}>关注</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ ...styles.box_center, flex: 1 }}>
                    <TouchableOpacity
                      onPress={() => {
                        navigation.navigate("AddUser", { type: 2 });
                      }}
                    >
                      <Text style={styles.text_center}>
                        {userInfo ? userInfo.fans : 0}
                      </Text>
                      <Text style={styles.text_center}>粉丝</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ ...styles.box_center, flex: 2 }}>
                    <TouchableOpacity>
                      <Text style={styles.text_center}>0</Text>
                      <Text style={styles.text_center}>获赞与收藏</Text>
                    </TouchableOpacity>
                  </View>
                  <View
                    style={{
                      alignItems: "center",
                      textAlign: "center",
                      flexDirection: "row",
                      justifyContent: "flex-end",

                      flex: 3,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => {
                        navigation.navigate("UserInfo");
                      }}
                      style={styles.button}
                    >
                      {/* <Icon name="image" color="#FFF" /> */}
                      <Icon
                        style={{ alignItems: "flex-end" }}
                        name="person"
                        color="#FFF"
                      />
                      <Text
                        style={
                          styles.buttonLabel
                          // selectedValue === value && styles.selectedLabel,
                        }
                      >
                        编辑资料
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        navigation.navigate("Setting");
                      }}
                      style={styles.button}
                    >
                      {/* <Icon name="image" color="#FFF" /> */}
                      <Icon
                        style={{ alignItems: "flex-end" }}
                        name="settings"
                        color="#FFF"
                      />
                    </TouchableOpacity>
                  </View>
                  {/* <View style={{ ...styles.box_center, flex: 1 }}></View> */}
                </View>
              </View>
            </View>
            {/* </ImageBackground> */}
          </View>
          <View style={styles.content_container}>
            <View style={styles.log_container}>
              <Tab
                value={index}
                onChange={(e) => setIndex(e)}
                indicatorStyle={{
                  // position: "sticky",
                  backgroundColor: "#43A49B",
                  height: 3,
                }}
                titleStyle={{
                  color: "black",
                }}
                variant="default"
                dense
              >
                <Tab.Item>笔记</Tab.Item>
                <Tab.Item>收藏</Tab.Item>
                <Tab.Item>赞过</Tab.Item>
              </Tab>
              <TabView
                value={index}
                onChange={(e) => changeTapIndex(e)}
                animationType="spring"
              >
                <TabView.Item style={{ width: "100%" }}>
                  {myLogDatas && myLogDatas.length > 0 ? (
                    <FlatList
                      refreshing={loading}
                      onRefresh={fetchUserLogData}
                      showsVerticalScrollIndicator={false}
                      data={myLogDatas}
                      numColumns={2}
                      renderItem={({ item, index }) => (
                        <View style={{ width: "50%" }} key={index}>
                          <RenderItemMyLog
                            value={item}
                            freshMyLogData={fetchUserLogData}
                          />
                        </View>
                      )}
                    ></FlatList>
                  ) : (
                    <ScrollView
                      style={styles.emyptyItemContainer}
                      refreshControl={
                        <RefreshControl
                          refreshing={loading}
                          onRefresh={fetchUserLogData}
                        />
                      }
                    >
                      <EmyptyItem
                        name="edit-calendar"
                        color="lightgray"
                        label="笔记"
                      ></EmyptyItem>
                    </ScrollView>
                  )}
                </TabView.Item>
                <TabView.Item style={{ width: "100%" }}>
                  {collectLogDatas && collectLogDatas.length > 0 ? (
                    <FlatList
                      refreshing={loading}
                      onRefresh={fetchCollectLogData}
                      showsVerticalScrollIndicator={false}
                      data={collectLogDatas}
                      numColumns={2}
                      renderItem={({ item, index }) => (
                        <View style={{ width: "50%" }} key={index}>
                          <RenderItemOtherLog value={item} type={"collect"} />
                        </View>
                      )}
                    ></FlatList>
                  ) : (
                    <ScrollView
                      style={styles.emyptyItemContainer}
                      refreshControl={
                        <RefreshControl
                          refreshing={loading}
                          onRefresh={fetchCollectLogData}
                        />
                      }
                    >
                      <EmyptyItem
                        name="collections"
                        color="lightgray"
                        label="藏心一刻"
                      />
                    </ScrollView>
                  )}
                </TabView.Item>
                <TabView.Item style={{ width: "100%" }}>
                  {likeLogDatas && likeLogDatas.length > 0 ? (
                    <FlatList
                      refreshing={loading}
                      onRefresh={fetchLikeLogData}
                      showsVerticalScrollIndicator={false}
                      data={likeLogDatas}
                      numColumns={2}
                      renderItem={({ item, index }) => (
                        <View style={{ width: "50%" }} key={index}>
                          <RenderItemOtherLog value={item} type={"like"} />
                        </View>
                      )}
                    ></FlatList>
                  ) : (
                    <ScrollView
                      style={styles.emyptyItemContainer}
                      refreshControl={
                        <RefreshControl
                          refreshing={loading}
                          onRefresh={fetchLikeLogData}
                        />
                      }
                    >
                      <EmyptyItem
                        name="favorite-border"
                        color="lavenderblush"
                        label="心动一瞬"
                      />
                    </ScrollView>
                  )}
                </TabView.Item>
              </TabView>
            </View>
          </View>
        </View>
      </Drawer>
    </>
  );
};
export default MyLogPage;

const styles = StyleSheet.create({
container: {
flex: 1,
margin: 0,
padding: 0,
backgroundColor: colors.background,
},
head_container: {
position: "sticky",
flex: 2,
flexDirection: "row",
alignItems: "flex-end",
justifyContent: "space-between",
paddingLeft: 10,
paddingRight: 10,
paddingBottom: 5,
paddingTop: 5,
// backgroundColor: "skyblue",
margin: 0,
padding: 0,
},
button: {
flexDirection: "row",
justifyContent: "center",
alignItems: "center",
borderRadius: 20,
// backgroundColor: "azure",
// borderWidth: 2, // 边框宽度
// borderColor: "gray", // 边框颜色
// borderStyle: "solid", // 边框样式（实线）
// padding: 5,
marginHorizontal: "1%",
minWidth: "10%",
marginRight: 10,
width: "auto",
// maxWidth: "80%",
height: "50%",
// textAlign: "center",
},
buttonLabel: {
fontSize: 12,
fontWeight: "500",
textAlign: "center",
color: "white",
},
content_container: {
flex: 12,
margin: 0,
padding: 0,
},
background_image: {
width: "100%",
height: "100%",
backgroundColor: "#828282",
},
contentBox: {
position: "absolute",
top: 20,
width: "100%",
height: "90%",
},
user_container: {
flex: 8,
margin: 0,
padding: 0,
},
detail_container: {
flex: 6,
// height: "25%",
// backgroundColor: "honeydew",
margin: 0,
padding: 0,
},
box_center: {
justifyContent: "center",
textAlign: "center",
},
log_container: {
flex: 12,
// height: "66%",
backgroundColor: colors.background,
margin: 0,
padding: 0,
},
text_center: {
textAlign: "center",
fontFamily: "serif",
color: "#FFF",
},
emyptyItemContainer: {
// width: "100%",
// backgroundColor: "red",
marginTop: 30,
},
mediaStyle: {
width: '100%',
aspectRatio: 16 / 14, // 或者一个固定的高度，例如 height: 200
// padding: 0, // Card.Image 可能不需要这个
},
placeholderMedia: {
backgroundColor: '#f0f0f0',
justifyContent: 'center',
alignItems: 'center',
},
infoContainer: {
flexDirection: "row",
justifyContent: "space-between", // 让标题和状态徽章分布在两端
alignItems: "center",
paddingHorizontal: 10, // 左右内边距
paddingVertical: 8,    // 上下内边距
},
titleText: {
flex: 1, // 让标题占据可用空间
marginRight: 8, // 与徽章的间距
fontSize: 16, // 调整字体大小
fontWeight: 'bold',
},
});
const drawerStyles = {
drawer: { shadowColor: "#000000", shadowOpacity: 0.8, shadowRadius: 3 },
main: { paddingLeft: 3 },
};
const sideMenuStyles = {
container: {
flex: 1,
backgroundColor: "#FFF",
paddingTop: 100,
},
menuItem: {
// width: "50%",
paddingRight: 10,
textAlign: "center",
alignItems: "center",
justifyContent: "flex-start",
flexDirection: "row",
// backgroundColor: "red",
},
};
