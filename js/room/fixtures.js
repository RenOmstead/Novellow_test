/* =========================================================
   NOVELLOW
   THE ROOM'S FIXTURES

   The parts of the room itself, chosen in "Edit the room"
   → Room: the wallpaper, the floor, the window (its shape,
   its wood, and where it hangs on the wall), the curtains
   and the rug. Each room theme keeps its own; the Sandbox
   starts bare, so a reader can build the room from nothing.

   Saved in the Supabase "decorations" table as rows of type
   "fixture" (asset_id "room:<kind>:<choice>"), so they follow
   the reader between devices like the decorations do. A copy
   is cached on this device so every page shows the right
   wall before the database answers.
========================================================= */

import { isVisiting } from "../core/visit-mode.js?v=__VERSION__";
import { createRow, updateRow } from "../core/store.js?v=__VERSION__";
import { html } from "../core/helpers.js?v=__VERSION__";
import { toastError } from "../core/ui.js?v=__VERSION__";
import { getPreferences, CURTAINS, RUGS, WINDOW_SHAPES, WOODS, PAINTED_WINDOWS, PAINTED_CURTAINS } from "../shell/preferences.js?v=__VERSION__";


const CACHE =
    "novellow-fixtures";

const svg = (body, width, height) =>
    `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'>${body}</svg>`)}")`;


/* ---------------------------------------------------------
   WALLPAPERS
   Mid to deep colours, so the light lettering of the page
   headings stays easy to read on every one.
--------------------------------------------------------- */

export const WALLPAPERS = [
    { id: "room", name: "The room's own" },
    {
        id: "plaster", name: "Warm plaster",
        wall: ["#5e5048", "#6c5c52", "#7a695d"],
        pattern: svg("<g fill='#f4e6d4' fill-opacity='0.06'><circle cx='6' cy='8' r='1.2'/><circle cx='30' cy='22' r='1'/><circle cx='18' cy='40' r='1.4'/><circle cx='42' cy='44' r='0.9'/></g>", 48, 48),
        size: "48px 48px"
    },
    {
        id: "sage-stripe", name: "Sage stripes",
        wall: ["#46553f", "#52624a", "#5e6f55"],
        pattern: svg("<rect x='0' width='14' height='40' fill='#e8f0d8' fill-opacity='0.07'/><rect x='18' width='2' height='40' fill='#e8f0d8' fill-opacity='0.1'/>", 40, 40),
        size: "40px 40px"
    },
    {
        id: "rose-damask", name: "Rose damask",
        wall: ["#62383f", "#71444b", "#7e5057"],
        pattern: svg("<g fill='#ffd8dc' fill-opacity='0.08'><path d='M32 6c8 8 12 16 0 30c-12-14-8-22 0-30z'/><path d='M32 40c5 4 7 9 0 16c-7-7-5-12 0-16z'/><circle cx='12' cy='32' r='3'/><circle cx='52' cy='32' r='3'/><path d='M0 60c10-6 22-6 32 0c10-6 22-6 32 0' fill='none' stroke='#ffd8dc' stroke-opacity='0.08' stroke-width='1.5'/></g>", 64, 72),
        size: "64px 72px"
    },
    {
        id: "navy-stars", name: "Midnight stars",
        wall: ["#1d2442", "#262f54", "#303a64"],
        pattern: svg("<g fill='#f6e2a8' fill-opacity='0.16'><path d='M14 8l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z'/><circle cx='44' cy='18' r='1.3'/><circle cx='34' cy='46' r='1'/><path d='M48 40l1 2.6 2.6 1-2.6 1-1 2.6-1-2.6-2.6-1 2.6-1z'/><circle cx='10' cy='44' r='0.9'/></g>", 60, 60),
        size: "60px 60px"
    },
    {
        id: "botanical", name: "Forest botanical",
        wall: ["#2d3d2f", "#364837", "#40523f"],
        pattern: svg("<g fill='none' stroke='#cfe3b8' stroke-opacity='0.12' stroke-width='1.4' stroke-linecap='round'><path d='M20 52C22 38 18 24 24 10'/><path d='M60 88C62 74 58 60 64 46'/></g><g fill='#cfe3b8' fill-opacity='0.1'><ellipse cx='16' cy='40' rx='5' ry='2.6' transform='rotate(-30 16 40)'/><ellipse cx='26' cy='28' rx='5' ry='2.6' transform='rotate(30 26 28)'/><ellipse cx='19' cy='18' rx='4' ry='2.2' transform='rotate(-35 19 18)'/><ellipse cx='56' cy='76' rx='5' ry='2.6' transform='rotate(-30 56 76)'/><ellipse cx='66' cy='64' rx='5' ry='2.6' transform='rotate(30 66 64)'/></g>", 80, 96),
        size: "80px 96px"
    },
    {
        id: "harlequin", name: "Burgundy harlequin",
        wall: ["#471b27", "#56222f", "#622a38"],
        pattern: svg("<path d='M28 0L56 36L28 72L0 36Z' fill='#ffc9d2' fill-opacity='0.06'/><path d='M28 0L56 36L28 72L0 36Z' fill='none' stroke='#e8c27c' stroke-opacity='0.12' stroke-width='1'/>", 56, 72),
        size: "56px 72px"
    },
    {
        id: "mustard-floral", name: "Mustard flowers",
        wall: ["#6e5020", "#7c5c27", "#88682e"],
        pattern: svg("<g fill='#fff0c8' fill-opacity='0.1'><circle cx='14' cy='10' r='3'/><circle cx='14' cy='18' r='3'/><circle cx='10' cy='14' r='3'/><circle cx='18' cy='14' r='3'/><circle cx='44' cy='40' r='3'/><circle cx='44' cy='48' r='3'/><circle cx='40' cy='44' r='3'/><circle cx='48' cy='44' r='3'/></g><g fill='#5a3a12' fill-opacity='0.2'><circle cx='14' cy='14' r='1.8'/><circle cx='44' cy='44' r='1.8'/></g>", 60, 60),
        size: "60px 60px"
    },
    {
        id: "lavender-dots", name: "Lavender dots",
        wall: ["#4b4160", "#574c6d", "#63587a"],
        pattern: svg("<g fill='#efe4ff' fill-opacity='0.1'><circle cx='9' cy='9' r='3.2'/><circle cx='29' cy='29' r='3.2'/></g>", 40, 40),
        size: "40px 40px"
    },
    {
        id: "teal-scallop", name: "Teal scallops",
        wall: ["#1d4749", "#255355", "#2d5f61"],
        pattern: svg("<path d='M0 20a12 12 0 0 1 24 0a12 12 0 0 1 24 0' fill='none' stroke='#d4f0e8' stroke-opacity='0.12' stroke-width='1.5'/><path d='M-12 44a12 12 0 0 1 24 0a12 12 0 0 1 24 0a12 12 0 0 1 24 0' fill='none' stroke='#d4f0e8' stroke-opacity='0.12' stroke-width='1.5'/>", 48, 48),
        size: "48px 48px"
    },
    {
        id: "wood-panel", name: "Wood panelling",
        wall: ["#46291a", "#553322", "#613c28"],
        pattern: svg("<rect x='0' y='0' width='96' height='120' fill='none' stroke='#1f1008' stroke-opacity='0.35' stroke-width='3'/><rect x='12' y='14' width='72' height='92' rx='3' fill='none' stroke='#e8b890' stroke-opacity='0.1' stroke-width='2'/>", 96, 120),
        size: "96px 120px"
    },
    {
        id: "charcoal-moons", name: "Charcoal moons",
        wall: ["#24222a", "#2e2b34", "#38343f"],
        pattern: svg("<g fill='#f2e6c4' fill-opacity='0.1'><path d='M20 10a9 9 0 1 0 8 13a7 7 0 0 1-8-13z'/><path d='M54 46a6 6 0 1 0 5 9a4.6 4.6 0 0 1-5-9z'/><circle cx='50' cy='16' r='1.2'/><circle cx='14' cy='52' r='1'/></g>", 70, 70),
        size: "70px 70px"
    },

    // Painted wallpapers (pictures, not drawings).
    { id: "plum-stripe", name: "Plum stripes", wall: ["#4f3439", "#5d3d43", "#624047"], src: "assets/wallpapers/plum_stripe.webp", pattern: `url("../assets/wallpapers/plum_stripe.webp?v=__VERSION__")`, size: "114px 109px" },
    { id: "pumpkin-patch", name: "Pumpkin patch", wall: ["#c4b196", "#e5ceaf", "#f2dab9"], src: "assets/wallpapers/pumpkin_patch.webp", pattern: `url("../assets/wallpapers/pumpkin_patch.webp?v=__VERSION__")`, size: "292px 291px", light: true },
    { id: "fern-sage", name: "Sage ferns", wall: ["#6e6d58", "#817f67", "#88866d"], src: "assets/wallpapers/fern_sage.webp", pattern: `url("../assets/wallpapers/fern_sage.webp?v=__VERSION__")`, size: "289px 291px" },
    { id: "rose-flowers", name: "Rose and blossom", wall: ["#835752", "#996660", "#a26c65"], src: "assets/wallpapers/rose_flowers.webp", pattern: `url("../assets/wallpapers/rose_flowers.webp?v=__VERSION__")`, size: "291px 291px" },
    { id: "moon-stars", name: "Moons and stars", wall: ["#38282c", "#422f34", "#453137"], src: "assets/wallpapers/moon_stars.webp", pattern: `url("../assets/wallpapers/moon_stars.webp?v=__VERSION__")`, size: "291px 289px" },
    { id: "fleur-trellis", name: "Fleur trellis", wall: ["#332e2b", "#3c3633", "#3f3936"], src: "assets/wallpapers/fleur_trellis.webp", pattern: `url("../assets/wallpapers/fleur_trellis.webp?v=__VERSION__")`, size: "209px 274px" },
    { id: "moth-lilac", name: "Lilac moths", wall: ["#6c5c59", "#7e6b68", "#85716e"], src: "assets/wallpapers/moth_lilac.webp", pattern: `url("../assets/wallpapers/moth_lilac.webp?v=__VERSION__")`, size: "289px 289px" },
    { id: "gothic-arches", name: "Gothic arches", wall: ["#4f4e3d", "#5c5b47", "#61604b"], src: "assets/wallpapers/gothic_arches.webp", pattern: `url("../assets/wallpapers/gothic_arches.webp?v=__VERSION__")`, size: "257px 277px" },
    { id: "wine-damask", name: "Worn wine damask", wall: ["#5b3132", "#6a3a3b", "#703d3e"], src: "assets/wallpapers/wine_damask.webp", pattern: `url("../assets/wallpapers/wine_damask.webp?v=__VERSION__")`, size: "581px 595px" },
    { id: "cobweb-grey", name: "Cobwebs", wall: ["#746461", "#887571", "#907c77"], src: "assets/wallpapers/cobweb_grey.webp", pattern: `url("../assets/wallpapers/cobweb_grey.webp?v=__VERSION__")`, size: "292px 298px" },
    { id: "bat-stripe", name: "Bat stripes", wall: ["#302b27", "#38322e", "#3b3530"], src: "assets/wallpapers/bat_stripe.webp", pattern: `url("../assets/wallpapers/bat_stripe.webp?v=__VERSION__")`, size: "178px 240px" },
    { id: "climbing-roses", name: "Climbing roses", wall: ["#bca78d", "#dbc3a5", "#e8ceae"], src: "assets/wallpapers/climbing_roses.webp", pattern: `url("../assets/wallpapers/climbing_roses.webp?v=__VERSION__")`, size: "581px 595px", light: true }
];


/* ---------------------------------------------------------
   FLOORS
--------------------------------------------------------- */

export const FLOORS = [
    { id: "room", name: "The room's own" },
    { id: "walnut", name: "Walnut boards", top: "#4a2a1c", bottom: "#3a2016" },
    { id: "oak", name: "Honey oak", top: "#8a6440", bottom: "#6e4e30" },
    { id: "greywash", name: "Grey-washed boards", top: "#6a645e", bottom: "#524c47" },
    { id: "ebony", name: "Ebony boards", top: "#2a1c16", bottom: "#1a110c" },
    {
        id: "checker", name: "Black and cream tiles", top: "#2a2624", bottom: "#1c1917", planks: "transparent",
        pattern: svg("<rect width='24' height='24' fill='#e8dcc4' fill-opacity='0.82'/><rect x='24' y='24' width='24' height='24' fill='#e8dcc4' fill-opacity='0.82'/>", 48, 48),
        size: "48px 48px"
    },
    {
        id: "terracotta", name: "Terracotta tiles", top: "#9a5638", bottom: "#7a412a", planks: "transparent",
        pattern: svg("<rect x='1' y='1' width='38' height='38' fill='none' stroke='#3a1a10' stroke-opacity='0.35' stroke-width='2'/>", 40, 40),
        size: "40px 40px"
    },
    {
        id: "stone", name: "Grey flagstones", top: "#5a5856", bottom: "#44423f", planks: "transparent",
        pattern: svg("<path d='M0 2H38V30H0M42 2H78V30H42M0 34H20V62H0M24 34H62V62H24M66 34H80V62H66' fill='none' stroke='#1c1b1a' stroke-opacity='0.4' stroke-width='2.5'/>", 80, 64),
        size: "80px 64px"
    },

    // Painted floors (pictures, not drawings).
    { id: "walnut-planks", name: "Walnut planks", top: "#65432d", bottom: "#4f3424", planks: "transparent", src: "assets/floors/walnut_planks.webp", pattern: `url("../assets/floors/walnut_planks.webp?v=__VERSION__")`, size: "172px 82px" },
    { id: "dark-planks", name: "Dark planks", top: "#3c2a23", bottom: "#30211b", planks: "transparent", src: "assets/floors/dark_planks.webp", pattern: `url("../assets/floors/dark_planks.webp?v=__VERSION__")`, size: "95px 63px" },
    { id: "honey-boards", name: "Honey boards", top: "#956c49", bottom: "#76553a", planks: "transparent", src: "assets/floors/honey_boards.webp", pattern: `url("../assets/floors/honey_boards.webp?v=__VERSION__")`, size: "88px 63px" },
    { id: "weathered-grey", name: "Weathered grey boards", top: "#675345", bottom: "#514137", planks: "transparent", src: "assets/floors/weathered_grey.webp", pattern: `url("../assets/floors/weathered_grey.webp?v=__VERSION__")`, size: "92px 75px" },
    { id: "herringbone", name: "Herringbone", top: "#603f2c", bottom: "#4c3223", planks: "transparent", src: "assets/floors/herringbone.webp", pattern: `url("../assets/floors/herringbone.webp?v=__VERSION__")`, size: "166px 76px" },
    { id: "basketweave", name: "Basketweave parquet", top: "#3e2b23", bottom: "#31221b", planks: "transparent", src: "assets/floors/basketweave.webp", pattern: `url("../assets/floors/basketweave.webp?v=__VERSION__")`, size: "134px 68px" },
    { id: "whitewashed", name: "Whitewashed boards", top: "#b39c85", bottom: "#8d7b69", planks: "transparent", src: "assets/floors/whitewashed.webp", pattern: `url("../assets/floors/whitewashed.webp?v=__VERSION__")`, size: "90px 66px" },
    { id: "plum-boards", name: "Worn plum boards", top: "#3f2b2c", bottom: "#322223", planks: "transparent", src: "assets/floors/plum_boards.webp", pattern: `url("../assets/floors/plum_boards.webp?v=__VERSION__")`, size: "163px 73px" },
    { id: "checker-marble", name: "Marble checkerboard", top: "#817568", bottom: "#665c52", planks: "transparent", src: "assets/floors/checker_marble.webp", pattern: `url("../assets/floors/checker_marble.webp?v=__VERSION__")`, size: "146px 82px" },
    { id: "slate-flags", name: "Slate flagstones", top: "#5f5d52", bottom: "#4b4940", planks: "transparent", src: "assets/floors/slate_flags.webp", pattern: `url("../assets/floors/slate_flags.webp?v=__VERSION__")`, size: "158px 96px" },
    { id: "cobblestone", name: "Cobblestones", top: "#7d6854", bottom: "#635242", planks: "transparent", src: "assets/floors/cobblestone.webp", pattern: `url("../assets/floors/cobblestone.webp?v=__VERSION__")`, size: "169px 91px" },
    { id: "wine-diamond", name: "Wine and cream tiles", top: "#947764", bottom: "#755e4f", planks: "transparent", src: "assets/floors/wine_diamond.webp", pattern: `url("../assets/floors/wine_diamond.webp?v=__VERSION__")`, size: "92px 76px" }
];


/* ---------------------------------------------------------
   RUG COLOURS
   Every rug is drawn in five colours: its edge, border,
   field, flowers and a pale cream. (The pumpkin and fluffy
   rugs keep their own.)
--------------------------------------------------------- */

export const RUG_COLOURS = [
    { id: "room", name: "The room's own" },
    { id: "crimson", name: "Crimson", colours: ["#2a1016", "#8a2432", "#5a1a24", "#c84a58", "#e8d6a8"] },
    { id: "rose", name: "Rose", colours: ["#6a3040", "#c86a88", "#e8a8bc", "#fbe0e8", "#fff4f6"] },
    { id: "sage", name: "Sage", colours: ["#2e3e2e", "#6a8a5e", "#a8bf94", "#e8f0d8", "#f6f2e4"] },
    { id: "midnight", name: "Midnight", colours: ["#141a36", "#2c3a70", "#1e2850", "#c9b060", "#e8dcb0"] },
    { id: "mustard", name: "Mustard", colours: ["#4a3410", "#c9952e", "#e8c46a", "#7a4a1a", "#fbecc4"] },
    { id: "lavender", name: "Lavender", colours: ["#3a2e52", "#8a74b8", "#c8b8e8", "#5a4a80", "#f4eeff"] },
    { id: "teal", name: "Teal", colours: ["#0f3436", "#2f7a78", "#1d5456", "#e8b46a", "#f0e8d0"] },
    { id: "pumpkin", name: "Pumpkin", colours: ["#3a1a0a", "#c8601e", "#7a3814", "#f0a040", "#fbe2b8"] },
    { id: "charcoal", name: "Charcoal", colours: ["#141214", "#3a363c", "#28252a", "#b8b0bc", "#e8e2ea"] },
    { id: "cream", name: "Cream", colours: ["#b8a88a", "#e8dcc4", "#f6efe2", "#c9a878", "#fffaf0"] }
];

/*
    Curtain colours: the fabric, the shade in its folds and the
    light on it. Every curtain but the lace takes them.
*/

export const CURTAIN_COLOURS = [
    { id: "room", name: "The room's own" },
    { id: "rose", name: "Dusty rose", colours: ["#c0707e", "#8a4454", "#dc98a4"] },
    { id: "wine", name: "Wine", colours: ["#7a2038", "#4a0c1e", "#a0384e"] },
    { id: "blush", name: "Blush", colours: ["#e8b4bc", "#b87884", "#f6d4d8"] },
    { id: "plum", name: "Plum", colours: ["#6a3a70", "#40204a", "#8e5a94"] },
    { id: "lavender", name: "Lavender", colours: ["#a894c8", "#6e5a94", "#c8b8e0"] },
    { id: "navy", name: "Midnight blue", colours: ["#2c3a6a", "#161e40", "#46568e"] },
    { id: "teal", name: "Teal", colours: ["#2f7a78", "#16484a", "#4e9a96"] },
    { id: "sage", name: "Sage", colours: ["#8aa47e", "#56704c", "#aac29e"] },
    { id: "forest", name: "Forest green", colours: ["#3e6b4c", "#1e3c28", "#5a8a66"] },
    { id: "mustard", name: "Mustard", colours: ["#c9952e", "#8a6014", "#e2b454"] },
    { id: "rust", name: "Rust", colours: ["#b5643f", "#7a3a1e", "#d08660"] },
    { id: "cream", name: "Cream", colours: ["#efe4cf", "#c9b89a", "#fbf6ea"] },
    { id: "charcoal", name: "Charcoal", colours: ["#3a363e", "#1c1a20", "#5a5660"] }
];

const CURTAIN_VARS =
    ["--curtain", "--curtain-fold", "--curtain-light"];

const RUG_VARS =
    ["--rug-edge", "--rug-border", "--rug-field", "--rug-flower", "--rug-cream", "--rug-web"];


/* ---------------------------------------------------------
   BUILT INTO THE THEMED ROOMS
   Pieces a themed room comes with, which the reader can take
   away (and put back). Saved as one fixture: "hidden", the
   ids of the pieces taken away.
--------------------------------------------------------- */

const ARMCHAIR_ROOMS = ["original", "rainy", "forest", "gothic"];

export const BUILT_IN = [
    { id: "lamp", name: "Ceiling light", rooms: ["original", "haunted", "rainy", "forest", "cafe", "gothic"] },
    { id: "armchair", name: "Armchair", rooms: [...ARMCHAIR_ROOMS, "cafe"] },
    { id: "sidetable", name: "Side table and drink", rooms: ARMCHAIR_ROOMS },
    { id: "cafetable", name: "Café table and tea set", rooms: ["cafe"] },
    { id: "cauldron", name: "Cauldron", rooms: ["haunted"] },
    { id: "broom", name: "Broom", rooms: ["haunted"] },
    { id: "pumpkin", name: "Pumpkin", rooms: ["haunted"] },
    { id: "floorcat", name: "Cat on the floor", rooms: ["haunted"] },
    { id: "ghosts", name: "Floating ghosts", rooms: ["haunted"] }
];


// Where each built-in piece is in the room, so it can be
// picked out and removed right there while arranging.
const BUILT_IN_SELECTORS = {
    lamp: ".ceiling-lamp",
    armchair: ".corner-scene .armchair",
    sidetable: ".side-table",
    cafetable: ".cafe-table",
    cauldron: ".corner-cauldron",
    broom: ".corner-broom",
    pumpkin: ".corner-pumpkin",
    floorcat: ".corner-floor-cat"
};


/*
    The built-in piece under a tap, if any (only the ones this
    room actually has).
*/

export function builtInAt(target) {

    const theme =
        document.documentElement.dataset.theme;

    const part =
        BUILT_IN.find((item) =>
            BUILT_IN_SELECTORS[item.id]
            && item.rooms.includes(theme)
            && target.closest?.(BUILT_IN_SELECTORS[item.id])
        );

    return part || null;

}


export function builtInElements(id) {
    return BUILT_IN_SELECTORS[id] ? [...document.querySelectorAll(BUILT_IN_SELECTORS[id])] : [];
}


export const TIMES = [
    { id: "night", name: "Night" },
    { id: "dusk", name: "Dusk" },
    { id: "afternoon", name: "Afternoon" },
    { id: "morning", name: "Morning" }
];

export const TREES = [
    { id: "oak", name: "Oak" },
    { id: "willow", name: "Willow with fairy lights" },
    { id: "cherry", name: "Cherry blossom" },
    { id: "pine", name: "Snowy pine" },
    { id: "none", name: "No tree" }
];

export const SEASONS = [
    { id: "auto", name: "Follow the real seasons" },
    { id: "spring", name: "Spring" },
    { id: "summer", name: "Summer" },
    { id: "autumn", name: "Autumn" },
    { id: "winter", name: "Winter" }
];


// Today's season, by the month (northern hemisphere).
function seasonNow() {
    const month = new Date().getMonth();
    return ["winter", "winter", "spring", "spring", "spring", "summer", "summer", "summer", "autumn", "autumn", "autumn", "winter"][month];
}


export const LIGHTS = [
    { id: "bright", name: "Bright", dim: 0 },
    { id: "cozy", name: "Cozy", dim: 0.14 },
    { id: "dim", name: "Dim", dim: 0.3 },
    { id: "candlelit", name: "Candlelit", dim: 0.46 }
];


/*
    The bookcase's wood or paint: its sides, crown and base, and
    the shelves left as "Classic wood" (a shelf with its own
    style keeps it).
      side: dark, light, middle   crown: top, middle, bottom
      frieze: top, bottom          back: top, bottom
      board: top, middle, bottom
*/
export const CASE_FINISHES = [
    { id: "room", name: "The room's own" },
    { id: "walnut", name: "Walnut", side: ["#2b170e", "#7a4a30", "#5a3322"], crown: ["#8a5636", "#5f3624", "#43261a"], frieze: ["#5a3322", "#3e2317"], back: ["#28150e", "#3b2117"], board: ["#9a6440", "#6e4029", "#4a2a1c"] },
    { id: "honey-oak", name: "Honey oak", side: ["#4a2e16", "#b07c44", "#8a5a2e"], crown: ["#c08a50", "#94622e", "#6e4620"], frieze: ["#8a5a2e", "#6a4220"], back: ["#3a2412", "#4e321a"], board: ["#c4904e", "#9a6a34", "#6e4822"] },
    { id: "mahogany", name: "Mahogany", side: ["#2a0e0a", "#8a3a28", "#6a2618"], crown: ["#9a4630", "#6e2a1a", "#4e1c12"], frieze: ["#6a2618", "#481810"], back: ["#26100c", "#3a1810"], board: ["#a44e34", "#7a3420", "#521f14"] },
    { id: "ebony", name: "Ebony", side: ["#0e0a0a", "#3a302c", "#22201e"], crown: ["#3e3430", "#26201e", "#161212"], frieze: ["#2a2422", "#181414"], back: ["#100c0c", "#1c1716"], board: ["#4a3e38", "#2e2622", "#1a1614"] },
    { id: "grey-wash", name: "Grey-washed", side: ["#2e2a28", "#8a8078", "#6a625c"], crown: ["#968c84", "#726a62", "#56504a"], frieze: ["#6a625c", "#4e4844"], back: ["#2a2624", "#3a3532"], board: ["#a0968c", "#7a7068", "#5a524c"] },
    { id: "painted-cream", name: "Painted cream", side: ["#6a5a48", "#f2e6cc", "#d8c8a8"], crown: ["#f6ecd6", "#e0d0b2", "#c4b090"], frieze: ["#d8c8a8", "#bca888"], back: ["#3a2e26", "#4c3e32"], board: ["#f2e6cc", "#d8c8a8", "#b8a482"] },
    { id: "painted-sage", name: "Painted sage", side: ["#2e3a2a", "#a4b48a", "#7e906a"], crown: ["#aebe94", "#86986e", "#66764e"], frieze: ["#7e906a", "#5e6e4c"], back: ["#1e2a1e", "#2c3a2a"], board: ["#b0c094", "#8a9c70", "#64744e"] },
    { id: "painted-plum", name: "Painted plum", side: ["#24101e", "#8a5478", "#6a3a5a"], crown: ["#96607e", "#6e3e5c", "#4e2a42"], frieze: ["#6a3a5a", "#4a2840"], back: ["#1e1018", "#2e1a26"], board: ["#9a6484", "#74425e", "#502c42"] },
    { id: "painted-navy", name: "Painted navy", side: ["#0e1424", "#4a5a84", "#323e62"], crown: ["#526290", "#384670", "#262f4e"], frieze: ["#323e62", "#222a46"], back: ["#0e1220", "#1a2034"], board: ["#5a6a98", "#3e4c78", "#2a3454"] },
    { id: "painted-black", name: "Black and gold", side: ["#050404", "#3a3226", "#1e1a16"], crown: ["#2e2820", "#1c1814", "#0e0c0a"], frieze: ["#241e18", "#120e0c"], back: ["#0c0a08", "#18140f"], board: ["#3a3226", "#24201a", "#14110e"] }
];

const CASE_VARS = [
    "--case-side-dark", "--case-side-light", "--case-side-mid",
    "--crown-top", "--crown-middle", "--crown-bottom",
    "--crown-frieze-top", "--crown-frieze-bottom",
    "--shelf-back-top", "--shelf-back-bottom",
    "--shelf-board-top", "--shelf-board-middle", "--shelf-board-bottom"
];

export const WINDOW_CHOICES = [
    ...WINDOW_SHAPES,
    { id: "none", name: "No window" }
];

const KINDS =
    ["wallpaper", "floor", "window", "wood", "curtains", "curtainColour", "rug", "rugColour", "time", "light", "tree", "season", "case"];

const CHOICES = {
    wallpaper: WALLPAPERS,
    floor: FLOORS,
    window: WINDOW_CHOICES,
    wood: WOODS,
    curtains: CURTAINS,
    curtainColour: CURTAIN_COLOURS,
    rug: RUGS,
    rugColour: RUG_COLOURS,
    time: TIMES,
    light: LIGHTS,
    tree: TREES,
    season: SEASONS,
    case: CASE_FINISHES
};

const WALL_VARS =
    ["--wall-left", "--wall-middle", "--wall-right", "--wall-pattern", "--wall-pattern-size", "--wall-panel-line"];

const FLOOR_VARS =
    ["--floor-top", "--floor-bottom", "--floor-pattern", "--floor-pattern-size", "--floor-plank-line"];


// The rows behind the current room's fixtures, by kind.
let rows = new Map();
let themeId = null;


/* =========================================================
   READING THE CHOICES
========================================================= */

function readCache() {

    try {
        return JSON.parse(localStorage.getItem(CACHE) || "{}") || {};
    }

    catch {
        return {};
    }

}


function writeCache(theme, values) {

    // Someone else's room isn't remembered.
    if (isVisiting()) {
        return;
    }

    try {

        const cache =
            readCache();

        cache[theme] = values;

        localStorage.setItem(CACHE, JSON.stringify(cache));

    }

    catch {
        // Private browsing: this visit only.
    }

}


/*
    Before a reader chooses anything: the themed rooms keep
    the window, curtains and rug chosen in Settings before
    these moved here; the Sandbox is an empty room.
*/

function defaultsFor(theme) {

    const prefs =
        getPreferences();

    if (theme === "sandbox") {
        return { wallpaper: "plaster", floor: "oak", window: "none", wood: prefs.wood, curtains: "none", curtainColour: "room", rug: "none", rugColour: "room", time: "night", light: "bright", tree: "oak", season: "auto", case: "walnut", hidden: "", windowX: null, windowY: null, rugX: null, rugY: null };
    }

    return { wallpaper: "room", floor: "room", window: prefs.window, wood: prefs.wood, curtains: prefs.curtains, curtainColour: "room", rug: prefs.rug, rugColour: "room", time: "night", light: "bright", tree: "oak", season: "auto", case: "room", hidden: "", windowX: null, windowY: null, rugX: null, rugY: null };

}


export function getFixtures(theme = themeId || document.documentElement.dataset.theme) {

    const values =
        { ...defaultsFor(theme), ...(readCache()[theme] || {}) };

    // Anything unknown falls back to the room's default.
    KINDS.forEach((kind) => {

        if (!CHOICES[kind].some((choice) => choice.id === values[kind])) {
            values[kind] = defaultsFor(theme)[kind];
        }

    });

    return values;

}


/* =========================================================
   SHOWING THEM
========================================================= */

export function applyFixtures(theme = document.documentElement.dataset.theme) {

    themeId = theme;

    const root =
        document.documentElement;

    const fixtures =
        getFixtures(theme);

    root.dataset.window = fixtures.window;
    root.dataset.wood = fixtures.wood;
    root.dataset.curtains = fixtures.curtains;
    root.dataset.rug = fixtures.rug;
    root.dataset.time = fixtures.time;
    root.dataset.tree = fixtures.tree;
    root.dataset.season = fixtures.season === "auto" ? seasonNow() : fixtures.season;
    root.style.setProperty("--room-dim", String(LIGHTS.find((item) => item.id === fixtures.light)?.dim || 0));
    root.dataset.hidden = String(fixtures.hidden || "").split(",").filter(Boolean).join(" ");

    // The bookcase's wood or paint, over the room's own.
    const finish =
        CASE_FINISHES.find((item) => item.id === fixtures.case);

    CASE_VARS.forEach((name) => root.style.removeProperty(name));

    if (finish?.side) {
        [...finish.side, ...finish.crown, ...finish.frieze, ...finish.back, ...finish.board]
            .forEach((value, index) => root.style.setProperty(CASE_VARS[index], value));
    }

    root.dataset.caseFinish = fixtures.case;

    // The wallpaper and floor, over the room's own.
    const paper =
        WALLPAPERS.find((item) => item.id === fixtures.wallpaper);

    WALL_VARS.forEach((name) => root.style.removeProperty(name));

    // A light painted wallpaper needs darker lettering around it.
    root.dataset.wallTone = paper?.light ? "light" : "dark";

    if (paper?.wall) {
        root.style.setProperty("--wall-left", paper.wall[0]);
        root.style.setProperty("--wall-middle", paper.wall[1]);
        root.style.setProperty("--wall-right", paper.wall[2]);
        root.style.setProperty("--wall-pattern", paper.pattern || "none");
        root.style.setProperty("--wall-pattern-size", paper.size || "auto");
        root.style.setProperty("--wall-panel-line", "transparent");
    }

    const floor =
        FLOORS.find((item) => item.id === fixtures.floor);

    FLOOR_VARS.forEach((name) => root.style.removeProperty(name));

    if (floor?.top) {
        root.style.setProperty("--floor-top", floor.top);
        root.style.setProperty("--floor-bottom", floor.bottom);
        root.style.setProperty("--floor-pattern", floor.pattern || "none");
        root.style.setProperty("--floor-pattern-size", floor.size || "auto");
        root.style.setProperty("--floor-plank-line", floor.planks || "rgba(0, 0, 0, 0.18)");
    }

    // The rug's colours.
    const rugColour =
        RUG_COLOURS.find((item) => item.id === fixtures.rugColour);

    RUG_VARS.forEach((name) => root.style.removeProperty(name));

    if (rugColour?.colours) {
        RUG_VARS.slice(0, 5).forEach((name, index) => root.style.setProperty(name, rugColour.colours[index]));
        root.style.setProperty("--rug-web", rugColour.colours[1]);
    }

    // The curtains' colours.
    const curtainColour =
        CURTAIN_COLOURS.find((item) => item.id === fixtures.curtainColour);

    CURTAIN_VARS.forEach((name) => root.style.removeProperty(name));

    if (curtainColour?.colours) {
        CURTAIN_VARS.forEach((name, index) => root.style.setProperty(name, curtainColour.colours[index]));
    }

    root.dataset.curtainTint = curtainColour?.colours ? "on" : "off";

    placeWindow(fixtures);

    placeRug(fixtures);

}


/*
    Where the window hangs: its middle as a share of the wall
    (the same measure as the wall's decorations), or its usual
    place beside the bookcase.
*/

function placeWindow(fixtures) {

    const wall =
        document.querySelector(".wall-art");

    if (!wall) {
        return;
    }

    if (fixtures.windowX === null || fixtures.windowX === undefined) {
        wall.style.removeProperty("--window-left");
        wall.style.removeProperty("--window-bottom");
        return;
    }

    wall.style.setProperty("--window-left", `calc(${fixtures.windowX}% - var(--window-width) / 2)`);
    wall.style.setProperty("--window-bottom", `calc(${100 - fixtures.windowY}% - var(--window-width) * 0.375)`);

}


/*
    Where the rug lies: its middle as a share of the floor's
    width, and how far forward (0, at the wall) or back (100,
    at the bottom edge) it sits. Unmoved, it lies under the
    window and the chair.
*/

function placeRug(fixtures) {

    const floor =
        document.querySelector(".room-floor");

    if (!floor) {
        return;
    }

    if (fixtures.rugX === null || fixtures.rugX === undefined) {
        floor.style.removeProperty("--rug-left");
        floor.style.removeProperty("--rug-bottom");
        floor.classList.remove("has-moved-rug");
        return;
    }

    floor.classList.add("has-moved-rug");
    floor.style.setProperty("--rug-left", `${fixtures.rugX}%`);
    floor.style.setProperty("--rug-bottom", `${-10 - fixtures.rugY * 0.7}px`);

}


export function moveRug(x, y, { persist = true } = {}) {

    const theme =
        themeId || document.documentElement.dataset.theme;

    const fixtures = {
        ...getFixtures(theme),
        rugX: Number(Math.min(100, Math.max(0, x)).toFixed(2)),
        rugY: Number(Math.min(100, Math.max(0, y)).toFixed(2))
    };

    writeCache(theme, fixtures);

    placeRug(fixtures);

    if (persist) {
        save("rug", fixtures.rug, { position_x: fixtures.rugX, position_y: fixtures.rugY, rotation: 1 });
    }

}


/*
    Dragging the rug across the floor while arranging.
*/

export function dragRug(event) {

    const floor =
        document.querySelector(".room-floor");

    const rug =
        event.target.closest(".room-rug");

    if (!floor || !rug) {
        return false;
    }

    event.preventDefault();

    rug.setPointerCapture?.(event.pointerId);
    rug.classList.add("is-dragging");

    const box =
        floor.getBoundingClientRect();

    const start =
        rug.getBoundingClientRect();

    const current =
        getFixtures();

    // Start from where the rug is now, moved or not.
    const startX = current.rugX ?? ((start.left + start.width / 2 - box.left) / box.width) * 100;
    const startY = current.rugY ?? 48;

    let last = null;

    const move = (moveEvent) => {

        if (moveEvent.pointerId !== event.pointerId) {
            return;
        }

        last = {
            x: startX + ((moveEvent.clientX - event.clientX) / box.width) * 100,
            // Down the screen is toward the front of the room.
            y: startY + (moveEvent.clientY - event.clientY) / 0.7
        };

        moveRug(last.x, last.y, { persist: false });

    };

    const finish = (upEvent) => {

        if (upEvent.pointerId !== event.pointerId) {
            return;
        }

        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", finish);
        window.removeEventListener("pointercancel", finish);

        rug.classList.remove("is-dragging");

        if (last) {
            moveRug(last.x, last.y);
        }

    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);

    return true;

}


/* =========================================================
   SAVING
========================================================= */

/*
    The fixture rows that came with this room's decorations
    (js/room/decorations.js loads them together).
*/

export function setFixtureRows(theme, fixtureRows) {

    rows = new Map();

    const values = {};

    fixtureRows.forEach((row) => {

        const [, kind, choice] =
            String(row.asset_id).split(":");

        if (kind === "hidden") {
            rows.set(kind, row);
            values.hidden = choice || "";
            return;
        }

        if (!KINDS.includes(kind)) {
            return;
        }

        rows.set(kind, row);

        values[kind] = choice;

        if (kind === "window" && row.rotation === 1) {
            values.windowX = Number(row.position_x);
            values.windowY = Number(row.position_y);
        }

        if (kind === "rug" && row.rotation === 1) {
            values.rugX = Number(row.position_x);
            values.rugY = Number(row.position_y);
        }

    });

    writeCache(theme, values);

    if (theme === document.documentElement.dataset.theme) {
        applyFixtures(theme);
    }

}


// One save at a time for each kind, in the order they were
// made, so quick changes never land out of order (or twice).
const saveQueues =
    new Map();

function save(kind, choice, extra = {}) {

    const next =
        (saveQueues.get(kind) || Promise.resolve()).then(() => saveNow(kind, choice, extra));

    saveQueues.set(kind, next);

    return next;

}


async function saveNow(kind, choice, extra = {}) {

    const theme =
        themeId || document.documentElement.dataset.theme;

    const row =
        rows.get(kind);

    const values = {
        asset_id: `room:${kind}:${choice}`,
        ...extra
    };

    try {

        const saved =
            row
                ? await updateRow("decorations", row.id, values)
                : await createRow("decorations", {
                    decoration_type: "fixture",
                    room_area: "wall",
                    theme,
                    position_x: 50,
                    position_y: 50,
                    z_index: 0,
                    ...values
                });

        rows.set(kind, saved);

    }

    catch (error) {
        toastError(error, "That change to the room didn't save. Please try again.");
    }

}


export function chooseFixture(kind, choice) {

    if (!KINDS.includes(kind)) {
        return;
    }

    const theme =
        themeId || document.documentElement.dataset.theme;

    const fixtures =
        { ...getFixtures(theme), [kind]: choice };

    writeCache(theme, fixtures);

    applyFixtures(theme);

    save(kind, choice);

}


/*
    Takes a built-in piece away, or puts it back.
*/

export function toggleBuiltIn(id) {

    if (!BUILT_IN.some((part) => part.id === id)) {
        return;
    }

    const theme =
        themeId || document.documentElement.dataset.theme;

    const fixtures =
        getFixtures(theme);

    const hidden =
        new Set(String(fixtures.hidden || "").split(",").filter(Boolean));

    if (hidden.has(id)) {
        hidden.delete(id);
    }

    else {
        hidden.add(id);
    }

    fixtures.hidden = [...hidden].join(",");

    writeCache(theme, fixtures);

    applyFixtures(theme);

    save("hidden", fixtures.hidden);

}


/*
    Moves the window; x and y are its middle as a percentage
    of the wall. `rotation` 1 marks a window that has been
    moved (0 is its usual place).
*/

export function moveWindow(x, y, { persist = true } = {}) {

    const theme =
        themeId || document.documentElement.dataset.theme;

    const fixtures = {
        ...getFixtures(theme),
        windowX: Number(Math.min(92, Math.max(8, x)).toFixed(2)),
        windowY: Number(Math.min(78, Math.max(18, y)).toFixed(2))
    };

    writeCache(theme, fixtures);

    placeWindow(fixtures);

    if (persist) {
        save("window", fixtures.window, { position_x: fixtures.windowX, position_y: fixtures.windowY, rotation: 1 });
    }

}


export function resetWindow() {

    const theme =
        themeId || document.documentElement.dataset.theme;

    const fixtures =
        { ...getFixtures(theme), windowX: null, windowY: null };

    writeCache(theme, fixtures);

    placeWindow(fixtures);

    save("window", fixtures.window, { rotation: 0 });

}


/*
    Dragging the window across the wall while arranging.
*/

export function dragWindow(event) {

    const wall =
        document.querySelector(".wall-art");

    const windowArt =
        event.target.closest(".moon-window");

    if (!wall || !windowArt) {
        return false;
    }

    event.preventDefault();

    windowArt.setPointerCapture?.(event.pointerId);
    windowArt.classList.add("is-dragging");

    const box =
        wall.getBoundingClientRect();

    const start =
        windowArt.getBoundingClientRect();

    // Where in the window the finger took hold.
    const grabX = event.clientX - (start.left + start.width / 2);
    const grabY = event.clientY - (start.top + start.height / 2);

    let last = null;

    const at = (moveEvent) => ({
        x: ((moveEvent.clientX - grabX - box.left) / box.width) * 100,
        y: ((moveEvent.clientY - grabY - box.top) / box.height) * 100
    });

    const move = (moveEvent) => {

        if (moveEvent.pointerId !== event.pointerId) {
            return;
        }

        last = at(moveEvent);

        moveWindow(last.x, last.y, { persist: false });

    };

    const finish = (upEvent) => {

        if (upEvent.pointerId !== event.pointerId) {
            return;
        }

        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", finish);
        window.removeEventListener("pointercancel", finish);

        windowArt.classList.remove("is-dragging");

        if (last) {
            moveWindow(last.x, last.y);
        }

    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);

    return true;

}


/* =========================================================
   THE ROOM TAB (in the Arrange panel)
========================================================= */

function swatchStyle(kind, choice) {

    if (kind === "wallpaper") {
        // A painted wallpaper: its own picture, a little smaller.
        if (choice.src) {
            return `background: url("${choice.src}?v=__VERSION__") center / 90px auto`;
        }

        return choice.wall
            ? `background: ${choice.pattern}, linear-gradient(90deg, ${choice.wall[0]}, ${choice.wall[2]})`
            : "";
    }

    if (kind === "floor" && choice.src) {
        return `background: url("${choice.src}?v=__VERSION__") center / 80px auto`;
    }

    if (kind === "floor") {
        return choice.top
            ? `background: ${choice.pattern ? `${choice.pattern}, ` : ""}repeating-linear-gradient(90deg, ${choice.planks || "rgba(0, 0, 0, 0.2)"} 0 2px, transparent 2px 22px), linear-gradient(${choice.top}, ${choice.bottom})`
            : "";
    }

    if (kind === "case") {
        return choice.side
            ? `background: linear-gradient(90deg, ${choice.side[0]} 0 10%, ${choice.side[1]} 10% 18%, ${choice.back[0]} 18% 82%, ${choice.side[1]} 82% 90%, ${choice.side[0]} 90%), linear-gradient(${choice.board[0]}, ${choice.board[2]})`
            : "";
    }

    if (kind === "curtainColour") {
        return choice.colours
            ? `background: linear-gradient(90deg, ${choice.colours[1]} 0 18%, ${choice.colours[0]} 18% 42%, ${choice.colours[2]} 42% 58%, ${choice.colours[0]} 58% 82%, ${choice.colours[1]} 82%)`
            : "";
    }

    if (kind === "rugColour") {
        return choice.colours
            ? `background: linear-gradient(135deg, ${choice.colours[0]} 0 22%, ${choice.colours[1]} 22% 44%, ${choice.colours[2]} 44% 66%, ${choice.colours[3]} 66% 84%, ${choice.colours[4]} 84%)`
            : "";
    }

    return "";

}


function swatches(kind, label, current) {

    return html`
        <fieldset class="room-choices">
            <legend class="room-choices__label">${label}</legend>
            <div class="room-choices__swatches">
                ${CHOICES[kind].map((choice) => html`
                    <button
                        class="room-swatch ${choice.id === "room" ? "room-swatch--own" : ""} ${choice.id === current ? "is-current" : ""}"
                        type="button"
                        data-fixture="${kind}"
                        data-choice="${choice.id}"
                        aria-pressed="${String(choice.id === current)}"
                        title="${choice.name}"
                        style="${swatchStyle(kind, choice)}"
                    >
                        <span class="${choice.id === "room" ? "" : "visually-hidden"}">${choice.id === "room" ? "Room's own" : choice.name}</span>
                    </button>
                `)}
            </div>
        </fieldset>
    `;

}


function chips(kind, label, current) {

    return html`
        <fieldset class="room-choices">
            <legend class="room-choices__label">${label}</legend>
            <div class="room-choices__chips">
                ${CHOICES[kind].map((choice) => html`
                    <button
                        class="room-chip ${choice.id === current ? "is-current" : ""}"
                        type="button"
                        data-fixture="${kind}"
                        data-choice="${choice.id}"
                        aria-pressed="${String(choice.id === current)}"
                    >${choice.name}</button>
                `)}
            </div>
        </fieldset>
    `;

}


// Window shapes and curtains that are pictures show as small
// pictures; the drawn ones by name.
function pictureTiles(kind, label, current, folder, painted) {

    return html`
        <fieldset class="room-choices">
            <legend class="room-choices__label">${label}</legend>
            <div class="room-choices__tiles">
                ${CHOICES[kind].map((choice) => html`
                    <button
                        class="room-tile ${choice.id === current ? "is-current" : ""} ${painted.includes(choice.id) ? "" : "room-tile--named"}"
                        type="button"
                        data-fixture="${kind}"
                        data-choice="${choice.id}"
                        aria-pressed="${String(choice.id === current)}"
                        title="${choice.name}"
                    >
                        ${painted.includes(choice.id) ? html`<img src="${folder}${choice.id}.webp?v=__VERSION__" alt="" loading="lazy" draggable="false">` : ""}
                        <span>${choice.name}</span>
                    </button>
                `)}
            </div>
        </fieldset>
    `;

}


/*
    One part of the room's own choices, shown in the decorating
    panel's tab for that part of the room (js/room/decorations.js):
    wallpaper, floor, rug, window, outside, light, built-in.
*/

export function roomSectionMarkup(section) {

    const fixtures =
        getFixtures();

    const theme =
        document.documentElement.dataset.theme;

    const hidden =
        new Set(String(fixtures.hidden || "").split(",").filter(Boolean));

    const builtIn =
        BUILT_IN.filter((part) => part.rooms.includes(theme));

    switch (section) {

        case "wallpaper":
            return swatches("wallpaper", "Wallpaper", fixtures.wallpaper);

        case "floor":
            return swatches("floor", "Floor", fixtures.floor);

        case "rug":
            return html`
                ${chips("rug", "The room's own rug", fixtures.rug)}
                ${fixtures.rug === "none" ? "" : html`
                    ${swatches("rugColour", "Its colours", fixtures.rugColour)}
                    <p class="room-choices__note">Drag the rug in the room to move it.</p>
                `}
            `;

        case "window":
            return html`
                ${pictureTiles("window", "Window", fixtures.window, "assets/decor/windows/", PAINTED_WINDOWS)}
                ${fixtures.window === "none" ? "" : html`
                    <p class="room-choices__note">Drag the window in the room to move it.</p>
                    ${fixtures.windowX === null || fixtures.windowX === undefined ? "" : html`
                        <button class="text-button room-choices__reset" type="button" data-fixture-action="reset-window">Put the window back in its usual place</button>
                    `}
                    ${chips("wood", "Window frame", fixtures.wood)}
                    ${pictureTiles("curtains", "Curtains", fixtures.curtains, "assets/decor/curtains/", PAINTED_CURTAINS)}
                    ${fixtures.curtains === "none" || fixtures.curtains === "lace" ? "" : swatches("curtainColour", "Curtain colours", fixtures.curtainColour)}
                `}
            `;

        case "outside":
            return html`
                ${chips("time", "Outside the window", fixtures.time)}
                ${chips("tree", "Tree outside", fixtures.tree)}
                ${chips("season", "Season", fixtures.season)}
            `;

        case "light":
            return chips("light", "Light in the room", fixtures.light);

        case "bookcase":
            return html`
                ${swatches("case", "The bookcase", fixtures.case)}
                <p class="room-choices__note">Its wood or paint. A shelf with a style of its own (in its shelf settings) keeps it.</p>
            `;

        case "built-in":
            return builtIn.length ? html`
                <fieldset class="room-choices">
                    <legend class="room-choices__label">Built into this room</legend>
                    <p class="room-choices__note">Tap to take one away, or to put it back.</p>
                    <div class="room-choices__chips">
                        ${builtIn.map((part) => html`
                            <button class="room-chip room-chip--toggle ${hidden.has(part.id) ? "" : "is-current"}" type="button" data-built-in="${part.id}" aria-pressed="${String(!hidden.has(part.id))}">${hidden.has(part.id) ? "＋ " : "✓ "}${part.name}</button>
                        `)}
                    </div>
                </fieldset>
            ` : "";

        default:
            return "";

    }

}


/*
    A click on one of the room's own choices in the panel.
    Returns true when it was one of ours, so the panel can
    redraw.
*/

export function onRoomPanelClick(event) {

    const pick =
        event.target.closest("[data-fixture]");

    if (pick) {
        chooseFixture(pick.dataset.fixture, pick.dataset.choice);
        return true;
    }

    const part =
        event.target.closest("[data-built-in]");

    if (part) {
        toggleBuiltIn(part.dataset.builtIn);
        return true;
    }

    if (event.target.closest("[data-fixture-action=reset-window]")) {
        resetWindow();
        return true;
    }

    return false;

}
