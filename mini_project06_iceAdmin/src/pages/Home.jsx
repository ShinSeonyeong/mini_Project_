import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Table, Spin } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getDashboard } from "../js/supabaseDashboard.js";
import { getReservations } from '../js/supabaseRes.js';
import '../css/Dashboard.css';
import dayjs from 'dayjs';

function Home() {
    const [stats, setStats] = useState({
        '신규예약': 0,
        '결제완료': 0,
        '청소완료': 0,
        '예약취소': 0,
    });
    const [timeData, setTimeData] = useState([]);
    const [recentReservations, setRecentReservations] = useState([]);
    const [loading, setLoading] = useState(true);

    const stateMapping = {
        1: '신규예약',
        2: '결제대기',
        3: '결제완료',
        4: '기사배정',
        5: '청소완료',
        6: '예약취소',
    };
    
    const timeOrder = ["10:00", "12:00", "14:00", "16:00"];

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const today = dayjs();
            const year = today.year();
            const month = today.month() + 1;
            const date = today.date();

            // getDashboard RPC call
            const { data: dashboardData, error: dashboardError } = await getDashboard(year, month, date, 1);
            
            if (dashboardData) {
                // Process stats
                const newStats = { '신규예약': 0, '결제완료': 0, '청소완료': 0, '예약취소': 0 };
                dashboardData.stat_total_by_state.forEach(item => {
                    const stateName = stateMapping[item.state];
                    if (stateName && newStats.hasOwnProperty(stateName)) {
                        newStats[stateName] += item.cnt;
                    }
                });
                setStats(newStats);

                // Process time data for chart
                const newTimeData = timeOrder.map(time => ({
                    time: `${time.split(':')[0]}시`,
                    '예약 건수': 0,
                }));

                dashboardData.stat_total_by_state.forEach(item => {
                    const timeIndex = timeOrder.indexOf(item.time);
                    if (timeIndex !== -1) {
                        newTimeData[timeIndex]['예약 건수'] += item.cnt;
                    }
                });
                setTimeData(newTimeData);
            }
            
            // Fetch recent reservations
            const { data: resData, error: resError } = await getReservations(1, 5); // page 1, limit 5
            if (resData) {
                const formattedData = resData.map(r => ({
                    key: r.res_no,
                    customerName: r.customer ? r.customer.name : '알 수 없음',
                    resDate: dayjs(r.date).format('YYYY-MM-DD'),
                    resTime: r.time,
                    phone: r.customer ? r.customer.phone : '알 수 없음',
                    state: stateMapping[r.state] || '알 수 없음'
                }));
                setRecentReservations(formattedData);
            }

            setLoading(false);
        };

        fetchData();
    }, []);

    const recentReservationsColumns = [
        { title: '고객명', dataIndex: 'customerName', key: 'customerName' },
        { title: '예약일', dataIndex: 'resDate', key: 'resDate' },
        { title: '예약시간', dataIndex: 'resTime', key: 'resTime' },
        { title: '연락처', dataIndex: 'phone', key: 'phone' },
        { title: '상태', dataIndex: 'state', key: 'state' },
    ];

    return (
        <Spin spinning={loading} size="large">
            <div className="dashboard">
                <h1 className="dashboard-title">ICECARE 대시보드</h1>
                <Row gutter={[24, 24]}>
                    <Col xs={24} lg={12}>
                        <Row gutter={[24, 24]}>
                            <Col xs={24} sm={12}>
                                <Card className="stat-card new-reservation">
                                    <h3>신규예약</h3>
                                    <p>{stats['신규예약']}</p>
                                </Card>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Card className="stat-card payment-complete">
                                    <h3>결제완료</h3>
                                    <p>{stats['결제완료']}</p>
                                </Card>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Card className="stat-card cleaning-complete">
                                    <h3>청소완료</h3>
                                    <p>{stats['청소완료']}</p>
                                </Card>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Card className="stat-card reservation-canceled">
                                    <h3>예약취소</h3>
                                    <p>{stats['예약취소']}</p>
                                </Card>
                            </Col>
                        </Row>
                    </Col>
                    <Col xs={24} lg={12}>
                        <div className="chart-container" style={{ height: '100%' }}>
                            <h2 className="section-title">시간대별 예약 건수 분포</h2>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={timeData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="time" tick={{ fontSize: 14 }} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 14 }}/>
                                    <Tooltip />
                                    <Bar dataKey="예약 건수" fill="#8884d8" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Col>
                </Row>

                <Row style={{ marginTop: '24px' }}>
                    <Col xs={24}>
                        <div className="recent-reservations-container">
                            <h2 className="section-title">최근 예약 목록 요약</h2>
                            <Table
                                columns={recentReservationsColumns}
                                dataSource={recentReservations}
                                pagination={false}
                                scroll={{ x: true }}
                            />
                        </div>
                    </Col>
                </Row>
            </div>
        </Spin>
    );
}

export default Home;
