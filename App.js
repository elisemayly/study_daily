import * as React from "react";
import { useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Animated,
  TouchableWithoutFeedback,
  Overlay,
  Dimensions,
  LogBox,
  StatusBar,
} from "react-native";

import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer, useNavigation } from "@react-navigation/native";

import colors from "./src/theme/colors";
import HomeScreen from "./src/HomePage";
import LogDetailScreen from "./src/LogDetailPage";
import LoginScreen from "./src/LoginPage";
import RegisterScreen from "./src/RegisterPage";
import LogPublicScreen from "./src/LogPublicPage";
import MyLogScreen from "./src/MyLogPage";
import UserInfoScreen from "./src/UserInfoPage";
import EditPage from "./src/EditUserInfoPage";
import OtherUserScreen from "./src/otherUserPage";
import SettingScreen from "./src/SettingPage";
import AddUserScreen from "./src/AddUserPage";
import ShareToUserScreen from "./src/ShareToUserPage";
import MyMessageScreen from "./src/MyMessagePage";
import AddLocationScreen from "./src/AddLocationPage";
import { setAuthHeader, getItemFromAS } from "./util";
import { MaterialIcons } from "@expo/vector-icons";

LogBox.ignoreAllLogs();
const Toast = Overlay.Toast;

function PublishButton() {
  const navigation = useNavigation();
  const scaleValue = useRef(new Animated.Value(1)).current;

  const originalAddButtonPress = async () => {
    let user = await getItemFromAS("userInfo");
    try {
      user = user ? JSON.parse(user) : null;
    } catch (e) {
      console.error("解析用户信息失败 (PublishButton):", e);
      user = null;
    }
    if (user) {
      navigation.navigate("LogPublic");
    } else {
      if (Toast && typeof Toast.show === 'function') {
        Toast.show("请先登录~");
      } else {
        console.warn("Toast.show 调用失败。");
        alert("请先登录~ (备用提示)");
      }
    }
  };

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleValue, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleValue, { toValue: 1, duration: 150, useNativeDriver: true, delay: 50 }),
    ]).start();
    originalAddButtonPress();
  };

  return (
    <View style={styles.publishButtonContainer}>
      <TouchableWithoutFeedback onPress={handlePress}>
        <Animated.View style={[
          styles.addButton,
          {
            transform: [
              { translateX: -styles.addButton.width / 2 },
              { scale: scaleValue }
            ]
          }
        ]}>
          <MaterialIcons name="add" size={30} color={colors.publishButtonIconColor} />
        </Animated.View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const Tab = createBottomTabNavigator();
function HomeTabScreen() {
  return (
    <View style={styles.flexContainer}>
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
          tabBarLabelStyle: styles.tabBarText, 
          tabBarInactiveTintColor: colors.tabInactive || '#8e8e93',
          tabBarActiveTintColor: colors.primary,
          tabBarStyle: styles.bottomTabBarStyle,
          tabBarHideOnKeyboard: true,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarLabel: "他处风景",
            tabBarIcon: ({ color, size }) => (
              // 直接使用 size，或 size * 1.1 略微放大
              <MaterialIcons name="landscape" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="LogPublicTabPlaceholder"
          component={() => null}
          options={{
            tabBarLabel: () => null,
            tabBarButton: () => <PublishButton />,
          }}
        />
        <Tab.Screen
          name="MyLog"
          component={MyLogScreen}
          options={{
            tabBarLabel: "我心山河",
            tabBarIcon: ({ color, size }) => (
              // 直接使用 size，或 size * 1.1 略微放大
              <MaterialIcons name="person" color={color} size={size} />
            ),
          }}
        />
      </Tab.Navigator>
    </View>
  );
}

const Stack = createNativeStackNavigator();
function HomeStackScreen() {
  const commonScreenOptions = {
    headerStyle: styles.stackHeaderStyle,
    headerTintColor: colors.headerTintColor,
    headerTitleStyle: styles.stackHeaderTitleStyle,
    headerTitleAlign: "center",
  };

  return (
    <Stack.Navigator
      initialRouteName="HomeTab"
      screenOptions={{ ...commonScreenOptions, headerShown: false }}
    >
      <Stack.Screen name="HomeTab" component={HomeTabScreen} />
      <Stack.Screen name="LogDetail" component={LogDetailScreen} options={{ headerShown: false, headerTitle: "游记详情" }}/>
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: true, headerTitle: "登录" }}/>
      <Stack.Screen name="Setting" component={SettingScreen} options={{ headerShown: true, headerTitle: "设置" }} />
      <Stack.Screen name="UserInfo" component={UserInfoScreen} options={{ headerShown: true, headerTitle: "我的信息" }} />
      <Stack.Screen name="EditPage" component={EditPage} options={{ headerShown: true, headerTitle: "编辑信息" }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false, headerTitle: "登录" }} />
      <Stack.Screen name="OtherUserLog" component={OtherUserScreen} options={{ headerShown: true, headerTitle: "用户动态" }} />
      <Stack.Screen name="AddLocation" component={AddLocationScreen} options={{ headerShown: true, headerTitle: "添加位置" }} />
      <Stack.Screen name="AddUser" component={AddUserScreen} options={{ headerShown: true, headerTitle: "发现好友" }} />
      <Stack.Screen name="ShareToUser" component={ShareToUserScreen} options={{ headerShown: true, headerTitle: "分享给好友" }} />
      <Stack.Screen name="MyMessage" component={MyMessageScreen} options={{ headerShown: true, headerTitle: "我的消息" }} />
      <Stack.Screen name="LogPublic" component={LogPublicScreen} options={{ headerShown: false }}/>
    </Stack.Navigator>
  );
}

function App() {
  useEffect(() => { setAuthHeader(); }, []);
  return (
    <NavigationContainer>
      <StatusBar backgroundColor={colors.statusBarBackground} barStyle={colors.statusBarStyle} />
      <HomeStackScreen />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  flexContainer: { flex: 1, backgroundColor: colors.background },
  bottomTabBarStyle: {
    backgroundColor: colors.primary300,
    height: 60, 
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#D0EBEA',
    paddingBottom: 5, // 保持一些底部填充
    position: 'relative',
  },
  tabBarText: {
    fontSize: 12, // 从 10 增加到 12
    fontWeight: '500',
    marginBottom: 2,
  },
  publishButtonContainer: {
    position: 'absolute',
    left: '50%',
    bottom: 15, 
    zIndex: 10,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  stackHeaderStyle: { backgroundColor: colors.headerBackground },
  stackHeaderTitleStyle: { fontWeight: 'bold', fontSize: 18, color: colors.headerTintColor },
});

export default App;