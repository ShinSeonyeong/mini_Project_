import React, { useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import locale from "antd/es/date-picker/locale/ko_KR";
import {
  Breadcrumb,
  Select,
  Input,
  Button,
  Modal,
  Form,
  DatePicker,
  Row,
  Col,
  Upload,
  Pagination,
} from "antd";
import { useNavigate } from "react-router-dom";
import styles from "../css/employee.module.css";
import boardStyles from "../css/BoardManage.module.css";
import "../css/BoardManage.custom.css";
import {
  RedoOutlined,
  SearchOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import EmployeeTable from "../components/EmployeeTable.jsx";
import {
  getEmpl,
  insertProfile,
  modifyProfile,
  profileUpload,
  getEmplWithNextReservation,
  updateEmployeeApproval,
} from "../js/supabaseEmpl.js";

dayjs.extend(customParseFormat);

function Employee(props) {
  const [form] = Form.useForm();
  const [employeeList, setEmployeeList] = useState([]);
  const [searchType, setSearchType] = useState("");
  const [searchNm, setSearchNm] = useState("");
  const [activeTab, setActiveTab] = useState("");
  const emplNavi = useNavigate();
  const [isInsert, setIsInsert] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [isModify, setIsModify] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modifyData, setModifyData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Form 초기화 함수
  const resetForm = () => {
    form.resetFields();
    setFileList([]);
  };

  // 모달 닫기 함수
  const handleModalClose = () => {
    setIsInsert(false);
    setModifyData(null);
    resetForm();
  };

  useEffect(() => {
    search_empl(searchType, searchNm);
  }, []);

  useEffect(() => {
    if (!isInsert) {
      return;
    }

    if (modifyData) {
      const formattedData = {
        ...modifyData,
        entr_date: modifyData.entr_date ? dayjs(modifyData.entr_date) : null,
        pw: ""
      };
      form.setFieldsValue(formattedData);
    } else {
      form.setFieldsValue({ type: 2, auth: 2, bank: "" });
    }
  }, [modifyData, isInsert, form]);

  async function search_empl(type, nm) {
    setEmployeeList(await getEmplWithNextReservation(type, nm));
  }
  const { Option } = Select;
  const division = [
    { id: "", name: "전체" },
    { id: 1, name: "정규직" },
    { id: 2, name: "계약직" },
  ];

  const handleTabChange = (type) => {
    setActiveTab(type);
    setSearchType(type);
    search_empl(type, searchNm);
  };

  const handleSearch = () => {
    search_empl(searchType, searchNm);
  };

  const searchClear = () => {
    setSearchNm("");
    setSearchType("");
    setActiveTab("");
    search_empl("", "");
  };
  const uploadProps = {
    onRemove: (file) => {
      setFileList([]);
    },
    beforeUpload: (file) => {
      file.originFileObj = file;
      setFileList([file]);
      return false;
    },
    fileList,
    accept: "image/*",
    maxCount: 1,
  };
  const modalFinish = async (values) => {
    setLoading(true);
    if (fileList?.length > 0) {
      await profileUpload(fileList[0], isModify, values);
    } else {
      isModify
        ? await modifyProfile(values)
        : await insertProfile(values).then((res) => {
            search_empl();
            setIsInsert(false);
          });
    }
    setLoading(false);
  };
  const formatPhoneNumber = (value) => {
    const numbers = value.replace(/[^\d]/g, "");
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(
        7,
        11
      )}`;
    }
  };
  const changeFormTel = (e) => {
    const tel = formatPhoneNumber(e.target.value);
    form.setFieldsValue({ tel });
  };

  const handleApprovalUpdate = async (employeeId, isApproved) => {
    try {
      await updateEmployeeApproval(employeeId, isApproved);
      // 승인 상태 변경 후 목록 새로고침
      search_empl(searchType, searchNm);
    } catch (error) {
      console.error('승인 상태 변경 실패:', error);
    }
  };

  return (
    <>
      <div className={styles.content}>
        <div>
          <Breadcrumb
            separator=">"
            items={[
              {
                title: "Home",
              },
              {
                title: "직원관리",
                href: "",
                onClick: (e) => {
                  e.preventDefault();
                  emplNavi("/employee");
                },
              },
            ]}
          />
        </div>
        <div className="custom-filter-section">
          <div className="custom-tab-group">
            {division.map((cat) => (
              <button
                key={cat.id}
                className={`custom-tab-btn${
                  activeTab === cat.id ? " active" : ""
                }`}
                onClick={() => handleTabChange(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
          <div className="custom-search-group">
            <Input
              className="custom-search-input"
              placeholder="이름을 검색해주세요."
              value={searchNm}
              onChange={(e) => setSearchNm(e.target.value)}
              prefix={<SearchOutlined style={{ color: "#bdbdbd" }} />}
              onPressEnter={handleSearch}
              allowClear
            />
          </div>
        </div>

        <div className={boardStyles.tableContainer}>
          <EmployeeTable
            employeeList={employeeList}
            setIsInsert={setIsInsert}
            setIsModify={setIsModify}
            setModifyData={setModifyData}
            currentPage={currentPage}
            onUpdateApproval={handleApprovalUpdate}
          />

          <div className={boardStyles.pagination_container}>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={employeeList.length}
              onChange={(page) => setCurrentPage(page)}
              showSizeChanger={false}
            />
            <div style={{ display: "flex", gap: "20px" }}>
              <Button
                type="primary"
                onClick={() => {
                  setIsModify(false);
                  setIsInsert(true);
                }}
              >
                신규등록
              </Button>
            </div>
          </div>
        </div>
        <Modal
          title={isModify ? "직원 수정" : "직원 등록"}
          open={isInsert}
          onCancel={handleModalClose}
          width={"400px"}
          footer={null}
          destroyOnHidden
          afterClose={resetForm}
        >
          <Form
            form={form}
            layout={"vertical"}
            onFinish={modalFinish}
            preserve={false}
          >
            <Row gutter={10}>
              <Col span={10}>
                <Form.Item
                  label={"아이디"}
                  name={"id"}
                  rules={[
                    { required: true, message: "아이디를 입력해주세요." },
                  ]}
                >
                  {isModify ? <Input disabled /> : <Input />}
                </Form.Item>
              </Col>
              <Col span={14}>
                <Form.Item
                  label={"비밀번호"}
                  name={"pw"}
                  rules={
                    isModify
                      ? [
                          {
                            pattern: /[\s\S]{8,}/,
                            message: "8자 이상 입력해주세요.",
                          },
                          {
                            pattern: /[!@#$%^&*]{1,}/,
                            message: "특수문자 1개 이상 입력해주세요.",
                          },
                        ]
                      : [
                          {
                            required: true,
                            message: "비밀번호를 입력해주세요",
                          },
                          {
                            pattern: /[\s\S]{8,}/,
                            message: "8자 이상 입력해주세요.",
                          },
                          {
                            pattern: /[!@#$%^&*]{1,}/,
                            message: "특수문자 1개 이상 입력해주세요.",
                          },
                        ]
                  }
                >
                  <Input.Password />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={10}>
              <Col span={10}>
                <Form.Item
                  label={"이름"}
                  name={"nm"}
                  rules={[{ required: true, message: "이름을 입력해주세요." }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={14}>
                <Form.Item
                  label={"연락처"}
                  name={"tel"}
                  rules={[
                    { required: true, message: "연락처를 입력해주세요." },
                    {
                      pattern: /^\d{3}-\d{3,4}-\d{4}$/,
                      message:
                        "유효한 전화번호 형식이 아닙니다. 예: 010-1234-5678",
                    },
                  ]}
                >
                  <Input onChange={changeFormTel} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={12}>
              <Col span={10}>
                <Form.Item
                  label={"입사일"}
                  name={"entr_date"}
                  rules={[
                    { required: true, message: "입사일자를 선택해주세요." },
                  ]}
                >
                  <DatePicker locale={locale} />
                </Form.Item>
              </Col>
              <Col span={7}>
                <Form.Item
                  label={"계약형태"}
                  name={"type"}
                  rules={[
                    { required: true, message: "계약형태를 선택해주세요." },
                  ]}
                >
                  <Select>
                    <Option value={1}>정규직</Option>
                    <Option value={2}>계약직</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={7}>
                <Form.Item
                  label={"권한"}
                  name={"auth"}
                  rules={[
                    { required: true, message: "계정권한을 선택해주세요." },
                  ]}
                >
                  <Select>
                    <Option value={1}>관리자</Option>
                    <Option value={2}>기사</Option>
                    <Option value={9} disabled>
                      최고관리자
                    </Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label={"주소"} name={"addr"}>
              <Input />
            </Form.Item>
            <Form.Item
              label={"이메일"}
              name={"mail"}
              rules={[
                {
                  pattern: /[\s\S]{2,}@[\S]{1,}\.[\S]{2,}/,
                  message: "이메일 양식에 맞춰주세요. 예:exampl@example.com",
                },
              ]}
            >
              <Input />
            </Form.Item>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label={"은행"} name={"bank"}>
                  <Select>
                    <Option value={""}>-</Option>
                    <Option value={1}>한국은행</Option>
                    <Option value={2}>산업은행</Option>
                    <Option value={3}>기업은행</Option>
                    <Option value={6}>국민은행</Option>
                    <Option value={11}>농협은행</Option>
                    <Option value={20}>우리은행</Option>
                    <Option value={23}>SC은행</Option>
                    <Option value={27}>한국씨티은행</Option>
                    <Option value={81}>KEB하나은행</Option>
                    <Option value={88}>신한은행</Option>
                    <Option value={90}>카카오뱅크</Option>
                    <Option value={31}>대구은행</Option>
                    <Option value={32}>부산은행</Option>
                    <Option value={34}>광주은행</Option>
                    <Option value={35}>제주은행</Option>
                    <Option value={37}>전북은행</Option>
                    <Option value={39}>경남은행</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={16}>
                <Form.Item
                  label={"계좌번호"}
                  name={"account_num"}
                  rules={[
                    {
                      pattern: /[^a-zA-Z!@#$%^&*\-]$/,
                      message: "숫자만 입력해주세요.",
                    },
                  ]}
                >
                  <Input />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item>
              <Upload {...uploadProps} listType="picture">
                <Button icon={<UploadOutlined />}>
                  이미지 업로드 (최대 1개)
                </Button>
              </Upload>
            </Form.Item>
            <Form.Item style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                onClick={() => {
                  form.resetFields();
                  setFileList([]);
                }}
                icon={<RedoOutlined />}
                style={{ marginRight: "1rem" }}
              >
                초기화
              </Button>
              <Button type={"primary"} htmlType="submit" loading={loading}>
                {isModify ? "수정" : "등록"}
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </>
  );
}

export default Employee;
