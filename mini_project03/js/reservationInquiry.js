const $PdetailBtn = document.querySelector('.privacy-detail-btn');
const $Pdetail = document.querySelector('.privacy-details');
const $agreeInput = document.querySelector('#privacy');
const $Gobtn = document.querySelector('.gobtn');
const $Step01 = document.querySelector('.step01');
const $Step02 = document.querySelector('.step02');
const $name = document.getElementById('name');
const $email = document.getElementById('email');
const $phone = document.getElementById('phone');

// 개인정보제공 동의 [보기] 버튼
$PdetailBtn.addEventListener('click', () => {
    const isVisible = $Pdetail.style.display === 'block';
    $Pdetail.style.display = isVisible ? 'none' : 'block';
});

// 예약확인 버튼
$Gobtn.addEventListener('click', async function () {
    if (!$name.value) {
        Swal.fire({ icon: 'error', text: '이름을 입력하세요.' });
        return;
    }
    if (!$phone.value) {
        Swal.fire({ icon: 'error', text: '연락처를 입력하세요.' });
        return;
    }
    if (!$email.value) {
        Swal.fire({ icon: 'error', text: 'email 입력하세요.' });
        return;
    }
    if (!$agreeInput.checked) {
        Swal.fire({ icon: 'error', text: '개인정보 제공에 동의하셔야 합니다.' });
        return;
    }

    const phoneRegex = /^\d{3}-\d{3,4}-\d{4}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const phone = $phone.value;
    const email = $email.value;

    // 전화번호 유효성 검사
    if (!phoneRegex.test(phone)) {
        Swal.fire({
            icon: 'error',
            html: `유효한 전화번호 형식이 아닙니다.<br> ex) 010-1234-5678`
        });
        return;
    }

    // 이메일 유효성 검사
    if (!emailRegex.test(email)) {
        Swal.fire({
            icon: 'error',
            html: '유효한 이메일 형식이 아닙니다.<br> ex) example@domain.com'
        });
        return;
    }




    $Step01.style.display = 'none';
    $Step02.classList.remove('hidden2');
    const $Qtxt = document.querySelector('.Q-txt');
    $Qtxt.innerHTML = '예약 정보를 확인하세요';

    console.log('Supabase 쿼리 시작:', { name: $name.value, email: $email.value, tel: $phone.value });
    const { data, error } = await supabase
        .from('ice_res')
        .select('*')
        .eq('name', $name.value)
        .eq('email', $email.value)
        .eq('tel', $phone.value)
        .lt('state', 2);

    if (error) {
        console.error('Supabase 조회 오류:', error);
        Swal.fire({ icon: 'error', text: '예약 조회 중 오류가 발생했습니다.' });
        return;
    }

    console.log('조회된 데이터:', data);

    let row = '';
    if (data && data.length > 0) {
        row = `
      <div class="view">
        <p><strong>이름 : </strong>${data[0].name}</p>
        <p><strong>연락처 : </strong>${data[0].tel}</p>
        <p><strong>email : </strong>${data[0].email}</p>
        <p><strong>주소 : </strong>${data[0].addr}</p>
        <p><strong>날짜 : </strong>${data[0].date.slice(0, 10)}</p>
        <p><strong>시간 : </strong>${data[0].time}</p>
        <p><strong>제빙기 모델명 : </strong>${data[0].model}</p>
        <p><strong>제빙기 용량 : </strong>${data[0].capacity}</p>
        <p><strong>선택 서비스 : </strong>${data[0].service || '미지정'}</p>
        <p><strong>서비스 주기 : </strong>${data[0].cycle || '미지정'}</p>
        <p><strong>추가 서비스 선택 : </strong>${data[0].add || '없음'}</p>
        <p><strong>특별 요청사항 : </strong>${data[0].remark || '없음'}</p>
        <p><strong>예약금 : </strong>${data[0].deposit ? data[0].deposit + '만 원' : '미정'}</p>
        <p><strong>예약상태 : </strong>${data[0].state == 0 ? '예약대기' : '예약완료'}
          <div class="state_explain">${data[0].state == 0 ? '< 예약금을 입금하셔야 예약이 완료됩니다 >' : '예약이 완료되었습니다.'}</div>
        </p>
      </div>
      <div class="button-container">
        <button class="update-btn" onclick="Resupdate(${data[0].res_no})">수정</button>
        <button class="done-btn" onclick="location.href='./reservationInquiry.html'">확인</button>
      </div>
    `;
    } else {
        $Qtxt.innerHTML = '예약 정보 없음';
        row = `
      <div class="view" style="margin-top: 2rem">
        <p class="none-txt"><strong>입력하신 정보로 등록된 예약이 없습니다.<br/>확인 후 다시 시도해 주세요.</strong></p>
      </div>
    `;
    }
    $Step02.innerHTML = row;
});

// 수정 폼 생성 함수
async function Resupdate(reservationId) {
    if (!reservationId+"".match(/[0-9]/g)?.length>0) {
        Swal.fire({ icon: 'error', text: '예약 번호가 누락되었습니다.' });
        return;
    }

    const { data, error } = await supabase
        .from('ice_res')
        .select('*')
        .eq('res_no', reservationId)
        .maybeSingle();

    if (error) {
        console.error('Supabase 조회 오류:', error);
        Swal.fire({ icon: 'error', text: '예약 데이터를 가져오는 중 오류가 발생했습니다.' });
        return;
    }

    if (!data) {
        Swal.fire({ icon: 'info', text: '해당 예약을 찾을 수 없습니다.' });
        return;
    }

    // 현재 날짜와 3개월 후 날짜 계산
    const today = new Date();
    const maxDate = new Date();
    maxDate.setMonth(today.getMonth() + 3);

    const formatDate = (date) => date.toISOString().split('T')[0];

    // 기존 주소에서 우편번호와 상세 주소 분리
    const addrParts = data.addr.split(',');
    const postcode = addrParts[0].match(/[0-9]{5}$/) ? addrParts[0] : '';
    const basicAddr = postcode ? addrParts.slice(1, -1).join(' ') : addrParts.slice(0, -1).join(' ');
    const detailAddr = addrParts[addrParts.length - 1];

    // 수정 폼 HTML
    $Step02.innerHTML = `
    <div class="view">
      <form id="updateForm">
        <p><strong>이름 : </strong><input id="updateName" value="${data.name}"></p>
        <p><strong>연락처 : </strong><input id="updateTel" value="${data.tel}"></p>
        <p><strong>email : </strong><input id="updateEmail" value="${data.email}"></p>
        <p><strong>우편번호 : </strong>
            <input id="updatePostcode" type="text" placeholder="우편번호" value="${postcode}" readonly style="width: 100px;">
          <button class="view-addr-search-btn" type="button" onclick="searchAddress()">🔍검색</button>
        </p> 
          
        <p><strong>주소 : </strong>
          <input id="updateAddr" type="text" value="${basicAddr}" readonly style="width: 300px;">
        </p>
        <p><strong>상세 주소 : </strong>
          <input id="updateDetailAddr" type="text" value="${detailAddr}" placeholder="상세 주소를 입력하세요" style="width: 300px;">
        </p>
        <p><strong>날짜 : </strong><input type="date" id="updateDate" value="${data.date.slice(0, 10)}" min="${formatDate(today)}" max="${formatDate(maxDate)}"></p>
        <p><strong>시간 : </strong>
          <select id="updateTime">
            <option value="오전 10시 ~ 오후 1시" ${data.time === '오전 10시 ~ 오후 1시' ? 'selected' : ''}>오전 10시 ~ 오후 1시</option>
            <option value="오후 2시 ~ 오후 5시" ${data.time === '오후 2시 ~ 오후 5시' ? 'selected' : ''}>오후 2시 ~ 오후 5시</option>
            <option value="오후 4시 ~ 오후 7시" ${data.time === '오후 4시 ~ 오후 7시' ? 'selected' : ''}>오후 4시 ~ 오후 7시</option>
            <option value="오후 6시 ~ 오후 9시" ${data.time === '오후 6시 ~ 오후 9시' ? 'selected' : ''}>오후 6시 ~ 오후 9시</option>
          </select>
        </p>
        <p><strong>제빙기 모델명 : </strong><input id="updateModel" value="${data.model}"></p>
        <p><strong>제빙기 용량 : </strong>
          <select id="updateCapacity" onchange="updateDeposit()">
            <option value="20~50kg" ${data.capacity === '20~50kg' ? 'selected' : ''}>20~50kg</option>
            <option value="50~100kg" ${data.capacity === '50~100kg' ? 'selected' : ''}>50~100kg</option>
            <option value="100kg 이상" ${data.capacity === '100kg 이상' ? 'selected' : ''}>100kg 이상</option>
          </select>
        </p>
        <p><strong>선택 서비스 : </strong>
          <select id="updateService">
            <option value="청소" ${data.service === '청소' ? 'selected' : ''}>청소</option>
            <option value="수리" ${data.service === '수리' ? 'selected' : ''}>수리</option>
          </select>
        </p>
        <p><strong>서비스 주기 : </strong>
          <select id="updateCycle">
            <option value="이번 한 번만" ${data.cycle === '이번 한 번만' ? 'selected' : ''}>이번 한 번만</option>
            <option value="한 달에 한 번" ${data.cycle === '한 달에 한 번' ? 'selected' : ''}>한 달에 한 번</option>
          </select>
        </p>
        <p><strong>추가 서비스 선택 : </strong>
          <select id="updateAdd">
            <option value="심화 청소" ${data.add === '심화 청소' ? 'selected' : ''}>심화 청소</option>
            <option value="물탱크 청소" ${data.add === '물탱크 청소' ? 'selected' : ''}>물탱크 청소</option>
            <option value="필터 교체" ${data.add === '필터 교체' ? 'selected' : ''}>필터 교체</option>
            <option value="" ${!data.add ? 'selected' : ''}>없음</option>
          </select>
        </p>
        <p><strong>특별 요청사항 : </strong><textarea id="updateRemark">${data.remark || ''}</textarea></p>
        <p><strong>예약금 : </strong><span id="updateDeposit">${data.deposit ? data.deposit + '만 원' : '미정'}</span></p>
        <p><strong>예약상태 : </strong>${data.state == 0 ? '예약대기' : '예약완료'}</p>
      </form>
    </div>
    <div class="button-container">
      <button class="update-btn" onclick="saveUpdate(${data.res_no})">저장</button>
      <button class="done-btn" onclick="location.href='./reservationInquiry.html'">취소</button>
    </div>
  `;

    updateDeposit(); // 초기 예약금 설정
}

// 주소 검색  (카카오)
function searchAddress() {
    new daum.Postcode({
        oncomplete: function (data) {
            const postcode = data.zonecode; // 우편번호
            const address = data.address;   // 기본 주소

            document.getElementById('updatePostcode').value = postcode;
            document.getElementById('updateAddr').value = address;
            document.getElementById('updateDetailAddr').focus(); // 상세 주소 입력란으로 포커스 이동
        }
    }).open();
}

// 예약금 업데이트 함수
function updateDeposit() {
    const capacity = document.getElementById('updateCapacity').value;
    const depositSpan = document.getElementById('updateDeposit');
    const depositMap = {
        '20~50kg': '2만 원',
        '50~100kg': '3만 원',
        '100kg 이상': '4만 원'
    };
    depositSpan.textContent = depositMap[capacity] || '미정';
}

// 수정된 데이터 저장 함수
async function saveUpdate(reservationId) {
    if (!(((reservationId+"").match(/[0-9]/g))?.length>0)) {
        Swal.fire({ icon: 'error', text: '예약 번호가 누락되었습니다.' });
        return;
    }

    const updatedData = {
        name: document.getElementById('updateName').value,
        tel: document.getElementById('updateTel').value,
        email: document.getElementById('updateEmail').value,
        addr: `${document.getElementById('updatePostcode').value},
        ${document.getElementById('updateAddr').value.trim().replaceAll(',','')},
        ${document.getElementById('updateDetailAddr').value.trim().replaceAll(',','')}`,
        date: document.getElementById('updateDate').value,
        time: document.getElementById('updateTime').value,
        model: document.getElementById('updateModel').value,
        capacity: document.getElementById('updateCapacity').value,
        service: document.getElementById('updateService').value || null,
        cycle: document.getElementById('updateCycle').value || null,
        add: document.getElementById('updateAdd').value || null,
        remark: document.getElementById('updateRemark').value || null,
        deposit: document.getElementById('updateDeposit').textContent === '미정' ? null : parseInt(document.getElementById('updateDeposit').textContent.replace('만 원', ''))
    };

    // 유효성 검사
    const phoneRegex = /^\d{3}-\d{3,4}-\d{4}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!phoneRegex.test(updatedData.tel)) {
        Swal.fire({ icon: 'error', text: '유효한 전화번호 형식이 아닙니다.\nex) 010-1234-5678' });
        return;
    }
    if (!emailRegex.test(updatedData.email)) {
        Swal.fire({ icon: 'error', text: '유효한 이메일 형식이 아닙니다.\nex) example@domain.com' });
        return;
    }
    if (!updatedData.addr.trim()) {
        Swal.fire({ icon: 'error', text: '주소를 입력하세요.' });
        return;
    }

    const { error } = await supabase
        .from('ice_res')
        .update(updatedData)
        .eq('res_no', reservationId);

    if (error) {
        console.error('Supabase 업데이트 오류:', error);
        Swal.fire({ icon: 'error', text: '예약 수정 중 오류가 발생했습니다.' });
    } else {
        Swal.fire({
            icon: 'success',
            text: '예약이 성공적으로 수정되었습니다.',
        }).then(() => {
            location.href = './reservationInquiry.html';
        });
    }
}