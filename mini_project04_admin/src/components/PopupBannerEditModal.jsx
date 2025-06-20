import React from 'react';
import { Modal, Form, Input, DatePicker, Select, Button } from 'antd';

export default function PopupBannerEditModal({ visible, record, onClose }) {
  return (
    <Modal open={visible} onCancel={onClose} title="팝업/배너 수정" footer={null}>
      <Form initialValues={record} layout="vertical">
        <Form.Item label="제목" name="title"><Input /></Form.Item>
        <Form.Item label="기간" name="period"><DatePicker.RangePicker showTime style={{ width: '100%' }} /></Form.Item>
        <Form.Item label="노출 페이지" name="page"><Input /></Form.Item>
        <Form.Item label="노출환경" name="env">
          <Select options={[{ value: '데스크탑/모바일', label: '데스크탑/모바일' }, { value: '데스크탑', label: '데스크탑' }, { value: '모바일', label: '모바일' }]} />
        </Form.Item>
        {/* ...기타 항목 */}
        <Form.Item>
          <Button type="primary" htmlType="submit">저장</Button>
        </Form.Item>
      </Form>
    </Modal>
  );
} 