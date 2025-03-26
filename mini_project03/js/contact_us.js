const $boardDiv = document.querySelector('#board-div');

// 게시글 작성 및 등록
document.querySelector('#submit-post').addEventListener('click', async function () {
    const title = document.querySelector('#post-title').value;
    const category_id = document.querySelector('#post-category').value;
    const author = document.querySelector('#post-name').value;
    const content = document.querySelector('#post-content').value;
    const password = document.querySelector('#post-password').value;
    const image_url = document.querySelector('#post-image-url').files[0];

    if (!title) {
        Swal.fire({icon: "error", title: "등록실패", text: "제목을 입력해주세요."})
            .then(() => {
                document.querySelector('#post-title').focus();
            });
        return;
    } else if (!author) {
        Swal.fire({icon: "error", title: "등록실패", text: "작성자를 입력해주세요."})
            .then(() => {
                document.querySelector('#post-name').focus();
            });
        return;
    } else if (!content) {
        Swal.fire({icon: "error", title: "등록실패", text: "내용을 입력해주세요."})
            .then(() => {
                document.querySelector('#post-content').focus();
            });
        return;
    } else if (!password) {
        Swal.fire({icon: "error", title: "등록실패", text: "비밀번호를 입력해주세요."})
            .then(() => {
                document.querySelector('#post-password').focus();
            });
        return;
    }

    // 슈파베이스 스토리지에 저장
    if (!image_url) {
        // const id = JSON.parse(id).id;
        var res = await supabase
            .from('board')
            .insert([{title, content, author, password, category_id, image_url}])
            .select()
            .eq('category_id', category_id);
    } else {
        const fileUrl = await uploadFile(image_url);
        var res = await supabase
            .from('board')
            .insert([{title, content, author, password, category_id, image_url: fileUrl}])
            .select()
            .eq('category_id', category_id);
    }

    if (res.status === 201) {
        Swal.fire({title: "저장성공", icon: "success", confirmButtonText: '확인', draggable: true})
            .then(() => {
                // 입력된 필드 초기화
                document.querySelector('#post-title').value = '';
                document.querySelector('#post-category').value = '';
                document.querySelector('#post-name').value = '';
                document.querySelector('#post-content').value = '';
                document.querySelector('#post-password').value = '';
                document.querySelector('#post-image-url').value = '';

                noticeSelect(categoryId);
            });
        cancelModalClose();

    } else {
        Swal.fire({title: '저장실패', icon: 'error', confirmButtonText: '확인'});
    }
})

// 파일 업로드 url 생성
async function uploadFile(image_url) {
    const filename = `${crypto.randomUUID()}.${image_url.name.split('.').pop()}`;
    await supabase.storage.from('boardimg').upload(filename, image_url);

    const res = await supabase.storage.from('boardimg').getPublicUrl(filename);
    return res.data.publicUrl;
}

async function noticeSelect(categoryId) {
    const params = new URLSearchParams(window.location.search);
    const pageNum = parseInt(params.get("pageNum")) || 1;
    const itemsPerPage = 15; // 페이지 글 개수 15개
    const totalItems = 150;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const from = (pageNum - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    const pagingContainer = document.getElementById("paging-container");
    pagingContainer.innerHTML = "";
    let pageFrom = parseInt((pageNum - 1) / 10);
    let result = await supabase.from('board').select('id').range(pageFrom * totalItems, pageFrom * totalItems + totalItems);
    if (result.data?.length >= 151) {
        // 다음페이지로 이동 넣는다면 여기서 생성!
        result.data.length = 150;
    }
    for (let i = 1; i <= Math.ceil(result.data?.length / itemsPerPage); i++) {
        const pageLink = document.createElement("a"); // a태그 생성
        pageLink.href = `?pageNum=${i}`;
        pageLink.textContent = i;

        pageLink.style.fontFamily = 'pageNum3';
        // 현재 페이지라면 스타일 변경
        if (i === pageNum) {
            pageLink.style.fontWeight = "bold";
            pageLink.style.color = "#B8001F";
        }

        pagingContainer.appendChild(pageLink);
    }

    // 날짜 형식 변경 0000-00-00
    const fomatDate = (dateString) => {
        return new Date(dateString).toISOString().split('T')[0];
    };
    var res = await supabase
        .from('board')
        .select()
        .eq('category_id', categoryId)
        .order('updated_at', {ascending: true})
        .range(from, to);

    let rows = '';
    for (let i = 0; i < res.data.length; i++) {
        rows = rows + `
            <tr onclick='postRowClick(this);' style='cursor:pointer;'>
                <td>${res.data[i].id}</td>
                <td>${res.data[i].title}</td>
                <td>${res.data[i].content}</td>
                <td>${res.data[i].author}</td>
                <td>${res.data[i].password}</td>
                <td>${fomatDate(res.data[i].created_at)}</td>
                <td>${fomatDate(res.data[i].updated_at)}</td>
                <td id="views-${res.data[i].id}">${res.data[i].views}</td>
                <td>${res.data[i].category_id}</td>
                <td><button class="delete-btn" onclick='postDeleteClick(event, "${res.data[i].id}")'>삭제</button></td>
            </tr>`;
    }

    let boardTable = `
        <div>
            <table>
                <tr>
                    <th>No.</th>
                    <th>제목</th>
                    <th>내용</th>
                    <th>작성자</th>
                    <th>비밀번호</th>
                    <th>작성시간</th>
                    <th>수정시간</th>
                    <th>조회수</th>
                    <th>category_id</th>
                    <th>선택</th>
                </tr>
                ${rows}
            </table>
        </div>`;
    $boardDiv.innerHTML = boardTable;
    $boardDiv.classList.add('show');
}


// 항목 눌렀을 때 작성한 내용 보기
async function postRowClick(trTag) {
    const $updateId = document.querySelector('#update-id');
    const $updateTitle = document.querySelector('#update-title');
    const $updateContent = document.querySelector('#update-content');
    const $updateName = document.querySelector('#update-name');
    const $updatePassword = document.querySelector('#update-password');
    const $updateDate = document.querySelector('#update-date');
    const $updateViews = document.querySelector('#update-views');
    const $updateCategory = document.querySelector('#update-category');

    const id = trTag.children[0].innerText;
    const title = trTag.children[1].innerText;
    const content = trTag.children[2].innerText;
    const author = trTag.children[3].innerText;
    const password = trTag.children[4].innerText;
    const updated_at = trTag.children[6].innerText;
    const views = trTag.children[7].innerText;
    const category_id = trTag.children[8].innerText;

    $updateId.innerText = id;
    $updateDate.innerText = updated_at;
    $updateViews.innerText = views;
    $updateTitle.value = title;
    $updateContent.value = content;
    $updateName.value = author;
    $updatePassword.value = password;
    $updateCategory.value = category_id;

    try {
        let {data, error} = await supabase
            .from('board')
            .select('views')
            .eq('id', id)
            .single();

        if (error) throw error;
        let currentViews = data.views;

        // 조회수 +1
        let {error: updateError} = await supabase
            .from('board')
            .update({views: currentViews + 1})
            .eq('id', id);

        if (updateError) throw updateError;

        document.getElementById(`views-${id}`).textContent = currentViews + 1; // 화면에 증가된 조회수 적용
        console.log(`게시글 ${id} 조회수 증가: ${currentViews + 1}`);
    } catch (err) {
        console.error('조회수 업데이트 오류:', err.message);
    }

    // 이미지 함께 조회
    const res = await supabase
        .from('board')
        .select('image_url, title')
        .eq('id', id)
        .single();

    const $updateImage = document.getElementById('update-image');

    if (res.data.image_url && res.data.image_url.trim() !== '') {
        $updateImage.alt = `Uploaded Image: ${res.data.title}`;
        $updateImage.src = res.data.image_url;
        console.log($updateImage.src);
    } else {
        $updateImage.alt = '이미지가 없습니다.';
        $updateImage.src = '';
    }

    // 모달창 안 보여주게 하기
    const $noticeModal = document.querySelector('#notice-modal');
    $noticeModal.classList.remove('hidden');
}

document.querySelector('#submit-update').addEventListener('click', async function () {
    const $updateId = document.querySelector('#update-id');
    const $updateTitle = document.querySelector('#update-title');
    const $updateContent = document.querySelector('#update-content');
    const $updateName = document.querySelector('#update-name');
    const $updatePassword = document.querySelector('#update-password');
    const $updateCategory = document.querySelector('#update-category');

    const res = await supabase
        .from('board')
        .update({
            title: $updateTitle.value,
            content: $updateContent.value,
            author: $updateName.value,
            password: $updatePassword.value,
            category_id: $updateCategory.value,
        })
        .eq('id', $updateId.innerHTML)
        .select();
    if (res.status == 200) {
        const $noticeModal = document.querySelector('#notice-modal');
        $noticeModal.classList.add('hidden');
        Swal.fire({
            title: "수정성공",
            icon: "success",
            draggable: true
        });
        console.log(`categoryId ${categoryId}`);
        switch (categoryId) {
            case 1:
                noticeSelect(1);
                break;
            case 2:
                noticeSelect(2);
                break;
            case 3:
                noticeSelect(3);
                break;
            default:
                noticeSelect(1);
                break;
        }

    }

})

async function postDeleteClick(ev, id) {
    // stopPropagation 다른 이벤트 실행 막는 것, userRowClick 이벤트 실행X
    ev.stopPropagation();

    const result = await Swal.fire({
        title: "삭제하시겠습니까?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "확인",
        cancelButtonText: "취소"
    });
    if (result.isConfirmed) {
        await supabase.from('board').delete().eq('id', id);

        Swal.fire({
            title: "Deleted!",
            text: "Your file has been deleted.",
            icon: "success"
        });

        noticeSelect(categoryId);
    } else {
        Swal.fire({
            title: "Cancel!",
            text: "취소되었습니다.",
            icon: "success"
        });
    }

}

// 카테고리 선택하면 categoryId 값 가져옴
const urlParams = new URLSearchParams(window.location.search);
const categoryId = Number(urlParams.get('categoryId'));
document.addEventListener('DOMContentLoaded', function () {
    switch (categoryId) {
        case 1:
            noticeSelect(1);
            break;
        case 2:
            noticeSelect(2);
            break;
        case 3:
            noticeSelect(3);
            break;
        default:
            noticeSelect(1);
            break;
    }
});

document.getElementById('post-image-url').addEventListener('change', function (event) {
    const fileInput = event.target;
    const fileNameDisplay = document.getElementById('file-name');
    const imagePreview = document.getElementById('image-preview');

    if (fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        fileNameDisplay.textContent = file.name;

        const reader = new FileReader();
        reader.onload = function (e) {
            imagePreview.src = e.target.result;
            imagePreview.style.display = 'block';
        };
        reader.readAsDataURL(file); // 파일을 URL로 읽음
    } else {
        fileNameDisplay.textContent = '선택된 파일 없음'; // 파일이 없으면 기본 메시지 표시
        imagePreview.style.display = 'none'; // 이미지 미리보기 숨김
    }
});

// 글쓰기
function postClick() {
    const $openModal = document.querySelector('#post-modal');
    $openModal.classList.remove('hidden');
}

// 글쓰기 취소
function cancelModalClose() {
    const $cancelModal = document.querySelector('#post-modal');
    $cancelModal.classList.add('hidden');
    document.body.classList.add('scroll-lock');
}

function noticemodalClose() {
    const $noticeModal = document.querySelector('#notice-modal');
    $noticeModal.classList.add('hidden');
    document.body.classList.remove('scroll-lock');
}

// 카테고리별로 이름 가져오기 - 이거 해야함!!!
// const subcategoryId = document.getElementById("category");
// const changeText = document.getElementById("changeText");
// subcategoryId.addEventListener('change', function (event) {
//     changeText.innerHTML = subcategoryId.value;
// });