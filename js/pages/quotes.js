/* =========================================================
   NOVELLOW
   QUOTES (quotes.html)

   Every saved line from every book, pinned to the wall.
========================================================= */

import { startApp } from "../shell/app-shell.js?v=__VERSION__";
import { loadLibrary, getBooks, listQuotes, createRow, updateRow, deleteRow } from "../core/store.js?v=__VERSION__";
import { html, render, debounce, plural, queryParam, textOrNull, intOrNull, seededRandom } from "../core/helpers.js?v=__VERSION__";
import { art, loader, emptyState, toast, toastError, confirmDialog, formDialog } from "../core/ui.js?v=__VERSION__";


const content =
    document.getElementById("pageContent");

let quotes = [];

const filters = {
    q: "",
    book: queryParam("book") || ""
};


function quoteForm(quote = {}) {

    const books =
        [...getBooks()].sort((a, b) => a.title.localeCompare(b.title));

    return html`
        ${quote.id ? "" : html`
            <label class="field">
                <span class="field__label">From the book</span>
                <select class="field__input" name="book_id" required>
                    ${books.map((book) => html`<option value="${book.id}" ${book.id === filters.book ? html`selected` : ""}>${book.title}</option>`)}
                </select>
            </label>
        `}
        <label class="field">
            <span class="field__label">The passage</span>
            <textarea class="field__input" name="text" rows="5" maxlength="5000" required>${quote.text || ""}</textarea>
        </label>
        <div class="field-row">
            <label class="field">
                <span class="field__label">Page</span>
                <input class="field__input" type="number" name="page" min="0" value="${quote.page ?? ""}">
            </label>
            <label class="field">
                <span class="field__label">Where</span>
                <input class="field__input" name="location" maxlength="120" value="${quote.location || ""}">
            </label>
        </div>
        <label class="field">
            <span class="field__label">Why it matters <span class="muted">(optional)</span></span>
            <textarea class="field__input field__input--hand" name="comment" rows="2" maxlength="5000">${quote.comment || ""}</textarea>
        </label>
    `;

}


function readQuote(values) {

    return {
        text: String(values.get("text") || "").trim(),
        page: intOrNull(values.get("page")),
        location: textOrNull(values.get("location")),
        comment: textOrNull(values.get("comment"))
    };

}


async function refresh() {

    quotes = await listQuotes();

    renderPage();

}


function renderPage() {

    const hasBooks =
        getBooks().length > 0;

    render(content, html`

        <div class="page-heading">
            <div>
                <a class="back-link" href="journal.html">${art("ui-chevron-left")} Journal</a>
                <h1 class="page-heading__title">Lines I want to remember</h1>
                <p class="page-heading__subtitle">${quotes.length ? `${plural(quotes.length, "quote")} gathered from your books.` : "Every quote you save in a journal gathers here."}</p>
            </div>
            ${hasBooks ? html`
                <div class="page-heading__actions">
                    <button class="button button--brass" type="button" data-action="add">${art("ui-add")} Save a quote</button>
                </div>
            ` : ""}
        </div>

        ${quotes.length ? html`
            <form class="filter-bar paper" id="filters" role="search" aria-label="Filter quotes">
                <label class="field">
                    <span class="field__label">Search</span>
                    <input class="field__input" type="search" name="q" value="${filters.q}" placeholder="A word or phrase…">
                </label>
                <label class="field">
                    <span class="field__label">Book</span>
                    <select class="field__input" name="book">
                        <option value="">Every book</option>
                        ${[...new Map(quotes.map((quote) => [quote.book?.id, quote.book])).values()]
                            .filter(Boolean)
                            .sort((a, b) => a.title.localeCompare(b.title))
                            .map((book) => html`<option value="${book.id}" ${book.id === filters.book ? html`selected` : ""}>${book.title}</option>`)}
                    </select>
                </label>
            </form>
            <div id="results"></div>
        ` : emptyState({
            symbol: "tab-quotes",
            title: "No quotes yet",
            text: hasBooks ? "When a sentence stops you, save it here or in the book's journal." : "Add a book first; its journal is where quotes begin.",
            actionLabel: hasBooks ? "Save a quote" : "Go to the bookcase",
            action: hasBooks ? "add" : "",
            href: hasBooks ? "" : "dashboard.html"
        })}

    `);

    renderResults();

}


function renderResults() {

    const results =
        document.getElementById("results");

    if (!results) {
        return;
    }

    const term =
        filters.q.toLowerCase();

    const shown =
        quotes.filter((quote) =>
            (!filters.book || quote.book?.id === filters.book)
            && (!term || [quote.text, quote.comment, quote.book?.title].some((value) => (value || "").toLowerCase().includes(term)))
        );

    if (!shown.length) {

        render(results, emptyState({ symbol: "ui-search", title: "No quotes match", text: "Try another word or book." }));

        return;

    }

    render(results, html`
        <div class="quote-wall">
            ${shown.map((quote) => {

                const tilt =
                    (seededRandom(quote.id)() - 0.5) * 2.4;

                return html`
                    <figure class="quote-card paper" style="--tilt: ${tilt.toFixed(2)}deg">
                        <blockquote class="quote-card__text">“${quote.text}”</blockquote>
                        ${quote.comment ? html`<p class="quote-card__comment">${quote.comment}</p>` : ""}
                        <figcaption class="quote-card__source">
                            <span>
                                <a href="journal.html?book=${quote.book?.id}&tab=quotes">${quote.book?.title}</a>
                                ${quote.page ? html`<span class="muted"> · p. ${quote.page}</span>` : ""}
                            </span>
                            <span>
                                <button class="icon-button icon-button--small" type="button" data-action="edit" data-id="${quote.id}" aria-label="Edit this quote">${art("ui-pencil")}</button>
                                <button class="icon-button icon-button--small" type="button" data-action="delete" data-id="${quote.id}" aria-label="Delete this quote">${art("ui-trash")}</button>
                            </span>
                        </figcaption>
                    </figure>
                `;

            })}
        </div>
    `);

}


async function start() {

    await startApp({ page: "journal", eyebrow: "Quotes" });

    render(content, loader("Gathering your favourite lines…"));

    try {

        await loadLibrary();

        await refresh();

    }

    catch (error) {

        toastError(error);

        return;

    }

    const apply = debounce(renderResults, 150);

    content.addEventListener("input", (event) => {

        if (event.target.closest("#filters")) {

            filters[event.target.name] = event.target.value;

            apply();

        }

    });

    content.addEventListener("submit", (event) => event.preventDefault());

    content.addEventListener("click", async (event) => {

        const trigger =
            event.target.closest("[data-action]");

        if (!trigger) {
            return;
        }

        const quote =
            quotes.find((item) => item.id === trigger.dataset.id);

        try {

            if (trigger.dataset.action === "add") {

                const saved =
                    await formDialog({
                        eyebrow: "A line to remember",
                        title: "Save a quote",
                        submitLabel: "Save quote",
                        body: quoteForm(),
                        onSubmit: (values) => createRow("quotes", { ...readQuote(values), book_id: values.get("book_id") })
                    });

                if (saved) {
                    toast("Quote saved.", { tone: "success" });
                    await refresh();
                }

            }

            if (trigger.dataset.action === "edit" && quote) {

                const saved =
                    await formDialog({
                        eyebrow: quote.book?.title,
                        title: "Edit quote",
                        body: quoteForm(quote),
                        onSubmit: (values) => updateRow("quotes", quote.id, readQuote(values))
                    });

                if (saved) {
                    await refresh();
                }

            }

            if (trigger.dataset.action === "delete" && quote) {

                const sure =
                    await confirmDialog({
                        title: "Delete this quote?",
                        message: "It will be removed from its book's journal too.",
                        confirmLabel: "Delete",
                        tone: "danger"
                    });

                if (sure) {
                    await deleteRow("quotes", quote.id);
                    await refresh();
                }

            }

        }

        catch (error) {
            toastError(error);
        }

    });

}


start().catch((error) => console.error(error));
