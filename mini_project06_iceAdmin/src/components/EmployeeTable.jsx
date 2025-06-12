import React from 'react';
import {useMediaQuery} from "react-responsive";
import {Button, Card,  Row, Col, Table, Image} from "antd";
import {EditOutlined} from "@ant-design/icons";

function EmployeeTable(props) {

    const isMobile = useMediaQuery({maxWidth: 767});
    const setModifyData = props.setModifyData;
    const setIsModify = props.setIsModify;
    const setIsInsert = props.setIsInsert;
    const employeeColumns=[
        {title:"수정",
        key:"modify_btn",
            width: 70,
            align:"center",
            render: (_,record) =>{
            return(
                <Button
                    icon={<EditOutlined />}
                    onClick={() => {setModifyData(record);setIsModify(true);setIsInsert(true);}}
                    style={{ color: '#1890ff' }}
                    size="small"
                />
            )
            }
        },
        {
            title: '프로필',
            dataIndex: 'file_url',
            key: 'file_url',
            width: 90,
            sorter: (a, b) => a - b,
            render: (text) => {
                    return (text?
                        <div style={{textAlign: 'center'}}>
                            <Image src={text} alt={"이미지"} width={50} height={50} ></Image>
                        </div>
                    :<div></div>);
            },
        },
        {
            title: '권한',
            dataIndex: 'auth',
            key: 'auth',
            width: 90,
            filters:[
                {
                    text:'관리자',
                    value:1
                },
                {
                    text:'기사',
                    value:2
                },
                {
                    text:'최고관리자',
                    value:9
                }
            ],
            onFilter: (value, record) => record.auth===value,
            render: (text) => {
                return (
                    <div style={{textAlign: 'center'}}>
                        {text===1?'관리자':text===9?'최고관리자':'기사'}
                    </div>
                );
            },
        },
        {
            title: '계약형태',
            dataIndex: 'type',
            key: 'type',
            width: 100,
            filters: [
                {
                    text:'계약직',
                    value:2
                },
                {
                    text:'정규직',
                    value:1
                }
            ],
            onFilter: (value, record) => record.type===value,
            render: (text) => {
                return (
                    <div style={{textAlign: 'center'}}>
                        {text==2?"계약직":"정규직"}
                    </div>
                );
            },
        },
        {
            title: '아이디',
            dataIndex: 'id',
            key: 'id',
            width: 90,
            sorter: (a, b) => a.charCodeAt() - b.charCodeAt(),
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
            sorter: (a, b) => a.charCodeAt() - b.charCodeAt(),
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
            sorter: (a, b) => a - b,
            render: (text) => {
                return (
                    <div style={{textAlign: 'center'}}>
                        {text}
                    </div>
                );
            },
        },
        {
            title: '주소',
            dataIndex: 'addr',
            key: 'addr',
            width: 400,
            sorter: (a, b) => a - b,
            render: (text) => {
                return (
                    <div style={{textAlign: 'left'}}>
                        {text}
                    </div>
                );
            },
        },
        {
            title: '이메일',
            dataIndex: 'mail',
            key: 'mail',
            width: 200,
            render: (text) => {
                return (
                    <div style={{textAlign: 'left'}}>
                        {text}
                    </div>
                );
            },
        },
        {
            title: '은행',
            dataIndex: 'bank',
            key: 'bank',
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
            title: '계좌번호',
            dataIndex: 'account_num',
            key: 'account_num',
            width: 250,
            render: (text) => {
                return (
                    <div style={{textAlign: 'center'}}>
                        {text}
                    </div>
                );
            },
        },
        {
            title: '입사일',
            dataIndex: 'entr_date',
            key: 'entr_date',
            width: 110,
            sorter: (a, b) => new Date(a) - new Date(b),
            render: (text) => {
                return (
                    <div style={{textAlign: 'center'}}>
                        {text}
                    </div>
                );
            },
        },
        {
            title: '퇴사일',
            dataIndex: 'rsg_dt',
            key: 'rsg_dt',
            width: 110,
            sorter: (a, b) => a - b,
            render: (text) => {
                return (
                    <div style={{textAlign: 'center'}}>
                        {text}
                    </div>
                );
            },
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
                                  onClick={() => {setModifyData(el);setIsModify(true);setIsInsert(true);
                                      setFileList(el.file_url ? [{
                                          uid: '- 1,',
                                          name: 'image',
                                          status: 'done',
                                          url: el.file_url,
                                      }] : []);
                                  }}
                                  style={{ color: '#1890ff' }}
                                  size="small"
                              />
                          </div>
                      }>
<Row gutter={12}>
    <Col span={4}>
        {el.file_url?<Image src={el.file_url} width={50} height={50} style={{objectFit: 'cover'}}></Image>:<div></div>}
    </Col>
    <Col span={20}>
        <Row gutter={[8 , 12]}>
            <Col span={8}>이름</Col>
            <Col span={16}>{el.nm}</Col>
            <Col span={8}>연락처</Col>
            <Col span={16}>{el.tel}</Col>

            <Col span={8}>권한</Col>
            <Col span={16}>{el.auth===1?"관리자":el.auth===9?"최고관리자":"기사"}</Col>
            <Col span={8}>계약형태</Col>
            <Col span={16}>{el.type===1?"정규직":"계약직"}</Col>

            <Col span={8}>입사일자</Col>
            <Col span={16}>{el.entr_date}</Col>

            <Col span={8}>주소</Col>
            <Col span={16}>{el.addr}</Col>

            <Col span={8}>메일</Col>
            <Col span={16}>{el.mail}</Col>

            <Col span={8}>은행</Col>
            <Col span={16}>{
                el.bank===1?"한국은행":el.bank===2?"산업은행":el.bank===3?"기업은행":el.bank===6?"국민은행":el.bank===11?"농협은행":el.bank===20?"우리은행":el.bank===23?"SC은행"
                    :el.bank===27?"한국씨티은행":el.bank===81?"KEB하나은행":el.bank===88?"신한은행":el.bank===90?"카카오뱅크":el.bank===31?"대구은행":el.bank===32?"부산은행"
            :el.bank===34?"광주은행":el.bank===35?"제주은행":el.bank===37?"전북은행":el.bank===39?"경남은행":"-"}</Col>
            <Col span={8}>계좌번호</Col>
            <Col span={16}>{el.account_num}</Col>

        </Row>

    </Col>
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