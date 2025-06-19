import React, { useState, useEffect } from "react";
import {
  Input,
  Button,
  DatePicker,
  Form,
  Modal,
  Select,
  Table,
  message,
  Tabs,
} from "antd";
import { supabase } from "../js/supabase.js";
import DaumPostcode from "react-daum-postcode";
import dayjs from "dayjs";
import locale from "antd/locale/ko_KR";
import styles from "../css/reservationForm.module.css";
dayjs.locale("ko");

const { Option } = Select;

const ReservationForm = ({ reservation, onSuccess }) => {
  const [form] = Form.useForm();
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);

  const formatDepositForDisplay = (value) => {
    if (!value) return "";
    return `${value}만 원`;
  };

  const capacityMap = {
    "20~50kg": 1,
    "50~100kg": 2,
    "100kg 이상": 3,
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

  const handlePhoneNumberChange = (e) => {
    const formattedValue = formatPhoneNumber(e.target.value);
    form.setFieldsValue({ phone: formattedValue });
  };

  // 고객 목록 가져오기
  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("customer")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
      message.error("고객 목록을 불러오는데 실패했습니다.");
    }
  };

  // 고객 선택 모달 열기
  const openCustomerSelection = () => {
    if (!reservation) {
      setIsCustomerModalOpen(true);
      fetchCustomers();
    }
  };

  // 고객 선택
  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setIsCustomerModalOpen(false);

    // 고객 주소를 쉼표로 분리 (우편번호, 주소, 상세주소)
    const addressParts = customer.addr ? customer.addr.split(", ") : ["", "", ""];
    const [postcode = "", addr = "", detailAddr = ""] = addressParts;

    // 선택된 고객 정보로 폼 설정
    form.setFieldsValue({
      name: customer.name,
      phone: customer.phone ? formatPhoneNumber(customer.phone) : "",
      email: customer.email || "",
      customerAddr: customer.addr || "",
      // 주소 필드도 설정
      postcode: postcode,
      addr: addr,
      detailAddr: detailAddr,
    });
  };

  useEffect(() => {
    if (reservation) {
      // 기존 데이터가 있을 때 폼에 설정
      form.setFieldsValue({
        // customer 테이블 필드들
        name: reservation.customer?.name || "",
        phone: reservation.customer?.phone
          ? formatPhoneNumber(reservation.customer.phone)
          : "",
        email: reservation.customer?.email || "",
        customerAddr: reservation.customer?.addr || "", // customer 주소를 기본값으로

        // reservation 테이블 필드들
        postcode: reservation.postcode || "",
        addr: reservation.addr || "",
        detailAddr: reservation.detailAddr || "",
        date: reservation.date ? dayjs(reservation.date) : null,
        time: reservation.time || "오전 10시 ~ 오후 1시",
        model: reservation.model || "",
        remark: reservation.remark || "",
        state: reservation.state ? parseInt(reservation.state, 10) : 1,
      });
    } else {
      form.resetFields();
    }
  }, [reservation, form]);

  const onFinish = async (values) => {
    try {
      // 신규 예약 시 고객 선택 필수 확인
      if (!reservation && !selectedCustomer) {
        message.error("고객을 선택해주세요!");
        return;
      }

      // 주소 정보 합치기 (우편번호 + 주소 + 상세주소)
      const fullAddr = [values.postcode, values.addr, values.detailAddr]
        .filter(Boolean)
        .join(", ");

      if (reservation) {
        // 기존 예약 수정
        // 이메일이 변경되었는지 확인
        const isEmailChanged = values.email !== reservation.customer?.email;

        if (isEmailChanged) {
          // 이메일이 변경된 경우, 다른 고객이 해당 이메일을 사용하고 있는지 확인
          const { data: existingCustomer, error: checkError } = await supabase
            .from("customer")
            .select("res_no, name")
            .eq("email", values.email)
            .neq("res_no", reservation.res_no)
            .single();

          if (checkError && checkError.code !== "PGRST116") {
            // PGRST116는 결과가 없는 경우
            throw checkError;
          }

          if (existingCustomer) {
            message.error(
              `이메일 '${values.email}'은 이미 다른 고객(${existingCustomer.name})이 사용하고 있습니다.`
            );
            return;
          }
        }

        // 1. customer 테이블 업데이트 (이메일과 기본 정보만 업데이트)
        const customerUpdateData = {
          name: values.name,
          phone: values.phone,
        };

        // 이메일이 변경된 경우에만 추가
        if (isEmailChanged) {
          customerUpdateData.email = values.email;
        }

        const { error: customerError } = await supabase
          .from("customer")
          .update(customerUpdateData)
          .eq("res_no", reservation.res_no);
        if (customerError) throw customerError;

        // 2. reservation 테이블 업데이트
        const { error: reservationError } = await supabase
          .from("reservation")
          .update({
            addr: fullAddr, // 예약 주소 (우편번호 + 주소 + 상세주소)
            date: values.date,
            time: values.time,
            model: values.model,
            remark: values.remark,
            state: values.state,
          })
          .eq("res_no", reservation.res_no);
        if (reservationError) throw reservationError;
      } else {
        // 새로운 예약 생성
        if (!selectedCustomer) {
          message.error("고객을 선택해주세요.");
          return;
        }

        // 1. reservation 테이블에 예약 정보 저장 (새로운 res_no 생성)
        const { data: newReservation, error: reservationError } = await supabase
          .from("reservation")
          .insert([
            {
              user_email: selectedCustomer.email,
              gisa_email: null,  // 초기에는 기사 미배정
              state: values.state || 1,  // 기본값 1 (신규예약)
              price: 0,  // 초기 가격 0
              agree: false,  // 초기 동의 상태 false
              addr: fullAddr || selectedCustomer.addr, // 예약 주소가 없으면 고객 주소 사용
              date: values.date.format('YYYY-MM-DD'),  // dayjs 객체를 문자열로 변환
              time: values.time,
              model: values.model,
              remark: values.remark
            },
          ])
          .select()
          .single();
        if (reservationError) {
          console.error('Reservation Error:', reservationError);
          throw reservationError;
        }

        // 2. customer 테이블의 res_no를 새로운 reservation의 res_no로 업데이트
        const { error: customerError } = await supabase
          .from("customer")
          .update({ 
            res_no: newReservation.res_no,
          })
          .eq("res_no", selectedCustomer.res_no);
        if (customerError) {
          console.error('Customer Error:', customerError);
          throw customerError;
        }
      }

      message.success(
        reservation ? "예약이 수정되었습니다." : "예약이 등록되었습니다."
      );
      onSuccess();
    } catch (error) {
      console.error("Error saving reservation:", error);

      // 구체적인 에러 메시지 표시
      if (
        error.code === "23505" &&
        error.message.includes("customer_email_key")
      ) {
        message.error(
          "이미 사용 중인 이메일입니다. 다른 이메일을 입력해주세요."
        );
      } else {
        message.error("예약 저장에 실패했습니다: " + error.message);
      }
    }
  };

  const handleAddressComplete = (data) => {
    const fullAddress = data.address;
    const extraAddress = data.addressType === "R" ? data.bname : "";
    const detailAddress = data.buildingName ? data.buildingName : "";

    // 우편번호와 주소 설정
    form.setFieldsValue({
      postcode: data.zonecode,
      addr: fullAddress,
      detailAddr: detailAddress,
    });

    setIsAddressModalOpen(false);
  };

  // 주소 필드 값 변경 시 customer 주소 동기화
  const handleAddressChange = () => {
    const postcode = form.getFieldValue("postcode");
    const addr = form.getFieldValue("addr");
    const detailAddr = form.getFieldValue("detailAddr");

    console.log("주소 변경 감지:", { postcode, addr, detailAddr });
  };

  // 고객 주소 변경 시 예약 주소 업데이트 (신규 예약 시에만)
  const handleCustomerAddressChange = (e) => {
    // 신규 예약 시에만 예약 주소 필드에 설정
    if (!reservation) {
      const customerAddr = e.target.value;
      // 고객 주소를 쉼표로 분리 (우편번호, 주소, 상세주소)
      const addressParts = customerAddr ? customerAddr.split(", ") : ["", "", ""];
      const [postcode = "", addr = "", detailAddr = ""] = addressParts;

      form.setFieldsValue({
        postcode: postcode,
        addr: addr,
        detailAddr: detailAddr,
      });
    }
  };

  // 고객 목록 테이블 컬럼
  const customerColumns = [
    {
      title: "이름",
      dataIndex: "name",
      key: "name",
      width: 120,
    },
    {
      title: "연락처",
      dataIndex: "phone",
      key: "phone",
      width: 150,
    },
    {
      title: "이메일",
      dataIndex: "email",
      key: "email",
      width: 200,
    },
    {
      title: "주소",
      dataIndex: "addr",
      key: "addr",
      width: 300,
      ellipsis: true,
    },
    {
      title: "선택",
      key: "action",
      width: 80,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          onClick={() => handleCustomerSelect(record)}
        >
          선택
        </Button>
      ),
    },
  ];

  return (
    <div className={styles.formContainer}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          time: "오전 10시 ~ 오후 1시",
          state: 1,
          postcode: "",
          addr: "",
          detailAddr: "",
          customerAddr: "",
        }}
        className={styles.reservationForm}
      >
        {reservation ? (
          // 예약 수정 시 탭 구조
          <Tabs
            defaultActiveKey="reservation"
            activeKey="reservation"
            items={[
              {
                key: "reservation",
                label: "예약 정보",
                children: (
                  <>
                    <div className={styles.formSection}>
                      <h3 className={styles.sectionTitle}>고객 정보</h3>
                      <div className={styles.formGrid}>
                        <Form.Item
                          label="이름"
                          name="name"
                          rules={[{ required: true, message: "이름을 입력해주세요!" }]}
                          className={styles.formItem}
                        >
                          <Input
                            size="large"
                            className={styles.input}
                            disabled={reservation ? true : !!selectedCustomer}
                          />
                        </Form.Item>

                        <Form.Item
                          label="연락처"
                          name="phone"
                          rules={[
                            { required: true, message: "연락처를 입력해주세요!" },
                            {
                              pattern: /^\d{3}-\d{3,4}-\d{4}$/,
                              message: "유효한 전화번호 형식이 아닙니다. 예: 010-1234-5678",
                            },
                          ]}
                          className={styles.formItem}
                        >
                          <Input
                            size="large"
                            onChange={handlePhoneNumberChange}
                            maxLength={13}
                            type="tel"
                            className={styles.input}
                            disabled={reservation ? true : !!selectedCustomer}
                          />
                        </Form.Item>

                        <Form.Item
                          label="이메일"
                          name="email"
                          rules={[
                            { required: true, message: "이메일을 입력해주세요!" },
                            {
                              pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                              message:
                                "유효한 이메일 형식이 아닙니다. 예: example@domain.com",
                            },
                          ]}
                          className={styles.formItem}
                        >
                          <Input
                            size="large"
                            className={styles.input}
                            disabled={reservation ? true : !!selectedCustomer}
                          />
                        </Form.Item>

                        <Form.Item
                          label="고객 주소"
                          name="customerAddr"
                          className={styles.formItem}
                        >
                          <Input.TextArea
                            rows={3}
                            className={styles.textarea}
                            disabled={reservation ? true : !!selectedCustomer}
                            onChange={handleCustomerAddressChange}
                          />
                        </Form.Item>
                      </div>
                    </div>

                    <div className={styles.formSection}>
                      <h3 className={styles.sectionTitle}>
                        주소 정보
                      </h3>
                      <div className={styles.addressGrid}>
                        <Form.Item
                          label="우편번호"
                          name="postcode"
                          rules={[{ message: "우편번호를 입력해주세요!" }]}
                          className={styles.formItem}
                        >
                          <div className={styles.postcodeContainer}>
                            <Input
                              className={styles.postcodeInput}
                              size="large"
                              placeholder="주소 검색 버튼을 클릭하세요"
                              onChange={handleAddressChange}
                              readOnly
                            />
                            <Button
                              onClick={() => setIsAddressModalOpen(true)}
                              size="large"
                              className={styles.searchButton}
                            >
                              주소 검색
                            </Button>
                          </div>
                        </Form.Item>

                        <Form.Item
                          label="주소"
                          name="addr"
                          rules={[{ message: "주소를 입력해주세요!" }]}
                          className={styles.formItem}
                        >
                          <Input
                            disabled
                            size="large"
                            className={`${styles.input} ${styles.addressInput}`}
                            placeholder="주소 검색으로 자동 입력됩니다"
                            onChange={handleAddressChange}
                          />
                        </Form.Item>

                        <Form.Item
                          label="상세주소"
                          name="detailAddr"
                          className={`${styles.formItem} ${styles.addressFullWidth}`}
                        >
                          <Input
                            placeholder="상세 주소를 입력하세요 (동, 호수 등)"
                            size="large"
                            className={`${styles.input} ${styles.detailAddressInput}`}
                            onChange={handleAddressChange}
                          />
                        </Form.Item>
                      </div>
                    </div>

                    <div className={styles.formSection}>
                      <h3 className={styles.sectionTitle}>
                        예약 정보
                      </h3>
                      <div className={styles.formGrid}>
                        <Form.Item
                          label="예약 날짜"
                          name="date"
                          rules={[{ required: true, message: "예약 날짜를 선택해주세요!" }]}
                          className={styles.formItem}
                        >
                          <DatePicker
                            locale={locale}
                            style={{ width: "100%" }}
                            size="large"
                            className={styles.datePicker}
                            disabledDate={(current) => {
                              const today = dayjs().startOf("day");
                              const threeMonthsLater = today.add(3, "month").endOf("day");
                              return (
                                current && (current < today || current > threeMonthsLater)
                              );
                            }}
                          />
                        </Form.Item>

                        <Form.Item
                          label="시간"
                          name="time"
                          rules={[{ required: true, message: "시간을 선택해주세요!" }]}
                          className={styles.formItem}
                        >
                          <Select size="large" className={styles.select}>
                            <Option value="오전 10시 ~ 오후 1시">
                              오전 10시 ~ 오후 1시
                            </Option>
                            <Option value="오후 2시 ~ 오후 5시">오후 2시 ~ 오후 5시</Option>
                            <Option value="오후 4시 ~ 오후 7시">오후 4시 ~ 오후 7시</Option>
                            <Option value="오후 6시 ~ 오후 9시">오후 6시 ~ 오후 9시</Option>
                          </Select>
                        </Form.Item>

                        <Form.Item
                          label="모델명"
                          name="model"
                          rules={[{ required: true, message: "모델명을 입력해주세요!" }]}
                          className={styles.formItem}
                        >
                          <Input size="large" className={styles.input} />
                        </Form.Item>
                      </div>
                    </div>

                    <div className={styles.formSection}>
                      <h3 className={styles.sectionTitle}>
                        추가 정보
                      </h3>
                      <div className={styles.formGrid}>
                        <Form.Item
                          label="특별 요청사항"
                          name="remark"
                          className={styles.formItem}
                        >
                          <Input.TextArea
                            rows={3}
                            className={styles.textarea}
                            placeholder="특별 요청사항을 입력하세요"
                          />
                        </Form.Item>

                        <Form.Item label="상태" name="state" className={styles.formItem}>
                          <Select size="large" className={styles.select}>
                            <Option value={1}>신규예약</Option>
                            <Option value={2}>결제대기</Option>
                            <Option value={3}>결제완료</Option>
                            <Option value={4}>기사배정</Option>
                            <Option value={5}>청소완료</Option>
                            <Option value={6}>예약취소</Option>
                          </Select>
                        </Form.Item>
                      </div>
                    </div>
                  </>
                ),
              },
            ]}
          />
        ) : (
          // 신규 예약 시 기존 구조
          <>
            {/* 고객 선택 섹션 (신규 등록 시에만 표시) */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>고객 선택 (필수)</h3>
              <div style={{ marginBottom: 16 }}>
                <Button
                  type="primary"
                  onClick={openCustomerSelection}
                  style={{ marginBottom: 16 }}
                >
                  고객 목록에서 선택
                </Button>
                {selectedCustomer ? (
                  <div
                    style={{
                      padding: 12,
                      backgroundColor: "#f6ffed",
                      border: "1px solid #b7eb8f",
                      borderRadius: 6,
                      marginBottom: 16,
                    }}
                  >
                    <strong>선택된 고객:</strong> {selectedCustomer.name} (
                    {selectedCustomer.phone})
                  </div>
                ) : (
                  <div
                    style={{
                      padding: 12,
                      backgroundColor: "#fff2e8",
                      border: "1px solid #ffbb96",
                      borderRadius: 6,
                      marginBottom: 16,
                    }}
                  >
                    <strong>⚠️ 고객을 선택해주세요!</strong> 예약을 진행하려면 고객 목록에서 고객을 선택해야 합니다.
                  </div>
                )}
              </div>
            </div>

        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>고객 정보</h3>
          <div className={styles.formGrid}>
            <Form.Item
              label="이름"
              name="name"
              rules={[{ required: true, message: "이름을 입력해주세요!" }]}
              className={styles.formItem}
            >
              <Input
                size="large"
                className={styles.input}
                    disabled={true}
              />
            </Form.Item>

            <Form.Item
              label="연락처"
              name="phone"
              rules={[
                { required: true, message: "연락처를 입력해주세요!" },
                {
                  pattern: /^\d{3}-\d{3,4}-\d{4}$/,
                  message: "유효한 전화번호 형식이 아닙니다. 예: 010-1234-5678",
                },
              ]}
              className={styles.formItem}
            >
              <Input
                size="large"
                onChange={handlePhoneNumberChange}
                maxLength={13}
                type="tel"
                className={styles.input}
                disabled={true}
              />
            </Form.Item>

            <Form.Item
              label="이메일"
              name="email"
              rules={[
                { required: true, message: "이메일을 입력해주세요!" },
                {
                  pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message:
                    "유효한 이메일 형식이 아닙니다. 예: example@domain.com",
                },
              ]}
              className={styles.formItem}
            >
              <Input
                size="large"
                className={styles.input}
                disabled={true}
                  />
                </Form.Item>

                <Form.Item
                  label="고객 주소"
                  name="customerAddr"
                  className={styles.formItem}
                >
                  <Input.TextArea
                    rows={3}
                    className={styles.textarea}
                    disabled={true}
                    onChange={handleCustomerAddressChange}
              />
            </Form.Item>
          </div>
        </div>

        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>
                주소 정보
          </h3>
              <div className={styles.addressGrid}>
            <Form.Item
              label="우편번호"
              name="postcode"
              rules={[{ message: "우편번호를 입력해주세요!" }]}
              className={styles.formItem}
            >
              <div className={styles.postcodeContainer}>
                <Input
                  className={styles.postcodeInput}
                  size="large"
                  placeholder="주소 검색 버튼을 클릭하세요"
                      onChange={handleAddressChange}
                      readOnly
                />
                <Button
                  onClick={() => setIsAddressModalOpen(true)}
                  size="large"
                  className={styles.searchButton}
                >
                  주소 검색
                </Button>
              </div>
            </Form.Item>

            <Form.Item
              label="주소"
              name="addr"
                  rules={[{ message: "주소를 입력해주세요!" }]}
              className={styles.formItem}
            >
              <Input
                disabled
                size="large"
                    className={`${styles.input} ${styles.addressInput}`}
                placeholder="주소 검색으로 자동 입력됩니다"
                    onChange={handleAddressChange}
              />
            </Form.Item>

            <Form.Item
              label="상세주소"
              name="detailAddr"
                  className={`${styles.formItem} ${styles.addressFullWidth}`}
            >
              <Input
                placeholder="상세 주소를 입력하세요 (동, 호수 등)"
                size="large"
                    className={`${styles.input} ${styles.detailAddressInput}`}
                    onChange={handleAddressChange}
              />
            </Form.Item>
          </div>
        </div>

        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>
            예약 정보
          </h3>
          <div className={styles.formGrid}>
            <Form.Item
              label="예약 날짜"
              name="date"
              rules={[{ required: true, message: "예약 날짜를 선택해주세요!" }]}
              className={styles.formItem}
            >
              <DatePicker
                locale={locale}
                style={{ width: "100%" }}
                size="large"
                className={styles.datePicker}
                disabledDate={(current) => {
                  const today = dayjs().startOf("day");
                  const threeMonthsLater = today.add(3, "month").endOf("day");
                  return (
                    current && (current < today || current > threeMonthsLater)
                  );
                }}
              />
            </Form.Item>

            <Form.Item
              label="시간"
              name="time"
              rules={[{ required: true, message: "시간을 선택해주세요!" }]}
              className={styles.formItem}
            >
              <Select size="large" className={styles.select}>
                <Option value="오전 10시 ~ 오후 1시">
                  오전 10시 ~ 오후 1시
                </Option>
                <Option value="오후 2시 ~ 오후 5시">오후 2시 ~ 오후 5시</Option>
                <Option value="오후 4시 ~ 오후 7시">오후 4시 ~ 오후 7시</Option>
                <Option value="오후 6시 ~ 오후 9시">오후 6시 ~ 오후 9시</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="모델명"
              name="model"
              rules={[{ required: true, message: "모델명을 입력해주세요!" }]}
              className={styles.formItem}
            >
              <Input size="large" className={styles.input} />
            </Form.Item>
          </div>
        </div>

        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>
            추가 정보
          </h3>
          <div className={styles.formGrid}>
            <Form.Item
              label="특별 요청사항"
              name="remark"
              className={styles.formItem}
            >
              <Input.TextArea
                rows={3}
                className={styles.textarea}
                placeholder="특별 요청사항을 입력하세요"
              />
            </Form.Item>

            <Form.Item label="상태" name="state" className={styles.formItem}>
              <Select size="large" className={styles.select}>
                <Option value={1}>신규예약</Option>
                <Option value={2}>결제대기</Option>
                <Option value={3}>결제완료</Option>
                <Option value={4}>기사배정</Option>
                <Option value={5}>청소완료</Option>
                <Option value={6}>예약취소</Option>
              </Select>
            </Form.Item>
          </div>
        </div>
          </>
        )}

        <Form.Item className={styles.submitButtonContainer}>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            className={styles.submitButton}
          >
            {reservation ? "수정" : "등록"}
          </Button>
        </Form.Item>
      </Form>

      {/* 주소 검색 모달 */}
      <Modal
        title="주소 검색"
        open={isAddressModalOpen}
        onCancel={() => setIsAddressModalOpen(false)}
        footer={null}
        className={styles.addressModal}
      >
        <DaumPostcode onComplete={handleAddressComplete} />
      </Modal>

      {/* 고객 선택 모달 */}
      <Modal
        title="고객 선택"
        open={isCustomerModalOpen}
        onCancel={() => setIsCustomerModalOpen(false)}
        footer={null}
        width={1000}
      >
        <Table
          columns={customerColumns}
          dataSource={customers}
          rowKey="res_no"
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
          }}
          size="small"
          scroll={{ y: 400 }}
        />
      </Modal>
    </div>
  );
};

export default ReservationForm;
