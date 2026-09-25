/* =========================================================
   NOVELLOW
   BOOKCASE

   Draws the reader's shelves from the store. Each shelf
   holds rows of about ten books; when a row is full a new
   wooden row appears beneath it, so the bookcase grows
   downward instead of scrolling sideways.
========================================================= */

import {
    getShelves,
    booksOnShelf,
    getBook,
    placeBook,
    getSettings
} from "../core/store.js?v=__VERSION__";

import { html, raw, render, seededRandom, debounce } from "../core/helpers.js?v=__VERSION__";
import { art, toastError } from "../core/ui.js?v=__VERSION__";
import { SHELF_ROW_CAPACITY } from "../config.js?v=__VERSION__";
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
        `;

    }

    return html`
        ${shelves.map((shelf) => shelfMarkup(shelf, booksOnShelf(shelf.id, sort), width))}

        <div class="bookcase-actions">
            <button class="add-shelf-button" type="button" data-action="add-shelf">
                ${art("ui-add")}
                Add another shelf
            </button>
        </div>
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
   DRAG AND DROP
   Reorder books or move them between shelves by dragging.
   Only in "my own order" sorting, and only with a mouse or
   trackpad; the book editor offers the same moves by keyboard.
========================================================= */

function wireDragging(body, redraw) {

    let dragged = null;
    let marker = null;

    const canDrag = () =>
        (getSettings().default_shelf_sort || "manual") === "manual"
        && window.matchMedia("(pointer: fine)").matches;

    body.addEventListener("pointerover", (event) => {

        const spine =
            event.target.closest(".book-spine[data-book-id]");

        if (spine) {
            spine.draggable = canDrag();
        }

    });

    body.addEventListener("dragstart", (event) => {

        const spine =
            event.target.closest(".book-spine[data-book-id]");

        if (!spine || !canDrag()) {
            return;
        }

        dragged = spine;

        spine.classList.add("is-dragging");

        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", spine.dataset.bookId);

        marker = document.createElement("span");
        marker.className = "drop-marker";
        marker.setAttribute("aria-hidden", "true");

    });

    body.addEventListener("dragover", (event) => {

        const row =
            event.target.closest(".shelf-books");

        if (!dragged || !row) {
            return;
        }

        event.preventDefault();

        const spines =
            [...row.querySelectorAll(".book-spine[data-book-id]")]
                .filter((spine) => spine !== dragged);

        const before =
            spines.find((spine) => {

                const box =
                    spine.getBoundingClientRect();

                return event.clientX < box.left + box.width / 2;

            });

        if (before) {
            row.insertBefore(marker, before);
        }

        else {

            const lastSpine =
                spines[spines.length - 1];

            if (lastSpine) {
                lastSpine.after(marker);
            }

            else {
                row.prepend(marker);
            }

        }

    });

    body.addEventListener("dragend", () => {

        dragged?.classList.remove("is-dragging");

        marker?.remove();

        dragged = null;

    });

    body.addEventListener("drop", async (event) => {

        const row =
            event.target.closest(".shelf-books");

        if (!dragged || !row || !marker?.isConnected) {
            return;
        }

        event.preventDefault();

        const bookId =
            dragged.dataset.bookId;

        const shelfId =
            row.dataset.shelfId;

        // Count the books (other than the dragged one) that sit
        // before the marker across all of this shelf's rows.
        const unit =
            row.closest(".shelf-unit");

        const ordered =
            [...unit.querySelectorAll(".book-spine[data-book-id], .drop-marker")]
                .filter((node) => node !== dragged);

        const index =
            ordered.indexOf(marker);

        marker.remove();

        dragged.classList.remove("is-dragging");

        dragged = null;

        try {
            await placeBook(bookId, shelfId, index);
        }

        catch (error) {

            toastError(error, "That book couldn't be moved. Please try again.");

            redraw();

        }

    });

}
