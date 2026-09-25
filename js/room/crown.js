/* =========================================================
   NOVELLOW
   BOOKCASE CROWN

   The little still life on top of the bookcase. Seven slots,
   filled from the current theme (a skull planter and a
   sleeping cat in the Original room, a bat in the Haunted
   Library, a globe in the Rainy London Library…).
========================================================= */

import { html, render } from "../core/helpers.js?v=__VERSION__";
import { getTheme } from "../shell/themes.js?v=__VERSION__";
import { growIvy } from "./ivy.js?v=__VERSION__";


const SLOTS = [
    "left",
    "frame",
    "candle",
    "portrait",
    "stack",
    "cat",
    "right"
];


function use(symbol, viewBox, className) {
    return html`<svg class="${className}" viewBox="${viewBox}"><use href="#${symbol}"></use></svg>`;
}


const PIECES = {

    skull: () => html`
        <div class="crown-piece crown-piece--skull">
            ${use("decor-plant", "0 0 60 78", "skull-plant")}
            ${use("decor-skull", "0 0 52 48", "skull-pot")}
            <svg class="ivy ivy--skull" viewBox="0 0 120 180" data-seed="8" data-density="15" data-leaf-size="0.62">
                <path class="ivy-stem" d="M22 24C8 44 16 72 6 100C0 118 6 138 2 156" />
            </svg>
        </div>
    `,

    globe: () => use("decor-globe", "0 0 56 76", "crown-piece crown-piece--globe"),

    mushrooms: () => use("decor-mushrooms", "0 0 64 52", "crown-piece crown-piece--mushrooms"),

    plant: () => use("decor-plant", "0 0 60 78", "crown-piece crown-piece--plant"),

    castle: () => use("frame-castle", "0 0 130 100", "crown-piece crown-piece--castle"),

    candle: () => use("decor-candle", "0 0 40 90", "crown-piece crown-piece--candle"),

    ghost: () => use("frame-ghost", "0 0 70 90", "crown-piece crown-piece--portrait"),

    bat: () => use("decor-bat", "0 0 84 46", "crown-piece crown-piece--bat"),

    stack: () => html`
        <div class="crown-piece crown-piece--stack">
            ${use("decor-teacup", "0 0 56 58", "stack-top")}
            ${use("decor-stack", "0 0 84 36", "stack-books")}
        </div>
    `,

    flowers: () => html`
        <div class="crown-piece crown-piece--stack">
            ${use("decor-flowers", "0 0 54 78", "stack-top stack-top--flowers")}
            ${use("decor-stack", "0 0 84 36", "stack-books")}
        </div>
    `,

    cat: () => use("scene-cat", "0 0 220 160", "crown-piece crown-piece--cat"),

    lantern: () => use("decor-lantern", "0 0 50 92", "crown-piece crown-piece--lantern")

};


export function renderCrown(container, themeId) {

    if (!container) {
        return;
    }

    const theme =
        getTheme(themeId);

    render(container, SLOTS.map((slot, index) => {

        const piece =
            PIECES[theme.crownDecor[index]];

        return piece
            ? html`<div class="crown-slot crown-slot--${slot}" data-slot="${slot}">${piece()}</div>`
            : "";

    }));

    growIvy(container);

}
