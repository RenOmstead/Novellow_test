/* =========================================================
   NOVELLOW
   A FONT PICKER

   Every font as a little sample written in it, grouped as
   classic, storybook, handwritten and gothic, so a font is
   seen before it's chosen. Radio buttons underneath, so it
   works in any form: the book designer (the title on the
   spine) and Settings (the writing in the journal).
========================================================= */

import { html } from "../core/helpers.js?v=__VERSION__";
import { FONT_GROUPS, SPINE_FONTS } from "./spine-options.js?v=__VERSION__";


export function fontPickerMarkup({ name, current, sample = "Once upon a time", label = "Font", pref = false }) {

    return html`
        <fieldset class="font-picker">
            <legend class="field__label">${label}</legend>
            ${FONT_GROUPS.map((group) => html`
                <p class="font-picker__group">${group.label}</p>
                <div class="font-picker__grid">
                    ${SPINE_FONTS.filter((font) => font.group === group.id).map((font) => html`
                        <label class="font-picker__option" title="${font.label}">
                            <input class="visually-hidden" type="radio" name="${name}" value="${font.id}" ${font.id === current ? html`checked` : ""} ${pref ? html`data-pref="${name}"` : ""}>
                            <span class="font-picker__sample" style="font-family: ${font.family}" data-font-sample>${sample}</span>
                            <small>${font.label.split(" — ")[0]}</small>
                        </label>
                    `)}
                </div>
            `)}
        </fieldset>
    `;

}
