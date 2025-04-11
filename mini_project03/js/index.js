setInterval(() => {
    let first_li = document.querySelector("#process_ul").children[0];
    first_li.remove();
    document.querySelector("#process_ul").appendChild(first_li);
}, 3000);

class today {
    constructor(date) {
        this.year = date.getFullYear();
        this.month = date.getMonth() + 1;
        this.date = date.getDate();
    }

    getDate() {
        if (this.date < 10) {
            return '0' + this.date;
        }
        return this.date;
    }

    getMonth() {
        if (this.month < 10) {
            return '0' + this.month;
        }
        return this.month;
    }
}

let fileNo = 0;
let filesArr = new Array();
/* 글쓰기 작성 닫을때 내부 내용 초기화 및 전역 변수 초기화,
*  파일 정보들 초기화
* 파일 전송 및 데이터 저장 완료
* 페이지네이션 o, 단일갤러리, 호출순서 o
* TODO 다음페이지 이전페이지 단일갤러리 slicker
*   */
document.addEventListener("DOMContentLoaded", () => {
    let $today = new today(new Date());
    let $body = document.querySelector("body");
    let $reTitle = document.querySelector("#re_title");
    let $reDate = document.querySelector("#re_date");
    let $reservNo = document.querySelector("#reserv_no");
    //let $symptoms = document.querySelector("#symptoms");
    const quill = new Quill('#editor', {
        theme: 'snow'
    });
    document.querySelector("#review_write").addEventListener("click", () => {
        document.querySelector("#re_popup").classList.toggle("hidden");
        $body.classList.toggle("scroll_lock");
        $reDate.value = `${$today.year}-${$today.getMonth()}-${$today.getDate()}`;
        $reTitle.focus();
    })
    document.querySelector("#can_re").addEventListener("click", () => {
        $reTitle.value = '';

        document.querySelector("#re_popup").classList.toggle("hidden");
        $body.classList.toggle("scroll_lock");
        filesArr=[];
        quill.deleteText(0, 9999999);
    })

    document.querySelector("#con_re").addEventListener("click", async () => {
        let btn = document.querySelector("#con_re");
        let btn2 = document.querySelector("#can_re");
        btn.disabled=true;
        btn2.disabled=true;
        /*let re_title = $reTitle.value;
        let re_content = quill.getSemanticHTML(0, 9999999);
        let reservNo = $reservNo.value;*/
        /*let res = await supabase.from('review_gallery').insert([{title: re_title, content: re_content}]).select()
        if (!res.error) {
            console.log(res);*/
            //let res = await re_upload(filesArr, res.data[0].re_no);
            let res = await re_upload(filesArr,quill);
            if (!res.error) {
                document.querySelector("#re_file_list").innerHTML = '';
                $reTitle.value = '';

                document.querySelector("#re_popup").classList.toggle("hidden");
                $body.classList.toggle("scroll_lock");
                filesArr=[];
                quill.deleteText(0, 9999999);

                //갤러리 첫화면 재호출
                fetchGallery(0);

            }
        btn.disabled=false;
        btn2.disabled=false;
       // }
    })
   /* for(let item of $symptoms.children) {
        item.addEventListener("click", () => {
            location.href = './reservation.html';
        })
    }*/

})
/*

async function re_img_insert(ary) {
    let res = await supabase.from('images').insert(ary).select();
    if (!res.error) {
        alert('이미지 테이블 저장 성공');
    }
    return res;
}
*/

async function re_upload(arr, quill) {
    let re_title =  document.querySelector("#re_title").value;
    let re_content = quill.getSemanticHTML(0, 9999999);

    let filesUrl = [];
    for (const file of arr) {
        //storage 폴더 경로 추가 예시
        let filenm = "review_img/"+crypto.randomUUID()+'.' + file.name.split('.').pop();
        let res = await supabase.storage.from('icecarebucket').upload(filenm, file);
        // let res = await supabase.storage.from('iceCareBucket').upload(filenm, file);
        if (!res.error) {
            let re_img_url = await supabase.storage.from('icecarebucket').getPublicUrl(filenm).data.publicUrl;
             // let re_img_url = await supabase.storage.from('iceCareBucket').getPublicUrl(filenm).data.publicUrl;
            // filesUrl.push({conn_no: conn_no, file_name: filenm, image_url: re_img_url});
            filesUrl.push({file_name: filenm, image_url: re_img_url});
        }
    }
    let res2 = await supabase.rpc("insert_gallery",{title: re_title,content:re_content,file_data:filesUrl});
    // let res2 = await re_img_insert(filesUrl);
    return res2;
}

/* 첨부파일 추가 */
function addFile(obj) {
    var maxFileCnt = 8;   // 첨부파일 최대 개수
    var attFileCnt = document.querySelectorAll('.filebox').length;    // 기존 추가된 첨부파일 개수
    var remainFileCnt = maxFileCnt - attFileCnt;    // 추가로 첨부가능한 개수
    var curFileCnt = obj.files.length;  // 현재 선택된 첨부파일 개수

    // 첨부파일 개수 확인
    if (curFileCnt > remainFileCnt) {
        alert("첨부파일은 최대 " + maxFileCnt + "개 까지 첨부 가능합니다.");
    }

    for (var i = 0; i < Math.min(curFileCnt, remainFileCnt); i++) {

        const file = obj.files[i];

        // 첨부파일 검증
        if (validation(file)) {
            // 파일 배열에 담기
            var reader = new FileReader();
            reader.onload = function () {
                filesArr.push(file);
            };
            reader.readAsDataURL(file)

            // 목록 추가
            let htmlData = '';
            htmlData += `<div id="file${fileNo}" data-files="${file}" class="filebox flex">`;
            htmlData += `   <p class="name" data-files="${file}"> ${file.name}  </p>`;
            htmlData += '   <a class="delete" onclick="deleteFile(' + fileNo + ');"><span class="cursor-pointer ml-2 pl-2 pr-2 rounded-sm border-[1px] border-red-400 text-red-600">-</span></a>';
            htmlData += '</div>';
            document.querySelector("#re_file_list").innerHTML += htmlData;
            fileNo++;
        } else {
            continue;
        }
    }
    // 초기화
    document.querySelector("input[type=file]").value = "";
}

/* 첨부파일 검증 */
function validation(obj) {
    const fileTypes = ['application/pdf', 'image/gif', 'image/jpeg', 'image/png', 'image/bmp', 'image/tif', 'application/haansofthwp', 'application/x-hwp'];
    if (obj.name.length > 100) {
        alert("파일명이 100자 이상인 파일은 제외되었습니다.");
        return false;
    } else if (obj.size > (50 * 1024 * 1024)) {
        alert("최대 파일 용량인 50MB를 초과한 파일은 제외되었습니다.");
        return false;
    } else if (obj.name.lastIndexOf('.') == -1) {
        alert("확장자가 없는 파일은 제외되었습니다.");
        return false;
    } else if (!fileTypes.includes(obj.type)) {
        alert("첨부가 불가능한 파일은 제외되었습니다.");
        return false;
    } else {
        return true;
    }
}

/* 첨부파일 삭제 */
function deleteFile(num) {
    document.querySelector("#file" + num).remove();
    filesArr[num].is_delete = true;
}

//갤러리 불러오기(페이지별)
async function fetchGallery_search(page,keyword,key){
    let page_children = document.querySelector("#gallery_pagination").children;
    for(let i = 0; i<page_children.length; i++) {
        if(i===page){
            page_children[i].style.color='red';
        }else{
            page_children[i].style.color='black';
        }
    }
    let res = await supabase.rpc("fetch_gallery_search", {page,keyword,key});
    if (!res.error) {
        let htmlData = '';
        res.data.forEach(item => {
            htmlData += `  <div class="rounded-2xl flex flex-col justify-baseline w-full h-[370px] gap-4 gallery_fetch">
                <div class="p-1 bg-gray-200 rounded-2xl">
                    <div onclick="openGallery('${item.re_no}')" class="w-full h-[25vh] rounded-2xl" data-id="1"
                         style="background-image:url('${item.image}'); background-size:cover; background-repeat:no-repeat; cursor:pointer;"></div>
                </div>
                <div class="text-2xl">${item.title}</div>
                <div>${item.cpdt.slice(0, 10)}</div>
            </div>`;
        })
        document.querySelector("#galleryPage").innerHTML = htmlData;
    }
}

//갤러리 불러오기(페이지별)
async function fetchGallery(page,keyword=''){
    let page_children = document.querySelector("#gallery_pagination").children;
    for(let i = 0; i<page_children.length; i++) {
        if(i===page){
            page_children[i].style.color='red';
        }else{
            page_children[i].style.color='black';
        }
    }
        let res = await supabase.rpc("fetch_gallery", {page});
        if (!res.error) {
            let htmlData = '';
            res.data.forEach(item => {
                htmlData += `  <div class="rounded-2xl flex flex-col justify-baseline w-full h-[370px] gap-4 gallery_fetch">
                <div class="p-1 bg-gray-200 rounded-2xl">
                    <div onclick="openGallery('${item.re_no}')" class="w-full h-[25vh] rounded-2xl" data-id="1"
                         style="background-image:url('${item.image}'); background-size:cover; background-repeat:no-repeat; cursor:pointer;"></div>
                </div>
                <div class="text-2xl">${item.title}</div>
                <div>${item.cpdt.slice(0, 10)}</div>
            </div>`;
            })
            document.querySelector("#galleryPage").innerHTML = htmlData;
        }
}

//갤러리 페이지네이션 구성하고 거기서 갤러리 열기로 변경 => 다음 넘길때 구성 변경형태
document.addEventListener("DOMContentLoaded", galleryPagination(0));

//단일 갤러리 열기
async function openGallery(re_no){
    let $gallery_popup = document.querySelector("#select_gallery");
    document.querySelector('body').classList.add("scroll_lock");
    let res = await supabase.rpc("select_gallery",{gallery_no:re_no});
        $gallery_popup.classList.remove("hidden");
    if(!res.error){
        document.querySelector("#gallery_date").innerHTML = res.data[0].cpdt.slice(0,10);
        document.querySelector("#gallery_title").innerHTML = res.data[0].title;
        document.querySelector("#gallery_content").innerHTML = res.data[0].content;
        let htmlData = '';
        let htmlData2 = '';
        res.data[0].image.forEach(url=>{
            htmlData+=`<li style="overflow:hidden;">
<img src="${url}" style="height:300px; margin:0 auto;" alt="">
</li>
`;
            htmlData2+=`<li class="relative cursor-pointer rounded-[10px]">
<img src="${url}" style="height:60px; width:60px; border-radius:10px;"  alt="">
</li>
`;
        })
        document.querySelector("#gallery_slider").innerHTML = htmlData;
        document.querySelector("#gallery_nav_slider").innerHTML = htmlData2;
        $("#gallery_slider").slick('refresh');
        $("#gallery_nav_slider").slick('refresh');
        $('#gallery_slider').trigger('resize');
        $('#gallery_nav_slider').trigger('resize');
        $('#gallery_nav_slider').slick('slickGoTo', 1);
        $('#gallery_slider').slick('slickGoTo', 1);
    }

}

$('#gallery_slider').slick({
    slide: 'li',
    infinite: true,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    autoplay: true,
    autoplaySpeed: 2000,
    asNavFor: '#gallery_nav_slider',
    prevArrow : `<button type='button' style='background:url("./image/pop_prev.png") no-repeat center / 22px auto;' class='w-[44px] h-[80px] slick-prev absolute top-[40%] left-2 cursor-pointer'></button>`,
    nextArrow : `<button type='button' style='background:url("./image/pop_next.png") no-repeat center / 22px auto;' class='w-[44px] h-[80px] slick-next absolute top-[40%] right-2 cursor-pointer'></button>`,
    responsive: [
        {
            breakpoint: 850,
            settings: {
                slidesToShow: 1
            }
        },

    ]
});
$('#gallery_nav_slider').slick({
    arrows: false,
    variableWidth: true,
    slidesToShow: 'auto',
    slidesToScroll: 1,
    asNavFor: '#gallery_slider',
    arrows: false,
    // centerMode: true,
    focusOnSelect: true,
    responsive: [
        {
            breakpoint: 850,
            settings: {
                slidesToShow: 5,
            }
        },

    ]
});
function close_gallery(){
    let $gallery_popup = document.querySelector("#select_gallery");
    $gallery_popup.classList.add("hidden");
    document.querySelector('body').classList.remove("scroll_lock");
    $('#gallery_slider').slick('slickRemove', null, null, true)
    $('#gallery_nav_slider').slick('slickRemove', null, null, true)
    $('#gallery_slider').html("")
    $('#gallery_nav_slider').html("")
}
function gallery_search(){
    let $keyword = document.querySelector("#search_gallery").value;
    let $key = document.querySelector("#search_gallery_select").value;
    if($keyword.trim().length>0){
        galleryPagination_search(0,$keyword,$key);
    }else{
        galleryPagination(0);
    }

}
//갤러리 검색 페이지 구성하기
async function galleryPagination_search(d,keyword,key){
    let $pagination = document.querySelector("#gallery_pagination");
    let $prev = document.querySelector("#gallery_prev");
    let $next = document.querySelector("#gallery_next");
    let res;
    if(key==1) {
        res = await supabase.from("review_gallery").select('re_no').or(`title.ilike.%${keyword}%,content.ilike.%${keyword}%`).range(d * 9, (d * 9) + 90);
    }else if(key==2){
        res = await supabase.from("review_gallery").select('re_no').ilike('title',`%${keyword}%`).range(d * 9, (d * 9) + 90);
    }else{
        res = await supabase.from("review_gallery").select('re_no').ilike('content',`%${keyword}%`).range(d * 9, (d * 9) + 90);
    }
    if(res.data?.length>0) {

        let htmlData = '';
        let prevData = '';
        let nextData = '';
        if(d>=10){
            prevData=`<button class="pager_prev" onclick="galleryPagination_search(${d-10},'${keyword}',${key})"></button>`;
        }
        if(res.data?.length===91){
            nextData=`<button class="pager_prev rotate-180" onclick="galleryPagination_search(${d+10},'${keyword}',${key})"></button>`;
            res.data.length=90;
        }

        for(let i =0; i<Math.ceil(res.data.length / 9);i++){
            htmlData+=` <div class="cursor-pointer page" onclick="fetchGallery_search(${d+i},'${keyword}',${key})">${i+1}</div> `
        }
        $prev.innerHTML = prevData;
        $next.innerHTML = nextData;
        $pagination.innerHTML = htmlData;
        await fetchGallery_search(d,keyword,key);
    }else{
        $prev.innerHTML = '';
        $next.innerHTML = '';
        $pagination.innerHTML = '';
        document.querySelector("#galleryPage").innerHTML = `<div>조회 결과가 없습니다.</div>`;
        Swal.fire({icon:'error',title:'실패',text:'조회된 결과가 없습니다.'});
    }
}
//갤러리 페이지 구성하기
async function galleryPagination(d){
    let $pagination = document.querySelector("#gallery_pagination");
    let $prev = document.querySelector("#gallery_prev");
    let $next = document.querySelector("#gallery_next");
    let res = await supabase.from("review_gallery").select('re_no').range(d*9,(d*9)+90);
    if(res.data?.length>0) {

        let htmlData = '';
        let prevData = '';
        let nextData = '';
        if(d>=10){
            prevData=`<button class="pager_prev" onclick="galleryPagination(${d-10})"></button>`;
        }
        if(res.data?.length===91){
            nextData=`<button class="pager_prev rotate-180" onclick="galleryPagination(${d+10})"></button>`;
            res.data.length=90;
        }

        for(let i =0; i<Math.ceil(res.data.length / 9);i++){
            htmlData+=` <div class="cursor-pointer page" onclick="fetchGallery(${d+i})">${i+1}</div> `
        }
        $prev.innerHTML = prevData;
        $next.innerHTML = nextData;
        $pagination.innerHTML = htmlData;
        await fetchGallery(d);
    }
}


var swiper = new Swiper(".mySwiper", {
    pagination: {
        el: ".swiper-pagination",
        clickable: true,
    },
    loop: true,
    speed: 1500,
    autoplay: true,
    slidesPerView: 'auto'
});
$('button.swiper-play').click(function () {
    $(this).toggleClass('on')

    if ($(this).hasClass('on')) {
        swiper.autoplay.stop();
    } else {
        swiper.autoplay.start();
    }
})


$(window).load(function () {
    swiper.autoplay.stop();
    setTimeout(function () {
        $(".main_visual").addClass("on");
        swiper.autoplay.start()
    }, 100);



});

var partnerSwiper = new Swiper(".partners_row", {
    loop: true,
    slidesPerView: 5.8,
    spaceBetween: 120,
    autoplay: {
        delay: 5000,
    },
    breakpoints: {
        1200: {
            slidesPerView: 5.8,
            spaceBetween: 60,
        },
        1080: {
            slidesPerView: 4.5,
            spaceBetween: 60,
        },
        850: {
            slidesPerView: 2.5,
            spaceBetween: 0,
        },

    },
});

/*개인정보취급 팝업 닫기*/
function close_popup(){
    document.querySelector("#personal_popup").classList.add("hidden");
    document.querySelector('body').classList.remove("scroll_lock");
}

/*개인정보취급 팝업 열기*/
function open_popup(){
    document.querySelector("#personal_popup").classList.remove("hidden");
    document.querySelector('body').classList.add("scroll_lock");
}
function search_chk(ev){
    if(ev.keyCode == 13){
        gallery_search();
    }
}

window.addEventListener("scroll", ()=>{
    let $advantage = document.querySelector("#advantage")
    let $state = document.querySelector("#state");
    let $gallery = document.querySelector("#gallery");
    //let $symptom = document.querySelector("#symptom");
    let $process = document.querySelector("#process");
    //let $membership = document.querySelector("#membership");

    if(document.documentElement.scrollTop>=$advantage.offsetTop-500){
        $advantage.classList.add("fade-in-animation");
    }/*else{
        $advantage.classList.remove("fade-in-animation");
    }*/

    if(document.documentElement.scrollTop>=$state.offsetTop-500){
        $state.classList.add("fade-in-animation");
    }/*else{
        $state.classList.remove("fade-in-animation");
    }*/

    if(document.documentElement.scrollTop>=$gallery.offsetTop-500){
        $gallery.classList.add("fade-in-animation");
    }/*else{
        $gallery.classList.remove("fade-in-animation");
    }*/

  /*  if(document.documentElement.scrollTop>=$symptom.offsetTop-500){
        $symptom.classList.add("fade-in-animation");
    }else{
        $symptom.classList.remove("fade-in-animation");
    }*/

    if(document.documentElement.scrollTop>=$process.offsetTop-500){
        $process.classList.add("fade-in-animation");
    }/*else{
        $process.classList.remove("fade-in-animation");
    }*/

  /*  if(document.documentElement.scrollTop>=$membership.offsetTop-500){
        $membership.classList.add("fade-in-animation");
    }else{
        $membership.classList.remove("fade-in-animation");
    }*/

});

/*
function counseling(){
    const form = document.getElementById('fwrite');

    const formData = new FormData(form);
    let counseler=true;
    let counseling = '';
    let counsel_info = {name:'성함',phone:'휴대전화'};
    if(!formData.has('agree')){
        Swal.fire({icon: 'error', title: `개인정보처리방침 미동의`, text: `개인정보처리방침을 동의하지 않으셨습니다.`});
    }else {
        formData.forEach((value, key) => {
            if (value.trim().length === 0) {
                counseling.length === 0 ? counseling += counsel_info[key] : counseling += ', ' + counsel_info[key];
                counseler = false;
            }
        });
        if (counseler) {
            Swal.fire({icon: 'success', title: '상담신청완료', text: '상담신청이 완료 되었습니다.'});
        } else {
            Swal.fire({icon: 'error', title: `${counseling} 미입력`, text: `미입력하신 내용을 입력해주세요.`});
        }
    }
}*/
