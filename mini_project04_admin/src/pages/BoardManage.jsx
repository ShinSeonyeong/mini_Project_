import React, {useState, useEffect} from 'react';
import {Table, Button, Input, Select, Modal, Form, message, Space, Tag, Upload, Image, Card, Pagination} from 'antd';
import {supabase} from '../js/supabaseClient.js';
import {EditOutlined, DeleteOutlined, PlusOutlined, UploadOutlined} from '@ant-design/icons';
import {format} from 'date-fns';
import '../css/BoardManage.css';

const {Option} = Select;

const categories = [
    {id: 'all', name: '전체'},
    {id: 1, name: '공지사항'},
    {id: 2, name: 'FAQ'},
];

const BoardManage = () => {
    const [posts, setPosts] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [filterCategory, setFilterCategory] = useState('all'); // 기본값을 'all'로 변경
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [form] = Form.useForm();
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalPosts, setTotalPosts] = useState(0);
    const [fileList, setFileList] = useState([]);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchPosts = async () => {
        let query = supabase
            .from('board')
            .select('*, categories(name)', {count: 'exact'})
            .order('created_at', {ascending: false})
            .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

        if (searchText) {
            query = query.or(`title.ilike.%${searchText}%,author.ilike.%${searchText}%`);
        }

        if (filterCategory !== 'all') { // 'all'일 경우 필터링 제외
            query = query.eq('category_id', filterCategory);
        } else {
            query = query.in('category_id', [1, 2]);
        }

        const {data, error, count} = await query;
        if (error) {
            message.error('게시글을 불러오는 데 실패했습니다.');
            return;
        }
        setPosts(data);
        setTotalPosts(count);
    };

    useEffect(() => {
        fetchPosts();
    }, [currentPage, searchText, filterCategory]);

    const handleUpload = async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `board-images/${fileName}`;

        const {error: uploadError} = await supabase.storage
            .from('board-images')
            .upload(filePath, file);

        if (uploadError) {
            message.error('이미지 업로드에 실패했습니다.');
            return null;
        }

        const {data: urlData} = supabase.storage
            .from('board-images')
            .getPublicUrl(filePath);

        return urlData.publicUrl;
    };

    const handleSave = async (values) => {
        const {title, content, author, password, category_id} = values;
        let imageUrl = null;

        if (fileList.length > 0) {
            imageUrl = await handleUpload(fileList[0].originFileObj);
            if (!imageUrl) return;
        }

        if (isEditMode) {
            const {error} = await supabase
                .from('board')
                .update({
                    title,
                    content,
                    category_id,
                    image_url: imageUrl || selectedPost.image_url,
                    updated_at: new Date(),
                })
                .eq('id', selectedPost.id)
                .eq('password', password);

            if (error) {
                message.error('비밀번호가 틀렸거나 수정에 실패했습니다.');
                return;
            }
            message.success('게시글이 수정되었습니다.');
        } else {
            const {error} = await supabase
                .from('board')
                .insert([{title, content, author, password, category_id, image_url: imageUrl}]);

            if (error) {
                message.error('게시글 등록에 실패했습니다.');
                return;
            }
            message.success('게시글이 등록되었습니다.');
        }

        setIsModalOpen(false);
        setFileList([]);
        form.resetFields();
        fetchPosts();
    };

    const handleDelete = async (post) => {
        Modal.confirm({
            title: '게시글 삭제',
            content: (
                <div>
                    <p>삭제하려면 비밀번호를 입력하세요.</p>
                    <Input.Password
                        placeholder="비밀번호 입력"
                        onChange={(e) => (post.passwordInput = e.target.value)}
                    />
                </div>
            ),
            async onOk() {
                // 사용자가 입력한 패스워드 출력
                console.log('사용자가 입력한 패스워드 (post.passwordInput):', post.passwordInput);

                // 기존에 저장된 패스워드 조회
                const { data: postData, error: fetchError } = await supabase
                    .from('board')
                    .select('password')
                    .eq('id', post.id)
                    .single();

                if (fetchError) {
                    message.error('패스워드 조회에 실패했습니다.');
                    return;
                }

                // 기존에 저장된 패스워드 출력
                console.log('기존에 저장된 패스워드:', postData.password);

                if (post.image_url) {
                    const fileName = post.image_url.split('/').pop();
                    await supabase.storage.from('board-images').remove([`board-images/${fileName}`]);
                }

                const {error} = await supabase
                    .from('board')
                    .delete()
                    .eq('id', post.id)
                    .eq('password', post.passwordInput);

                if (postData.password !== post.passwordInput) {
                    message.error('비밀번호가 틀렸거나 삭제에 실패했습니다.');
                    return;
                }
                message.success('게시글이 삭제되었습니다.');
                fetchPosts();
            },
        });
    };

    const handlePin = async (post) => {
        const {error} = await supabase
            .from('board')
            .update({is_notice: !post.is_notice})
            .eq('id', post.id);

        if (error) {
            message.error('공지사항 설정에 실패했습니다.');
            return;
        }
        message.success(post.is_notice ? '공지 해제되었습니다.' : '공지로 설정되었습니다.');
        fetchPosts();
    };

    const uploadProps = {
        onRemove: (file) => {
            setFileList([]);
        },
        beforeUpload: (file) => {
            setFileList([file]);
            return false;
        },
        fileList,
        accept: 'image/*',
        maxCount: 1,
    };

    const columns = [
        {
            title: '이미지',
            dataIndex: 'image_url',
            key: 'image_url',
            width: 80,
            render: (imageUrl) =>
                imageUrl ? (
                    <Image src={imageUrl} alt="게시글 이미지" width={50} height={50} style={{objectFit: 'cover'}}/>
                ) : (
                    '-'
                ),
        },
        {
            title: '제목',
            dataIndex: 'title',
            key: 'title',
            ellipsis: false,
            render: (text, record) => (
                <span style={{whiteSpace: 'normal', wordBreak: 'break-word'}}>
          {record.is_notice && <Tag color="blue">공지</Tag>}
                    {text}
        </span>
            ),
        },
        {
            title: '작성자',
            dataIndex: 'author',
            key: 'author',
            width: 100,
            ellipsis: false,
            render: (text) => (
                <span style={{whiteSpace: 'normal', wordBreak: 'break-word'}}>{text}</span>
            ),
        },
        {
            title: '카테고리',
            dataIndex: ['categories', 'name'],
            key: 'category',
            width: 100,
            ellipsis: false,
            render: (text) => (
                <span style={{whiteSpace: 'normal', wordBreak: 'break-word'}}>{text}</span>
            ),
        },
        {
            title: '등록일',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 120,
            ellipsis: false,
            render: (date) => (
                <span style={{whiteSpace: 'normal', wordBreak: 'break-word'}}>
          {format(new Date(date), 'yyyy-MM-dd')}
        </span>
            ),
        },
        {
            title: '조회수',
            dataIndex: 'views',
            key: 'views',
            width: 80,
            ellipsis: false,
            render: (text) => (
                <span style={{whiteSpace: 'normal', wordBreak: 'break-word'}}>{text}</span>
            ),
        },
        {
            title: '작업',
            key: 'action',
            width: 200,
            render: (_, record) => (
                <Space size="middle">
                    <Button
                        icon={<EditOutlined/>}
                        onClick={() => {
                            setIsEditMode(true);
                            setSelectedPost(record);
                            form.setFieldsValue(record);
                            setFileList(record.image_url ? [{
                                uid: '-1',
                                name: 'image',
                                status: 'done',
                                url: record.image_url
                            }] : []);
                            setIsModalOpen(true);
                        }}
                        style={{color: '#1890ff'}}
                    >
                        수정
                    </Button>
                    <Button
                        icon={<DeleteOutlined/>}
                        onClick={() => handleDelete(record)}
                        style={{color: '#ff4d4f'}}
                    >
                        삭제
                    </Button>
                    <Button onClick={() => handlePin(record)} style={{color: '#595959'}}>
                        {record.is_notice ? '공지 해제' : '공지 고정'}
                    </Button>
                </Space>
            ),
        },
    ];

    const renderCards = () => (
        <div className="post-cards-container">
            <div className="post-cards">
                {posts.map((post) => (
                    <Card
                        key={post.id}
                        className="post-card"
                        variant="outlined" // bordered 대신 variant 사용
                    >
                        <div className="post-card-content">
                            {post.image_url && (
                                <div className="post-image">
                                    <Image src={post.image_url} alt="게시글 이미지" width={50} height={50}
                                           style={{objectFit: 'cover'}}/>
                                </div>
                            )}
                            <div className="post-details">
                                <div className="post-title">
                                    {post.is_notice && <Tag color="blue">공지</Tag>}
                                    <span>{post.title}</span>
                                </div>
                                <div className="post-meta">
                                    <span>작성자: {post.author}</span>
                                    <span>카테고리: {post.categories.name}</span>
                                    <span>등록일: {format(new Date(post.created_at), 'yyyy-MM-dd')}</span>
                                    <span>조회수: {post.views}</span>
                                </div>
                            </div>
                        </div>
                        <div className="post-actions">
                            <Button
                                icon={<EditOutlined/>}
                                onClick={() => {
                                    setIsEditMode(true);
                                    setSelectedPost(post);
                                    form.setFieldsValue(post);
                                    setFileList(post.image_url ? [{
                                        uid: '-1',
                                        name: 'image',
                                        status: 'done',
                                        url: post.image_url
                                    }] : []);
                                    setIsModalOpen(true);
                                }}
                                style={{color: '#1890ff', marginRight: '8px'}}
                            >
                                수정
                            </Button>
                            <Button
                                icon={<DeleteOutlined/>}
                                onClick={() => handleDelete(post)}
                                style={{color: '#ff4d4f', marginRight: '8px'}}
                            >
                                삭제
                            </Button>
                            <Button onClick={() => handlePin(post)} style={{color: '#595959'}}>
                                {post.is_notice ? '공지 해제' : '공지 고정'}
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>
            <div style={{width: 'fit-content', margin: '0 auto'}}>
                <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={totalPosts}
                    onChange={(page) => setCurrentPage(page)}
                    style={{marginTop: '16px'}}
                />
            </div>
        </div>
    );

    return (
        <div className="content">
            <div className="header">
                <h1>게시판 관리</h1>
            </div>

            <div className="filter-section">
                <Input
                    placeholder="제목 또는 작성자 검색"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{width: '200px'}}
                />
                <Select
                    placeholder="카테고리 선택"
                    defaultValue="all" // 기본값을 'all'로 변경
                    value={filterCategory}
                    onChange={(value) => setFilterCategory(value)}
                    style={{width: '150px'}}
                    allowClear={false}
                >
                    {categories.map((category) => (
                        <Option key={category.id} value={category.id}>
                            {category.name}
                        </Option>
                    ))}
                </Select>
                <Button
                    type="primary"
                    icon={<PlusOutlined/>}
                    onClick={() => {
                        setIsEditMode(false);
                        setIsModalOpen(true);
                    }}
                    style={{background: '#1890ff', borderColor: '#1890ff'}}
                >
                    게시글 등록
                </Button>
            </div>

            {isMobile ? renderCards() : (
                <Table
                    columns={columns}
                    dataSource={posts}
                    rowKey="id"
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        total: totalPosts,
                        onChange: (page) => setCurrentPage(page),
                    }}
                    scroll={{x: 'max-content'}}
                />
            )}

            <Modal
                title={isEditMode ? '게시글 수정' : '게시글 등록'}
                open={isModalOpen}
                onCancel={() => {
                    setIsModalOpen(false);
                    setFileList([]);
                    form.resetFields();
                }}
                footer={null}
            >
                <Form form={form} onFinish={handleSave} layout="vertical">
                    <Form.Item name="title" label="제목" rules={[{required: true, message: '제목을 입력하세요.'}]}>
                        <Input/>
                    </Form.Item>
                    <Form.Item name="content" label="내용" rules={[{required: true, message: '내용을 입력하세요.'}]}>
                        <Input.TextArea rows={4}/>
                    </Form.Item>
                    <Form.Item name="author" label="작성자" rules={[{required: true, message: '작성자를 입력하세요.'}]}>
                        <Input/>
                    </Form.Item>
                    <Form.Item
                        name="password"
                        label="비밀번호"
                        rules={[{required: true, message: '비밀번호를 입력하세요.'}]}
                    >
                        <Input.Password/>
                    </Form.Item>
                    <Form.Item name="category_id" label="카테고리" rules={[{required: true, message: '카테고리를 선택하세요.'}]}>
                        <Select placeholder="카테고리 선택">
                            {categories
                                .filter((category) => category.id !== 'all') // 'all' 제외
                                .map((category) => (
                                    <Option key={category.id} value={category.id}>
                                        {category.name}
                                    </Option>
                                ))}
                        </Select>
                    </Form.Item>
                    <Form.Item label="이미지">
                        <Upload {...uploadProps} listType="picture">
                            <Button icon={<UploadOutlined/>}>이미지 업로드 (최대 1개)</Button>
                        </Upload>
                    </Form.Item>
                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            style={{background: '#1890ff', borderColor: '#1890ff'}}
                        >
                            {isEditMode ? '수정' : '등록'}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default BoardManage;