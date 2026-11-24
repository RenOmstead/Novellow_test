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

// How much of its side of the room the bookcase takes.
const CASE_SHARE = 0.84;

// How much of the width the room takes.
const ROOM_SHARE = 0.46;

// On a computer: the bookcase's scale is the room's height over
// CASE_ROOM, kept between these; and it stands no taller than
// this share of the room.
const CASE_LEAST = 0.45;
const CASE_MOST = 0.78;
const CASE_HEIGHT_SHARE = 0.64;

// A bookcase always shows this many whole shelves (empty ones
// fill in, js/books/bookcase.js); more slide inside it.
const LEAST_SHELVES = 3;


/*
    How tall the bookcase stands, in its own (unscaled) pixels,
    showing its crown, its first three shelves and its base.
*/

function wholeHeight(bookcase) {

    const body =
        bookcase?.querySelector(".bookcase-body");

    // The scale it's drawn at now: its width on the screen over
    // its own width.
    const zoom =
        bookcase ? bookcase.getBoundingClientRect().width / (Number.parseFloat(getComputedStyle(bookcase).width) || 1) : 1;

    const rows =
        body ? [...body.querySelectorAll(":scope > .shelf-unit > .shelf-row")] : [];

    if (!rows.length) {
        return null;
    }

    const own = (element) =>
        element ? element.getBoundingClientRect().height / zoom : 0;

    const first =
        rows[0].getBoundingClientRect();

    const last =
        rows[Math.min(LEAST_SHELVES, rows.length) - 1].getBoundingClientRect();

    const above =
        (first.top - body.getBoundingClientRect().top) / zoom + body.scrollTop;

    return own(bookcase.querySelector(".bookcase-top"))
        + above
        + (last.bottom - first.top) / zoom
        + own(bookcase.querySelector(".bookcase-base"))
        + 1;

}

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

        // On a computer the bookcase stands free in the room, drawn
        // at its own size and scaled like a piece of furniture: a
        // little smaller in a short room, never more than about two
        // thirds of the room's height (beyond that its shelves slide
        // inside it). Tapping it looks closer (js/room/case-zoom.js).
        if (!compact) {

            const height =
                room.clientHeight;

            const style =
                getComputedStyle(bookcaseZone);

            const space =
                bookcaseZone.clientHeight
                - Number.parseFloat(style.paddingTop)
                - Number.parseFloat(style.paddingBottom);

            // Whole, with three shelves, about two thirds of the
            // room's height (never taller than the room allows).
            // Made bigger or smaller while decorating (its size,
            // js/room/fixtures.js): still whole, so never taller
            // than the room has space for.
            const size =
                Number.parseFloat(getComputedStyle(room).getPropertyValue("--case-size")) || 1;

            const allowed =
                Math.min(space, Math.max(300, height * CASE_HEIGHT_SHARE) * size);

            const whole =
                wholeHeight(bookcaseZone.querySelector(".bookcase"));

            const scale =
                whole
                    ? Math.min(CASE_MOST * size, space / whole, Math.max(CASE_LEAST * size, allowed / whole))
                    : 0.66 * size;

            root.style.setProperty("--case-zoom", scale.toFixed(4));

            // Three whole shelves; any more slide inside.
            root.style.setProperty("--case-max-h", whole ? `${Math.ceil(Math.min(whole, space / scale))}px` : `${Math.floor(allowed / scale)}px`);

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

        // It stands a little narrower than its side of the room,
        // like a piece of furniture against the wall.
        const shelfWidth =
            (bookcaseZone.getBoundingClientRect().width
                - Number.parseFloat(style.paddingLeft)
                - Number.parseFloat(style.paddingRight)) * CASE_SHARE
            - 2;

        const shelfHeight =
            bookcaseZone.clientHeight
            - Number.parseFloat(style.paddingTop)
            - Number.parseFloat(style.paddingBottom);

        // Whole, with three shelves showing: as wide as its side
        // allows, or narrower so three shelves fit the height. (A
        // tap looks closer, js/room/case-zoom.js.)
        const whole =
            wholeHeight(bookcaseZone.querySelector(".bookcase"));

        const caseZoom =
            Math.min(1, Math.max(0.3, shelfWidth / CASE_WIDTH, 0), whole ? shelfHeight / whole : 1);

        root.style.setProperty("--case-zoom", Math.max(0.3, caseZoom).toFixed(4));

        root.style.setProperty("--case-max-h", whole ? `${Math.ceil(Math.min(whole, shelfHeight / Math.max(0.3, caseZoom)))}px` : `${Math.floor(shelfHeight / Math.max(0.3, caseZoom))}px`);

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

    // A bookcase taller than the room keeps its crown and base
    // where they are and its shelves slide inside it; a soft
    // shadow under the crown (or above the base) says there are
    // more shelves.
    const caseZone =
        room.querySelector(".bookcase-zone");

    const shelves =
        caseZone?.querySelector(".bookcase-body");

    const markShelves = () => {

        if (!caseZone || !shelves) {
            return;
        }

        caseZone.classList.toggle("has-more-below", shelves.scrollHeight - shelves.clientHeight - shelves.scrollTop > 4);
        caseZone.classList.toggle("has-more-above", shelves.scrollTop > 4);

    };

    shelves?.addEventListener("scroll", markShelves, { passive: true });

    if (shelves && "ResizeObserver" in window) {

        const watch =
            new ResizeObserver(markShelves);

        watch.observe(shelves);

        new MutationObserver(markShelves).observe(shelves, { childList: true });

        // Shelves added or filled, or a new crown and base (the
        // bookcase's finish chosen): it is measured again.
        new MutationObserver(fitSoon).observe(shelves, { childList: true });

        const parts =
            new ResizeObserver(fitSoon);

        caseZone.querySelectorAll(".bookcase-top, .bookcase-base").forEach((part) => parts.observe(part));

    }

    fit();

    UPRIGHT.addEventListener("change", fit);
    SIDEWAYS.addEventListener("change", fit);
    window.addEventListener("resize", fitSoon);
    document.addEventListener("novellow:case-sized", fitSoon);

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
