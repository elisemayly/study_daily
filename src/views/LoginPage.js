import React from "react";
import { Form, Input, Button, message, Typography, Checkbox } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { api } from "../util";
import cookie from "react-cookies";

const { Title } = Typography;// 用于显示标题的组件

// 登录页面组件
const LoginPage = ({ handleLogin }) => {
// 提交表单的处理函数
  const handleSubmit = async (values) => {
      // 发送登录请求
    await api
      .post("/auditManagement/login", values)// 调用后端接口，提交表单数据
      .then((response) => {
        message.success(response.data.message); // 登录成功提示
        // 登录成功后使用cookie存储用户Id，并设置过期时间
        let expireDate = new Date(new Date().getTime() + 24 * 60 * 60 * 1000); // 24小时后过期
        cookie.save("userId", response.data.userId, {
          expires: expireDate,
          path: "/",
        });
          // 调用父组件传递过来的 handleLogin 函数，更新用户信息
        handleLogin(response.data.user);
      })
      .catch((error) => {
        console.log(error);
        message.error(error.response.data.message); // 捕获并设置错误消息
      });
  };

    // 渲染登录页面
  return (
    <div className="login-background">{/* 背景样式 */}
      <div className="login-box">{/* 登录框 */}
        <Title
          level={3}
          style={{
            textAlign: "center",// 中心对齐
            marginBottom: "20px",// 底部间距
              color: "rgb(121,216,95)",// 标题颜色
          }}
        >
            山语<br/>后章
        </Title>

          {/* 表单组件，提交时调用 handleSubmit 函数 */}
        <Form
          name="normal_login"// 表单名称
          className="login-form"// 自定义样式类
          initialValues={{
            remember: true,// 默认记住密码
          }}
          onFinish={handleSubmit}// 提交时触发 handleSubmit
        >

            {/* 用户名输入框 */}
          <Form.Item
            name="username"// 表单字段名称
            rules={[
              {
                required: true,// 必填项
                message: "请输入用户名！",// 错误提示
              },
            ]}
          >
            <Input
              prefix={<UserOutlined className="site-form-item-icon" />}// 用户图标
              placeholder="Username"// 输入框提示文字
              style={{ fontSize: "18px" }}// 输入框样式
              // autoComplete="on"// 可以启用浏览器的自动完成功能
            />
          </Form.Item>

            {/* 密码输入框 */}
          <Form.Item
            name="password"// 表单字段名称
            rules={[
              {
                required: true,
                message: "请输入密码！",
              },
            ]}
          >
            <Input
              prefix={<LockOutlined className="site-form-item-icon" />}// 密码图标
              type="password"// 隐藏密码
              placeholder="Password"// 输入框提示文字
              style={{ fontSize: "18px" }}// 输入框样式
            />
          </Form.Item>

            {/* 记住我复选框 */}
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox className="remember-me" style={{ fontSize: "16px", marginBottom: "10px" }}>
                记住我{/* 复选框提示文字 */}
            </Checkbox>
          </Form.Item>
            {/* 登录按钮 */}
          <Form.Item>
            <Button
              type="primary"// 主按钮样式
              htmlType="submit"// 提交按钮类型
              style={{ fontSize: "16px", width: "100%" ,backgroundColor: '#52c41a', borderColor: '#62bd34'}}// 按钮样式
            >
                登录{/* 按钮文字 */}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default LoginPage;
