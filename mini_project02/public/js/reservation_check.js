document.addEventListener("DOMContentLoaded", function () {
    const $confirmReserve = document.querySelector("#confirm-reserve");
    const $resetReserve = document.querySelector("#reset-reserve");
    const $step01 = document.querySelector("#step01");
    const $step02 = document.querySelector("#step02");
    const $rfSubDetails=document.querySelectorAll(".rf_subdetail");
    $confirmReserve.addEventListener("click", function () {
        $step01.style.display = "none";
        $step02.style.display = "block";
        $rfSubDetails.forEach((el) => {
            el.childNodes[1].readOnly = true;
        })
    });

    $resetReserve.addEventListener("click", function () {
        $step02.style.display = "none";
        $step01.style.display = "block";
        $rfSubDetails.forEach((el) => {
            el.childNodes[1].readOnly = false;
        })
    });
});
