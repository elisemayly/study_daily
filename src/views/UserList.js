import React, { useEffect, useState } from "react";
import {
  Button,
  Table,
  Drawer,
  Input,
  Space,
  FloatButton,
  Form,
  Row,
  Col,
  Select,
  message,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { api } from "../util";
import cookie from "react-cookies";

const { Search } = Input;
const { Option } = Select;

// 请求状态常量，用于处理加载、成功、失败等状态
const RequestStatus = {
  IDLE: "IDLE",
  PENDING: "PENDING",
  SUCCESS: "SUCCESS",
  ERROR: "ERROR",
};

const UserList = () => {
  // 状态变量定义
  const [searchText, setSearchText] = useState("");// 搜索内容
  const [managerList, setManagerList] = useState([]);// 管理员列表数据
  const [open, setOpen] = useState(false);// 控制抽屉开关
  const [disabled, setDisabled] = useState(true); // 定义下拉选择框状态，只有编辑状态下才能点击
  const [requestStatus, setRequestStatus] = useState(RequestStatus.IDLE);// 请求状态

  const [form] = Form.useForm();// 表单实例
  const role = cookie.load("role");// 从 cookie 中获取当前登录用户的权限

  // 定义表格
  const columns = [
    {
      title: <span style={{color: "#8bd85f", fontWeight: "bold"}}>用户名</span>,
      dataIndex: "username",
      key: "username",
    },
    {
      title: <span style={{color: "#8bd85f", fontWeight: "bold"}}>权限</span>,
      dataIndex: "role",
      key: "role",
      render: (text, record) => {
        // 超级管理员可以编辑权限
        if (role === "superAdmin") {
          return (
              <Select
                  defaultValue={text}
                  style={{width: 120}}
                  onChange={(value) => handleEditRole(record._id, value)}
                  variant="borderless"
                  disabled={disabled}
              >
                <Option value="admin">管理员</Option>
                <Option value="audit">审核人员</Option>
              </Select>
          );
        } else {
          // 非超级管理员只显示权限文本
          return text;
        }
      },
    },
    {
      title: "",
      key: "action",
      render: (_, record) => (
          <Space size="middle">
            {/* 超级管理员可编辑 */}
            {role === "superAdmin" && <a onClick={() => handleEdit()}>编辑</a>}
            {/* 所有人都可删除 */}
            <a onClick={() => handleDelete(record)}>删除</a>
          </Space>
      ),
    },
  ];

  // 抽屉表单
  // const showDrawer = () => {
  //   setOpen(true);
  // };
  const onClose = () => {
    setOpen(false);
  };

  // 获取数据
  useEffect(() => {
    // 从数据库中拿数据
    const fetchData = async () => {
      try {
        const params = {
          searchContent: searchText,
          role: role,
        };
        const response = await api.get("/auditManagement/adminUser", {
          params,
        });
        // console.log(response.data);
        setManagerList(response.data);
        setRequestStatus(RequestStatus.SUCCESS);
      } catch (error) {
        setRequestStatus(RequestStatus.ERROR);
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [searchText]);

  // 搜索操作
  const handleSearchChange = (value) => {
    setSearchText(value);
  };

  // 提交表单数据：添加用户
  const onFinish = async (values) => {
    console.log("Received values of form: ", values);
    onClose();// 关闭抽屉
    try {
      const response = await api.post("/auditManagement/addUser", values);
      console.log(response.data);
      message.success("用户添加成功");
      // 提交成功后，执行页面刷新
      window.location.reload();
    } catch (error) {
      console.error("Error adding data:", error);
      message.error(error.response.data.message);
    }
  };

  // 删除操作
  const handleDelete = async (record) => {
    try {
      await api
          .delete(`/auditManagement/deleteUser/${record._id}`)
          .then((res) => {
            console.log(res.data);
            message.success("删除成功");
            window.location.reload();
          });
    } catch (error) {
      console.error("Error deleting data:", error);
      message.error("删除失败");
    }
  };

  // 编辑动作，点击可编辑，再点击关闭编辑
  const handleEdit = () => {
    setDisabled(!disabled);
  };

  // 编辑操作
  const handleEditRole = async (id, value) => {
    try {
      await api
          .put(`/auditManagement/editUser/${id}`, { role: value })
          .then((res) => {
            console.log(res.data);
            message.success("权限修改成功");
          });
    } catch (error) {
      console.error("Error editing data:", error);
      message.error("权限修改失败");
    }
  };

  return (
      <div>
        {/* 顶部搜索栏与新增按钮 */}
        <div style={{ textAlign: "center" }}>
          <Search
              placeholder="搜索人员"
              allowClear
              enterButton
              size="large"
              style={{ width: "60%", marginBottom: "20px" }}
              onSearch={handleSearchChange}
          />
          {/* 添加按钮（浮动按钮） */}
          <FloatButton
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={() => setOpen(true)}
          />
          {/* 右侧抽屉表单 */}
          <Drawer
              title={
                <div
                    style={{ fontWeight: "normal", fontSize: 14, textAlign: "left" }}
                >
                  添加人员信息
                </div>
              }
              placement="right"
              // closable={false}
              onClose={onClose}
              open={open}
              getContainer={false}
              width={"30%"}
              extra={
                <Space>
                  <Button type="primary" onClick={() => form.submit()}>
                    提交
                  </Button>
                </Space>
              }
          >
            {/* 抽屉内表单 */}
            <Form layout="vertical" onFinish={onFinish} form={form}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                      name="username"
                      label="用户名"
                      rules={[
                        {
                          required: true,
                          message: "用户名！",
                        },
                      ]}
                  >
                    <Input placeholder="请输入用户名" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                      label="密码"
                      name="password"
                      rules={[
                        {
                          required: true,
                          message: "密码！",
                        },
                      ]}
                  >
                    <Input placeholder="请输入密码" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                      name="role"
                      label="权限"
                      rules={[
                        {
                          required: true,
                          message: "权限！",
                        },
                      ]}
                  >
                    <Select placeholder="选择权限">
                      {role === "superAdmin" && (
                          <Option value="admin">管理员</Option>
                      )}
                      <Option value="audit">审核人员</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Drawer>
        </div>
        {/* 表格展示管理员数据 */}
        {requestStatus === RequestStatus.SUCCESS && (
            <Table columns={columns} dataSource={managerList} />
        )}
      </div>
  );
};

export default UserList;
