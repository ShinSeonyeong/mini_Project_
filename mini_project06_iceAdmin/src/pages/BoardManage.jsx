import React, {useEffect, useState} from 'react';
import {Breadcrumb, Button, Card, Form, Image, Input, message, Modal, Select, Space, Table, Upload, Tag, Pagination}
    from "antd";
import {
    PlusOutlined,
    SearchOutlined,
    RedoOutlined,
    EditOutlined,
    DeleteOutlined,
    UploadOutlined,
    PushpinOutlined,
    PushpinFilled
}
    from "@ant-design/icons";
import '../css/BoardManage.css';
import styles from '../css/BoardManage.module.css';
import {supabase} from "../js/supabase.js";
import dayjs from "dayjs";
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

const {Option} = Select;

const categories = [
    {id: 'all', name: '전체'},
    {id: '1', name: '공지사항'},
    {id: '2', name: 'FAQ'},
];

const BoardManage = () => {
    const [posts, setPosts] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
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
        console.log('Fetching posts with:', { currentPage, searchText, filterCategory });
        let query = supabase
            .from('board')
            .select('*, categories(name)', {count: 'exact'})
            .order('created_at', {ascending: false}) // 내림차순 정렬, 가장 최근 데이터 먼저.
            .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

        console.log('Fetching postsdd with:', { currentPage, searchText, filterCategory });

        if (searchText) {
            query = query.or(`title.ilike.%${searchText}%, author.ilike.%${searchText}%`);
        }

        if (filterCategory !== 'all') {
            query = query.eq('category_id', filterCategory);
        } else {
            query = query.in('category_id', ["1", "2"]);
        }

        const {data, error, count} = await query;
        if (error) {
            message.error('게시글을 불러오는 데 실패했습니다.');
            return;
        }

        setPosts(data);
        setTotalPosts(count);
    }

    useEffect(() => {
        fetchPosts()
    }, []);

    const handleUpload = async (file) => {
        const fileExt = file.name.split('.').pop(); // 파일 확장자 추출
        const fileName = `${Date.now()}.${fileExt}`; // 현재 시간으로 파일 이름 생성
        const filePath = `board_img/${fileName}`; // supabase storage에 저장할 경로 지정

        const {error: uploadError} = await supabase.storage
            .from('icecarebucket') // 저장할 버킷 이름은 icecarebucket
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
            }); // 공개 URL 가져오기

        if (uploadError) {
            console.error('Upload error:', uploadError);
            message.error("이미지 업로드에 실패했습니다.");
            return null;
        }

        const {data: urlData} = supabase.storage // 업로드한 파일의 URL을 가져옴
            .from('icecarebucket')
            .getPublicUrl(filePath); // 공개 URL 가져오기

        console.log('upload image URL:', urlData.publicUrl);
        return urlData.publicUrl;
    }

    const handleSave = async (values) => {
        const {title, content, author, password, category_id} = values; // 폼에서 입력한 값들
        let imageUrl = null; // 이미지 URL을 저장할 변수

        if (fileList.length > 0) {
            if (fileList[0].originFileObj) {
                imageUrl = await handleUpload(fileList[0].originFileObj); // 이미지 업로드
                if (!imageUrl) {
                    console.error('Image upload failed, imageUrl is null');
                    return;
                } // 업로드 실패 시 함수 종료
            } else {
                imageUrl = isEditMode ? selectedPost.image_url : null; // 수정 모드일 때 기존 이미지 URL 사용
            }
        }

        if (isEditMode) {
            const {error} = await supabase // 수정할 게시글의 ID를 사용하여 업데이트
                .from('board')
                .update({
                    title,
                    content,
                    category_id,
                    image_url: imageUrl || selectedPost.image_url, // 기존 이미지 URL 유지
                    updated_at: new Date(), // 수정일자 업데이트
                })
                .eq('id', selectedPost.id) // 게시글 ID로 필터링
                .eq('password', password); // 비밀번호 확인

            console.log('Update parameters:', {
                id: selectedPost.id,
                password,
                imageUrl,
                selectedPostImageUrl: selectedPost.image_url,
            });
            if (error) {
                message.error("비밀번호가 틀렸거나 수정에 실패했습니다.");
                return;
            }
            message.success("게시글이 수정되었습니다.");
        } else {
            const {error} = await supabase
                .from('board')
                .insert([{title, content, author, password, category_id, image_url: imageUrl}]); // 게시글 등록

            if (error) {
                message.error("게시글 등록에 실패했습니다.");
                return;
            }
            message.success("게시글이 등록되었습니다.");
        }

        setIsModalOpen(false); // 모달 닫기
        setFileList([]); // 파일 리스트 초기화
        form.resetFields(); // 폼 초기화
        fetchPosts(); // 게시글 목록 새로고침
    }

    const handleDelete = async (post) => {
        Modal.confirm({
            title: '게시글 삭제',
            content: (
                <div>
                    <p>게시글을 삭제하려면 비밀번호를 입력해주세요.</p>
                    <Input.Password // 비밀번호 입력 필드
                        placeholder="비밀번호 입력"
                        onChange={(e) => (post.passwordInput = e.target.value)} // 비밀번호 입력값 저장
                    />
                </div>
            ),
            async onOk() {
                console.log('사용자가 입력한 패스워드: ', post.passwordInput);

                const {data: postData, error: fetchError} = await supabase // 게시글 데이터 가져오기
                    .from('board')
                    .select('password')
                    .eq('id', post.id) // 게시글 ID로 필터링
                    .single(); // 단일 게시글 데이터 가져오기

                if (fetchError) {
                    message.error('비밀번호 조회에 실패했습니다. 다시 확인해주세요.');
                    return;
                }

                console.log('저장된 패스워드:', postData.password);

                if (postData.password !== post.passwordInput) {
                    message.error('비밀번호가 틀렸습니다.');
                    return;
                }

                if (post.image_url) {
                    const fileName = post.image_url.split('/').pop();
                    await supabase.storage.from('icecarebucket').remove([`board_img/${fileName}`]); // 이미지 삭제
                }

                const {error} = await supabase
                    .from('board')
                    .delete()
                    .eq('id', post.id)

                if (error) {
                    message.error('게시글 삭제에 실패했습니다.');
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
            .update({is_notice: !post.is_notice}) // 공지 여부 토글
            .eq('id', post.id); // 게시글 ID로 필터링

        if (error) {
            message.error('공지 설정에 실패했습니다.');
            return;
        }
        message.success(post.is_notice ? '공지 해제되었습니다.' : '공지 설정되었습니다.');
        fetchPosts();
    }

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
        onChange: ({fileList}) => {
            setFileList(fileList);
            console.log('FileList updated:', fileList); // 변경: fileList 변경 디버깅
        },
    }

    const handleSearch = () => {
        setCurrentPage(1);
        fetchPosts();
    }

    const handleReset = () => {
        setSearchText('');
        setFilterCategory('all');
        setCurrentPage(1);
    }

    const columns = [
        {
            title: '고정',
            key: 'actions',
            width: 20,
            render: (_, record) => (
                <Button onClick={() => handlePin(record)}
                        style={{color: '#595959'}}
                        icon={record.is_notice ? <PushpinFilled/> : <PushpinOutlined/>}
                >
                </Button>
            ),
        },
        {
            title: 'No.',
            key: 'id',
            dataIndex: 'id',
            width: 50,
        },
        {
            title: '이미지',
            dataIndex: 'image_url',
            key: 'image_url',
            width: 80,
            render: (imageUrl) => {console.log(imageUrl);
                return imageUrl ? (
                    <Image src={imageUrl} alt="게시글 이미지" width={50} height={50} style={{objectFit: 'cover'}}/>) : ('-');
            }
        },
        {
            title: '제목',
            dataIndex: 'title',
            key: 'title',
            width: 150,
            ellipsis: false, // 텍스트 줄바꿈
            // render: (text, record) => (
            //     <span style={{whiteSpace: 'normal', wordBreak: 'break-word'}}>
            //         {record.is_notice && <Tag color="blue">공지</Tag>} {text} // 공지 태그
            //     </span>
            // ),
        },
        {
            title: '내용',
            dataIndex: 'content',
            key: 'content',
            width: 500,
            ellipsis: false, // 텍스트 줄바꿈
        },
        {
            title: '작성자',
            dataIndex: 'author',
            key: 'author',
            ellipsis: false,
            render: (text) => (
                <span style={{whiteSpace: 'normal', wordBreak: 'break-word'}}>
                    {text}
                </span>
            ),
        },
        {
            title: '카테고리',
            dataIndex: ['categories', 'name'],
            key: 'cagegory',
            width: 70,
            ellipsis: false,
            render: (text) => (
                <span style={{whiteSpace: 'normal', wordBreak: 'break-word'}}>
                    {text}
                </span>
            ),
        },
        {
            title: '등록일',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 100,
            sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
            ellipsis: false,

            render: (date) => (
                <span style={{whiteSpace: 'normal', wordBreak: 'break-word'}}>
                    {date ? dayjs(date).format('YYYY-MM-DD') : '-'}
                </span>
            ),
        },
        {
            title: '조회수',
            dataIndex: 'views',
            key: 'views',
            width: 60,
            ellipsis: false,
            render: (text) => (
                <span style={{whiteSpace: 'normal', wordBreak: 'break-word'}}>
                    {text}
                </span>
            ),
        },
        {
            title: '비밀번호',
            dataIndex: 'password',
            key: 'password',
            ellipsis: false,
        },
        {
            title: '수정/삭제',
            key: 'actions',
            width: 110,
            render: (_, record) => (
                <Space size="middle">
                    <Button
                        icon={<EditOutlined/>}
                        onClick={() => {
                            setIsEditMode(true);
                            setSelectedPost(record);
                            form.setFieldsValue(record);
                            setFileList(record.image_url ? [{
                                uid: '-1,',
                                name: 'image',
                                status: 'done',
                                url: record.image_url,
                            }] : []);
                            setIsModalOpen(true);
                        }}
                        style={{color: '#1890ff'}}
                    >
                    </Button>
                    <Button
                        icon={<DeleteOutlined/>}
                        onClick={() => handleDelete(record)}
                        danger
                    >
                    </Button>
                </Space>
            ),
        },
    ];

    const renderCards = () => ( // 게시글 카드 형태로 렌더링
        <div className={styles.post_cards_container}>
            <div className={styles.post_cards}>
                {posts.map((post) => (
                    <Card
                        key={post.id}
                        className={styles.post_card}
                        variant="outlined" // bordered 대신 variant 사용
                    >


                        <div className={styles.post_card_content}>
                            {post.image_url && (
                                <div className={styles.post_image}>
                                    <Image src={post.image_url} alt="게시글 이미지" width={50} height={50}
                                           style={{objectFit: 'cover'}}/>
                                </div>
                            )}
                            <div className={styles.post_details}>
                                <div className={styles.post_title}>
                                    <div className={styles.title_content}>
                                        {post.is_notice && <Tag color="blue">공지</Tag>}
                                        <p><strong>글번호: {post.id}</strong></p>
                                    </div>
                                    <div className={styles.post_actions}>
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
                                            style={{
                                                color: '#1890ff',
                                                marginRight: '8px'
                                            }}
                                            size={"small"}
                                        >
                                        </Button>
                                        <Button
                                            icon={<DeleteOutlined/>}
                                            onClick={() => handleDelete(post)}
                                            style={{
                                                color: '#ff4d4f',
                                                marginRight: '8px'
                                            }}
                                            size={"small"}
                                        >
                                        </Button>
                                        <Button onClick={() => handlePin(post)}
                                                style={{color: '#595959', marginRight: '8px'}}
                                                size={"small"}>
                                            {post.is_notice ? <PushpinFilled/> : <PushpinOutlined/>}
                                        </Button>
                                    </div>
                                </div>


                                <div className={styles.post_meta}>
                                    <p><strong>제목:</strong> {post.title}</p>
                                    <p><strong>내용:</strong> {post.content}</p>
                                    <p><strong>작성자:</strong> {post.author}</p>
                                    <p><strong>카테고리:</strong> {post.categories.name}</p>
                                    <p>
                                        <strong>등록일:</strong> {post.created_at ? dayjs(post.create_at).format('YYYY-MM-DD') : '-'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>

                ))}
                <div className={styles.pagination_container}>
                    <Pagination
                        current={currentPage}
                        pageSize={pageSize}
                        total={totalPosts}
                        onChange={(page) => setCurrentPage(page)}
                        style={{marginTop: '16px'}}
                    />
                </div>
            </div>
        </div>
    );

    return (
        <div className={styles.content}>
            <div className={styles.header}>
                <Breadcrumb
                    separator=">"
                    items={[{title: 'Home',}, {title: '게시판관리', href: '',},]}
                />
            </div>

            <div className={styles.filter_section}>
                <Input
                    placeholder="제목 또는 작성자 검색"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{width: '200px'}}
                />
                <Select
                    placeholder="카테고리 선택"
                    defaultValue="all"
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
                    icon={<SearchOutlined/>}
                    onClick={handleSearch}
                    type="primary"
                >
                    조회
                </Button>
                <Button
                    icon={<RedoOutlined/>}
                    onClick={handleReset}
                >
                    초기화
                </Button>
                <Button
                    type="primary"
                    icon={<PlusOutlined/>}
                    onClick={() => {
                        setIsEditMode(false);
                        setIsModalOpen(true);
                    }}
                    style={{marginLeft: "auto"}}
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
                    size={"middle"}
                />
            )}

            <Modal
                title={isEditMode ? '게시글 수정' : '게시글 등록'}
                open={isModalOpen}
                onCancel={() => {
                    setIsModalOpen(false);
                    setFileList([]);
                    // setIsEditMode(false);
                    form.resetFields();
                }}
                footer={null}
            >
                <Form form={form} onFinish={handleSave} layout="vertical">
                    <Form.Item name="title" label="제목" rules={[{required: true, message: '제목을 입력해주세요.'}]}>
                        <Input/>
                    </Form.Item>
                    <Form.Item name="content" label="내용" rules={[{required: true, message: '내용을 입력해주세요.'}]}>
                        <Input/>
                    </Form.Item>
                    <Form.Item name="author" label="작성자" rules={[{required: true, message: '작성자를 입력해주세요.'}]}>
                        <Input/>
                    </Form.Item>
                    <Form.Item name="password" label="비밀번호" rules={[{required: true, message: '비밀번호를 입력해주세요.'}]}>
                        <Input.Password/>
                    </Form.Item>
                    <Form.Item name="category_id" label="카테고리" rules={[{required: true, message: '카테고리를 선택해주세요.'}]}>
                        <Select placeholder="카테고리 선택">
                            {categories
                                .filter((category) => category.id !== 'all')
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
                    <Form.Item style={{textAlign: 'right'}}>
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
}

export default BoardManage;