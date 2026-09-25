/* =========================================================
   NOVELLOW
   THE ROOM ON SMALL SCREENS

   On a phone (held either way) the whole reading room fits
   on one screen and the page never scrolls: the shelves sit
   on the left and scroll by themselves, and the room stands
   on the right. It is the same room as on a computer, drawn
   at a fixed width (css/room.css) and scaled to fit, so the
   window, the chair and every decoration keep their places.
========================================================= */

// The room is drawn 600 wide and at least 620 tall, then
// scaled down to fit its side of the screen. Upright, the
// chair tucks in front of the window so the room can be
// narrower, and so drawn bigger.
const ROOM_WIDTH = 600;
const NARROW_ROOM_WIDTH = 480;
const ROOM_MIN_HEIGHT = 620;

// How much of the width the room takes.
const ROOM_SHARE = 0.46;

export const SIDEWAYS_QUERY =
    "(orientation: landscape) and (max-height: 540px) and (max-width: 1180px)";

// Screens where books open on their own page and the room is
// shown in miniature.
export const COMPACT_QUERY =
    `(max-width: 820px), ${SIDEWAYS_QUERY}`;

const UPRIGHT =
    window.matchMedia("(max-width: 820px)");

const SIDEWAYS =
    window.matchMedia(SIDEWAYS_QUERY);


export function startRoomFit(room) {

    if (!room) {
        return;
    }

    const root =
        document.documentElement;

    const zone =
        room.querySelector(".journal-zone");

    const bookcaseZone =
        room.querySelector(".bookcase-zone");

    const fit = () => {

        const sideways =
            SIDEWAYS.matches;

        const compact =
            sideways || UPRIGHT.matches;

        root.classList.toggle("room-compact", compact);
        root.classList.toggle("room-sideways", sideways);
        root.classList.toggle("room-narrow", compact && !sideways);

        // The paper notes sit with the shelves on a small screen,
        // at full size, rather than shrinking with the room.
        const notes =
            document.getElementById("deskNotes");

        if (notes) {

            if (compact) {

                if (notes.parentElement !== bookcaseZone) {
                    bookcaseZone.appendChild(notes);
                }

            }

            else if (notes.parentElement !== zone) {
                zone.insertBefore(notes, zone.querySelector(".cozy-corner"));
            }

        }

        if (!compact) {
            return;
        }

        // The room's side of the screen, and the scale that fits
        // the room into it. The room grows taller (more wall) or
        // wider to fill the space exactly.
        const width =
            room.clientWidth * ROOM_SHARE;

        const height =
            room.clientHeight;

        const zoom =
            Math.min(width / (sideways ? ROOM_WIDTH : NARROW_ROOM_WIDTH), height / ROOM_MIN_HEIGHT);

        root.style.setProperty("--room-zoom", zoom.toFixed(4));
        root.style.setProperty("--room-width", `${Math.floor(width / zoom)}px`);
        root.style.setProperty("--room-height", `${Math.floor(height / zoom)}px`);

    };

    let frame = 0;

    const fitSoon = () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(fit);
    };

    fit();

    UPRIGHT.addEventListener("change", fit);
    SIDEWAYS.addEventListener("change", fit);
    window.addEventListener("resize", fitSoon);

    if ("ResizeObserver" in window) {
        new ResizeObserver(fitSoon).observe(room);
    }

}
