import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Modal,
  message,
} from "antd";
import { supabase } from "../js/supabase.js";
import DaumPostcode from "react-daum-postcode";
import styles from "../css/customerForm.module.css";

const CustomerForm = ({ customer, onSuccess }) => {
  const [form] = Form.useForm();
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressValue, setAddressValue] = useState("");
  const [detailAddressValue, setDetailAddressValue] = useState("");

  useEffect(() => {
    if (customer && form) {
      const addr = customer.addr || "";
      // 주소에서 상세주소 분리 (예: "서울시 강남구 테헤란로 123" -> "서울시 강남구 테헤란로", "123")
      const addrParts = addr.split(" ");
      const mainAddr = addrParts.slice(0, -1).join(" ");
      const detailAddr = addrParts.length > 1 ? addrParts[addrParts.length - 1] : "";
      
      form.setFieldsValue({
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        addr: mainAddr,
        detailAddr: detailAddr,
      });
      setAddressValue(mainAddr);
      setDetailAddressValue(detailAddr);
    } else if (form) {
      form.resetFields();
      setAddressValue("");
      setDetailAddressValue("");
    }
  }, [customer, form]);

  const formatPhoneNumber = (value) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, "");
    if (phoneNumber.length <= 3) {
      return phoneNumber;
    } else if (phoneNumber.length <= 7) {
      return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`;
    } else {
      return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 7)}-${phoneNumber.slice(7, 11)}`;
    }
  };

  const handlePhoneNumberChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    e.target.value = formatted;
  };

  const onFinish = async (values) => {
    try {
      // 주소와 상세주소 합치기
      const fullAddr = [values.addr, values.detailAddr].filter(Boolean).join(" ");
      
      if (customer) {
        // 기존 고객 수정
        const { error: customerError } = await supabase
          .from("customer")
          .update({
            name: values.name,
            phone: values.phone,
            email: values.email,
            addr: fullAddr,
          })
          .eq("res_no", customer.res_no);

        if (customerError) throw customerError;

        // 해당 고객의 예약 주소도 함께 업데이트
        const { error: reservationError } = await supabase
          .from("reservation")
          .update({
            addr: fullAddr
          })
          .eq("user_email", values.email);

        if (reservationError) throw reservationError;
        
        message.success("고객 정보가 수정되었습니다.");
      } else {
        // 새로운 고객 생성
        const { error } = await supabase
          .from("customer")
          .insert([
            {
              name: values.name,
              phone: values.phone,
              email: values.email,
              addr: fullAddr,
            },
          ]);

        if (error) throw error;
        message.success("고객이 등록되었습니다.");
      }

      onSuccess();
    } catch (error) {
      console.error("Error saving customer:", error);
      message.error("저장 중 오류가 발생했습니다: " + error.message);
    }
  };

  const handleAddressComplete = (data) => {
    const fullAddress = data.address;
    
    // 상태 직접 업데이트 (상세주소는 유지)
    setAddressValue(fullAddress);
    
    // 폼 값도 업데이트 (상세주소는 유지)
    form.setFieldsValue({
      addr: fullAddress,
    });

    setIsAddressModalOpen(false);
  };

  return (
    <div className={styles.formContainer}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          name: "",
          phone: "",
          email: "",
          addr: "",
          detailAddr: "",
        }}
        className={styles.customerForm}
      >
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
                placeholder="고객 이름을 입력하세요"
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
                placeholder="010-1234-5678"
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
                placeholder="example@domain.com"
              />
            </Form.Item>

            <Form.Item
              label="주소"
              name="addr"
              className={styles.formItem}
            >
              <div className={styles.addressContainer}>
                <Input
                  className={styles.addressInput}
                  size="large"
                  placeholder="주소 검색 버튼을 클릭하세요"
                  readOnly
                  value={addressValue}
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
              label="상세주소"
              name="detailAddr"
              className={styles.formItem}
            >
              <Input
                size="large"
                className={styles.input}
                placeholder="상세주소를 입력하세요 (동, 호수 등)"
                value={detailAddressValue}
                onChange={(e) => {
                  setDetailAddressValue(e.target.value);
                  form.setFieldsValue({ detailAddr: e.target.value });
                }}
              />
            </Form.Item>
          </div>
        </div>

        <Form.Item className={styles.submitButtonContainer}>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            className={styles.submitButton}
          >
            {customer ? "수정" : "등록"}
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
    </div>
  );
};

export default CustomerForm; 