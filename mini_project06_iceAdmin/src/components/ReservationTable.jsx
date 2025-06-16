import React, { useState, useEffect } from "react";
import { Table, Button, Popconfirm, Card, Select, message } from "antd";
import { EditOutlined, DeleteOutlined, DownOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useMediaQuery } from "react-responsive";
import { supabase } from "../js/supabase.js";

const { Option } = Select;

const ReservationTable = ({ reservations, onEdit, onDelete, onUpdate }) => {
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const [editingCell, setEditingCell] = useState({ res_no: null, field: null });
  const [pendingUpdate, setPendingUpdate] = useState({
    res_no: null,
    field: null,
    value: null,
  });

  const handleUpdate = async (res_no, field, value) => {
    try {
      const updatePayload = { [field]: value };

      const { error } = await supabase
        .from("reservation")
        .update(updatePayload)
        .eq("res_no", res_no);

      if (error) throw error;

      onUpdate();
      message.success("수정 완료!", 2);
    } catch (error) {
      console.error(`Error updating ${field}:`, error.message);
      message.error(`수정 실패: ${error.message}`, 3);
    }
    setEditingCell({ res_no: null, field: null });
    setPendingUpdate({ res_no: null, field: null, value: null });
  };

  const handleChange = (res_no, field, value) => {
    console.log("handleChange called with:", { res_no, field, value });
    setPendingUpdate({ res_no, field, value });
    console.log("Updated pendingUpdate:", { res_no, field, value });
    setEditingCell({ res_no: null, field: null });
  };

  const confirmUpdate = () => {
    const { res_no, field, value } = pendingUpdate;
    if (res_no && field && value !== null) {
      console.log("Confirming update:", { res_no, field, value });
      handleUpdate(res_no, field, value);
    }
  };

  const cancelUpdate = () => {
    setPendingUpdate({ res_no: null, field: null, value: null });
    setEditingCell({ res_no: null, field: null });
  };

  const selectStyle = (width) => ({
    width: width,
    boxSizing: "border-box",
    marginBottom: "10px",
  });

  const columns = [
    {
      title: "No",
      dataIndex: "no",
      key: "no",
      width: 60,
      responsive: ["xs", "sm", "md", "lg"],
      sorter: (a, b) => a.no - b.no,
      defaultSortOrder: "ascend",
    },
    {
      title: "이름",
      dataIndex: ['customer', 'name'],
      key: 'name',
      width: 90,
      sorter: (a, b) => a.customer.name.localeCompare(b.customer.name),
      render: (text) => {
        return (
          <div style={{textAlign: 'center'}}>
            {text}
          </div>
        );
      },
    },
    {
      title: "연락처",
      dataIndex: "tel",
      key: "tel",
      width: 120,
      responsive: ["md", "lg"],
    },
    {
      title: "주소",
      dataIndex: "addr",
      key: "addr",
      width: 200,
      responsive: ["lg"],
    },
    {
      title: "모델명",
      dataIndex: "model",
      key: "model",
      width: 120,
      responsive: ["lg"],
    },
    {
      title: "예약일",
      dataIndex: "date",
      key: "date",
      width: 90,
      render: (text) => dayjs(text).format("YYYY-MM-DD"),
      sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
      sortDirections: ["ascend", "descend"],
      responsive: ["xs", "sm", "md", "lg"],
    },
    {
      title: "상태",
      dataIndex: "state",
      key: "state",
      width: 110,
      filters: [
        { text: "예약대기", value: 1 },
        { text: "배정대기", value: 2 },
        { text: "배정완료", value: 3 },
        { text: "처리중", value: 4 },
        { text: "처리완료", value: 5 },
        { text: "취소", value: 9 },
      ],
      onFilter: (value, record) => record.state === value,
      render: (state, record) => (
        <>
          <Select
            value={
              {
                1: "예약대기",
                2: "배정대기",
                3: "배정완료",
                4: "처리중",
                5: "처리완료",
                9: "취소",
              }[state] || "알 수 없음"
            }
            onChange={(value) => handleChange(record.res_no, "state", value)}
            style={{ width: 100 }}
            dropdownStyle={{ width: 100 }}
            suffixIcon={
              <DownOutlined style={{ fontSize: "12px", color: "#1890ff" }} />
            }
          >
            <Option value={1}>예약대기</Option>
            <Option value={2}>배정대기</Option>
            <Option value={3}>배정완료</Option>
            <Option value={4}>처리중</Option>
            <Option value={5}>처리완료</Option>
            <Option value={9}>취소</Option>
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
      ),
    },
    {
      title: "예약 시간",
      dataIndex: "time",
      key: "time",
      width: 180,
      render: (time, record) => (
        <>
          <Select
            value={time || "미지정"}
            onChange={(value) => handleChange(record.res_no, "time", value)}
            onClick={(e) => {
              e.stopPropagation();
              setEditingCell({ res_no: record.res_no, field: "time" });
            }}
            style={selectStyle(150)}
            dropdownStyle={{ width: 180 }}
            popupClassName="custom-time-dropdown"
            suffixIcon={
              <DownOutlined style={{ fontSize: "12px", color: "#1890ff" }} />
            }
          >
            <Option value="오전 10시 ~ 오후 1시">오전 10시 ~ 오후 1시</Option>
            <Option value="오후 2시 ~ 오후 5시">오후 2시 ~ 오후 5시</Option>
            <Option value="오후 4시 ~ 오후 7시">오후 4시 ~ 오후 7시</Option>
            <Option value="오후 6시 ~ 오후 9시">오후 6시 ~ 오후 9시</Option>
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
      ),
      responsive: ["md", "lg"],
    },
    {
      title: "관리",
      key: "action",
      width: 100,
      render: (_, record) => (
        <>
          <Button
            onClick={() => onEdit(record)}
            style={{ marginRight:'4px', color: "#1890ff" }}
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
        {reservations.map((record) => (
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
            <p style={{ marginBottom: 10 }}>
              <strong>이름:</strong> {record.customer.name}
            </p>
            <p style={{ marginBottom: 10 }}>
              <strong>예약 날짜:</strong>{" "}
              {dayjs(record.date).format("YYYY-MM-DD")}
            </p>
            <p>
              <strong>예약 시간:</strong>{" "}
              <>
                <Select
                  value={record.time || "미지정"}
                  onChange={(value) =>
                    handleChange(record.res_no, "time", value)
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingCell({ res_no: record.res_no, field: "time" });
                  }}
                  style={selectStyle(150)}
                  dropdownStyle={{ width: 150 }}
                  popupClassName="custom-time-dropdown"
                  suffixIcon={
                    <DownOutlined
                      style={{ fontSize: "12px", color: "#1890ff" }}
                    />
                  }
                >
                  <Option value="오전 10시 ~ 오후 1시">
                    오전 10시 ~ 오후 1시
                  </Option>
                  <Option value="오후 2시 ~ 오후 5시">
                    오후 2시 ~ 오후 5시
                  </Option>
                  <Option value="오후 4시 ~ 오후 7시">
                    오후 4시 ~ 오후 7시
                  </Option>
                  <Option value="오후 6시 ~ 오후 9시">
                    오후 6시 ~ 오후 9시
                  </Option>
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
            </p>
            <p>
              <strong>상태:</strong>{" "}
              <>
                <Select
                  value={
                    {
                      1: "예약대기",
                      2: "배정대기",
                      3: "배정완료",
                      4: "처리중",
                      5: "처리완료",
                      9: "취소",
                    }[record.state] || "알 수 없음"
                  }
                  onChange={(value) =>
                    handleChange(record.res_no, "state", value)
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingCell({ res_no: record.res_no, field: "state" });
                  }}
                  style={selectStyle(150)}
                  dropdownStyle={{ width: 150 }}
                  popupClassName="custom-state-dropdown"
                  suffixIcon={
                    <DownOutlined
                      style={{ fontSize: "12px", color: "#1890ff" }}
                    />
                  }
                >
                  <Option value={1}>예약대기</Option>
                  <Option value={2}>배정대기</Option>
                  <Option value={3}>배정완료</Option>
                  <Option value={4}>처리중</Option>
                  <Option value={5}>처리완료</Option>
                  <Option value={9}>취소</Option>
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
            </p>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <Table
        columns={columns}
        dataSource={reservations}
        rowKey="res_no"
        pagination={false}
        scroll={{ x: "max-content" }}
        size="middle"
        tableLayout="fixed"
      />
    </>
  );
};

export default ReservationTable;
