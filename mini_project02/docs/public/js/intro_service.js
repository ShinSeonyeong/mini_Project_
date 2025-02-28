gsap.registerPlugin(ScrollTrigger);
    // 탭과 패널 활성화 함수
    function activateTab(tab) {
        if(!!tab) {
        // 탭 활성화 : 모든 탭 비활성화 -> 선택 탭 활성화
        const allTabs = document.querySelectorAll(".depth1 li");
        allTabs.forEach(function(otherTab){
            otherTab.classList.remove("on");
            otherTab.setAttribute("tabindex", "-1");
            otherTab.setAttribute("aria-selected", "false");
            otherTab.setAttribute("aria-expanded", "false");
        });

            tab.classList.add("on");
            tab.setAttribute("tabindex", "0");
            tab.setAttribute("aria-selected", "true");
            tab.setAttribute("aria-expanded", "true");

        // 관련 패널 활성화 : 모든 패널 비활성화 -> 선택 패널 활성화
        const panelId = tab.getAttribute("aria-controls");
        const panel = document.getElementById(panelId);
        const allPanels = document.querySelectorAll(".depth2");
        allPanels.forEach(function(otherPanel) {
            otherPanel.classList.remove("on");
            otherPanel.setAttribute("tabindex", "-1");
            otherPanel.setAttribute("aria-selected", "false");
        });
        panel.classList.add("on");
        panel.setAttribute("tabindex", "0");
        panel.setAttribute("aria-selected", "true");
        }
    }

    // 초기화 : 첫 번째 탭 활성화
    const firstTab = document.querySelector(".depth1 li");
    activateTab(firstTab);

    // 모든 탭 버튼에 이벤트 리스너 추가
    const tabs = document.querySelectorAll(".depth1 li");
    tabs.forEach(function(tab) {
        tab.addEventListener("click", function(e) {
            e.preventDefault();
            activateTab(this);
        });
    });





window.addEventListener("DOMContentLoaded", function() {


    gsap.to("#poster_img1", {//타겟 되는 요소
        scrollTrigger: {
            trigger: "#poster_img1", // 요소가 뷰포트에 드러나는 순간부터 애니메이션이 작동
            start: "600 200", // 애니메이션 시작시점
            end:"1000 300", // 애니메이션 종료시점
            scrub: 2
        },
        duration:2,opacity:0
    });
/*    gsap.to("#poster_images", {//타겟 되는 요소
        scrollTrigger: {
            trigger: "#poster_img1", // 요소가 뷰포트에 드러나는 순간부터 애니메이션이 작동
            start: "-400 200", // 애니메이션 시작시점
            end:"-300 300", // 애니메이션 종료시점
            scrub: 2
        },
        duration:0,background:'#ebfeff'
    });*/

    gsap.to("#poster_img2", {
        scrollTrigger: {
            trigger: "#poster_img2",
            start: "-600 200",
            end:"100 center",
            scrub: 2
        },
        duration:2,opacity:1
    });

    gsap.to("#poster_images", {
        scrollTrigger: {
            trigger: "#poster_img2",
            start: "50 200",
            end:"100 center",
            scrub: 2
        },
        duration:0.1,background:'#64FF64'
    });


});

