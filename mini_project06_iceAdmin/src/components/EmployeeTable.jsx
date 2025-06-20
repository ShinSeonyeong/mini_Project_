import React, { useState } from 'react';
import {useMediaQuery} from "react-responsive";
import {Button, Card, Row, Col, Table, Modal, Badge} from "antd";
import {EditOutlined, CheckOutlined, CloseOutlined} from "@ant-design/icons";

const EmployeeTable = ({ employeeList, setIsInsert, setIsModify, setModifyData, currentPage, onUpdateApproval }) => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [approvalAction, setApprovalAction] = useState(null);

    const isMobile = useMediaQuery({maxWidth: 767});
    const columns = [
        {
            title: <div style={{ textAlign: "center" }}>계약형태</div>,
            dataIndex: 'type',
            key: 'type',
            width: 100,
            onFilter: (value, record) => record.type===value,
            render: (text) => (
                <div style={{textAlign: 'center'}}>
                    {text==2?"계약직":"정규직"}
                </div>
            ),
        },
        {
            title: <div style={{ textAlign: "center" }}>이름</div>,
            dataIndex: 'nm',
            key: 'nm',
            width: 100,
            render: (text) => {
                return (
                    <div style={{textAlign: 'center'}}>
                        {text}
                    </div>
                );
            },
        },
        {
            title: <div style={{ textAlign: "center" }}>연락처</div>,
            dataIndex: 'tel',
            key: 'tel',
            width: 150,
            render: (text) => (
                <div style={{textAlign: 'center'}}>
                    {text}
                </div>
            ),
        },
        {
            title: <div style={{ textAlign: "center" }}>이메일</div>,
            dataIndex: 'mail',
            key: 'mail',
            width: 200,
            render: (text) => (
                <div style={{textAlign: 'left'}}>
                    {text}
                </div>
            ),
        },
        {
            title: <div style={{ textAlign: "center" }}>입사일</div>,
            dataIndex: 'entr_date',
            key: 'entr_date',
            width: 110,
            sorter: (a, b) => new Date(a) - new Date(b),
            render: (text) => (
                <div style={{textAlign: 'center'}}>
                    {text}
                </div>
            ),
        },
        {
            title: <div style={{ textAlign: "center" }}>스케줄</div>,
            dataIndex: 'next_reservation',
            key: 'schedule',
            width: 250,
            align:"center",
            render: (reservation) => (
                <div style={{textAlign: 'center'}}>
                    {reservation ? 
                        `${new Date(reservation.date).toLocaleDateString('ko-KR')} | ${reservation.time}` 
                        : '예정된 예약 없음'}
                </div>
            )
        },
        {
            title: <div style={{ textAlign: "center" }}>회원승인</div>,
            dataIndex: 'indentify',
            key: 'approval',
            width: 250,
            align:"center",
            render: (indentify, record) => (
                <div style={{textAlign: 'center'}}>
                    <Badge 
                        status={indentify ? "success" : "warning"} 
                        text={indentify ? "승인됨" : "승인대기"}
                    />
                    <div style={{ marginTop: 8 }}>
                        <Button
                            type={indentify ? "default" : "primary"}
                            size="small"
                            onClick={() => handleApprovalAction(record, 'approve')}
                            style={{ marginRight: 8, width: 100 }}
                            disabled={indentify}
                        >
                            승인
                        </Button>
                        <Button
                            type={!indentify ? "default" : "danger"}
                            size="small"
                            onClick={() => handleApprovalAction(record, 'reject')}
                            style={{ marginRight: 8, width: 100 }}
                            disabled={!indentify}
                        >
                            승인취소
                        </Button>
                    </div>
                </div>
            )
        },
        {
            title: <div style={{ textAlign: "center" }}>관리</div>,
            key:"modify_btn",
            width: 100,
            align:"center",
            render: (_,record) =>(
                <Button
                    onClick={() => {setModifyData(record);setIsModify(true);setIsInsert(true);}}
                    style={{ color: '#1890ff' }}
                    size="small"
                >
                    수정하기
                </Button>
            )
        },
    ];

    // 페이지네이션된 데이터 계산
    const pageSize = 10;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = employeeList.slice(startIndex, endIndex);

    const handleApprovalAction = (employee, action) => {
        setSelectedEmployee(employee);
        setApprovalAction(action);
        setIsModalVisible(true);
    };

    const handleModalConfirm = async () => {
        if (selectedEmployee && approvalAction) {
            await onUpdateApproval(selectedEmployee.id, approvalAction === 'approve');
            setIsModalVisible(false);
            setSelectedEmployee(null);
            setApprovalAction(null);
        }
    };

    return isMobile ? (
        <>
            {employeeList.map(el=>(
                <Card key={el.idx}
                      style={{ marginBottom: 16, borderRadius: 8 }}
                      title={`직원정보 : ${el.nm}`}
                      extra={
                          <div>
                              <Button
                                  icon={<EditOutlined />}
                                  onClick={() => {setModifyData(el);setIsModify(true);setIsInsert(true);}}
                                  style={{ color: '#1890ff' }}
                                  size="small"
                              />
                          </div>
                      }>
<Row gutter={[8 , 12]}>
    <Col span={8}>계약형태</Col>
    <Col span={16}>{el.type===1?"정규직":"계약직"}</Col>

    <Col span={8}>아이디</Col>
    <Col span={16}>{el.id}</Col>

    <Col span={8}>이름</Col>
    <Col span={16}>{el.nm}</Col>

    <Col span={8}>연락처</Col>
    <Col span={16}>{el.tel}</Col>

    <Col span={8}>메일</Col>
    <Col span={16}>{el.mail}</Col>

    <Col span={8}>입사일</Col>
    <Col span={16}>{el.entr_date}</Col>

    <Col span={8}>퇴사일</Col>
    <Col span={16}>{el.rsg_dt}</Col>
</Row>
                </Card>
            ))}
        </>
    ):(
      <>
          <Table
            columns={columns}
            dataSource={paginatedData}
            rowKey={(record) => record.id}
            pagination={false}
            size="small"
            scroll={{ x: 'max-content' }}
            tableLayout="fixed"
          />
          <Modal
            title={approvalAction === 'approve' ? "회원 승인 확인" : "회원 승인 취소 확인"}
            open={isModalVisible}
            onOk={handleModalConfirm}
            onCancel={() => setIsModalVisible(false)}
            okText={approvalAction === 'approve' ? "승인" : "승인 취소"}
            cancelText="취소"
          >
            <p>
                {selectedEmployee?.nm} 기사님의 회원 {approvalAction === 'approve' ? "승인" : "승인을 취소"}하시겠습니까?
            </p>
          </Modal>
      </>
    );
}

export default EmployeeTable;