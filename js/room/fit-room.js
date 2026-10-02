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

// The bookcase's own width, before it is scaled to fit.
const CASE_WIDTH = 760;

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
            root.style.setProperty("--case-zoom", "1");
            return;
        }

        // The room's side of the screen, and the scale that fits
        // the room into it. The room grows taller (more wall) or
        // wider to fill the space exactly. It is measured inside
        // the notch padding, so the shelves keep their share.
        const roomStyle =
            getComputedStyle(room);

        const width =
            (room.clientWidth
                - Number.parseFloat(roomStyle.paddingLeft)
                - Number.parseFloat(roomStyle.paddingRight)) * ROOM_SHARE;

        const height =
            room.clientHeight;

        const zoom =
            Math.min(width / (sideways ? ROOM_WIDTH : NARROW_ROOM_WIDTH), height / ROOM_MIN_HEIGHT);

        root.style.setProperty("--room-zoom", zoom.toFixed(4));

        root.style.setProperty("--room-width", `${Math.floor(width / zoom)}px`);
        root.style.setProperty("--room-height", `${Math.floor(height / zoom)}px`);

        // The bookcase is drawn 760 wide and scaled to fit what
        // is left beside the room (measured after the room has
        // its width), so decorations on it keep their places on
        // every phone, in the browser and the installed app alike.
        const style =
            getComputedStyle(bookcaseZone);

        const shelfWidth =
            bookcaseZone.getBoundingClientRect().width
            - Number.parseFloat(style.paddingLeft)
            - Number.parseFloat(style.paddingRight)
            - 2;

        root.style.setProperty("--case-zoom", Math.min(1, Math.max(0.3, shelfWidth / CASE_WIDTH)).toFixed(4));

    };

    let frame = 0;

    const fitSoon = () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(fit);
    };

    // Held upright, the home page asks to be turned sideways.
    document.body.insertAdjacentHTML("beforeend", `
        <section class="turn-sideways" aria-label="Turn your phone sideways">
            <svg class="turn-sideways__phone" viewBox="0 0 64 64" aria-hidden="true">
                <rect x="20" y="6" width="24" height="52" rx="5" fill="#f6e3d6" stroke="#2b1d24" stroke-width="2.4" />
                <rect x="23.4" y="12" width="17.2" height="38" rx="1.6" fill="#6e3b58" />
                <circle cx="32" cy="54" r="1.8" fill="#2b1d24" />
                <path d="M28 26C28 22 36 22 36 26V34H28Z" fill="#f0cf8a" />
            </svg>
            <h2>Turn your phone sideways</h2>
            <p>Your reading room opens up when your phone is held sideways: the shelves on one side, the window and the chair on the other.</p>
            <div class="turn-sideways__links">
                <a class="button button--brass button--small" href="library.html">My Books</a>
                <a class="button button--ghost button--small" href="reading.html">Reading Now</a>
            </div>
        </section>
    `);

    // A bookcase taller than the room scrolls by itself; a soft
    // fade at its foot (or top) says there are more shelves.
    const caseZone =
        room.querySelector(".bookcase-zone");

    const markShelves = () => {

        if (!caseZone) {
            return;
        }

        caseZone.classList.toggle("has-more-below", caseZone.scrollHeight - caseZone.clientHeight - caseZone.scrollTop > 4);
        caseZone.classList.toggle("has-more-above", caseZone.scrollTop > 4);

    };

    caseZone?.addEventListener("scroll", markShelves, { passive: true });

    if (caseZone && "ResizeObserver" in window) {

        const watch =
            new ResizeObserver(markShelves);

        watch.observe(caseZone);

        const bookcase =
            caseZone.querySelector(".bookcase");

        if (bookcase) {
            watch.observe(bookcase);
        }

    }

    fit();

    UPRIGHT.addEventListener("change", fit);
    SIDEWAYS.addEventListener("change", fit);
    window.addEventListener("resize", fitSoon);

    if ("ResizeObserver" in window) {
        const watchSize =
            new ResizeObserver(fitSoon);

        watchSize.observe(room);

        // The shelves' side changes when the room beside it does
        // (turning the phone, the notch moving sides).
        if (bookcaseZone) {
            watchSize.observe(bookcaseZone);
        }
    }

}
