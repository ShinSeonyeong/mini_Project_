import React, { useState, useEffect } from "react";
import {
  Button,
  Table,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Switch,
  Space,
  message,
  Upload,
  Radio,
  Checkbox,
  Divider,
  Breadcrumb,
  Card,
  Pagination,
  Row,
  Col,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import locale from "antd/es/date-picker/locale/ko_KR";
import styles from "../css/popup.module.css";
import {
  getPopups,
  addPopup,
  updatePopup,
  deletePopup,
} from "../js/supabasePopup";
import { useNavigate } from "react-router-dom";

const { RangePicker } = DatePicker;
const { Option } = Select;

const PopupManage = () => {
  const [popups, setPopups] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPopup, setEditingPopup] = useState(null);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const popupNavi = useNavigate();

  // 팝업 데이터 로드
  useEffect(() => {
    fetchPopups();
  }, []);

  const fetchPopups = async () => {
    try {
      setTableLoading(true);
      const data = await getPopups();
      setPopups(data);
    } catch (error) {
      message.error("팝업 목록을 불러오는데 실패했습니다.");
      console.error("팝업 로드 실패:", error);
    } finally {
      setTableLoading(false);
    }
  };

  // 이미지 업로드 전 처리
  const beforeUpload = (file) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("이미지 파일만 업로드 가능합니다!");
      return false;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error("이미지 크기는 2MB 이하여야 합니다!");
      return false;
    }
    return true;
  };

  // 이미지 업로드 처리
  const handleUpload = (info) => {
    const { file } = info;

    if (file.status === "uploading") {
      setFileList([file]);
      return;
    }
    if (file.status === "done") {
      const reader = new FileReader();
      reader.readAsDataURL(file.originFileObj);
      reader.onload = () => {
        form.setFieldsValue({ image_url: reader.result });
        setFileList([
          {
            uid: file.uid,
            name: file.name,
            status: "done",
            url: reader.result,
          },
        ]);
      };
    }
  };

  // 팝업 추가/수정
  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      const popupData = {
        title: values.title,
        display_type: 'popup',
        display_status: 'show',
        start_date: values.date_range[0].toISOString(),
        end_date: values.date_range[1].toISOString(),
        display_environment: ['desktop'],
        image_url: values.image_url,
        link_url: values.link_url || '',
        close_option: values.close_option || ['today', 'close'],
        position_x: values.position_x || '50%',
        position_y: values.position_y || '50%',
        width: values.width || '500px',
        height: values.height || 'auto',
      };

      let updatedPopup;
      if (editingPopup) {
        updatedPopup = await updatePopup(editingPopup.id, popupData);
        // 현재 팝업 목록에서 수정된 팝업을 찾아 업데이트
        setPopups(prevPopups => 
          prevPopups.map(popup => 
            popup.id === editingPopup.id ? { ...popup, ...updatedPopup } : popup
          )
        );
        message.success('팝업이 수정되었습니다.');
      } else {
        updatedPopup = await addPopup(popupData);
        // 새 팝업을 목록 맨 앞에 추가
        setPopups(prevPopups => [updatedPopup, ...prevPopups]);
        message.success('새 팝업이 추가되었습니다.');
      }

      setIsModalOpen(false);
      form.resetFields();
      setEditingPopup(null);
      setFileList([]);
    } catch (error) {
      message.error('팝업 저장에 실패했습니다.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 선택된 팝업 삭제
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning("삭제할 팝업을 선택해주세요.");
      return;
    }

    Modal.confirm({
      title: "팝업 삭제",
      content: `선택한 ${selectedRowKeys.length}개의 팝업을 삭제하시겠습니까?`,
      onOk: async () => {
        try {
          setLoading(true);
          for (const id of selectedRowKeys) {
            await deletePopup(id);
          }
          message.success("선택한 팝업이 삭제되었습니다.");
          setSelectedRowKeys([]);
          fetchPopups();
        } catch (error) {
          message.error("팝업 삭제에 실패했습니다.");
          console.error(error);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // 팝업 수정 모달 열기
  const handleEdit = (popup) => {
    setEditingPopup(popup);
    form.setFieldsValue({
      title: popup.title,
      date_range: [dayjs(popup.start_date), dayjs(popup.end_date)],
      position_x: popup.position_x,
      position_y: popup.position_y,
      width: popup.width,
      height: popup.height,
      link_url: popup.link_url || '',
      close_option: popup.close_option || ['today', 'close'],
    });
    if (popup.image_url) {
      setFileList([
        {
          uid: '-1',
          name: '팝업 이미지',
          status: 'done',
          url: popup.image_url,
        },
      ]);
    }
    setIsModalOpen(true);
  };

  const columns = [
    {
      title: <div style={{ textAlign: "center" }}>제목</div>,
      dataIndex: "title",
      width: 100,
      key: "title",
    },
    {
      title: <div style={{ textAlign: "center" }}>노출기간</div>,
      key: "dateRange",
      width: 300,
      render: (_, record) => (
        <div>
          {dayjs(record.start_date).format("YYYY-MM-DD HH:mm")} ~{" "}
          {dayjs(record.end_date).format("YYYY-MM-DD HH:mm")}
        </div>
      ),
    },
    // {
    //   title: <div style={{ textAlign: "center" }}>상태</div>,
    //   dataIndex: "display_status",
    //   width: 100,
    //   align: "center",
    //   key: "display_status",
    //   render: (status) => <Switch checked={status === "show"} disabled />,
    // },
    // {
    //   title: <div style={{ textAlign: "center" }}>유형</div>,
    //   dataIndex: "display_type",
    //   width: 100,
    //   align: "center",
    //   key: "display_type",
    //   render: (type) => (type === "popup" ? "팝업" : "배너"),
    // },
    {
      title: <div style={{ textAlign: "center" }}>관리</div>,
      key: "action",
      width: 100,
      align: "center",
      render: (_, record) => (
        <Button
          type="default"
          onClick={() => handleEdit(record)}
          style={{ color: "#1890ff" }}
        >
          수정하기
        </Button>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  return (
    <div className={styles.content}>
      <div>
        <Breadcrumb
          separator=">"
          items={[
            {
              title: "Home",
            },
            {
              title: "팝업관리",
              href: "",
              onClick: (e) => {
                e.preventDefault();
                popupNavi("/popup");
              },
            },
          ]}
        />
      </div>

      <div className={styles.contentContainer}>
        <Table
          columns={columns}
          dataSource={popups}
          rowKey="id"
          loading={tableLoading}
          rowSelection={rowSelection}
          pagination={false}
        />

        <div className={styles.bottomContainer}>
          <div className={styles.pagination}>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={popups.length}
              onChange={(page) => setCurrentPage(page)}
              showSizeChanger={false}
            />
          </div>
          <div className={styles.rightButtons}>
            <Button
              danger
              onClick={handleBatchDelete}
              // disabled={selectedRowKeys.length === 0}
              style={{ marginRight: 8 }}
            >
              선택삭제
            </Button>
            <Button
              type="primary"
              onClick={() => {
                setEditingPopup(null);
                form.resetFields();
                setFileList([]);
                setIsModalOpen(true);
              }}
            >
              팝업등록
            </Button>
          </div>
        </div>
      </div>

      <Modal
        title={editingPopup ? "팝업 수정" : "팝업 등록"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
          setEditingPopup(null);
          setFileList([]);
        }}
        width={800}
        footer={null}
        destroyOnHidden={true}
      >
        <Card size="small" className={styles.formCard}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              display_type: "popup",
              display_status: "show",
              close_option: ["today", "close"],
              position_x: "50%", // 화면 중앙
              position_y: "50%", // 화면 중앙
              width: "500px", // 평균적인 너비로 조정
              height: "auto", // 이미지 비율에 따라 자동 조정
            }}
          >
            <Form.Item
              name="title"
              label="제목"
              rules={[{ required: true, message: "제목을 입력해주세요" }]}
            >
              <Input placeholder="관리를 위한 이름을 입력합니다." />
            </Form.Item>

            {/* <Form.Item name="display_status" label="노출 상태">
              <Radio.Group>
                <Radio value="show">노출함</Radio>
                <Radio value="hide">노출안함</Radio>
              </Radio.Group>
            </Form.Item> */}

            <Form.Item
              name="date_range"
              label="기간"
              rules={[{ required: true, message: "노출 기간을 선택해주세요" }]}
            >
              <RangePicker
                locale={locale}
                showTime={{ format: "HH:mm" }}
                format="YYYY-MM-DD HH:mm"
              />
            </Form.Item>

            <Divider>팝업 위치 및 크기</Divider>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="position_x"
                  label="팝업 X좌표"
                  extra="예: 50% 또는 100px"
                >
                  <Input placeholder="50%" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="position_y"
                  label="팝업 Y좌표"
                  extra="예: 50% 또는 100px"
                >
                  <Input placeholder="50%" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="width"
                  label="팝업 너비"
                  extra="예: 400px, 80% 등"
                >
                  <Input placeholder="400px" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="height"
                  label="팝업 높이"
                  extra="예: auto, 300px 등"
                >
                  <Input placeholder="auto" />
                </Form.Item>
              </Col>
            </Row>

            <Divider>팝업이미지</Divider>

            <Form.Item
              name="image_url"
              extra="권장 해상도: 600 x 600px, 최소 해상도: 350 x 350px, 최대 해상도: 1000 x 650px"
            >
              <Upload
                listType="picture-card"
                maxCount={1}
                beforeUpload={beforeUpload}
                onChange={handleUpload}
                fileList={fileList}
                onRemove={() => {
                  form.setFieldsValue({ image_url: undefined });
                  setFileList([]);
                }}
                customRequest={({ file, onSuccess }) => {
                  setTimeout(() => {
                    onSuccess("ok");
                  }, 0);
                }}
              >
                {fileList.length === 0 && (
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>이미지 업로드</div>
                  </div>
                )}
              </Upload>
            </Form.Item>

            {/* <Form.Item name="close_option" label="팝업 하단 닫기 설정">
              <Checkbox.Group>
                <Checkbox value="today">오늘 하루 다시 보지 않기</Checkbox>
                <Checkbox value="close">닫기</Checkbox>
              </Checkbox.Group>
            </Form.Item> */}

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading}>
                  등록
                </Button>
                <Button
                  onClick={() => {
                    setIsModalOpen(false);
                    form.resetFields();
                    setEditingPopup(null);
                    setFileList([]);
                  }}
                >
                  취소
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </Modal>
    </div>
  );
};

export default PopupManage;
