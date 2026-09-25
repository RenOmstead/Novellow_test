/* =========================================================
   NOVELLOW
   THE ROOM ON SMALL SCREENS

   A phone held upright shows the whole reading room in
   miniature under the bookcase; held sideways, the room sits
   beside the shelves and stays in view while they scroll.
   Either way it is the same room as on a computer, drawn at
   a fixed size (css/room.css) and scaled to fit, so the
   window, the chair and every decoration keep their places.
========================================================= */

// The size the room is drawn at before it is scaled. Upright
// there is room for the whole wall (as tall as on a computer);
// sideways the room is shorter, like a short laptop screen.
const ROOM_WIDTH = 600;
const WALL_HEIGHT = 820;
const SIDEWAYS_HEIGHT = 620;

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

        const upright =
            !sideways && UPRIGHT.matches;

        root.classList.toggle("room-upright", upright);
        root.classList.toggle("room-sideways", sideways);

        // The paper notes sit under the bookcase on a small
        // screen, at full size, rather than shrinking with the room.
        const notes =
            document.getElementById("deskNotes");

        if (notes) {

            if (upright || sideways) {

                if (notes.parentElement !== bookcaseZone) {
                    bookcaseZone.appendChild(notes);
                }

            }

            else if (notes.parentElement !== zone) {
                zone.insertBefore(notes, zone.querySelector(".cozy-corner"));
            }

        }

        let zoom = 1;
        let width = ROOM_WIDTH;

        // Upright, the room fills the width: shrunk on a phone,
        // at its real size (with more wall) on a wider screen.
        if (upright) {
            zoom = Math.min(1, room.clientWidth / ROOM_WIDTH);
            width = room.clientWidth / zoom;
        }

        if (sideways) {

            const header =
                document.querySelector(".scene-header")?.offsetHeight || 0;

            zoom = Math.min(
                (room.clientWidth * 0.5) / ROOM_WIDTH,
                (window.innerHeight - header - 8) / SIDEWAYS_HEIGHT
            );

        }

        root.style.setProperty("--room-zoom", zoom.toFixed(4));
        root.style.setProperty("--room-width", `${Math.floor(width)}px`);
        root.style.setProperty("--room-height", `${sideways ? SIDEWAYS_HEIGHT : WALL_HEIGHT}px`);

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
