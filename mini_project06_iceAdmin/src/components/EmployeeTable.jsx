import React from 'react';
import {useMediaQuery} from "react-responsive";
import {Button, Card, Row, Col, Table} from "antd";
import {EditOutlined} from "@ant-design/icons";

function EmployeeTable(props) {

    const isMobile = useMediaQuery({maxWidth: 767});
    const setModifyData = props.setModifyData;
    const setIsModify = props.setIsModify;
    const setIsInsert = props.setIsInsert;
    const employeeColumns=[
        {
            title: '계약형태',
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
            title: '아이디',
            dataIndex: 'id',
            key: 'id',
            width: 90,
            render: (text) => {
                return (
                    <div style={{textAlign: 'center'}}>
                        {text}
                    </div>
                );
            },
        },
        {
            title: '이름',
            dataIndex: 'nm',
            key: 'nm',
            width: 90,
            render: (text) => {
                return (
                    <div style={{textAlign: 'center'}}>
                        {text}
                    </div>
                );
            },
        },
        {
            title: '연락처',
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
            title: '이메일',
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
            title: '입사일',
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
            title: '퇴사일',
            dataIndex: 'rsg_dt',
            key: 'rsg_dt',
            width: 110,
            sorter: (a, b) => a - b,
            render: (text) => (
                <div style={{textAlign: 'center'}}>
                    {text}
                </div>
            ),
        },
        {
            title:"수정",
            key:"modify_btn",
            width: 70,
            align:"center",
            render: (_,record) =>(
                <Button
                    icon={<EditOutlined />}
                    onClick={() => {setModifyData(record);setIsModify(true);setIsInsert(true);}}
                    style={{ color: '#1890ff' }}
                    size="small"
                />
            )
        },
    ];
    return isMobile ? (
        <>
            {props.employeeList.map(el=>(
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
          <Table rowKey={"idx"} columns={employeeColumns} dataSource={props.employeeList} size={"small"}scroll={{ x: 'max-content' }}

                 tableLayout="fixed">

          </Table>
      </>
    );
}

export default EmployeeTable;