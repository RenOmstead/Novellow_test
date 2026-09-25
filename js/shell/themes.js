/* =========================================================
   NOVELLOW
   THEMES

   Each theme is a different illustrated room built on the
   same layout: its own wall, wood, night sky, lighting,
   typography accents, ivy, weather and decorations.
   The colours and fonts live in css/themes.css under
   [data-theme="…"]; this file holds everything else.
========================================================= */

import { applyPreferences } from "./preferences.js?v=__VERSION__";


export const THEMES = [

    {
        id: "original",
        pictures: { landscape: "pic-castle", portrait: "pic-moth" },
        lamp: "scene-lamp",
        name: "Novellow Original",
        description: "A candle-lit reading room with ivy, a sleeping cat and a moonlit village outside.",
        swatch: ["#7c4d38", "#3b2231", "#c47f82", "#f0cf8a"],
        ivy: "ivy",
        weather: { rain: false, fog: false, fireflies: false },
        crownDecor: []
    },

    {
        id: "haunted",
        pictures: { landscape: "pic-haunted-house", portrait: "pic-ghost" },
        lamp: "lamp-chandelier",
        name: "Haunted Library",
        description: "Cobwebs in every corner, ghosts drifting past the shelves, a bubbling cauldron and a full moon at the window.",
        swatch: ["#3f3a4d", "#1f1a26", "#8e86a8", "#d8d0ea"],
        ivy: "forest",
        weather: { rain: false, fog: true, fireflies: false },
        crownDecor: []
    },

    {
        id: "rainy",
        pictures: { landscape: "pic-london-rain", portrait: "pic-umbrella" },
        lamp: "lamp-pendant",
        name: "Rainy London Library",
        description: "Grey rain on the glass, green reading lamps and a pot of tea gone cold beside the fire.",
        swatch: ["#4d5660", "#262c33", "#8aa0a8", "#d9c79a"],
        ivy: "forest",
        weather: { rain: true, fog: false, fireflies: false },
        crownDecor: []
    },

    {
        id: "forest",
        pictures: { landscape: "pic-forest-glade", portrait: "pic-toadstool" },
        lamp: "lamp-jar",
        name: "Enchanted Forest",
        description: "A reading nook grown out of an old oak: moss, toadstools and fireflies at dusk.",
        swatch: ["#4a5a3c", "#26301f", "#b98ab2", "#e8d98a"],
        ivy: "forest",
        weather: { rain: false, fog: false, fireflies: true },
        crownDecor: []
    },

    {
        id: "cafe",
        pictures: { landscape: "pic-paris-cafe", portrait: "pic-teapot" },
        lamp: "lamp-pendant",
        name: "Cozy Study Café",
        description: "Dark wood, warm amber lamps, and the steam from a fresh cup of coffee.",
        swatch: ["#5a3f30", "#2a1c15", "#c9955f", "#f1dcb6"],
        ivy: "ivy",
        weather: { rain: false, fog: false, fireflies: false },
        crownDecor: []
    },

    {
        id: "gothic",
        pictures: { landscape: "pic-cathedral", portrait: "pic-rose" },
        lamp: "lamp-chandelier",
        name: "Romantic Gothic",
        description: "Deep burgundy velvet, black roses, tall candelabras and a crescent moon over the spires.",
        swatch: ["#3a1c24", "#1a0d12", "#a8354e", "#e8c27c"],
        ivy: "autumn",
        weather: { rain: false, fog: true, fireflies: false },
        crownDecor: []
    }

];


export function getTheme(id) {
    return THEMES.find((theme) => theme.id === id) || THEMES[0];
}


/* =========================================================
   APPLYING SETTINGS
   Theme and ambience become attributes/classes on <html>,
   so every stylesheet can respond to them.
========================================================= */

const PREFERENCE_CACHE =
    "novellow-appearance";


export function applyAppearance(settings) {

    const root =
        document.documentElement;

    const theme =
        getTheme(settings.theme);

    const rain =
        settings.rain === null || settings.rain === undefined
            ? theme.weather.rain
            : settings.rain;

    root.dataset.theme = theme.id;

    applyPreferences();
    root.dataset.ivy = theme.ivy;
    root.dataset.density = settings.decoration_density || "cozy";

    root.classList.toggle("candle-glow", settings.candle_glow !== false);
    root.classList.toggle("ambient-dust", settings.dust !== false);
    root.classList.toggle("ambient-rain", Boolean(rain));
    root.classList.toggle("ambient-fog", theme.weather.fog);
    root.classList.toggle("ambient-fireflies", theme.weather.fireflies);
    root.classList.toggle("ambient-oddities", settings.oddities !== false);
    root.classList.toggle("reduce-motion", Boolean(settings.reduced_motion));

    pauseDrawnAnimations(
        Boolean(settings.reduced_motion)
        || window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );

    // A harmless UI cache so the right room shows before the
    // settings arrive from Supabase on the next visit.
    try {

        localStorage.setItem(PREFERENCE_CACHE, JSON.stringify({
            theme: theme.id,
            decoration_density: settings.decoration_density,
            candle_glow: settings.candle_glow,
            dust: settings.dust,
            rain: settings.rain,
            oddities: settings.oddities,
            reduced_motion: settings.reduced_motion
        }));

    }

    catch {
        // Private browsing: nothing to cache.
    }

    document.dispatchEvent(new CustomEvent("novellow:appearance", { detail: { theme, settings } }));

}


/*
    The illustrations animate with SMIL (the cat's tail, the
    lamp, candle flames), which CSS can't stop. Pausing every
    outer <svg> stills them, including ones drawn later.
*/

let drawnObserver = null;

function pauseDrawnAnimations(paused) {

    const apply = () => {

        document.querySelectorAll("svg").forEach((svg) => {

            if (svg.ownerSVGElement || typeof svg.pauseAnimations !== "function") {
                return;
            }

            if (paused) {
                svg.pauseAnimations();
            }

            else {
                svg.unpauseAnimations();
            }

        });

    };

    apply();

    if (paused && !drawnObserver && document.body) {

        let queued = false;

        drawnObserver = new MutationObserver(() => {

            if (queued) {
                return;
            }

            queued = true;

            requestAnimationFrame(() => {
                queued = false;
                apply();
            });

        });

        drawnObserver.observe(document.body, { childList: true, subtree: true });

    }

    if (!paused && drawnObserver) {
        drawnObserver.disconnect();
        drawnObserver = null;
    }

}


export function applyCachedAppearance() {

    try {

        const cached =
            JSON.parse(localStorage.getItem(PREFERENCE_CACHE) || "null");

        if (cached) {
            applyAppearance(cached);
        }

    }

    catch {
        // Ignore a damaged cache.
    }

}
