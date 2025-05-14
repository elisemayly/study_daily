import React, { useState, useEffect } from "react";
import { DownOutlined } from "@ant-design/icons";
import {
  Row,
  Col,
  Flex,
  Input,
  Dropdown,
  Typography,
  Space,
  Pagination,
} from "antd";
import TravelLogCard from "../component/TravelLogCard";
import { api } from "../util";

const { Search } = Input;

// 状态筛选下拉菜单选项
const items = [
  {
    key: "1",
    label: "待审核",
  },
  {
    key: "2",
    label: "已通过",
  },
  {
    key: "3",
    label: "未通过",
  },
  {
    key: "4",
    label: "全部",
  },
];

// 请求状态常量
const RequestStatus = {
  IDLE: "IDLE",// 初始状态
  PENDING: "PENDING",// 加载中
  SUCCESS: "SUCCESS",// 成功获取数据
  ERROR: "ERROR",// 出错
};

const TravelLogList = () => {
  const [selectState, setSelectState] = useState("");// 当前选择的审核状态
  const [searchText, setSearchText] = useState("");// 当前搜索关键字
  const [travelLogs, setTravelLogs] = useState(null);// 所有游记数据

  const [currentPage, setCurrentPage] = useState(1);// 当前页码
  const [pageSize] = useState(4); // 每页显示4条待审核的内容

  const startIndex = (currentPage - 1) * pageSize; // 计算起始索引
  const endIndex = currentPage * pageSize; // 计算结束索引
  const currentData = travelLogs?.slice(startIndex, endIndex); // 获取当前页的数据

  const [requestStatus, setRequestStatus] = useState(RequestStatus.IDLE);// 当前请求状态

  // 状态改变函数
  const handleStateChange = (index, state, instruction) => {
    // console.log("状态改变", index, state, instruction);
    const newTravelLogs = [...travelLogs];
    newTravelLogs[index].state = state;
    newTravelLogs[index].instruction = instruction;
    setTravelLogs(newTravelLogs);// 触发组件更新
  };

  // 处理删除操作
  const handleDelete = (index) => {
    const id = travelLogs[index]._id;
    const updateLogs = travelLogs.filter((log) => log._id !== id);// 过滤掉已删除项
    setTravelLogs(updateLogs);
  }

  // 获取游记数据（根据筛选状态和搜索内容）
  useEffect(() => {
    // 从数据库中拿数据
    const fetchData = async () => {
      try {
        const params = {
          state: selectState,
          searchContent: searchText,
        };
        const response = await api.get("/auditManagement/travelLogs", {
          params,
        });
        // console.log(response.data);
        setTravelLogs(response.data);
        setRequestStatus(RequestStatus.SUCCESS);
      } catch (error) {
        setRequestStatus(RequestStatus.ERROR);
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [searchText, selectState]);// 当筛选状态或搜索内容变动时触发更新


  // 搜索
  const onSearch = async(value) => {
    setSearchText(value);// 设置搜索关键字，触发 useEffect

  };

  // 状态筛选
  const handleSelectState = (item) => {
    const selectedItem = items.find((state) => state.key === item.key);
    setSelectState(selectedItem ? selectedItem.label : "");
  };

  // 切换页面
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // 组件返回渲染内容
  return (
      <div style={{ flex: 1 }}>
        {/* 顶部搜索与筛选栏 */}
        <Flex justify="space-between" style={{ marginBottom: 20 }}>
          {/* 筛选下拉菜单 */}
          <div style={{ flex: 2 }}>
            <Dropdown
                menu={{
                  items,
                  selectable: true,
                  defaultOpenKeys: ["1"],
                  onClick: handleSelectState,
                }}
                placement="bottomLeft"
            >
              <Typography.Link style={{ fontSize: 16 }}>
                <Space>
                  {selectState ? selectState : "游记状态"}
                  <DownOutlined />
                </Space>
              </Typography.Link>
            </Dropdown>
          </div>
          {/* 搜索框 */}
          <div style={{ flex: 6 }}>
            <Search
                placeholder="输入关键词搜索"
                onSearch={onSearch}
                enterButton
                allowClear
                size="large"
                // maxLength={50}
            />
          </div>
        </Flex>
        {/* 游记列表展示 */}
        <Flex vertical>
          {requestStatus === RequestStatus.SUCCESS && (
              <Row gutter={[12, 12]}>
                {currentData.map((log, index) => (
                    <Col span={24} key={index}>
                      <TravelLogCard
                          logs={log}
                          index={index}
                          setTravelLogs={handleStateChange}
                          onDelete={handleDelete}
                      />
                    </Col>
                ))}
              </Row>
          )}
        </Flex>

        {/* 分页组件 */}
        <Flex justify="center">
          {requestStatus === RequestStatus.SUCCESS && (
              <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={travelLogs.length}
                  onChange={handlePageChange}
                  style={{ marginTop: 20, textAlign: "center" }}
              />
          )}
        </Flex>
      </div>
  );
};
export default TravelLogList;
