gsap.registerPlugin(ScrollTrigger/*, ScrollSmoother*/);

// create the scrollSmoother before your scrollTriggers
/*ScrollSmoother.create({
    smooth: 1, // how long (in seconds) it takes to "catch up" to the native scroll position
    effects: true, // looks for data-speed and data-lag attributes on elements
    smoothTouch: 0.1, // much shorter smoothing time on touch devices (default is NO smoothing on touch devices)
});*/
gsap.to("#subImg1", {//타겟 되는 요소
    scrollTrigger: {
        trigger: "#subImg1", // 요소가 뷰포트에 드러나는 순간부터 애니메이션이 작동
        start: "top 200", // 애니메이션 시작시점
        end:"bottom bottom", // 애니메이션 종료시점
        scrub: 2
    },
   duration:2,opacity:1

});

gsap.to("#subImg2", {
    scrollTrigger: {
        trigger: "#subImg2",
        start: "-200 200",
        end:"center center",
        scrub: 2
    },
    duration:2,opacity:1
});

gsap.to("#subImg3", {
    scrollTrigger: {
        trigger: "#subImg3",
        start: "-240 200",
        end:"center center",
        scrub: 2
    },
    duration:2,opacity:1
});