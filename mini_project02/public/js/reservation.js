window.addEventListener('DOMContentLoaded', () => {
    <!-- Initialize Swiper -->
    if(typeof Swiper != 'undefined') {
        var swiper = new Swiper(".mySwiper", {
            slidesPerView: 4,
            spaceBetween: 30,
            pagination: {
                el: ".swiper-pagination",
                clickable: true,
            },
        });
    };
});

document.addEventListener("DOMContentLoaded", function () {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("show");
            }
        });
    }, { threshold: 0.3 });

    const elements = document.querySelectorAll(".hidden");
    elements.forEach(el => observer.observe(el));
});
