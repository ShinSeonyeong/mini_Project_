import React, { useState, useEffect } from 'react';
import {Layout, Button, Modal, Card, Flex, Breadcrumb, Input, Pagination} from 'antd';
import {SearchOutlined, PlusOutlined} from "@ant-design/icons";
import ReservationTable from '../components/ReservationTable';
import ReservationForm from '../components/ReservationForm';
import styles from "../css/reservation.module.css";
import { supabase } from "../js/supabase.js";

import dayjs from 'dayjs';
import 'dayjs/locale/ko';

const { Content } = Layout;

const Reservation = () => {
    const [reservations, setReservations] = useState([]);
    const [filteredReservations, setFilteredReservations] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingReservation, setEditingReservation] = useState(null);
    const [searchText, setSearchText] = useState('');
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
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);

    // 데이터 가져오기 (전달된 filters 사용)
    const fetchReservations = async (appliedFilters) => {
        let query = supabase.from('reservation').select('*');

        if (dateRange.length === 2 && dayjs.isDayjs(dateRange[0]) && dayjs.isDayjs(dateRange[1])) {
            const startDate = dateRange[0].format('YYYY-MM-DD');
            const endDate = dateRange[1].format('YYYY-MM-DD');
            query = query
                .gte('date', startDate)
                .lte('date', endDate);
        } else {
            const defaultStart = dayjs().subtract(1, 'month').startOf('day').format('YYYY-MM-DD');
            const defaultEnd = dayjs().endOf('day').format('YYYY-MM-DD');
            setDateRange([dayjs(defaultStart), dayjs(defaultEnd)]);
            query = query
                .gte('date', defaultStart)
                .lte('date', defaultEnd);
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

    // 초기 데이터 로드
    useEffect(() => {
        fetchReservations(filters);
    }, [dateRange]);

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

    // 검색 핸들러 추가
    const handleSearch = () => {
        const searchResults = reservations.filter(reservation => 
            reservation.customer.name.toLowerCase().includes(searchText.toLowerCase()) ||
            reservation.tel.includes(searchText) ||
            reservation.user_email.toLowerCase().includes(searchText.toLowerCase()) ||
            reservation.addr.toLowerCase().includes(searchText.toLowerCase())
        );
        setFilteredReservations(searchResults);
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

                <div className="custom-filter-section">
                    <div className="custom-search-group">
                        <Input
                            className="custom-search-input"
                            placeholder="이름, 전화번호, 이메일 또는 주소 검색"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            prefix={<SearchOutlined style={{ color: "#bdbdbd" }} />}
                            onPressEnter={handleSearch}
                            allowClear
                        />
                    </div>
                </div>

                <div>
                    <ReservationTable
                        reservations={filteredReservations}
                        onEdit={showModal}
                        onDelete={async (res_no) => {
                            await supabase.from('reservation').delete().eq('res_no', res_no);
                            fetchReservations(filters);
                        }}
                        onUpdate={(updatedFilters) => fetchReservations(updatedFilters || filters)}
                    />

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginTop: 16,
                            gap: "8px",
                        }}
                    >
                        <Pagination
                            current={currentPage}
                            pageSize={pageSize}
                            total={filteredReservations.length}
                            onChange={(page) => setCurrentPage(page)}
                            showSizeChanger={false}
                        />
                        <div style={{ display: "flex", gap: "20px" }}>
                            <Button
                                type="primary"
                                onClick={() => {
                                    setEditingReservation(null);
                                    setIsModalOpen(true);
                                }}
                            >
                                신규등록
                            </Button>
                        </div>
                    </div>
                </div>

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