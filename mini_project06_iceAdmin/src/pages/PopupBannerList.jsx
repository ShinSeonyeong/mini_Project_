import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Image, Checkbox, Switch, Modal } from 'antd';
import PopupBannerEditModal from '../components/PopupBannerEditModal';

const mockData = [
  {
    key: 1,
    status: '노출함',
    type: '팝업',
    image: '/images/popup1.png',
    title: '미리마켓 할인 이벤트',
    period: '23.06.12 16:34:30',
    page: '웹페이지',
    env: '데스크탑/모바일',
  },
  {
    key: 2,
    status: '노출함',
    type: '띠배너',
    image: '/images/banner1.png',
    title: 'Korea Sale Festa',
    period: '23.06.23 16:34:30',
    page: '상품 페이지',
    env: '데스크탑',
  },
  // ...더 많은 데이터
];

export default function PopupBannerList() {
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [editModal, setEditModal] = useState({ visible: false, record: null });
  const [data, setData] = useState(mockData);
  const [preview, setPreview] = useState({ visible: false, image: '', title: '' });

  useEffect(() => {
    // 팝업 차단 설정
    window.open = function() {
      return null;
    };
  }, []);

  const handleStatusChange = (checked, record) => {
    setData(prev =>
      prev.map(item =>
        item.key === record.key
          ? { ...item, status: checked ? '노출함' : '노출안함' }
          : item
      )
    );
  };

  const columns = [
    {
      title: <Checkbox />,
      dataIndex: 'key',
      render: (key) => <Checkbox checked={selectedRowKeys.includes(key)} />,
      width: 40,
    },
    {
      title: '노출상태',
      dataIndex: 'status',
      render: (status, record) => (
        <Switch
          checked={status === '노출함'}
          checkedChildren="노출"
          unCheckedChildren="OFF"
          onChange={checked => handleStatusChange(checked, record)}
        />
      ),
    },
    { title: '노출형태', dataIndex: 'type' },
    { title: '이미지', dataIndex: 'image', render: (src) => <Image width={120} src={src} /> },
    { title: '제목', dataIndex: 'title' },
    { title: '기간', dataIndex: 'period' },
    {
      title: '미리보기',
      render: (_, record) => (
        <Button 
          onClick={(e) => {
            e.preventDefault();
            setPreview({ visible: true, image: record.image, title: record.title });
          }}
        >
          미리보기
        </Button>
      ),
    },
    { title: '노출 페이지', dataIndex: 'page' },
    { title: '노출환경', dataIndex: 'env' },
    {
      title: '관리',
      render: (_, record) => (
        <Button onClick={() => setEditModal({ visible: true, record })}>수정</Button>
      ),
    },
  ];

  return (
    <div>
      <h2>팝업/배너 리스트</h2>
      <Button danger style={{ marginBottom: 10 }}>선택 삭제</Button>
      <Table
        rowKey="key"
        columns={columns}
        dataSource={data}
        pagination={false}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
      />
      <PopupBannerEditModal
        visible={editModal.visible}
        record={editModal.record}
        onClose={() => setEditModal({ visible: false, record: null })}
      />
      <Modal
        open={preview.visible}
        title={preview.title + ' 미리보기'}
        footer={null}
        onCancel={() => setPreview({ visible: false, image: '', title: '' })}
        centered
      >
        <Image src={preview.image} alt={preview.title} style={{ width: '100%' }} />
      </Modal>
    </div>
  );
} 