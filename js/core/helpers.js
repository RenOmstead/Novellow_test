/* =========================================================
   NOVELLOW
   HELPERS

   Small shared utilities: safe HTML templating, dates,
   numbers and text.
========================================================= */

import { READING_STATUSES } from "../config.js?v=__VERSION__";


/* =========================================================
   SAFE HTML
   html`<p>${value}</p>` escapes every interpolated value
   unless it is already SafeHtml (another html`` result) or
   an array of them. This keeps user text from ever becoming
   markup.
========================================================= */

class SafeHtml {

    constructor(value) {
        this.value = value;
    }

    toString() {
        return this.value;
    }

}


export function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

}


function renderValue(value) {

    if (value === null || value === undefined || value === false) {
        return "";
    }

    if (value instanceof SafeHtml) {
        return value.value;
    }

    if (Array.isArray(value)) {
        return value.map(renderValue).join("");
    }

    return escapeHtml(value);

}


export function html(strings, ...values) {

    let out = strings[0];

    values.forEach((value, index) => {
        out += renderValue(value) + strings[index + 1];
    });

    return new SafeHtml(out);

}


/*
    Trusted markup that is already safe (for example our own
    SVG snippets). Never pass user text to this.
*/

export function raw(markup) {
    return new SafeHtml(String(markup));
}


export function render(target, content) {

    if (!target) {
        return;
    }

    target.innerHTML = renderValue(content);

}


/* =========================================================
   DOM
========================================================= */

export function $(selector, root = document) {
    return root.querySelector(selector);
}


export function $all(selector, root = document) {
    return [...root.querySelectorAll(selector)];
}


/*
    Delegated events: on(root, "click", "[data-action=save]", fn)
*/

export function on(root, type, selector, handler) {

    root.addEventListener(type, (event) => {

        const match =
            event.target.closest?.(selector);

        if (match && root.contains(match)) {
            handler(event, match);
        }

    });

}


export function formValues(form) {

    const data = {};

    new FormData(form).forEach((value, key) => {
        data[key] = typeof value === "string" ? value.trim() : value;
    });

    form
        .querySelectorAll("input[type=checkbox][name]")
        .forEach((box) => {
            data[box.name] = box.checked;
        });

    return data;

}


/* =========================================================
   TEXT AND NUMBERS
========================================================= */

export function textOrNull(value) {

    const text =
        String(value ?? "").trim();

    return text ? text : null;

}


export function intOrNull(value) {

    if (value === null || value === undefined || value === "") {
        return null;
    }

    const number =
        Number.parseInt(value, 10);

    return Number.isFinite(number) ? number : null;

}


export function numberOrNull(value) {

    if (value === null || value === undefined || value === "") {
        return null;
    }

    const number =
        Number(value);

    return Number.isFinite(number) ? number : null;

}


export function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}


export function plural(count, one, many = `${one}s`) {
    return `${count} ${count === 1 ? one : many}`;
}


export function initials(name) {

    return String(name || "Reader")
        .trim()
        .charAt(0)
        .toUpperCase();

}


export function truncate(text, length = 140) {

    const value =
        String(text ?? "");

    return value.length > length
        ? `${value.slice(0, length - 1).trimEnd()}…`
        : value;

}


/* =========================================================
   DATES
========================================================= */

export function todayIso() {

    const now = new Date();

    const offset =
        now.getTimezoneOffset() * 60000;

    return new Date(now - offset)
        .toISOString()
        .slice(0, 10);

}


export function formatDate(value, options = {}) {

    if (!value) {
        return "";
    }

    // Plain dates (YYYY-MM-DD) are shown as that calendar day.
    const date =
        /^\d{4}-\d{2}-\d{2}$/.test(value)
            ? new Date(`${value}T12:00:00`)
            : new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        ...options
    });

}


export function formatDateTime(value) {

    if (!value) {
        return "";
    }

    return new Date(value).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
    });

}


export function yearOf(value) {

    if (!value) {
        return null;
    }

    return Number(String(value).slice(0, 4)) || null;

}


/* =========================================================
   READING
========================================================= */

export function statusLabel(id) {

    return READING_STATUSES.find((status) => status.id === id)?.label
        || "Want to Read";

}


export function progressPercent(book) {

    if (!book?.page_count || !book.current_page) {
        return 0;
    }

    return clamp(
        Math.round((book.current_page / book.page_count) * 100),
        0,
        100
    );

}


/* =========================================================
   TIMING
========================================================= */

export function debounce(fn, wait = 250) {

    let timer;

    return (...args) => {

        window.clearTimeout(timer);

        timer =
            window.setTimeout(() => fn(...args), wait);

    };

}


export function nextFrame() {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}


export function wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
}


export function prefersReducedMotion() {

    return document.documentElement.classList.contains("reduce-motion")
        || window.matchMedia("(prefers-reduced-motion: reduce)").matches;

}


/* =========================================================
   URL
========================================================= */

export function queryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
}


export function setQueryParam(name, value) {

    const url =
        new URL(window.location.href);

    if (value === null || value === undefined || value === "") {
        url.searchParams.delete(name);
    }

    else {
        url.searchParams.set(name, value);
    }

    window.history.replaceState(window.history.state, "", url);

}


/* =========================================================
   SEEDED RANDOM
   Gives stable "random" choices from a string, so a book's
   default design never changes between visits.
========================================================= */

export function seededRandom(seedText) {

    let seed = 0;

    for (const char of String(seedText)) {
        seed = (seed * 31 + char.charCodeAt(0)) % 2147483647;
    }

    seed = seed || 7;

    return () => {

        seed = (seed * 16807) % 2147483647;

        return (seed - 1) / 2147483646;

    };

}
