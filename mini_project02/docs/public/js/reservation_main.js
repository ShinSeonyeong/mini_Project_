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