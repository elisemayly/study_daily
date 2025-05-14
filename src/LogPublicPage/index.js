import "rn-overlay";
import { Dimensions, Overlay, ScrollView } from "react-native";
import { Dialog } from "@rneui/themed";
import React, { useState, useEffect } from "react";
import { getItemFromAS } from '../../util';
import colors from "../theme/colors"; 
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Image,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
  Pressable,
} from "react-native";
import { Button } from "@rneui/themed";
import { MaterialIcons, Ionicons, AntDesign } from "@expo/vector-icons";
import MonthPicker from "./component/monthPicker";
import RangeButtonGroup from "./component/rangeButtonGroup";
import StarRating from "./component/starRating";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import * as Location from "expo-location";
import { TouchableWithoutFeedback } from "@ui-kitten/components/devsupport";
import { api } from "../../util";
import { WebView } from "react-native-webview";
import { useFocusEffect } from "@react-navigation/native";
const config = require("../../config.json");

const Toast = Overlay.Toast;
const screenHeight = Dimensions.get("window").height;
const screenWidth = Dimensions.get("window").width;
// console.log(screenHeight);

const LogPublicPage = ({ route }) => {
  console.log(route.params);
  let logId = null;
  if (route.params) {
    const { item } = route.params;
    logId = item._id;
  }
  console.log(logId);

  const navigation = useNavigation();
  const [title, setTitle] = useState("");
  const maxTitleLength = 20;
  const [isLoading, setIsLoading] = useState(false);

  const [vioLabelVisible, setVioLabelVisible] = useState(false);
  const [showInstruction, setShowInstruction] = useState(false);
  const [instruction, setInstruction] = useState(""); // 拒绝理由

  const [loadState, setLoadState] = useState(true); // 加载状态

  const [content, setContent] = useState(""); // 正文状态

  const [modalVisible, setModalVisible] = useState(false); // 上传照片模态框

  const [selectedMedia, setSelectedMedia] = useState([]);
  const [imageUrl, setImageUrl] = useState([]);
  const [imageData, setImageData] = useState([]);

  const [imageVisible, setImageVisible] = useState(false); // 图片预览模态框
  const [selectedImage, setSelectedImage] = useState(null);

  const [isModalVisible, setIsModalVisible] = useState(false); // 正文模态框
  const [labelModal, setLabelModal] = useState(false); // 标签模态框
  const [labelText, setLabelText] = useState("主题"); // 主题标签
  const labelThemes = config.topic;

  const [destinationModal, setDestinationModal] = useState(false); // 地点模态框
  const [destinationText, setDestinationText] = useState(null); // 目的地
  const destinationThemes = config.destination;

  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedRange, setSelectedRange] = useState(null);
  const [mapRegion, setmapRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const ranges = ["0—500", "500—1000", "1000—2000", "2000以上"];
  const [rating, setRating] = useState(1);

  // 数据回显
  const formaDate = new FormData();

  // 分中英文计算字符长度
  const calculateLength = (str) => {
    let length = 0;
    for (let i = 0; i < str.length; i++) {
      // 检查是否是中文字符，如果是，则计数+2，否则+1
      const charCode = str.charCodeAt(i);
      if (charCode >= 0x4e00 && charCode <= 0x9fff) {
        length += 1; // 中文字符
      } else {
        length += 0.5; // 英文字符
      }
    }
    return length;
  };

  // 处理标题输入框的变化,限制标题的文本长度
  const handleChangeTitle = (title) => {
    const length = calculateLength(title);
    if (length <= maxTitleLength) {
      setTitle(title);
    } else {
      Toast.show(`标题长度不能超过${maxTitleLength}个字符`);
    }
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

  const handleOpenModal = () => {
    // 分开计算图片和视频数量
    const imageCount = selectedMedia.filter(m => m.type === 'image').length;
    const videoCount = selectedMedia.filter(m => m.type === 'video').length;

    // 如果图片和视频都已达到上限，则不打开模态框 (或者在模态框内禁用对应选项)
    if (imageCount >= 6 && videoCount >= 1) {
      Toast.show("已达到媒体数量上限（最多6图1视频）");
      return;
    }
    setModalVisible(true);
    // 可以在 setModalVisible(true) 的回调或 useEffect 中，根据数量禁用模态框内的按钮
  };

  // **重写**: 从相册选择图片 (支持多选)
  const handleUploadImage = async () => {
    setModalVisible(false); // 先关闭模态框
    const currentImageCount = selectedMedia.filter(m => m.type === 'image').length;
    if (currentImageCount >= 6) {
      Toast.show("最多只能上传6张图片哦~");
      return;
    }

    const hasPermission = await verifyPermission(); // 检查相册权限
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // 明确只选图片
        allowsMultipleSelection: true, // 允许多选图片
        quality: 0.7,
        // selectionLimit: 6 - currentImageCount, // 尝试限制可选数量 (并非所有平台/版本都支持)
      });

      if (!result.canceled && result.assets) {
        const canAddCount = 6 - currentImageCount;
        const newImages = result.assets
          .slice(0, canAddCount) // 截取不超过上限的部分
          .map(asset => {
            const fileName = asset.fileName || asset.uri.split('/').pop();
            return {
              uri: asset.uri,
              type: 'image', // 标记为图片
              name: fileName,
              fileType: asset.mimeType || `image/${fileName.split('.').pop().toLowerCase()}`, // 获取或猜测MIME类型
            };
          });

        setSelectedMedia(prevMedia => [...prevMedia, ...newImages]);

        if (result.assets.length > canAddCount) {
          Toast.show(`已达到6张图片上限，部分图片未添加`);
        }
      }
    } catch (error) {
      console.log("选择图片出错:", error);
      Toast.show("选择图片失败");
    }
    // **移除** Base64 读取和旧状态更新逻辑
  };

  // **重写**: 拍照上传图片
  const handleTakeImage = async () => {
    setModalVisible(false);
    const currentImageCount = selectedMedia.filter(m => m.type === 'image').length;
    if (currentImageCount >= 6) {
      Toast.show("最多只能上传6张图片哦~");
      return;
    }

    

    const hasPermission = await verifyPermission(); // 检查相机权限
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true, // 拍照后通常允许简单编辑
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileName = asset.fileName || asset.uri.split('/').pop();
        const newImage = {
          uri: asset.uri,
          type: 'image',
          name: fileName,
          fileType: asset.mimeType || `image/${fileName.split('.').pop().toLowerCase()}`,
        };
        setSelectedMedia(prevMedia => [...prevMedia, newImage]);
      }
    } catch (error) {
      console.log("拍照出错:", error);
      Toast.show("拍照失败");
    }
    // **移除** Base64 读取和旧状态更新逻辑
  };

  // **新增**: 从相册选择视频
  const handleSelectVideo = async () => {
    setModalVisible(false);
    const videoExists = selectedMedia.some(m => m.type === 'video');
    if (videoExists) {
      Toast.show("最多只能上传1个视频哦~");
      return;
    }

    const hasPermission = await verifyPermission(); // 检查相册权限
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos, // 只选视频
        // allowsEditing: true, // 根据需要决定是否允许编辑
        quality: 0.8, // 视频质量 (范围 0-1)
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileName = asset.fileName || asset.uri.split('/').pop();
        const newVideo = {
          uri: asset.uri,
          type: 'video', // 标记为视频
          name: fileName,
          fileType: asset.mimeType || `video/${fileName.split('.').pop().toLowerCase()}`, // 获取视频 MIME 类型
          // duration: asset.duration // 可选：保存时长
        };
        setSelectedMedia(prevMedia => [...prevMedia, newVideo]);
      }
    } catch (error) {
      console.log("选择视频出错:", error);
      Toast.show("选择视频失败");
    }
  };

  const handleImagePress = (mediaItem) => {
    // 如果只想放大图片
    if (mediaItem.type === 'image') {
       // 假设 setSelectedImage 和 setImageVisible 用于图片放大模态框
       setSelectedImage(mediaItem.uri); // 传递 URI
       setImageVisible(true);
    } else {
        // 可以选择在这里处理视频点击事件，例如播放视频
        console.log("视频被点击:", mediaItem.uri);
        // 或者不处理
    }
  };

  const handleDeleteMedia = (mediaUriToDelete) => {
    const itemToDelete = selectedMedia.find(item => item.uri === mediaUriToDelete);
    if (!itemToDelete) return; // 防御性检查

    const mediaType = itemToDelete.type === 'image' ? '图片' : '视频';

    Alert.alert(
      `删除${mediaType}`,
      `确定要删除这个${mediaType}吗？`,
      [
        {
          text: "取消",
          style: "cancel",
        },
        {
          text: "删除",
          onPress: () => {
            setSelectedMedia(prevMedia => prevMedia.filter(item => item.uri !== mediaUriToDelete));
          },
          style: "destructive", // 标记为破坏性操作
        },
      ],
      { cancelable: true } // 允许点击外部取消
    );
  
  };

  // 获取文本框中的值
  const handleInputContent = (text) => {
    setContent(text);
  };

  // 处理添加标签的逻辑
  const handleAddLabel = () => {
    setLabelModal(true);
  };

  // 选择标签
  const handleLabelPress = (label) => {
    setLabelText(label);
    setLabelModal(false);
  };

  // 处理添加地点的逻辑
  const handleAddDestination = () => {
    if (destinationText) {
      navigation.navigate("AddLocation", {
        value: destinationText,
        setFunc: setDestinationText,
      });
    } else {
      navigation.navigate("AddLocation", { setFunc: setDestinationText });
    }
  };

  // 选择地点
  const handleDestinationPress = (label) => {
    setDestinationText(label);
    setDestinationModal(false);
  };

  // 月份选择框
  const handleSelectMonth = (month) => {
    setSelectedMonth(month);
  };


  // 点击星星事件
  const handleClickStar = (index) => {
    setRating(index + 1); // 评级分数1~5
  };

  const clearData = () => {
    setImageUrl([]);
    setContent("");
    setRating(1);
    setTitle("");
    setSelectedMonth("");
    setSelectedRange("");
    setLabelText("主题");
    setLoadState(true);
    setVioLabelVisible(false);
    setDestinationText("");
  };
  const fetchLogDetail = async () => {
    try {
      const response = await api.get(`/logDetail/findLog/${logId}`);
      const data = await response.data;
      // console.log(data);
      setLoadState(true);
      if (data.state === "未通过") {
        setVioLabelVisible(true);
        setInstruction(data.instruction);
      }
      setImageUrl(data.imagesUrl);
      setContent(data.content);
      setRating(data.rate);
      setTitle(data.title);
      setSelectedMonth(data.travelMonth);
      setSelectedRange(data.perCost);
      setLabelText(data.topic);
      setDestinationText(data.destination);
      
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    if (logId) {
      setLoadState(false);
      fetchLogDetail();
    } else {
      setLoadState(false);
      clearData();
    }
  }, [logId]);
  

  const handleAddToDraft = async () => {
    if (imageUrl.length === 0) {
      Toast.show("没有内容需要保存哦~", { duration: 2000 });
      return;
    }

    formaDate.append("images", imageData);
    // console.log(formaDate);
    const httpUrls = imageUrl
      .filter((url) => url.startsWith("http"))
      .map((url) => url.match(/\/([^/]+\.[a-zA-Z0-9]+)$/)[1]);
    console.log(httpUrls);
    await api
      .post(
        "/logPublic/upload", // 虚拟机不能使用localhost
        {
          travelId: logId,
          images: formaDate,
          httpUrls: httpUrls,
          title: title,
          content: content,
          topic: labelText,
          travelMonth: selectedMonth,
          rate: rating,
          destination: destinationText,
          state: "未发布",
        }
      )
      .then((res) => {
        console.log("提交成功:", res.data.message);
        // clearData();
        // 提交成功后跳转到我的游记页面，并刷新
        navigation.navigate("MyLog");
        Toast.show("草稿保存成功~", { duration: 2000 });
      })
      .catch((err) => {
        console.log("提交失败:", err);
      });
  };

const handleSubmitData = async () => {
  // 1. 检查新状态和基本字段 (例如 title, content 等，确保它们已在组件状态中定义并获取)
  if (selectedMedia.length === 0 || !title || !content) {
    Toast.show("请至少上传一张图片或一个视频，并填写标题和内容~");
    return; // 如果不满足条件，提前退出
  }

  setIsLoading(true); // **正确位置**: 在所有检查通过后，准备发送请求前，设置加载状态

  // 2. 创建 FormData 对象
  const formData = new FormData();

  // 3. 附加媒体文件
  selectedMedia.forEach((item) => {
    // 准备文件对象给 FormData
    const file = {
      uri: item.uri,
      name: item.name,       // 确保 item.name 是有效的文件名
      type: item.fileType,   // 确保 item.fileType 是正确的 MIME 类型
    };

    // 根据类型使用不同的字段名附加到 FormData
    if (item.type === 'image') {
      formData.append('images', file); // 对应后端 multer 配置的 'images'
    } else if (item.type === 'video') {
      formData.append('video', file);  // 对应后端 multer 配置的 'video'
    }
  });

  // 4. 附加其他文本字段
  // 确保 title, content, logId (如果存在), selectedMonth 等状态变量已正确获取
  formData.append('title', title);
  formData.append('content', content);
  if (logId) { // 如果是编辑模式，则传递 travelId
    formData.append('travelId', logId);
  }
  formData.append('state', '待审核'); // 或其他状态
  formData.append('travelMonth', selectedMonth || '');
  formData.append('percost', selectedRange || '');
  formData.append('rate', rating ? rating.toString() : '0');
  formData.append('destination', destinationText || '');
  formData.append('topic', labelText || '');

  
try {
  // **使用 fetch API**
  const response = await fetch(`${config.baseURL}/logPublic/upload`, { // 确保 baseURL 和路径正确
    method: 'POST',
    body: formData, // 直接传递 FormData 对象
    headers: {
      
      'Authorization': `${await getItemFromAS("token")}`, 
    },
  });

  // 检查响应状态
  if (!response.ok) {
    // 如果 HTTP 状态码不是 2xx，则抛出错误，由 catch 处理
    const errorData = await response.text(); // 尝试获取文本错误信息
    console.error("Fetch 错误 - 状态:", response.status, "响应体:", errorData);
    throw new Error(errorData || `HTTP error! status: ${response.status}`);
  }

  const responseData = await response.json(); // 假设后端成功时返回 JSON

  // 6. 处理成功响应
  console.log("提交成功:", responseData);
  Toast.show(responseData.message || "发布成功！");

  // ... (清空状态并导航，保持不变)
  setSelectedMedia([]);
  setTitle('');
  // ...

  navigation.navigate("MyLog");

} catch (err) {
  // 8. 处理错误响应
  console.error("提交失败 - 错误对象:", err);
  // 对于 fetch，网络错误通常直接抛出 TypeError，而 HTTP 错误是我们自己抛出的
  // 这里需要统一错误信息格式
  const errorMessage = err.message || "提交失败，请检查网络或稍后重试";
  Toast.show(errorMessage);
} finally {
  setIsLoading(false);
}
};

  return (
    <View style={{ flex: 1 }}>
      {/* 解决安卓平台唤出键盘，页面上挤的问题 */}
      {loadState ? (
        <View style={{ flex: 1 }}>
          {/* <ScrollView> */}
          <View style={styles.container}>
            {/* 顶部放导航栏的地方 */}
            <View style={styles.topBottom}>
              <TouchableOpacity
                onPress={() => {
                  navigation.goBack();
                }}
              >
                <MaterialIcons name="chevron-left" size={36} color="#989797" />
              </TouchableOpacity>
              {vioLabelVisible && (
                // <View style={styles.violationTag}>
                <TouchableWithoutFeedback
                  style={styles.violationTag}
                  onPress={() => setShowInstruction(!showInstruction)}
                >
                  <Text style={styles.violationText}>该内容涉嫌违规</Text>
                  <AntDesign
                    name={showInstruction ? "up" : "down"}
                    size={16}
                    style={{ marginLeft: 5, color: "white" }}
                  />
                </TouchableWithoutFeedback>
                // </View>
              )}
            </View>
            {/* 中间放拒绝理由，点击叉叉可关闭 */}
            {showInstruction && (
              <View>
                <Text style={{ fontSize: 16, color: "#C0392B" }}>
                  拒绝理由：{instruction}
                </Text>
              </View>
            )}

             {/* 第一块布局放图片/视频和添加按钮 */}
             <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaScrollView}>
              <View style={styles.mediaListContainer}>
                {/* 遍历新的 selectedMedia 状态 */}
                {selectedMedia.map((item) => (
                  <TouchableWithoutFeedback
                    key={item.uri} // 使用唯一的 uri 作为 key
                    onPress={() => {
                        if (item.type === 'image') { // 只有图片可以预览放大
                           handleImagePress(item.uri); // 假设 handleImagePress 接收 URI
                        }
                        // 可以为视频添加其他点击行为，如果需要
                    }}
                    onLongPress={() => handleDeleteMedia(item.uri)} // 长按删除
                  >
                    <View style={styles.mediaItem}>
                      <Image
                        style={styles.thumbnail}
                        source={{ uri: item.uri }}
                        onError={(e) => console.log(`图片加载失败: ${item.uri}`, e.nativeEvent.error)} // 添加错误处理
                      />
                      {/* 如果是视频，叠加播放图标 */}
                      {item.type === 'video' && (
                        <View style={styles.playIconOverlay}>
                          <MaterialIcons name="play-circle-outline" size={30} color="white" />
                          {/* 这里确保没有额外的文本 */}
                        </View>
                      )}
                      {/* 这里确保没有额外的文本 */}
                    </View>
                  </TouchableWithoutFeedback>
                ))}

                {/* 添加媒体按钮 - 条件渲染 */}
                {(() => {
                  const imageCount = selectedMedia.filter(m => m.type === 'image').length;
                  const videoCount = selectedMedia.filter(m => m.type === 'video').length;
                  // 当图片小于6张 或 视频数为0时，显示添加按钮
                  if (imageCount < 6 || videoCount < 1) {
                    return (
                      // 使用 TouchableOpacity 实现，便于样式统一
                      <TouchableOpacity
                        style={styles.addMediaButton} // 新的样式
                        onPress={handleOpenModal}
                      >
                        <MaterialIcons name="add" size={30} color="#888" />
                         {/* 这里确保没有额外的文本 */}
                      </TouchableOpacity>
                      
                    );
                  }
                  return null; // 达到上限则不渲染按钮
                })()}
                 {/* 这里确保没有额外的文本 */}
              </View>
            </ScrollView>

            {/* 图片放大预览模态框 (保持您原来的逻辑) */}
            <Modal
              visible={imageVisible}
              transparent={true} // 通常预览是黑色背景，不需要 transparent
              onRequestClose={() => setImageVisible(false)}
            >
              {/* 点击背景关闭 */}
              <Pressable style={styles.previewModalOverlay} onPress={() => setImageVisible(false)}>
                 <Image
                    source={{ uri: selectedImage }}
                    style={styles.previewImage}
                    resizeMode="contain"
                 />
              </Pressable>
            </Modal>

            {/* 媒体类型选择模态框 (底部弹出) */}
            <Modal
              animationType="slide"
              transparent={true}
              visible={modalVisible}
              onRequestClose={() => setModalVisible(false)}
            >
              <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
                <View style={styles.modalContentContainer}>
                  {/* 拍照选项 */}
                  <TouchableOpacity
                    onPress={handleTakeImage}
                    style={styles.modalOption}
                    disabled={selectedMedia.filter(m => m.type === 'image').length >= 6}
                  >
                    <Text style={[
                      styles.modalOptionText,
                      selectedMedia.filter(m => m.type === 'image').length >= 6 && styles.modalOptionDisabledText
                    ]}>拍照</Text>
                  </TouchableOpacity>

                  <View style={styles.modalSeparator}></View>

                  {/* 从相册选择图片选项 */}
                  <TouchableOpacity
                    onPress={handleUploadImage}
                    style={styles.modalOption}
                    disabled={selectedMedia.filter(m => m.type === 'image').length >= 6}
                  >
                    <Text style={[
                      styles.modalOptionText,
                      selectedMedia.filter(m => m.type === 'image').length >= 6 && styles.modalOptionDisabledText
                    ]}>从相册选择图片</Text>
                  </TouchableOpacity>

                  <View style={styles.modalSeparator}></View>

                  {/* 从相册选择视频选项 */}
                  <TouchableOpacity
                    onPress={handleSelectVideo}
                    style={styles.modalOption}
                    disabled={selectedMedia.some(m => m.type === 'video')}
                  >
                    <Text style={[
                      styles.modalOptionText,
                      selectedMedia.some(m => m.type === 'video') && styles.modalOptionDisabledText
                    ]}>从相册选择视频</Text>
                  </TouchableOpacity>

                  {/* 取消按钮 */}
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    style={[styles.modalOption, { marginTop: 10 }]} // 加一点上边距
                  >
                    <Text style={[styles.modalOptionText, { color: 'red' }]}>取消</Text>
                  </TouchableOpacity>
                </View>
              </Pressable>
            </Modal>
            {/* 标题栏 */}
            <View style={styles.two}>
              <TextInput
                value={title}
                onChangeText={handleChangeTitle}
                style={styles.titleInput}
                multiline={false} // 不允许多行输入
                placeholder="拾一句山中词，为旅途冠名"
                keyboardShouldPersistTaps="handled"
              />
              {title.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setTitle("");
                  }}
                >
                  <MaterialIcons name="cancel" size={24} color="#989797" />
                </TouchableOpacity>
              )}
              <Text style={styles.maxTitle}>
                {Math.round(maxTitleLength - calculateLength(title))}
              </Text>
            </View>
            <View style={styles.line}></View>
            {/* 正文栏 */}
            <View style={styles.three}>
              <TextInput
                style={styles.contentInput}
                multiline={true} // 允许多行输入
                numberOfLines={4}
                textAlignVertical="top" // 设置文本垂直对齐方式为顶部
                placeholder="山水有语,托你传声"
                onChangeText={handleInputContent}
                value={content}
              />
              <View style={styles.bottomContent}>
                <TouchableOpacity
                  style={styles.addLabel}
                  onPress={handleAddLabel}
                >
                  <Text style={styles.addLabelText}># {labelText}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setIsModalVisible(true);
                  }}
                >
                  <MaterialIcons
                    name="keyboard-arrow-up"
                    size={24}
                    color="black"
                  />
                </TouchableOpacity>
              </View>
            </View>
            {/* 标签模态框 */}
            <Modal
              visible={labelModal}
              animationType="slide"
              onRequestClose={() => {
                setLabelModal(false);
              }}
            >
              <TouchableWithoutFeedback
                style={{ flex: 1 }}
                onPress={() => setLabelModal(false)}
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
                      height: "70%",
                      backgroundColor: "#E0F2F1",
                      borderRadius: 10,
                      padding: 20,
                      marginTop: 15,
                    }}
                  >
                    <View
                      style={{
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: 20, fontWeight: "bold" }}>
                        添加标签
                      </Text>
                    </View>
                    <View style={{ marginTop: 20 }}>
                      {labelThemes.map((labelTheme, index) => (
                        <View key={index} style={{ justifyContent: "center" }}>
                          <TouchableOpacity
                            onPress={() => {
                              handleLabelPress(labelTheme);
                            }}
                          >
                            <Text style={{ fontSize: 18, marginTop: 10 }}>
                              # {labelTheme}
                            </Text>
                          </TouchableOpacity>
                          <View style={styles.line}></View>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </Modal>
            {/* 目的地模态框 */}
            <Modal
              visible={destinationModal}
              animationType="slide"
              onRequestClose={() => {
                setDestinationModal(false);
              }}
            >
              <TouchableWithoutFeedback
                style={{ flex: 1 }}
                onPress={() => setDestinationModal(false)}
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
                      height: "100%",
                      backgroundColor: "#E0F2F1",
                      borderRadius: 10,
                      padding: 20,
                      marginTop: 20,
                    }}
                  >
                    <View
                      style={{
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: 20, fontWeight: "bold" }}>
                        添加地点
                      </Text>
                    </View>
                    {/* <View style={{ width: "100%" }}>
                        <MapView
                          style={{ alignSelf: "stretch", height: "100%" }}
                          region={mapRegion}
                        />
                      </View> */}
                    <View style={{ marginTop: 20 }}>
                      {destinationThemes.map((destinationTheme, index) => (
                        <View key={index} style={{ justifyContent: "center" }}>
                          <TouchableOpacity
                            onPress={() => {
                              handleDestinationPress(destinationTheme);
                            }}
                          >
                            <Text style={{ fontSize: 18, marginTop: 10 }}>
                              # {destinationTheme}
                            </Text>
                          </TouchableOpacity>
                          <View style={styles.line}></View>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </Modal>
            {/* 正文模态框 */}
            <Modal
              visible={isModalVisible}
              animationType="slide"
              onRequestClose={() => {
                setIsModalVisible(false);
              }}
            >
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  <TextInput
                    style={styles.contentInput}
                    multiline={true} // 允许多行输入
                    numberOfLines={4}
                    textAlignVertical="top" // 设置文本垂直对齐方式为顶部
                    placeholder="山水有语，托你传声"
                    onChangeText={handleInputContent}
                    value={content}
                  />
                  <View style={styles.bottomContent}>
                    <TouchableOpacity
                      style={styles.addLabel}
                      onPress={handleAddLabel}
                    >
                      <Text style={styles.addLabelText}># {labelText}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setIsModalVisible(false);
                      }}
                    >
                      <MaterialIcons
                        name="keyboard-arrow-down"
                        size={24}
                        color="black"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
            <View style={styles.line}></View>
            {/* 选择框 */}
            <View style={styles.four}>
              <View style={styles.picker}>
                <Text style={styles.pickerText}>出行月份:</Text>
                <View style={styles.monthPicker}>
                  <MonthPicker onSelectMonth={handleSelectMonth} />
                </View>
              </View>
              
              <View style={styles.picker}>
                <Text style={styles.pickerText}>心赏指数:</Text>
                <View style={styles.rateContainer}>
                  <StarRating
                    rating={rating}
                    starSize={30}
                    totalStars={5}
                    onPress={handleClickStar}
                  />
                </View>
              </View>
            </View>
            <View style={styles.line}></View>
            {/* 添加地点 */}
            <View style={styles.five}>
              <TouchableOpacity
                style={styles.five}
                onPress={handleAddDestination}
              >
                <View style={styles.left}>
                  <Image
                    source={require("./public/place.png")}
                    style={styles.placeIcon}
                  />
                  {destinationText ? (
                    <Text>{destinationText}</Text>
                  ) : (
                    <Text style={styles.placeText}>添加地点</Text>
                  )}
                </View>
                <MaterialIcons
                  name="keyboard-arrow-right"
                  size={24}
                  color="#B7B7B7"
                />
              </TouchableOpacity>
            </View>
            <View style={{ flex: 5 }}></View>
          </View>
          {/* 底部操作栏 */}
          <View style={styles.bottomBox}>
            <TouchableOpacity onPress={handleAddToDraft}>
              <View style={styles.draftBack}>
                <Image
                  source={require("./public/draft.png")}
                  style={styles.draftIcon}
                />
              </View>
              <Text style={styles.draftText}>存草稿</Text>
            </TouchableOpacity>
            {/* 提交按钮，将数据上传 */}
            <TouchableOpacity
              style={[
                styles.submitButton, // 基本样式
                isLoading ? styles.submitButtonDisabled : null // 条件样式：如果正在加载，应用禁用样式
              ]}
              onPress={() => {
                handleSubmitData();
              }}
              disabled={isLoading}
            >
              {isLoading ? (
    // 如果正在加载，显示 ActivityIndicator
    <ActivityIndicator size="small" color={colors.white} /> // 可以调整大小和颜色
  ) : (
    // 如果未加载，显示按钮文本
    <Text style={styles.submitButtonText}>发布游记</Text>
  )}
            </TouchableOpacity>
          </View>
          {/* </ScrollView> */}
        </View>
      ) : (
        <View
          style={{
            justifyContent: "center",
            alignItems: "center",
            height: "40%",
          }}
        >
          <Dialog.Loading />
        </View>
      )}
    </View>
  );
};

// CSS
const styles = StyleSheet.create({
  submitButton: {
    backgroundColor: colors.primary, // 正常状态颜色
    paddingVertical: 12, // 调整内边距
    paddingHorizontal: 20,
    borderRadius: 25, // 圆角
    alignItems: 'center',
    justifyContent: 'center', // 确保 ActivityIndicator 居中
    marginHorizontal: 20, // 示例边距
    marginBottom: 48,
    minHeight: 48, // 给按钮一个最小高度，防止加载时变形
    elevation: 2, // 轻微阴影
  },
  submitButtonDisabled: {
    backgroundColor: colors.primary200 || '#A9A9A9', // 禁用状态颜色 (灰色或浅主色)
    elevation: 0, // 移除阴影
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  container: {
    height: screenHeight,
    width: screenWidth,
    flexDirection: "column",
    marginLeft: 3,
    marginRight: 3,
    backgroundColor: "#E0F2F1",
  },
  topBottom: {
    flex: 1,
    marginTop: 10,
    justifyContent: "center",
  },
  violationBox: {
    position: "absolute",
    left: "22%",
  },
  violationTag: {
    position: "absolute",
    flexDirection: "row",
    left: "30%",
    width: 150,
    height: 30,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  violationText: {
    fontSize: 14,
    color: "white",
  },
  // middle: {
  //   borderWidth: 1,
  //   borderColor: "gray",
  //   borderRadius: 10,
  //   height: 40,
  // },
  one: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 10,
    // borderWidth: 1,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  two: {
    flex: 1,
    paddingRight: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleInput: {
    flex: 1,
    fontSize: 20,
  },
  maxTitle: {
    color: "#D1CFCF",
    fontSize: 16,
  },
  line: {
    height: 1,
    backgroundColor: "#D1CFCF",
    marginVertical: 10,
  },
  three: {
    flex: 4,
    marginTop: 5,
  },
  contentInput: {
    flex: 1,
    fontSize: 18,
  },
  bottomContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 5,
    paddingVertical: 5,
  },
  addLabel: {
    borderRadius: 20,
    padding: 10,
    // width: 70,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E3E6E8",
  },
  addLabelText: {
    textAlign: "center",
    marginLeft: 5,
    marginRight: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    height: "50%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    marginTop: 20,
  },
  four: {
    flex: 4,
  },
  picker: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  pickerText: {
    fontSize: 16,
    color: "black",
  },
  monthPicker: {
    width: 120,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  rangeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  rangeButton: {
    width: 80,
    height: 35,
    backgroundColor: "#E3E6E8",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    fontSize: 16,
  },
  selectedRangeButton: {
    borderColor: "#52BE80",
    backgroundColor: "#DEE4DC",
    borderWidth: 2,
  },
  rateContainer: {
    height: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  five: {
    flex: 1,
    flexDirection: "row",
    // alignItems: "center",
    justifyContent: "space-between",
  },
  left: {
    flexDirection: "row",
    // alignItems: "center",
  },
  placeIcon: {
    width: 25,
    height: 25,
  },
  placeText: {
    fontSize: 16,
    marginLeft: 10,
  },
  bottomBox: {
    height: 50,
    // backgroundColor: "red",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginLeft: 10,
    marginRight: 10,
  },
  draftBack: {
    width: 40,
    height: 40,
    borderRadius: 40,
    backgroundColor: "#E3E6E8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    marginBottom: 35,
  },
  draftIcon: {
    width: 25,
    height: 25,
  },
  draftText: {
    fontSize: 14,
    color: "#717070",
  },
  publicArea: {
    width: 200,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2E86C1",
    marginBottom: 10,
  },
  publicText: {
    color: "white",
    fontSize: 18,
  },
  mediaScrollView: {
    marginTop: 10,
    marginBottom: 10,
    paddingLeft: 10, // 给列表左边一点空间
},
mediaListContainer: { // 包裹所有媒体项和添加按钮的容器
    flexDirection: "row",
    alignItems: 'center', // 垂直居中对齐
},
mediaItem: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 10, // 项之间的右边距
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#eee',
},
thumbnail: {
    width: '100%',
    height: '100%',
},
playIconOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // 稍微深一点的遮罩
    justifyContent: 'center',
    alignItems: 'center',
},
addMediaButton: { // 使用 TouchableOpacity 实现的添加按钮
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
},

// 图片预览模态框样式
previewModalOverlay: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
},
previewImage: {
    width: '100%',
    height: '90%', // 留一些边距
},

// 媒体选择模态框样式
modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)', // 更深的遮罩
    justifyContent: 'flex-end',
},
modalContentContainer: {
    backgroundColor: "#E0F2F1",
    borderTopLeftRadius: 20, // 更大的圆角
    borderTopRightRadius: 20,
    paddingTop: 15,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30, // 增加底部安全距离
    paddingHorizontal: 15,
},
modalOption: {
    paddingVertical: 16, // 增加点击区域
    alignItems: 'center',
},
modalOptionText: {
    fontSize: 18,
    color: colors.primary || '#007AFF', // 使用主色或默认蓝色
},
modalOptionDisabledText: {
    color: '#cccccc', // 更明显的禁用灰色
},
modalSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e8e8e8', // 浅一点的分隔线
    marginHorizontal: 15, // 左右留白
    marginVertical: 5,
},
});

export default LogPublicPage;
