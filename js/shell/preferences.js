/* =========================================================
   NOVELLOW
   ROOM PREFERENCES

   Small, per-device choices about the room that don't need
   to follow the reader between devices: which cat lives in
   the library, where ghosts float, the curtains, the rug, and
   the mug or tea set on the table. Kept in localStorage
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

export const WINDOW_SHAPES = [
    { id: "arched", name: "Arched" },
    { id: "square", name: "Square" },
    { id: "gothic", name: "Gothic, pointed" }
];

export const WOODS = [
    { id: "walnut", name: "Walnut" },
    { id: "oak", name: "Oak" },
    { id: "mahogany", name: "Mahogany" },
    { id: "ebony", name: "Ebony" },
    { id: "white", name: "Painted white" },
    { id: "sage", name: "Painted sage" }
];

export const MUGS = [
    { id: "plain", name: "A plain mug" },
    { id: "cat", name: "A cat mug" },
    { id: "floral", name: "A flowered mug" },
    { id: "stripes", name: "A striped mug" },
    { id: "moon", name: "A moon-and-stars mug" },
    { id: "teacup", name: "A teacup and saucer" }
];

export const CHINA_COLOURS = [
    { id: "rose", name: "Rose" },
    { id: "sage", name: "Sage" },
    { id: "blue", name: "Cornflower blue" },
    { id: "cream", name: "Cream" },
    { id: "plum", name: "Plum" },
    { id: "charcoal", name: "Charcoal" }
];

export const TEASETS = [
    { id: "gold", name: "Gilded filigree" },
    { id: "floral", name: "Painted roses" },
    { id: "dots", name: "Polka dots" },
    { id: "stripes", name: "Stripes" }
];

const DEFAULTS = {
    cat: "black",
    ghosts: "haunted",
    curtains: "drapes",
    rug: "oval",
    window: "arched",
    wood: "walnut",
    mug: "plain",
    china: "rose",
    teaset: "gold"
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

    const { cat, curtains, rug, mug, china, teaset, window: shape, wood } =
        getPreferences();

    const root =
        document.documentElement;

    root.dataset.cat = CATS.some((item) => item.id === cat) ? cat : "black";
    root.dataset.curtains = CURTAINS.some((item) => item.id === curtains) ? curtains : "drapes";
    root.dataset.rug = RUGS.some((item) => item.id === rug) ? rug : "oval";
    root.dataset.window = WINDOW_SHAPES.some((item) => item.id === shape) ? shape : "arched";
    root.dataset.wood = WOODS.some((item) => item.id === wood) ? wood : "walnut";
    root.dataset.china = CHINA_COLOURS.some((item) => item.id === china) ? china : "rose";
    root.dataset.teaset = TEASETS.some((item) => item.id === teaset) ? teaset : "gold";

    // The drink on the side table.
    const mugId =
        MUGS.some((item) => item.id === mug) ? mug : "plain";

    document.querySelectorAll("use.drink").forEach((drink) => {
        drink.setAttribute("href", `#mug-${mugId}`);
    });

}
