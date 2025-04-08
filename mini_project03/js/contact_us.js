// const $boardDiv = document.querySelector('#board-div')
const $boardDiv = document.getElementById("board-div");


// 게시글 작성 및 등록
document.querySelector('#submit-post').addEventListener('click', async function () {
    const title = document.querySelector('#post-title').value;
    const category_id = document.querySelector('#post-category').value;
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
            case 3:
                noticeSelect(3);
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
        // 3: "Q&A"
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
        pageLink.style.fontFamily = 'pageNum3'
        pageLink.style.color = 'black';
        pageLink.style.textDecoration = 'none';

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
        const stateobject = {
            category_id: categoryId,
            pageNum: pageNum,
        }

        history.pushState(stateobject, '', `?${params.toString()}`);
    }

    // 날짜 형식 변경 0000-00-00
    const fomatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).replace(/. /g, '-').replace('.', '');
    };

    var res = await supabase
        .from('board')
        .select()
        .eq('category_id', categoryId)
        .order('updated_at', {ascending: true})
        .range(from, to)
    ;
    let rows = '';

    // for (let i = 0; i < res.data.length; i++) {
    //     let content = '';
    for (let i = 0; i < res.data.length; i++) {
        const row = document.createElement("tr");
        if (categoryId === 1) {
            content = `
        <div class="notice-item post-item" data-id="${res.data[i].id}">
            <a class="notice-link" href="contact_us.html?pageNum=${pageNum}&category_id=${categoryId}&id=${res.data[i].id}">
                <h3 class="notice-title">${res.data[i].title}</h3>
                <p class="notice-content">${res.data[i].content}</p>
            </a>
        </div>
    `;
        }
        else if (categoryId === 2) {
            content = `
            <div class="faq-item">
                <div class="faq-question" onclick="toggleFAQ(${res.data[i].id})">
                    <span class="faq-icon">Q</span>  ${res.data[i].title}
                </div>
                <div id="faq-content-${res.data[i].id}" class="faq-answer">
                    <span class="faq-icon">A</span> ${res.data[i].content}
                </div>
            </div>
        `;
        } else {
            content = `<td>${res.data[i].content}</td>`;
        }

        rows += `
        <tr>
            ${categoryId === 1 ? content : `<td>${content}</td>`}
        </tr>
    `;
    }

    if (!res.data) {
        $boardDiv.innerHTML = "<p>데이터를 불러오는 중 오류가 발생했습니다.</p>";
        return;
    }

    $boardDiv.innerHTML = rows;
    $boardDiv.classList.add('show');
}

window.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(location.search);
    const postId = parseInt(params.get('id'));

    // 게시글 ID가 없으면 목록만 보여줍니다.
    if (!postId) {
        document.getElementById('notice-detail-container').style.display = 'none';
        document.querySelector('.post_list').style.display = 'block';
        return;
    }

    // 게시글 데이터 불러오기
    const { data, error } = await supabase
        .from('board')
        .select('*')
        .eq('id', postId)
        .single();

    if (error || !data) {
        document.getElementById('notice-title').textContent = "해당 게시물을 찾을 수 없습니다.";
        document.getElementById('notice-date').textContent = "";
        document.getElementById('notice-content').textContent = "";
        return;
    }

    // 데이터 표시
    document.getElementById('notice-title').textContent = data.title;
    document.getElementById('notice-date').textContent = new Date(data.updated_at).toLocaleDateString('ko-KR');
    document.getElementById('notice-content').innerHTML = data.content;

    // 상세 화면 표시 / 목록 숨기기
    document.querySelector('.post_list').style.display = 'none';
    document.getElementById('notice-detail-container').style.display = 'block';
});

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
    const { data, error } = await supabase
        .from('board')
        .select('*')
        .eq('id', postId)
        .single();

    if (error || !data) {
        document.getElementById('notice-detail-container').innerHTML = "해당 게시물을 찾을 수 없습니다.";
        return;
    }

    document.getElementById('notice-title').textContent = data.title;
    document.getElementById('notice-date').textContent = new Date(data.updated_at).toLocaleDateString('ko-KR');
    document.getElementById('notice-content').innerHTML = data.content;

    // 리스트 숨기고 상세보기만 보여줌
    document.querySelector('.post_list').style.display = 'none';
    document.getElementById('notice-detail-container').style.display = 'block';
}



function goBackToList() {
    document.getElementById('post-detail-view').classList.add('hidden');
    document.getElementById('board-div').style.display = 'block';
    document.getElementById('paging-container').style.display = 'flex';
    document.querySelector('.post-writing').style.display = 'inline-block';
}


function toggleFAQ(id) {
    const currentContent = document.getElementById(`faq-content-${id}`);
    const currentQuestion = currentContent.previousElementSibling;

    const allContents = document.querySelectorAll('.faq-answer');
    const allQuestions = document.querySelectorAll('.faq-question');

    allContents.forEach(content => {
        if (content !== currentContent) {
            content.classList.remove('show');
        }
    });

    allQuestions.forEach(question => {
        if (question !== currentQuestion) {
            question.classList.remove('active');
        }
    });

    currentContent.classList.toggle("show");
    currentQuestion.classList.toggle("active");
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
    const views = parseInt(trTag.children[7].innerText, 10);
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
        $updateImage.style.display = 'block';

        console.log($updateImage.src);
    } else {
        $updateImage.style.display = 'none';
        $updateImage.alt = '이미지가 없습니다.';
        $updateImage.src = '';
    }

    // 모달창 안 보여주게 하기
    const $noticeModal = document.querySelector('#notice-modal');
    $noticeModal.classList.remove('hidden');

    $noticeModal.addEventListener('click', function (event) {
        if (event.target === $noticeModal) {
            $noticeModal.classList.add('hidden');
        }
    });
}

document.querySelector('#submit-update').addEventListener('click', async function () {
    let $updateId = document.querySelector('#update-id');
    const $updateTitle = document.querySelector('#update-title');
    const $updateContent = document.querySelector('#update-content');
    const $updateName = document.querySelector('#update-name');
    let $updatePassword = document.querySelector('#update-password');
    const $updateCategory = document.querySelector('#update-category');

    let {data} = await supabase
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

        if (!categoryId) categoryId = 1;
        noticeSelect(categoryId);
    }

})

async function postDeleteClick(ev, id) {
    // stopPropagation 다른 이벤트 실행 막는 것, userRowClick 이벤트 실행X
    ev.stopPropagation();
    urlParams = new URLSearchParams(window.location.search);
    categoryId = Number(urlParams.get('category_id'));
    const res_delete = await supabase.from('board').select('password').eq('id', id);

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
    console.log(res_delete.data[0].password);
    if (inputPassword !== res_delete.data[0].password) {
        Swal.fire({
            title: "비밀번호 오류",
            text: "비밀번호가 올바르지 않습니다.",
            icon: "error",
        });
        return;
    }

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
    $openModal.addEventListener('click', function (event) {
        if (event.target === $openModal) {
            $openModal.classList.add('hidden');
        }
    });

}

// 글쓰기 취소
function cancelModalClose() {
    const $cancelModal = document.querySelector('#post-modal');
    $cancelModal.classList.add('hidden');
    document.body.classList.add('scroll-lock');
}

// 글 수정
function noticemodalClose() {
    const $noticeModal = document.querySelector('#notice-modal');
    $noticeModal.classList.add('hidden');
    document.body.classList.remove('scroll-lock');
}