/* =========================================================
   NOVELLOW
   READING NOW (reading.html)

   Every book marked Currently Reading, the most recent one
   featured, each with its progress and a quick update.
========================================================= */

import { startApp } from "../shell/app-shell.js?v=__VERSION__";

import {
    loadLibrary,
    getBooks,
    getBook,
    updateBook,
    logProgress,
    events
} from "../core/store.js?v=__VERSION__";

import { coverUrls } from "../core/covers.js?v=__VERSION__";
import { html, render, formatDate, todayIso, intOrNull, progressPercent, plural } from "../core/helpers.js?v=__VERSION__";
import { art, loader, emptyState, toast, toastError, confirmDialog, withBusy } from "../core/ui.js?v=__VERSION__";
import { coverMarkup } from "../books/cover.js?v=__VERSION__";


const content =
    document.getElementById("pageContent");


function progressBlock(book, large = false) {

    const percent =
        progressPercent(book);

    return html`
        <div class="progress-large">

            <div class="progress-large__label">
                <span>${book.page_count ? `Page ${book.current_page || 0} of ${book.page_count}` : `On page ${book.current_page || 0}`}</span>
                ${book.page_count ? html`<strong>${percent}%</strong>` : ""}
            </div>

            ${book.page_count ? html`
                <div class="progress-ribbon" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}" aria-label="Progress in ${book.title}">
                    <span style="width: ${percent}%"></span>
                </div>
            ` : ""}

            <form class="progress-update" data-progress="${book.id}">
                <label class="field">
                    <span class="field__label">I'm on page</span>
                    <input class="field__input" type="number" name="page" min="0" ${book.page_count ? html`max="${book.page_count}"` : ""} value="${book.current_page || 0}" required>
                </label>
                <button class="button ${large ? "button--primary" : "button--ghost button--small"}" type="submit">Update progress</button>
            </form>

        </div>
    `;

}


function renderPage() {

    const reading =
        getBooks()
            .filter((book) => book.status === "reading")
            .sort((a, b) => b.updated_at.localeCompare(a.updated_at));

    const paused =
        getBooks().filter((book) => book.status === "paused");

    const [featured, ...others] =
        reading;

    render(content, html`

        <div class="page-heading">
            <div>
                <h1 class="page-heading__title">Reading Now</h1>
                <p class="page-heading__subtitle">
                    ${reading.length
                        ? `${plural(reading.length, "book")} open on the reading table.`
                        : "The reading table is clear."}
                </p>
            </div>
        </div>

        ${featured ? html`

            <article class="reading-featured paper">

                ${coverMarkup(featured, { size: "large" })}

                <div class="reading-featured__body">

                    <p class="eyebrow">Open on the table</p>

                    <h2 class="reading-featured__title">${featured.title}</h2>

                    ${featured.author ? html`<p class="reading-featured__author">by ${featured.author}</p>` : ""}

                    <p class="reading-facts">
                        ${featured.date_started ? html`<span>Started ${formatDate(featured.date_started)}</span>` : ""}
                        ${featured.genre ? html`<span>${featured.genre}</span>` : ""}
                        ${featured.page_count ? html`<span>${featured.page_count} pages</span>` : ""}
                    </p>

                    ${progressBlock(featured, true)}

                    <div class="reading-actions">
                        <a class="button button--brass" href="journal.html?book=${featured.id}">${art("ui-open-book")} Open journal</a>
                        <button class="button button--ghost" type="button" data-finish="${featured.id}">Mark as finished</button>
                    </div>

                </div>

            </article>

        ` : emptyState({
            symbol: "art-reading",
            title: "Nothing is currently open.",
            text: "Pick something from your To Be Read shelf, or mark a book as Currently Reading.",
            actionLabel: "Browse To Be Read",
            href: "library.html?status=want_to_read"
        })}

        ${others.length ? html`
            <h2 class="section-title section-title--light" style="margin-top: 26px">Also reading</h2>
            <ul class="reading-list">
                ${others.map((book) => html`
                    <li>
                        <article class="reading-card paper">
                            ${coverMarkup(book, { size: "small" })}
                            <div class="reading-card__body">
                                <h3 class="catalogue-card__title"><a href="journal.html?book=${book.id}">${book.title}</a></h3>
                                ${book.author ? html`<p class="catalogue-card__author">${book.author}</p>` : ""}
                                ${book.date_started ? html`<p class="reading-facts">Started ${formatDate(book.date_started)}</p>` : ""}
                                ${progressBlock(book)}
                                <div class="reading-actions">
                                    <a class="text-button" href="journal.html?book=${book.id}">Open journal</a>
                                    <button class="text-button" type="button" data-finish="${book.id}">Mark as finished</button>
                                </div>
                            </div>
                        </article>
                    </li>
                `)}
            </ul>
        ` : ""}

        ${paused.length ? html`
            <h2 class="section-title section-title--light" style="margin-top: 26px">Resting for now</h2>
            <ul class="reading-list">
                ${paused.map((book) => html`
                    <li>
                        <article class="reading-card paper">
                            ${coverMarkup(book, { size: "small" })}
                            <div class="reading-card__body">
                                <h3 class="catalogue-card__title"><a href="journal.html?book=${book.id}">${book.title}</a></h3>
                                ${book.author ? html`<p class="catalogue-card__author">${book.author}</p>` : ""}
                                <p class="reading-facts">Paused on page ${book.current_page || 0}</p>
                                <button class="button button--ghost button--small" type="button" data-resume="${book.id}">Pick it back up</button>
                            </div>
                        </article>
                    </li>
                `)}
            </ul>
        ` : ""}

    `);

}


/* =========================================================
   ACTIONS
========================================================= */

async function finishBook(bookId, { asked = false } = {}) {

    const book =
        getBook(bookId);

    if (!asked) {

        const sure =
            await confirmDialog({
                title: `Finished “${book.title}”?`,
                message: "It will be marked as finished today.",
                confirmLabel: "Mark as finished",
                cancelLabel: "Not yet"
            });

        if (!sure) {
            return;
        }

    }

    try {

        await updateBook(book.id, {
            status: "finished",
            date_finished: book.date_finished || todayIso(),
            times_read: Math.max(1, book.times_read || 0),
            current_page: book.page_count || book.current_page
        });

        toast(`“${book.title}” is finished. Why not write its review?`, { tone: "success" });

    }

    catch (error) {
        toastError(error);
    }

}


async function saveProgress(form) {

    const book =
        getBook(form.dataset.progress);

    const page =
        intOrNull(form.elements.page.value);

    if (page === null || page < 0 || (book.page_count && page > book.page_count)) {

        form.elements.page.setAttribute("aria-invalid", "true");

        toast(book.page_count ? `Choose a page between 0 and ${book.page_count}.` : "Choose a page number.", { tone: "error" });

        return;

    }

    await withBusy(form.querySelector("[type=submit]"), "Saving…", async () => {

        try {

            await logProgress(book, page);

            if (book.page_count && page >= book.page_count) {

                const finish =
                    await confirmDialog({
                        title: "You reached the last page!",
                        message: `Mark “${book.title}” as finished today?`,
                        confirmLabel: "Mark as finished",
                        cancelLabel: "Not yet"
                    });

                if (finish) {
                    await finishBook(book.id, { asked: true });
                }

            }

            else {
                toast("Progress saved.", { tone: "success", timeout: 2200 });
            }

        }

        catch (error) {
            toastError(error);
        }

    });

}


/* =========================================================
   START
========================================================= */

async function start() {

    await startApp({ page: "reading", eyebrow: "Reading Now" });

    render(content, loader("Finding your bookmarks…"));

    try {

        await loadLibrary();

        await coverUrls(getBooks().map((book) => book.cover_path));

    }

    catch (error) {

        toastError(error);

        return;

    }

    renderPage();

    events.addEventListener("library-changed", async () => {

        await coverUrls(getBooks().map((book) => book.cover_path));

        renderPage();

    });

    content.addEventListener("submit", (event) => {

        const form =
            event.target.closest("[data-progress]");

        if (form) {
            event.preventDefault();
            saveProgress(form);
        }

    });

    content.addEventListener("click", async (event) => {

        const finish =
            event.target.closest("[data-finish]");

        if (finish) {
            finishBook(finish.dataset.finish);
        }

        const resume =
            event.target.closest("[data-resume]");

        if (resume) {

            try {

                await updateBook(resume.dataset.resume, { status: "reading" });

                toast("Back on the reading table.", { tone: "success" });

            }

            catch (error) {
                toastError(error);
            }

        }

    });

}


start().catch((error) => console.error(error));
