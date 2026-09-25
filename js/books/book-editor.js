/* =========================================================
   NOVELLOW
   BOOK EDITOR

   The Add / Edit Book drawer. Fields are grouped the way a
   reader thinks about a book, and a live spine and cover
   preview updates as the design changes.
========================================================= */

import {
    loadLibrary,
    getShelves,
    getBooks,
    getBook,
    createShelf,
    createBook,
    updateBook,
    deleteBook,
    currentUserId
} from "../core/store.js?v=__VERSION__";

import { uploadCover, removeCover, coverUrls, checkCoverFile } from "../core/covers.js?v=__VERSION__";
import { html, raw, render, textOrNull, intOrNull, numberOrNull, todayIso } from "../core/helpers.js?v=__VERSION__";
import { friendlyDataError, NovellowError } from "../core/errors.js?v=__VERSION__";
import { art, toast, confirmDialog, withBusy } from "../core/ui.js?v=__VERSION__";
import { ratingMarkup, wireRatings } from "../core/rating.js?v=__VERSION__";
import { READING_STATUSES } from "../config.js?v=__VERSION__";
import { spineMarkup, fitSpineTitles } from "./spine.js?v=__VERSION__";
import { coverMarkup } from "./cover.js?v=__VERSION__";

import {
    SPINE_STYLES,
    SPINE_FONTS,
    TITLE_PANELS,
    ORNAMENTS,
    HEIGHTS,
    THICKNESS,
    FONT_SIZES,
    FONT_WEIGHTS,
    LETTER_SPACING,
    TEXT_CASES,
    FONT_STYLES,
    ALIGNMENTS,
    PALETTE,
    normalizeSpine,
    suggestedSpine
} from "./spine-options.js?v=__VERSION__";


const NEW_SHELF = "__new__";


/* =========================================================
   FIELD HELPERS
========================================================= */

function options(list, selected, value = "id") {

    return list.map((item) => html`
        <option value="${item[value]}" ${item[value] === selected ? html`selected` : ""}>${item.label}</option>
    `);

}


function field(label, control, hint = "") {

    return html`
        <label class="field">
            <span class="field__label">${label}</span>
            ${control}
            ${hint ? html`<span class="field__hint">${hint}</span>` : ""}
        </label>
    `;

}


function input(name, value, attributes = "") {

    return html`<input class="field__input" name="${name}" value="${value ?? ""}" ${raw(attributes)}>`;

}


function select(name, list, selected, extra = "") {

    return html`
        <select class="field__input" name="${name}">
            ${options(list, selected)}
            ${extra}
        </select>
    `;

}


function colorField(label, name, value) {

    return html`
        <label class="field field--color">
            <span class="field__label">${label}</span>
            <span class="color-input">
                <input type="color" name="${name}" value="${value}">
                <span class="color-input__value" data-color-value="${name}">${value}</span>
            </span>
        </label>
    `;

}


/* =========================================================
   OPEN
========================================================= */

/*
    openBookEditor({ bookId, shelfId, prefill, coverUrl })
      prefill   starting values for a new book (from Discover)
      coverUrl  an image to fetch and use as the new book's cover
    Resolves with the saved book, or null if closed.
*/

export async function openBookEditor({ bookId = null, shelfId = null, prefill = null, coverUrl = null } = {}) {

    await loadLibrary();

    const existing =
        bookId ? getBook(bookId) : null;

    if (bookId && !existing) {
        throw new NovellowError("That book couldn't be found in your library.");
    }

    const shelves =
        getShelves();

    const book =
        existing
            ? { ...existing }
            : {
                title: "",
                status: "want_to_read",
                shelf_id: shelfId || shelves[0]?.id || NEW_SHELF,
                current_page: 0,
                times_read: 0,
                ...(prefill || {}),
                spine: suggestedSpine(prefill?.title || String(Date.now()))
            };

    if (existing?.cover_path) {
        await coverUrls([existing.cover_path]);
    }

    // A cover offered by Discover is downloaded now so it can be
    // previewed and uploaded like any chosen file.
    let offeredCover = null;

    if (coverUrl && !existing) {

        try {

            const response =
                await fetch(coverUrl);

            const blob =
                await response.blob();

            if (response.ok && blob.size > 1000 && blob.type.startsWith("image/")) {
                offeredCover = new File([blob], "cover.jpg", { type: blob.type });
            }

        }

        catch (error) {
            console.error("The suggested cover couldn't be fetched.", error);
        }

    }

    return new Promise((resolve) => {

        const dialog =
            document.createElement("dialog");

        dialog.className =
            "parchment-dialog book-editor";

        dialog.setAttribute("aria-labelledby", "bookEditorTitle");

        document.body.appendChild(dialog);

        let result = null;

        render(dialog, editorMarkup(book, shelves, Boolean(existing)));

        const form =
            dialog.querySelector("form");

        wireRatings(form);
        fitSpineTitles(form.querySelector("[data-spine-preview]"));
        wireEditor(dialog, form, book, existing, (saved) => {
            result = saved;
        }, offeredCover);

        dialog.addEventListener("close", () => {

            resolve(result);

            window.setTimeout(() => dialog.remove(), 50);

        });

        dialog.addEventListener("cancel", (event) => {

            // Escape closes, but ask first if something changed.
            if (form.dataset.dirty === "true") {

                event.preventDefault();

                confirmDialog({
                    title: "Leave without saving?",
                    message: "Your changes to this book haven't been saved yet.",
                    confirmLabel: "Leave",
                    cancelLabel: "Keep editing"
                }).then((leave) => leave && dialog.close());

            }

        });

        dialog.showModal();

        form.elements.title.focus();

    });

}


/* =========================================================
   MARKUP
========================================================= */

function editorMarkup(book, shelves, editing) {

    const spine =
        normalizeSpine(book.spine, book.title || String(Date.now()));

    const genres =
        [...new Set(getBooks().map((item) => item.genre).filter(Boolean))].sort();

    return html`
        <form class="book-editor__form" novalidate>

            <header class="book-editor__header">

                <div>
                    <p class="dialog-eyebrow">${editing ? "Edit book" : "Add a book"}</p>
                    <h2 class="dialog-title" id="bookEditorTitle">${editing ? book.title : "A new story for your shelves"}</h2>
                </div>

                <button class="dialog-close" type="button" data-close aria-label="Close without saving">
                    ${art("ui-close", "dialog-close__art")}
                </button>

            </header>


            <div class="book-editor__body">

                <aside class="book-editor__preview" aria-label="Preview">

                    <p class="eyebrow">On the shelf</p>

                    <div class="preview-shelf">
                        <div class="preview-shelf__books" data-spine-preview>
                            ${spineMarkup({ ...book, spine }, { tag: "div" })}
                        </div>
                        <div class="preview-shelf__board"></div>
                    </div>

                    <p class="eyebrow">Cover</p>

                    <div class="preview-cover" data-cover-preview>
                        ${coverMarkup(book, { size: "medium" })}
                    </div>

                    <button class="button button--ghost button--small" type="button" data-surprise>
                        ${art("ui-sparkle")}
                        Surprise me with a design
                    </button>

                </aside>


                <div class="book-editor__fields">

                    <fieldset class="editor-section">

                        <legend>${art("tab-overview", "editor-section__art")} Book details</legend>

                        ${field("Title", input("title", book.title, 'required maxlength="300" autocomplete="off"'))}

                        <div class="field-row">
                            ${field("Author", input("author", book.author, 'maxlength="200" autocomplete="off"'))}
                            ${field("Genre", html`
                                <input class="field__input" name="genre" value="${book.genre || ""}" maxlength="80" list="genreList" autocomplete="off">
                                <datalist id="genreList">${genres.map((genre) => html`<option value="${genre}"></option>`)}</datalist>
                            `)}
                        </div>

                        <div class="field-row">
                            ${field("Publication year", input("publication_year", book.publication_year, 'type="number" min="-3000" max="3000" inputmode="numeric"'))}
                            ${field("Page count", input("page_count", book.page_count, 'type="number" min="1" inputmode="numeric"'))}
                        </div>

                        <div class="field-row">
                            ${field("ISBN", input("isbn", book.isbn, 'maxlength="20" autocomplete="off"'))}
                            ${field("Series", input("series", book.series, 'maxlength="200"'))}
                            ${field("Number in series", input("series_number", book.series_number, 'type="number" min="0" step="0.5"'))}
                        </div>

                    </fieldset>


                    <fieldset class="editor-section">

                        <legend>${art("art-reading", "editor-section__art")} Reading</legend>

                        <div class="field-row">
                            ${field("Status", select("status", READING_STATUSES, book.status))}
                            <div class="field">
                                <span class="field__label" id="ratingLabel">Rating</span>
                                ${ratingMarkup(book.rating, { name: "rating", label: "Your rating" })}
                            </div>
                        </div>

                        <div class="field-row">
                            ${field("Started", input("date_started", book.date_started, 'type="date"'))}
                            ${field("Finished", input("date_finished", book.date_finished, 'type="date"'))}
                        </div>

                        <div class="field-row">
                            ${field("Current page", input("current_page", book.current_page || 0, 'type="number" min="0" inputmode="numeric"'))}
                            ${field("Times read", input("times_read", book.times_read || 0, 'type="number" min="0" inputmode="numeric"'))}
                        </div>

                        <label class="check">
                            <input type="checkbox" name="is_favorite" ${book.is_favorite ? html`checked` : ""}>
                            A favourite
                        </label>

                    </fieldset>


                    <fieldset class="editor-section">

                        <legend>${art("art-books", "editor-section__art")} Library</legend>

                        ${field("Shelf", html`
                            <select class="field__input" name="shelf_id">
                                ${shelves.map((shelf) => html`
                                    <option value="${shelf.id}" ${shelf.id === book.shelf_id ? html`selected` : ""}>${shelf.name}</option>
                                `)}
                                <option value="${NEW_SHELF}" ${book.shelf_id === NEW_SHELF ? html`selected` : ""}>＋ A new shelf…</option>
                            </select>
                        `)}

                        <div data-new-shelf ${book.shelf_id === NEW_SHELF ? "" : html`hidden`}>
                            ${field("New shelf name", input("new_shelf_name", shelves.length ? "" : "My First Shelf", 'maxlength="60"'), "It will appear on your bookcase.")}
                        </div>

                    </fieldset>


                    <fieldset class="editor-section">

                        <legend>${art("ui-upload", "editor-section__art")} Cover</legend>

                        <div class="cover-picker">

                            <label class="button button--ghost cover-picker__button">
                                ${art("ui-upload")}
                                <span data-cover-label>${book.cover_path ? "Replace cover" : "Upload a cover"}</span>
                                <input class="visually-hidden" type="file" name="cover" accept="image/jpeg,image/png,image/webp">
                            </label>

                            <button class="text-button" type="button" data-remove-cover ${book.cover_path ? "" : html`hidden`}>Remove cover</button>

                        </div>

                        <p class="field__hint">JPEG, PNG or WebP. It's resized automatically. Without one, your book gets an illustrated cover in its own colours.</p>

                    </fieldset>


                    <fieldset class="editor-section editor-section--design">

                        <legend>${art("ui-brush", "editor-section__art")} Book design</legend>

                        <div class="palette-picker" role="group" aria-label="Colour pairings">
                            ${PALETTE.map((item, index) => html`
                                <button class="palette-picker__swatch" type="button" data-palette="${index}" style="--c: ${item.color}; --a: ${item.accent}" aria-label="Colour pairing ${index + 1}"></button>
                            `)}
                        </div>

                        <div class="field-row">
                            ${colorField("Spine colour", "spine_color", spine.color)}
                            ${colorField("Title colour", "spine_text", spine.text)}
                            ${colorField("Accent colour", "spine_accent", spine.accent)}
                        </div>

                        <div class="field-row">
                            ${field("Spine style", select("spine_style", SPINE_STYLES, spine.style))}
                            ${field("Title panel", select("spine_panel", TITLE_PANELS, spine.panel))}
                            ${field("Ornament", select("spine_ornament", ORNAMENTS, spine.ornament))}
                        </div>

                        <div class="field-row">
                            ${field("Spine font", select("spine_font", SPINE_FONTS, spine.font))}
                            ${field("Font size", select("spine_size", FONT_SIZES, spine.size))}
                            ${field("Font weight", select("spine_weight", FONT_WEIGHTS, spine.weight))}
                        </div>

                        <div class="field-row">
                            ${field("Letter spacing", select("spine_spacing", LETTER_SPACING, spine.spacing))}
                            ${field("Text case", select("spine_case", TEXT_CASES, spine.textCase))}
                            ${field("Font style", select("spine_font_style", FONT_STYLES, spine.fontStyle))}
                        </div>

                        <div class="field-row">
                            ${field("Title position", select("spine_align", ALIGNMENTS, spine.align))}
                            ${field("Height", select("spine_height", HEIGHTS, spine.height))}
                            ${field("Thickness", select("spine_thickness", THICKNESS, spine.thickness))}
                        </div>

                    </fieldset>

                </div>

            </div>


            <footer class="book-editor__footer">

                <p class="form-error" role="alert" hidden></p>

                <div class="book-editor__actions">

                    ${editing ? html`
                        <button class="button button--ghost book-editor__delete" type="button" data-delete>
                            ${art("ui-trash")}
                            Remove from library
                        </button>
                    ` : ""}

                    <span class="book-editor__spacer"></span>

                    <button class="button button--ghost" type="button" data-close>Cancel</button>

                    <button class="button button--primary" type="submit">
                        ${art("ui-sparkle")}
                        ${editing ? "Save changes" : "Place on shelf"}
                    </button>

                </div>

            </footer>

        </form>
    `;

}


/* =========================================================
   BEHAVIOUR
========================================================= */

function spineFromForm(form) {

    const value = (name) => form.elements[name].value;

    return {
        style: value("spine_style"),
        color: value("spine_color"),
        accent: value("spine_accent"),
        text: value("spine_text"),
        font: value("spine_font"),
        size: value("spine_size"),
        weight: value("spine_weight"),
        spacing: value("spine_spacing"),
        textCase: value("spine_case"),
        fontStyle: value("spine_font_style"),
        align: value("spine_align"),
        panel: value("spine_panel"),
        ornament: value("spine_ornament"),
        height: value("spine_height"),
        thickness: value("spine_thickness")
    };

}


function applySpineToForm(form, spine) {

    const set = (name, value) => {
        form.elements[name].value = value;
    };

    set("spine_style", spine.style);
    set("spine_color", spine.color);
    set("spine_accent", spine.accent);
    set("spine_text", spine.text);
    set("spine_font", spine.font);
    set("spine_size", spine.size);
    set("spine_weight", spine.weight);
    set("spine_spacing", spine.spacing);
    set("spine_case", spine.textCase);
    set("spine_font_style", spine.fontStyle);
    set("spine_align", spine.align);
    set("spine_panel", spine.panel);
    set("spine_ornament", spine.ornament);
    set("spine_height", spine.height);
    set("spine_thickness", spine.thickness);

}


function wireEditor(dialog, form, book, existing, onSaved, offeredCover = null) {

    const errorLine =
        form.querySelector(".form-error");

    const spinePreview =
        form.querySelector("[data-spine-preview]");

    const coverPreview =
        form.querySelector("[data-cover-preview]");

    const newShelf =
        form.querySelector("[data-new-shelf]");

    let pendingCover = offeredCover;
    let pendingCoverUrl = offeredCover ? URL.createObjectURL(offeredCover) : null;
    let removeExistingCover = false;


    const refreshPreview = () => {

        const previewBook = {
            ...book,
            title: form.elements.title.value.trim() || "Untitled",
            author: form.elements.author.value.trim(),
            status: form.elements.status.value,
            spine: spineFromForm(form),
            cover_path: removeExistingCover ? null : book.cover_path
        };

        render(spinePreview, spineMarkup(previewBook, { tag: "div" }));

        fitSpineTitles(spinePreview);

        if (pendingCoverUrl) {

            render(coverPreview, html`
                <div class="book-cover book-cover--medium book-cover--photo">
                    <img src="${pendingCoverUrl}" alt="New cover preview">
                </div>
            `);

        }

        else {
            render(coverPreview, coverMarkup(previewBook, { size: "medium" }));
        }

        form
            .querySelectorAll("[data-color-value]")
            .forEach((label) => {
                label.textContent = form.elements[label.dataset.colorValue].value;
            });

    };


    if (offeredCover) {

        form.querySelector("[data-cover-label]").textContent = "Replace cover";
        form.querySelector("[data-remove-cover]").hidden = false;

        refreshPreview();

    }

    form.addEventListener("input", (event) => {

        form.dataset.dirty = "true";

        if (event.target.name === "cover") {
            return;
        }

        refreshPreview();

    });

    form.addEventListener("change", (event) => {

        if (event.target.name === "shelf_id") {

            newShelf.hidden = event.target.value !== NEW_SHELF;

            if (!newShelf.hidden) {
                form.elements.new_shelf_name.focus();
            }

        }

        if (event.target.name === "cover") {

            const file =
                event.target.files[0];

            if (!file) {
                return;
            }

            try {

                checkCoverFile(file);

                pendingCover = file;

                if (pendingCoverUrl) {
                    URL.revokeObjectURL(pendingCoverUrl);
                }

                pendingCoverUrl = URL.createObjectURL(file);

                removeExistingCover = false;

                form.querySelector("[data-cover-label]").textContent = file.name;
                form.querySelector("[data-remove-cover]").hidden = false;

                refreshPreview();

            }

            catch (error) {

                event.target.value = "";

                showError(error.userMessage || friendlyDataError(error));

            }

        }

        // Helpful defaults when the status changes.
        if (event.target.name === "status") {

            const status = event.target.value;

            if (status === "reading" && !form.elements.date_started.value) {
                form.elements.date_started.value = todayIso();
            }

            if (status === "finished" && !form.elements.date_finished.value) {
                form.elements.date_finished.value = todayIso();
            }

            if (status === "finished" && Number(form.elements.times_read.value) === 0) {
                form.elements.times_read.value = 1;
            }

        }

    });


    form.addEventListener("click", async (event) => {

        if (event.target.closest("[data-close]")) {

            if (form.dataset.dirty === "true") {

                const leave =
                    await confirmDialog({
                        title: "Leave without saving?",
                        message: "Your changes to this book haven't been saved yet.",
                        confirmLabel: "Leave",
                        cancelLabel: "Keep editing"
                    });

                if (!leave) {
                    return;
                }

            }

            dialog.close();

        }

        const swatch =
            event.target.closest("[data-palette]");

        if (swatch) {

            const colors =
                PALETTE[Number(swatch.dataset.palette)];

            form.elements.spine_color.value = colors.color;
            form.elements.spine_accent.value = colors.accent;
            form.elements.spine_text.value = colors.text;

            form.dataset.dirty = "true";

            refreshPreview();

        }

        if (event.target.closest("[data-surprise]")) {

            applySpineToForm(form, suggestedSpine(String(Math.random())));

            form.dataset.dirty = "true";

            refreshPreview();

        }

        if (event.target.closest("[data-remove-cover]")) {

            pendingCover = null;

            if (pendingCoverUrl) {
                URL.revokeObjectURL(pendingCoverUrl);
                pendingCoverUrl = null;
            }

            removeExistingCover = Boolean(book.cover_path);

            form.elements.cover.value = "";
            form.querySelector("[data-cover-label]").textContent = "Upload a cover";
            event.target.closest("[data-remove-cover]").hidden = true;

            form.dataset.dirty = "true";

            refreshPreview();

        }

        if (event.target.closest("[data-delete]")) {

            const sure =
                await confirmDialog({
                    title: `Remove “${existing.title}”?`,
                    message: "Its journal, notes, quotes, words and review will be removed too. This can't be undone.",
                    confirmLabel: "Remove book",
                    tone: "danger"
                });

            if (!sure) {
                return;
            }

            try {

                await deleteBook(existing.id);

                toast(`“${existing.title}” was taken off your shelves.`, { tone: "success" });

                onSaved(null);

                dialog.close();

            }

            catch (error) {
                showError(friendlyDataError(error, "That book couldn't be removed. Please try again."));
            }

        }

    });


    function showError(message, input) {

        errorLine.textContent = message;
        errorLine.hidden = false;

        if (input) {

            input.setAttribute("aria-invalid", "true");
            input.focus();

        }

    }


    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        errorLine.hidden = true;

        form
            .querySelectorAll("[aria-invalid]")
            .forEach((input) => input.removeAttribute("aria-invalid"));

        const values =
            readValues(form);

        const problem =
            validate(values, form);

        if (problem) {
            showError(problem.message, problem.input);
            return;
        }

        await withBusy(form.querySelector("[type=submit]"), "Shelving your book…", async () => {

            try {

                let shelfId =
                    values.shelf_id;

                if (shelfId === NEW_SHELF) {

                    const shelf =
                        await createShelf({ name: values.new_shelf_name });

                    shelfId = shelf.id;

                }

                const record = {
                    title: values.title,
                    author: values.author,
                    genre: values.genre,
                    publication_year: values.publication_year,
                    page_count: values.page_count,
                    isbn: values.isbn,
                    series: values.series,
                    series_number: values.series_number,
                    status: values.status,
                    rating: values.rating,
                    date_started: values.date_started,
                    date_finished: values.date_finished,
                    current_page: values.current_page ?? 0,
                    times_read: values.times_read ?? 0,
                    is_favorite: values.is_favorite,
                    shelf_id: shelfId,
                    spine: spineFromForm(form)
                };

                let saved;

                if (existing) {

                    // Moving shelves puts the book at the end of the new one.
                    if (existing.shelf_id !== shelfId) {
                        record.shelf_position = getBooks().filter((item) => item.shelf_id === shelfId).length;
                    }

                    saved = await updateBook(existing.id, record);

                }

                else {
                    saved = await createBook(record);
                }

                // Covers are uploaded once the book has its permanent id.
                if (pendingCover) {

                    const path =
                        await uploadCover(currentUserId(), saved.id, pendingCover);

                    const oldPath =
                        saved.cover_path;

                    saved = await updateBook(saved.id, { cover_path: path });

                    await coverUrls([path]);

                    if (oldPath) {
                        removeCover(oldPath);
                    }

                }

                else if (removeExistingCover && saved.cover_path) {

                    const oldPath =
                        saved.cover_path;

                    saved = await updateBook(saved.id, { cover_path: null });

                    removeCover(oldPath);

                }

                const shelfName =
                    getShelves().find((shelf) => shelf.id === saved.shelf_id)?.name;

                toast(
                    existing
                        ? `“${saved.title}” was updated.`
                        : `“${saved.title}” is on your ${shelfName || ""} shelf.`,
                    { tone: "success" }
                );

                onSaved(saved);

                form.dataset.dirty = "false";

                dialog.close();

            }

            catch (error) {

                console.error(error);

                showError(error.userMessage || friendlyDataError(error, "Your book couldn't be saved. Please try again."));

            }

        });

    });

}


function readValues(form) {

    const value = (name) => form.elements[name]?.value ?? "";

    return {
        title: value("title").trim(),
        author: textOrNull(value("author")),
        genre: textOrNull(value("genre")),
        publication_year: intOrNull(value("publication_year")),
        page_count: intOrNull(value("page_count")),
        isbn: textOrNull(value("isbn")),
        series: textOrNull(value("series")),
        series_number: numberOrNull(value("series_number")),
        status: value("status"),
        rating: numberOrNull(value("rating")),
        date_started: textOrNull(value("date_started")),
        date_finished: textOrNull(value("date_finished")),
        current_page: intOrNull(value("current_page")),
        times_read: intOrNull(value("times_read")),
        is_favorite: form.elements.is_favorite.checked,
        shelf_id: value("shelf_id"),
        new_shelf_name: value("new_shelf_name").trim()
    };

}


function validate(values, form) {

    const elements = form.elements;

    if (!values.title) {
        return { message: "Every book needs a title.", input: elements.title };
    }

    if (values.page_count !== null && values.page_count < 1) {
        return { message: "The page count should be a positive number.", input: elements.page_count };
    }

    if (values.current_page !== null && values.current_page < 0) {
        return { message: "The current page can't be negative.", input: elements.current_page };
    }

    if (values.page_count && values.current_page > values.page_count) {
        return { message: `The current page is past the last page (${values.page_count}).`, input: elements.current_page };
    }

    if (values.date_started && values.date_finished && values.date_finished < values.date_started) {
        return { message: "The finish date is before the start date.", input: elements.date_finished };
    }

    if (values.times_read !== null && values.times_read < 0) {
        return { message: "Times read can't be negative.", input: elements.times_read };
    }

    if (values.shelf_id === NEW_SHELF && !values.new_shelf_name) {
        return { message: "Give the new shelf a name.", input: elements.new_shelf_name };
    }

    return null;

}
