document.getElementById('reservation-date').addEventListener('change', function () {
    const RTime = document.querySelector('.r-time');
    if (this.value) {
        RTime.classList.remove('hidden2')
        RTime.scrollIntoView({behavior: 'smooth', block: 'start'});
    }
});

document.querySelectorAll('.reservationTime').forEach((node) => {
    node.addEventListener('change', function () {
        const Rinfo = document.querySelector('.r-info');
        if (this.checked) {
            Rinfo.classList.remove('hidden2');
            Rinfo.scrollIntoView({behavior: 'smooth', block: 'start'});
        }
    })
});

document.querySelectorAll('.reserInfo').forEach((node, idx) => {
    node.addEventListener('change', function () {

        const Raddr = document.querySelector('.r-addr');
        if (idx == 0) {
            if (document.querySelectorAll('.reserInfo')[1].value && !!document.querySelectorAll('.reserInfo')[2].value && !!this.value) {
                Raddr.classList.remove('hidden2');
                Raddr.scrollIntoView({behavior: 'smooth', block: 'start'});
            }
        } else if (idx == 1) {
            if (!!document.querySelectorAll('.reserInfo')[0].value && !!document.querySelectorAll('.reserInfo')[2].value && !!this.value) {
                Raddr.classList.remove('hidden2');
                Raddr.scrollIntoView({behavior: 'smooth', block: 'start'});
            }
        } else {
            if (!!document.querySelectorAll('.reserInfo')[1].value && !!document.querySelectorAll('.reserInfo')[0].value && !!this.value) {
                Raddr.classList.remove('hidden2');
                Raddr.scrollIntoView({behavior: 'smooth', block: 'start'});
            }
        }
    })
});

document.querySelectorAll('.reserAddr').forEach((node) => {
    node.addEventListener('change', function () {
        const Rmodel = document.querySelector('.r-model');
        if (this.value) {
            Rmodel.classList.remove('hidden2');
            Rmodel.scrollIntoView({behavior: 'smooth', block: 'start'});
        }
    })
});

document.getElementById('modelname').addEventListener('change', function () {
    const Rcapacity = document.querySelector('.r-capacity');
    if (this.value) {
        Rcapacity.classList.remove('hidden2');
        Rcapacity.scrollIntoView({behavior: 'smooth', block: 'start'});
    }
});

document.querySelectorAll('.capainput').forEach((node) => {
    node.addEventListener('change', function () {
        const Rselectserv = document.querySelector('.r-selectServ');
        if (this.checked) {
            Rselectserv.classList.remove('hidden2');
            Rselectserv.scrollIntoView({behavior: 'smooth', block: 'start'});
        }
    })
});


document.querySelectorAll('.selectServ').forEach((node) => {
    node.addEventListener('change', function () {
        const Rselectcyc = document.querySelector('.r-selectCyc');
        if (this.value) {
            Rselectcyc.classList.remove('hidden2');
            Rselectcyc.scrollIntoView({behavior: 'smooth', block: 'start'});
        }
    })
});

document.querySelectorAll('.selectCyc').forEach((node) => {
    node.addEventListener('change', function () {
        const Rselectadd = document.querySelector('.r-selectAdd');
        if (this.checked) {
            Rselectadd.classList.remove('hidden2');
            Rselectadd.scrollIntoView({behavior: 'smooth', block: 'start'});
        }
    })
});

document.querySelectorAll('.selectAdd').forEach((node) => {
    node.addEventListener('change', function () {
        const Rspecial = document.querySelector('.r-Special');
        const ReserBtn = document.querySelector('.reserBtn');
        const PriceTabel = document.querySelector('.price-table');
        if (this.checked) {

            Rspecial.classList.remove('hidden2');
            ReserBtn.classList.remove('hidden2')
            Rspecial.scrollIntoView({behavior: 'smooth', block: 'start'});
            PriceTabel.classList.remove('hidden2');

        }
    });
});


const CheckInfoName = document.querySelector('.check-info-name');
const CheckInfoPhone = document.querySelector('.check-info-phone');
const CheckInfoEmail = document.querySelector('.check-info-email');
const CheckDate = document.querySelector('.check-date');
const CheckTime = document.querySelector('.check-time');
const CheckAddrPost = document.querySelector('.check-addr-post');
const CheckAddrAddr = document.querySelector('.check-addr-addr');
const CheckAddrDeta = document.querySelector('.check-addr-deta');
const CheckModel = document.querySelector('.check-model');
const CheckCapacity = document.querySelector('.check-capacity');
const CheckSelectSer = document.querySelector('.check-select-ser');
const CheckSelectCyc = document.querySelector('.check-select-cyc');
const CheckSelectAdd = document.querySelector('.check-select-add');
const CheckSpecial = document.querySelector('.check-special');
const CheckDeposit = document.querySelector('.check-deposit');

const OutputRDate = document.getElementById('reservation-date');
const OutputRTime = document.querySelectorAll('.reservationTime');
const OutputName = document.getElementById('name');
const OutputPhone = document.getElementById('phone');
const OutputEmail = document.getElementById('email');
const OutputModel = document.getElementById('modelname');
const OutputCapacity = document.querySelectorAll('.capainput');
const OutputPost = document.getElementById('postcode');
const OutputAddress = document.getElementById('address');
const OutputDetailAddress = document.getElementById('detailAddress');
const OutputSelectServ = document.querySelectorAll('.selectServ');
const OutputSelectCyc = document.querySelectorAll('.selectCyc');
const OutputSelectAdd = document.querySelectorAll('.selectAdd');
const OutputSpecial = document.getElementById('specialR');

const $confirmReserve = document.querySelector('#confirm-reserve');

const $Rcontainer = document.querySelector('#r-container');
const $modal = document.querySelector('.modal');
const $agreeInput = document.querySelector('#privacy');
const $ReserCheck = document.getElementById('resercheck');

// 예약하기 버튼 눌렀을 때
$confirmReserve.addEventListener('click', async function () {

    if (!($ReserCheck.checked)) {
        Swal.fire({
            icon: "error",
            text: "모든 내용을 확인 후 예약을 진행해 주세요.",
        });
        return;
    }


    CheckInfoName.innerHTML = OutputName.value;
    CheckInfoPhone.innerHTML = OutputPhone.value;
    CheckInfoEmail.innerHTML = OutputEmail.value;
    CheckDate.innerHTML = OutputRDate.value;

    CheckAddrPost.innerHTML = OutputPost.value;
    CheckAddrAddr.innerHTML = OutputAddress.value;
    CheckAddrDeta.innerHTML = OutputDetailAddress.value;
    CheckModel.innerHTML = OutputModel.value;
    CheckSpecial.innerHTML = OutputSpecial.value;

    // 정규식 정의
    const phoneRegex = /^\d{3}-\d{3,4}-\d{4}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const phone = OutputPhone.value;
    const email = OutputEmail.value;

    // 전화번호 유효성 검사
    if (!phoneRegex.test(phone)) {
        Swal.fire({
            icon: 'error',
            html: `유효한 전화번호 형식이 아닙니다.<br> ex) 010-1234-5678`,
            didClose: () => {
                OutputPhone.focus();
            }
        })



    }

    // 이메일 유효성 검사
    else if (!emailRegex.test(email)) {
        Swal.fire({
            icon: 'error',
            html: '유효한 이메일 형식이 아닙니다.<br> ex) example@domain.com',
            didClose: () => {
                OutputEmail.focus();
            }
        });

        OutputEmail.focus();
        console.log("Test");
    } else {

        $Rcontainer.classList.add('hidden2');
        $modal.classList.remove('hidden2');


        const selectedTime = document.querySelector('.reservationTime:checked');
        if (selectedTime) {
            CheckTime.innerHTML = selectedTime.value;
        }
        const selectedSer = document.querySelector('.selectServ:checked');
        if (selectedSer) {
            CheckSelectSer.innerHTML = selectedSer.value;
        }
        const selectedCyc = document.querySelector('.selectCyc:checked');
        if (selectedCyc) {
            CheckSelectCyc.innerHTML = selectedCyc.value;
        }
        const selectedAdd = document.querySelector('.selectAdd:checked');
        if (selectedAdd) {
            CheckSelectAdd.innerHTML = selectedAdd.value;
        }

        function updateCapacity() {
            const selectedCapacity = document.querySelector('.capainput:checked');
            if (selectedCapacity) {
                let capacityText;
                if (selectedCapacity.value === '1') {
                    capacityText = '20~50kg';
                } else if (selectedCapacity.value === '2') {
                    capacityText = '50~100kg';
                } else if (selectedCapacity.value === '3') {
                    capacityText = '100kg 이상';
                } else {
                    capacityText = selectedCapacity.value;
                }
                CheckCapacity.innerHTML = capacityText;
            }
        }

        updateCapacity();

        function deposit() {
            const selectedCapacity = document.querySelector('.capainput:checked');
            if (selectedCapacity) {
                let depositText;
                if (selectedCapacity.value === '1') {
                    depositText = '2만 원';
                } else if (selectedCapacity.value === '2') {
                    depositText = '3만 원';
                } else if (selectedCapacity.value === '3') {
                    depositText = '4만 원';
                } else {
                    depositText = '미정';
                }
                CheckDeposit.innerHTML = depositText;
            }
        }

        deposit();


    }

});

// // 실시간 변경 라디오 버튼 value 가져오기
// OutputRTime.forEach((radio) => {
//     radio.addEventListener('change', function() {
//         const selectedTime = document.querySelector('.reservationTime:checked');
//         if (selectedTime) {
//             CheckTime.innerHTML = selectedTime.value;
//         }
//     });
// });
// OutputSelectServ.forEach((radio) => {
//     radio.addEventListener('change', function() {
//         const selectedSer = document.querySelector('.selectServ:checked');
//         if (selectedSer) {
//             CheckSelectSer.innerHTML = selectedSer.value;
//         }
//     });
// });
// OutputSelectCyc.forEach((radio) => {
//     radio.addEventListener('change', function() {
//         const selectedCyc = document.querySelector('.selectCyc:checked');
//         if (selectedCyc) {
//             CheckSelectCyc.innerHTML = selectedCyc.value;
//         }
//     });
// });
// OutputSelectAdd.forEach((radio) => {
//     radio.addEventListener('change', function() {
//         const selectedAdd = document.querySelector('.selectAdd:checked');
//         if (selectedAdd) {
//             CheckSelectAdd.innerHTML = selectedAdd.value;
//         }
//     });
// });
//
// OutputCapacity.forEach((radio) => {
//     radio.addEventListener('change', updateCapacity);
// });


// 개인정보 제공 보기 버튼 privacy-detail-btn privacy-details

const $PdetailBtn = document.querySelector('.privacy-detail-btn');
const $Pdetail = document.querySelector('.privacy-details');

$PdetailBtn.addEventListener('click', () => {
    const isVisible = $Pdetail.style.display === 'block';
    $Pdetail.style.display = isVisible ? 'none' : 'block';
});

// 취소 버튼

const PrivacyNo = document.querySelector('.privacy-no');
PrivacyNo.addEventListener('click', () => {
    Swal.fire({
        title: "취소하시겠습니까?",
        text: "취소 선택 시 예약 내용은 모두 사라집니다!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        cancelButtonText: "계속예약",
        confirmButtonText: "예약취소"
    }).then((result) => {
        if (result.isConfirmed) {
            location.href = './reservation.html'
        }
    });

});

// 확인 버튼
const PrivacyOk = document.querySelector('.privacy-ok');
PrivacyOk.addEventListener('click', async function () {
    if (!($agreeInput.checked)) {
        Swal.fire({
            icon: "error",
            text: "개인정보 제공에 동의하셔야 합니다.",
        });
        return;
    }

    const reservationData = {
        name: document.querySelector('.check-info-name').innerHTML,
        tel: document.querySelector('.check-info-phone').innerHTML,
        email: document.querySelector('.check-info-email').innerHTML,
        addr: `${document.querySelector('.check-addr-post').innerHTML},
                ${document.querySelector('.check-addr-addr').innerHTML.replaceAll(',','')},
                ${document.querySelector('.check-addr-deta').innerHTML.replaceAll(',','')}`,
        date: document.querySelector('.check-date').innerHTML,
        time: document.querySelector('.check-time').innerHTML,
        model: document.querySelector('.check-model').innerHTML,
        capacity: document.querySelector('.check-capacity').innerHTML,
        service: document.querySelector('.check-select-ser').innerHTML,
        cycle: document.querySelector('.check-select-cyc').innerHTML,
        add: document.querySelector('.check-select-add').innerHTML,
        remark: document.querySelector('.check-special').innerHTML,
        deposit: parseInt(document.querySelector('.check-deposit').innerHTML),
    }


    const data = await supabase
        .from('ice_res')
        .insert([reservationData]);
    // console.log(data);
    if (data.status === 201) {
        Swal.fire({
            title: '예약성공!',
            icon: 'success',
            draggable: true,
        }).then(() => {
            location.href = './reservation.html';
        });
    } else {
        Swal.fire({
            icon: 'error',
            title: '예약 실패',
            text: '예약 저장 중 오류가 발생했습니다. 다시 시도해주세요.',
        });
    }


});

