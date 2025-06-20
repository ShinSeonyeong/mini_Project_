import React, { useEffect, useState } from 'react';
import { Input, Button, DatePicker, Form, Modal, Select } from 'antd';
import { supabase } from '../js/supabase.js';
import DaumPostcode from 'react-daum-postcode';
import dayjs from 'dayjs';
import locale from 'antd/es/date-picker/locale/ko_KR';
dayjs.locale('ko');

const { Option } = Select;

const ReservationForm = ({ reservation, onSuccess }) => {
    const [form] = Form.useForm();
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

    const depositMap = {
        1: 2, // 20~50kg
        2: 3, // 50~100kg
        3: 4, // 100kg 이상
    };

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
            const basicAddr = addrParts.slice(1, -1).join(',').trim() || '';
            const detailAddr = addrParts[addrParts.length - 1]?.trim() || '';

            form.setFieldsValue({
                name: reservation.name,
                tel: reservation.tel ? formatPhoneNumber(reservation.tel) : '', // 초기값도 포맷팅
                email: reservation.email,
                postcode: postcode,
                basicAddr: basicAddr,
                detailAddr: detailAddr,
                date: reservation.date ? dayjs(reservation.date) : null,
                time: reservation.time,
                model: reservation.model,
                capacity: reservation.capacity ? reservation.capacity.toString() : null,
                service: reservation.service || null,
                cycle: reservation.cycle || null,
                add: reservation.add || null,
                remark: reservation.remark || null,
                deposit: formatDepositForDisplay(reservation.deposit),
                state: reservation.state ? parseInt(reservation.state, 10) : 1,
            });
        } else {
            form.resetFields();
        }
    }, [reservation, form]);

    const handleCapacityChange = (value) => {
        const numericValue = parseInt(value, 10); // 문자열 값을 숫자로 변환
        const deposit = depositMap[numericValue]; // 예약금 매핑
        form.setFieldsValue({ deposit: formatDepositForDisplay(deposit) });
    };

    const onFinish = async (values) => {
        try {
            const addr = [values.postcode, values.basicAddr, values.detailAddr]
                .filter((v) => v)
                .join(', ')
                .replace(/\s*,\s*/g, ',');
            const data = {
                name: values.name,
                tel: values.tel,
                email: values.email,
                addr: addr,
                date: values.date ? values.date.format('YYYY-MM-DD') : null,
                time: values.time,
                model: values.model,
                capacity: parseInt(values.capacity, 10),
                service: values.service || null,
                cycle: values.cycle || null,
                add: values.add || null,
                remark: values.remark || null,
                deposit: depositMap[parseInt(values.capacity, 10)] || null,
                state: parseInt(values.state, 10) || 1,
            };

            if (!values.postcode || !values.basicAddr) {
                Modal.error({
                    title: '오류',
                    content: '우편번호와 주소를 입력해주세요.',
                });
                return;
            }
            if (!data.name || !data.tel || !data.email || !data.addr || !data.date || !data.time || !data.model || !data.capacity) {
                Modal.error({
                    title: '오류',
                    content: '모든 필수 항목을 입력해주세요.',
                });
                return;
            }

            console.log('Supabase에 전송할 데이터:', data);

            if (reservation) {
                const { error } = await supabase
                    .from('ice_res')
                    .update(data)
                    .eq('res_no', reservation.res_no);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('ice_res').insert([data]);
                if (error) throw error;
            }

            Modal.success({
                title: reservation ? '수정 완료' : '등록 완료',
                content: reservation
                    ? '예약 정보가 성공적으로 수정되었습니다.'
                    : '새 예약이 성공적으로 등록되었습니다.',
                onOk: () => {
                    onSuccess();
                    form.resetFields();
                },
            });
        } catch (error) {
            console.error('Error submitting reservation:', error);
            Modal.error({
                title: '오류 발생',
                content: `예약 ${reservation ? '수정' : '등록'} 중 오류가 발생했습니다: ${error.message}`,
            });
        }
    };

    const handleAddressComplete = (data) => {
        console.log('주소 검색 결과:', data);
        form.setFieldsValue({
            postcode: data.zonecode,
            basicAddr: data.address,
            detailAddr: '',
        });
        console.log('폼에 설정된 값:', form.getFieldsValue(['postcode', 'basicAddr', 'detailAddr']));
        setIsAddressModalOpen(false);
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{
                time: '오전 10시 ~ 오후 1시',
                capacity: '1',
                service: '청소',
                cycle: '이번 한 번만',
                add: '선택 안함',
                state: 1,
                deposit: formatDepositForDisplay(depositMap[1]),
                postcode: '',
                basicAddr: '',
                detailAddr: '',
            }}
            style={{ padding: '0 8px' }}
        >
            <Form.Item
                label="이름"
                name="name"
                rules={[{ required: true, message: '이름을 입력해주세요!' }]}
            >
                <Input size="middle" />
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
            >
                <Input
                    size="middle"
                    onChange={handlePhoneNumberChange}
                    placeholder="010-1234-5678"
                    maxLength={13}
                    type="tel"
                />
            </Form.Item>

            <Form.Item
                label="이메일"
                name="email"
                rules={[
                    { required: true, message: '이메일을 입력해주세요!' },
                    {
                        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: '유효한 이메일 형식이 아닙니다. 예: example@domain.com',
                    },
                ]}
            >
                <Input size="middle" />
            </Form.Item>

            <Form.Item
                label="우편번호"
                name="postcode"
                rules={[{ required: true, message: '우편번호를 입력해주세요!' }]}
            >
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Form.Item name="postcode" noStyle>
                        <Input
                            style={{ width: '100px', color: 'black', background: 'white', border: '1px solid #d9d9d9' }}
                            disabled
                            size="middle"
                        />
                    </Form.Item>
                    <Button onClick={() => setIsAddressModalOpen(true)} size="middle">
                        검색
                    </Button>
                </div>
            </Form.Item>

            <Modal
                title="주소 검색"
                open={isAddressModalOpen}
                onCancel={() => setIsAddressModalOpen(false)}
                footer={null}
            >
                <DaumPostcode onComplete={handleAddressComplete} />
            </Modal>

            <Form.Item
                label="주소"
                name="basicAddr"
                rules={[{ required: true, message: '주소를 입력해주세요!' }]}
            >
                <Input
                    style={{ color: 'black', background: 'white', border: '1px solid #d9d9d9' }}
                    disabled
                    size="middle"
                />
            </Form.Item>

            <Form.Item label="상세주소" name="detailAddr">
                <Input placeholder="상세 주소를 입력하세요" size="middle" />
            </Form.Item>

            <Form.Item
                label="예약 날짜"
                name="date"
                rules={[{ required: true, message: '예약 날짜를 선택해주세요!' }]}
            >
                <DatePicker
                    locale={locale}
                    style={{ width: '100%' }}
                    size="middle"
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
            >
                <Select size="middle" style={{ border: '1px solid #d9d9d9', borderRadius: 6 }}>
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
            >
                <Input size="middle" />
            </Form.Item>

            <Form.Item
                label="용량"
                name="capacity"
                rules={[{ required: true, message: '용량을 선택해주세요!' }]}
            >
                <Select
                    onChange={handleCapacityChange}
                    size="middle"
                    style={{ border: '1px solid #d9d9d9', borderRadius: 6 }}
                >
                    <Option value="1">20~50kg</Option>
                    <Option value="2">50~100kg</Option>
                    <Option value="3">100kg 이상</Option>
                </Select>
            </Form.Item>

            <Form.Item label="선택 서비스" name="service">
                <Select size="middle" style={{ border: '1px solid #d9d9d9', borderRadius: 6 }}>
                    <Option value="청소">청소</Option>
                    <Option value="수리">수리</Option>
                </Select>
            </Form.Item>

            <Form.Item label="서비스 주기" name="cycle">
                <Select size="middle" style={{ border: '1px solid #d9d9d9', borderRadius: 6 }}>
                    <Option value="이번 한 번만">이번 한 번만</Option>
                    <Option value="한 달에 한 번">한 달에 한 번</Option>
                </Select>
            </Form.Item>

            <Form.Item label="추가 서비스 선택" name="add">
                <Select size="middle" style={{ border: '1px solid #d9d9d9', borderRadius: 6 }}>
                    <Option value="심화 청소">심화 청소</Option>
                    <Option value="물탱크 청소">물탱크 청소</Option>
                    <Option value="필터 교체">필터 교체</Option>
                    <Option value="선택 안함">선택 안함</Option>
                </Select>
            </Form.Item>

            <Form.Item label="특별 요청사항" name="remark">
                <Input.TextArea
                    rows={3}
                    style={{ fontSize: '12px', resize: 'vertical', padding: '4px 8px' }}
                    placeholder="특별 요청사항을 입력하세요"
                />
            </Form.Item>

            <Form.Item
                label="예약금"
                name="deposit"
            >
                <Input
                    disabled
                    style={{ color: 'black', background: 'white', border: '1px solid #d9d9d9' }}
                    size="middle"
                />
            </Form.Item>

            <Form.Item label="상태" name="state">
                <Select size="middle" style={{ border: '1px solid #d9d9d9', borderRadius: 6 }}>
                    <Option value={1}>예약대기</Option>
                    <Option value={2}>배정대기</Option>
                    <Option value={3}>배정완료</Option>
                    <Option value={4}>처리중</Option>
                    <Option value={5}>처리완료</Option>
                    <Option value={9}>취소</Option>
                </Select>
            </Form.Item>

            <Form.Item style={{ textAlign: 'right' }}>
                <Button type="primary" htmlType="submit" size="middle">
                    {reservation ? '수정' : '등록'}
                </Button>
            </Form.Item>
        </Form>
    );
};

export default ReservationForm;