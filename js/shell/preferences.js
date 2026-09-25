/* =========================================================
   NOVELLOW
   ROOM PREFERENCES

   Small, per-device choices about the room that don't need
   to follow the reader between devices: which cat lives in
   the library, where ghosts float, the curtains and the rug. Kept in localStorage
   (sound has its own, in js/sound/soundscape.js).
========================================================= */

const STORE =
    "novellow-room";

export const CATS = [
    { id: "black", name: "Black cat" },
    { id: "orange", name: "Orange cat" },
    { id: "tabby", name: "Tabby" },
    { id: "calico", name: "Calico" },
    { id: "fluffy", name: "Fluffy grey and white" },
    { id: "white", name: "White cat" },
    { id: "tuxedo", name: "Tuxedo" }
];

export const GHOST_CHOICES = [
    { id: "haunted", name: "Only in the Haunted Library" },
    { id: "always", name: "In every room" },
    { id: "never", name: "Never" }
];

export const CURTAINS = [
    { id: "drapes", name: "Velvet drapes, tied back" },
    { id: "lace", name: "Sheer lace" },
    { id: "cafe", name: "Café curtains" },
    { id: "none", name: "No curtains" }
];

export const RUGS = [
    { id: "oval", name: "Round, with flowers" },
    { id: "persian", name: "Rectangle, with tassels" },
    { id: "braided", name: "Round braided" },
    { id: "none", name: "No rug" }
];

const DEFAULTS = {
    cat: "black",
    ghosts: "haunted",
    curtains: "drapes",
    rug: "oval"
};


export function getPreferences() {

    try {
        return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORE) || "{}") };
    }

    catch {
        return { ...DEFAULTS };
    }

}


export function setPreference(key, value) {

    const next =
        { ...getPreferences(), [key]: value };

    try {
        localStorage.setItem(STORE, JSON.stringify(next));
    }

    catch {
        // Private browsing: the choice lasts for this visit.
    }

    applyPreferences();

    document.dispatchEvent(new CustomEvent("novellow:preferences", { detail: next }));

    return next;

}


export function applyPreferences() {

    const { cat, curtains, rug } =
        getPreferences();

    const root =
        document.documentElement;

    root.dataset.cat = CATS.some((item) => item.id === cat) ? cat : "black";
    root.dataset.curtains = CURTAINS.some((item) => item.id === curtains) ? curtains : "drapes";
    root.dataset.rug = RUGS.some((item) => item.id === rug) ? rug : "oval";

}
