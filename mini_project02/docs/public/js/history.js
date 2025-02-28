gsap.registerPlugin(ScrollTrigger);


gsap.to("#arrow_img", {//타겟 되는 요소
    scrollTrigger: {
        trigger: "#arrow_img", // 요소가 뷰포트에 드러나는 순간부터 애니메이션이 작동
        start: "-550 200", // 애니메이션 시작시점
        end:"bottom 100", // 애니메이션 종료시점
        scrub: 2
    },
    duration:0.4,height:"700"
});

gsap.to("#history1", {
    scrollTrigger: {
        trigger: "#history1",
        start: "-500 200",
        end:"-50 100",
        scrub: 2
    },
    duration:0.4,opacity:1
});

gsap.to("#history1_line", {
    scrollTrigger: {
        trigger: "#history1_line",
        start: "-500 200",
        end:"-50 100",
        scrub: 2
    },
    duration:0.4,width:"20"
});

gsap.to("#history2", {
    scrollTrigger: {
        trigger: "#history1",
        start: "-400 200",
        end:"50 100",
        scrub: 2
    },
    duration:0.4,opacity:1
});

gsap.to("#history2_line", {
    scrollTrigger: {
        trigger: "#history2_line",
        start: "-400 200",
        end:"50 100",
        scrub: 2
    },
    duration:0.4,width:"20"
});

gsap.to("#profile_img", {
    scrollTrigger: {
        trigger: "#profile_img",
        start: "-400 200",
        end:"50 100",
        scrub: 2
    },
    duration:0.4,opacity:1
});

gsap.to("#history3", {
    scrollTrigger: {
        trigger: "#history1",
        start: "-300 200",
        end:"100 100",
        scrub: 2
    },
    duration:0.4,opacity:1
});

gsap.to("#history3_line", {
    scrollTrigger: {
        trigger: "#history3_line",
        start: "-300 200",
        end:"100 100",
        scrub: 2
    },
    duration:0.4,width:"20"
});

gsap.to("#history4", {
    scrollTrigger: {
        trigger: "#history1",
        start: "-300 200",
        end:"150 100",
        scrub: 2
    },
    duration:0.4,opacity:1
});

gsap.to("#history4_line", {
    scrollTrigger: {
        trigger: "#history4_line",
        start: "-300 200",
        end:"150 100",
        scrub: 2
    },
    duration:0.4,width:"20"
});

