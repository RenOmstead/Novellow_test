/* =========================================================
   NOVELLOW
   THE BOOK JOURNAL

   Every book has a journal automatically. It opens like a
   real book: the first page shows the cover and the star
   rating, the facing page holds whichever section's ribbon
   is chosen.

   Modes:
     "desk"  the journal on the dashboard beside the bookcase
     "page"  journal.html, a full spread with more room
========================================================= */

import {
    getBook,
    fetchBook,
    getBooks,
    getShelf,
    updateBook,
    logProgress,
    listForBook,
    createRow,
    updateRow,
    deleteRow,
    getReview,
    saveReview,
    countsForBook,
    events
} from "../core/store.js?v=__VERSION__";

import { coverUrls } from "../core/covers.js?v=__VERSION__";

import {
    html,
    render,
    formatDate,
    todayIso,
    intOrNull,
    textOrNull,
    plural,
    progressPercent,
    statusLabel,
    wait,
    prefersReducedMotion
} from "../core/helpers.js?v=__VERSION__";

import { art, loader, toast, toastError, confirmDialog, formDialog, withBusy } from "../core/ui.js?v=__VERSION__";
import { friendlyDataError } from "../core/errors.js?v=__VERSION__";
import { ratingMarkup, wireRatings } from "../core/rating.js?v=__VERSION__";
import { READING_STATUSES } from "../config.js?v=__VERSION__";
import { coverMarkup } from "../books/cover.js?v=__VERSION__";

import {
    SECTIONS,
    LIST_SECTIONS,
    SECTION_KINDS,
    sectionById,
    flattenSections,
    chapterOptions
} from "./sections.js?v=__VERSION__";


export function createJournal(root, { mode = "desk", onClose, onOpenEditor } = {}) {

    const state = {
        bookId: null,
        tab: "overview",
        chapterFilter: "all",
        adding: false,
        editingId: null,
        progressOpen: false,
        cache: new Map()
    };


    /* =====================================================
       DATA
    ===================================================== */

    const book = () => getBook(state.bookId);

    const cacheKey = (table) => `${state.bookId}:${table}`;

    async function rowsFor(table) {

        const key =
            cacheKey(table);

        if (!state.cache.has(key)) {
            state.cache.set(key, await listForBook(table, state.bookId));
        }

        return state.cache.get(key);

    }

    function forget(table) {
        state.cache.delete(cacheKey(table));
    }

    async function chapters() {
        return flattenSections(await rowsFor("book_sections"));
    }


    /* =====================================================
       FRAME
    ===================================================== */

    function renderEmpty() {

        state.bookId = null;

        root.dataset.state = "empty";

        render(root, html`
            <div class="journal-book journal-book--closed">
                <div class="journal-page journal-page--left journal-page--blank">
                    ${art("brand-crest", "journal-blank__crest")}
                </div>
                <div class="journal-page journal-page--right journal-page--blank">
                    <div class="journal-blank">
                        <p class="eyebrow">Reading journal</p>
                        <h2>Your journals begin with your books.</h2>
                        <p>Choose a book from your shelves and it opens here, with room for notes, quotes, words and your review.</p>
                        ${getBooks().length ? "" : html`
                            <button class="button button--primary" type="button" data-action="new-book">
                                ${art("ui-add")}
                                Add a book
                            </button>
                        `}
                    </div>
                </div>
                <div class="journal-spine" aria-hidden="true"></div>
            </div>
        `);

    }


    function renderFrame() {

        const current =
            book();

        root.dataset.state = "open";

        render(root, html`
            <div class="journal-book" data-journal-book>

                <div class="journal-tabs" role="toolbar" aria-label="Journal">
                    <button class="journal-tab" type="button" data-action="step" data-step="-1" aria-label="Previous book">
                        ${art("ui-chevron-left", "journal-tab__icon")}
                    </button>
                    <button class="journal-tab" type="button" data-action="edit-book">
                        ${art("ui-pencil", "journal-tab__icon")}
                        Edit book
                    </button>
                    ${mode === "desk" ? html`
                        <a class="journal-tab" href="journal.html?book=${current.id}&tab=${state.tab}">
                            ${art("ui-open-book", "journal-tab__icon")}
                            Full journal
                        </a>
                    ` : ""}
                    <button class="journal-tab" type="button" data-action="step" data-step="1" aria-label="Next book">
                        ${art("ui-chevron-right", "journal-tab__icon")}
                    </button>
                </div>

                ${mode === "desk" ? html`
                    <button class="journal-close" type="button" data-action="close" aria-label="Close the journal">
                        ${art("ui-close", "journal-close__icon")}
                    </button>
                ` : ""}

                <article class="journal-page journal-page--left" data-left-page aria-label="About this book"></article>

                <article class="journal-page journal-page--right" data-right-page aria-live="polite"></article>

                <nav class="journal-ribbons" aria-label="Journal sections">
                    ${SECTIONS.map((section) => html`
                        <button
                            class="journal-ribbon journal-ribbon--${section.color} ${section.id === state.tab ? "is-active" : ""}"
                            type="button"
                            data-tab="${section.id}"
                            aria-current="${section.id === state.tab ? "page" : "false"}"
                            title="${section.label}"
                        >
                            ${art(section.art, "journal-ribbon__art")}
                            <span class="journal-ribbon__label">${section.label}</span>
                        </button>
                    `)}
                </nav>

                <div class="journal-spine" aria-hidden="true"></div>

            </div>
        `);

        renderLeft();
        renderRight();

    }


    /* =====================================================
       FIRST PAGE: COVER, RATING, STATUS, PROGRESS
    ===================================================== */

    function renderLeft() {

        const page =
            root.querySelector("[data-left-page]");

        const current =
            book();

        if (!page || !current) {
            return;
        }

        const percent =
            progressPercent(current);

        render(page, html`
            <div class="first-page">

                <div class="first-page__cover" data-journal-cover>
                    ${coverMarkup(current, { size: "large" })}
                    <button
                        class="first-page__favorite"
                        type="button"
                        data-action="toggle-favorite"
                        aria-pressed="${String(Boolean(current.is_favorite))}"
                        aria-label="${current.is_favorite ? "Remove from favourites" : "Mark as a favourite"}"
                    >
                        ${art(current.is_favorite ? "ui-heart" : "ui-heart-empty")}
                    </button>
                </div>

                <h2 class="first-page__title">${current.title}</h2>

                ${current.author ? html`<p class="first-page__author">by ${current.author}</p>` : ""}

                <div class="first-page__rating">
                    ${ratingMarkup(current.rating, { name: "rating", label: `Your rating for ${current.title}` })}
                </div>

                <label class="first-page__status">
                    <span class="visually-hidden">Reading status</span>
                    <select class="field__input field__input--pill" data-field="status">
                        ${READING_STATUSES.map((status) => html`
                            <option value="${status.id}" ${status.id === current.status ? html`selected` : ""}>${status.label}</option>
                        `)}
                    </select>
                </label>

                <div class="first-page__progress">

                    ${current.page_count ? html`
                        <p>
                            Page ${current.current_page || 0} of ${current.page_count}
                            <span class="muted">· ${percent}%</span>
                        </p>
                        <div class="progress-ribbon" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}" aria-label="Reading progress">
                            <span style="width: ${percent}%"></span>
                        </div>
                    ` : html`
                        <p class="muted">${current.current_page ? `On page ${current.current_page}` : "Add a page count to track progress."}</p>
                    `}

                    ${state.progressOpen ? html`
                        <form class="progress-form" data-form="progress">
                            <label class="field">
                                <span class="field__label">I'm on page</span>
                                <input class="field__input" type="number" name="current_page" min="0" ${current.page_count ? html`max="${current.page_count}"` : ""} value="${current.current_page || 0}" required>
                            </label>
                            <div class="progress-form__actions">
                                <button class="button button--ghost button--small" type="button" data-action="progress-cancel">Cancel</button>
                                <button class="button button--primary button--small" type="submit">Save</button>
                            </div>
                        </form>
                    ` : html`
                        <button class="text-button" type="button" data-action="progress-open">Update progress</button>
                    `}

                </div>

                <p class="first-page__dates">
                    ${[
                        current.date_started ? `Started ${formatDate(current.date_started)}` : "",
                        current.date_finished ? `Finished ${formatDate(current.date_finished)}` : ""
                    ].filter(Boolean).join(" · ")}
                </p>

            </div>
        `);

        wireRatings(page);

    }


    /* =====================================================
       FACING PAGE: THE CHOSEN SECTION
    ===================================================== */

    async function renderRight({ turn = false } = {}) {

        const page =
            root.querySelector("[data-right-page]");

        if (!page || !book()) {
            return;
        }

        const section =
            sectionById(state.tab);

        if (turn && !prefersReducedMotion()) {

            page.classList.remove("is-turning");

            void page.offsetWidth;

            page.classList.add("is-turning");

        }

        render(page, html`
            <header class="section-head">
                ${art(section.art, "section-head__art")}
                <div>
                    <p class="eyebrow">${section.label}</p>
                    <h3>${section.heading}</h3>
                </div>
            </header>
            <div class="section-body" data-section-body>${loader("Turning pages…")}</div>
        `);

        const body =
            page.querySelector("[data-section-body]");

        const bookId =
            state.bookId;

        try {

            let content;

            if (section.id === "overview") {
                content = await overviewMarkup();
            }

            else if (section.id === "review") {
                content = await reviewMarkup();
            }

            else {
                content = await listMarkup(section.id);
            }

            // Ignore results for a book that has since been closed.
            if (bookId !== state.bookId || section.id !== state.tab) {
                return;
            }

            render(body, content);

            wireRatings(body);

            body.querySelector("[data-autofocus]")?.focus();

        }

        catch (error) {

            console.error(error);

            render(body, html`
                <p class="form-error">${friendlyDataError(error, "This page couldn't be read just now.")}</p>
                <button class="button button--ghost button--small" type="button" data-action="retry">Try again</button>
            `);

        }

    }


    /* ---------------------------------------------------------
       OVERVIEW
    --------------------------------------------------------- */

    async function overviewMarkup() {

        const current =
            book();

        const [counts, flat] =
            await Promise.all([
                countsForBook(current.id),
                chapters()
            ]);

        const facts = [
            ["Author", current.author],
            ["Genre", current.genre],
            ["Published", current.publication_year],
            ["Pages", current.page_count],
            ["ISBN", current.isbn],
            ["Series", current.series ? `${current.series}${current.series_number ? ` #${current.series_number}` : ""}` : ""],
            ["Shelf", getShelf(current.shelf_id)?.name],
            ["Status", statusLabel(current.status)],
            ["Times read", current.times_read || ""],
            ["Added", formatDate(current.created_at)]
        ].filter(([, value]) => value !== null && value !== undefined && value !== "");

        return html`
            <dl class="fact-list">
                ${facts.map(([label, value]) => html`
                    <div><dt>${label}</dt><dd>${value}</dd></div>
                `)}
            </dl>

            <ul class="count-seals" aria-label="In this journal">
                <li>${art("tab-notes")}<strong>${counts.journal_entries}</strong> notes &amp; thoughts</li>
                <li>${art("tab-quotes")}<strong>${counts.quotes}</strong> quotes</li>
                <li>${art("tab-words")}<strong>${counts.vocabulary}</strong> words</li>
                <li>${art("tab-questions")}<strong>${counts.questions}</strong> questions</li>
                <li>${art("tab-characters")}<strong>${counts.characters}</strong> characters</li>
                <li>${art("tab-themes")}<strong>${counts.book_themes}</strong> themes</li>
            </ul>

            <section class="chapter-manager" aria-labelledby="chapterHeading">

                <h4 id="chapterHeading">Parts &amp; chapters</h4>

                <p class="field__hint">Divide the book so notes, quotes, words and questions can belong to a chapter.</p>

                ${flat.length ? html`
                    <ol class="chapter-list">
                        ${flat.map((section, index) => html`
                            <li class="chapter-list__item" style="--depth: ${section.depth}">
                                <span class="chapter-list__kind">${SECTION_KINDS.find((kind) => kind.id === section.kind)?.label}</span>
                                <span class="chapter-list__title">${section.title}</span>
                                <span class="chapter-list__actions">
                                    <button class="icon-button icon-button--small" type="button" data-action="section-move" data-id="${section.id}" data-step="-1" aria-label="Move ${section.title} up" ${index === 0 ? html`disabled` : ""}>${art("ui-chevron-left", "rotate-90")}</button>
                                    <button class="icon-button icon-button--small" type="button" data-action="section-move" data-id="${section.id}" data-step="1" aria-label="Move ${section.title} down">${art("ui-chevron-right", "rotate-90")}</button>
                                    <button class="icon-button icon-button--small" type="button" data-action="section-rename" data-id="${section.id}" aria-label="Rename ${section.title}">${art("ui-pencil")}</button>
                                    <button class="icon-button icon-button--small" type="button" data-action="section-delete" data-id="${section.id}" aria-label="Delete ${section.title}">${art("ui-trash")}</button>
                                </span>
                            </li>
                        `)}
                    </ol>
                ` : ""}

                <form class="chapter-add" data-form="section">
                    <div class="field-row">
                        <label class="field">
                            <span class="field__label">Add a</span>
                            <select class="field__input" name="kind">
                                ${SECTION_KINDS.map((kind) => html`<option value="${kind.id}" ${kind.id === "chapter" ? html`selected` : ""}>${kind.label}</option>`)}
                            </select>
                        </label>
                        <label class="field">
                            <span class="field__label">Called</span>
                            <input class="field__input" name="title" maxlength="120" required placeholder="Chapter 1">
                        </label>
                    </div>
                    ${flat.length ? html`
                        <label class="field">
                            <span class="field__label">Inside</span>
                            <select class="field__input" name="parent_id">
                                <option value="">The whole book</option>
                                ${flat.map((section) => html`<option value="${section.id}">${" ".repeat(section.depth)}${section.title}</option>`)}
                            </select>
                        </label>
                    ` : ""}
                    <button class="button button--ghost button--small" type="submit">${art("ui-add")} Add</button>
                </form>

                <form class="chapter-add chapter-add--bulk" data-form="bulk-chapters">
                    <p class="field__label">Or number a run of chapters</p>
                    <div class="field-row">
                        <label class="field">
                            <span class="field__label">From</span>
                            <input class="field__input" type="number" name="from" min="1" value="1" required>
                        </label>
                        <label class="field">
                            <span class="field__label">To</span>
                            <input class="field__input" type="number" name="to" min="1" max="300" value="${Math.max(10, flat.length)}" required>
                        </label>
                    </div>
                    ${flat.length ? html`
                        <label class="field">
                            <span class="field__label">Inside</span>
                            <select class="field__input" name="parent_id">
                                <option value="">The whole book</option>
                                ${flat.filter((section) => section.kind !== "chapter").map((section) => html`<option value="${section.id}">${section.title}</option>`)}
                            </select>
                        </label>
                    ` : ""}
                    <button class="button button--ghost button--small" type="submit">${art("ui-add")} Add chapters</button>
                </form>

            </section>
        `;

    }


    /* ---------------------------------------------------------
       LIST SECTIONS
    --------------------------------------------------------- */

    async function listMarkup(tab) {

        const config =
            LIST_SECTIONS[tab];

        const [allRows, flat] =
            await Promise.all([
                rowsFor(config.table),
                config.chapters ? chapters() : Promise.resolve([])
            ]);

        const rows =
            allRows.filter((row) =>
                Object.entries(config.match || {}).every(([key, value]) => row[key] === value)
            );

        const byId =
            new Map(flat.map((section) => [section.id, section]));

        const visible =
            config.chapters && state.chapterFilter !== "all"
                ? rows.filter((row) => (row.section_id || "") === state.chapterFilter)
                : rows;

        // In "all chapters", group entries under their chapter in reading order.
        const groups = [];

        if (config.chapters && state.chapterFilter === "all" && flat.length) {

            const whole =
                visible.filter((row) => !row.section_id);

            if (whole.length) {
                groups.push({ title: "Whole book", rows: whole });
            }

            flat.forEach((section) => {

                const inSection =
                    visible.filter((row) => row.section_id === section.id);

                if (inSection.length) {
                    groups.push({ title: section.path, rows: inSection });
                }

            });

        }

        else {
            groups.push({ title: "", rows: visible });
        }

        return html`
            <div class="section-toolbar">

                ${config.chapters && flat.length ? html`
                    <label class="field section-toolbar__filter">
                        <span class="visually-hidden">Show entries from</span>
                        <select class="field__input field__input--pill" data-action="chapter-filter">
                            ${chapterOptions(flat, state.chapterFilter, { includeAll: true })}
                        </select>
                    </label>
                ` : ""}

                ${state.adding ? "" : html`
                    <button class="button button--primary button--small" type="button" data-action="add">
                        ${art("ui-add")}
                        ${config.addLabel}
                    </button>
                `}

            </div>

            ${state.adding ? entryForm(config, null, flat) : ""}

            ${rows.length ? html`
                ${groups.map((group) => html`
                    ${group.title ? html`<h4 class="entry-group">${group.title}</h4>` : ""}
                    <ol class="entry-list">
                        ${group.rows.map((row) => html`
                            <li class="entry" data-id="${row.id}">
                                ${state.editingId === row.id
                                    ? entryForm(config, row, flat)
                                    : html`
                                        <div class="entry__content">${config.item(row, byId.get(row.section_id)?.path || "")}</div>
                                        <div class="entry__actions">
                                            <button class="icon-button icon-button--small" type="button" data-action="edit" data-id="${row.id}" aria-label="Edit this ${config.noun}">${art("ui-pencil")}</button>
                                            <button class="icon-button icon-button--small" type="button" data-action="delete" data-id="${row.id}" aria-label="Delete this ${config.noun}">${art("ui-trash")}</button>
                                        </div>
                                    `}
                            </li>
                        `)}
                    </ol>
                `)}
                ${!visible.length ? html`<p class="section-empty">Nothing from this chapter yet.</p>` : ""}
            ` : state.adding ? "" : html`
                <p class="section-empty handwritten">${config.empty}</p>
            `}
        `;

    }


    function entryForm(config, row, flat) {

        const value = (name) => row?.[name] ?? "";

        const defaultChapter =
            !row && state.chapterFilter !== "all" ? state.chapterFilter : value("section_id");

        return html`
            <form class="entry-form" data-form="entry" data-id="${row?.id || ""}" novalidate>

                ${config.fields.map((fieldConfig, index) => {

                    const auto = index === 0 ? html`data-autofocus` : "";

                    if (fieldConfig.type === "chapter") {

                        if (!flat.length) {
                            return "";
                        }

                        return html`
                            <label class="field">
                                <span class="field__label">${fieldConfig.label}</span>
                                <select class="field__input" name="section_id">
                                    ${chapterOptions(flat, defaultChapter)}
                                </select>
                            </label>
                        `;

                    }

                    if (fieldConfig.type === "checkbox") {

                        return html`
                            <label class="check">
                                <input type="checkbox" name="${fieldConfig.name}" ${value(fieldConfig.name) ? html`checked` : ""}>
                                ${fieldConfig.label}
                            </label>
                        `;

                    }

                    if (fieldConfig.type === "select") {

                        return html`
                            <label class="field">
                                <span class="field__label">${fieldConfig.label}</span>
                                <select class="field__input" name="${fieldConfig.name}" ${auto}>
                                    <option value="">—</option>
                                    ${fieldConfig.options.map((option) => html`<option value="${option}" ${option === value(fieldConfig.name) ? html`selected` : ""}>${option}</option>`)}
                                </select>
                            </label>
                        `;

                    }

                    if (fieldConfig.type === "textarea") {

                        return html`
                            <label class="field">
                                <span class="field__label">${fieldConfig.label}${fieldConfig.optional ? html` <span class="muted">(optional)</span>` : ""}</span>
                                <textarea
                                    class="field__input ${fieldConfig.hand ? "field__input--hand" : ""}"
                                    name="${fieldConfig.name}"
                                    rows="${fieldConfig.required ? 4 : 2}"
                                    maxlength="${fieldConfig.max || 5000}"
                                    ${fieldConfig.required ? html`required` : ""}
                                    ${auto}
                                >${value(fieldConfig.name)}</textarea>
                            </label>
                        `;

                    }

                    return html`
                        <label class="field">
                            <span class="field__label">${fieldConfig.label}${fieldConfig.optional ? html` <span class="muted">(optional)</span>` : ""}</span>
                            <input
                                class="field__input"
                                name="${fieldConfig.name}"
                                type="${fieldConfig.type === "number" ? "number" : "text"}"
                                ${fieldConfig.type === "number" ? html`min="0" inputmode="numeric"` : ""}
                                maxlength="${fieldConfig.max || 200}"
                                placeholder="${fieldConfig.placeholder || ""}"
                                value="${value(fieldConfig.name)}"
                                ${fieldConfig.required ? html`required` : ""}
                                ${auto}
                            >
                        </label>
                    `;

                })}

                <p class="form-error" role="alert" hidden></p>

                <div class="entry-form__actions">
                    <button class="button button--ghost button--small" type="button" data-action="cancel-entry">Cancel</button>
                    <button class="button button--primary button--small" type="submit">Save</button>
                </div>

            </form>
        `;

    }


    /* ---------------------------------------------------------
       REVIEW
    --------------------------------------------------------- */

    async function reviewMarkup() {

        const current =
            book();

        const review =
            (await getReview(current.id)) || {};

        const reread =
            review.would_reread === true ? "yes" : review.would_reread === false ? "no" : "";

        return html`
            <form class="review-form" data-form="review">

                <div class="field">
                    <span class="field__label">My rating</span>
                    ${ratingMarkup(current.rating, { name: "rating", label: "Final rating" })}
                </div>

                <div class="field-row">
                    <label class="field">
                        <span class="field__label">Finished on</span>
                        <input class="field__input" type="date" name="date_finished" value="${current.date_finished || ""}">
                    </label>
                    <label class="field">
                        <span class="field__label">Would I reread it?</span>
                        <select class="field__input" name="would_reread">
                            <option value="" ${reread === "" ? html`selected` : ""}>Not sure yet</option>
                            <option value="yes" ${reread === "yes" ? html`selected` : ""}>Yes, one day</option>
                            <option value="no" ${reread === "no" ? html`selected` : ""}>Once was enough</option>
                        </select>
                    </label>
                </div>

                <label class="check">
                    <input type="checkbox" name="is_favorite" ${current.is_favorite ? html`checked` : ""}>
                    One of my favourites
                </label>

                <label class="field">
                    <span class="field__label">My review</span>
                    <textarea class="field__input field__input--hand review-form__body" name="body" rows="7" maxlength="50000" placeholder="What stayed with you?">${review.body || ""}</textarea>
                </label>

                <label class="field">
                    <span class="field__label">Final thoughts</span>
                    <textarea class="field__input field__input--hand" name="final_thoughts" rows="2" maxlength="5000" placeholder="In a sentence…">${review.final_thoughts || ""}</textarea>
                </label>

                <p class="form-error" role="alert" hidden></p>

                <div class="entry-form__actions">
                    ${review.updated_at ? html`<span class="muted review-form__saved">Last written ${formatDate(review.updated_at)}</span>` : ""}
                    <button class="button button--primary button--small" type="submit">${art("ui-sparkle")} Save review</button>
                </div>

            </form>
        `;

    }


    /* =====================================================
       ACTIONS
    ===================================================== */

    async function saveBookField(patch, message) {

        try {

            await updateBook(state.bookId, patch);

            if (message) {
                toast(message, { tone: "success", timeout: 2200 });
            }

        }

        catch (error) {

            toastError(error);

            renderLeft();

        }

    }


    async function changeStatus(status) {

        const current =
            book();

        const patch = { status };

        if (status === "reading" && !current.date_started) {
            patch.date_started = todayIso();
        }

        if (status === "finished") {

            if (!current.date_finished) {
                patch.date_finished = todayIso();
            }

            if (!current.times_read) {
                patch.times_read = 1;
            }

            if (current.page_count) {
                patch.current_page = current.page_count;
            }

        }

        await saveBookField(patch, `Marked as ${statusLabel(status)}.`);

    }


    async function saveProgress(form) {

        const current =
            book();

        const pageNumber =
            intOrNull(form.elements.current_page.value);

        if (pageNumber === null || pageNumber < 0) {
            form.elements.current_page.setAttribute("aria-invalid", "true");
            return;
        }

        if (current.page_count && pageNumber > current.page_count) {

            form.elements.current_page.setAttribute("aria-invalid", "true");

            toast(`This edition has ${current.page_count} pages.`, { tone: "error" });

            return;

        }

        await withBusy(form.querySelector("[type=submit]"), "Saving…", async () => {

            try {

                await logProgress(current, pageNumber);

                state.progressOpen = false;

                if (current.status === "want_to_read" || current.status === "paused") {
                    await updateBook(current.id, { status: "reading", date_started: current.date_started || todayIso() }, { quiet: true });
                }

                renderLeft();

                if (current.page_count && pageNumber >= current.page_count && current.status !== "finished") {

                    const finish =
                        await confirmDialog({
                            title: "You reached the last page!",
                            message: `Mark “${current.title}” as finished today?`,
                            confirmLabel: "Mark as finished",
                            cancelLabel: "Not yet"
                        });

                    if (finish) {
                        await changeStatus("finished");
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


    async function saveEntry(form) {

        const config =
            LIST_SECTIONS[state.tab];

        const errorLine =
            form.querySelector(".form-error");

        const values = {};

        for (const fieldConfig of config.fields) {

            const input =
                form.elements[fieldConfig.name];

            if (!input) {
                continue;
            }

            if (fieldConfig.type === "checkbox") {
                values[fieldConfig.name] = input.checked;
                continue;
            }

            if (fieldConfig.type === "number") {
                values[fieldConfig.name] = intOrNull(input.value);
                continue;
            }

            if (fieldConfig.type === "chapter") {
                values.section_id = input.value || null;
                continue;
            }

            const text =
                fieldConfig.required ? input.value.trim() : textOrNull(input.value);

            if (fieldConfig.required && !text) {

                errorLine.textContent = `Write the ${fieldConfig.label.toLowerCase()} first.`;
                errorLine.hidden = false;

                input.setAttribute("aria-invalid", "true");
                input.focus();

                return;

            }

            values[fieldConfig.name] = text;

        }

        const id =
            form.dataset.id;

        await withBusy(form.querySelector("[type=submit]"), "Saving…", async () => {

            try {

                if (id) {
                    await updateRow(config.table, id, values);
                }

                else {

                    await createRow(config.table, {
                        ...values,
                        ...(config.match || {}),
                        book_id: state.bookId
                    });

                }

                forget(config.table);

                state.adding = false;
                state.editingId = null;

                await renderRight();

                toast(id ? "Saved." : `Your ${config.noun} was added.`, { tone: "success", timeout: 2200 });

            }

            catch (error) {

                console.error(error);

                errorLine.textContent = friendlyDataError(error);
                errorLine.hidden = false;

            }

        });

    }


    async function deleteEntry(id) {

        const config =
            LIST_SECTIONS[state.tab];

        const sure =
            await confirmDialog({
                title: `Delete this ${config.noun}?`,
                message: "It will be removed from this journal. This can't be undone.",
                confirmLabel: "Delete",
                tone: "danger"
            });

        if (!sure) {
            return;
        }

        try {

            await deleteRow(config.table, id);

            forget(config.table);

            await renderRight();

        }

        catch (error) {
            toastError(error);
        }

    }


    async function saveReviewForm(form) {

        const values = {
            rating: form.elements.rating.value ? Number(form.elements.rating.value) : null,
            date_finished: form.elements.date_finished.value || null,
            is_favorite: form.elements.is_favorite.checked
        };

        const current =
            book();

        if (values.date_finished && current.date_started && values.date_finished < current.date_started) {

            const errorLine = form.querySelector(".form-error");

            errorLine.textContent = "The finish date is before the day you started.";
            errorLine.hidden = false;

            return;

        }

        const choice =
            form.elements.would_reread.value;

        await withBusy(form.querySelector("[type=submit]"), "Saving…", async () => {

            try {

                await Promise.all([

                    updateBook(current.id, values),

                    saveReview(current.id, {
                        body: textOrNull(form.elements.body.value),
                        final_thoughts: textOrNull(form.elements.final_thoughts.value),
                        would_reread: choice === "yes" ? true : choice === "no" ? false : null
                    })

                ]);

                toast("Your review is saved.", { tone: "success" });

                await renderRight();

            }

            catch (error) {
                toastError(error);
            }

        });

    }


    /* ---------------------------------------------------------
       CHAPTERS
    --------------------------------------------------------- */

    async function addSection(form) {

        const title =
            form.elements.title.value.trim();

        if (!title) {
            form.elements.title.focus();
            return;
        }

        const parentId =
            form.elements.parent_id?.value || null;

        const siblings =
            (await rowsFor("book_sections")).filter((section) => (section.parent_id || null) === parentId);

        await withBusy(form.querySelector("[type=submit]"), "Adding…", async () => {

            try {

                await createRow("book_sections", {
                    book_id: state.bookId,
                    parent_id: parentId,
                    kind: form.elements.kind.value,
                    title,
                    sort_order: siblings.length
                });

                forget("book_sections");

                await renderRight();

            }

            catch (error) {
                toastError(error);
            }

        });

    }


    async function addChapterRun(form) {

        const from = intOrNull(form.elements.from.value);
        const to = intOrNull(form.elements.to.value);

        if (!from || !to || to < from || to - from > 299) {

            toast("Choose a range like 1 to 24 (up to 300 chapters at once).", { tone: "error" });

            return;

        }

        const parentId =
            form.elements.parent_id?.value || null;

        const siblings =
            (await rowsFor("book_sections")).filter((section) => (section.parent_id || null) === parentId);

        await withBusy(form.querySelector("[type=submit]"), "Adding…", async () => {

            try {

                for (let number = from; number <= to; number += 1) {

                    await createRow("book_sections", {
                        book_id: state.bookId,
                        parent_id: parentId,
                        kind: "chapter",
                        title: `Chapter ${number}`,
                        sort_order: siblings.length + number - from
                    });

                }

                forget("book_sections");

                toast(`Added ${plural(to - from + 1, "chapter")}.`, { tone: "success" });

                await renderRight();

            }

            catch (error) {

                forget("book_sections");

                toastError(error);

                await renderRight();

            }

        });

    }


    async function moveSection(id, step) {

        const all =
            await rowsFor("book_sections");

        const section =
            all.find((item) => item.id === id);

        const siblings =
            all
                .filter((item) => (item.parent_id || null) === (section.parent_id || null))
                .sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at));

        const index =
            siblings.indexOf(section);

        const target =
            siblings[index + step];

        if (!target) {
            return;
        }

        siblings.splice(index, 1);
        siblings.splice(index + step, 0, section);

        try {

            await Promise.all(
                siblings.map((item, position) =>
                    item.sort_order === position
                        ? null
                        : updateRow("book_sections", item.id, { sort_order: position })
                )
            );

            forget("book_sections");

            await renderRight();

        }

        catch (error) {
            toastError(error);
        }

    }


    async function renameSection(id) {

        const section =
            (await rowsFor("book_sections")).find((item) => item.id === id);

        const saved =
            await formDialog({
                title: "Rename",
                submitLabel: "Save",
                body: html`
                    <label class="field">
                        <span class="field__label">Name</span>
                        <input class="field__input" name="title" value="${section.title}" maxlength="120" required>
                    </label>
                    <label class="field">
                        <span class="field__label">This is a</span>
                        <select class="field__input" name="kind">
                            ${SECTION_KINDS.map((kind) => html`<option value="${kind.id}" ${kind.id === section.kind ? html`selected` : ""}>${kind.label}</option>`)}
                        </select>
                    </label>
                `,
                onSubmit: (values) =>
                    updateRow("book_sections", id, {
                        title: String(values.get("title")).trim(),
                        kind: values.get("kind")
                    })
            });

        if (saved) {
            forget("book_sections");
            await renderRight();
        }

    }


    async function deleteSection(id) {

        const section =
            (await rowsFor("book_sections")).find((item) => item.id === id);

        const sure =
            await confirmDialog({
                title: `Delete “${section.title}”?`,
                message: "Anything inside it (smaller parts or chapters) is deleted too. Notes, quotes, words and questions are kept and move to the whole book.",
                confirmLabel: "Delete",
                tone: "danger"
            });

        if (!sure) {
            return;
        }

        try {

            await deleteRow("book_sections", id);

            state.cache.clear();

            if (state.chapterFilter === id) {
                state.chapterFilter = "all";
            }

            await renderRight();

        }

        catch (error) {
            toastError(error);
        }

    }


    /* =====================================================
       EVENTS
    ===================================================== */

    root.addEventListener("click", async (event) => {

        const ribbon =
            event.target.closest("[data-tab]");

        if (ribbon) {
            selectTab(ribbon.dataset.tab);
            return;
        }

        const trigger =
            event.target.closest("[data-action]");

        if (!trigger || trigger.tagName === "SELECT" || trigger.type === "checkbox") {
            return;
        }

        const action =
            trigger.dataset.action;

        switch (action) {

            case "close":
                onClose?.();
                break;

            case "new-book":
                onOpenEditor?.(null);
                break;

            case "edit-book":
                onOpenEditor?.(state.bookId);
                break;

            case "step":
                stepBook(Number(trigger.dataset.step));
                break;

            case "toggle-favorite":
                await saveBookField(
                    { is_favorite: !book().is_favorite },
                    book().is_favorite ? "Removed from favourites." : "Added to your favourites."
                );
                break;

            case "progress-open":
                state.progressOpen = true;
                renderLeft();
                root.querySelector("[name=current_page]")?.select();
                break;

            case "progress-cancel":
                state.progressOpen = false;
                renderLeft();
                break;

            case "add":
                state.adding = true;
                state.editingId = null;
                renderRight();
                break;

            case "edit":
                state.editingId = trigger.dataset.id;
                state.adding = false;
                renderRight();
                break;

            case "cancel-entry":
                state.adding = false;
                state.editingId = null;
                renderRight();
                break;

            case "delete":
                deleteEntry(trigger.dataset.id);
                break;

            case "retry":
                state.cache.clear();
                renderRight();
                break;

            case "section-move":
                moveSection(trigger.dataset.id, Number(trigger.dataset.step));
                break;

            case "section-rename":
                renameSection(trigger.dataset.id);
                break;

            case "section-delete":
                deleteSection(trigger.dataset.id);
                break;

            default:
                break;

        }

    });


    root.addEventListener("change", async (event) => {

        const target =
            event.target;

        if (target.dataset.field === "status") {
            await changeStatus(target.value);
        }

        if (target.dataset.action === "chapter-filter") {
            state.chapterFilter = target.value;
            renderRight();
        }

        if (target.dataset.action === "toggle-resolved") {

            try {

                await updateRow("questions", target.dataset.id, { resolved: target.checked });

                forget("questions");

                renderRight();

            }

            catch (error) {
                toastError(error);
            }

        }

    });


    // The first page's stars save as soon as they're chosen.
    root.addEventListener("rating-change", (event) => {

        if (event.target.closest("[data-left-page]")) {

            saveBookField(
                { rating: event.detail.value || null },
                event.detail.value ? `Rated ${event.detail.value} out of 5.` : "Rating cleared."
            );

        }

    });


    root.addEventListener("submit", (event) => {

        const form =
            event.target.closest("[data-form]");

        if (!form) {
            return;
        }

        event.preventDefault();

        const handlers = {
            progress: saveProgress,
            entry: saveEntry,
            review: saveReviewForm,
            section: addSection,
            "bulk-chapters": addChapterRun
        };

        handlers[form.dataset.form]?.(form);

    });


    // Keep the first page in step with changes made elsewhere
    // (the book editor, another tab of the app, etc.).
    events.addEventListener("library-changed", (event) => {

        if (!state.bookId) {

            if (root.dataset.state === "empty") {
                renderEmpty();
            }

            return;

        }

        if (!book()) {
            onClose?.();
            return;
        }

        if (event.detail.bookId === state.bookId || event.detail.reason === "loaded") {
            renderLeft();
        }

    });


    /* =====================================================
       NAVIGATION
    ===================================================== */

    function selectTab(tab) {

        if (tab === state.tab) {
            return;
        }

        state.tab = tab;
        state.adding = false;
        state.editingId = null;

        root
            .querySelectorAll("[data-tab]")
            .forEach((ribbon) => {

                const active =
                    ribbon.dataset.tab === tab;

                ribbon.classList.toggle("is-active", active);
                ribbon.setAttribute("aria-current", active ? "page" : "false");

            });

        const fullLink =
            root.querySelector(".journal-tabs a");

        if (fullLink) {
            fullLink.href = `journal.html?book=${state.bookId}&tab=${tab}`;
        }

        root.dispatchEvent(new CustomEvent("journal-tab", { bubbles: true, detail: { tab } }));

        renderRight({ turn: true });

        // On a phone the section opens below the ribbons; bring
        // it into view if the reader has scrolled away from it.
        if (window.matchMedia("(max-width: 820px)").matches) {

            const ribbons =
                root.querySelector(".journal-ribbons");

            const box =
                ribbons?.getBoundingClientRect();

            if (box && (box.top < 0 || box.bottom > window.innerHeight * 0.55)) {
                ribbons.scrollIntoView({ block: "start", behavior: prefersReducedMotion() ? "auto" : "smooth" });
            }

        }

    }


    function stepBook(step) {

        const books =
            root.dispatchEvent(new CustomEvent("journal-step", { bubbles: true, cancelable: true, detail: { step } }));

        // Pages can take over stepping (the dashboard follows shelf order).
        if (!books) {
            return;
        }

        const all =
            getBooks();

        const index =
            all.findIndex((item) => item.id === state.bookId);

        const next =
            all[(index + step + all.length) % all.length];

        if (next) {
            open(next.id);
        }

    }


    async function open(bookId, { tab } = {}) {

        const found =
            getBook(bookId) || (await fetchBook(bookId));

        if (!found) {
            toast("That book couldn't be found in your library.", { tone: "error" });
            return false;
        }

        if (found.cover_path) {
            await coverUrls([found.cover_path]);
        }

        if (state.bookId !== bookId) {
            state.cache.clear();
            state.chapterFilter = "all";
        }

        state.bookId = bookId;
        state.adding = false;
        state.editingId = null;
        state.progressOpen = false;

        if (tab && SECTIONS.some((section) => section.id === tab)) {
            state.tab = tab;
        }

        renderFrame();

        const bookElement =
            root.querySelector("[data-journal-book]");

        if (!prefersReducedMotion()) {

            bookElement.classList.add("is-opening");

            wait(700).then(() => bookElement.classList.remove("is-opening"));

        }

        return true;

    }


    renderEmpty();


    return {

        open,

        close() {
            renderEmpty();
        },

        get bookId() {
            return state.bookId;
        },

        get tab() {
            return state.tab;
        },

        coverTarget() {
            return root.querySelector("[data-journal-cover]")
                || root.querySelector(".journal-page--left");
        },

        refresh() {

            if (state.bookId) {
                state.cache.clear();
                renderFrame();
            }

        }

    };

}
