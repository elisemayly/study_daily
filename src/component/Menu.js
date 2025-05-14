import React, { useState, useEffect } from "react";
import {
  HomeOutlined,
  FileTextOutlined,
  LogoutOutlined,
  EditOutlined,
  AppstoreOutlined,
  TeamOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import { Menu } from "antd";
import { NavLink, useNavigate } from "react-router-dom";
import cookie from "react-cookies";
import { api } from "../util";

// 定义侧边栏组件 App，接收 isLoggedIn 和 setIsLoggedIn 两个 prop
const App = ({ isLoggedIn, setIsLoggedIn }) => {
  // 从 Cookie 中读取当前登录用户的角色（"admin" 或 "audit"）
  const role = cookie.load("role");
  console.log("role", role);
  const navigate = useNavigate();// 用于编程式导航

  // 辅助函数：构建菜单项结构
  function getItem(label, key, icon, children, type) {
    return {
      key,
      icon,
      children,
      label,
      type,
    };
  }

  // 处理登出逻辑
  const handleLogout = async () => {
    const confirmed = window.confirm("确定要退出登录吗？");
    if (confirmed) {
      await api.get("/auditManagement/logout");// 调用登出接口
      setIsLoggedIn(false);// 修改父组件的登录状态
      cookie.remove("userId");// 移除用户 ID Cookie
      cookie.remove("role");// 移除角色 Cookie
      navigate("/");// 跳转回首页
    }
  };

  // 定义菜单项中使用的链接与功能项
  const logout = <span onClick={handleLogout}>退出登录</span>;
  const travelLogList = <NavLink to="/travelLogList">游记列表</NavLink>;
  const roleInstruction = <NavLink to="/permissionList">权限说明</NavLink>;
  const userList = <NavLink to="/userList">用户列表</NavLink>;

  // 权限管理，审核人员看不到权限列表页
  const getMenuItems = () => {
    // 通用项：账号管理 + 登出
    const commonItems = [
      getItem("账号管理", "1", <HomeOutlined />, [
        getItem(logout, "logout", <LogoutOutlined />),
      ]),
      {
        type: "divider",// 菜单分隔线
      },
    ];

    // 管理员的菜单项：包含游记审核 + 权限管理
    const adminItems = [
      getItem("审核管理", "2", <AppstoreOutlined />, [
        getItem(travelLogList, "travelLogList", <EditOutlined />),
        getItem("权限列表", "3", <ToolOutlined />, [
          getItem(roleInstruction, "roleInstruction", <FileTextOutlined />),
          getItem(userList, "userList", <TeamOutlined />),
        ]),
      ]),
    ];

    // 审核员的菜单项：只包含游记审核
    const auditItems = [
      getItem("审核管理", "2", <AppstoreOutlined />, [
        getItem(travelLogList, "travelLogList", <EditOutlined />),
      ]),
    ];

    // 根据用户角色返回对应的菜单组合
    if (role === "audit") {
      return commonItems.concat(auditItems);
    } else {
      return commonItems.concat(adminItems);
    }
  };

  // const items_isLoggedIn = [
  //   getItem("账号管理", "1", <HomeOutlined />, [
  //     getItem(logout, "logout", <LogoutOutlined />),
  //   ]),
  //   {
  //     type: "divider",
  //   },
  //   getItem("审核管理", "2", <AppstoreOutlined />, [
  //     getItem(travelLogList, "travelLogList", <EditOutlined />),
  //     getItem("权限列表", "3", <ToolOutlined />, [
  //       getItem(roleInstruction, "roleInstruction", <FileTextOutlined />),
  //       getItem(userList, "userList", <TeamOutlined />),
  //     ]),
  //   ]),
  // ];

  // 渲染侧边栏菜单，默认展开“账号管理”和“审核管理”，默认选中“游记列表”
  return (
    <Menu
      defaultSelectedKeys={["travelLogList"]}
      defaultOpenKeys={["1", "2"]}
      mode="inline"
      items={getMenuItems()}
    />
  );
};

export default App;
