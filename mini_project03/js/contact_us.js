const $boardDiv = document.querySelector('#board-div');

function boardToggle() {
    document.querySelector('#order-div').classList.toggle('show');
}

async function noticeSelect() {
    const fomatDate = (dateString) => {
        return new Date(dateString).toISOString().split('T')[0];
    };

    var res = await supabase.from('board').select();
    let rows = '';
    for (let i = 0; i < res.data.length; i++) {
        rows = rows + `
            <tr>
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

document.addEventListener('DOMContentLoaded', function(){
    noticeSelect();
});

function postClick() {
    const $openModal = document.querySelector('#post-modal');
    $openModal.classList.remove('hidden');
}

function cancelModalClose(){
    const $cancelModal = document.querySelector('#post-modal');
    $cancelModal.classList.add('hidden');
    console.log('닫았다');
}
