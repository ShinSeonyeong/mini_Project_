import React from 'react';
import { Card, Statistic, DatePicker } from 'antd';
import { Col, Row } from 'antd';
import { CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined, FileDoneOutlined, CloseCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import locale from 'antd/es/date-picker/locale/ko_KR';
dayjs.locale('ko');

const { RangePicker } = DatePicker;

const ResDashboard = ({ reservations, dateRange, setDateRange }) => {
    const stats = {
        total: reservations.length,
        state1: reservations.filter((r) => r.state === 1).length,
        state4: reservations.filter((r) => r.state === 4).length,
        state5: reservations.filter((r) => r.state === 5).length,
        state9: reservations.filter((r) => r.state === 9).length
    };

    const handleDateChange = (dates) => {
        if (dates && dates.length === 2 && dayjs.isDayjs(dates[0]) && dayjs.isDayjs(dates[1])) {
            setDateRange([dates[0].startOf('day'), dates[1].endOf('day')]);
        } else {
            setDateRange([dayjs().subtract(1, 'month').startOf('day'), dayjs().endOf('day')]);
        }
    };

    return (
        <Card
            style={{
                marginBottom: 16,
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                borderRadius: 8,
            }}
        >
            <RangePicker
                locale={locale}
                value={dateRange}
                onChange={handleDateChange}
                format="YYYY-MM-DD"
                style={{ marginBottom: 16 }}
                allowClear={false}
                disabledDate={(current) => {
                    return current && (current > dayjs().endOf('day') || current.year() > 2025);
                }}
            />
            <Row gutter={[16, 16]} justify="space-between">
                <Col xs={24} sm={12} md={4.5} style={{ flex: '1' }}>
                    <Card style={{ background: '#e6f7ff', borderRadius: 8 }}>
                        <Statistic
                            title="전체 예약"
                            value={stats.total}
                            prefix={<CalendarOutlined />}
                            valueStyle={{ color: '#1890ff', fontSize: '24px', fontWeight: 'bold' }}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={4.5} style={{ flex: '1' }}>
                    <Card style={{ background: '#fffbe6', borderRadius: 8 }}>
                        <Statistic
                            title="예약 대기"
                            value={stats.state1}
                            prefix={<ClockCircleOutlined />}
                            valueStyle={{ color: '#fa8c16', fontSize: '24px', fontWeight: 'bold' }}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={4.5} style={{ flex: '1' }}>
                    <Card style={{ background: '#f0f5ff', borderRadius: 8 }}>
                        <Statistic
                            title="처리 중"
                            value={stats.state4}
                            prefix={<FileDoneOutlined />}
                            valueStyle={{ color: '#096dd9', fontSize: '24px', fontWeight: 'bold' }}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={4.5} style={{ flex: '1' }}>
                    <Card style={{ background: '#f6ffed', borderRadius: 8 }}>
                        <Statistic
                            title="처리 완료"
                            value={stats.state5}
                            prefix={<CheckCircleOutlined />}
                            valueStyle={{ color: '#52c41a', fontSize: '24px', fontWeight: 'bold' }}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={4.5} style={{ flex: '1' }}>
                    <Card style={{ background: '#fff1f0', borderRadius: 8 }}>
                        <Statistic
                            title="예약 취소"
                            value={stats.state9}
                            prefix={<CloseCircleOutlined />}
                            valueStyle={{ color: '#ff4d4f', fontSize: '24px', fontWeight: 'bold' }}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                        />
                    </Card>
                </Col>
            </Row>
        </Card>
    );
};

export default ResDashboard;