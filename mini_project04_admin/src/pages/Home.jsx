import React, {PureComponent, useEffect, useState} from 'react';
import {
    ComposedChart,
    Line,
    Area,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    Scatter,
    BarChart,
    ResponsiveContainer, PieChart, Pie, Cell,Sector
} from 'recharts';
import {Breadcrumb, DatePicker, Button, Flex, Select, Card, Col, Row, Table, Statistic} from 'antd';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import {useNavigate} from "react-router-dom";
import styles from '../css/home.module.css'
import {CalendarOutlined, CheckCircleOutlined, CloseCircleOutlined, SearchOutlined} from '@ant-design/icons';
import locale from "antd/es/date-picker/locale/ko_KR";
import '../css/home.css';
import {getStatesByPeriod} from "../js/supabaseDashboard.js";
dayjs.extend(customParseFormat);


function Home(props) {
    let [data, setData] = useState([]);
    let [timeData, setTimeData] = useState([]);
    let [loading, setLoading] = useState(false);
    let [daily, setDaily] = useState(1);
    let [state, setState] = useState(1);
    useEffect(() => {
        if(daily==1) {
            chooseDate(dayjs());
        }else{
            chooseYear(dayjs());
        }
    }, []);
    let homeNavi = useNavigate();

    /*변수 선언*/
    const weekFormat = 'MM-DD';
    const monthFormat = 'YYYY-MM';
    const dateFormat = 'YYYY-MM-DD';
    const yearFormat = 'YYYY';
    const timeRole = ["오전 10시 ~ 오후 1시","오후 2시 ~ 오후 5시","오후 4시 ~ 오후 7시","오후 6시 ~ 오후 9시"];
    const stateRole = {
        5: "처리완료",
        9: "취소",
        10: "누적예약"
    };
    /*table 설정*/
    let dateColumns = [
        {
            title: '일자',
            dataIndex: '일자',
            key: '일자',
            width: 80,
            fixed: 'left',
            align: 'center',
        },
        {
            title: '신규예약',
            dataIndex: '신규예약',
            key: '신규예약',
            width: 90,
            sorter: (a, b) => a.신규예약 - b.신규예약,
            render: (text) => {
                return (
                    <div style={{textAlign: 'right'}}>
                        {text}
                    </div>
                );
            },
        },
        {
            title: '취소',
            dataIndex: '취소',
            key: '취소',
            width: 80,
            sorter: (a, b) => a.취소 - b.취소,
            render: (text) => {
                return (
                    <div style={{textAlign: 'right'}}>
                        {text}
                    </div>
                );
            },
        },
        {
            title: '완료',
            dataIndex: '완료',
            key: '완료',
            width: 80,
            sorter: (a,b) => a.완료 - b.완료,
            render: (text) => {
                return (
                    <div style={{textAlign: 'right'}}>
                        {text}
                    </div>
                );
            },
        },
        {
            title: '누적예약',
            dataIndex: '누적예약',
            key: '누적예약',
            width: 80,
            render: (text) => {
                return (
                    <div style={{textAlign: 'right'}}>
                        {text}
                    </div>
                );
            },
        },
    ]
    let timeColumns = [
        {
            title: '시간',
            dataIndex: '시간',
            key: '시간',
            width: 120,
            fixed: 'left',
        },
        {
            title: '신규예약',
            dataIndex: '신규예약',
            key: '신규예약',
            width: 80,
            sorter: (a, b) => a.신규예약 - b.신규예약,
            render: (text) => {
                return (
                    <div style={{textAlign: 'right'}}>
                        {text}
                    </div>
                );
            },
        },
        {
            title: '취소',
            dataIndex: '취소',
            key: '취소',
            width: 70,
            sorter: (a, b) => a.취소 - b.취소,
            render: (text) => {
                return (
                    <div style={{textAlign: 'right'}}>
                        {text}
                    </div>
                );
            },
        },
        {
            title: '완료',
            dataIndex: '완료',
            key: '완료',
            width: 70,
            sorter: (a,b) => a.완료 - b.완료,
            render: (text) => {
                return (
                    <div style={{textAlign: 'right'}}>
                        {text}
                    </div>
                );
            },
        },
        {
            title: '누적예약',
            dataIndex: '누적예약',
            key: '누적예약',
            width: 70,
            render: (text) => {
                return (
                    <div style={{textAlign: 'right'}}>
                        {text}
                    </div>
                );
            },
        },
        ]
    /*기능 함수*/
    let changeWeek = (e) => {
        setDaily(e);
        if(e == 1) {
            chooseDate(dayjs());
        }else{
            chooseYear(dayjs());
        }
    }
    
    let changeState = (e) => {
        setState(e);
    }
    
    let chooseDate = async (e) => {
        if(e == null) return;
        let prop = dayjs(e).startOf('week').format('YYYY,MM,DD');
        setLoading(true);
        prop = prop.split(',').map(el=>parseInt(el));
        await getStatesByPeriod(prop[0], prop[1], prop[2], 1).then((res) => {
            let outerData = [];
            let innerDate = "";
            let outerTime = [];
            let innerTime = "";
            let innerBarSum = 0;
            let innerPieSum = 0;
            /*바차트 데이터 가공*/
            for(let i=0; i<7; i++){
                let innerData = {};
                innerData["key"] = i+1;
                innerData["일자"] = dayjs(`${prop[0]}-${prop[1]}-${prop[2]+i}`).startOf("date").format("MM/DD");
                innerData["신규예약"] = 0;
                innerData["취소"] = 0;
                innerData["완료"] = 0;
                innerData["누적예약"] = 0;
                outerData.push(innerData);
            }

            if(res.data.stat_by_date?.length>0) {
                res.data.stat_by_date.map((el, idx) => {
                    let innerData = {};
                    innerBarSum += el.cnt;
                    if (innerDate != el.date.slice(5).replace("-", "/")) {
                        innerDate = el.date.slice(5).replace("-", "/");
                        let originInner = outerData.find(el => el["일자"] == innerDate);
                        let originInnerIdx = outerData.findIndex(el => el["일자"] == innerDate);
                        if (stateRole[el.state]?.length > 0) {
                            originInner[stateRole[el.state]] = el.cnt;
                        }
                        if (el.state == 9) innerBarSum -= el.cnt;
                        originInner["신규예약"] += el.cnt;
                        originInner["누적예약"] = innerBarSum;
                        outerData.map((el, index) => index > originInnerIdx ? el["누적예약"] = innerBarSum : '');
                    } else {
                        let originInner = outerData.find(el => el["일자"] == innerDate);
                        let originInnerIdx = outerData.findIndex(el => el["일자"] == innerDate);
                        if (stateRole[el.state]?.length > 0) {
                            originInner[stateRole[el.state]] = el.cnt;
                        }
                        if (el.state == 9) innerBarSum -= el.cnt;
                        originInner["신규예약"] += el.cnt;
                        originInner["누적예약"] = innerBarSum;
                        outerData.map((el, index) => index > originInnerIdx ? el["누적예약"] = innerBarSum : '');
                    }
                });
            }
            setData(outerData);
            
            /*파이차트 데이터*/
            timeRole.forEach((el,i) => {
                let innerTimeData = {};
                innerTimeData["key"] = i+1;
                innerTimeData["시간"] = el;
                innerTimeData["신규예약"] = 0;
                innerTimeData["취소"] = 0;
                innerTimeData["완료"] = 0;
                innerTimeData["누적예약"] = 0;
                outerTime.push(innerTimeData);
            })

            if(res.data.stat_total_by_state?.length>0) {
                res.data.stat_total_by_state.map(el => {
                    let innerTimeData = {};
                    innerPieSum += el.cnt;
                    if (innerTime != el.time) {
                        innerTime = el.time;
                        let originInner = outerTime.find(el => el["시간"] == innerTime);
                        let originInnerIdx = outerTime.findIndex(el => el["시간"] == innerTime);
                        if (stateRole[el.state]?.length > 0) {
                            originInner[stateRole[el.state]] = el.cnt;
                        }
                        if (el.state == 9) innerPieSum -= el.cnt;
                        originInner["신규예약"] += el.cnt;
                        originInner["누적예약"] = innerPieSum;
                        outerTime.map((el, index) => index > originInnerIdx ? el["누적예약"] = innerPieSum : '');
                    } else {
                        let originInner = outerTime.find(el => el["시간"] == innerTime);
                        let originInnerIdx = outerTime.findIndex(el => el["시간"] == innerTime);
                        if (stateRole[el.state]?.length > 0) {
                            originInner[stateRole[el.state]] = el.cnt;
                        }
                        if (el.state == 9) innerPieSum -= el.cnt;
                        originInner["신규예약"] += el.cnt;
                        originInner["누적예약"] = innerPieSum;
                        outerTime.map((el, index) => index > originInnerIdx ? el["누적예약"] = innerPieSum : '');
                    }
                })
            };
            setTimeData(outerTime);
            setLoading(false);
        });
        // let res2 = await supabase.rpc("getStatesByPeriod",{year: prop[0],month:prop[1],start_date:prop[2],key:daily});
    }
    let chooseYear = async(e) => {
        if(e == null) return;
        let prop = dayjs(e).startOf('year').format('YYYY,MM,DD');
        setLoading(true);
        prop = prop.split(',').map(el=>parseInt(el));
        await getStatesByPeriod(prop[0], prop[1], prop[2], 2).then((res) => {
            let outerData = [];
            let innerDate = "";
            let outerTime = [];
            let innerTime = "";
            let innerBarSum = 0;
            let innerPieSum = 0;
            /*바차트 데이터 가공*/
            for(let i=0; i<12; i++){
                let innerData = {};
                innerData["key"] = i+1;
                innerData["일자"] = dayjs(`${prop[0]}-${prop[1]+i}-${prop[2]}`).startOf("MONTH").format("MM월");
                innerData["신규예약"] = 0;
                innerData["취소"] = 0;
                innerData["완료"] = 0;
                innerData["누적예약"] = 0;
                outerData.push(innerData);
            }

            if(res.data.stat_by_date?.length>0) {
                res.data.stat_by_date.map((el, idx) => {
                    let innerData = {};
                    innerBarSum += el.cnt;
                    if (innerDate != el.date.slice(5, 7) + "월") {
                        innerDate = el.date.slice(5, 7) + "월";
                        let originInner = outerData.find(el => el["일자"] == innerDate);
                        let originInnerIdx = outerData.findIndex(el => el["일자"] == innerDate);
                        if (stateRole[el.state]?.length > 0) {
                            originInner[stateRole[el.state]] = el.cnt;
                        }
                        if (el.state == 9) innerBarSum -= el.cnt;
                        originInner["신규예약"] += el.cnt;
                        originInner["누적예약"] = innerBarSum;
                        outerData.map((el, index) => index > originInnerIdx ? el["누적예약"] = innerBarSum : '');
                    } else {
                        let originInner = outerData.find(el => el["일자"] == innerDate);
                        let originInnerIdx = outerData.findIndex(el => el["일자"] == innerDate);
                        if (stateRole[el.state]?.length > 0) {
                            originInner[stateRole[el.state]] = el.cnt;
                        }
                        if (el.state == 9) innerBarSum -= el.cnt;
                        originInner["신규예약"] += el.cnt;
                        originInner["누적예약"] = innerBarSum;
                        outerData.map((el, index) => index > originInnerIdx ? el["누적예약"] = innerBarSum : '');
                    }
                });
            }
            setData(outerData);

            /*파이차트 데이터*/
            timeRole.forEach((el,i) => {
                let innerTimeData = {};
                innerTimeData["key"] = i+1;
                innerTimeData["시간"] = el;
                innerTimeData["신규예약"] = 0;
                innerTimeData["취소"] = 0;
                innerTimeData["완료"] = 0;
                innerTimeData["누적예약"] = 0;
                outerTime.push(innerTimeData);
            })

            if(res.data.stat_total_by_state?.length>0) {
                res.data.stat_total_by_state.map(el => {
                    let innerTimeData = {};
                    innerPieSum += el.cnt;
                    if (innerTime != el.time) {
                        innerTime = el.time;
                        let originInner = outerTime.find(el => el["시간"] == innerTime);
                        let originInnerIdx = outerTime.findIndex(el => el["시간"] == innerTime);
                        if (stateRole[el.state]?.length > 0) {
                            originInner[stateRole[el.state]] = el.cnt;
                        }
                        if (el.state == 9) innerPieSum -= el.cnt;
                        originInner["신규예약"] += el.cnt;
                        originInner["누적예약"] = innerPieSum;
                        outerTime.map((el, index) => index > originInnerIdx ? el["누적예약"] = innerPieSum : '');
                    } else {
                        let originInner = outerTime.find(el => el["시간"] == innerTime);
                        let originInnerIdx = outerTime.findIndex(el => el["시간"] == innerTime);
                        if (stateRole[el.state]?.length > 0) {
                            originInner[stateRole[el.state]] = el.cnt;
                        }
                        if (el.state == 9) innerPieSum -= el.cnt;
                        originInner["신규예약"] += el.cnt;
                        originInner["누적예약"] = innerPieSum;
                        outerTime.map((el, index) => index > originInnerIdx ? el["누적예약"] = innerPieSum : '');
                    }
                })
            };
            setTimeData(outerTime);
            setLoading(false);
        });
    }
    /*달력, 날짜 커스텀*/
    const customWeekStartEndFormat = value =>
        `${dayjs(value).startOf('week').format(weekFormat)} ~ ${dayjs(value)
            .endOf('week')
            .format(weekFormat)}`;

    /*바 차트 커스텀*/
    class NewReservChart extends PureComponent {
        render() {
            return (
                <ResponsiveContainer width="100%" aspect={1.4}>
                    <BarChart
                        data={data}
                        margin={{
                            top: 20,
                            right: 10,
                            bottom: 20,
                            left: 10,
                        }}
                    >
                        <CartesianGrid stroke="#f5f5f5"/>
                        <XAxis dataKey="일자" fontSize={8} angle={-45} textAnchor="end"/>
                        <YAxis
                            label={{
                                position: 'right',
                                offset: -10
                            }}
                            yAxisId="left"
                            orientation="left"
                        />
                        <Tooltip color="#FFFFFF"/>
                        <Bar dataKey="신규예약" fill="#93B2FF" yAxisId={"left"}/>
                        <Bar dataKey="취소" fill="#FFA69F" yAxisId={"left"}/>
                        <Bar dataKey="완료" fill="#D6FF9F" yAxisId={"left"}/>
                    </BarChart>
                </ResponsiveContainer>
            );
        }
    }

    /*파이,원형 차트 커스텀*/
    const COLORS = ['#eafdb2', '#d5ffa0', '#9bffa0','#acffc9'];


    const renderCustomizedLabel = (props) => {
        let { cx, cy, midAngle, innerRadius, outerRadius, percent, index,value } = props;
        if(value==0) return;
        const RADIAN = Math.PI / 180;

        const radius = innerRadius + (outerRadius - innerRadius) * 0.05;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);
        const mx = x + (radius-75) * Math.cos(-midAngle * RADIAN);
        const my = y + (radius-20) * Math.sin(-midAngle * RADIAN);
        return (
            <text x={mx} y={my} fill="black" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                {`${state==1?"신규예약":state==9?"취소":"완료"} : ${state==1?props.신규예약:state==9?props.취소:props.완료}건`}
            </text>
        );
    };


    class TimeRound extends PureComponent {

        state = {
            activeIndex: 0,
        };

        onPieEnter = (_, index) => {
            this.setState({
                activeIndex: index,
            });
        };
        render() {
            return (
                <ResponsiveContainer width="90%" aspect={1.4}>
                <PieChart>
                    <Pie
                        animationDuration={500}
                        labelLine={false}
                        label={renderCustomizedLabel}
                        data={timeData}
                        cx="50%"
                        cy="50%"
                        innerRadius="30%"
                        outerRadius="90%"
                        fill="#8884d8"
                        dataKey={state==1?"신규예약":state==9?"취소":"완료"}
                        onMouseEnter={this.onPieEnter}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>

                </PieChart>
                </ResponsiveContainer>
            );
        }
    }


    return (
        <>
            <div className={styles.content}>
            <div>
                <div>
                    <Breadcrumb
                        separator=">"
                        items={[
                            {
                                title: 'Home',
                            },
                            {
                                title: '대시보드',
                                href: '',
                                onClick: (e) => {
                                    e.preventDefault();
                                    homeNavi("/");
                                },
                            },

                        ]}
                    />
                </div>
            </div>

            <div>
                <div className={styles.homeSearch}>
                    <Select
                        defaultValue={daily}
                        style={{minWidth: 80, maxWidth: 100}}
                        onChange={(e) => changeWeek(e)}
                        options={[
                            {value: 1, label: '일간'},
                            {value: 2, label: '월간'},
                        ]}
                    />

                    {
                        daily == 1 ? (
                            <DatePicker locale={locale} defaultValue={dayjs()} format={customWeekStartEndFormat} onChange={(e)=>chooseDate(e)}
                                        picker="week"/>) : (
                            <DatePicker locale={locale} defaultValue={dayjs('2015/01', yearFormat)} onChange={(e)=>chooseYear(e)}
                                        format={yearFormat}
                                        picker="year"/>)
                    }


                    <Button loading={loading} type={"primary"} color={"geekblue"} className={styles.Btn} icon={<SearchOutlined/>}></Button>
                </div>
                <Row gutter={[16, 8]}>
                    <Col xl={8} md={8} xs={24}>
                        <Card style={{backgroundColor: '#F1F5FF'}}>
                            <Row justify="center" align="top">
                                <Col md={16} xs={24}>
                                    <Row>
                                        <Col md={24} xs={24}>
                                            <Statistic
                                                title="신규예약"
                                                value={timeData.reduce((a,b)=>{
                                                    return a+b.신규예약;
                                                },0)>0?[...timeData].sort((a,b)=>(b.신규예약-a.신규예약))[0].시간:" "}
                                                prefix={timeData.reduce((a,b)=>{
                                                    return a+b.신규예약;
                                                },0)>0?<CalendarOutlined />:""}
                                                valueStyle={{ color: '#1890ff', fontSize: '1.45vw', fontWeight: 'bold' }}
                                            />
                                        </Col>
                                        <Col md={24} xs={24}>
                                            <p></p>
                                        </Col>
                                    </Row>
                                </Col>
                                <Col className={styles.palete} md={8} xs={24}>
                                    <Row>
                                        <Col md={24} xs={24}>
                                            <h3>누계</h3>
                                        </Col>
                                        <Col md={24} xs={24}>
                                            <p>{timeData?.length>0?timeData.reduce((a,b)=>{
                                                return a+b.신규예약;
                                            },0):"0"} 건</p>
                                        </Col>
                                    </Row>
                                </Col>

                            </Row>
                        </Card>
                    </Col>
                    <Col xl={8} md={8} xs={0}>
                        <Card style={{backgroundColor: '#FEF1F0'}}>
                            <Row justify="center" align="top">

                                <Col md={16} xs={24}>
                                    <Row>
                                        <Col md={24} xs={24}>
                                            <Statistic
                                                title="취소"
                                                value={timeData.reduce((a,b)=>{
                                                    return a+b.취소;
                                                },0)>0?[...timeData].sort((a,b)=>(a.취소-b.취소))[0].시간:" "}
                                                prefix={timeData.reduce((a,b)=>{
                                                    return a+b.취소;
                                                },0)>0?<CloseCircleOutlined />:""}
                                                valueStyle={{ color: '#ff4d4f', fontSize: '1.45vw', fontWeight: 'bold' }}
                                            />
                                        </Col>
                                        <Col md={24} xs={24}>
                                            <p></p>
                                        </Col>
                                    </Row>
                                </Col>
                                <Col className={styles.palete} md={8} xs={24}>
                                    <Row>
                                        <Col md={24} xs={24}>
                                            <h3>누계</h3>
                                        </Col>
                                        <Col md={24} xs={24}>
                                            <p>{timeData?.length>0?timeData.reduce((a,b)=>{
                                                return a+b.취소;
                                            },0):"0"} 건</p>
                                        </Col>
                                    </Row>
                                </Col>

                            </Row>
                        </Card>
                    </Col>
                    <Col xl={8} md={8} xs={0}>
                        <Card style={{backgroundColor: '#F7FFEC'}}>
                            <Row justify="center" align="top">

                                <Col md={16} xs={16}>
                                    <Row>
                                        <Col md={24} xs={24}>
                                            <Statistic
                                                title="완료"
                                                value={timeData.reduce((a,b)=>{
                                                    return a+b.완료;
                                                },0)>0?[...timeData].sort((a,b)=>(a.완료-b.완료))[0].시간:"  "}
                                                prefix={timeData.reduce((a,b)=>{
                                                    return a+b.완료;
                                                },0)>0?<CheckCircleOutlined />:""}
                                                valueStyle={{ color: '#096dd9', fontSize: '1.45vw', fontWeight: 'bold' }}
                                            />
                                        </Col>
                                        <Col md={24} xs={24}>
                                            <p></p>
                                        </Col>
                                    </Row>
                                </Col>
                                <Col className={styles.palete} md={8} xs={8}>
                                    <Row>
                                        <Col md={24} xs={24}>
                                            <h3>누계</h3>
                                        </Col>
                                        <Col md={24} xs={24}>
                                            <p>{timeData?.length>0?timeData.reduce((a,b)=>{
                                                return a+b.완료;
                                            },0):"0"} 건</p>
                                        </Col>
                                    </Row>
                                </Col>

                            </Row>
                        </Card>
                    </Col>
                </Row>
                {/*<div className={styles.dashBoard}>
                    <Example/>
                </div>*/}
                <Row style={{marginTop: 8,height:"80%",placeItems:'center',padding:'10px'}} gutter={[16, 16]}>
                    <Col md={12} xs={24}>
                        <NewReservChart/>
                        <Table
                            columns={dateColumns}
                            dataSource={data}
                            pagination={false}
                            scroll={{ y: 195 }}
                            bordered
                            summary={(barDataList) => {
                                let totalNew = 0;
                                let totalCancel = 0;
                                let totalComplete = 0;
                                let totalTotal = 0;
                                barDataList.forEach(({신규예약,취소,완료,누적예약}) => {
                                        totalNew+= 신규예약;
                                        totalCancel+= 취소;
                                        totalComplete+= 완료;
                                        totalTotal = 누적예약;
                                })

                                return (<Table.Summary fixed>
                                    <Table.Summary.Row>
                                        <Table.Summary.Cell index={0} className={styles.summary_text_center}>누계</Table.Summary.Cell>
                                        <Table.Summary.Cell index={1} className={styles.summary_text_right}>{totalNew}</Table.Summary.Cell>
                                        <Table.Summary.Cell index={2} className={styles.summary_text_right}>{totalCancel}</Table.Summary.Cell>
                                        <Table.Summary.Cell index={3} className={styles.summary_text_right}>{totalComplete}</Table.Summary.Cell>
                                        <Table.Summary.Cell index={4} className={styles.summary_text_right}>{totalTotal}</Table.Summary.Cell>
                                    </Table.Summary.Row>
                                </Table.Summary>)
                            }}
                            size={"small"}
                        />
                    </Col>
                    <Col md={12} xs={24}>
                        <Select
                            defaultValue={state}
                            style={{minWidth: 80, maxWidth: 100}}
                            onChange={(e) => changeState(e)}
                            options={[
                                {value: 1, label: '신규예약'},
                                {value: 9, label: '취소'},
                                {value: 5, label: '완료'},
                            ]}
                        />
                        <div style={{position:"absolute",top:"0",right:"0",display:"flex",flexDirection:"column",gap:"0.1rem",justifyContent:"center"}} >

                        {
                            timeData.map((el, idx) => {
                                return (
                                    <span key={el.key} style={{display:"flex",alignItems:"center"}}>
                                        <div style={{backgroundColor:`${COLORS[idx % COLORS.length]}`,width:'2vw',height:'2vw'}}/>
                                        <div style={{fontSize:"1.6vh"}}>{el.시간}</div>
                                    </span>
                                );
                            })
                        }
                        </div>
                    <TimeRound/>
                        <Table
                            columns={timeColumns}
                            dataSource={timeData}
                            pagination={false}
                            bordered
                            scroll={{ x: 500 }}
                            summary={(pieDataList) => {
                                let totalNew = 0;
                                let totalCancel = 0;
                                let totalComplete = 0;
                                let totalTotal = 0;
                                pieDataList.forEach(({신규예약,취소,완료,누적예약}) => {
                                    totalNew+= 신규예약;
                                    totalCancel+= 취소;
                                    totalComplete+= 완료;
                                    totalTotal = 누적예약;
                                })
                                return (<Table.Summary fixed>
                                    <Table.Summary.Row>
                                        <Table.Summary.Cell index={0} className={styles.summary_text_left}>누계</Table.Summary.Cell>
                                        <Table.Summary.Cell index={1} className={styles.summary_text_right}>{totalNew}</Table.Summary.Cell>
                                        <Table.Summary.Cell index={2} className={styles.summary_text_right}>{totalCancel}</Table.Summary.Cell>
                                        <Table.Summary.Cell index={3} className={styles.summary_text_right}>{totalComplete}</Table.Summary.Cell>
                                        <Table.Summary.Cell index={4} className={styles.summary_text_right}>{totalTotal}</Table.Summary.Cell>
                                    </Table.Summary.Row>
                                </Table.Summary>)
                            }}
                            size={"small"}
                        />
                    </Col>
                </Row>
            </div>
            </div>
        </>
    );
}

export default Home;
