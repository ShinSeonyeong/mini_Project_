import React, { useState, useEffect } from 'react';
import {Layout, Button, Modal, Card, Flex, Breadcrumb, Pagination, DatePicker} from 'antd';
import {PlusOutlined} from "@ant-design/icons";
import ReservationTable from '../components/ReservationTable';
import ReservationForm from '../components/ReservationForm';
import styles from "../css/reservation.module.css";
import { supabase } from "../js/supabase.js";

import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import locale from 'antd/es/date-picker/locale/ko_KR';

const { Content } = Layout;
const { RangePicker } = DatePicker;

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
        dayjs().subtract(7, 'days').startOf('day'),
        dayjs().add(1, 'month').endOf('day'),
    ]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalReservations, setTotalReservations] = useState(0);
    const pageSize = 10;
    const [modalKey, setModalKey] = useState(0);
    const [filterState, setFilterState] = useState("all");
    const [searchText, setSearchText] = useState("");

    // 데이터 가져오기 (전달된 filters 사용)
    const fetchReservations = async (appliedFilters) => {
        try {
            // 날짜 범위로 필터링하여 데이터 조회
            let query = supabase
                .from('reservation')
                .select('*', { count: 'exact' })
                .gte('date', dateRange[0].format('YYYY-MM-DD'))
                .lte('date', dateRange[1].format('YYYY-MM-DD'))
                .range((currentPage - 1) * pageSize, currentPage * pageSize - 1)
                .order('date', { ascending: false });

            // 상태 필터 적용
            if (filterState !== "all") {
                query = query.eq('state', parseInt(filterState));
            }

            // 검색어 필터 적용
            if (searchText) {
                query = query.or(`addr.ilike.%${searchText}%,model.ilike.%${searchText}%`);
            }

            const { data: reservations, error, count } = await query;
            
            if (error) {
                return;
            }

            if (reservations && reservations.length > 0) {
                // customer 정보 가져오기
                const resNos = reservations.map(r => {
                    if(r.user_email)
                    return r.user_email
                }).filter(el=>!!el);
                
                let customerQuery = supabase
                    .from('customer')
                    .select('*');

                if (searchText) {
                    customerQuery = customerQuery.or(
                        `name.ilike.%${searchText}%,phone.ilike.%${searchText}%,email.ilike.%${searchText}%`
                    );
                }

                if (resNos.length > 0) {
                    customerQuery = customerQuery.in('email', resNos);
                }

                const { data: customers, error: customerError } = await customerQuery;
                
                if (customerError) {
                    setReservations(reservations);
                    setFilteredReservations(reservations);
                    setTotalReservations(count || 0);
                } else {
                    // customer 정보를 reservation에 병합
                    const customerMap = {};
                    customers.forEach(c => {
                        customerMap[c.email] = c;
                    });
                    
                    const mergedData = reservations.map(r => ({
                        ...r,
                        customer: customerMap[r.user_email] || null
                    }));

                    setReservations(mergedData);
                    setFilteredReservations(mergedData);
                    setTotalReservations(count || 0);
                }
            } else {
                setReservations([]);
                setFilteredReservations([]);
                setTotalReservations(0);
            }
        } catch (error) {
            console.error('Unexpected error:', error);
        }
    };

    // 초기 데이터 로드
    useEffect(() => {
        fetchReservations(filters);
    }, [dateRange, filterState, currentPage, searchText]); // searchText 추가

    // 필터나 날짜가 변경될 때 첫 페이지로 이동
    useEffect(() => {
        setCurrentPage(1);
    }, [dateRange, filterState, searchText]); // searchText 추가

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

    // 날짜 범위 변경 핸들러
    const handleDateChange = (dates) => {
        if (dates && dates.length === 2 && dayjs.isDayjs(dates[0]) && dayjs.isDayjs(dates[1])) {
            setDateRange([dates[0].startOf('day'), dates[1].endOf('day')]);
        } else {
            setDateRange([dayjs().startOf('day'), dayjs().add(1, 'month').endOf('day')]);
        }
    };

    const handleFilterStateChange = (state) => {
        setFilterState(state);
    };

    const handleSearch = (value) => {
        setSearchText(value);
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

                <div style={{ marginBottom: 16 }}>
                    <RangePicker
                        locale={locale}
                        value={dateRange}
                        onChange={handleDateChange}
                        format="YYYY-MM-DD"
                        style={{ marginBottom: 16 }}
                        allowClear={false}
                        disabledDate={(current) => {
                            // 과거 1년 이전 날짜만 선택 불가
                            return current && current < dayjs().subtract(1, 'year').startOf('day');
                        }}
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
                        onDataChange={fetchReservations}
                        onFilterStateChange={handleFilterStateChange}
                        currentFilterState={filterState}
                        onSearch={handleSearch}
                        searchText={searchText}
                    />

                    <div className={styles.pagination_container}>
                        <Pagination
                            current={currentPage}
                            pageSize={pageSize}
                            total={totalReservations}
                            onChange={(page) => setCurrentPage(page)}
                            showSizeChanger={false}
                        />
                        <div style={{ display: "flex", gap: "20px" }}>
                            <Button
                                type="primary"
                                onClick={() => {
                                    setEditingReservation(null);
                                    setModalKey(prevKey => prevKey + 1);
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
                    destroyOnHidden={true}
                >
                    <ReservationForm
                        key={modalKey}
                        reservation={editingReservation}
                        onSuccess={handleOk}
                    />
                </Modal>
            </div>
        </>
    );
};

export default Reservation;