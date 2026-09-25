/* =========================================================
   NOVELLOW
   SHELF EDITOR

   Add, rename, describe, style, reorder and delete shelves.
   A shelf that still holds books can only be deleted after
   its books are moved somewhere else.
========================================================= */

import {
    loadLibrary,
    getShelves,
    getShelf,
    booksOnShelf,
    createShelf,
    updateShelf,
    deleteShelf,
    reorderShelves,
    moveAllBooks
} from "../core/store.js?v=__VERSION__";

import { html, textOrNull, plural } from "../core/helpers.js?v=__VERSION__";
import { formDialog, confirmDialog, toast, toastError } from "../core/ui.js?v=__VERSION__";
import { SHELF_STYLES } from "../config.js?v=__VERSION__";
import { NovellowError } from "../core/errors.js?v=__VERSION__";


export async function openShelfEditor({ shelfId = null } = {}) {

    await loadLibrary();

    const shelf =
        shelfId ? getShelf(shelfId) : null;

    const shelves =
        getShelves();

    const index =
        shelf ? shelves.findIndex((item) => item.id === shelf.id) : -1;

    const bookCount =
        shelf ? booksOnShelf(shelf.id).length : 0;

    return formDialog({
        eyebrow: shelf ? "Edit shelf" : "A new shelf",
        title: shelf ? shelf.name : "Add a shelf to your bookcase",
        submitLabel: shelf ? "Save shelf" : "Add shelf",
        className: "shelf-editor",
        body: html`

            <label class="field">
                <span class="field__label">Shelf name</span>
                <input class="field__input" name="name" value="${shelf?.name || ""}" maxlength="60" required placeholder="Fantasy & Magic">
            </label>

            <label class="field">
                <span class="field__label">Description <span class="muted">(optional)</span></span>
                <textarea class="field__input" name="description" maxlength="300" rows="2" placeholder="Stories with a little magic in them.">${shelf?.description || ""}</textarea>
            </label>

            <label class="field">
                <span class="field__label">Shelf style</span>
                <select class="field__input" name="style">
                    ${SHELF_STYLES.map((style) => html`
                        <option value="${style.id}" ${style.id === (shelf?.style || "classic_wood") ? html`selected` : ""}>${style.label}</option>
                    `)}
                </select>
            </label>

            <label class="field" data-painted-color ${shelf?.style === "painted" ? "" : html`hidden`}>
                <span class="field__label">Paint colour</span>
                <input class="field__input field__input--color" type="color" name="color" value="${shelf?.color || "#7b5d8c"}">
            </label>

            ${shelf ? html`
                <div class="shelf-editor__manage">

                    <p class="field__label">Position on the bookcase</p>

                    <div class="shelf-editor__row">
                        <button class="button button--ghost button--small" type="button" data-move="-1" ${index <= 0 ? html`disabled` : ""}>Move up</button>
                        <button class="button button--ghost button--small" type="button" data-move="1" ${index >= shelves.length - 1 ? html`disabled` : ""}>Move down</button>
                    </div>

                    <p class="field__label">Remove this shelf</p>

                    <p class="field__hint">
                        ${bookCount
                            ? `It holds ${plural(bookCount, "book")}. They'll need a new home first.`
                            : "It's empty, so it can be removed straight away."}
                    </p>

                    <button class="button button--ghost button--small shelf-editor__delete" type="button" data-delete-shelf>Remove shelf</button>

                </div>
            ` : ""}
        `,

        onOpen(dialog, form) {

            form.elements.style.addEventListener("change", () => {
                dialog.querySelector("[data-painted-color]").hidden = form.elements.style.value !== "painted";
            });

            dialog.addEventListener("click", async (event) => {

                const move =
                    event.target.closest("[data-move]");

                if (move && shelf) {

                    const order =
                        getShelves().map((item) => item.id);

                    const from =
                        order.indexOf(shelf.id);

                    const to =
                        from + Number(move.dataset.move);

                    order.splice(to, 0, order.splice(from, 1)[0]);

                    try {

                        await reorderShelves(order);

                        toast(`“${shelf.name}” moved ${move.dataset.move === "-1" ? "up" : "down"}.`, { tone: "success" });

                        dialog.close();

                    }

                    catch (error) {
                        toastError(error);
                    }

                }

                if (event.target.closest("[data-delete-shelf]") && shelf) {

                    dialog.close();

                    await removeShelf(shelf.id);

                }

            });

        },

        async onSubmit(values) {

            const record = {
                name: String(values.get("name")).trim(),
                description: textOrNull(values.get("description")),
                style: values.get("style"),
                color: values.get("style") === "painted" ? values.get("color") : null
            };

            if (!record.name) {
                throw new NovellowError("Give the shelf a name.");
            }

            const saved =
                shelf
                    ? await updateShelf(shelf.id, record)
                    : await createShelf(record);

            toast(shelf ? `“${saved.name}” was updated.` : `“${saved.name}” was added to your bookcase.`, { tone: "success" });

            return saved;

        }
    });

}


/*
    Deletes a shelf, first offering to move its books.
*/

export async function removeShelf(shelfId) {

    const shelf =
        getShelf(shelfId);

    if (!shelf) {
        return false;
    }

    const books =
        booksOnShelf(shelfId);

    const others =
        getShelves().filter((item) => item.id !== shelfId);

    try {

        if (!books.length) {

            const sure =
                await confirmDialog({
                    title: `Remove “${shelf.name}”?`,
                    message: "The empty shelf will be taken off your bookcase.",
                    confirmLabel: "Remove shelf",
                    tone: "danger"
                });

            if (sure) {

                await deleteShelf(shelfId);

                toast(`“${shelf.name}” was removed.`, { tone: "success" });

            }

            return sure;

        }

        if (!others.length) {

            await confirmDialog({
                title: "This shelf still holds books",
                message: "Add another shelf first so these books have somewhere to go, then remove this one.",
                confirmLabel: "All right",
                cancelLabel: "Close"
            });

            return false;

        }

        const moved =
            await formDialog({
                eyebrow: "Before this shelf goes",
                title: `Where should its ${plural(books.length, "book")} go?`,
                submitLabel: "Move books and remove shelf",
                body: html`
                    <p class="dialog-message">
                        Nothing is deleted: every book, journal, quote and word moves with its book.
                    </p>
                    <label class="field">
                        <span class="field__label">Move them to</span>
                        <select class="field__input" name="target">
                            ${others.map((item) => html`<option value="${item.id}">${item.name}</option>`)}
                        </select>
                    </label>
                `,
                async onSubmit(values) {

                    await moveAllBooks(shelfId, values.get("target"));

                    await deleteShelf(shelfId);

                    return true;

                }
            });

        if (moved) {
            toast(`The books were moved and “${shelf.name}” was removed.`, { tone: "success" });
        }

        return Boolean(moved);

    }

    catch (error) {

        toastError(error);

        return false;

    }

}
