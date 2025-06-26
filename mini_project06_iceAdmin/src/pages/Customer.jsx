import React, { useState, useEffect } from "react";
import { Layout, Modal, Card, Flex, Breadcrumb, Pagination } from "antd";
import CustomerTable from "../components/CustomerTable";
import CustomerForm from "../components/CustomerForm";
import styles from "../css/customer.module.css";
import { supabase } from "../js/supabase.js";

const { Content } = Layout;

const Customer = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCustomers, setTotalCustomers] = useState(0);

  // 데이터 가져오기
  const fetchCustomers = async () => {
    try {
      let query = supabase
        .from("customer")
        .select("*", { count: "exact" })
        .order("res_no", { ascending: false });

      // 검색어로 필터링
      if (searchText) {
        query = query.or(
          `name.ilike.%${searchText}%,addr.ilike.%${searchText}%`
        );
      }

      // 페이지네이션 적용
      const start = (currentPage - 1) * pageSize;
      const end = start + pageSize - 1;
      query = query.range(start, end);

      const { data: customers, error, count } = await query;

      if (error) {
        console.error("Error fetching customers:", error);
        return;
      }

      if (customers) {
        setCustomers(customers);
        setFilteredCustomers(customers);
        setTotalCustomers(count || 0);
      } else {
        setCustomers([]);
        setFilteredCustomers([]);
        setTotalCustomers(0);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    fetchCustomers();
  }, [currentPage, searchText]);

  // 검색어가 변경될 때 첫 페이지로 이동
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText]);

  // 모달 핸들러
  const showModal = (customer = null) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
    fetchCustomers();
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  // 검색 핸들러
  const handleSearchChange = (value) => {
    setSearchText(value);
  };

  return (
    <>
      <div className={styles.content}>
        <div>
          <Breadcrumb
            separator=">"
            items={[{ title: "Home" }, { title: "고객관리", href: "" }]}
          />
        </div>

        <div>
          <CustomerTable
            data={filteredCustomers}
            onEdit={showModal}
            onDelete={async (email) => {
              await supabase.from("customer").delete().eq("email", email);
              fetchCustomers();
            }}
            onDataChange={() => fetchCustomers()}
            searchText={searchText}
            onSearchChange={handleSearchChange}
          />

          <div className={styles.pagination_container}>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={totalCustomers}
              onChange={(page) => setCurrentPage(page)}
              showSizeChanger={false}
            />
          </div>
        </div>

        <Modal
          title="고객 수정"
          open={isModalOpen}
          onOk={handleOk}
          onCancel={handleCancel}
          footer={null}
          width={800}
        >
          <CustomerForm customer={editingCustomer} onSuccess={handleOk} />
        </Modal>
      </div>
    </>
  );
};

export default Customer;
