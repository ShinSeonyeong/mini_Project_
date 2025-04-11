const $boardDiv = document.getElementById("board-div");

window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(location.search);
    const categoryId = parseInt(params.get('category_id')) || 1; // 기본값 1

    noticeSelect(categoryId);
});

// 게시글 작성 및 등록
document.querySelector('#submit-post').addEventListener('click', async function () {
    const title = document.querySelector('#post-title').value;
    let category_id = document.querySelector('#post-category').value;
    const author = document.querySelector('#post-name').value;
    const content = document.querySelector('#post-content').value;
    const password = document.querySelector('#post-password').value;
    const image_url = document.querySelector('#post-image-url').files[0];

    const passwordInput = document.querySelector('#post-password'); // 사용자가 입력한 password값 가져옴
    passwordInput.addEventListener('input', function () {
        const passwordValue = passwordInput.value;
        console.log(passwordValue);
    })
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
            });

        cancelModalClose();

        switch (categoryId) {
            case 1:
                noticeSelect(1);
                break;
            case 2:
                noticeSelect(2);
                break;
            default:
                noticeSelect(1);
                break;
        }


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
    const texts = {
        1: "공지사항",
        2: "FAQ",
    };
    document.getElementById("changeText").innerHTML = texts[categoryId];

    const params = new URLSearchParams(location.search);
    let pageNum = parseInt(params.get('pageNum')) || 1;
    const itemPerPage = 15;
    let [from, to] = [(pageNum - 1) * itemPerPage, pageNum * itemPerPage - 1];

    const {count} = await supabase
        .from('board')
        .select('*', {count: "exact", head: true})
        .eq('category_id', categoryId);

    const maxPage = Math.ceil(count / itemPerPage);

    const pagingContainer = document.querySelector('#paging-container');
    pagingContainer.innerHTML = "";
    for (let i = 1; i <= maxPage; i++) {
        const pageLink = document.createElement("a");
        pageLink.href = `?category_id=${categoryId}&pageNum=${i}`;
        pageLink.textContent = i;
        pageLink.style.fontFamily = 'pageNum3';

        if (i === pageNum) {
            pageLink.style.fontWeight = "bold";
            pageLink.style.color = "#B8001F";
        }
        pagingContainer.appendChild(pageLink);
    }

    if (params.get('category_id') !== categoryId.toString()) {
        pageNum = 1;
        [from, to] = [(pageNum - 1) * itemPerPage, pageNum * itemPerPage - 1];
        params.set('pageNum', '1');
        params.set('category_id', categoryId);
        const stateobject = {category_id: categoryId, pageNum: pageNum};
        history.pushState(stateobject, '', `?${params.toString()}`);
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toISOString().split('T')[0];
    };

    const res = await supabase
        .from('board')
        .select()
        .eq('category_id', categoryId)
        .order('updated_at', {ascending: true})
        .range(from, to);

    // const boardBody = document.getElementById("board");
    // boardBody.innerHTML = ''; // 초기화

    const boardDiv = document.getElementById("board-div");
    boardDiv.innerHTML = '';

    if (categoryId === 1) {
        // 공지사항인 경우 테이블 생성 및 데이터 표시
        const table = document.createElement("table");
        table.className = "notice-table";
        table.innerHTML = `
            <colgroup>
            <col style="width:10%;">
            <col style="width:15%;">
            <col style="width:40%;">
            <col style="width:10%;">
            <col style="width:15%;">
            </colgroup>
            <thead>
                <tr><th>번호</th><th>카테고리</th><th>제목</th><th>조회수</th><th>날짜</th></tr>
            </thead>
            <tbody id="board">
            </tbody>
        `;
        boardDiv.appendChild(table);

        const boardBody = document.getElementById("board");
        if (boardBody) {
            boardBody.innerHTML = ''; // 초기화
            for (let i = 0; i < res.data.length; i++) {
                const item = res.data[i];
                const tr = document.createElement("tr");
                tr.onclick = () => postRowClick(tr);
                tr.style.cursor = "pointer";
                tr.innerHTML = `
                    <td>${item.id}</td>
                    <td>${texts[categoryId]}</td>
                    <td style="text-align: left"><a class="post-title" href="contact_us.html?pageNum=${pageNum}&category_id=${categoryId}&id=${item.id}">${item.title}</a></td>
                    <td class="views">${item.views || 0}</td>
                    <td class="date">${formatDate(item.updated_at)}</td>
                `;
                tr.addEventListener('click', (e) => {
                    e.preventDefault(); // 링크 기본 동작 막기
                    postRowClick(tr); // 상세보기 함수 호출
                });
                boardBody.appendChild(tr);
            }
        } else {
            console.error("ID가 'board'인 요소를 찾을 수 없습니다.");
        }
    } else if (categoryId === 2) {
        // FAQ인 경우 FAQ 항목 표시 및 테이블 숨김
        const noticeTable = document.querySelector(".notice-table");
        console.log(noticeTable);
        if (noticeTable) {
            noticeTable.querySelector("thead").style.display = "none";
        }

        for (let i = 0; i < res.data.length; i++) {
            const item = res.data[i];
            const faq = document.createElement("div");
            faq.className = "faq-item";
            faq.innerHTML = `
                <div class="faq-question" onclick="toggleFAQ(${item.id})">
                    ${item.title}
                </div>
                <div id="faq-content-${item.id}" class="faq-answer" style="display: none;">
                    ${item.content}
                </div>
            `;
            boardDiv.appendChild(faq);
        }
    }

    $boardDiv.classList.add('show');
}
// 항목 눌렀을 때 작성한 내용 보기
async function postRowClick(trTag) {
    const id = trTag.children[0].innerText; // 게시글 ID (번호)
    const title = trTag.children[2].innerText;
    const views = parseInt(trTag.children[3].innerText, 10);
    const updated_at = trTag.children[4].innerText;

    try {
        // 현재 조회수 가져오기
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

        const viewsCell = trTag.querySelector('.views');
        if (viewsCell) {
            viewsCell.textContent = currentViews + 1;
        }

        // 상세 내용 가져오기
        const res = await supabase
            .from('board')
            .select('image_url, title, content, updated_at')
            .eq('id', id)
            .single();

        if (!res.data) {
            document.getElementById('notice-title').textContent = "해당 게시물을 찾을 수 없습니다.";
            document.getElementById('notice-date').textContent = "";
            document.getElementById('notice-content').textContent = "";
            return;
        }

        // 상세 내용 표시
        document.getElementById('notice-title').textContent = res.data.title;
        document.getElementById('notice-date').textContent = new Date(res.data.updated_at).toLocaleDateString('ko-KR');
        document.getElementById('notice-content').innerHTML = res.data.content;

        // 이미지 있으면 표시
        const $updateImage = document.getElementById('update-image');
        if ($updateImage) {
            if (res.data.image_url && res.data.image_url.trim() !== '') {
                $updateImage.src = res.data.image_url;
                $updateImage.alt = `Uploaded Image: ${res.data.title}`;
            } else {
                $updateImage.src = '';
                $updateImage.alt = '이미지가 없습니다.';
            }
        }

        // 화면 전환
        document.querySelector('.post_list').style.display = 'none';
        document.getElementById('notice-detail-container').style.display = 'block';

    } catch
        (err) {
        console.error('오류 발생:', err.message);
    }
}

document.getElementById("board-div").addEventListener("click", async (e) => {
    const target = e.target.closest(".post-item");
    if (target) {
        e.preventDefault();  // 링크 이동 막기
        const postId = target.dataset.id;
        history.pushState(null, "", `?pageNum=1&category_id=1&id=${postId}`); // 주소는 바뀌지만 새로고침 없음
        showPostDetail(postId); // 내부 함수로 상세 게시글 로드
    }
});

async function showPostDetail(postId) {
    const {data, error} = await supabase
        .from('board')
        .select('*')
        .eq('id', postId)
        .single();

    if (error || !data) {
        document.getElementById('notice-detail-container').innerHTML = "해당 게시물을 찾을 수 없습니다.";
        return;
    }
    console.log(data);
    document.getElementById('notice-title').textContent = data.title;
    // document.getElementById('notice-views').textContent = `조회수: ${data.views}`;
    document.getElementById('notice-date').textContent = new Date(data.updated_at).toLocaleDateString('ko-KR');
    document.getElementById('notice-content').innerHTML = data.content;

    document.querySelector('.post_list').style.display = 'none';
    document.getElementById('notice-detail-container').style.display = 'block';
}

document.querySelector('#submit-update').addEventListener('click', async function () {
    const $updateId = document.querySelector('#update-id');
    const $updateTitle = document.querySelector('#update-title');
    const $updateContent = document.querySelector('#update-content');
    const $updateName = document.querySelector('#update-name');
    const $updatePassword = document.querySelector('#update-password');
    const $updateCategory = document.querySelector('#update-category');

    const {data} = await supabase
        .from('board')
        .select('password')
        .eq('id', $updateId.innerHTML)
        .single();

    const {value: inputPassword} = await Swal.fire({
        title: "비밀번호 확인",
        input: "password",
        inputPlaceholder: "비밀번호를 입력하세요",
        inputAttributes: {
            maxlength: 10,
            autocapitalize: "off",
            autocorrect: "off"
        },
        showCancelButton: true,
        confirmButtonText: "확인",
        cancelButtonText: "취소",
        customClass: {
            input: 'swal-custom-input'
        },
        preConfirm: (password) => {
            if (!password) {
                Swal.showValidationMessage("비밀번호를 입력하세요.");
            }
            return password;
        }
    });

    if (!inputPassword) {
        return;
    }

    console.log(inputPassword);
    console.log(data.password);
    if (inputPassword !== data.password) {
        Swal.fire({
            title: "비밀번호 오류",
            text: "비밀번호가 올바르지 않습니다.",
            icon: "error",
        });
        return;
    }

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
    urlParams = new URLSearchParams(window.location.search);
    categoryId = Number(urlParams.get('category_id'));
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
        if (!categoryId) categoryId = 1;
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
let urlParams = new URLSearchParams(window.location.search);
let categoryId = Number(urlParams.get('category_id'));
document.addEventListener('DOMContentLoaded', function () {
    switch (categoryId) {
        case 1:
            noticeSelect(1);
            break;
        case 2:
            noticeSelect(2);
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

function goBackToList() {
    document.getElementById('notice-detail-container').style.display = 'none';
    document.querySelector('.post_list').style.display = 'block';
}

// FAQ 토글함수
function toggleFAQ(id) {
    const allAnswers = document.querySelectorAll('.faq-answer'); // 모든 답변 요소 선택
    const currentAnswer = document.getElementById(`faq-content-${id}`); // 현재 클릭한 답변

    // 모든 FAQ 답변을 닫음
    allAnswers.forEach(answer => {
        if (answer !== currentAnswer) { // 현재 클릭한 항목은 제외
            answer.style.display = 'none';
        }
    });

    // 현재 클릭한 FAQ 토글
    if (currentAnswer.style.display === 'none' || currentAnswer.style.display === '') {
        currentAnswer.style.display = 'block';
    } else {
        currentAnswer.style.display = 'none';
    }
}