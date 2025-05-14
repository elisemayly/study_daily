import React, { useState, useEffect } from "react";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Layout, Button, theme } from "antd";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import MyMenu from "./component/Menu";
import cookie from "react-cookies";
import LoginForm from "./views/LoginPage";
// import LoginForm from "./views/Login copy";

import PermissionList from "./views/PermissionList";
import TravelLogList from "./views/TravelLogList";
import UserList from "./views/UserList";
import { api } from "./util";
import "./App.css";
import { ConfigProvider } from "antd";


// 解构 Layout 的子组件
const { Header, Sider, Content } = Layout;



const App = () => {
  const [collapsed, setCollapsed] = useState(false); // 是否收起侧边菜单栏
  const [isLoggedIn, setIsLoggedIn] = useState(false); // 当前用户是否已登录
  const [user, setUser] = useState(null);// 当前用户信息
  const userId = cookie.load("userId");// 从 cookie 中获取用户 ID
  const roleToName = {
    superAdmin: "超级管理员",
    admin: "管理员",
    audit: "审核人员",
  };

  useEffect(() => {
    // 检查用户是否已登录
    const checkLoggedIn = async () => {
      try {
        const params = {
          userId: userId,
        };
        const response = await api.get("/auditManagement/userInfo", {
          params,
        });
        setIsLoggedIn(true);// 设置为已登录
        setUser(response.data);// 保存用户信息

        // 将用户的角色存到cookie中
        cookie.save("role", response.data.role, {
          path: "/",
        });
      } catch (error) {
        setIsLoggedIn(false);// 登录失败或过期
        console.log(error);
      }
    };
    checkLoggedIn();
  }, [userId]);

  // 登录成功后回调，更新用户状态
  const handleLogin = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
  };

  // 获取当前主题 token
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // 未登录展示登录页
  if (!isLoggedIn) return <LoginForm handleLogin={handleLogin} />;
  else {
    return (
        // 已登录用户展示主页面
        <ConfigProvider
            theme={{
              token: {
                colorPrimary: '#509c28',// 全局主题色设为绿色
              },
            }}
        >
          <Router>
            <Layout>
              {/* 左侧菜单栏 */}
              <Sider
                  trigger={null}
                  collapsible
                  collapsed={collapsed}
                  style={{ background: colorBgContainer }}
              >
                <MyMenu
                    isLoggedIn={isLoggedIn}
                    setIsLoggedIn={setIsLoggedIn}
                />
              </Sider>
              <Layout>
                {/* 顶部头部区域 */}
                <Header
                    style={{
                      padding: 0,
                      background: colorBgContainer,
                    }}
                >
                  {/* 折叠菜单按钮 */}
                  <Button
                      type="text"
                      icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                      onClick={() => setCollapsed(!collapsed)}
                      style={{
                        fontSize: "16px",
                        width: 64,
                        height: 64,
                      }}
                  />
                  {/* 用户信息展示 */}
                  {isLoggedIn && (
                      <span
                          style={{
                            position: "absolute",
                            right: "30px",
                            fontSize: "16px",
                          }}
                      >
                  <UserOutlined />
                  <span
                      style={{
                        marginLeft: "10px",
                      }}
                  >
                    {roleToName[user.role]}：{user.username}
                  </span>
                </span>
                  )}
                </Header>

                {/* 主体内容区 */}
                <Content
                    style={{
                      flex: 1,
                      // margin: "24px 16px",
                      padding: 24,
                      minHeight: 280,
                      background: colorBgContainer,
                      borderRadius: borderRadiusLG,
                    }}
                >
                  {/* 子路由 */}
                  <Routes>
                    <Route path="/" element={<Navigate to="/travelLogList" />} />
                    <Route
                        path="/travelLogList"
                        element={<TravelLogList loginUser={user} />}
                    />
                    <Route
                        path="/permissionList"
                        element={
                          isLoggedIn ? <PermissionList /> : <Navigate to="/login" />
                        }
                    />
                    <Route
                        path="/userList"
                        element={isLoggedIn ? <UserList /> : <Navigate to="/login" />}
                    />
                  </Routes>
                </Content>
              </Layout>
            </Layout>
          </Router>
        </ConfigProvider>
    );
  }
};
export default App;
