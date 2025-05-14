// import { styled } from "@ui-kitten/components";
import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView, 
  Image,
  Dimensions,
  StyleSheet,
  FlatList, 
  Text,
  TouchableOpacity, 
} from "react-native";
// const config = require("../../../config.json"); 

const screenWidth = Dimensions.get("window").width;

// ImageSlider 组件现在接收一个新的 prop: onPressImage
const ImageSlider = ({ imageUrls, onPressImage }) => {
  const [maxRatio, setMaxRatio] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0); 
  const [currentPage, setCurrentPage] = useState(0);

  // 计算图片的最大宽高比 (保持您原来的逻辑)
  useEffect(() => {
    if (!imageUrls || imageUrls.length === 0) { // 添加对空 imageUrls 的处理
        setContainerHeight(0); // 或一个默认的最小高度
        return;
    }
    let currentMaxRatio = 0; // 使用局部变量避免闭包问题
    const fetchImagesSize = async () => {
      try {
        const sizes = await Promise.all(imageUrls.map(getImageSize));
        sizes.forEach(({ width, height }) => {
          if (width && height) { // 确保宽高有效
            const ratio = width / height;
            if (ratio > currentMaxRatio) {
              currentMaxRatio = ratio;
            }
          }
        });
        // setMaxRatio(currentMaxRatio); 
        if (currentMaxRatio > 0) { // 只有在有效比例时才计算高度
            const height = Dimensions.get("window").width / currentMaxRatio;
            setContainerHeight(height);
        } else {
            setContainerHeight(200); // 如果无法计算比例，设置一个默认高度
        }
      } catch (error) {
        console.error("Error fetching image sizes in ImageSlider:", error);
        setContainerHeight(200); // 出错时设置默认高度
      }
    };

    fetchImagesSize();
  }, [imageUrls]);

  // 获取图片的尺寸 
  const getImageSize = async (url) => {
    return new Promise((resolve, reject) => {
      if (!url || typeof url !== 'string' ) { // 基本URL验证
          // console.warn("Invalid URL passed to getImageSize:", url);
          return resolve({ width: screenWidth, height: screenWidth * (9/16) }); // 无效URL返回默认尺寸
      }
      Image.getSize(
        url,
        (width, height) => {
          resolve({ width, height });
        },
        (error) => {
          // console.warn(`Failed to get size for image ${url}:`, error);
          resolve({ width: screenWidth, height: screenWidth * (9/16) }); // 失败时返回默认尺寸，避免Promise.all中断
        }
      );
    });
  };

  const renderItem = ({ item, index }) => ( // item 是单个 image URL
    // **将 Image 包裹在 TouchableOpacity 中**
    <TouchableOpacity
      activeOpacity={0.9} // 设置点击时的透明度反馈
      onPress={() => {
        // 调用从 props 传入的 onPressImage 函数
        console.log("[ImageSlider] Image pressed:", item);
        if (onPressImage && typeof onPressImage === 'function') {
          onPressImage(item, index); // 传递被点击的图片 URL 和索引
        }
      }}
    >
      <Image
        source={{ uri: item }}
        style={{ width: screenWidth, height: containerHeight > 0 ? containerHeight : 200 }} // 使用计算出的高度，或默认值
        resizeMode="contain" 
      />
    </TouchableOpacity>
  );

  // 左右滑动改变圆点样式 (保持您原来的逻辑)
  const handleScroll = (event) => {
    const { contentOffset } = event.nativeEvent;
    const page = Math.round(contentOffset.x / screenWidth); // 使用 Math.round
    if (page !== currentPage) { // 仅在页面变化时更新
        setCurrentPage(page);
    }
  };

  // 如果没有图片或高度未计算好，可以显示一个占位符或返回 null
  if (!imageUrls || imageUrls.length === 0 || containerHeight <= 0) {
    // 可以返回一个固定高度的占位符，或者 null
    // return <View style={{ height: 200, backgroundColor: '#f0f0f0' }} />;
    return null; // 或者不渲染任何东西
  }

  return (
    <View style={{ flex: 1, height: containerHeight > 0 ? containerHeight + (imageUrls.length > 1 && imageUrls.length <=6 ? 20 : 0) : undefined }}>
      <FlatList
        data={imageUrls}
        renderItem={renderItem}
        keyExtractor={(item, index) => `slider_image_${index}_${item}`} // 更唯一的key
        horizontal
        pagingEnabled
        onScroll={handleScroll}
        scrollEventThrottle={16} // 提高滚动事件频率，使指示点更新更平滑
        // style={{ backgroundColor: "white" }} // 保持您原来的样式
        showsHorizontalScrollIndicator={false}
        // getItemLayout={(data, index) => ( // 性能优化，如果所有项宽度一致
        //   { length: screenWidth, offset: screenWidth * index, index }
        // )}
      />

      <View style={styles.dotContainer}>
        {imageUrls.length > 1 && // 只有多于一张图片时才显示指示点
          imageUrls.length <= 6 && // 限制指示点数量 
          imageUrls.map((_, index) => (
            <View
              key={`dot_${index}`}
              style={[
                styles.dot,
                index === currentPage ? styles.activeDot : null,
              ]}
            />
          ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dotContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    position: 'absolute',
    bottom: 5, // 调整与底部的距离
    left: 0,
    right: 0,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 4,
    backgroundColor: "gray",
    marginHorizontal: 3,
  },
  activeDot: {
    backgroundColor: "red", 
  },
});

export default ImageSlider;