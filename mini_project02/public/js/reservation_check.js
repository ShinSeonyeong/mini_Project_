document.addEventListener("DOMContentLoaded", function () {
    const $confirmReserve = document.querySelector("#confirm-reserve");
    const $resetReserve = document.querySelector("#reset-reserve");
    const $step01 = document.querySelector("#step01");
    const $step02 = document.querySelector("#step02");

    $confirmReserve.addEventListener("click", function () {
        $step01.style.display = "none";
        $step02.style.display = "block";
    });

    $resetReserve.addEventListener("click", function () {
        $step02.style.display = "none";
        $step01.style.display = "block";
    });
});
