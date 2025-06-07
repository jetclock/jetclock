"use strict";

const DEGREES_PER_HOUR = 360 / 12;
const DEGREES_PER_MINUTE = 360 / 60;
const DEGREES_PER_SECOND = 360 / 60;

let visuallyHidden = document.querySelector(".visually-hidden");

let hourHand = document.querySelector(".hour");
let minuteHand = document.querySelector(".minute");
let secondHand = document.querySelector(".second");

function tick(h, m, s) {
    h = h == 0 ? 12 : h % 12;

    let hh = h.toString().padStart(2, "0");
    let mm = m.toString().padStart(2, "0");
    let ss = s.toString().padStart(2, "0");

    visuallyHidden.textContent = `${hh}:${mm}:${ss}`;

    let hourPosition = DEGREES_PER_HOUR * h + m / 2;
    hourHand.setAttribute("transform", `rotate(${hourPosition})`);

    let minutePosition = DEGREES_PER_MINUTE * m + s / 10;
    minuteHand.setAttribute("transform", `rotate(${minutePosition})`);

    let secondPosition = DEGREES_PER_SECOND * s;
    secondHand.setAttribute("transform", `rotate(${secondPosition})`);
}

let time = new Date();

let hours = time.getHours();
let minutes = time.getMinutes();
let seconds = time.getSeconds();

tick(hours, minutes, seconds);

setInterval(function () {
    time = new Date();

    hours = time.getHours();
    minutes = time.getMinutes();
    seconds = time.getSeconds();

    tick(hours, minutes, seconds);
}, 1000);
