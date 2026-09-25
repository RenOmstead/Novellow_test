/* =========================================================
   NOVELLOW
   BOOK REVEAL

   The shelf-to-journal moment:
     1. the spine slides forward out of the shelf,
     2. the book turns to show its front cover,
     3. it travels to the journal and the cover swings open.
   With reduced motion the journal simply opens.
========================================================= */

import { prefersReducedMotion, wait } from "../core/helpers.js?v=__VERSION__";
import { coverMarkup } from "./cover.js?v=__VERSION__";


function centreOf(rect) {
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}


/*
    playReveal({ spine, book, target })
      spine   the clicked spine element
      target  element (or DOMRect) where the cover should land
    Resolves when the cover has swung open.
*/

export async function playReveal({ spine, book, target }) {

    if (!spine || prefersReducedMotion()) {
        return;
    }

    // 1. Pull the book forward out of the row.
    spine.classList.add("is-pulling");

    await wait(260);

    const from =
        spine.getBoundingClientRect();

    const to =
        target instanceof Element
            ? target.getBoundingClientRect()
            : target;

    if (!to || !to.width) {
        spine.classList.remove("is-pulling");
        return;
    }

    // 2. A copy of the book flies from the shelf to the journal,
    //    turning from its spine to its cover on the way.
    const flight =
        document.createElement("div");

    flight.className = "book-flight";
    flight.setAttribute("aria-hidden", "true");

    flight.style.left = `${to.left}px`;
    flight.style.top = `${to.top}px`;
    flight.style.width = `${to.width}px`;
    flight.style.height = `${to.height}px`;

    flight.innerHTML = `
        <div class="book-flight__book">
            <div class="book-flight__cover">${coverMarkup(book, { size: "large" })}</div>
            <div class="book-flight__pages"></div>
        </div>
    `;

    document.body.appendChild(flight);

    const start =
        centreOf(from);

    const end =
        centreOf(to);

    const startScaleX = from.width / to.width;
    const startScaleY = from.height / to.height;

    const book3d =
        flight.querySelector(".book-flight__book");

    spine.classList.add("is-lent");

    await book3d.animate(
        [
            {
                transform: `translate(${start.x - end.x}px, ${start.y - end.y}px) scale(${startScaleX}, ${startScaleY}) rotateY(-78deg)`,
                opacity: 0.4
            },
            {
                transform: `translate(${(start.x - end.x) * 0.45}px, ${(start.y - end.y) * 0.45 - 40}px) scale(0.92) rotateY(-24deg)`,
                opacity: 1,
                offset: 0.55
            },
            {
                transform: "translate(0, 0) scale(1) rotateY(0deg)",
                opacity: 1
            }
        ],
        {
            duration: 760,
            easing: "cubic-bezier(.2, .8, .2, 1)",
            fill: "forwards"
        }
    ).finished;

    // 3. The cover swings open.
    const cover =
        flight.querySelector(".book-flight__cover");

    await cover.animate(
        [
            { transform: "rotateY(0deg)" },
            { transform: "rotateY(-165deg)" }
        ],
        {
            duration: 520,
            easing: "cubic-bezier(.4, 0, .2, 1)",
            fill: "forwards"
        }
    ).finished;

    await flight.animate(
        [{ opacity: 1 }, { opacity: 0 }],
        { duration: 200, fill: "forwards" }
    ).finished;

    flight.remove();

    // The book is off the shelf now: its place stays empty
    // until it goes back (playReturn).
    spine.classList.remove("is-pulling");

}


/*
    playReturn({ spine, book, from })
      The journal going back on the shelf: the cover swings
      shut, the book turns back to its spine and slides home
      into its gap on the shelf.
      from   element (or DOMRect) where the open cover is now
    Resolves when the book is back on the shelf.
*/

export async function playReturn({ spine, book, from }) {

    if (!spine || prefersReducedMotion()) {
        return;
    }

    const start =
        from instanceof Element
            ? from.getBoundingClientRect()
            : from;

    const home =
        spine.getBoundingClientRect();

    if (!start || !start.width || !home.width) {
        return;
    }

    const flight =
        document.createElement("div");

    flight.className = "book-flight";
    flight.setAttribute("aria-hidden", "true");

    flight.style.left = `${start.left}px`;
    flight.style.top = `${start.top}px`;
    flight.style.width = `${start.width}px`;
    flight.style.height = `${start.height}px`;

    flight.innerHTML = `
        <div class="book-flight__book">
            <div class="book-flight__cover">${coverMarkup(book, { size: "large" })}</div>
            <div class="book-flight__pages"></div>
        </div>
    `;

    document.body.appendChild(flight);

    // The spine waits, empty, for its book.
    spine.classList.add("is-lent");

    // 1. The cover swings shut.
    await flight.querySelector(".book-flight__cover").animate(
        [
            { transform: "rotateY(-165deg)" },
            { transform: "rotateY(0deg)" }
        ],
        {
            duration: 420,
            easing: "cubic-bezier(.4, 0, .2, 1)",
            fill: "forwards"
        }
    ).finished;

    // 2. It turns back to its spine and flies home.
    const a =
        centreOf(start);

    const b =
        centreOf(home);

    await flight.querySelector(".book-flight__book").animate(
        [
            {
                transform: "translate(0, 0) scale(1) rotateY(0deg)",
                opacity: 1
            },
            {
                transform: `translate(${(b.x - a.x) * 0.55}px, ${(b.y - a.y) * 0.55 - 40}px) scale(0.9) rotateY(-24deg)`,
                opacity: 1,
                offset: 0.45
            },
            {
                transform: `translate(${b.x - a.x}px, ${b.y - a.y}px) scale(${home.width / start.width}, ${home.height / start.height}) rotateY(-78deg)`,
                opacity: 0.5
            }
        ],
        {
            duration: 700,
            easing: "cubic-bezier(.4, 0, .2, 1)",
            fill: "forwards"
        }
    ).finished;

    flight.remove();

    // 3. It settles back into its place.
    spine.classList.remove("is-lent", "is-pulling");
    spine.classList.add("is-returning");

    await wait(420);

    spine.classList.remove("is-returning");

}
