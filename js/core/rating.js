/* =========================================================
   NOVELLOW
   STAR RATINGS

   ratingMarkup() draws stars; with { name } it becomes an
   input: click the left half of a star for a half star, the
   right half for a whole one, or use the arrow keys.
   wireRatings(root) makes those inputs work.
========================================================= */

import { html, clamp } from "./helpers.js?v=__VERSION__";


function starSymbol(value, index) {

    if (value >= index) {
        return "ui-star";
    }

    if (value >= index - 0.5) {
        return "ui-star-half";
    }

    return "ui-star-empty";

}


function describe(value) {

    return value
        ? `${value} out of 5 stars`
        : "Not rated yet";

}


export function ratingMarkup(value, { name = "", label = "Rating" } = {}) {

    const rating =
        Number(value) || 0;

    if (!name) {

        return html`
            <span class="star-rating" role="img" aria-label="${describe(rating)}">
                ${[1, 2, 3, 4, 5].map((index) => html`
                    <svg aria-hidden="true"><use href="#${starSymbol(rating, index)}"></use></svg>
                `)}
            </span>
        `;

    }

    return html`
        <span
            class="star-rating star-rating--input"
            role="slider"
            tabindex="0"
            aria-label="${label}"
            aria-valuemin="0"
            aria-valuemax="5"
            aria-valuenow="${rating}"
            aria-valuetext="${describe(rating)}"
            data-rating-input
        >
            <input type="hidden" name="${name}" value="${rating || ""}">
            ${[1, 2, 3, 4, 5].map((index) => html`
                <button class="star-rating__button" type="button" tabindex="-1" data-star="${index}" aria-label="${index} stars">
                    <svg aria-hidden="true"><use href="#${starSymbol(rating, index)}"></use></svg>
                </button>
            `)}
            <button class="text-button star-rating__clear" type="button" tabindex="-1" data-star-clear>Clear</button>
        </span>
    `;

}


function setRating(widget, value) {

    const rating =
        clamp(Math.round(value * 2) / 2, 0, 5);

    widget.querySelector("input").value = rating || "";

    widget.setAttribute("aria-valuenow", String(rating));
    widget.setAttribute("aria-valuetext", describe(rating));

    widget
        .querySelectorAll("[data-star]")
        .forEach((button) => {

            button
                .querySelector("use")
                .setAttribute("href", `#${starSymbol(rating, Number(button.dataset.star))}`);

        });

    widget.dispatchEvent(new CustomEvent("rating-change", { bubbles: true, detail: { value: rating } }));

    // Let forms react as if a field changed.
    widget.querySelector("input").dispatchEvent(new Event("input", { bubbles: true }));

}


export function wireRatings(root) {

    root
        .querySelectorAll("[data-rating-input]:not([data-wired])")
        .forEach((widget) => {

            widget.dataset.wired = "true";

            widget.addEventListener("click", (event) => {

                if (event.target.closest("[data-star-clear]")) {
                    setRating(widget, 0);
                    return;
                }

                const star =
                    event.target.closest("[data-star]");

                if (!star) {
                    return;
                }

                const box =
                    star.getBoundingClientRect();

                const leftHalf =
                    event.clientX && event.clientX < box.left + box.width / 2;

                setRating(widget, Number(star.dataset.star) - (leftHalf ? 0.5 : 0));

            });

            widget.addEventListener("keydown", (event) => {

                const current =
                    Number(widget.querySelector("input").value) || 0;

                const steps = {
                    ArrowRight: 0.5,
                    ArrowUp: 0.5,
                    ArrowLeft: -0.5,
                    ArrowDown: -0.5
                };

                if (event.key in steps) {

                    event.preventDefault();

                    setRating(widget, current + steps[event.key]);

                }

                if (event.key === "Home") {
                    setRating(widget, 0);
                }

                if (event.key === "End") {
                    setRating(widget, 5);
                }

            });

        });

}
