/* =========================================================
   NOVELLOW
   SOUND MIXER

   The controls for the soundscape: on/off, volume, "match
   the room", and a slider for each sound. Used in the header
   menu on every page and on the Settings page.
========================================================= */

import { html, render } from "../core/helpers.js?v=__VERSION__";

import {
    SOUNDS,
    getSoundState,
    setSoundOn,
    setVolume,
    setMatchRoom,
    setLevel
} from "./soundscape.js?v=__VERSION__";


function percent(value) {
    return Math.round((value || 0) * 100);
}


function markup(sound) {

    return html`

        <label class="toggle">
            <span class="toggle__text">
                <strong>Room sounds</strong>
                <small>${sound.waiting ? "Tap anywhere on the page to begin." : "Rain, fire, teacups and a purring cat."}</small>
            </span>
            <input type="checkbox" data-sound="on" ${sound.on ? html`checked` : ""}>
        </label>

        <div class="mixer__body" ${sound.on ? "" : html`hidden`}>

            <label class="mixer__slider mixer__slider--main">
                <span>Volume</span>
                <input type="range" min="0" max="100" step="1" value="${percent(sound.volume)}" data-sound="volume" aria-label="Volume">
            </label>

            <label class="check mixer__match">
                <input type="checkbox" data-sound="match" ${sound.matchRoom ? html`checked` : ""}>
                <span>Match the room <small class="muted">(each theme has its own sounds)</small></span>
            </label>

            <div class="mixer__sounds" role="group" aria-label="Individual sounds">
                ${SOUNDS.map((item) => html`
                    <label class="mixer__slider" title="${item.note}">
                        <span>${item.name}</span>
                        <input type="range" min="0" max="100" step="1" value="${percent(sound.levels[item.id])}" data-sound-level="${item.id}" aria-label="${item.name}: ${item.note}">
                    </label>
                `)}
            </div>

        </div>

    `;

}


/*
    Fills `container` with the mixer and keeps it up to date
    when the sound changes elsewhere (another mixer, a theme).
*/

export function mountMixer(container) {

    if (!container) {
        return;
    }

    const draw = () => {

        // Don't redraw under a slider that is being dragged.
        if (container.contains(document.activeElement) && document.activeElement.type === "range") {
            return;
        }

        // Keep keyboard focus on the same control after redrawing.
        const focused =
            container.contains(document.activeElement)
                ? document.activeElement.dataset.sound
                : null;

        render(container, markup(getSoundState()));

        if (focused) {
            container.querySelector(`[data-sound="${focused}"]`)?.focus();
        }

    };

    draw();

    container.addEventListener("input", (event) => {

        const target =
            event.target;

        if (target.dataset.sound === "volume") {
            setVolume(target.value / 100);
        }

        if (target.dataset.soundLevel) {

            setLevel(target.dataset.soundLevel, target.value / 100);

            const match =
                container.querySelector("[data-sound=match]");

            if (match) {
                match.checked = false;
            }

        }

    });

    container.addEventListener("change", (event) => {

        const target =
            event.target;

        if (target.dataset.sound === "on") {

            const worked =
                setSoundOn(target.checked);

            if (!worked) {
                target.checked = false;
            }

            draw();

        }

        if (target.dataset.sound === "match") {
            setMatchRoom(target.checked);
            draw();
        }

    });

    document.addEventListener("novellow:sound", draw);

}
