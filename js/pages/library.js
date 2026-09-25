/* =========================================================
   NOVELLOW
   MY BOOKS (library.html)

   The whole catalogue with search, filters and sorting.
   library.html?status=want_to_read is the To Be Read list.
========================================================= */

import { startApp } from "../shell/app-shell.js?v=__VERSION__";

import {
    loadLibrary,
    getBooks,
    getBook,
    getShelves,
    getShelf,
    booksOnShelf,
    placeBook,
    deleteBook,
    events
} from "../core/store.js?v=__VERSION__";

import { coverUrls } from "../core/covers.js?v=__VERSION__";
import { html, render, queryParam, debounce, plural, statusLabel } from "../core/helpers.js?v=__VERSION__";
import { art, loader, emptyState, toast, toastError, confirmDialog, formDialog } from "../core/ui.js?v=__VERSION__";
import { ratingMarkup } from "../core/rating.js?v=__VERSION__";
import { READING_STATUSES } from "../config.js?v=__VERSION__";
import { coverMarkup } from "../books/cover.js?v=__VERSION__";


const content =
    document.getElementById("pageContent");

const isToBeRead =
    queryParam("status") === "want_to_read";

const filters = {
    q: queryParam("q") || "",
    shelf: queryParam("shelf") || "",
    status: queryParam("status") || "",
    genre: queryParam("genre") || "",
    author: queryParam("author") || "",
    rating: queryParam("rating") || "",
    sort: queryParam("sort") || (isToBeRead ? "date_added" : "title")
};

// On a phone the filters fold away behind one button.
let filtersOpen = false;

const SORTS = [
    { id: "title", label: "Title" },
    { id: "author", label: "Author" },
    { id: "rating", label: "Rating" },
    { id: "date_added", label: "Recently added" },
    { id: "date_finished", label: "Recently finished" },
    { id: "pages", label: "Longest first" }
];


/* =========================================================
   FILTERING
========================================================= */

function matching() {

    const term =
        filters.q.trim().toLowerCase();

    const books =
        getBooks().filter((book) => {

            if (term && ![book.title, book.author, book.genre, book.series, book.isbn, getShelf(book.shelf_id)?.name]
                .some((value) => (value || "").toLowerCase().includes(term))) {
                return false;
            }

            if (filters.shelf && book.shelf_id !== filters.shelf) {
                return false;
            }

            if (filters.status && book.status !== filters.status) {
                return false;
            }

            if (filters.genre && (book.genre || "") !== filters.genre) {
                return false;
            }

            if (filters.author && (book.author || "") !== filters.author) {
                return false;
            }

            if (filters.rating && (Number(book.rating) || 0) < Number(filters.rating)) {
                return false;
            }

            return true;

        });

    const sorters = {
        title: (a, b) => a.title.localeCompare(b.title),
        author: (a, b) => (a.author || "~").localeCompare(b.author || "~") || a.title.localeCompare(b.title),
        rating: (a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0),
        date_added: (a, b) => b.created_at.localeCompare(a.created_at),
        date_finished: (a, b) => (b.date_finished || "").localeCompare(a.date_finished || ""),
        pages: (a, b) => (b.page_count || 0) - (a.page_count || 0)
    };

    return books.sort(sorters[filters.sort] || sorters.title);

}


function filterButtonLabel() {

    const active =
        ["shelf", "status", "genre", "author", "rating"]
            .filter((key) => filters[key] && !(isToBeRead && key === "status"))
            .length;

    return active ? `Filters (${active})` : "Filters";

}


function syncUrl() {

    const url =
        new URL(window.location.href);

    Object.entries(filters).forEach(([key, value]) => {

        if (value) {
            url.searchParams.set(key, value);
        }

        else {
            url.searchParams.delete(key);
        }

    });

    window.history.replaceState(null, "", url);

}


/* =========================================================
   RENDER
========================================================= */

function uniqueValues(key) {

    return [...new Set(getBooks().map((book) => book[key]).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b));

}


function renderPage() {

    const books =
        getBooks();

    const heading = html`
        <div class="page-heading">
            <div>
                <h1 class="page-heading__title">${isToBeRead ? "To Be Read" : "My Books"}</h1>
                <p class="page-heading__subtitle">
                    ${isToBeRead
                        ? "The stories waiting their turn."
                        : `Every book in your library${books.length ? ` — ${plural(books.length, "book")} on ${plural(getShelves().length, "shelf", "shelves")}` : ""}.`}
                </p>
            </div>
            <div class="page-heading__actions">
                <button class="button button--brass" type="button" data-action="add-book">${art("ui-add")} Add a book</button>
                ${isToBeRead ? "" : html`<button class="button button--ghost" type="button" data-action="add-shelf">Add a shelf</button>`}
            </div>
        </div>
    `;

    if (!books.length) {

        render(content, html`
            ${heading}
            ${emptyState({
                title: "Your shelves are waiting for their first story.",
                text: "Add a book and it will appear here and on your bookcase.",
                actionLabel: "Add your first book",
                action: "add-book"
            })}
        `);

        return;

    }

    render(content, html`

        ${heading}

        <form class="filter-bar paper ${filtersOpen ? "is-open" : ""}" id="filters" role="search" aria-label="Filter your books">

            <label class="field">
                <span class="field__label">Search</span>
                <input class="field__input" type="search" name="q" value="${filters.q}" placeholder="Title, author, genre, shelf…" autocomplete="off">
            </label>

            <button class="button button--ghost filter-bar__toggle" type="button" data-action="toggle-filters" aria-expanded="${String(filtersOpen)}" aria-controls="moreFilters">
                ${art("ui-chevron-down")}
                <span data-filter-count>${filterButtonLabel()}</span>
            </button>

            <div class="filter-bar__more" id="moreFilters">

            <label class="field">
                <span class="field__label">Shelf</span>
                <select class="field__input" name="shelf">
                    <option value="">All shelves</option>
                    ${getShelves().map((shelf) => html`<option value="${shelf.id}" ${shelf.id === filters.shelf ? html`selected` : ""}>${shelf.name}</option>`)}
                </select>
            </label>

            <label class="field">
                <span class="field__label">Status</span>
                <select class="field__input" name="status">
                    <option value="">Any status</option>
                    ${READING_STATUSES.map((status) => html`<option value="${status.id}" ${status.id === filters.status ? html`selected` : ""}>${status.label}</option>`)}
                </select>
            </label>

            <label class="field">
                <span class="field__label">Genre</span>
                <select class="field__input" name="genre">
                    <option value="">Any genre</option>
                    ${uniqueValues("genre").map((genre) => html`<option ${genre === filters.genre ? html`selected` : ""}>${genre}</option>`)}
                </select>
            </label>

            <label class="field">
                <span class="field__label">Author</span>
                <select class="field__input" name="author">
                    <option value="">Any author</option>
                    ${uniqueValues("author").map((author) => html`<option ${author === filters.author ? html`selected` : ""}>${author}</option>`)}
                </select>
            </label>

            <label class="field">
                <span class="field__label">Rating</span>
                <select class="field__input" name="rating">
                    <option value="">Any rating</option>
                    ${[5, 4, 3, 2, 1].map((stars) => html`<option value="${stars}" ${String(stars) === filters.rating ? html`selected` : ""}>${stars === 5 ? "5 stars" : `${stars}+ stars`}</option>`)}
                </select>
            </label>

            <label class="field">
                <span class="field__label">Sort by</span>
                <select class="field__input" name="sort">
                    ${SORTS.map((sort) => html`<option value="${sort.id}" ${sort.id === filters.sort ? html`selected` : ""}>${sort.label}</option>`)}
                </select>
            </label>

            </div>

        </form>

        <div id="results"></div>

    `);

    renderResults();

}


function renderResults() {

    const results =
        document.getElementById("results");

    if (!results) {
        return;
    }

    const books =
        matching();

    const filtered =
        Object.entries(filters).some(([key, value]) => key !== "sort" && value && !(isToBeRead && key === "status"));

    if (!books.length) {

        render(results, emptyState({
            symbol: "ui-search",
            title: isToBeRead && !filtered ? "Nothing waiting to be read" : "No books match",
            text: isToBeRead && !filtered
                ? "Books you mark as Want to Read gather here."
                : "Try loosening the filters.",
            actionLabel: filtered ? "Clear the filters" : "",
            action: filtered ? "clear-filters" : ""
        }));

        return;

    }

    render(results, html`

        <div class="filter-summary">
            <span>${plural(books.length, "book")}${filtered ? " match" : ""}</span>
            ${filtered ? html`<button class="text-button" type="button" data-action="clear-filters">Clear the filters</button>` : ""}
        </div>

        <ul class="catalogue">
            ${books.map((book) => html`
                <li>
                    <article class="catalogue-card paper">

                        <a href="journal.html?book=${book.id}" aria-hidden="true" tabindex="-1">
                            ${coverMarkup(book, { size: "small" })}
                        </a>

                        <div class="catalogue-card__body">

                            <h2 class="catalogue-card__title">
                                <a href="journal.html?book=${book.id}">${book.title}</a>
                            </h2>

                            ${book.author ? html`<p class="catalogue-card__author">${book.author}</p>` : ""}

                            <div class="catalogue-card__meta">
                                <span class="status-pill status--${book.status}">${statusLabel(book.status)}</span>
                                ${book.rating ? ratingMarkup(book.rating) : ""}
                            </div>

                            <p class="catalogue-card__meta muted">
                                ${[getShelf(book.shelf_id)?.name, book.genre, book.page_count ? `${book.page_count} pages` : ""].filter(Boolean).join(" · ")}
                            </p>

                            <div class="catalogue-card__actions">
                                <a class="icon-button" href="journal.html?book=${book.id}" aria-label="Open the journal for ${book.title}" title="Open journal">${art("ui-open-book")}</a>
                                <button class="icon-button" type="button" data-action="edit" data-id="${book.id}" aria-label="Edit ${book.title}" title="Edit">${art("ui-pencil")}</button>
                                <button class="icon-button" type="button" data-action="move" data-id="${book.id}" aria-label="Move ${book.title} to another shelf" title="Move">${art("ui-move")}</button>
                                <button class="icon-button" type="button" data-action="delete" data-id="${book.id}" aria-label="Remove ${book.title}" title="Remove">${art("ui-trash")}</button>
                            </div>

                        </div>

                    </article>
                </li>
            `)}
        </ul>

    `);

}


/* =========================================================
   ACTIONS
========================================================= */

async function editBook(bookId = null) {

    try {

        const { openBookEditor } =
            await import("../books/book-editor.js?v=__VERSION__");

        await openBookEditor({ bookId });

    }

    catch (error) {
        toastError(error);
    }

}


async function moveBook(bookId) {

    const book =
        getBook(bookId);

    const shelves =
        getShelves();

    const moved =
        await formDialog({
            eyebrow: "Move a book",
            title: `Where should “${book.title}” go?`,
            submitLabel: "Move book",
            body: html`
                <label class="field">
                    <span class="field__label">Shelf</span>
                    <select class="field__input" name="shelf">
                        ${shelves.map((shelf) => html`<option value="${shelf.id}" ${shelf.id === book.shelf_id ? html`selected` : ""}>${shelf.name}</option>`)}
                    </select>
                </label>
            `,
            async onSubmit(values) {

                const shelfId =
                    values.get("shelf");

                if (shelfId === book.shelf_id) {
                    return true;
                }

                await placeBook(bookId, shelfId, booksOnShelf(shelfId).length);

                return getShelf(shelfId)?.name;

            }
        });

    if (typeof moved === "string") {
        toast(`“${book.title}” moved to ${moved}.`, { tone: "success" });
    }

}


async function removeBook(bookId) {

    const book =
        getBook(bookId);

    const sure =
        await confirmDialog({
            title: `Remove “${book.title}”?`,
            message: "Its journal, notes, quotes, words and review will be removed too. This can't be undone.",
            confirmLabel: "Remove book",
            tone: "danger"
        });

    if (!sure) {
        return;
    }

    try {

        await deleteBook(bookId);

        toast(`“${book.title}” was taken off your shelves.`, { tone: "success" });

    }

    catch (error) {
        toastError(error);
    }

}


/* =========================================================
   START
========================================================= */

async function start() {

    await startApp({ page: isToBeRead ? "tbr" : "books", eyebrow: isToBeRead ? "To Be Read" : "My Books" });

    render(content, loader("Fetching the catalogue…"));

    try {

        await loadLibrary();

        await coverUrls(getBooks().map((book) => book.cover_path));

    }

    catch (error) {

        toastError(error);

        render(content, emptyState({ symbol: "ui-alert", title: "Your catalogue couldn't be loaded", text: "Check your connection and try again.", actionLabel: "Try again", href: window.location.href }));

        return;

    }

    renderPage();

    events.addEventListener("library-changed", async () => {

        await coverUrls(getBooks().map((book) => book.cover_path));

        renderPage();

    });

    const applyFilters = debounce(() => {
        syncUrl();
        renderResults();
    }, 150);

    content.addEventListener("input", (event) => {

        const form =
            event.target.closest("#filters");

        if (!form) {
            return;
        }

        filters[event.target.name] = event.target.value;

        const count =
            form.querySelector("[data-filter-count]");

        if (count) {
            count.textContent = filterButtonLabel();
        }

        applyFilters();

    });

    content.addEventListener("submit", (event) => event.preventDefault());

    content.addEventListener("click", async (event) => {

        const trigger =
            event.target.closest("[data-action]");

        if (!trigger) {
            return;
        }

        const { action, id } =
            trigger.dataset;

        if (action === "toggle-filters") {

            filtersOpen = !filtersOpen;

            trigger.closest("#filters").classList.toggle("is-open", filtersOpen);
            trigger.setAttribute("aria-expanded", String(filtersOpen));

        }

        if (action === "add-book") {
            editBook();
        }

        if (action === "add-shelf") {

            const { openShelfEditor } =
                await import("../books/shelf-editor.js?v=__VERSION__");

            openShelfEditor();

        }

        if (action === "edit") {
            editBook(id);
        }

        if (action === "move") {
            moveBook(id);
        }

        if (action === "delete") {
            removeBook(id);
        }

        if (action === "clear-filters") {

            Object.keys(filters).forEach((key) => {

                if (key !== "sort" && !(isToBeRead && key === "status")) {
                    filters[key] = "";
                }

            });

            syncUrl();
            renderPage();

        }

    });

}


start().catch((error) => console.error(error));
