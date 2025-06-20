import React, { useState, useEffect } from 'react';
import {Layout, Button, Modal, Tabs, Card, Flex, Breadcrumb} from 'antd';
import ReservationTable from '../components/ReservationTable';
import ReservationForm from '../components/ReservationForm';
import ResDashboard from '../components/ResDashboard';
import ResSearchFilters from "../components/ResSearchFilters.jsx";
import styles from "../css/reservation.module.css";
import { supabase } from "../js/supabase.js";

import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import {PlusOutlined} from "@ant-design/icons";

const { Content } = Layout;

const Reservation = () => {
    const [reservations, setReservations] = useState([]);
    const [filteredReservations, setFilteredReservations] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingReservation, setEditingReservation] = useState(null);
    const [filterType, setFilterType] = useState('all');
    const [filters, setFilters] = useState({
        name: '',
        tel: '',
        email: '',
        addr: '',
    });
    const [dateRange, setDateRange] = useState([
        dayjs().subtract(1, 'month').startOf('day'),
        dayjs().endOf('day'),
    ]);

    // 데이터 가져오기 (전달된 filters 사용)
    const fetchReservations = async (appliedFilters) => {
        let query = supabase.from('ice_res').select('*');

        if (filterType === 'cleaning') {
            query = query.eq('service', '청소');
        } else if (filterType === 'repair') {
            query = query.eq('service', '수리');
        }

        if (dateRange.length === 2 && dayjs.isDayjs(dateRange[0]) && dayjs.isDayjs(dateRange[1])) {
            query = query
                .gte('created_at', dateRange[0].toISOString().slice(0,10))
                .lte('created_at', dateRange[1].toISOString().slice(0,10));
        } else {
            setDateRange([dayjs().subtract(1, 'month').startOf('day'), dayjs().endOf('day')]);
            query = query
                .gte('created_at', dayjs().subtract(1, 'month').startOf('day').toISOString())
                .lte('created_at', dayjs().endOf('day').toISOString());
        }

        const { data, error } = await query;
        if (error) {
            console.error('Error fetching reservations:', error);
            return;
        }

        // 필터 적용 (전달된 filters 사용)
        let filtered = [...data];
        if (appliedFilters.name) {
            filtered = filtered.filter((r) =>
                r.name.toLowerCase().includes(appliedFilters.name.toLowerCase())
            );
        }
        if (appliedFilters.tel) {
            filtered = filtered.filter((r) => r.tel.includes(appliedFilters.tel));
        }
        if (appliedFilters.email) {
            filtered = filtered.filter((r) =>
                r.email.toLowerCase().includes(appliedFilters.email.toLowerCase())
            );
        }
        if (appliedFilters.addr) {
            filtered = filtered.filter((r) =>
                r.addr.toLowerCase().includes(appliedFilters.addr.toLowerCase())
            );
        }

        setReservations(data);
        setFilteredReservations(filtered);
    };

    // 초기 데이터 로드 (filters 의존성 제거)
    useEffect(() => {
        fetchReservations(filters);
    }, [filterType, dateRange]); // filters 제거

    // 모달 핸들러
    const showModal = (reservation = null) => {
        setEditingReservation(reservation);
        setIsModalOpen(true);
    };

    const handleOk = () => {
        setIsModalOpen(false);
        setEditingReservation(null);
        fetchReservations(filters);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        setEditingReservation(null);
    };

    // 조회 버튼 핸들러
    const handleSearch = (searchFilters) => {
        fetchReservations(searchFilters);
    };

    return (
        <>
            <div className={styles.content}>
            <div>
                <Breadcrumb
                    separator=">"
                    items={[
                        {
                            title: 'Home',
                        },
                        {
                            title: '예약관리',
                            href: '',
                            onClick: (e) => {
                                e.preventDefault();
                                homeNavi("/reservations");
                            },
                        },

                    ]}
                />
            </div>

                    <Tabs
                        defaultActiveKey="all"
                        onChange={setFilterType}
                        items={[
                            { key: 'all', label: '전체' },
                            { key: 'cleaning', label: '청소' },
                            { key: 'repair', label: '수리' },
                        ]}
                    />

                    <ResDashboard
                        reservations={reservations}
                        dateRange={dateRange}
                        setDateRange={setDateRange}
                    />

                    <ResSearchFilters
                        filters={filters}
                        setFilters={setFilters}
                        onSearch={handleSearch}
                        showModal={showModal}
                    />

                    {/*<Flex justify="end" style={{ marginBottom: 16 }}>*/}
                    {/*    <Button*/}
                    {/*        type="primary"*/}
                    {/*        onClick={() => showModal()}*/}
                    {/*        icon={<PlusOutlined/>}*/}
                    {/*    >*/}
                    {/*        예약등록*/}
                    {/*    </Button>*/}
                    {/*</Flex>*/}

                    <ReservationTable
                        reservations={filteredReservations}
                        onEdit={showModal}
                        onDelete={async (res_no) => {
                            await supabase.from('ice_res').delete().eq('res_no', res_no);
                            fetchReservations(filters);
                        }}
                        onUpdate={(updatedFilters) => fetchReservations(updatedFilters || filters)}
                    />

                    <Modal
                        title={editingReservation ? '예약 수정' : '새 예약 등록'}
                        open={isModalOpen}
                        onOk={handleOk}
                        onCancel={handleCancel}
                        footer={null}
                        width={800}
                    >
                        <ReservationForm
                            reservation={editingReservation}
                            onSuccess={handleOk}
                        />
                    </Modal>

            </div>
        </>
    );
};

export default Reservation;