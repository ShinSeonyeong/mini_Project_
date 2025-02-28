const $submitReserve = document.querySelector('#submit-reserve');

function searchAddress() {
    new daum.Postcode({
        oncomplete: function (data) {
            let fullAddr = data.address; // 기본 주소
            let extraAddr = ''; // 참고 항목

            if (data.addressType === 'R') { // 도로명 주소일 경우
                if (data.bname !== '') {
                    extraAddr += data.bname;
                }
                if (data.buildingName !== '') {
                    extraAddr += (extraAddr !== '' ? ', ' + data.buildingName : data.buildingName);
                }
                fullAddr += (extraAddr !== '' ? ' (' + extraAddr + ')' : '');
            }

            document.getElementById('address').value = fullAddr;
        }
    }).open();
}

// DOMContentLoaded 사용하면 html 다 불러와 지고 나서 함수 실행
document.addEventListener("DOMContentLoaded", function () {
    flatpickr("#use-date", {
        dateFormat: "Y-m-d"
    });
});

document.getElementById("use-date").valueAsDate = new Date();

$submitReserve.addEventListener('click', async function (e) {
    alert('예약되었습니다.');
})