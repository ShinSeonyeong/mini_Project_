import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Popconfirm,
  Input,
  Select,
  InputNumber,
  Tooltip,
  Card,
  Tag,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { supabase } from "../js/supabase.js";
import dayjs from "dayjs";

const { Option } = Select;

const CustomerTable = ({ data, onEdit, onDelete, onDataChange, searchText, onSearchChange }) => {
  const [cleaners, setCleaners] = useState([]);
  const [pendingUpdate, setPendingUpdate] = useState({
    res_no: null,
    field: null,
    value: null,
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    fetchCleaners();
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleResize = () => {
    setIsMobile(window.innerWidth < 768);
  };

  const fetchCleaners = async () => {
    try {
      const { data: memberData, error } = await supabase
        .from("member")
        .select("nm, id")
        .eq("auth", 2);

      if (error) throw error;
      setCleaners(memberData);
    } catch (error) {
      console.error("Error fetching cleaners:", error);
    }
  };

  const handleUpdate = async (res_no, field, value) => {
    try {
      const { error } = await supabase
        .from("customer")
        .update({ [field]: value })
        .eq("res_no", res_no);

      if (error) throw error;
      onDataChange();
      setPendingUpdate({ res_no: null, field: null, value: null });
    } catch (error) {
      console.error("Error updating customer:", error);
    }
  };

  const handleChange = (res_no, field, value) => {
    setPendingUpdate({ res_no, field, value });
  };

  const confirmUpdate = () => {
    if (pendingUpdate.res_no && pendingUpdate.field !== null) {
      handleUpdate(
        pendingUpdate.res_no,
        pendingUpdate.field,
        pendingUpdate.value
      );
    }
  };

  const cancelUpdate = () => {
    setPendingUpdate({ res_no: null, field: null, value: null });
  };

  const handleSearch = () => {
    // 검색 기능은 부모 컴포넌트에서 처리
    if (onSearchChange) {
      onSearchChange(searchText);
    }
  };

  const formatPhoneNumber = (value) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, "");
    if (phoneNumber.length <= 3) {
      return phoneNumber;
    } else if (phoneNumber.length <= 7) {
      return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`;
    } else {
      return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(
        3,
        7
      )}-${phoneNumber.slice(7, 11)}`;
    }
  };

  const handlePhoneNumberChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    e.target.value = formatted;
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
      defaultSortOrder: "descend",
      sorter: (a, b) => b.res_no - a.res_no,
    },
    {
      title: <div style={{ textAlign: "center" }}>이름</div>,
      dataIndex: "name",
      key: "name",
      width: 80,
      render: (text) => {
        return <div style={{ textAlign: "center" }}>{text}</div>;
      },
    },
    {
      title: <div style={{ textAlign: "center" }}>연락처</div>,
      dataIndex: "phone",
      key: "phone",
      width: 120,
      responsive: ["md", "lg"],
      render: (text) => {
        return <div style={{ textAlign: "center" }}>{text}</div>;
      },
    },
    {
      title: <div style={{ textAlign: "center" }}>이메일</div>,
      dataIndex: "email",
      key: "email",
      width: 200,
      responsive: ["lg"],
      render: (text) => {
        return <div style={{ textAlign: "center" }}>{text}</div>;
      },
    },
    {
      title: <div style={{ textAlign: "center" }}>주소</div>,
      dataIndex: "addr",
      key: "addr",
      width: 300,
      responsive: ["lg"],
      render: (text) => {
        return <div>{text}</div>;
      },
    },
    {
      title: <div style={{ textAlign: "center" }}>등록일</div>,
      dataIndex: "created_at",
      key: "created_at",
      width: 100,
      render: (text) => {
        const formattedDate = dayjs(text).format("YYYY-MM-DD");
        return <div style={{ textAlign: "center" }}>{formattedDate}</div>;
      },
      sortDirections: ["ascend", "descend"],
      responsive: ["md", "lg"],
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
        <div className="custom-search-group">
          <Input
            className="custom-search-input"
            placeholder="검색어를 입력해주세요."
            value={searchText}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            prefix={<SearchOutlined style={{ color: "#bdbdbd" }} />}
            onPressEnter={handleSearch}
            allowClear
          />
        </div>

        {data.map((record) => (
          <Card
            key={record.res_no}
            style={{ marginBottom: 16, borderRadius: 8 }}
            title={`고객번호: ${record.res_no}`}
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
              <strong>이름:</strong> {record.name || "N/A"}
            </div>
            <div style={{ marginBottom: 10 }}>
              <strong>연락처:</strong> {record.phone || "N/A"}
            </div>
            <div style={{ marginBottom: 10 }}>
              <strong>이메일:</strong> {record.email || "N/A"}
            </div>
            <div style={{ marginBottom: 10 }}>
              <strong>주소:</strong> {record.addr || "N/A"}
            </div>
            <div>
              <strong>등록일:</strong>{" "}
              {dayjs(record.created_at).format("YYYY-MM-DD")}
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="customer-table-container">
      <div className="custom-search-group">
        <Input
          className="custom-search-input"
          placeholder="검색어를 입력해주세요."
          value={searchText}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          prefix={<SearchOutlined style={{ color: "#bdbdbd" }} />}
          onPressEnter={handleSearch}
          allowClear
        />
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
    </div>
  );
};

export default CustomerTable;
 