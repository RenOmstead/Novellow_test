/* =========================================================
   NOVELLOW
   BOOK COVERS (display)

   Shows a book's uploaded cover, or an illustrated cover in
   the book's own colours with its title, when there isn't one.
========================================================= */

import { html } from "../core/helpers.js?v=__VERSION__";
import { cachedCoverUrl } from "../core/covers.js?v=__VERSION__";
import { normalizeSpine, spineFont, MOTIF_VIEWBOX } from "./spine-options.js?v=__VERSION__";


/*
    coverMarkup(book, { size })
      size: "large" (journal), "medium" (cards), "small" (lists)
    Call coverUrls() for the visible books first so the
    uploaded covers are already available.
*/

export function coverMarkup(book, { size = "medium", className = "" } = {}) {

    const url =
        cachedCoverUrl(book.cover_path);

    const title =
        book.title || "Untitled";

    if (url) {

        return html`
            <div class="book-cover book-cover--${size} book-cover--photo ${className}">
                <img src="${url}" alt="Cover of ${title}" loading="lazy" decoding="async">
            </div>
        `;

    }

    const spine =
        normalizeSpine(book.spine, book.title || book.id);

    const ornament =
        spine.ornament !== "none" && MOTIF_VIEWBOX[spine.ornament]
            ? spine.ornament
            : "moon";

    return html`
        <div
            class="book-cover book-cover--${size} book-cover--drawn ${className}"
            style="--cover-sky: ${spine.color}; --book-accent: ${spine.accent}; --cover-font: ${spineFont(spine)}"
            role="img"
            aria-label="Illustrated cover of ${title}"
        >
            <svg class="book-cover__art" viewBox="0 0 200 300" aria-hidden="true"><use href="#cover-art"></use></svg>

            <svg class="book-cover__ornament" viewBox="${MOTIF_VIEWBOX[ornament]}" aria-hidden="true"><use href="#motif-${ornament}"></use></svg>

            <span class="book-cover__title">${title}</span>

            ${book.author ? html`<span class="book-cover__author">${book.author}</span>` : ""}
        </div>
    `;

}
