import React, { useState, useEffect } from 'react';
import {Layout, Button, Modal, Card, Flex, Breadcrumb, Pagination} from 'antd';
import {PlusOutlined} from "@ant-design/icons";
import CustomerTable from '../components/CustomerTable';
import CustomerForm from '../components/CustomerForm';
import styles from "../css/customer.module.css";
import { supabase } from "../js/supabase.js";

const { Content } = Layout;

const Customer = () => {
    const [customers, setCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [filters, setFilters] = useState({
        name: '',
        phone: '',
        email: '',
        addr: '',
    });
    const [searchText, setSearchText] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);

    // 데이터 가져오기
    const fetchCustomers = async (appliedFilters) => {
        try {
            let query = supabase
                .from('customer')
                .select('*');

            const { data: customers, error } = await query;
            
            if (error) {
                console.error('Error fetching customers:', error);
                return;
            }

            if (customers && customers.length > 0) {
                // 필터 적용
                let filtered = [...customers];
                
                // 검색어가 있을 때만 필터링
                if (appliedFilters.name || appliedFilters.phone || appliedFilters.email || appliedFilters.addr) {
                    const searchTerm = appliedFilters.name || appliedFilters.phone || appliedFilters.email || appliedFilters.addr;
                    filtered = filtered.filter((c) => {
                        return (
                            c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            c.phone?.includes(searchTerm) ||
                            c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            c.addr?.toLowerCase().includes(searchTerm.toLowerCase())
                        );
                    });
                }

                setCustomers(customers);
                setFilteredCustomers(filtered);
            } else {
                console.log('No customers found');
                setCustomers([]);
                setFilteredCustomers([]);
            }
        } catch (error) {
            console.error('Unexpected error:', error);
        }
    };

    // 초기 데이터 로드
    useEffect(() => {
        fetchCustomers(filters);
    }, []);

    // 모달 핸들러
    const showModal = (customer = null) => {
        setEditingCustomer(customer);
        setIsModalOpen(true);
    };

    const handleOk = () => {
        setIsModalOpen(false);
        setEditingCustomer(null);
        fetchCustomers(filters);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        setEditingCustomer(null);
    };

    // 검색 핸들러
    const handleSearchChange = (value) => {
        setSearchText(value);
        // 검색어를 필터에 적용 (전체 검색)
        const newFilters = {
            name: value,
            phone: value,
            email: value,
            addr: value,
        };
        setFilters(newFilters);
        fetchCustomers(newFilters);
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
                                title: '고객관리',
                            },
                        ]}
                    />
                </div>

                <div>
                    <CustomerTable
                        data={filteredCustomers}
                        onEdit={showModal}
                        onDelete={async (res_no) => {
                            await supabase.from('customer').delete().eq('res_no', res_no);
                            fetchCustomers(filters);
                        }}
                        onDataChange={() => fetchCustomers(filters)}
                        searchText={searchText}
                        onSearchChange={handleSearchChange}
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
                            total={filteredCustomers.length}
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
                    <CustomerForm
                        customer={editingCustomer}
                        onSuccess={handleOk}
                    />
                </Modal>
            </div>
        </>
    );
};

export default Customer; 