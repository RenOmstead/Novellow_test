/* =========================================================
   NOVELLOW
   AMBIENCE

   The life of the room on the dashboard: floating dust,
   fog, fireflies, rain on the window, and now and then a
   small oddity (a ghost drifting past, a bat at the window,
   a book that shuffles on its shelf, the cat dreaming).

   Everything follows the classes applyAppearance() puts on
   <html> (ambient-dust, ambient-rain, ambient-fog,
   ambient-fireflies, ambient-oddities, reduce-motion) and
   the decoration density, and never takes clicks.
========================================================= */

import { getTheme } from "../shell/themes.js?v=__VERSION__";
import { prefersReducedMotion } from "../core/helpers.js?v=__VERSION__";


const COUNTS = {
    sparse: { dust: 8, fireflies: 7 },
    cozy: { dust: 16, fireflies: 12 },
    abundant: { dust: 26, fireflies: 18 }
};

// Which oddities feel at home in which room.
const ODDITIES = {
    original: ["ghost", "bat", "book", "cat", "star"],
    haunted: ["ghost", "ghost", "bat", "book", "cat", "candle"],
    rainy: ["lightning", "book", "cat", "candle"],
    forest: ["leaf", "leaf", "star", "book", "cat"],
    cafe: ["book", "cat", "star", "candle"],
    gothic: ["bat", "bat", "ghost", "book", "candle"]
};

let layer = null;
let windowWeather = null;
let oddityTimer = null;


function root() {
    return document.documentElement;
}


function random(min, max) {
    return min + Math.random() * (max - min);
}


function svgUse(symbol, viewBox, className) {
    return `<svg class="${className}" viewBox="${viewBox}" aria-hidden="true"><use href="#${symbol}"></use></svg>`;
}


/* =========================================================
   DUST, FOG AND FIREFLIES
========================================================= */

function build() {

    const density =
        COUNTS[root().dataset.density] || COUNTS.cozy;

    let markup =
        "";

    for (let index = 0; index < density.dust; index += 1) {

        markup += `<span class="dust-mote" style="left: ${random(4, 96).toFixed(1)}%; top: ${random(10, 90).toFixed(1)}%; --size: ${random(2, 4.5).toFixed(1)}px; --drift: ${random(-40, 40).toFixed(0)}px; animation-duration: ${random(14, 26).toFixed(1)}s; animation-delay: -${random(0, 20).toFixed(1)}s"></span>`;

    }

    markup += `
        <div class="fog-bank fog-bank--back"></div>
        <div class="fog-bank fog-bank--front"></div>
    `;

    for (let index = 0; index < density.fireflies; index += 1) {

        markup += `<span class="firefly" style="left: ${random(3, 97).toFixed(1)}%; top: ${random(25, 95).toFixed(1)}%; --dx: ${random(-70, 70).toFixed(0)}px; --dy: ${random(-60, 40).toFixed(0)}px; animation-duration: ${random(7, 13).toFixed(1)}s, ${random(1.8, 3.4).toFixed(1)}s; animation-delay: -${random(0, 10).toFixed(1)}s, -${random(0, 3).toFixed(1)}s"></span>`;

    }

    layer.innerHTML = markup;

}


/* =========================================================
   THE WINDOW
   Rain, lightning and shooting stars happen inside the
   glass of the moon window, clipped to its arch.
========================================================= */

function buildWindow() {

    const wall =
        document.querySelector(".wall-art");

    if (!wall || windowWeather) {
        return;
    }

    // The arch of the glass, in the window's own proportions.
    wall.insertAdjacentHTML("beforeend", `
        <svg class="window-clip-defs" width="0" height="0" aria-hidden="true" focusable="false">
            <clipPath id="windowGlassBox" clipPathUnits="objectBoundingBox">
                <path d="M0.0909 1V0.4606A0.4091 0.3818 0 0 1 0.9091 0.4606V1Z" />
            </clipPath>
        </svg>
        <div class="window-weather">
            <span class="window-weather__rain"></span>
            <span class="window-weather__rain window-weather__rain--near"></span>
            <span class="window-weather__drop" style="left: 22%; animation-delay: -1s"></span>
            <span class="window-weather__drop" style="left: 47%; animation-delay: -4s"></span>
            <span class="window-weather__drop" style="left: 71%; animation-delay: -2.5s"></span>
        </div>
    `);

    windowWeather =
        wall.querySelector(".window-weather");

}


/*
    Some rooms hang different pictures on the wall.
*/

function hangFrames(theme) {

    const frames = {
        moth: "frame-moth",
        castle: "frame-castle",
        charm: "decor-starcharm",
        ...(theme.wallArt || {})
    };

    Object.entries(frames).forEach(([slot, symbol]) => {

        const use =
            document.querySelector(`.wall-frame--${slot} use`);

        if (use && use.getAttribute("href") !== `#${symbol}`) {
            use.setAttribute("href", `#${symbol}`);
        }

    });

}


/* =========================================================
   ODDITIES
========================================================= */

function flyAcross(symbol, viewBox, className, duration) {

    layer.insertAdjacentHTML("beforeend", svgUse(symbol, viewBox, `oddity ${className}`));

    const creature =
        layer.lastElementChild;

    creature.style.top = `${random(12, 55).toFixed(0)}%`;
    creature.style.animationDuration = `${duration}s`;

    if (Math.random() < 0.5) {
        creature.classList.add("oddity--leftward");
    }

    creature.addEventListener("animationend", () => creature.remove(), { once: true });

}


function briefly(element, className, ms) {

    if (!element) {
        return;
    }

    element.classList.add(className);

    window.setTimeout(() => element.classList.remove(className), ms);

}


const HAPPENINGS = {

    ghost: () => flyAcross("decor-ghost", "0 0 44 54", "oddity--ghost", 16),

    bat: () => flyAcross("decor-bat", "0 0 84 46", "oddity--bat", 7),

    book: () => {

        const spines =
            [...document.querySelectorAll(".book-spine:not(.is-selected)")];

        if (spines.length) {
            briefly(spines[Math.floor(Math.random() * spines.length)], "is-shuffling", 1400);
        }

    },

    cat: () => {

        const cat =
            document.querySelector(".crown-piece--cat");

        if (!cat) {
            return;
        }

        const box =
            cat.getBoundingClientRect();

        const layerBox =
            layer.getBoundingClientRect();

        for (let index = 0; index < 3; index += 1) {

            layer.insertAdjacentHTML("beforeend", `<span class="oddity oddity--z" style="left: ${box.left - layerBox.left + box.width * 0.62}px; top: ${box.top - layerBox.top + box.height * 0.2}px; animation-delay: ${index * 0.7}s">z</span>`);

            const z =
                layer.lastElementChild;

            z.addEventListener("animationend", () => z.remove(), { once: true });

        }

    },

    candle: () => {
        document.querySelectorAll(".sill-candle, .crown-piece--candle").forEach((candle) => briefly(candle, "is-flaring", 1600));
    },

    star: () => {

        if (!windowWeather) {
            return;
        }

        windowWeather.insertAdjacentHTML("beforeend", `<span class="shooting-star" style="top: ${random(8, 30).toFixed(0)}%; left: ${random(20, 60).toFixed(0)}%"></span>`);

        const star =
            windowWeather.lastElementChild;

        star.addEventListener("animationend", () => star.remove(), { once: true });

    },

    lightning: () => briefly(windowWeather, "is-lightning", 900),

    leaf: () => {

        for (let index = 0; index < 3; index += 1) {

            layer.insertAdjacentHTML("beforeend", `<span class="oddity oddity--leaf" style="left: ${random(10, 90).toFixed(0)}%; animation-delay: ${(index * 1.3).toFixed(1)}s; --sway: ${random(-80, 80).toFixed(0)}px"></span>`);

            const leaf =
                layer.lastElementChild;

            leaf.addEventListener("animationend", () => leaf.remove(), { once: true });

        }

    }

};


function scheduleOddity() {

    window.clearTimeout(oddityTimer);

    oddityTimer =
        window.setTimeout(() => {

            const allowed =
                root().classList.contains("ambient-oddities")
                && !prefersReducedMotion()
                && !document.hidden;

            if (allowed) {

                const choices =
                    ODDITIES[root().dataset.theme] || ODDITIES.original;

                HAPPENINGS[choices[Math.floor(Math.random() * choices.length)]]?.();

            }

            scheduleOddity();

        }, random(22000, 48000));

}


/* =========================================================
   START
========================================================= */

export function startAmbience(container) {

    layer = container;

    if (!layer) {
        return;
    }

    build();
    buildWindow();
    hangFrames(getTheme(root().dataset.theme));
    scheduleOddity();

    document.addEventListener("novellow:appearance", (event) => {

        build();

        hangFrames(event.detail.theme);

    });

}


/*
    For trying an oddity from the console:
    import("./js/room/ambience.js").then((m) => m.happen("ghost"))
*/

export function happen(name) {
    HAPPENINGS[name]?.();
}
