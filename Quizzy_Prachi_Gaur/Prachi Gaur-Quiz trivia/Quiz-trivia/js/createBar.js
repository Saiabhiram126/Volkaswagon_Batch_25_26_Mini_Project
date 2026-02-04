const timer = document.querySelector(".timer");
export const timeOut = document.querySelector(".timeOut");
export function createBar() {
    timeOut.innerHTML = `<div class="timer"><div class="timer_inside"></div></div>`;
}