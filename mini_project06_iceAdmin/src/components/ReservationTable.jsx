import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Popconfirm,
  message,
  Select,
  Space,
  Tooltip,
  Card,
  Input,
  InputNumber,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  DownOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { supabase } from "../js/supabase.js";
import "../css/reservation.module.css";
import CleanerAssignModal from "./CleanerAssignModal";

const { Option } = Select;

const ReservationTable = ({ 
  data, 
  onEdit, 
  onDelete, 
  onDataChange,
  onFilterStateChange,
  currentFilterState 
}) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [pendingUpdate, setPendingUpdate] = useState({
    res_no: null,
    field: null,
    value: null,
  });
  const [searchText, setSearchText] = useState("");
  const [cleaners, setCleaners] = useState([]);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetchCleaners();
  }, []);

  const fetchCleaners = async () => {
    try {
      const { data: memberData, error } = await supabase
        .from('member')
        .select('nm, id, tel')  // 기사이름, 이메일주소, 전화번호만 선택
        .eq('auth', 2);

      if (error) throw error;
      setCleaners(memberData);
    } catch (error) {
      console.error('Error fetching cleaners:', error);
    }
  };

  const handleStateTab = (stateValue) => {
    onFilterStateChange(stateValue);
  };

  const stateOptions = [
    { value: "all", label: "전체" },
    { value: "1", label: "신규예약" },
    { value: "2", label: "결제대기" },
    { value: "3", label: "결제완료" },
    { value: "4", label: "기사배정" },
    { value: "5", label: "청소완료" },
    { value: "6", label: "예약취소" },
  ];

  const handleUpdate = async (res_no, field, value) => {
    try {
      const updatePayload = { [field]: value };

      const { error } = await supabase
        .from("reservation")
        .update(updatePayload)
        .eq("res_no", res_no);

      if (error) throw error;

      onDataChange();
      message.success("수정 완료!", 2);
    } catch (error) {
      console.error(`Error updating ${field}:`, error.message);
      message.error(`수정 실패: ${error.message}`, 3);
    }
    setPendingUpdate({ res_no: null, field: null, value: null });
  };

  const handleChange = (res_no, field, value) => {
    setPendingUpdate({ res_no, field, value });
  };

  const confirmUpdate = () => {
    const { res_no, field, value } = pendingUpdate;
    if (res_no && field && value !== null) {
      handleUpdate(res_no, field, value);
    }
  };

  const cancelUpdate = () => {
    setPendingUpdate({ res_no: null, field: null, value: null });
  };

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const handlePriceChange = async (res_no, newPrice) => {
    const record = data.find((item) => item.res_no === res_no);
    if (record && [3, 4, 5].includes(record.state)) {
      message.error("결제완료, 기사배정, 청소완료 상태에서는 금액을 수정할 수 없습니다.");
      return;
    }

    try {
      const { error } = await supabase
        .from("reservation")
        .update({ price: newPrice })
        .eq("res_no", res_no);

      if (error) throw error;
      message.success({
        content: "금액이 업데이트되었습니다.",
        key: "reservation-price",
        duration: 2,
      });
      onDataChange();
    } catch (error) {
      message.error("금액 업데이트 실패: " + error.message);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("ko-KR").format(price || 0);
  };

  const handleAssignClick = (record) => {
    if (record.state === 5) {
      message.warning('청소완료 상태에서는 기사 배정을 변경할 수 없습니다.');
      return;
    }
    setSelectedReservation(record);
    setAssignModalVisible(true);
  };

  const handleAssignSuccess = () => {
    onDataChange();
  };

  const columns = [
    {
      title: <div style={{ textAlign: "center" }}>NO</div>,
      dataIndex: "res_no",
      key: "res_no",
      width: 50,
      responsive: ["xs", "sm", "md", "lg"],
      render: (text) => {
        return <div style={{ textAlign: "center" }}>{text}</div>;
      },
      defaultSortOrder: "ascend",
    },    
    {
      title: <div style={{ textAlign: "center" }}>이름</div>,
      dataIndex: ["customer", "name"],
      key: "name",
      width: 80,
      render: (text) => {
        return <div style={{ textAlign: "center" }}>{text}</div>;
      },
    },
    {
      title: <div style={{ textAlign: "center" }}>연락처</div>,
      dataIndex: ["customer", "phone"],
      key: "phone",
      width: 120,
      responsive: ["md", "lg"],
      render: (text) => {
        return <div style={{ textAlign: "center" }}>{text}</div>;
      },
    },
    {
      title: <div style={{ textAlign: "center" }}>주소</div>,
      dataIndex: "addr",
      key: "addr",
      width: 250,
      responsive: ["lg"],
    },
    {
      title: <div style={{ textAlign: "center" }}>모델명</div>,
      dataIndex: "model",
      key: "model",
      width: 80,
      responsive: ["lg"],
    },
    {
      title: <div style={{ textAlign: "center" }}>예약일</div>,
      dataIndex: "date",
      key: "date",
      width: 90,
      render: (text) => {
        const formattedDate = dayjs(text).format("YYYY-MM-DD");
        return <div style={{ textAlign: "center" }}>{formattedDate}</div>;
      },
      sortDirections: ["ascend", "descend"],
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
      responsive: ["xs", "sm", "md", "lg"],
    },

    {
      title: <div style={{ textAlign: "center" }}>예약 시간</div>,
      dataIndex: "time",
      key: "time",
      width: 80,
      render: (time) => (
        <div style={{ textAlign: "center" }}>{time || "미지정"}</div>
      ),
      responsive: ["md", "lg"],
    },
    {
      title: <div style={{ textAlign: "center" }}>정산</div>,
      dataIndex: "price",
      key: "price",
      width: 130,
      render: (price, record) => {
        const isEditable = ![3, 4, 5].includes(record.state); // 결제완료(3), 기사배정(4), 청소완료(5) 상태가 아닐 때만 수정 가능

        return (
          <div
            style={{
              textAlign: "right",
              padding: "0 8px",
            }}
          >
            {isEditable ? (
              <InputNumber
                style={{ width: "100%" }}
                value={price}
                formatter={(value) => `₩ ${formatPrice(value)}`}
                parser={(value) => value.replace(/[₩\s,]/g, "")}
                onChange={(value) => handlePriceChange(record.res_no, value)}
                min={0}
                step={1000}
                disabled={!isEditable}
              />
            ) : (
              <Tooltip title="결제완료, 기사배정, 청소완료 상태에서는 금액을 수정할 수 없습니다.">
                <span>₩ {formatPrice(price)}</span>
              </Tooltip>
            )}
          </div>
        );
      },
    },
    {
      title: <div style={{ textAlign: "center" }}>상태</div>,
      dataIndex: "state",
      key: "state",
      width: 120,
      onFilter: (value, record) => record.state === value,
      render: (state) => {
        const stateConfig = {
          1: { text: "신규예약", color: "#4CAF50" },
          2: { text: "결제대기", color: "#FF9800" },
          3: { text: "결제완료", color: "#2196F3" },
          4: { text: "기사배정", color: "#9C27B0" },
          5: { text: "청소완료", color: "#607D8B" },
          6: { text: "예약취소", color: "#F44336" },
        }[state] || { text: "알 수 없음", color: "#999999" };

        return (
          <div
            style={{
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "4px 12px",
                borderRadius: "12px",
                fontSize: "13px",
                color: stateConfig.color,
                backgroundColor: `${stateConfig.color}15`,
                border: `1px solid ${stateConfig.color}30`,
                whiteSpace: "nowrap",
              }}
            >
              {stateConfig.text}
            </span>
          </div>
        );
      },
    },
    {
      title: <div style={{ textAlign: "center" }}>담당기사</div>,
      dataIndex: "gisa_email",
      key: "gisa_email",
      width: 130,
      render: (gisa_email, record) => {
        const assignedCleaner = cleaners.find(c => c.id === gisa_email);
        const isAssignable = record.state === 3; // 결제완료 상태일 때만 기사 배정 가능
        const canChange = record.state >= 3 && record.state < 5; // 결제완료 이상, 청소완료 미만에서 기사 변경 가능

        if (record.state >= 4 && record.state < 5) {  // 기사배정 상태
          return (
            <div style={{ textAlign: "center" }}>
              <div style={{ marginBottom: 4 }}>
                {assignedCleaner ? assignedCleaner.nm : "미지정"}
              </div>
              <Button
                type="default"
                size="small"
                onClick={() => handleAssignClick(record)}
              >
                기사변경
              </Button>
            </div>
          );
        }

        if (record.state === 5) {  // 청소완료 상태
          return (
            <div style={{ textAlign: "center" }}>
              <div style={{ marginBottom: 4 }}>
                {assignedCleaner ? assignedCleaner.nm : "미지정"}
              </div>
              <div style={{ fontSize: '12px', color: '#999' }}>
                변경 불가
              </div>
            </div>
          );
        }

        return (
          <div style={{ textAlign: "center" }}>
            {isAssignable ? (
              <Button
                type="primary"
                size="small"
                onClick={() => handleAssignClick(record)}
              >
                기사 배정
              </Button>
            ) : (
              <span>-</span>
            )}
          </div>
        );
      },
    },
    {
      title: <div style={{ textAlign: "center" }}>관리</div>,
      key: "action",
      width: 100,
      render: (_, record) => (
        <>
          <Button
            onClick={() => onEdit(record)}
            style={{ marginRight: "4px", color: "#1890ff" }}
            size={isMobile ? "small" : "middle"}
          >
            수정하기
          </Button>
        </>
      ),
      responsive: ["xs", "sm", "md", "lg"],
    },
  ];

  if (isMobile) {
    return (
      <div style={{ padding: "0 8px" }}>
        {/* 필터 섹션 */}
        <div className="custom-filter-section">
          <div className="custom-tab-group">
            {stateOptions.map((option) => (
              <button
                key={option.value}
                className={`custom-tab-btn${
                  currentFilterState === option.value ? " active" : ""
                }`}
                onClick={() => handleStateTab(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="custom-search-group">
            <Input
              className="custom-search-input"
              placeholder="검색어를 입력해주세요."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined style={{ color: "#bdbdbd" }} />}
              onPressEnter={() => handleSearch(searchText)}
              allowClear
            />
          </div>
        </div>

        {data.map((record) => (
          <Card
            key={record.res_no}
            style={{ marginBottom: 16, borderRadius: 8 }}
            title={`예약번호: ${record.res_no}`}
            extra={
              <div>
                <Button
                  icon={<EditOutlined />}
                  onClick={() => onEdit(record)}
                  style={{ marginRight: 8, color: "#1890ff" }}
                  size="small"
                />
                <Popconfirm
                  title="정말 삭제하시겠습니까?"
                  onConfirm={() => onDelete(record.res_no)}
                >
                  <Button icon={<DeleteOutlined />} danger size="small" />
                </Popconfirm>
              </div>
            }
          >
            <div style={{ marginBottom: 10 }}>
              <strong>이름:</strong> {record.customer?.name || "N/A"}
            </div>
            <div style={{ marginBottom: 10 }}>
              <strong>연락처:</strong> {record.customer?.phone || "N/A"}
            </div>
            <div style={{ marginBottom: 10 }}>
              <strong>예약 날짜:</strong>{" "}
              {dayjs(record.date).format("YYYY-MM-DD")}
            </div>
            <div>
              <strong>예약 시간:</strong>{" "}
              <>
                <Select
                  value={record.time || "미지정"}
                  onChange={(value) =>
                    handleChange(record.res_no, "time", value)
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  style={{ width: 150, marginBottom: "10px" }}
                  suffixIcon={
                    <DownOutlined
                      style={{ fontSize: "12px", color: "#1890ff" }}
                    />
                  }
                >
                  <Option value="10:00">10:00</Option>
                  <Option value="12:00">12:00</Option>
                  <Option value="14:00">14:00</Option>
                  <Option value="16:00">16:00</Option>
                </Select>
                {pendingUpdate.res_no === record.res_no &&
                  pendingUpdate.field === "time" &&
                  pendingUpdate.value !== null && (
                    <Popconfirm
                      title="수정하시겠습니까?"
                      onConfirm={confirmUpdate}
                      onCancel={cancelUpdate}
                      okText="예"
                      cancelText="아니오"
                      open={true}
                    />
                  )}
              </>
            </div>
            <div>
              <strong>상태:</strong>{" "}
              <>
                <Select
                  value={
                    {
                      1: "신규예약",
                      2: "결제대기",
                      3: "결제완료",
                      4: "기사배정",
                      5: "청소완료",
                      6: "예약취소",
                    }[record.state] || "알 수 없음"
                  }
                  onChange={(value) =>
                    handleChange(record.res_no, "state", value)
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  style={{ width: 150, marginBottom: "10px" }}
                  suffixIcon={
                    <DownOutlined
                      style={{ fontSize: "12px", color: "#1890ff" }}
                    />
                  }
                >
                  <Option value={1}>신규예약</Option>
                  <Option value={2}>결제대기</Option>
                  <Option value={3}>결제완료</Option>
                  <Option value={4}>기사배정</Option>
                  <Option value={5}>청소완료</Option>
                  <Option value={6}>예약취소</Option>
                </Select>
                {pendingUpdate.res_no === record.res_no &&
                  pendingUpdate.field === "state" &&
                  pendingUpdate.value !== null && (
                    <Popconfirm
                      title="수정하시겠습니까?"
                      onConfirm={confirmUpdate}
                      onCancel={cancelUpdate}
                      okText="예"
                      cancelText="아니오"
                      open={true}
                    />
                  )}
              </>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="reservation-table-container">
      {/* 필터 섹션 */}
      <div className="custom-filter-section">
        <div className="custom-tab-group">
          {stateOptions.map((option) => (
            <button
              key={option.value}
              className={`custom-tab-btn${
                currentFilterState === option.value ? " active" : ""
              }`}
              onClick={() => handleStateTab(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="custom-search-group">
          <Input
            className="custom-search-input"
            placeholder="검색어를 입력해주세요."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined style={{ color: "#bdbdbd" }} />}
            onPressEnter={() => handleSearch(searchText)}
            allowClear
          />
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="res_no"
        pagination={false}
        scroll={{ x: "max-content" }}
        size="middle"
        tableLayout="fixed"
      />

      <CleanerAssignModal
        visible={assignModalVisible}
        onCancel={() => setAssignModalVisible(false)}
        reservation={selectedReservation}
        onAssign={handleAssignSuccess}
        onDataChange={onDataChange}
      />
    </div>
  );
};

export default ReservationTable;
