/* =========================================================
   NOVELLOW
   ROOM PREFERENCES

   Small, per-device choices about the room that don't need
   to follow the reader between devices: which cat lives in
   the library, and where ghosts float. Kept in localStorage
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

const DEFAULTS = {
    cat: "black",
    ghosts: "haunted"
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

    const { cat } =
        getPreferences();

    document.documentElement.dataset.cat =
        CATS.some((item) => item.id === cat) ? cat : "black";

}
