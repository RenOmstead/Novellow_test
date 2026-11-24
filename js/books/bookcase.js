/* =========================================================
   NOVELLOW
   BOOKCASE

   Draws the reader's shelves from the store. Each shelf
   holds rows of about ten books; when a row is full a new
   wooden row appears beneath it, so the bookcase grows
   downward instead of scrolling sideways.
========================================================= */

import { isVisiting } from "../core/visit-mode.js?v=__VERSION__";
import {
    getShelves,
    booksOnShelf,
    getBook,
    placeBook,
    adoptShelfOrder,
    getSettings,
    updateSettings
} from "../core/store.js?v=__VERSION__";

import { html, raw, render, seededRandom, debounce } from "../core/helpers.js?v=__VERSION__";
import { art, toast, toastError, confirmDialog } from "../core/ui.js?v=__VERSION__";
import { SHELF_ROW_CAPACITY, SHELF_SORTS } from "../config.js?v=__VERSION__";
import { spineMarkup, spineFootprint, fitSpineTitles } from "./spine.js?v=__VERSION__";


const SHELF_DECOR = {
    original: ["candle", "plant", "teacup", "potion", "belljar", "lantern", "crow", "skull", "bust"],
    haunted: ["candle", "skull", "ghost", "crow", "belljar", "lantern", "potion"],
    rainy: ["candle", "teacup", "globe", "plant", "bust", "lantern"],
    forest: ["mushrooms", "plant", "flowers", "crystal", "belljar", "teacup"],
    cafe: ["teacup", "candle", "plant", "lantern", "flowers", "bust"],
    gothic: ["candle", "skull", "crow", "flowers", "potion", "bust"]
};

const DECOR_VIEWBOX = {
    candle: ["decor-candle", "0 0 40 90", 64],
    plant: ["decor-plant", "0 0 60 78", 70],
    teacup: ["decor-teacup", "0 0 56 58", 48],
    potion: ["decor-potion", "0 0 40 64", 56],
    belljar: ["decor-belljar", "0 0 50 72", 66],
    lantern: ["decor-lantern", "0 0 50 92", 76],
    crow: ["decor-crow", "0 0 64 66", 58],
    skull: ["decor-skull", "0 0 52 48", 42],
    bust: ["decor-bust", "0 0 48 76", 72],
    ghost: ["decor-ghost", "0 0 44 54", 52],
    globe: ["decor-globe", "0 0 56 76", 70],
    mushrooms: ["decor-mushrooms", "0 0 64 52", 46],
    flowers: ["decor-flowers", "0 0 54 78", 72],
    crystal: ["decor-crystal", "0 0 48 60", 54]
};


/* =========================================================
   CREATE
========================================================= */

/*
    createBookcase(body, { onOpenBook, onAddBook, onAddShelf, onEditShelf })
    body is the .bookcase-body element that holds the rows.
*/

export function createBookcase(body, handlers) {

    let lastWidth = 0;
    let selectedId = null;
    let searchTerm = "";

    const draw = () => {

        lastWidth = body.clientWidth;

        render(body, bookcaseMarkup(rowWidth(body)));

        fitSpineTitles(body);

        markSelected();
        applySearch();

    };

    // Re-pack rows when the bookcase changes width.
    const observer =
        new ResizeObserver(debounce(() => {

            if (Math.abs(body.clientWidth - lastWidth) > 24) {
                draw();
            }

        }, 120));

    observer.observe(body);

    body.addEventListener("click", (event) => {

        const spine =
            event.target.closest(".book-spine[data-book-id]");

        if (spine) {
            handlers.onOpenBook?.(spine.dataset.bookId, spine);
            return;
        }

        const action =
            event.target.closest("[data-action]");

        if (!action) {
            return;
        }

        if (action.dataset.action === "add-book") {
            handlers.onAddBook?.(action.dataset.shelfId || null);
        }

        if (action.dataset.action === "add-shelf") {
            handlers.onAddShelf?.();
        }

        if (action.dataset.action === "edit-shelf") {
            handlers.onEditShelf?.(action.dataset.shelfId);
        }

    });

    wireDragging(body, draw);

    function markSelected() {

        body
            .querySelectorAll(".book-spine.is-selected")
            .forEach((spine) => spine.classList.remove("is-selected"));

        if (selectedId) {

            body
                .querySelector(`.book-spine[data-book-id="${selectedId}"]`)
                ?.classList.add("is-selected");

        }

    }

    function applySearch() {

        const term =
            searchTerm.toLowerCase();

        body
            .querySelectorAll(".book-spine[data-book-id]")
            .forEach((spine) => {

                const book =
                    getBook(spine.dataset.bookId);

                const match =
                    !term || [book?.title, book?.author, book?.genre]
                        .some((value) => (value || "").toLowerCase().includes(term));

                spine.classList.toggle("is-dimmed", !match);
                spine.classList.toggle("is-match", Boolean(term) && match);

            });

    }

    return {

        render: draw,

        select(bookId) {
            selectedId = bookId;
            markSelected();
        },

        search(term) {
            searchTerm = term || "";
            applySearch();
        },

        spineFor(bookId) {
            return body.querySelector(`.book-spine[data-book-id="${bookId}"]`);
        }

    };

}


/* =========================================================
   LAYOUT
========================================================= */

function rowWidth(body) {

    // Inner width of a shelf row: the body minus the case's
    // side panels and the interior padding.
    return Math.max(160, body.clientWidth - 36 - 24);

}


/*
    Greedy packing: as many books as fit the row's width,
    never more than SHELF_ROW_CAPACITY.
*/

export function packRows(books, width) {

    const rows = [];

    let row = [];
    let used = 0;

    books.forEach((book) => {

        const footprint =
            spineFootprint(book) + 3;

        if (row.length && (used + footprint > width || row.length >= SHELF_ROW_CAPACITY)) {

            rows.push(row);

            row = [];
            used = 0;

        }

        row.push(book);

        used += footprint;

    });

    if (row.length || !rows.length) {
        rows.push(row);
    }

    return rows;

}


/*
    A bookcase always has at least three shelves, so it stands
    whole, like a real one: rows a library doesn't fill yet are
    empty shelves (the first offers a new shelf). They hold no
    books or pieces. More than three, and the shelves slide.
*/

const LEAST_ROWS = 3;

function spareRows(count, { offer = true } = {}) {

    return Array.from({ length: Math.max(0, count) }, (_, index) => html`
        <section class="shelf-unit shelf-unit--spare" aria-label="An empty shelf">
            <div class="shelf-row">
                <div class="shelf-interior">
                    <div class="shelf-spare">
                        ${offer && index === 0 ? html`
                            <button class="add-shelf-button add-shelf-button--spare" type="button" data-action="add-shelf">
                                ${art("ui-add")}
                                Add another shelf
                            </button>
                        ` : ""}
                    </div>
                </div>
                <div class="shelf-board"></div>
            </div>
        </section>
    `);

}


function bookcaseMarkup(width) {

    const shelves =
        getShelves();

    const sort =
        getSettings().default_shelf_sort || "manual";

    if (!shelves.length) {

        return html`
            <section class="shelf-unit shelf-unit--empty">
                <div class="shelf-row">
                    <div class="shelf-interior shelf-interior--welcome">
                        <div class="shelf-welcome">
                            ${art("scene-cat", "shelf-welcome__cat")}
                            <h2>Your shelves are waiting for their first story.</h2>
                            <p>Add a book and a shelf will be built for it, or start with a shelf of your own.</p>
                            <div class="shelf-welcome__actions">
                                <button class="button button--primary" type="button" data-action="add-book">
                                    ${art("ui-add")}
                                    Add your first book
                                </button>
                                <button class="button button--brass" type="button" data-action="add-shelf">
                                    Build a shelf
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="shelf-board"></div>
                </div>
            </section>
            ${spareRows(LEAST_ROWS - 1, { offer: false })}
        `;

    }

    const units =
        shelves.map((shelf) => ({ shelf, books: booksOnShelf(shelf.id, sort) }));

    const rows =
        units.reduce((sum, unit) => sum + packRows(unit.books, width).length, 0);

    const spare =
        LEAST_ROWS - rows;

    return html`
        ${units.map((unit) => shelfMarkup(unit.shelf, unit.books, width))}

        ${spareRows(spare)}

        ${spare > 0 ? "" : html`
            <div class="bookcase-actions">
                <button class="add-shelf-button" type="button" data-action="add-shelf">
                    ${art("ui-add")}
                    Add another shelf
                </button>
            </div>
        `}
    `;

}


function shelfMarkup(shelf, books, width) {

    const rows =
        packRows(books, width);

    const lastRow =
        rows[rows.length - 1];

    const lastUsed =
        lastRow.reduce((sum, book) => sum + spineFootprint(book) + 3, 0);

    return html`
        <section
            class="shelf-unit shelf-style--${shelf.style}"
            data-shelf-id="${shelf.id}"
            aria-label="${shelf.name} shelf"
            style="${shelf.color ? `--shelf-paint: ${shelf.color}` : ""}"
        >
            ${rows.map((row, index) => html`
                <div class="shelf-row">

                    <div class="shelf-interior">

                        <div class="shelf-books" data-shelf-id="${shelf.id}">

                            ${row.map((book) => spineMarkup(book, { extra: "is-shelved" }))}

                            ${!books.length ? html`
                                <div class="shelf-waiting">
                                    <p>Waiting for its first story</p>
                                    <button class="button button--brass button--small" type="button" data-action="add-book" data-shelf-id="${shelf.id}">
                                        ${art("ui-add")}
                                        Add a book here
                                    </button>
                                </div>
                            ` : ""}

                            ${index === rows.length - 1 && books.length ? shelfDecor(shelf, width - lastUsed) : ""}

                        </div>

                    </div>

                    <div class="shelf-board">

                        ${index === rows.length - 1 ? html`
                            <button class="shelf-edit" type="button" data-action="edit-shelf" data-shelf-id="${shelf.id}" aria-label="Edit the ${shelf.name} shelf" title="Edit this shelf">
                                ${art("art-settings")}
                            </button>
                            <span class="shelf-plaque">
                                <span class="shelf-plaque__name">${shelf.name}</span>
                            </span>
                        ` : ""}

                        ${index === rows.length - 1 && books.length ? html`
                            <button class="shelf-add" type="button" data-action="add-book" data-shelf-id="${shelf.id}" aria-label="Add a book to ${shelf.name}">
                                ${art("ui-add")}
                            </button>
                        ` : ""}

                    </div>

                </div>
            `)}
        </section>
    `;

}


/*
    A little decoration in the space left on a shelf's last
    row, chosen from the room's theme. Hidden when the reader
    prefers sparse decoration.
*/

function shelfDecor(shelf, spare) {

    // The room is left bare: readers place their own decorations
    // with "Arrange the room".
    return "";

    const theme =
        document.documentElement.dataset.theme || "original";

    const density =
        document.documentElement.dataset.density || "cozy";

    if (density === "sparse" || spare < 70) {
        return "";
    }

    const choices =
        SHELF_DECOR[theme] || SHELF_DECOR.original;

    const random =
        seededRandom(shelf.id);

    const picks =
        [choices[Math.floor(random() * choices.length)]];

    if (density === "abundant" && spare > 170) {
        picks.push(choices[Math.floor(random() * choices.length)]);
    }

    return picks.map((name) => {

        const [symbol, viewBox, height] =
            DECOR_VIEWBOX[name];

        return raw(
            `<svg class="shelf-decor" viewBox="${viewBox}" style="--h: ${height}px" aria-hidden="true"><use href="#${symbol}"></use></svg>`
        );

    });

}


/* =========================================================
   REARRANGING BOOKS
   Move a book to a new place on its shelf, or onto another
   shelf.

     Mouse or trackpad: drag it.
     Touch screen: press and hold a book until it lifts, then
     slide it into place. A quick touch still opens the book,
     and a swipe still scrolls the shelves.

   Books go wherever they're put only in "my own order". If
   the shelves are sorted another way (by title, say), trying
   to move a book offers to switch, keeping every book where
   it is now.
========================================================= */

// How long a finger rests on a book before it lifts, and how
// far it can wander first (further, and it's a scroll).
const HOLD_MS = 420;
const HOLD_SLACK = 10;

// Near the top or bottom of the shelves, a lifted book scrolls them.
const EDGE = 56;

function wireDragging(body, redraw) {

    let dragged = null;
    let marker = null;

    // A press that might become a lift, and a lifted book.
    let hold = null;
    let lifted = null;

    // Held while the shelves are sorted another way: the offer
    // to switch waits for the finger to lift, or that lift's
    // tap would land on the offer and close it.
    let offerAfter = null;

    // The tap a touch screen sends after a lift isn't a tap.
    let swallowClick = false;

    const canMove = () =>
        !isVisiting()
        && !document.documentElement.classList.contains("is-arranging-room");

    const ownOrder = () =>
        (getSettings().default_shelf_sort || "manual") === "manual";

    const newMarker = () => {

        const element =
            document.createElement("span");

        element.className = "drop-marker";
        element.setAttribute("aria-hidden", "true");

        return element;

    };

    // Puts the marker where the book would go in this row.
    const placeMarker = (row, x) => {

        const spines =
            [...row.querySelectorAll(".book-spine[data-book-id]")]
                .filter((spine) => spine !== dragged);

        const before =
            spines.find((spine) => {

                const box =
                    spine.getBoundingClientRect();

                return x < box.left + box.width / 2;

            });

        if (before) {

            if (before.previousElementSibling !== marker) {
                row.insertBefore(marker, before);
            }

            return;

        }

        const lastSpine =
            spines[spines.length - 1];

        if (lastSpine) {

            if (lastSpine.nextElementSibling !== marker) {
                lastSpine.after(marker);
            }

        }

        else if (row.firstElementChild !== marker) {
            row.prepend(marker);
        }

    };

    // Moves the book to the marker and saves it.
    const placeAtMarker = async () => {

        const row =
            marker?.isConnected ? marker.closest(".shelf-books") : null;

        const book =
            dragged;

        if (!row || !book) {
            return;
        }

        const shelfId =
            row.dataset.shelfId;

        // Count the books (other than this one) that sit before
        // the marker across all of this shelf's rows.
        const ordered =
            [...row.closest(".shelf-unit").querySelectorAll(".book-spine[data-book-id], .drop-marker")]
                .filter((node) => node !== book);

        const index =
            ordered.indexOf(marker);

        const before =
            getBook(book.dataset.bookId);

        // Put back where it was: nothing to save.
        const unchanged =
            before
            && before.shelf_id === shelfId
            && booksOnShelf(shelfId).findIndex((item) => item.id === before.id) === index;

        marker.remove();

        if (unchanged) {
            return;
        }

        try {
            await placeBook(book.dataset.bookId, shelfId, index);
        }

        catch (error) {

            toastError(error, "That book couldn't be moved. Please try again.");

            redraw();

        }

    };

    // Shelves sorted another way: offer the switch.
    const offerOwnOrder = async () => {

        const sort =
            getSettings().default_shelf_sort;

        const label =
            (SHELF_SORTS.find((item) => item.id === sort)?.label || "another way").toLowerCase();

        const sure =
            await confirmDialog({
                title: "Arrange your books yourself?",
                message: `Your shelves are sorted by ${label}. To move books around, switch to your own order. Every book stays where it is now, and from then on each one goes wherever you put it. You can change this in Settings at any time.`,
                confirmLabel: "Use my own order"
            });

        if (!sure) {
            return;
        }

        try {

            await adoptShelfOrder(sort);

            await updateSettings({ default_shelf_sort: "manual" });

            redraw();

            toast(window.matchMedia("(pointer: fine)").matches
                ? "Done. Drag a book to move it."
                : "Done. Press and hold a book to move it.", { tone: "success" });

        }

        catch (error) {
            toastError(error, "Your shelves couldn't be switched just now. Please try again.");
        }

    };


    /* ---------- Mouse and trackpad ---------- */

    body.addEventListener("pointerover", (event) => {

        const spine =
            event.target.closest(".book-spine[data-book-id]");

        if (spine) {
            spine.draggable = canMove() && window.matchMedia("(pointer: fine)").matches;
        }

    });

    body.addEventListener("dragstart", (event) => {

        const spine =
            event.target.closest(".book-spine[data-book-id]");

        if (!spine || !canMove()) {
            return;
        }

        if (!ownOrder()) {
            event.preventDefault();
            offerOwnOrder();
            return;
        }

        dragged = spine;

        spine.classList.add("is-dragging");

        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", spine.dataset.bookId);

        marker = newMarker();

    });

    body.addEventListener("dragover", (event) => {

        const row =
            event.target.closest(".shelf-books");

        if (!dragged || !row || lifted) {
            return;
        }

        event.preventDefault();

        placeMarker(row, event.clientX);

    });

    body.addEventListener("dragend", () => {

        if (lifted) {
            return;
        }

        dragged?.classList.remove("is-dragging");

        marker?.remove();

        dragged = null;

    });

    body.addEventListener("drop", async (event) => {

        if (!dragged || lifted || !marker?.isConnected) {
            return;
        }

        event.preventDefault();

        dragged.classList.remove("is-dragging");

        await placeAtMarker();

        dragged = null;

    });


    /* ---------- Touch: press, hold, slide ---------- */

    // The row level with the finger, even over the shelf's
    // wooden board or the gap beside the books.
    const rowAt = (x, y) => {

        const under =
            document.elementFromPoint(x, y)?.closest(".shelf-books");

        if (under && body.contains(under)) {
            return under;
        }

        return [...body.querySelectorAll(".shelf-row")]
            .find((shelfRow) => {

                const box =
                    shelfRow.getBoundingClientRect();

                return y >= box.top && y <= box.bottom;

            })
            ?.querySelector(".shelf-books") || null;

    };

    // Whichever is scrolling the shelves: the bookcase itself,
    // or the page.
    const scroller = () =>
        body.scrollHeight > body.clientHeight + 1 ? body : document.scrollingElement;

    const follow = () => {

        const { ghost, x, y, dx, dy, scale } = lifted;

        ghost.style.transform = `translate(${x - dx}px, ${y - dy - 6}px) rotate(-5deg) scale(${scale * 1.15})`;

        const row =
            rowAt(x, y);

        if (row) {
            placeMarker(row, x);
        }

    };

    const autoScroll = () => {

        if (!lifted) {
            return;
        }

        const box =
            scroller() === body ? body.getBoundingClientRect() : { top: 0, bottom: window.innerHeight };

        const step =
            lifted.y < box.top + EDGE ? -Math.ceil((box.top + EDGE - lifted.y) / 6)
                : lifted.y > box.bottom - EDGE ? Math.ceil((lifted.y - (box.bottom - EDGE)) / 6)
                : 0;

        if (step) {
            scroller().scrollTop += step;
            follow();
        }

        lifted.frame = requestAnimationFrame(autoScroll);

    };

    const cancelHold = () => {

        if (hold) {
            clearTimeout(hold.timer);
            hold = null;
        }

    };

    const lift = () => {

        const { spine, pointerId, x, y } = hold;

        hold = null;

        // The finger is still down; when it lifts, its tap
        // shouldn't open the book.
        swallowClick = true;

        if (!ownOrder()) {
            offerAfter = pointerId;
            navigator.vibrate?.(12);
            return;
        }

        const box =
            spine.getBoundingClientRect();

        const scale =
            box.width / (spine.offsetWidth || box.width);

        const ghost =
            spine.cloneNode(true);

        ghost.classList.remove("is-selected", "is-match", "is-dimmed", "is-arriving");
        ghost.classList.add("book-ghost");
        ghost.removeAttribute("id");
        ghost.setAttribute("aria-hidden", "true");
        ghost.tabIndex = -1;
        ghost.style.width = `${spine.offsetWidth}px`;
        ghost.style.height = `${spine.offsetHeight}px`;

        document.body.appendChild(ghost);

        dragged = spine;
        marker = newMarker();

        spine.classList.add("is-dragging");
        spine.before(marker);

        lifted = { ghost, pointerId, x, y, dx: x - box.left, dy: y - box.top, scale, frame: 0 };

        document.documentElement.classList.add("is-moving-book");

        navigator.vibrate?.(12);

        follow();

        lifted.frame = requestAnimationFrame(autoScroll);

    };

    const putDown = async (save) => {

        const { ghost, frame } = lifted;

        lifted = null;

        cancelAnimationFrame(frame);

        ghost.remove();

        document.documentElement.classList.remove("is-moving-book");

        dragged?.classList.remove("is-dragging");

        if (save) {
            await placeAtMarker();
        }

        marker?.remove();

        dragged = null;

        forgetTap();

    };

    // Any tap the browser sends in a moment belongs to the lift.
    const forgetTap = () => {
        window.setTimeout(() => {
            swallowClick = false;
        }, 450);
    };

    body.addEventListener("pointerdown", (event) => {

        if (event.pointerType === "mouse" || !event.isPrimary || lifted) {
            return;
        }

        const spine =
            event.target.closest(".book-spine[data-book-id]");

        cancelHold();

        if (!spine || !canMove()) {
            return;
        }

        hold = {
            spine,
            pointerId: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            timer: window.setTimeout(lift, HOLD_MS)
        };

    });

    window.addEventListener("pointermove", (event) => {

        if (hold && event.pointerId === hold.pointerId) {

            if (Math.hypot(event.clientX - hold.x, event.clientY - hold.y) > HOLD_SLACK) {
                cancelHold();
            }

            return;

        }

        if (lifted && event.pointerId === lifted.pointerId) {
            lifted.x = event.clientX;
            lifted.y = event.clientY;
            follow();
        }

    });

    window.addEventListener("pointerup", (event) => {

        if (hold && event.pointerId === hold.pointerId) {
            cancelHold();
        }

        if (offerAfter === event.pointerId) {
            offerAfter = null;
            forgetTap();
            window.setTimeout(offerOwnOrder, 350);
        }

        if (lifted && event.pointerId === lifted.pointerId) {
            putDown(true);
        }

    });

    window.addEventListener("pointercancel", (event) => {

        if (hold && event.pointerId === hold.pointerId) {
            cancelHold();
        }

        if (offerAfter === event.pointerId) {
            offerAfter = null;
            forgetTap();
        }

        if (lifted && event.pointerId === lifted.pointerId) {
            putDown(false);
        }

    });

    // While a book is lifted, the finger moves it, not the page.
    body.addEventListener("touchmove", (event) => {

        if (lifted) {
            event.preventDefault();
        }

    }, { passive: false });

    // A long press mustn't open the phone's own menu or select text.
    body.addEventListener("contextmenu", (event) => {

        if ((hold || lifted || offerAfter !== null || swallowClick) && event.target.closest(".book-spine[data-book-id]")) {
            event.preventDefault();
        }

    });

    // Runs before the bookcase's own click (which opens a book).
    body.addEventListener("click", (event) => {

        if (swallowClick) {
            swallowClick = false;
            event.preventDefault();
            event.stopImmediatePropagation();
        }

    }, true);

}
