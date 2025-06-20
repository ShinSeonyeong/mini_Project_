import React, {useState, useEffect} from 'react';
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
  Divider,
  Breadcrumb,
  Card,
  Pagination
} from 'antd';
import {PlusOutlined, EditOutlined, DeleteOutlined} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import locale from 'antd/es/date-picker/locale/ko_KR';
import styles from '../css/popup.module.css';
import {getPopups, addPopup, updatePopup, deletePopup} from '../js/supabasePopup';
import {useNavigate} from 'react-router-dom';

const {RangePicker} = DatePicker;
const {Option} = Select;

const PopupManage = () => {
  const [popups, setPopups] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPopup, setEditingPopup] = useState(null);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [mobileFileList, setMobileFileList] = useState([]);
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
      message.error('팝업 목록을 불러오는데 실패했습니다.');
      console.error('팝업 로드 실패:', error);
    } finally {
      setTableLoading(false);
    }
  };

  // 이미지 업로드 전 처리
  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('이미지 파일만 업로드 가능합니다!');
      return false;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('이미지 크기는 2MB 이하여야 합니다!');
      return false;
    }
    return true;
  };

  // 이미지 업로드 처리
  const handleUpload = (info, isMobile = false) => {
    const {file} = info;
    const targetFileList = isMobile ? setMobileFileList : setFileList;

    if (file.status === 'uploading') {
      targetFileList([file]);
      return;
    }
    if (file.status === 'done') {
      const reader = new FileReader();
      reader.readAsDataURL(file.originFileObj);
      reader.onload = () => {
        const fieldName = isMobile ? 'mobile_image_url' : 'image_url';
        form.setFieldsValue({[fieldName]: reader.result});
        targetFileList([{
          uid: file.uid,
          name: file.name,
          status: 'done',
          url: reader.result,
        }]);
      };
    }
  };

  // 팝업 추가/수정
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const newPopup = {
        title: values.title,
        display_type: values.display_type,
        display_status: values.display_status,
        start_date: values.date_range[0].format('YYYY-MM-DD HH:mm'),
        end_date: values.date_range[1].format('YYYY-MM-DD HH:mm'),
        display_environment: values.display_environment,
        image_url: values.image_url,
        mobile_image_url: values.mobile_image_url,
        link_url: values.link_url,
        close_option: values.close_option,
        position_x: values.position_x,
        position_y: values.position_y,
        width: values.width,
        height: values.height,
        created_at: new Date().toISOString()
      };

      if (editingPopup) {
        await updatePopup(editingPopup.id, newPopup);
        message.success('팝업이 수정되었습니다.');
      } else {
        await addPopup(newPopup);
        message.success('새 팝업이 추가되었습니다.');
      }

      setIsModalOpen(false);
      form.resetFields();
      setEditingPopup(null);
      setFileList([]);
      setMobileFileList([]);
      fetchPopups();
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
      message.warning('삭제할 팝업을 선택해주세요.');
      return;
    }

    Modal.confirm({
      title: '팝업 삭제',
      content: `선택한 ${selectedRowKeys.length}개의 팝업을 삭제하시겠습니까?`,
      onOk: async () => {
        try {
          setLoading(true);
          for (const id of selectedRowKeys) {
            await deletePopup(id);
          }
          message.success('선택한 팝업이 삭제되었습니다.');
          setSelectedRowKeys([]);
          fetchPopups();
        } catch (error) {
          message.error('팝업 삭제에 실패했습니다.');
          console.error(error);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // 팝업 수정 모달 열기
  const handleEdit = (popup) => {
    setEditingPopup(popup);
    form.setFieldsValue({
      ...popup,
      date_range: [dayjs(popup.start_date), dayjs(popup.end_date)]
    });
    if (popup.image_url) {
      setFileList([{
        uid: '-1',
        name: '데스크탑 이미지',
        status: 'done',
        url: popup.image_url,
      }]);
    }
    if (popup.mobile_image_url) {
      setMobileFileList([{
        uid: '-2',
        name: '모바일 이미지',
        status: 'done',
        url: popup.mobile_image_url,
      }]);
    }
    setIsModalOpen(true);
  };

  const columns = [
    {
      title: <div style={{textAlign: "center"}}>제목</div>,
      dataIndex: 'title',
      width: 100,
      key: 'title',
    },
    {
      title: <div style={{textAlign: "center"}}>노출기간</div>,
      key: 'dateRange',
      width: 300,
      render: (_, record) => (
          <div>
            {dayjs(record.start_date).format('YYYY-MM-DD HH:mm')} ~ {dayjs(record.end_date).format('YYYY-MM-DD HH:mm')}
          </div>
      ),
    },
    {
      title: <div style={{textAlign: "center"}}>상태</div>,
      dataIndex: 'display_status',
      width: 100,
      align: "center",
      key: 'display_status',
      render: (status) => (
          <Switch checked={status === 'show'} disabled/>
      ),
    },
    {
      title: <div style={{textAlign: "center"}}>유형</div>,
      dataIndex: 'display_type',
      width: 100,
      align: "center",
      key: 'display_type',
      render: (type) => type === 'popup' ? '팝업' : '배너'
    },
    {
      title: <div style={{textAlign: "center"}}>관리</div>,
      key: 'action',
      width: 100,
      align: "center",
      render: (_, record) => (
          <Button
              type="default"
              onClick={() => handleEdit(record)}
              style={{color: '#1890ff', }}
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
                  title: 'Home',
                },
                {
                  title: '팝업관리',
                  href: '',
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
                  disabled={selectedRowKeys.length === 0}
                  style={{marginRight: 8}}
              >
                선택삭제
              </Button>
              <Button
                  type="primary"
                  onClick={() => {
                    setEditingPopup(null);
                    form.resetFields();
                    setFileList([]);
                    setMobileFileList([]);
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
              setMobileFileList([]);
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
                  display_type: 'popup',
                  display_status: 'show',
                  display_environment: ['desktop', 'mobile'],
                  close_option: ['today'],
                  position_x: '50%',
                  position_y: '50%',
                  width: '400px',
                  height: 'auto'
                }}
            >
              {/* <Form.Item
                            name="display_type"
                            label="노출 형태"
                        >
                            <Radio.Group>
                                <Radio value="popup">팝업</Radio>
                                <Radio value="banner">배너</Radio>
                            </Radio.Group>
                        </Form.Item> */}

              <Form.Item
                  name="title"
                  label="제목"
                  rules={[{required: true, message: '제목을 입력해주세요'}]}
              >
                <Input placeholder="관리를 위한 이름을 입력합니다."/>
              </Form.Item>

              <Form.Item
                  name="display_status"
                  label="노출 상태"
              >
                <Radio.Group>
                  <Radio value="show">노출함</Radio>
                  <Radio value="hide">노출안함</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                  name="date_range"
                  label="기간"
                  rules={[{required: true, message: '노출 기간을 선택해주세요'}]}
              >
                <RangePicker
                    locale={locale}
                    showTime={{format: 'HH:mm'}}
                    format="YYYY-MM-DD HH:mm"
                />
              </Form.Item>

              <Form.Item
                  name="display_environment"
                  label="노출 환경"
              >
                <Radio.Group>
                  <Radio value={['desktop', 'mobile']}>전체</Radio>
                  <Radio value={['desktop']}>데스크탑</Radio>
                  <Radio value={['mobile']}>모바일</Radio>
                </Radio.Group>
              </Form.Item>

              <Divider>팝업 위치 및 크기</Divider>
              <Form.Item
                  name="position_x"
                  label="팝업 X좌표"
                  extra="예: 50% 또는 100px"
              >
                <Input placeholder="50%"/>
              </Form.Item>
              <Form.Item
                  name="position_y"
                  label="팝업 Y좌표"
                  extra="예: 50% 또는 100px"
              >
                <Input placeholder="50%"/>
              </Form.Item>
              <Form.Item
                  name="width"
                  label="팝업 너비"
                  extra="예: 400px, 80% 등"
              >
                <Input placeholder="400px"/>
              </Form.Item>
              <Form.Item
                  name="height"
                  label="팝업 높이"
                  extra="예: auto, 300px 등"
              >
                <Input placeholder="auto"/>
              </Form.Item>

              <Divider>이미지</Divider>

              <Form.Item
                  name="image_url"
                  label="데스크탑 이미지"
                  extra="권장 해상도: 600 x 600px, 최소 해상도: 350 x 350px, 최대 해상도: 1000 x 650px"
              >
                <Upload
                    listType="picture-card"
                    maxCount={1}
                    beforeUpload={beforeUpload}
                    onChange={(info) => handleUpload(info, false)}
                    fileList={fileList}
                    onRemove={() => {
                      form.setFieldsValue({image_url: undefined});
                      setFileList([]);
                    }}
                    customRequest={({file, onSuccess}) => {
                      setTimeout(() => {
                        onSuccess("ok");
                      }, 0);
                    }}
                >
                  {fileList.length === 0 && <div>
                    <PlusOutlined/>
                    <div style={{marginTop: 8}}>이미지 업로드</div>
                  </div>}
                </Upload>
              </Form.Item>

              <Form.Item
                  name="mobile_image_url"
                  label="모바일 이미지"
                  extra="권장 해상도: 350 x 350px"
              >
                <Upload
                    listType="picture-card"
                    maxCount={1}
                    beforeUpload={beforeUpload}
                    onChange={(info) => handleUpload(info, true)}
                    fileList={mobileFileList}
                    onRemove={() => {
                      form.setFieldsValue({mobile_image_url: undefined});
                      setMobileFileList([]);
                    }}
                    customRequest={({file, onSuccess}) => {
                      setTimeout(() => {
                        onSuccess("ok");
                      }, 0);
                    }}
                >
                  {mobileFileList.length === 0 && <div>
                    <PlusOutlined/>
                    <div style={{marginTop: 8}}>이미지 업로드</div>
                  </div>}
                </Upload>
              </Form.Item>

              <Form.Item
                  name="link_url"
                  label="URL"
              >
                <Input placeholder="http://"/>
              </Form.Item>

              <Form.Item
                  name="close_option"
                  label="팝업 하단 닫기 설정"
              >
                <Radio.Group>
                  <Radio value={['today']}>오늘 하루 다시 보지 않기</Radio>
                  <Radio value={['close']}>닫기</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit">
                    등록
                  </Button>
                  <Button onClick={() => {
                    setIsModalOpen(false);
                    form.resetFields();
                    setEditingPopup(null);
                    setFileList([]);
                    setMobileFileList([]);
                  }}>
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