/* =========================================================
   NOVELLOW
   THE ROOM VIEW

   Just the room: the menu and the top bar step aside, the
   floor runs deeper and a beamed ceiling crowns the wall.
   A small bar in the corner brings the menus back, starts
   decorating or takes a picture. Remembered on this device.
========================================================= */

import { art } from "../core/ui.js?v=__VERSION__";
import { setArranging } from "./decorations.js?v=__VERSION__";
import { takeRoomPicture } from "./capture.js?v=__VERSION__";


const KEY =
    "novellow-room-view";


function stored() {
    try {
        return localStorage.getItem(KEY) === "on";
    }
    catch {
        return false;
    }
}


export function setRoomView(on) {

    document.documentElement.classList.toggle("room-view", on);

    try {
        localStorage.setItem(KEY, on ? "on" : "off");
    }
    catch {
        // Storage may be switched off; it just isn't remembered.
    }

    // The room measures itself again for its new size.
    window.dispatchEvent(new Event("resize"));

}


export function startRoomView() {

    if (document.documentElement.dataset.art !== "room" || document.querySelector(".room-view-bar")) {
        return;
    }

    document.body.insertAdjacentHTML("beforeend", `
        <div class="room-view-bar" role="group" aria-label="Room view">
            <button class="room-view-bar__button" type="button" data-room-view="exit" title="Show the menus">
                ${art("ui-chevron-right")}<span>Menus</span>
            </button>
            <button class="room-view-bar__button" type="button" data-room-view="decorate" title="Decorate the room">
                ${art("ui-brush")}<span>Decorate</span>
            </button>
            <button class="room-view-bar__button" type="button" data-room-view="picture" title="Take a picture of the room">
                ${art("ui-camera")}<span>Picture</span>
            </button>
        </div>
    `);

    document.addEventListener("click", (event) => {

        const which =
            event.target.closest("[data-room-view]")?.dataset.roomView;

        if (which === "enter") setRoomView(true);
        if (which === "exit") setRoomView(false);
        if (which === "decorate") setArranging(true);
        if (which === "picture") takeRoomPicture();

    });

    if (stored()) {
        setRoomView(true);
    }

}
