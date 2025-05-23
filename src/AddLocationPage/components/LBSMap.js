import React, { useState, useEffect, useRef } from "react";
import { WebView } from "react-native-webview";
import { Alert } from "react-native";

/**
 *
 * @param {value} param0 :首次传入地图组件的值
 * @param {setValueFunc} param1:传入地点的set方法
 * @param {setStateFunc} param2:传入控制变量的set方法
 * @returns
 */
const LBSMap = ({ value, setValueFunc, setStateFunc }) => {
  const webRef = useRef(null);
  console.log(value);
  const loaction = value;

  const handleMessage = (event) => {
    // console.log("hello");
    // 获取来自 WebView 的消息
    const message = event.nativeEvent.data;
    const data = JSON.parse(message);
    if (data.status == "success") {
      setValueFunc(data.location);
      setStateFunc(true);
    } else if (data.status == "error") {
      setValueFunc("");
      setStateFunc(false);
    }
    // console.log(data);
  };
  // useEffect(() => {}, [value]);
  return (
    <WebView
      style={{
        width: 400,
        height: 400,
        // backgroundColor: "red",
      }}
      // source={{ html }}
      source={{ uri: "http://10.0.2.2:8080/image/map2.html" }}
      ref={webRef}
      originWhitelist={["*"]}
      useWebKit={true}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      scrollEnabled={false}
      onMessage={handleMessage}
      //重写webview的postMessage方法，解决RN无法监听html自带的window.postMessage
      injectedJavaScript={`
              function getLocation(){
                 theLocation(function(result) {
                      window.ReactNativeWebView.postMessage(JSON.stringify(result));
                  });
              }
              var cityNameInput = document.getElementById('cityName');
                // 设置 input 元素的值为自己想要的值
              if (cityNameInput) { // 确保元素存在
                  cityNameInput.value ="${loaction}" ;
                  getLocation();
              } else {
                 window.ReactNativeWebView.postMessage({status:"error",message:"获取输入框失败"});
              }
               var button = document.getElementById("search");
               button.onclick = getLocation;
              `}
    />
  );
};

export default LBSMap;
