import React, { useState, useEffect } from 'react';
import {Layout, Button, Modal, Card, Flex, Breadcrumb, Pagination} from 'antd';
import {PlusOutlined} from "@ant-design/icons";
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
        try {
            // 날짜 필터링 없이 모든 데이터 조회
            let query = supabase.from('reservation').select('*');

            const { data: reservations, error } = await query;
            // console.log('Reservations data:', reservations);
            // console.log('Reservations error:', error);
            
            if (error) {
                // console.error('Error fetching reservations:', error);
                return;
            }

            if (reservations && reservations.length > 0) {
                // customer 정보 가져오기
                const resNos = reservations.map(r => r.res_no);
                // console.log('Reservation numbers:', resNos);
                
                const { data: customers, error: customerError } = await supabase
                    .from('customer')
                    .select('*')
                    .in('res_no', resNos);
                
                // console.log('Customers data:', customers);
                // console.log('Customers error:', customerError);
                
                if (customerError) {
                    // console.error('Error fetching customers:', customerError);
                    // customer 정보 없이도 reservation 데이터는 표시
                    setReservations(reservations);
                    setFilteredReservations(reservations);
                } else {
                    // customer 정보를 reservation에 병합
                    const customerMap = {};
                    customers.forEach(c => {
                        customerMap[c.res_no] = c;
                    });
                    
                    const mergedData = reservations.map(r => ({
                        ...r,
                        customer: customerMap[r.res_no] || null
                    }));
                    
                    // console.log('Merged data:', mergedData);
                    
                    // 필터 적용
                    let filtered = [...mergedData];
                    if (appliedFilters.name) {
                        filtered = filtered.filter((r) =>
                            r.customer?.name?.toLowerCase().includes(appliedFilters.name.toLowerCase())
                        );
                    }
                    if (appliedFilters.tel) {
                        filtered = filtered.filter((r) => r.customer?.phone?.includes(appliedFilters.tel));
                    }
                    if (appliedFilters.email) {
                        filtered = filtered.filter((r) =>
                            r.customer?.email?.toLowerCase().includes(appliedFilters.email.toLowerCase())
                        );
                    }
                    if (appliedFilters.addr) {
                        filtered = filtered.filter((r) =>
                            r.addr?.toLowerCase().includes(appliedFilters.addr.toLowerCase())
                        );
                    }

                    // console.log('Final filtered data:', filtered);
                    setReservations(mergedData);
                    setFilteredReservations(filtered);
                }
            } else {
                console.log('No reservations found');
                setReservations([]);
                setFilteredReservations([]);
            }
        } catch (error) {
            console.error('Unexpected error:', error);
        }
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
                            },
                        ]}
                    />
                </div>

                <div>
                    <ReservationTable
                        data={filteredReservations}
                        onEdit={showModal}
                        onDelete={async (res_no) => {
                            await supabase.from('reservation').delete().eq('res_no', res_no);
                            fetchReservations(filters);
                        }}
                        onDataChange={() => fetchReservations(filters)}
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