/* =========================================================
   NOVELLOW
   WORDBOOK (vocabulary.html)

   Every unfamiliar word from every book, alphabetised like
   an old dictionary.
========================================================= */

import { startApp } from "../shell/app-shell.js?v=__VERSION__";
import { loadLibrary, getBooks, listVocabulary, createRow, updateRow, deleteRow } from "../core/store.js?v=__VERSION__";
import { html, render, debounce, plural, queryParam, textOrNull, intOrNull } from "../core/helpers.js?v=__VERSION__";
import { art, loader, emptyState, toast, toastError, confirmDialog, formDialog } from "../core/ui.js?v=__VERSION__";


const content =
    document.getElementById("pageContent");

const PARTS_OF_SPEECH =
    ["noun", "verb", "adjective", "adverb", "phrase", "idiom", "other"];

let words = [];

const filters = {
    q: "",
    book: queryParam("book") || ""
};


function wordForm(word = {}) {

    const books =
        [...getBooks()].sort((a, b) => a.title.localeCompare(b.title));

    return html`
        ${word.id ? "" : html`
            <label class="field">
                <span class="field__label">Found in</span>
                <select class="field__input" name="book_id" required>
                    ${books.map((book) => html`<option value="${book.id}" ${book.id === filters.book ? html`selected` : ""}>${book.title}</option>`)}
                </select>
            </label>
        `}
        <div class="field-row">
            <label class="field">
                <span class="field__label">Word</span>
                <input class="field__input" name="word" maxlength="120" required value="${word.word || ""}">
            </label>
            <label class="field">
                <span class="field__label">Part of speech</span>
                <select class="field__input" name="part_of_speech">
                    <option value="">—</option>
                    ${PARTS_OF_SPEECH.map((part) => html`<option ${part === word.part_of_speech ? html`selected` : ""}>${part}</option>`)}
                </select>
            </label>
        </div>
        <label class="field">
            <span class="field__label">Definition</span>
            <textarea class="field__input" name="definition" rows="2" maxlength="2000">${word.definition || ""}</textarea>
        </label>
        <label class="field">
            <span class="field__label">How it was used</span>
            <textarea class="field__input field__input--hand" name="context" rows="2" maxlength="2000">${word.context || ""}</textarea>
        </label>
        <label class="field">
            <span class="field__label">Page</span>
            <input class="field__input" type="number" name="page" min="0" value="${word.page ?? ""}">
        </label>
    `;

}


function readWord(values) {

    return {
        word: String(values.get("word") || "").trim(),
        part_of_speech: textOrNull(values.get("part_of_speech")),
        definition: textOrNull(values.get("definition")),
        context: textOrNull(values.get("context")),
        page: intOrNull(values.get("page"))
    };

}


async function refresh() {

    words = await listVocabulary();

    renderPage();

}


function renderPage() {

    const hasBooks =
        getBooks().length > 0;

    render(content, html`

        <div class="page-heading">
            <div>
                <a class="back-link" href="journal.html">${art("ui-chevron-left")} Journal</a>
                <h1 class="page-heading__title">Little words worth keeping</h1>
                <p class="page-heading__subtitle">${words.length ? `${plural(words.length, "word")} gathered from your reading.` : "Unfamiliar words you keep in any journal are collected here."}</p>
            </div>
            ${hasBooks ? html`
                <div class="page-heading__actions">
                    <button class="button button--brass" type="button" data-action="add">${art("ui-add")} Keep a word</button>
                </div>
            ` : ""}
        </div>

        ${words.length ? html`
            <form class="filter-bar paper" id="filters" role="search" aria-label="Filter words">
                <label class="field">
                    <span class="field__label">Search</span>
                    <input class="field__input" type="search" name="q" value="${filters.q}" placeholder="A word or meaning…">
                </label>
                <label class="field">
                    <span class="field__label">Book</span>
                    <select class="field__input" name="book">
                        <option value="">Every book</option>
                        ${[...new Map(words.map((word) => [word.book?.id, word.book])).values()]
                            .filter(Boolean)
                            .sort((a, b) => a.title.localeCompare(b.title))
                            .map((book) => html`<option value="${book.id}" ${book.id === filters.book ? html`selected` : ""}>${book.title}</option>`)}
                    </select>
                </label>
            </form>
            <div id="results"></div>
        ` : emptyState({
            symbol: "tab-words",
            title: "The wordbook is empty",
            text: hasBooks ? "Found a word you don't know? Keep it here with its meaning." : "Add a book first; its journal is where words are kept.",
            actionLabel: hasBooks ? "Keep a word" : "Go to the bookcase",
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
        words
            .filter((word) =>
                (!filters.book || word.book?.id === filters.book)
                && (!term || [word.word, word.definition, word.context].some((value) => (value || "").toLowerCase().includes(term)))
            )
            .sort((a, b) => a.word.localeCompare(b.word, undefined, { sensitivity: "base" }));

    if (!shown.length) {

        render(results, emptyState({ symbol: "ui-search", title: "No words match", text: "Try another spelling or book." }));

        return;

    }

    const letters =
        new Map();

    shown.forEach((word) => {

        const letter =
            /[a-z]/i.test(word.word[0]) ? word.word[0].toUpperCase() : "#";

        if (!letters.has(letter)) {
            letters.set(letter, []);
        }

        letters.get(letter).push(word);

    });

    render(results, html`
        <article class="wordbook paper">

            <nav class="wordbook-letters" aria-label="Jump to a letter">
                ${[...letters.keys()].map((letter) => html`<a href="#letter-${letter}">${letter}</a>`)}
            </nav>

            ${[...letters.entries()].map(([letter, list]) => html`
                <section class="wordbook-section" id="letter-${letter}" aria-labelledby="heading-${letter}">
                    <h2 class="wordbook-letter" id="heading-${letter}">${letter}</h2>
                    <ul class="word-entries">
                        ${list.map((word) => html`
                            <li class="word-entry">
                                <p class="word-entry__word">
                                    ${word.word}
                                    ${word.part_of_speech ? html`<em>${word.part_of_speech}</em>` : ""}
                                </p>
                                ${word.definition ? html`<p class="word-entry__definition">${word.definition}</p>` : ""}
                                ${word.context ? html`<p class="word-entry__context">“${word.context}”</p>` : ""}
                                <p class="word-entry__book">
                                    from <a href="journal.html?book=${word.book?.id}&tab=words">${word.book?.title}</a>${word.page ? `, p. ${word.page}` : ""}
                                    <button class="icon-button icon-button--small" type="button" data-action="edit" data-id="${word.id}" aria-label="Edit ${word.word}">${art("ui-pencil")}</button>
                                    <button class="icon-button icon-button--small" type="button" data-action="delete" data-id="${word.id}" aria-label="Delete ${word.word}">${art("ui-trash")}</button>
                                </p>
                            </li>
                        `)}
                    </ul>
                </section>
            `)}

        </article>
    `);

}


async function start() {

    await startApp({ page: "journal", eyebrow: "Wordbook" });

    render(content, loader("Opening the wordbook…"));

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

        const word =
            words.find((item) => item.id === trigger.dataset.id);

        try {

            if (trigger.dataset.action === "add") {

                const saved =
                    await formDialog({
                        eyebrow: "A word worth keeping",
                        title: "Keep a word",
                        submitLabel: "Keep word",
                        body: wordForm(),
                        onSubmit: (values) => createRow("vocabulary", { ...readWord(values), book_id: values.get("book_id") })
                    });

                if (saved) {
                    toast("Word kept.", { tone: "success" });
                    await refresh();
                }

            }

            if (trigger.dataset.action === "edit" && word) {

                const saved =
                    await formDialog({
                        eyebrow: word.book?.title,
                        title: `Edit “${word.word}”`,
                        body: wordForm(word),
                        onSubmit: (values) => updateRow("vocabulary", word.id, readWord(values))
                    });

                if (saved) {
                    await refresh();
                }

            }

            if (trigger.dataset.action === "delete" && word) {

                const sure =
                    await confirmDialog({
                        title: `Delete “${word.word}”?`,
                        message: "It will be removed from its book's journal too.",
                        confirmLabel: "Delete",
                        tone: "danger"
                    });

                if (sure) {
                    await deleteRow("vocabulary", word.id);
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
