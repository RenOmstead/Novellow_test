/* =========================================================
   NOVELLOW
   JOURNAL PAGE (journal.html)

   journal.html?book=<id>   the full journal for one book
   journal.html             every book's journal, recent
                            entries, and the way to the
                            library-wide quotes and words
========================================================= */

import { startApp } from "../shell/app-shell.js?v=__VERSION__";

import {
    loadLibrary,
    getBooks,
    getBook,
    getShelf,
    fetchBook,
    journalCountsByBook,
    listRecentEntries
} from "../core/store.js?v=__VERSION__";

import { coverUrls } from "../core/covers.js?v=__VERSION__";
import { html, render, queryParam, setQueryParam, formatDate, truncate, plural } from "../core/helpers.js?v=__VERSION__";
import { art, loader, emptyState, toastError } from "../core/ui.js?v=__VERSION__";
import { coverMarkup } from "../books/cover.js?v=__VERSION__";
import { createJournal } from "../journal/journal.js?v=__VERSION__";


const holder =
    document.getElementById("journalPage");


async function openEditor(bookId) {

    try {

        const { openBookEditor } =
            await import("../books/book-editor.js?v=__VERSION__");

        const saved =
            await openBookEditor({ bookId });

        if (bookId && !saved && !getBook(bookId)) {
            window.location.href = "journal.html";
        }

        return saved;

    }

    catch (error) {
        toastError(error);
    }

}


/* =========================================================
   ONE BOOK
========================================================= */

async function showBook(bookId) {

    const book =
        await fetchBook(bookId);

    if (!book) {

        render(holder, emptyState({
            symbol: "ui-alert",
            title: "This journal couldn't be found",
            text: "It may belong to a book that was removed from your shelves.",
            actionLabel: "See all journals",
            href: "journal.html"
        }));

        return;

    }

    document.title = `${book.title} — Journal | Novellow`;

    render(holder, html`
        <div class="page-heading page-heading--journal">
            <div>
                <a class="back-link" href="dashboard.html?book=${book.id}">
                    ${art("ui-chevron-left")}
                    Back to the bookcase
                </a>
                <h1 class="page-heading__title">${book.title}</h1>
                ${book.author ? html`<p class="page-heading__subtitle">by ${book.author}</p>` : ""}
            </div>
            <a class="button button--ghost" href="journal.html">All journals</a>
        </div>
        <div class="journal" id="journal" data-mode="page"></div>
    `);

    const journalElement =
        document.getElementById("journal");

    const journal =
        createJournal(journalElement, {
            mode: "page",
            onClose: () => {
                window.location.href = "journal.html";
            },
            onOpenEditor: (id) => openEditor(id)
        });

    journalElement.addEventListener("journal-tab", (event) => {
        setQueryParam("tab", event.detail.tab);
    });

    // Stepping moves to the next book's journal page.
    journalElement.addEventListener("journal-step", (event) => {

        event.preventDefault();

        const books =
            getBooks();

        const index =
            books.findIndex((item) => item.id === journal.bookId);

        const next =
            books[(index + event.detail.step + books.length) % books.length];

        if (next) {
            window.location.href = `journal.html?book=${next.id}&tab=${journal.tab}`;
        }

    });

    await journal.open(bookId, { tab: queryParam("tab") });

}


/* =========================================================
   ALL JOURNALS
========================================================= */

async function showHub() {

    render(holder, loader("Gathering your journals…"));

    const books =
        getBooks();

    if (!books.length) {

        render(holder, html`
            <div class="page-heading">
                <div>
                    <h1 class="page-heading__title">Journal</h1>
                    <p class="page-heading__subtitle">Every book on your shelves has a journal waiting inside it.</p>
                </div>
            </div>
            ${emptyState({
                symbol: "art-journal",
                title: "Your journals begin with your books.",
                text: "Add a book and its journal is ready straight away.",
                actionLabel: "Add a book",
                action: "add-book"
            })}
        `);

        return;

    }

    const [counts, recent] =
        await Promise.all([
            journalCountsByBook(),
            listRecentEntries(8)
        ]);

    await coverUrls(books.map((book) => book.cover_path));

    const ordered =
        [...books].sort((a, b) => {

            const total = (id) =>
                Object.values(counts[id] || {}).reduce((sum, value) => sum + value, 0);

            return total(b.id) - total(a.id) || b.updated_at.localeCompare(a.updated_at);

        });

    render(holder, html`

        <div class="page-heading">
            <div>
                <h1 class="page-heading__title">Journal</h1>
                <p class="page-heading__subtitle">Every book on your shelves has a journal waiting inside it.</p>
            </div>
            <div class="page-heading__actions">
                <a class="button button--brass" href="quotes.html">${art("tab-quotes")} All quotes</a>
                <a class="button button--brass" href="vocabulary.html">${art("tab-words")} The wordbook</a>
            </div>
        </div>

        ${recent.length ? html`
            <section class="paper hub-recent" aria-labelledby="recentHeading">
                <h2 class="section-title" id="recentHeading">Lately in the margins</h2>
                <ol class="recent-list">
                    ${recent.map((entry) => html`
                        <li>
                            <a class="recent-entry" href="journal.html?book=${entry.book?.id}&tab=${entry.kind === "thought" ? "thoughts" : "notes"}">
                                ${art(entry.kind === "thought" ? "tab-thoughts" : "tab-notes", "recent-entry__art")}
                                <span>
                                    <strong>${entry.title || truncate(entry.body, 70)}</strong>
                                    <small>${entry.book?.title} · ${formatDate(entry.updated_at)}</small>
                                </span>
                            </a>
                        </li>
                    `)}
                </ol>
            </section>
        ` : ""}

        <section aria-labelledby="journalsHeading">

            <h2 class="section-title section-title--light" id="journalsHeading">Journals</h2>

            <ul class="journal-cards">
                ${ordered.map((book) => {

                    const count =
                        counts[book.id] || { journal_entries: 0, quotes: 0, vocabulary: 0 };

                    return html`
                        <li>
                            <a class="journal-card" href="journal.html?book=${book.id}">
                                ${coverMarkup(book, { size: "small" })}
                                <span class="journal-card__text">
                                    <strong>${book.title}</strong>
                                    <small>${book.author || getShelf(book.shelf_id)?.name || ""}</small>
                                    <span class="journal-card__counts">
                                        ${plural(count.journal_entries, "note")} ·
                                        ${plural(count.quotes, "quote")} ·
                                        ${plural(count.vocabulary, "word")}
                                    </span>
                                </span>
                            </a>
                        </li>
                    `;

                })}
            </ul>

        </section>

    `);

}


/* =========================================================
   START
========================================================= */

async function start() {

    await startApp({ page: "journal", eyebrow: "Journal" });

    try {

        await loadLibrary();

        const bookId =
            queryParam("book");

        if (bookId) {
            await showBook(bookId);
        }

        else {
            await showHub();
        }

    }

    catch (error) {

        toastError(error);

        render(holder, emptyState({
            symbol: "ui-alert",
            title: "The journal couldn't be opened",
            text: "Check your connection and try again.",
            actionLabel: "Try again",
            href: window.location.href
        }));

    }

    holder.addEventListener("click", (event) => {

        if (event.target.closest("[data-action=add-book]")) {

            openEditor(null).then((saved) => {

                if (saved && !queryParam("book")) {
                    showHub();
                }

            });

        }

    });

}


start().catch((error) => console.error(error));
