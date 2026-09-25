/* =========================================================
   NOVELLOW
   HOME (dashboard.html)

   The reading room: the bookcase is the main event, the
   open journal sits beside it, and choosing a spine pulls
   the book out, shows its cover and opens its journal.
========================================================= */

import { startApp } from "../shell/app-shell.js?v=__VERSION__";

import {
    loadLibrary,
    getBooks,
    getBook,
    getShelves,
    booksOnShelf,
    getSettings,
    listQuotes,
    listRecentEntries,
    events
} from "../core/store.js?v=__VERSION__";

import { coverUrls } from "../core/covers.js?v=__VERSION__";
import { html, render, queryParam, setQueryParam, progressPercent, truncate, prefersReducedMotion } from "../core/helpers.js?v=__VERSION__";
import { art, loader, toastError } from "../core/ui.js?v=__VERSION__";
import { growIvy } from "../room/ivy.js?v=__VERSION__";
import { renderCrown } from "../room/crown.js?v=__VERSION__";
import { startAmbience } from "../room/ambience.js?v=__VERSION__";
import { startDecorations } from "../room/decorations.js?v=__VERSION__";
import { createBookcase } from "../books/bookcase.js?v=__VERSION__";
import { playReveal, playReturn } from "../books/book-reveal.js?v=__VERSION__";
import { coverMarkup } from "../books/cover.js?v=__VERSION__";
import { createJournal } from "../journal/journal.js?v=__VERSION__";


const PHONE =
    window.matchMedia("(max-width: 820px)");

let bookcase;
let journal;
let arrivingBookId = null;


/* =========================================================
   EDITORS (loaded when first needed)
========================================================= */

async function openEditor(bookId = null, shelfId = null) {

    try {

        const { openBookEditor } =
            await import("../books/book-editor.js?v=__VERSION__");

        const saved =
            await openBookEditor({ bookId, shelfId });

        if (saved && !bookId) {
            openBook(saved.id);
        }

    }

    catch (error) {
        toastError(error);
    }

}


async function openShelf(shelfId = null) {

    try {

        const { openShelfEditor } =
            await import("../books/shelf-editor.js?v=__VERSION__");

        await openShelfEditor({ shelfId });

    }

    catch (error) {
        toastError(error);
    }

}


/* =========================================================
   OPENING A BOOK
========================================================= */

/*
    The journal is a book taken off the shelf: it flies out,
    opens in front of the room, and flies back when closed.
    While it's out, its place on the shelf stays empty.
*/

let busy = false;

function journalIsOpen() {
    return document.body.classList.contains("journal-open");
}


function markLent(bookId) {

    document
        .querySelectorAll(".book-spine.is-lent")
        .forEach((spine) => spine.classList.remove("is-lent"));

    if (bookId) {
        bookcase.spineFor(bookId)?.classList.add("is-lent");
    }

}


async function openBook(bookId, spine = null, { swap = false } = {}) {

    const book =
        getBook(bookId);

    if (!book || busy) {
        return;
    }

    // On phones the journal gets the whole screen.
    if (PHONE.matches) {

        if (spine && !prefersReducedMotion()) {

            spine.classList.add("is-pulling");

            await new Promise((resolve) => window.setTimeout(resolve, 280));

        }

        window.location.href = `journal.html?book=${bookId}`;

        return;

    }

    busy = true;

    try {

        if (book.cover_path) {
            await coverUrls([book.cover_path]);
        }

        const wasOpen =
            journalIsOpen();

        bookcase.select(bookId);

        // Draw the journal first (still invisible) so the cover
        // knows where to land.
        await journal.open(bookId);

        document.getElementById("journalStage").scrollTop = 0;

        if (!wasOpen && !swap && spine) {

            await playReveal({
                spine,
                book,
                target: journal.coverTarget()
            });

        }

        document.body.classList.add("journal-open");

        markLent(bookId);

        setQueryParam("book", bookId);

        if (!wasOpen) {
            document.querySelector("#journal [data-action=close]")?.focus({ preventScroll: true });
        }

    }

    finally {
        busy = false;
    }

}


async function closeBook() {

    if (busy) {
        return;
    }

    busy = true;

    const bookId =
        journal.bookId;

    const book =
        bookId && getBook(bookId);

    const spine =
        bookId && bookcase.spineFor(bookId);

    const from =
        journal.coverTarget()?.getBoundingClientRect();

    document.body.classList.remove("journal-open");

    try {

        if (book && spine) {
            await playReturn({ spine, book, from });
        }

    }

    finally {

        markLent(null);

        journal.close();

        bookcase.select(null);

        setQueryParam("book", null);

        busy = false;

        spine?.focus({ preventScroll: true });

    }

}


/*
    Stepping through books follows the shelves in order.
*/

function shelfOrder() {

    const sort =
        getSettings().default_shelf_sort || "manual";

    return getShelves().flatMap((shelf) => booksOnShelf(shelf.id, sort));

}


/* =========================================================
   DESK NOTES: CURRENTLY READING AND A JOURNAL SNIPPET
========================================================= */

async function renderDeskNotes() {

    const holder =
        document.getElementById("deskNotes");

    const reading =
        getBooks()
            .filter((book) => book.status === "reading")
            .sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0];

    if (reading?.cover_path) {
        await coverUrls([reading.cover_path]);
    }

    let snippet = null;

    try {

        const [quotes, entries] =
            await Promise.all([
                listQuotes(),
                listRecentEntries(1)
            ]);

        snippet =
            quotes[0]
                ? { text: quotes[0].text, book: quotes[0].book, tab: "quotes" }
                : entries[0]
                    ? { text: entries[0].body, book: entries[0].book, tab: entries[0].kind === "thought" ? "thoughts" : "notes" }
                    : null;

    }

    catch (error) {
        console.error(error);
    }

    render(holder, html`

        <article class="paper-note paper-note--reading">

            <h2 class="paper-note__label">
                ${art("motif-star", "paper-note__icon")}
                Currently Reading
            </h2>

            ${reading ? html`
                <button class="current-book" type="button" data-open-book="${reading.id}">
                    ${coverMarkup(reading, { size: "small" })}
                    <span class="current-book__text">
                        <strong>${reading.title}</strong>
                        ${reading.author ? html`<small>by ${reading.author}</small>` : ""}
                        ${reading.page_count ? html`
                            <span class="current-book__progress">
                                <span class="progress-ribbon" aria-hidden="true"><span style="width: ${progressPercent(reading)}%"></span></span>
                                <b>${progressPercent(reading)}%</b>
                            </span>
                        ` : ""}
                    </span>
                </button>
            ` : html`
                <p class="paper-note__empty">Nothing is currently open.</p>
                <a class="text-button" href="library.html">Choose something to read</a>
            `}

            ${art("motif-sprig", "paper-note__sprig")}

        </article>


        <article class="paper-note paper-note--snippets">

            <h2 class="paper-note__label">
                ${art("motif-moon", "paper-note__icon")}
                Journal Snippets
            </h2>

            ${snippet ? html`
                <blockquote class="paper-note__quote handwritten">“${truncate(snippet.text, 150)}”</blockquote>
                <a class="paper-note__more" href="journal.html?book=${snippet.book?.id}&tab=${snippet.tab}" aria-label="Open this in the journal">
                    ${art("ui-chevron-right")}
                </a>
            ` : html`
                <p class="paper-note__empty handwritten">Your first saved quote or note will appear here.</p>
            `}

            ${art("motif-leafvine", "paper-note__vine")}

        </article>

    `);

}


/* =========================================================
   START
========================================================= */

async function start() {

    const { settings } =
        await startApp({ page: "home" });

    const body =
        document.getElementById("bookcaseBody");

    render(body, loader("Dusting the shelves…"));

    renderCrown(document.querySelector("[data-crown-decor]"), settings.theme);

    growIvy(document.getElementById("main"));

    startAmbience(document.getElementById("ambience"));

    journal =
        createJournal(document.getElementById("journal"), {
            mode: "desk",
            onClose: closeBook,
            onOpenEditor: (bookId) => openEditor(bookId)
        });

    bookcase =
        createBookcase(body, {
            onOpenBook: (bookId, spine) => openBook(bookId, spine),
            onAddBook: (shelfId) => openEditor(null, shelfId),
            onAddShelf: () => openShelf(),
            onEditShelf: (shelfId) => openShelf(shelfId)
        });

    try {
        await loadLibrary();
    }

    catch (error) {

        toastError(error, "Your shelves couldn't be loaded. Refresh to try again.");

        return;

    }

    await coverUrls(getBooks().map((book) => book.cover_path));

    bookcase.render();

    renderDeskNotes();

    startDecorations(document.querySelector(".library-room"), settings.theme);


    /* Re-draw whenever the library changes anywhere. */

    events.addEventListener("library-changed", (event) => {

        if (event.detail.reason === "book-created") {
            arrivingBookId = event.detail.bookId;
        }

        bookcase.render();

        if (arrivingBookId) {

            bookcase.spineFor(arrivingBookId)?.classList.add("is-arriving");

            arrivingBookId = null;

        }

        if (journal.bookId) {
            bookcase.select(journal.bookId);
        }

        markLent(journalIsOpen() ? journal.bookId : null);

        renderDeskNotes();

    });

    document.addEventListener("novellow:search", (event) => {
        bookcase.search(event.detail.term);
    });

    document.addEventListener("novellow:appearance", (event) => {

        renderCrown(document.querySelector("[data-crown-decor]"), event.detail.theme.id);

        bookcase.render();

    });

    document.addEventListener("novellow:layout", () => bookcase.render());

    document.getElementById("journal").addEventListener("journal-step", (event) => {

        event.preventDefault();

        const order =
            shelfOrder();

        const index =
            order.findIndex((book) => book.id === journal.bookId);

        const next =
            order[(index + event.detail.step + order.length) % order.length];

        if (next) {
            openBook(next.id, bookcase.spineFor(next.id), { swap: true });
        }

    });

    document.getElementById("deskNotes").addEventListener("click", (event) => {

        const trigger =
            event.target.closest("[data-open-book]");

        if (trigger) {
            openBook(trigger.dataset.openBook, bookcase.spineFor(trigger.dataset.openBook));
        }

    });


    /* Which book to show first. */

    const requested =
        queryParam("book");

    // Clicking the dimmed room around the journal, or Escape,
    // puts the book back.
    document.getElementById("journalStage").addEventListener("click", (event) => {

        if (event.target.id === "journalStage") {
            closeBook();
        }

    });

    document.addEventListener("keydown", (event) => {

        if (event.key === "Escape" && journalIsOpen() && !document.querySelector("dialog[open]")) {
            closeBook();
        }

    });

    // A link to one book (?book=…) opens it straight away.
    if (requested && getBook(requested)) {
        await openBook(requested);
    }

    if (queryParam("add") === "1") {

        setQueryParam("add", null);

        openEditor();

    }

}


start().catch((error) => console.error(error));
