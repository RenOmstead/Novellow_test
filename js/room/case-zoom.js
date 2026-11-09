/* =========================================================
   NOVELLOW
   A CLOSER LOOK AT THE BOOKCASE

   The bookcase stands in the room at the size of a piece of
   furniture. The magnifier on it moves in close, so the
   spines are big and easy to read; its shelves still slide
   and every book still opens. The magnifier again, Escape, or
   a tap on the room away from the bookcase steps back.
========================================================= */

import { art } from "../core/ui.js?v=__VERSION__";


// How close it can come.
const MOST = 2.2;

let room = null;
let button = null;
let close = false;


function place() {

    const root =
        document.documentElement;

    if (!close) {
        room.style.transform = "";
        room.parentElement.style.overflow = "";
        root.classList.remove("case-close");
        button?.setAttribute("aria-pressed", "false");
        return;
    }

    // Measured as it stands in the room (without the zoom).
    const current =
        room.style.transform;

    room.style.transition = "none";
    room.style.transform = "";

    const area =
        room.getBoundingClientRect();

    const shelves =
        (room.querySelector(".bookcase-body") || room.querySelector(".bookcase")).getBoundingClientRect();

    const bookcase =
        room.querySelector(".bookcase").getBoundingClientRect();

    room.style.transform = current;
    void room.offsetWidth;
    room.style.transition = "";

    // The bookcase as wide as most of the room, its shelves in
    // the middle of the view.
    const scale =
        Math.max(1.2, Math.min(MOST, (area.width * 0.92) / bookcase.width));

    const middleX =
        bookcase.left + bookcase.width / 2 - area.left;

    const middleY =
        shelves.top + shelves.height / 2 - area.top;

    const clamp = (value, low, high) =>
        Math.min(high, Math.max(low, value));

    const x =
        clamp(area.width / 2 - middleX * scale, area.width - area.width * scale, 0);

    const y =
        clamp(area.height / 2 - middleY * scale, area.height - area.height * scale, 0);

    room.style.transformOrigin = "0 0";
    room.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    room.parentElement.style.overflow = "clip";

    root.classList.add("case-close");
    button?.setAttribute("aria-pressed", "true");

}


export function setCaseClose(on, { instant = false } = {}) {

    if (!room || close === on) {
        return;
    }

    close = on;

    if (instant) {
        room.style.transition = "none";
    }

    place();

    if (instant) {
        void room.offsetWidth;
        room.style.transition = "";
    }

    if (button) {
        button.setAttribute("aria-label", close ? "Step back from the bookcase" : "Look closer at the bookcase");
        button.title = button.getAttribute("aria-label");
    }

}


export function startCaseZoom(container) {

    room = container;

    const bookcase =
        room?.querySelector(".bookcase");

    if (!bookcase) {
        return;
    }

    bookcase.insertAdjacentHTML("beforeend", `
        <button class="case-zoom" type="button" aria-pressed="false" aria-label="Look closer at the bookcase" title="Look closer at the bookcase">
            ${art("ui-search")}
        </button>
    `);

    button = bookcase.lastElementChild;

    // While close, a button to step back stays on the screen
    // (the magnifier itself may be out of view).
    document.body.insertAdjacentHTML("beforeend", `
        <button class="case-zoom-back" type="button">
            ${art("ui-chevron-left")} Step back
        </button>
    `);

    document.body.lastElementChild.addEventListener("click", () => setCaseClose(false));

    button.addEventListener("click", (event) => {
        event.stopPropagation();
        setCaseClose(!close);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && close) {
            setCaseClose(false);
        }
    });

    // A tap on the room away from the bookcase steps back.
    room.addEventListener("click", (event) => {
        if (close && !event.target.closest(".bookcase")) {
            setCaseClose(false);
        }
    });

    // A book opens in the room, so the view steps back first
    // (at once, so the book lifts from where it is seen).
    room.addEventListener("click", (event) => {
        if (close && event.target.closest(".book-spine")) {
            setCaseClose(false, { instant: true });
        }
    }, { capture: true });

    window.addEventListener("resize", () => close && place());

    // Decorating needs the whole room.
    new MutationObserver(() => {
        if (document.documentElement.classList.contains("is-arranging-room")) {
            setCaseClose(false);
        }
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

}
