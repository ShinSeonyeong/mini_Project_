const $boardDiv = document.querySelector('#board-div');

// 게시글 작성 및 등록
document.querySelector('#submit-post').addEventListener('click', async function () {
    const title = document.querySelector('#post-title').value;
    const category_id = document.querySelector('#post-category').value;
    const author = document.querySelector('#user-name').value;
    const content = document.querySelector('#post-content').value;
    const password = document.querySelector('#post-password').value;
    const image_url = document.querySelector('#post-image-url').files[0];

    if (title.length == 0) {
        Swal.fire({icon: "error", title: "등록실패", text: "제목을 입력해주세요."})
            .then(() => {
                document.querySelector('#post-title').focus();
            });
        return;
    } else if (author.length == 0) {
        Swal.fire({icon: "error", title: "등록실패", text: "작성자를 입력해주세요."})
            .then(() => {
                document.querySelector('#user-name').focus();
            });
        return;
    } else if (content.length == 0) {
        Swal.fire({icon: "error", title: "등록실패", text: "내용을 입력해주세요."})
            .then(() => {
                document.querySelector('#post-content').focus();
                // setTimeout(function () {content.focus();}, 1000)
            });
        return;
    } else if (password.length == 0) {
        Swal.fire({icon: "error", title: "등록실패", text: "비밀번호를 입력해주세요."})
            .then(() => {
                document.querySelector('#post-password').focus();
            });
        return;
    }

    // 슈파베이스 스토리지에 저장
    if (!image_url) {
        const id = JSON.parse(id).id;
        var res = await supabase
            .from('board')
            .insert([{title, content, author, password, category_id, image_url}])
            .select();
    } else {
        const fileUrl = await uploadFile(image_url);
        var res = await supabase
            .from('board')
            .insert([{title, content, author, password, category_id, image_url: fileUrl}])
            .select();
    }

    if (res.status === 201) {
        Swal.fire({title: "저장성공", icon: "success", confirmButtonText: '확인', draggable: true})
            .then(() => {
                noticeSelect();
            });
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

function boardToggle() {
    document.querySelector('#order-div').classList.toggle('show');
}

// 게시판 화면에 표시
async function noticeSelect() {
    const fomatDate = (dateString) => {
        return new Date(dateString).toISOString().split('T')[0];
    };

    var res = await supabase.from('board').select();
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
                <td>${res.data[i].views}</td>
                <td>${res.data[i].category_id}</td>
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
                </tr>
                ${rows}
            </table>
        </div>`;
    $boardDiv.innerHTML = boardTable;
    $boardDiv.classList.add('show');
}

// function postRowClick(trTag) {
//     const $updateUserId = document.querySelector('#update-user-id');
//     const $updateName = document.querySelector('#update-name');
//     const $updateEmail = document.querySelector('#update-email');
//
//     const userId = trTag.children[0].innerText;
//     const userName = trTag.children[1].innerText;
//     const userEmail = trTag.children[2].innerText;
//
//     $updateUserId.innerHTML = userId;
//     $updateName.value = userName;
//     $updateEmail.value = userEmail;
//
//     const $modal = document.querySelector('#user-modal');
//     $modal.classList.remove('hidden');
// }

document.addEventListener('DOMContentLoaded', function () {
    noticeSelect();
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
}
