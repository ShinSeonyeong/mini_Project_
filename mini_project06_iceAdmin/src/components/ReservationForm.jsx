import React, { useEffect, useState } from 'react';
import { Input, Button, DatePicker, Form, Modal, Select } from 'antd';
import { supabase } from '../js/supabase.js';
import DaumPostcode from 'react-daum-postcode';
import dayjs from 'dayjs';
import locale from 'antd/es/date-picker/locale/ko_KR';
import styles from '../css/reservationForm.module.css';
dayjs.locale('ko');

const { Option } = Select;

const ReservationForm = ({ reservation, onSuccess }) => {
    const [form] = Form.useForm();
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

    const formatDepositForDisplay = (value) => {
        if (!value) return '';
        return `${value}만 원`;
    };

    const capacityMap = {
        '20~50kg': 1,
        '50~100kg': 2,
        '100kg 이상': 3,
    };

    const formatPhoneNumber = (value) => {
        const numbers = value.replace(/[^\d]/g, '');
        if (numbers.length <= 3) {
            return numbers;
        } else if (numbers.length <= 7) {
            return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
        } else {
            return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
        }
    };

    const handlePhoneNumberChange = (e) => {
        const formattedValue = formatPhoneNumber(e.target.value);
        form.setFieldsValue({ tel: formattedValue });
    };

    useEffect(() => {
        if (reservation) {
            const addrParts = reservation.addr ? reservation.addr.split(',') : ['', '', ''];
            const postcode = addrParts[0]?.trim() || '';
            const addr = [
                addrParts.slice(1, -1).join(',').trim(),
                addrParts[addrParts.length - 1]?.trim()
            ].filter(Boolean).join(' ') || '';

            form.setFieldsValue({
                name: reservation.customer?.name,
                tel: reservation.tel ? formatPhoneNumber(reservation.tel) : '',
                user_email: reservation.user_email,
                postcode: postcode,
                addr: addr,
                date: reservation.date ? dayjs(reservation.date) : null,
                time: reservation.time,
                model: reservation.model,
                capacity: reservation.capacity ? reservation.capacity.toString() : null,
                service: reservation.service || null,
                cycle: reservation.cycle || null,
                add: reservation.add || null,
                remark: reservation.remark || null,
                state: reservation.state ? parseInt(reservation.state, 10) : 1,
            });
        } else {
            form.resetFields();
        }
    }, [reservation, form]);

    const onFinish = async (values) => {
        // addr와 detailAddr을 합쳐서 addr에 저장
        const fullAddr = [values.addr, values.detailAddr].filter(Boolean).join(' ');
        // detailAddr은 DB에 저장하지 않음
        const saveValues = { ...values, addr: fullAddr };
        delete saveValues.detailAddr;
        delete saveValues.name; // name 필드는 reservation 테이블에서 제거

        try {
            if (reservation) {
                // customer 테이블 업데이트
                const { error: customerError } = await supabase
                    .from('customer')
                    .update({ name: values.name })
                    .eq('res_no', reservation.res_no);
                if (customerError) throw customerError;

                // reservation 테이블 업데이트 (name 필드 제외)
                const { error: reservationError } = await supabase
                    .from('reservation')
                    .update({
                        tel: saveValues.tel,
                        user_email: saveValues.user_email,
                        postcode: saveValues.postcode,
                        addr: saveValues.addr,
                        date: saveValues.date,
                        time: saveValues.time,
                        model: saveValues.model,
                        remark: saveValues.remark,
                        state: saveValues.state
                    })
                    .eq('res_no', reservation.res_no);
                if (reservationError) throw reservationError;
            } else {
                // 새로운 예약 생성 (name 필드 제외)
                const { data: newReservation, error: reservationError } = await supabase
                    .from('reservation')
                    .insert([{
                        tel: saveValues.tel,
                        user_email: saveValues.user_email,
                        postcode: saveValues.postcode,
                        addr: saveValues.addr,
                        date: saveValues.date,
                        time: saveValues.time,
                        model: saveValues.model,
                        remark: saveValues.remark,
                        state: saveValues.state
                    }])
                    .select()
                    .single();
                if (reservationError) throw reservationError;

                // customer 테이블에 고객 정보 저장
                const { error: customerError } = await supabase
                    .from('customer')
                    .insert([{
                        res_no: newReservation.res_no,
                        name: values.name
                    }]);
                if (customerError) throw customerError;
            }
            onSuccess();
        } catch (error) {
            console.error('Error saving reservation:', error);
        }
    };

    const handleAddressComplete = (data) => {
        form.setFieldsValue({
            postcode: data.zonecode,
            addr: data.address,
            detailAddr: '',
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
                    time: '오전 10시 ~ 오후 1시',
                    state: 1,
                    postcode: '',
                    user_email: '',
                    addr: '',
                    detailAddr: '',
                }}
                className={styles.reservationForm}
            >
                <div className={styles.formSection}>
                    <h3 className={styles.sectionTitle}>기본 정보</h3>
                    <div className={styles.formGrid}>
                        <Form.Item
                            label="이름"
                            name="name"
                            rules={[{ required: true, message: '이름을 입력해주세요!' }]}
                            className={styles.formItem}
                        >
                            <Input size="large" className={styles.input} />
                        </Form.Item>

                        <Form.Item
                            label="연락처"
                            name="tel"
                            rules={[
                                { required: true, message: '연락처를 입력해주세요!' },
                                {
                                    pattern: /^\d{3}-\d{3,4}-\d{4}$/,
                                    message: '유효한 전화번호 형식이 아닙니다. 예: 010-1234-5678',
                                },
                            ]}
                            className={styles.formItem}
                        >
                            <Input
                                size="large"
                                onChange={handlePhoneNumberChange}
                                placeholder="010-1234-5678"
                                maxLength={13}
                                type="tel"
                                className={styles.input}
                            />
                        </Form.Item>

                        <Form.Item
                            label="이메일"
                            name="user_email"
                            rules={[
                                { required: true, message: '이메일을 입력해주세요!' },
                                {
                                    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                    message: '유효한 이메일 형식이 아닙니다. 예: example@domain.com',
                                },
                            ]}
                            className={styles.formItem}
                        >
                            <Input size="large" className={styles.input} />
                        </Form.Item>
                    </div>
                </div>

                <div className={styles.formSection}>
                    <h3 className={styles.sectionTitle}>주소 정보</h3>
                    <div className={styles.formGrid}>
                        <Form.Item
                            label="우편번호"
                            name="postcode"
                            rules={[{ required: true, message: '우편번호를 입력해주세요!' }]}
                            className={styles.formItem}
                        >
                            <div className={styles.postcodeContainer}>
                                <Input
                                    className={styles.postcodeInput}
                                    disabled
                                    size="large"
                                />
                                <Button 
                                    onClick={() => setIsAddressModalOpen(true)} 
                                    size="large"
                                    className={styles.searchButton}
                                >
                                    검색
                                </Button>
                            </div>
                        </Form.Item>

                        <Form.Item
                            label="주소"
                            name="addr"
                            rules={[{ required: true, message: '주소를 입력해주세요!' }]}
                            className={styles.formItem}
                        >
                            <Input
                                disabled
                                size="large"
                                className={styles.input}
                            />
                        </Form.Item>

                        <Form.Item 
                            label="상세주소" 
                            name="detailAddr"
                            className={styles.formItem}
                        >
                            <Input 
                                placeholder="상세 주소를 입력하세요" 
                                size="large"
                                className={styles.input}
                            />
                        </Form.Item>
                    </div>
                </div>

                <div className={styles.formSection}>
                    <h3 className={styles.sectionTitle}>예약 정보</h3>
                    <div className={styles.formGrid}>
                        <Form.Item
                            label="예약 날짜"
                            name="date"
                            rules={[{ required: true, message: '예약 날짜를 선택해주세요!' }]}
                            className={styles.formItem}
                        >
                            <DatePicker
                                locale={locale}
                                style={{ width: '100%' }}
                                size="large"
                                className={styles.datePicker}
                                disabledDate={(current) => {
                                    const today = dayjs().startOf('day');
                                    const threeMonthsLater = today.add(3, 'month').endOf('day');
                                    return current && (current < today || current > threeMonthsLater);
                                }}
                            />
                        </Form.Item>

                        <Form.Item
                            label="시간"
                            name="time"
                            rules={[{ required: true, message: '시간을 선택해주세요!' }]}
                            className={styles.formItem}
                        >
                            <Select size="large" className={styles.select}>
                                <Option value="오전 10시 ~ 오후 1시">오전 10시 ~ 오후 1시</Option>
                                <Option value="오후 2시 ~ 오후 5시">오후 2시 ~ 오후 5시</Option>
                                <Option value="오후 4시 ~ 오후 7시">오후 4시 ~ 오후 7시</Option>
                                <Option value="오후 6시 ~ 오후 9시">오후 6시 ~ 오후 9시</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            label="모델명"
                            name="model"
                            rules={[{ required: true, message: '모델명을 입력해주세요!' }]}
                            className={styles.formItem}
                        >
                            <Input size="large" className={styles.input} />
                        </Form.Item>
                    </div>
                </div>

                <div className={styles.formSection}>
                    <h3 className={styles.sectionTitle}>추가 정보</h3>
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

                        

                        <Form.Item 
                            label="상태" 
                            name="state"
                            className={styles.formItem}
                        >
                            <Select size="large" className={styles.select}>
                                <Option value={1}>예약대기</Option>
                                <Option value={2}>배정대기</Option>
                                <Option value={3}>배정완료</Option>
                                <Option value={4}>처리중</Option>
                                <Option value={5}>처리완료</Option>
                                <Option value={9}>취소</Option>
                            </Select>
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
                        {reservation ? '수정' : '등록'}
                    </Button>
                </Form.Item>
            </Form>

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

export default ReservationForm;