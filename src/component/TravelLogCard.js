import React, { useState } from "react";
import {
  Carousel,
  Button,
  Card,
  Flex,
  Typography,
  Drawer,
  Space,
  Input,
  message,
  Row,
  Col,
} from "antd";
import { CloseOutlined } from "@ant-design/icons";
import cookie from "react-cookies";
import { api } from "../util";
import { Image } from "antd";

const { TextArea } = Input;// 输入框中的多行输入组件

// 定义推荐标签按钮数据
const buttonData = [
  {
    text: "转发未经同意",
    backgroundColor: "#E8F8F5",
    borderColor: "#A2D9CE",
  },
  {
    text: "抄袭，盗图等",
    backgroundColor: "#63e3cb",
    borderColor: "#1b84cf",
  },
  {
    text: "虚假信息，欺诈",
    backgroundColor: "#FEF5E7",
    borderColor: "#F9E79F",
  },
  {
    text: "侮辱敏感性字眼",
    backgroundColor: "#F9EBEA",
    borderColor: "#F5B7B1",
  },
  {
    text: "宣扬色情暴力",
    backgroundColor: "#FFEEE7",
    borderColor: "#ca364f",
  },

  {
    text: "政治敏感",
    backgroundColor: "#a7efef",
    borderColor: "#184ec3",
  },
];

// 审核卡片组件定义
const TravelLogCard = ({ logs, index, setTravelLogs, onDelete }) => {
  const [newState, setNewState] = useState(null);// 记录当前欲设置的状态
  const [instruction, setInstruction] = useState(""); // 审核意见
  // 抽屉
  const [open, setOpen] = useState(false);// 控制抽屉显示状态
  // 控制抽屉开关
  const showDrawer = () => {
    setOpen(true);
  };
  const onClose = () => {
    setOpen(false);
  };

  // 获取cookie中的用户角色
  const userRole = cookie.load("role");

  // 审核通过
  const handlePassState = async (newState) => {
    setTravelLogs(index, newState);
    await api
      .put(`/auditManagement/stateUpdate/${logs._id}`, {
        state: newState,
      })
      .then((response) => {
        console.log("游记状态更新成功:", response.data);
      })
      .catch((error) => {
        console.error("游记状态更新失败:", error);
      });
  };

  // 审核不通过（弹出填写理由抽屉）
  const handleForbiddenState = async (newState) => {
    setNewState(newState);
    showDrawer();
  };

  // 提交拒绝理由
  const handleSubmitInstruction = async () => {
    setTravelLogs(index, newState, instruction);// 父组件状态更新
    if (instruction === "") {
      message.error("请填写拒绝理由");
      return;
    }
    await api
      .put(`/auditManagement/stateUpdate/${logs._id}`, {
        state: newState,
        instruction: instruction,
      })
      .then((response) => {
        console.log("拒绝理由提交成功:", response.data);
      })
      .catch((error) => {
        console.error("拒绝理由提交失败:", error);
      });
    setInstruction("");
    onClose();
  };

  // 执行逻辑删除
  const handleDelete = async () => {
    onDelete(index);
    await api
      .delete(`/auditManagement/travelLogDelete/${logs._id}`)
      .then((response) => {
        console.log("删除成功:", response.data);
        message.success("删除成功");
      })
      .catch((error) => {
        console.error("删除失败:", error);
        message.error("删除失败");
      });
  };

  // 拒绝理由标签选择
  const handleButtonClick = (text) => {
    setInstruction(instruction + text + "；");
  };

  // 图片展示：多张图使用轮播器
  const imageShow = (imagesUrl) => {
    if (imagesUrl.length > 1) {
      return (
        <Carousel style={{ width: 150, height: 150 }}>
          {imagesUrl.map((image, index) => (
            <div key={index}>
              <img
                src={image}
                alt="example"
                style={{ width: "100%", height: "100%", borderRadius: 10 }}
              />
            </div>
          ))}
        </Carousel>
      );
    } else {
      return (
        <div style={{ width: 150, height: 150 }}>
          <img
            src={imagesUrl[0]}
            alt="LogImages"
            style={{ width: "100%", height: "100%", borderRadius: 10 }}
          />
        </div>
      );
    }
  };

  const [detailOpen, setDetailOpen] = useState(false); // 控制详情抽屉
  const [rejectOpen, setRejectOpen] = useState(false); // 控制拒绝理由抽屉

  // 组件渲染部分
  return (
    <div>
      <Card
        hoverable
        // style={{ width: '100%' }}
        styles={{ body: { padding: 20, overflow: "hidden" } }}
      >
        {/* 管理员才可以删除卡片 */}
        {userRole !== "audit" && (
          <Flex justify="flex-end">
            <CloseOutlined
              style={{ fontSize: "20px", color: "gray" }}
              onClick={() => {
                handleDelete();
              }}
            />
          </Flex>
        )}
        <Flex justify="space-between" align="center">
          {/* 对图片进行判断，超过一张的使用走马灯 */}
          {imageShow(logs.imagesUrl)}

          {/* 游记文字区域 */}
          <Flex vertical style={{ marginLeft: 20, flex: 5 }}>
            <Typography.Title level={3} style={{ margin: 0, padding: "4px" }}>
              {logs.title}
            </Typography.Title>
            <div
              style={{
                maxHeight: "120px",
                overflowY: "auto",
              }}
            >
              <Typography.Paragraph style={{ fontSize: 18 }}>
                {logs.content}
              </Typography.Paragraph>
            </div>

            {/* 操作按钮与说明 */}
            <Flex justify="space-between" style={{ marginTop: 10 }}>
              <div style={{ marginTop: 10 }}>
                <Typography.Paragraph style={{ fontSize: 14 }}>
                  {logs.instruction ? `说明： ${logs.instruction}` : null}
                </Typography.Paragraph>
              </div>
              <Flex>
                <Button
                  type="primary"
                  style={{ marginRight: 10 ,backgroundColor: '#34db55', borderColor: '#a7efef'}}
                  onClick={() => {
                    handlePassState("已通过");
                  }}
                >
                  通过
                </Button>
                <Button
                    onClick={() => setRejectOpen(true)}
                >
                  拒绝
                </Button>
              </Flex>
            </Flex>

            {/* 编辑时间 */}
            <div>
              <Typography.Paragraph style={{ fontSize: 14 }}>
                {logs.editTime}
              </Typography.Paragraph>
            </div>
          </Flex>

          {/* 审核状态圆圈 */}
          <Flex justify="center" align="center" style={{ flex: 1 }}>
            <div
              style={{
                width: 70,
                height: 70,
                textAlign: "center",
                border: `4px solid ${
                  logs.state === "待审核"
                    ? "#ccc"
                    : logs.state === "已通过"
                    ? "#34db55"
                    : "#C0392B "
                }`,
                borderRadius: "50%",
                boxSizing: "border-box",
              }}
            >
              <Typography
                style={{
                  color:
                    logs.state === "待审核"
                      ? "gray"
                      : logs.state === "已通过"
                      ? "#34db55"
                      : "#A93226 ",

                  padding: 5,
                  marginTop: 15,
                  fontSize: 16,
                }}
              >
                {logs.state}
              </Typography>
            </div>
          </Flex>

          {/*抽屉，查看详情*/}
          <Button onClick={() => setDetailOpen(true)}>查看详情</Button>
          <Drawer open={detailOpen} onClose={() => setDetailOpen(false)} width={600}>

            {/*{imageShow(logs.imagesUrl)}*/}
            <Image.PreviewGroup>
              {logs.imagesUrl.map((img, idx) => (
                  <Image
                      key={idx}
                      src={img}
                      width={120}
                      style={{ marginRight: 8, marginBottom: 8 }}
                      alt={`游记图片${idx + 1}`}
                  />
              ))}
            </Image.PreviewGroup>
            <Typography.Title level={3}>{logs.title}</Typography.Title>
            <Typography.Paragraph>{logs.content}</Typography.Paragraph>
            <Typography.Paragraph>
              {logs.instruction ? `审核说明：${logs.instruction}` : null}
            </Typography.Paragraph>
          </Drawer>


        </Flex>
      </Card>

      {/* 抽屉 - 拒绝理由填写 */}
      <Drawer
          title={
            <div style={{ fontWeight: "normal", fontSize: 14 }}>
              请填写拒绝理由
            </div>
          }
          placement="right"
          // closable={false}
          onClose={() => setRejectOpen(false)}
          open={rejectOpen}
          getContainer={false}
          width={"50%"}
          extra={
            <Space>
              <Button onClick={handleSubmitInstruction} type="primary">
                提交
              </Button>
            </Space>
          }
      >
        {/* 理由输入框 */}
        <div style={{ marginBottom: 15 }}>
          <TextArea
            rows={3}
            value={instruction}
            rules={[{ required: true, message: "此项不能为空" }]}
            onChange={(e) => setInstruction(e.target.value)}
          />
        </div>

        {/* 推荐理由按钮 */}
        <Row gutter={[12, 12]}>
          {buttonData.map((button, index) => (
            <Col span={6} key={index}>
              <Button
                type="text"
                style={{
                  backgroundColor: button.backgroundColor,
                  borderColor: button.borderColor,
                  transition: "background-color 0.3s, border-color 0.3s",
                }}
                onClick={() => handleButtonClick(button.text)}
              >
                {button.text}
              </Button>
            </Col>
          ))}
        </Row>
      </Drawer>
    </div>
  );
};
export default TravelLogCard;
