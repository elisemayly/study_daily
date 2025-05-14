import React, { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import axios from "axios";
import { Button, Form, Input, Select, Space, message } from "antd";
const { Option } = Select;

// 表单布局配置
const layout = {
  labelCol: {
    span: 8,// 标签列宽
  },
  wrapperCol: {
    span: 16,// 表单输入列宽
  },
};
const tailLayout = {
  wrapperCol: {
    offset: 8,// 向右偏移，与输入对齐
    span: 16,
  },
};

// 用户编辑组件，接收当前登录用户 loginUser 作为 prop
const UserEdit = ({ loginUser }) => {
  const [form] = Form.useForm();// 使用 Ant Design 的表单 hook
  const userId = useParams().id;// 从 URL 参数中获取待编辑用户的 ID
  const [user, setUser] = useState(null);// 用于保存当前要编辑的用户数据
  const [editFinished, setEditFinished] = useState(false);// 是否编辑完成，用于跳转

  // 页面加载时获取用户信息并填充表单
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.post("http://localhost:5000/api/user", {
          userId,
        });
        form.setFieldsValue(response.data);// 设置表单默认值
        setUser(response.data);// 存储用户信息
      } catch (error) {
        form.resetFields();// 请求失败则重置表单
        console.log(error);
      }
    };
    fetchUser();
  }, [form, userId]);

  // 调用用户编辑api
  const handleEdit = async (values) => {
    await axios
        .put(`http://localhost:5000/api/userEdit/${userId}`, values)// 向后端发送更新请求
        .then((response) => {
          message.success(response.data.message);// 成功提示
          setEditFinished(true);// 设置编辑完成，用于跳转
        })
        .catch((error) => {
          console.error(error.response.data);// 错误处理
        });
  };

  // 取消按钮逻辑：直接跳转回用户列表页
  const onCancel = () => {
    setEditFinished(true);
  };

  // 如果用户数据还没加载完，显示 loading 提示
  if (!user) {
    return <div>Loading...</div>;
  }

  // 如果编辑已完成，跳转回用户列表页
  if (editFinished) {
    return <Navigate to="/user-list" />;
  }

  // 返回渲染的编辑表单
  return (
      <Form
          {...layout}
          form={form}
          name="control-hooks"
          onFinish={handleEdit}
          style={{
            maxWidth: 600,
          }}
      >
        {/* 用户名字段，禁用编辑 */}
        <Form.Item
            name="username"
            label="用户名"
            rules={[
              {
                required: true,
              },
            ]}
        >
          <Input disabled />
        </Form.Item>

        {/* 邮箱字段，仅允许用户本人修改 */}
        <Form.Item
            name="email"
            label="邮箱"
            rules={[
              {
                required: true,
              },
            ]}
        >
          <Input disabled={userId !== loginUser._id} />
        </Form.Item>

        {/* 权限字段，只有管理员可修改 */}
        <Form.Item
            name="role"
            label="权限"
            rules={[
              {
                required: true,
              },
            ]}
        >
          <Select
              placeholder="Select a option and change input text above"
              allowClear
              disabled={userId === loginUser._id || loginUser.role === "user"}
          >
            <Option value="user">普通用户</Option>
            <Option value="admin">管理员</Option>
          </Select>
        </Form.Item>

        {/* 提交与取消按钮 */}
        <Form.Item {...tailLayout}>
          <Space>
            <Button type="primary" htmlType="submit">
              Update
            </Button>
            <Button htmlType="button" onClick={onCancel}>
              Cancel
            </Button>
          </Space>
        </Form.Item>
      </Form>
  );
};

export default UserEdit;
