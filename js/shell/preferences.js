/* =========================================================
   NOVELLOW
   ROOM PREFERENCES

   Small, per-device choices about the room that don't need
   to follow the reader between devices: which cat and which
   dog live in the library, where ghosts float, the curtains, the rug, the
   mug or tea set on the table, and which paper notes (if any)
   are pinned to the wall, and the font the reader's own
   writing is shown in. Kept in localStorage (sound has its
   own, in js/sound/soundscape.js).
========================================================= */

import { SPINE_FONTS } from "../books/spine-options.js?v=__VERSION__";

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

// The library dog (the "Sleeping dog" piece): its breed, and
// its colouring ("natural" keeps the breed's own).
export const DOGS = [
    { id: "labrador", name: "Labrador" },
    { id: "golden", name: "Golden retriever" },
    { id: "corgi", name: "Corgi" },
    { id: "dachshund", name: "Dachshund" },
    { id: "pug", name: "Pug" },
    { id: "beagle", name: "Beagle" },
    { id: "frenchie", name: "French bulldog" },
    { id: "poodle", name: "Poodle" },
    { id: "husky", name: "Husky" }
];

export const DOG_COLOURS = [
    { id: "natural", name: "The breed's own colouring" },
    { id: "black", name: "Black" },
    { id: "chocolate", name: "Chocolate" },
    { id: "golden", name: "Golden" },
    { id: "fawn", name: "Fawn" },
    { id: "red", name: "Red" },
    { id: "cream", name: "Cream" },
    { id: "white", name: "White" },
    { id: "grey", name: "Grey" }
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
    { id: "swag", name: "Swags and tails" },
    { id: "fringe", name: "Velvet with fringe" },
    { id: "pinch", name: "Pinch-pleat drapes" },
    { id: "ruffle", name: "Ruffled tie-ups" },
    { id: "roman", name: "Roman blind" },
    { id: "stars", name: "Starry sheers" },
    { id: "tasselled", name: "Velvet with tassels" },
    { id: "ivy", name: "Trailing ivy" },
    { id: "pumpkin", name: "Hanging panels" },
    { id: "tattered", name: "Tattered, tied back" },
    { id: "lined", name: "Lined with cream" },
    { id: "theatre", name: "Theatre swags" },
    { id: "roses", name: "Pink with roses" },
    { id: "none", name: "No curtains" }
];

export const RUGS = [
    { id: "oval", name: "Round, with flowers" },
    { id: "persian", name: "Rectangle, with tassels" },
    { id: "braided", name: "Round braided" },
    { id: "runner", name: "Striped runner" },
    { id: "celestial", name: "Moon and stars" },
    { id: "checker", name: "Checkerboard" },
    { id: "rag", name: "Rag stripes" },
    { id: "scallop", name: "Scalloped flower" },
    { id: "mandala", name: "Round lace" },
    { id: "medallion", name: "Faded medallion" },
    { id: "moons", name: "Moon phases" },
    { id: "spiderweb", name: "Spiderweb" },
    { id: "pumpkin", name: "Pumpkin potion" },
    { id: "sheepskin", name: "Fluffy round" },
    { id: "oriental", name: "Oriental medallion" },
    { id: "kilim", name: "Kilim diamonds" },
    { id: "hearts", name: "Hearts" },
    { id: "rosegarden", name: "Rose garden" },
    { id: "trellis", name: "Moroccan trellis" },
    { id: "cat", name: "Black cat" },
    { id: "patchwork", name: "Patchwork quilt" },
    { id: "autumn", name: "Autumn leaves" },
    { id: "none", name: "No rug" }
];

export const WINDOW_SHAPES = [
    { id: "arched", name: "Arched" },
    { id: "square", name: "Square" },
    { id: "gothic", name: "Gothic, pointed" },
    { id: "stone", name: "Stone arch with ivy" },
    { id: "six-pane", name: "Six panes" },
    { id: "tracery", name: "Gothic tracery" },
    { id: "lancet", name: "Narrow lancet" },
    { id: "double-arch", name: "Double arch" },
    { id: "moon-arch", name: "Arch with a moon" },
    { id: "round", name: "Round, with a cross" },
    { id: "porthole", name: "Porthole" },
    { id: "timber", name: "Wide timber" },
    { id: "casement", name: "Open casement" },
    { id: "shutters", name: "With shutters" },
    { id: "boarded", name: "Boarded up" },
    { id: "boarded-arch", name: "Boarded arch" },
    // Winter windows, painted with their own snowy views.
    { id: "snowy-walnut", name: "Snowy twin arch", view: true, curtains: true },
    { id: "solstice-round", name: "Solstice round", view: true, curtains: true },
    { id: "frosted-cream", name: "Frosted sash", view: true },
    { id: "gothic-moon", name: "Gothic moon", view: true, curtains: true }
];

// The painted windows and curtains (pictures, not drawings).
export const PAINTED_WINDOWS =
    ["six-pane", "tracery", "lancet", "double-arch", "moon-arch", "round", "porthole", "timber", "casement", "shutters", "boarded", "boarded-arch", "snowy-walnut", "solstice-round", "frosted-cream", "gothic-moon"];

export const PAINTED_CURTAINS =
    ["tasselled", "ivy", "pumpkin", "tattered", "lined", "theatre", "roses"];

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
    dog: "labrador",
    dogColour: "natural",
    ghosts: "haunted",
    curtains: "drapes",
    rug: "oval",
    window: "arched",
    wood: "walnut",
    mug: "plain",
    china: "rose",
    teaset: "gold",
    writingFont: "hand",
    readingNote: "off",
    snippetNote: "off",
    bookcaseIvy: "off"
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

    const { cat, dog, dogColour, mug, china, teaset } =
        getPreferences();

    const root =
        document.documentElement;

    root.dataset.cat = CATS.some((item) => item.id === cat) ? cat : "black";
    root.dataset.dog = DOGS.some((item) => item.id === dog) ? dog : "labrador";
    root.dataset.dogColour = DOG_COLOURS.some((item) => item.id === dogColour) ? dogColour : "natural";

    // The window, its wood, the curtains and the rug are the
    // room's own now (js/room/fixtures.js); the choices kept
    // here are only where each room starts.
    root.dataset.china = CHINA_COLOURS.some((item) => item.id === china) ? china : "rose";
    root.dataset.teaset = TEASETS.some((item) => item.id === teaset) ? teaset : "gold";

    // The little paper notes on the wall, if the reader wants them.
    const { readingNote, snippetNote } =
        getPreferences();

    root.dataset.readingNote = readingNote === "on" ? "on" : "off";
    root.dataset.snippetNote = snippetNote === "on" ? "on" : "off";

    // The font the reader's own writing is shown in (journal
    // entries, notes and quotes).
    const writing =
        SPINE_FONTS.find((font) => font.id === getPreferences().writingFont);

    if (writing && writing.id !== "hand") {
        root.style.setProperty("--font-writing", writing.family);
        root.dataset.writingFont = writing.id;
    }

    else {
        root.style.removeProperty("--font-writing");
        delete root.dataset.writingFont;
    }

    // Ivy climbing the sides of the bookcase, if the reader wants it.
    root.dataset.bookcaseIvy = getPreferences().bookcaseIvy === "on" ? "on" : "off";

    // The drink on the side table.
    const mugId =
        MUGS.some((item) => item.id === mug) ? mug : "plain";

    document.querySelectorAll("use.drink").forEach((drink) => {
        drink.setAttribute("href", `#mug-${mugId}`);
    });

}
