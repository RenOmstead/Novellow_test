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
import { playReveal } from "../books/book-reveal.js?v=__VERSION__";
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

async function openBook(bookId, spine = null) {

    const book =
        getBook(bookId);

    if (!book) {
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

    if (book.cover_path) {
        await coverUrls([book.cover_path]);
    }

    shutJournal(false);

    bookcase.select(bookId);

    const journalElement =
        document.getElementById("journal");

    // In the stacked tablet layout, bring the journal into view first.
    if (journalElement.getBoundingClientRect().top > window.innerHeight * 0.6) {

        journalElement.scrollIntoView({
            behavior: prefersReducedMotion() ? "auto" : "smooth",
            block: "center"
        });

        await new Promise((resolve) => window.setTimeout(resolve, 450));

    }

    if (spine) {

        await playReveal({
            spine,
            book,
            target: journal.coverTarget()
        });

    }

    await journal.open(bookId);

    setQueryParam("book", bookId);

}


function closeBook() {

    lastBookId = journal.bookId || lastBookId;

    journal.close();

    bookcase.select(null);

    setQueryParam("book", null);

    // With books on the shelves, closing shuts the journal away
    // completely so the whole room shows.
    if (getBooks().length) {

        shutJournal(true);

        document.getElementById("journalReopen")?.focus();

    }

}


/*
    The shut journal: hidden, with a closed book left in its
    place to open it again. Remembered on this device.
*/

const SHUT_KEY =
    "novellow-journal-shut";

let lastBookId = null;

function shutJournal(shut) {

    document.querySelector(".library-room")?.classList.toggle("journal-shut", shut);

    const reopen =
        document.getElementById("journalReopen");

    if (reopen) {
        reopen.hidden = !shut;
    }

    try {

        if (shut) {
            localStorage.setItem(SHUT_KEY, "1");
        }

        else {
            localStorage.removeItem(SHUT_KEY);
        }

    }

    catch {
        // Private browsing: it simply isn't remembered.
    }

}


function wasShut() {

    try {
        return localStorage.getItem(SHUT_KEY) === "1";
    }

    catch {
        return false;
    }

}


function reopenJournal() {

    const book =
        (lastBookId && getBook(lastBookId))
        || getBooks()
            .filter((item) => item.status === "reading")
            .sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0]
        || getBooks()[0];

    shutJournal(false);

    if (book) {
        openBook(book.id);
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

        <article class="paper-note">

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


        <article class="paper-note">

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
            openBook(next.id, bookcase.spineFor(next.id));
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

    const firstBook =
        (requested && getBook(requested))
        || getBooks()
            .filter((book) => book.status === "reading")
            .sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0];

    document.getElementById("journalReopen").addEventListener("click", reopenJournal);

    if (!requested && wasShut() && getBooks().length) {

        lastBookId = firstBook?.id || null;

        shutJournal(true);

    }

    else if (firstBook && !PHONE.matches) {

        if (firstBook.cover_path) {
            await coverUrls([firstBook.cover_path]);
        }

        bookcase.select(firstBook.id);

        await journal.open(firstBook.id);

    }

    if (queryParam("add") === "1") {

        setQueryParam("add", null);

        openEditor();

    }

}


start().catch((error) => console.error(error));
