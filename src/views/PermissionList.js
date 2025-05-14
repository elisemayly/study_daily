import React from "react";
import { Table } from "antd";

// 权限列表组件
const PermissionList = () => {
  // 定义表格的列结构
  const columns = [
    {
      title: <span style={{color: "#8bd85f", fontWeight: "bold"}}>权限</span>,// 表头显示为“角色”
      dataIndex: "role",// 对应数据中的 key: role
      key: "role",// 唯一标识该列的
      render: (text) => {
        let color = "#a7efef"; // 默认青绿
        if (text === "superAdmin") color = "#ef4149"; // 红色
        else if (text === "admin") color = "#34db55"; // 绿色
        else if (text === "audit") color = "#faad14"; // 橙色
        return <span style={{color, fontWeight: "bold"}}>{text}</span>;
      },
    },
    {
      title: <span style={{color: "#8bd85f", fontWeight: "bold"}}>权限描述</span>,// 表头显示为“权限描述”
      dataIndex: "description",// 对应数据中的 key: description
      key: "description",// 唯一标识该列的 key
      render: (text) => <span style={{color: "#14ba79"}}>{text}</span>
    },
  ];

  // 定义表格的数据源（即权限角色数据）
  const roles = [
    {
      _id: "1",// 每条数据的唯一 ID
      role: "admin",
      description:// 权限描述
          "管理员，可以执行所有支持的游记管理操作，包括通过、拒绝、删除。",
    },
    {
      _id: "2",
      role: "audit",
      description: "审核人员，可以操作游记的审核通过和拒绝。",
    },
    {
      _id: "3",
      role: "superAdmin",
      description:
          "超级管理员，除可以执行所有支持的游记管理操作，包括通过、拒绝、删除外，还可以增加删除管理员和审核人员。",
    }
  ];

  // 使用 Ant Design 的 Table 组件展示权限信息
  // dataSource 为数据源，columns 为列定义，rowKey 指定每行的唯一 key
  return <Table
      dataSource={roles}
      columns={columns}
      rowKey="_id"
      className="green-table"
      bordered
  />;
};


export default PermissionList;
