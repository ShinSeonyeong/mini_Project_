import React, { useState, useEffect } from "react";
import {
  Layout,
  Button,
  Modal,
  Card,
  Flex,
  Breadcrumb,
  Pagination,
  DatePicker,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import ReservationTable from "../components/ReservationTable";
import ReservationForm from "../components/ReservationForm";
import styles from "../css/reservation.module.css";
import { supabase } from "../js/supabase.js";

import dayjs from "dayjs";
import "dayjs/locale/ko";
import locale from "antd/es/date-picker/locale/ko_KR";

const { Content } = Layout;
const { RangePicker } = DatePicker;

const Reservation = () => {
  const [reservations, setReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState(null);
  const [filters, setFilters] = useState({
    name: "",
    tel: "",
    email: "",
    addr: "",
  });
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(7, "days").startOf("day"),
    dayjs().add(1, "month").endOf("day"),
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
      // 예약 데이터 조회
      let query = supabase
        .from("reservation")
        .select(
          `
                    *,
                    customer:user_email (
                        name,
                        phone,
                        email
                    )
                `,
          { count: "exact" }
        )
        .gte("date", dateRange[0].format("YYYY-MM-DD"))
        .lte("date", dateRange[1].format("YYYY-MM-DD"))
        .order("res_no", { ascending: false });

      // 상태 필터 적용
      if (filterState !== "all") {
        query = query.eq("state", parseInt(filterState));
      }

      // 검색어 필터 적용 (이름, 주소만)
      if (searchText) {
        // 먼저 검색 조건에 맞는 고객의 이메일을 찾습니다 (이름으로만 검색)
        const { data: customers } = await supabase
          .from("customer")
          .select("email")
          .ilike("name", `%${searchText}%`);

        const customerEmails = customers ? customers.map((c) => c.email) : [];

        // 주소 검색 또는 찾은 고객의 이메일로 예약을 검색
        if (customerEmails.length > 0) {
          query = query.or(
            `addr.ilike.%${searchText}%,user_email.in.(${customerEmails
              .map((email) => `'${email}'`)
              .join(",")})`
          );
        } else {
          query = query.ilike("addr", `%${searchText}%`);
        }
      }

      // 페이지네이션 적용
      query = query.range(
        (currentPage - 1) * pageSize,
        currentPage * pageSize - 1
      );

      const { data: reservations, error, count } = await query;

      if (error) {
        console.error("Error fetching reservations:", error);
        return;
      }

      if (reservations) {
        setReservations(reservations);
        setFilteredReservations(reservations);
        setTotalReservations(count || 0);
      } else {
        setReservations([]);
        setFilteredReservations([]);
        setTotalReservations(0);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  };

  // 초기 데이터 로드 및 검색어 변경 시 데이터 새로고침
  useEffect(() => {
    fetchReservations(filters);
  }, [dateRange, filterState, currentPage, searchText]);

  // 필터나 검색어가 변경될 때 첫 페이지로 이동
  useEffect(() => {
    setCurrentPage(1);
  }, [dateRange, filterState, searchText]);

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
    if (
      dates &&
      dates.length === 2 &&
      dayjs.isDayjs(dates[0]) &&
      dayjs.isDayjs(dates[1])
    ) {
      setDateRange([dates[0].startOf("day"), dates[1].endOf("day")]);
    } else {
      setDateRange([
        dayjs().startOf("day"),
        dayjs().add(1, "month").endOf("day"),
      ]);
    }
  };

  const handleFilterStateChange = (state) => {
    setFilterState(state);
  };

  const handleSearch = (value) => {
    setSearchText(value);
  };

  return (
    <Content className={styles.content}>
      <div className={styles.header}>
        <Breadcrumb
          separator=">"
          items={[{ title: "Home" }, { title: "예약관리", href: "" }]}
        />
      </div>

      <Card className={styles.mainCard}>
        <div style={{ marginBottom: "10px" }}>
          <RangePicker
            locale={locale}
            value={dateRange}
            onChange={handleDateChange}
            className={styles.datePicker}
          />
        </div>

        <div>
          <ReservationTable
            data={filteredReservations}
            onEdit={showModal}
            onDelete={async (res_no) => {
              await supabase.from("reservation").delete().eq("res_no", res_no);
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
                  setModalKey((prevKey) => prevKey + 1);
                  setIsModalOpen(true);
                }}
              >
                신규등록
              </Button>
            </div>
          </div>
        </div>

        <Modal
          title={editingReservation ? "예약 수정" : "새 예약 등록"}
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
      </Card>
    </Content>
  );
};

export default Reservation;
