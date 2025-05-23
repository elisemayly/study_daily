import React, { useState } from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
// import CheckBox from "@react-native-community/checkbox";
import { Button, Icon, Text, Image, Input } from "@rneui/themed";
// import { CheckBox } from "@rneui/base";
import { useNavigation } from "@react-navigation/native";

export default function LoginScreen() {
  const navigation = useNavigation();

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" ,backgroundColor: "#D0EBEA"}}>
      <View style={{ flex: 3, justifyContent: "flex-end" }}>
        <Image
          source={require("../../assets/logo.png")}
          style={styles.image}
        />
      </View>
      <View
        style={{
          flex: 3,
          justifyContent: "flex-start",
          alignItems: "center",
        }}
      >
        <Button
          title="微信登录"
          loading={false}
          loadingProps={{ size: "small", color: "white" }}
          buttonStyle={{
            backgroundColor: "rgba(26, 173, 25, 1)",
            borderRadius: 30,
          }}
          titleStyle={{ fontWeight: "bold", fontSize: 23 }}
          containerStyle={{
            marginHorizontal: 50,
            height: 50,
            width: 250,
            marginVertical: 10,
          }}
          onPress={() => {
            navigation.navigate("Register", { type: "login" });
          }}
        >
          <Icon name="account-circle" color="white" />
          <Text style={{ fontSize: 18, color: "#FFF" }}>登录</Text>
        </Button>
        <Button
          title="微信登录"
          loading={false}
          loadingProps={{ size: "small", color: "white" }}
          buttonStyle={{
            backgroundColor: "rgba(26, 173, 25, 1)",
            borderRadius: 30,
          }}
          titleStyle={{ fontWeight: "bold", fontSize: 23 }}
          containerStyle={{
            marginHorizontal: 50,
            height: 50,
            width: 250,
            marginVertical: 10,
          }}
          onPress={() => {
            navigation.navigate("Register", { type: "register" });
          }}
        >
          <Icon name="person-add-alt-1" color="white" />
          <Text style={{ fontSize: 18, color: "#FFF" }}>注册</Text>
        </Button>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              textAlign: "center",
              fontSize: 16,
              color: "midnightblue",
            }}
          >
            其他登录方式
          </Text>
          <Icon name="chevron-right" color="#000" />
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  image: {
    width: 250,
    height: 250,
    resizeMode: "contain", // 控制图片的缩放模式
  },
});
