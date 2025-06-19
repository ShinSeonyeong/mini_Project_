import React, { useState } from 'react';
import {useMediaQuery} from "react-responsive";
import {Button, Card, Row, Col, Table} from "antd";
import {EditOutlined} from "@ant-design/icons";

const EmployeeTable = ({ employeeList, setIsInsert, setIsModify, setModifyData, currentPage }) => {

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
      </>
    );
}

export default EmployeeTable;