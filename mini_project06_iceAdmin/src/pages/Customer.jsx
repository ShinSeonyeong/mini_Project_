import React, { useState, useEffect } from 'react';
import {Layout, Modal, Card, Flex, Breadcrumb, Pagination} from 'antd';
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
    const [searchText, setSearchText] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);

    // 데이터 가져오기
    const fetchCustomers = async () => {
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
                // 검색어로 필터링
                let filtered = [...customers];
                
                if (searchText) {
                    filtered = filtered.filter((c) => {
                        const searchLower = searchText.toLowerCase();
                        return (
                            c.name?.toLowerCase().includes(searchLower) ||
                            c.phone?.includes(searchText) ||
                            c.email?.toLowerCase().includes(searchLower) ||
                            c.addr?.toLowerCase().includes(searchLower)
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
        fetchCustomers();
    }, []);

    // 검색어가 변경될 때마다 필터링
    useEffect(() => {
        fetchCustomers();
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
                        onDelete={async (email) => {
                            await supabase.from('customer').delete().eq('email', email);
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