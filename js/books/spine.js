/* =========================================================
   NOVELLOW
   BOOK SPINES

   Draws a book's spine from its saved design. Used on the
   shelves, in the book editor's live preview, and anywhere
   a small spine appears.
========================================================= */

import { html, raw } from "../core/helpers.js?v=__VERSION__";

import {
    normalizeSpine,
    spineWidth,
    spineHeight,
    spineFont,
    FONT_SIZES,
    FONT_WEIGHTS,
    LETTER_SPACING,
    MOTIF_VIEWBOX
} from "./spine-options.js?v=__VERSION__";


function motif(name, className) {

    if (!name || name === "none" || !MOTIF_VIEWBOX[name]) {
        return "";
    }

    return raw(
        `<svg class="${className}" viewBox="${MOTIF_VIEWBOX[name]}" aria-hidden="true"><use href="#motif-${name}"></use></svg>`
    );

}


/*
    Chooses how the title sits on the spine. It tries, in order:
    one line with the ornament, then wrapping between words on
    thicker books, then giving up the ornament for more room,
    shrinking the letters down to a readable minimum. Words are
    never split in the middle.
*/

function linesNeeded(words, perLine) {

    let lines = 1;
    let used = 0;

    for (const word of words) {

        if (word.length > perLine) {
            return Infinity;
        }

        const next =
            used === 0 ? word.length : used + 1 + word.length;

        if (next > perLine) {
            lines += 1;
            used = word.length;
        }

        else {
            used = next;
        }

    }

    return lines;

}


function fitTitle(title, spine, baseSize, height, width) {

    const words =
        title.split(/\s+/).filter(Boolean);

    const perLetter =
        spine.textCase === "upper" || spine.spacing === "wide" ? 0.68 : 0.56;

    const panelSpace =
        spine.panel === "none" || spine.panel === "ribbon" ? 0 : 14;

    const withOrnament =
        spine.style !== "vine" && spine.ornament !== "none";

    const attempts = [];

    if (withOrnament) {
        attempts.push({ reserved: 50 + panelSpace, ornament: true });
    }

    attempts.push({ reserved: 26 + panelSpace, ornament: false });

    for (const attempt of attempts) {

        const available =
            Math.max(36, height - attempt.reserved);

        const minSize =
            attempt.ornament ? 11 : 10;

        for (let size = baseSize; size >= minSize; size -= 1) {

            const maxLines =
                Math.max(1, Math.min(3, Math.floor((width - 12) / (size * 1.15))));

            const perLine =
                Math.floor(available / (size * perLetter));

            const lines =
                linesNeeded(words, perLine);

            if (lines <= maxLines) {
                return { size, lines, ornament: attempt.ornament };
            }

        }

    }

    return {
        size: 10,
        lines: Math.max(1, Math.min(3, Math.floor((width - 12) / 11.5))),
        ornament: false
    };

}


/*
    spineMarkup(book, options)
      options.tag      "button" (shelf) or "div" (preview)
      options.extra    extra class names
*/

export function spineMarkup(book, { tag = "button", extra = "" } = {}) {

    const spine =
        normalizeSpine(book.spine, book.title || book.id);

    const width =
        spineWidth(spine);

    const height =
        spineHeight(spine);

    const baseSize =
        FONT_SIZES.find((item) => item.id === spine.size)?.px || 14;

    const title =
        (book.title || "Untitled").trim();

    const fit =
        fitTitle(title, spine, baseSize, height, width);

    const style = [
        `--book-color: ${spine.color}`,
        `--book-accent: ${spine.accent}`,
        `--book-text: ${spine.text}`,
        `--w: ${width}px`,
        `--h: ${height}px`,
        `--spine-font: ${spineFont(spine)}`,
        `--spine-size: ${fit.size}px`,
        `--spine-lines: ${fit.lines}`,
        `--spine-weight: ${FONT_WEIGHTS.find((item) => item.id === spine.weight)?.value || 400}`,
        `--spine-spacing: ${LETTER_SPACING.find((item) => item.id === spine.spacing)?.value || "0.04em"}`,
        `--spine-style: ${spine.fontStyle === "italic" ? "italic" : "normal"}`
    ].join("; ");

    const classes = [
        "book-spine",
        `spine--${spine.style}`,
        `spine-panel--${spine.panel}`,
        `spine-case--${spine.textCase}`,
        `spine-align--${spine.align}`,
        `spine-thickness--${spine.thickness}`,
        book.status === "reading" ? "is-reading" : "",
        extra
    ].filter(Boolean).join(" ");

    const label =
        `${title}${book.author ? ` by ${book.author}` : ""}`;

    const inner = html`
        <span class="spine-band spine-band--top" aria-hidden="true"></span>

        ${spine.style === "vine"
            ? motif("leafvine", "spine-vine")
            : fit.ornament ? motif(spine.ornament, "spine-ornament spine-ornament--top") : ""}

        <span class="spine-title-wrap">
            <span class="spine-title">${title}</span>
        </span>

        ${fit.ornament && spine.thickness !== "slim" && fit.lines === 1 && height >= 118
            ? motif(spine.ornament === "none" ? "" : "star", "spine-ornament spine-ornament--bottom")
            : ""}

        <span class="spine-band spine-band--bottom" aria-hidden="true"></span>
    `;

    if (tag === "button") {

        return html`
            <button
                class="${classes}"
                type="button"
                style="${style}"
                data-book-id="${book.id}"
                aria-label="${label}"
                title="${label}"
            >${inner}</button>
        `;

    }

    return html`
        <div class="${classes}" style="${style}" aria-hidden="true">${inner}</div>
    `;

}


/*
    Width a spine takes on a shelf (used to pack rows).
*/

export function spineFootprint(book) {
    return spineWidth(normalizeSpine(book.spine, book.title || book.id));
}


/* =========================================================
   MEASURED FITTING
   Estimates can't know every font's letter widths, so after
   spines are placed, each title is measured and shrunk until
   it truly fits. The ornament is given up only if needed.
========================================================= */

function overflowing(title) {

    const room =
        title.parentElement.clientHeight;

    return title.scrollHeight > Math.min(title.clientHeight, room) + 1
        || title.scrollWidth > title.clientWidth + 1;

}


function fitOne(spine) {

    const title =
        spine.querySelector(".spine-title");

    if (!title) {
        return;
    }

    const width =
        spine.clientWidth;

    const startSize =
        parseFloat(getComputedStyle(spine).getPropertyValue("--spine-size")) || 14;

    const tryFit = () => {

        let size = startSize;

        while (size >= 9) {

            const lines =
                Math.max(1, Math.min(3, Math.floor((width - 8) / (size * 1.12))));

            spine.style.setProperty("--spine-size", `${size}px`);
            spine.style.setProperty("--spine-lines", String(lines));

            if (!overflowing(title)) {
                return true;
            }

            size -= 0.5;

        }

        return false;

    };

    if (tryFit()) {
        return;
    }

    // Still too long: give the title the ornament's space…
    spine.classList.add("spine--compact");

    if (tryFit()) {
        return;
    }

    // …then close up the letter spacing and the panel's padding.
    spine.style.setProperty("--spine-spacing", "0");
    spine.classList.add("spine--tight");

    if (!tryFit()) {
        spine.classList.add("spine--trimmed");
    }

}


export function fitSpineTitles(root) {

    const spines =
        [...root.querySelectorAll(".book-spine")];

    spines.forEach(fitOne);

    // Fonts can arrive after the first layout; fit again then.
    if (document.fonts?.status !== "loaded") {
        document.fonts?.ready.then(() => spines.forEach(fitOne));
    }

}

