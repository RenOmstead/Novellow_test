/* =========================================================
   NOVELLOW
   INTERFACE PIECES

   Paper-note toasts, parchment dialogs, in-world loading
   and empty states, busy buttons.
========================================================= */

import { html, render, escapeHtml } from "./helpers.js?v=__VERSION__";
import { friendlyDataError } from "./errors.js?v=__VERSION__";


/* =========================================================
   ART
========================================================= */

export function art(symbol, className = "", label = "") {

    if (label) {
        return html`<svg class="${className}" role="img" aria-label="${label}"><use href="#${symbol}"></use></svg>`;
    }

    return html`<svg class="${className}" aria-hidden="true" focusable="false"><use href="#${symbol}"></use></svg>`;

}


/* =========================================================
   TOASTS
========================================================= */

function toastShelf() {

    let shelf =
        document.getElementById("toasts");

    if (!shelf) {

        shelf = document.createElement("div");

        shelf.id = "toasts";
        shelf.className = "toast-shelf";

        shelf.setAttribute("role", "status");
        shelf.setAttribute("aria-live", "polite");

        document.body.appendChild(shelf);

    }

    return shelf;

}


export function toast(message, { tone = "info", timeout = 4200 } = {}) {

    const note =
        document.createElement("div");

    note.className =
        `toast toast--${tone}`;

    const symbol =
        tone === "error"
            ? "ui-alert"
            : tone === "success"
                ? "ui-sparkle"
                : "ui-quill";

    render(note, html`
        ${art(symbol, "toast__art")}
        <p>${message}</p>
        <button class="toast__close" type="button" aria-label="Dismiss message">×</button>
    `);

    note
        .querySelector(".toast__close")
        .addEventListener("click", () => note.remove());

    toastShelf().appendChild(note);

    if (timeout) {

        window.setTimeout(() => {

            note.classList.add("is-leaving");

            window.setTimeout(() => note.remove(), 400);

        }, timeout);

    }

    return note;

}


export function toastError(error, fallback) {

    console.error(error);

    return toast(
        friendlyDataError(error, fallback),
        { tone: "error", timeout: 7000 }
    );

}


/* =========================================================
   DIALOGS
========================================================= */

function createDialog(className) {

    const dialog =
        document.createElement("dialog");

    dialog.className =
        `parchment-dialog ${className}`.trim();

    document.body.appendChild(dialog);

    dialog.addEventListener("close", () => {
        window.setTimeout(() => dialog.remove(), 50);
    });

    // Clicking the dim backdrop closes the dialog.
    dialog.addEventListener("click", (event) => {

        if (event.target === dialog) {
            dialog.close("cancel");
        }

    });

    return dialog;

}


/*
    confirmDialog({ title, message, confirmLabel, tone, requireText })
    Resolves true when confirmed.
*/

export function confirmDialog({
    title,
    message,
    confirmLabel = "Yes",
    cancelLabel = "Cancel",
    tone = "default",
    requireText = ""
}) {

    return new Promise((resolve) => {

        const dialog =
            createDialog("parchment-dialog--confirm");

        render(dialog, html`
            <form method="dialog" class="dialog-form">

                ${art(tone === "danger" ? "ui-alert" : "ui-quill", "dialog-art")}

                <h2 class="dialog-title">${title}</h2>

                <p class="dialog-message">${message}</p>

                ${requireText ? html`
                    <label class="field">
                        <span class="field__label">Type <strong>${requireText}</strong> to confirm</span>
                        <input class="field__input" name="confirmText" autocomplete="off" required>
                    </label>
                ` : ""}

                <div class="dialog-actions">
                    <button class="button button--ghost" value="cancel" type="submit" formnovalidate>${cancelLabel}</button>
                    <button class="button ${tone === "danger" ? "button--danger" : "button--primary"}" value="confirm" type="submit">${confirmLabel}</button>
                </div>

            </form>
        `);

        const form =
            dialog.querySelector("form");

        form.addEventListener("submit", (event) => {

            const confirming =
                event.submitter?.value === "confirm";

            if (confirming && requireText) {

                const typed =
                    form.elements.confirmText.value.trim();

                if (typed !== requireText) {

                    event.preventDefault();

                    form.elements.confirmText.setCustomValidity(`Type ${requireText} exactly.`);
                    form.elements.confirmText.reportValidity();

                    return;

                }

            }

            dialog.returnValue = confirming ? "confirm" : "cancel";

        });

        form.elements.confirmText?.addEventListener("input", (event) => {
            event.target.setCustomValidity("");
        });

        dialog.addEventListener("close", () => {
            resolve(dialog.returnValue === "confirm");
        });

        dialog.showModal();

    });

}


/*
    formDialog({ title, eyebrow, body, submitLabel, onSubmit })

    body is SafeHtml containing the form fields.
    onSubmit(values, form) may return false to keep the dialog
    open (for example after showing a validation message).
    Resolves with onSubmit's result, or null when cancelled.
*/

export function formDialog({
    title,
    eyebrow = "",
    body,
    submitLabel = "Save",
    cancelLabel = "Cancel",
    className = "",
    onSubmit,
    onOpen
}) {

    return new Promise((resolve) => {

        const dialog =
            createDialog(`parchment-dialog--form ${className}`);

        let result = null;

        render(dialog, html`
            <form class="dialog-form" novalidate>

                <button class="dialog-close" type="button" data-close aria-label="Close">
                    ${art("ui-close", "dialog-close__art")}
                </button>

                ${eyebrow ? html`<p class="dialog-eyebrow">${eyebrow}</p>` : ""}

                <h2 class="dialog-title">${title}</h2>

                <div class="dialog-body">${body}</div>

                <p class="form-error" role="alert" hidden></p>

                <div class="dialog-actions">
                    <button class="button button--ghost" type="button" data-close>${cancelLabel}</button>
                    <button class="button button--primary" type="submit">${submitLabel}</button>
                </div>

            </form>
        `);

        const form =
            dialog.querySelector("form");

        const errorLine =
            dialog.querySelector(".form-error");

        dialog
            .querySelectorAll("[data-close]")
            .forEach((button) => {
                button.addEventListener("click", () => dialog.close());
            });

        form.addEventListener("submit", async (event) => {

            event.preventDefault();

            errorLine.hidden = true;

            if (!form.reportValidity()) {
                return;
            }

            const submit =
                form.querySelector("[type=submit]");

            await withBusy(submit, "Saving…", async () => {

                try {

                    const outcome =
                        await onSubmit(new FormData(form), form);

                    if (outcome === false) {
                        return;
                    }

                    result = outcome ?? true;

                    dialog.close();

                }

                catch (error) {

                    console.error(error);

                    errorLine.textContent =
                        friendlyDataError(error);

                    errorLine.hidden = false;

                }

            });

        });

        dialog.addEventListener("close", () => resolve(result));

        dialog.showModal();

        onOpen?.(dialog, form);

        form.querySelector("input, textarea, select")?.focus();

    });

}


/* =========================================================
   BUSY BUTTONS
========================================================= */

export async function withBusy(button, busyLabel, task) {

    if (!button) {
        return task();
    }

    const label =
        button.innerHTML;

    button.disabled = true;
    button.classList.add("is-busy");
    button.setAttribute("aria-busy", "true");

    if (busyLabel) {
        button.innerHTML = escapeHtml(busyLabel);
    }

    try {
        return await task();
    }

    finally {

        button.disabled = false;
        button.classList.remove("is-busy");
        button.removeAttribute("aria-busy");
        button.innerHTML = label;

    }

}


/* =========================================================
   LOADING AND EMPTY STATES
========================================================= */

export function loader(message = "Opening the library…") {

    return html`
        <div class="book-loader" role="status">
            <div class="book-loader__book" aria-hidden="true">
                <span class="book-loader__cover"></span>
                <span class="book-loader__page"></span>
                <span class="book-loader__page"></span>
                <span class="book-loader__page"></span>
            </div>
            <p>${message}</p>
        </div>
    `;

}


export function emptyState({
    symbol = "scene-cat",
    title,
    text = "",
    actionLabel = "",
    action = "",
    href = ""
}) {

    return html`
        <div class="empty-state">

            ${art(symbol, "empty-state__art")}

            <h2>${title}</h2>

            ${text ? html`<p>${text}</p>` : ""}

            ${actionLabel && href ? html`
                <a class="button button--primary" href="${href}">${actionLabel}</a>
            ` : ""}

            ${actionLabel && action ? html`
                <button class="button button--primary" type="button" data-action="${action}">${actionLabel}</button>
            ` : ""}

        </div>
    `;

}
