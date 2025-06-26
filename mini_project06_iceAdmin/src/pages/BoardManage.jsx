import React, { useEffect, useState } from "react";
import {
  Breadcrumb,
  Button,
  Card,
  Form,
  Image,
  Input,
  message,
  Modal,
  Select,
  Space,
  Table,
  Upload,
  Tag,
  Pagination,
  Checkbox,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  RedoOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  PushpinOutlined,
  PushpinFilled,
} from "@ant-design/icons";
import "../css/BoardManage.css";
import "../css/BoardManage.custom.css";
import styles from "../css/BoardManage.module.css";
import { supabase } from "../js/supabase.js";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { data } from "react-router-dom";

dayjs.extend(customParseFormat);

const { Option } = Select;
const key = "loading";

const categories = [
  { id: "all", name: "전체" },
  { id: "1", name: "공지사항" },
  { id: "2", name: "FAQ" },
];

const BoardManage = () => {
  const [posts, setPosts] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [form] = Form.useForm();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPosts, setTotalPosts] = useState(0);
  const [fileList, setFileList] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [checkedRowIds, setCheckedRowIds] = useState([]); // 선택된 게시글 ID 목록
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchPosts = async () => {
    // console.log('Fetching posts with:', {currentPage, searchText, filterCategory});
    let query = supabase
      .from("board")
      .select(
        `
        *,
        categories:category_id (
          id,
          name
        )
      `,
        { count: "exact" }
      )
      .order("id", { ascending: false }) // NO(id) 기준 내림차순 정렬
      .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

    // console.log('Fetching postsdd with:', {currentPage, searchText, filterCategory});

    if (searchText) {
      query = query.or(
        `title.ilike.%${searchText}%, author.ilike.%${searchText}%`
      );
    }

    if (filterCategory !== "all") {
      query = query.eq("category_id", filterCategory);
    } else {
      query = query.in("category_id", ["1", "2"]);
    }

    const { data, error, count } = await query;
    if (error) {
      message.error("게시글을 불러오는 데 실패했습니다.");
      return;
    }

    setPosts(data);
    setTotalPosts(count);
  };

  useEffect(() => {
    fetchPosts();
  }, [currentPage, searchText, filterCategory]);

  const handleUpload = async (file) => {
    const fileExt = file.name.split(".").pop(); // 파일 확장자 추출
    const fileName = `${Date.now()}.${fileExt}`; // 현재 시간으로 파일 이름 생성
    const filePath = `board_img/${fileName}`; // supabase storage에 저장할 경로 지정

    const { error: uploadError } = await supabase.storage
      .from("icecarebucket") // 저장할 버킷 이름은 icecarebucket
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      }); // 공개 URL 가져오기

    if (uploadError) {
      console.error("Upload error:", uploadError);
      message.error("이미지 업로드에 실패했습니다.");
      return null;
    }

    const { data: urlData } = supabase.storage // 업로드한 파일의 URL을 가져옴
      .from("icecarebucket")
      .getPublicUrl(filePath); // 공개 URL 가져오기

    // console.log("upload image URL:", urlData.publicUrl);
    return urlData.publicUrl;
  };

  const handleSave = async (values) => {
    const { title, content, category_id } = values;
    // 카테고리 이름에 따라 ID 설정
    const categoryId =
      categories.find((cat) => cat.name === category_id)?.id || "1";

    let imageUrl = null;
    const author = "ADMIN";

    if (fileList.length > 0) {
      if (fileList[0].originFileObj) {
        imageUrl = await handleUpload(fileList[0].originFileObj);
        if (!imageUrl) {
          console.error("Image upload failed, imageUrl is null");
          return;
        }
      } else {
        imageUrl = isEditMode ? selectedPost.image_url : null;
      }
    }

    if (isEditMode) {
      const { error } = await supabase
        .from("board")
        .update({
          title,
          content,
          author,
          category_id: categoryId,
          image_url: imageUrl || selectedPost.image_url,
          updated_at: new Date(),
        })
        .eq("id", selectedPost.id);

      if (error) {
        message.error("수정에 실패했습니다.");
        return;
      }
      message.success("게시글이 수정되었습니다.");
    } else {
      const { error } = await supabase.from("board").insert([
        {
          title,
          content,
          author,
          category_id: categoryId,
          image_url: imageUrl,
        },
      ]);
      if (error) {
        console.log(error);
        message.error("게시글 등록에 실패했습니다.");
        return;
      }
      message.success("게시글이 등록되었습니다.");
    }

    setIsModalOpen(false);
    setFileList([]);
    form.resetFields();
    fetchPosts();
  };

  const selectedPosts = posts.filter((post) => checkedRowIds.includes(post.id)); // 현재 체크된 게시글 목록

  const handleDelete = async (posts) => {
    if (!posts || posts.length === 0) {
      message.warning({
        content: "삭제할 게시글을 선택해주세요.",
        key,
        duration: 2,
      });
      return;
    }

    Modal.confirm({
      title: "게시글 삭제",
      content: <p>선택한 게시글을 삭제하시겠습니까?</p>,
      async onOk() {
        for (const post of posts) {
          if (post.image_url) {
            const fileName = post.image_url.split("/").pop();
            await supabase.storage
              .from("icecarebucket")
              .remove([`board_img/${fileName}`]); // 이미지 삭제
          }

          const { error } = await supabase
            .from("board")
            .delete()
            .eq("id", post.id);

          if (error) {
            message.error("게시글 삭제에 실패했습니다.");
            return;
          }
        }
        message.success("게시글이 삭제되었습니다.");
        fetchPosts();
        setCheckedRowIds([]); // 삭제 후 체크박스 초기화
      },
    });
  };

  const handleEdit = (post) => {
    setIsEditMode(true);
    setSelectedPost(post);

    // 폼 필드 값 설정 (카테고리 이름 사용)
    form.setFieldsValue({
      title: post.title,
      content: post.content,
      category_id: post.categories.name, // 카테고리 이름으로 설정
    });

    // 기존 이미지가 있는 경우 fileList에 추가
    if (post.image_url) {
      setFileList([
        {
          uid: "-1",
          name: post.image_url.split("/").pop(),
          status: "done",
          url: post.image_url,
        },
      ]);
    } else {
      setFileList([]);
    }

    setIsModalOpen(true);
  };

  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewImage(file.url || file.preview);
    setPreviewOpen(true);
    setPreviewTitle(
      file.name || file.url.substring(file.url.lastIndexOf("/") + 1)
    );
  };

  const handlePreviewCancel = () => {
    setPreviewOpen(false);
    setPreviewImage("");
    setPreviewTitle("");
  };

  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const uploadProps = {
    onRemove: (file) => {
      setFileList([]);
    },
    beforeUpload: (file) => {
      const isImage = file.type.startsWith("image/");
      if (!isImage) {
        message.error("이미지 파일만 업로드할 수 있습니다!");
        return Upload.LIST_IGNORE;
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error("이미지 크기는 2MB보다 작아야 합니다!");
        return Upload.LIST_IGNORE;
      }
      setFileList([file]);
      return false;
    },
    fileList,
    onPreview: handlePreview,
    maxCount: 1,
    listType: "picture-card",
    onChange: ({ fileList: newFileList }) => setFileList(newFileList),
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchPosts();
  };

  const handleReset = () => {
    setSearchText("");
    setFilterCategory("all");
    setCurrentPage(1);
  };

  const handleCategoryTab = (catId) => {
    setFilterCategory(catId);
    setCurrentPage(1);
  };

  const columns = [
    {
      title: <div style={{ textAlign: "center" }}>NO</div>,
      key: "id",
      dataIndex: "id",
      width: 50,
      defaultSortOrder: "descend", // 내림차순
      render: (text) => <div style={{ textAlign: "center" }}>{text}</div>, // 가운데 정렬
    },
    {
      title: <div style={{ textAlign: "center" }}>제목</div>,
      dataIndex: "title",
      key: "title",
      width: 150,
      ellipsis: { showTitle: false },
      render: (text) => (
        <Tooltip title={text || ""}>
          <span>
            {text && text.length > 10 ? `${text.slice(0, 10)}...` : text}
          </span>
        </Tooltip>
      ),
    },
    {
      title: <div style={{ textAlign: "center" }}>내용</div>,
      dataIndex: "content",
      key: "content",
      width: 450,
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <span>{text.length > 60 ? `${text.slice(0, 60)}...` : text}</span>
        </Tooltip>
      ),
    },
    {
      title: "작성자",
      dataIndex: "author",
      key: "author",
      width: 100,
      align: "center",
      ellipsis: false,
      render: (text) => (
        <span style={{ whiteSpace: "normal", wordBreak: "break-word" }}>
          {text}
        </span>
      ),
    },
    {
      title: "등록일",
      dataIndex: "created_at",
      key: "created_at",
      width: 100,
      align: "center",
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      ellipsis: false,

      render: (date) => (
        <span style={{ whiteSpace: "normal", wordBreak: "break-word" }}>
          {date ? dayjs(date).format("YYYY-MM-DD") : "-"}
        </span>
      ),
    },
    {
      title: "관리",
      key: "actions",
      width: 100,
      align: "center",
      render: (_, record) => (
        <Space size="middle">
          <Button
            // icon={<EditOutlined/>}
            onClick={() => {
              handleEdit(record);
            }}
            style={{ color: "#1890ff" }}
          >
            수정하기
          </Button>
        </Space>
      ),
    },
  ];

  const renderCards = () => (
    // 게시글 카드 형태로 렌더링
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
                  <Image
                    src={post.image_url}
                    alt="게시글 이미지"
                    width={50}
                    height={50}
                    style={{ objectFit: "cover" }}
                  />
                </div>
              )}
              <div className={styles.post_details}>
                <div className={styles.post_title}>
                  <div className={styles.title_content}>
                    {post.is_notice && <Tag color="blue">공지</Tag>}
                    <p>
                      <strong>글번호: {post.id}</strong>
                    </p>
                  </div>
                  <div className={styles.post_actions}>
                    <Button
                      icon={<EditOutlined />}
                      onClick={() => {
                        handleEdit(post);
                      }}
                      style={{
                        color: "#1890ff",
                        marginRight: "8px",
                      }}
                      size={"small"}
                    ></Button>
                    <Button
                      icon={<DeleteOutlined />}
                      onClick={() => handleDelete(post)}
                      style={{
                        color: "#ff4d4f",
                        marginRight: "8px",
                      }}
                      size={"small"}
                    ></Button>
                  </div>
                </div>

                <div className={styles.post_meta}>
                  <p>
                    <strong>제목:</strong> {post.title}
                  </p>
                  <p>
                    <strong>내용:</strong> {post.content}
                  </p>
                  <p>
                    <strong>작성자:</strong> {post.author}
                  </p>
                  <p>
                    <strong>카테고리:</strong> {post.categories.name}
                  </p>
                  <p>
                    <strong>등록일:</strong>{" "}
                    {post.created_at
                      ? dayjs(post.create_at).format("YYYY-MM-DD")
                      : "-"}
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
            style={{ marginTop: "16px" }}
          />
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    if (isModalOpen) {
      if (isEditMode && selectedPost) {
        form.setFieldsValue({
          title: selectedPost.title,
          content: selectedPost.content,
          category_id: selectedPost.categories.name, // 카테고리 이름으로 설정
          author: "관리자",
        });
      } else {
        form.setFieldsValue({
          category_id: "공지사항", // 기본값을 이름으로 설정
          author: "관리자",
        });
      }
    }
  }, [isModalOpen, isEditMode, selectedPost, form]);

  return (
    <div className={styles.content}>
      <div className={styles.header}>
        <Breadcrumb
          separator=">"
          items={[{ title: "Home" }, { title: "게시판관리", href: "" }]}
        />
      </div>

      <div className="custom-filter-section">
        <div className="custom-tab-group">
          <button
            className={`custom-tab-btn${
              filterCategory === "all" ? " active" : ""
            }`}
            onClick={() => handleCategoryTab("all")}
          >
            전체
          </button>
          <button
            className={`custom-tab-btn${
              filterCategory === "1" ? " active" : ""
            }`}
            onClick={() => handleCategoryTab("1")}
          >
            공지사항
          </button>
          <button
            className={`custom-tab-btn${
              filterCategory === "2" ? " active" : ""
            }`}
            onClick={() => handleCategoryTab("2")}
          >
            FAQ
          </button>
        </div>
        <div className="custom-search-group">
          <Input
            className="custom-search-input"
            placeholder="제목 또는 작성자 검색"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined style={{ color: "#bdbdbd" }} />}
            onPressEnter={handleSearch}
            allowClear
          />
        </div>
      </div>

      <div>
        {isMobile ? (
          renderCards()
        ) : (
          <Table
            columns={columns}
            dataSource={posts}
            rowKey="id"
            rowSelection={{
              selectedRowKeys: checkedRowIds,
              onChange: (selectedRowKeys) => {
                setCheckedRowIds(selectedRowKeys);
              },
            }}
            pagination={false} // pagination을 테이블에서 빼서 직접 커스텀
            scroll={{ x: "max-content" }}
            size={"middle"}
          />
        )}

        {/* pagination + 버튼을 같은 라인에 배치 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 16,
            gap: "8px",
          }}
        >
          {/* 직접 커스텀하는 pagination */}
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={totalPosts}
            onChange={(page) => setCurrentPage(page)}
            showSizeChanger={false}
          />
          <div style={{ display: "flex", gap: "20px" }}>
            <Button danger onClick={() => handleDelete(selectedPosts)}>
              선택삭제
            </Button>
            <Button
              type="primary"
              onClick={() => {
                setIsEditMode(false); // 신규 등록 모드로 설정
                setIsModalOpen(true); // 모달 열기
                form.resetFields(); // 폼 초기화
              }}
            >
              신규등록
            </Button>
          </div>
        </div>
      </div>

      <Modal
        title={isEditMode ? "게시글 수정" : "게시글 등록"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setIsEditMode(false);
          setSelectedPost(null);
          setFileList([]);
          form.resetFields();
        }}
        footer={null}
        width={800}
        destroyOnHidden={true}
      >
        <Card size="small" className={styles.formCard}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            initialValues={{
              category_id: "1",
            }}
          >
            <Form.Item
              label="카테고리"
              name="category_id"
              rules={[{ required: true, message: "카테고리를 선택해주세요!" }]}
            >
              <Select
                size="large"
                placeholder="카테고리를 선택하세요"
                onChange={(value) =>
                  form.setFieldsValue({ category_id: value })
                }
              >
                <Option value="공지사항">공지사항</Option>
                <Option value="FAQ">FAQ</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="제목"
              name="title"
              rules={[{ required: true, message: "제목을 입력해주세요!" }]}
            >
              <Input size="large" placeholder="제목을 입력하세요" />
            </Form.Item>

            <Form.Item
              label="내용"
              name="content"
              rules={[{ required: true, message: "내용을 입력해주세요!" }]}
            >
              <Input.TextArea rows={6} placeholder="내용을 입력하세요" />
            </Form.Item>

            <Form.Item label="이미지">
              <Upload
                listType="picture-card"
                fileList={fileList}
                onPreview={handlePreview}
                onChange={({ fileList: newFileList }) =>
                  setFileList(newFileList)
                }
                beforeUpload={() => false}
                maxCount={1}
              >
                {fileList.length < 1 && (
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                )}
              </Upload>
            </Form.Item>

            <Form.Item className={styles.submitButtonContainer}>
              <Button type="primary" htmlType="submit" size="large">
                {isEditMode ? "수정" : "등록"}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Modal>

      <Modal
        open={previewOpen}
        title={previewTitle}
        footer={null}
        onCancel={handlePreviewCancel}
      >
        <img alt="preview" style={{ width: "100%" }} src={previewImage} />
      </Modal>
    </div>
  );
};

export default BoardManage;
