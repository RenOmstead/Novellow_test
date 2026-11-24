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
    { id: "climbing-roses", name: "Climbing roses", wall: ["#bca78d", "#dbc3a5", "#e8ceae"], src: "assets/wallpapers/climbing_roses.webp", pattern: `url("../assets/wallpapers/climbing_roses.webp?v=__VERSION__")`, size: "581px 595px", light: true },

    // Holiday wallpapers, in a row of their own in the panel
    // (alphabetical, so no holiday comes first by default).
    { id: "holiday-christmas-1", name: "Christmas holly and bows", wall: ["#d8cdbb", "#fdf0db", "#fffee7"], src: "assets/wallpapers/holiday_christmas_1.webp", pattern: `url("../assets/wallpapers/holiday_christmas_1.webp?v=__VERSION__")`, size: "150px 150px", holiday: true, light: true },
    { id: "holiday-christmas-2", name: "Christmas stars and baubles", wall: ["#414a29", "#4c5630", "#505b33"], src: "assets/wallpapers/holiday_christmas_2.webp", pattern: `url("../assets/wallpapers/holiday_christmas_2.webp?v=__VERSION__")`, size: "150px 118px", holiday: true },
    { id: "holiday-hanukkah-1", name: "Hanukkah dreidels and olives", wall: ["#617d8f", "#7192a7", "#779ab1"], src: "assets/wallpapers/holiday_hanukkah_1.webp", pattern: `url("../assets/wallpapers/holiday_hanukkah_1.webp?v=__VERSION__")`, size: "147px 140px", holiday: true },
    { id: "holiday-hanukkah-2", name: "Hanukkah stars and olive sprigs", wall: ["#d7cbb5", "#fbeed4", "#fffce0"], src: "assets/wallpapers/holiday_hanukkah_2.webp", pattern: `url("../assets/wallpapers/holiday_hanukkah_2.webp?v=__VERSION__")`, size: "113px 113px", holiday: true, light: true },
    { id: "holiday-harvest-1", name: "Harvest acorns and oak leaves", wall: ["#d8cfbb", "#fdf2db", "#ffffe7"], src: "assets/wallpapers/holiday_harvest_1.webp", pattern: `url("../assets/wallpapers/holiday_harvest_1.webp?v=__VERSION__")`, size: "145px 143px", holiday: true, light: true },
    { id: "holiday-harvest-2", name: "Harvest pumpkins and wheat", wall: ["#66303d", "#773847", "#7e3b4b"], src: "assets/wallpapers/holiday_harvest_2.webp", pattern: `url("../assets/wallpapers/holiday_harvest_2.webp?v=__VERSION__")`, size: "195px 147px", holiday: true },
    { id: "holiday-krampus-1", name: "Krampus bells and bows", wall: ["#5b3940", "#6b434b", "#71474f"], src: "assets/wallpapers/holiday_krampus_1.webp", pattern: `url("../assets/wallpapers/holiday_krampus_1.webp?v=__VERSION__")`, size: "150px 149px", holiday: true },
    { id: "holiday-krampus-2", name: "Krampus horns and pine", wall: ["#d6cab6", "#faecd5", "#fff9e1"], src: "assets/wallpapers/holiday_krampus_2.webp", pattern: `url("../assets/wallpapers/holiday_krampus_2.webp?v=__VERSION__")`, size: "141px 141px", holiday: true, light: true },
    { id: "holiday-kwanzaa-1", name: "Kwanzaa diamonds", wall: ["#d7ccb5", "#fcefd4", "#fffde0"], src: "assets/wallpapers/holiday_kwanzaa_1.webp", pattern: `url("../assets/wallpapers/holiday_kwanzaa_1.webp?v=__VERSION__")`, size: "113px 150px", holiday: true, light: true },
    { id: "holiday-kwanzaa-2", name: "Kwanzaa corn and leaves", wall: ["#d0bca2", "#f3dcbd", "#ffe9c8"], src: "assets/wallpapers/holiday_kwanzaa_2.webp", pattern: `url("../assets/wallpapers/holiday_kwanzaa_2.webp?v=__VERSION__")`, size: "113px 150px", holiday: true, light: true },
    { id: "holiday-new-year-1", name: "New Year bows and stars", wall: ["#263118", "#2c391c", "#2f3c1e"], src: "assets/wallpapers/holiday_new_year_1.webp", pattern: `url("../assets/wallpapers/holiday_new_year_1.webp?v=__VERSION__")`, size: "149px 140px", holiday: true },
    { id: "holiday-new-year-2", name: "New Year pocket watches", wall: ["#d8ceba", "#fdf1da", "#ffffe6"], src: "assets/wallpapers/holiday_new_year_2.webp", pattern: `url("../assets/wallpapers/holiday_new_year_2.webp?v=__VERSION__")`, size: "169px 141px", holiday: true, light: true },
    { id: "holiday-winter-1", name: "Winter snowflakes", wall: ["#865861", "#9d6771", "#a66d77"], src: "assets/wallpapers/holiday_winter_1.webp", pattern: `url("../assets/wallpapers/holiday_winter_1.webp?v=__VERSION__")`, size: "150px 139px", holiday: true },
    { id: "holiday-winter-2", name: "Winter snowy pines", wall: ["#d8ccb6", "#fdefd5", "#fffde1"], src: "assets/wallpapers/holiday_winter_2.webp", pattern: `url("../assets/wallpapers/holiday_winter_2.webp?v=__VERSION__")`, size: "150px 150px", holiday: true, light: true },
    { id: "holiday-yule-1", name: "Yule oranges and evergreen", wall: ["#d7cbb7", "#fceed6", "#fffce2"], src: "assets/wallpapers/holiday_yule_1.webp", pattern: `url("../assets/wallpapers/holiday_yule_1.webp?v=__VERSION__")`, size: "113px 150px", holiday: true, light: true },
    { id: "holiday-yule-2", name: "Yule suns and pinecones", wall: ["#5c323d", "#6c3a47", "#723d4b"], src: "assets/wallpapers/holiday_yule_2.webp", pattern: `url("../assets/wallpapers/holiday_yule_2.webp?v=__VERSION__")`, size: "150px 150px", holiday: true },
    // The collections' wallpapers, in a row of their own.,
    { id: "set-bookish-whimsy", name: "Bookish whimsy roses and holly", wall: ["#d7aba8",  "#fbc8c4",  "#ffd4cf"], src: "assets/wallpapers/set_bookish_whimsy.webp", pattern: `url("../assets/wallpapers/set_bookish_whimsy.webp?v=__VERSION__")`, size: "409px 365px", collection: true, light: true },
    { id: "set-cozy-sage", name: "Cozy sage holly and mistletoe", wall: ["#a4b094",  "#c0cdad",  "#cbd9b6"], src: "assets/wallpapers/set_cozy_sage.webp", pattern: `url("../assets/wallpapers/set_cozy_sage.webp?v=__VERSION__")`, size: "419px 356px", collection: true, light: true },
    { id: "set-fireside-library", name: "Fireside pinecones and berries", wall: ["#dac1ad",  "#fee2ca",  "#ffefd6"], src: "assets/wallpapers/set_fireside_library.webp", pattern: `url("../assets/wallpapers/set_fireside_library.webp?v=__VERSION__")`, size: "332px 449px", collection: true, light: true },
    { id: "set-ink-folklore", name: "Ink folklore berries and stars", wall: ["#d8c9bb",  "#fdecda",  "#fff9e7"], src: "assets/wallpapers/set_ink_folklore.webp", pattern: `url("../assets/wallpapers/set_ink_folklore.webp?v=__VERSION__")`, size: "367px 408px", collection: true, light: true },
    { id: "set-snowy-fairytale", name: "Snowy fairytale sprigs", wall: ["#d5cbc4",  "#faeee6",  "#fffbf3"], src: "assets/wallpapers/set_snowy_fairytale.webp", pattern: `url("../assets/wallpapers/set_snowy_fairytale.webp?v=__VERSION__")`, size: "387px 387px", collection: true, light: true },
    { id: "set-sugarplum-pastel", name: "Sugarplum berries on pink", wall: ["#dabfc2",  "#ffe0e3",  "#ffedef"], src: "assets/wallpapers/set_sugarplum_pastel.webp", pattern: `url("../assets/wallpapers/set_sugarplum_pastel.webp?v=__VERSION__")`, size: "488px 304px", collection: true, light: true },
    { id: "set-vintage-woodland", name: "Vintage woodland rosehips", wall: ["#d9be9e",  "#fedeb9",  "#ffeac3"], src: "assets/wallpapers/set_vintage_woodland.webp", pattern: `url("../assets/wallpapers/set_vintage_woodland.webp?v=__VERSION__")`, size: "343px 435px", collection: true, light: true },
    { id: "set-warm-gouache", name: "Warm gouache berries and pine", wall: ["#dac3b0",  "#ffe4ce",  "#fff1da"], src: "assets/wallpapers/set_warm_gouache.webp", pattern: `url("../assets/wallpapers/set_warm_gouache.webp?v=__VERSION__")`, size: "321px 463px", collection: true, light: true }
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


// The weather outside the window. "As the room likes" follows
// the room (and Rain on the window in Settings).
export const WEATHERS = [
    { id: "room", name: "As the room likes" },
    { id: "clear", name: "Clear" },
    { id: "rain", name: "Rain" },
    { id: "snow", name: "Snow" }
];


// The ceiling: the room's beams, or a collection's painted
// ceiling ("ratio" is its picture's width to height, for tiling).
export const CEILINGS = [
    { id: "room", name: "The room's own beams" },
    { id: "bookish-whimsy", name: "Bookish whimsy", ratio: 3.0000 },
    { id: "cozy-sage", name: "Cozy sage", ratio: 1.0691 },
    { id: "fireside-library", name: "Fireside library", ratio: 0.9807 },
    { id: "ink-folklore", name: "Ink folklore", ratio: 3.0000 },
    { id: "snowy-fairytale", name: "Snowy fairytale", ratio: 0.9807 },
    { id: "sugarplum-pastel", name: "Sugarplum pastel", ratio: 3.0000 },
    { id: "vintage-woodland", name: "Vintage woodland", ratio: 3.0000 },
    { id: "warm-gouache", name: "Warm gouache", ratio: 1.0552 }
];


// The collections: a wallpaper, ceiling, window and bookcase
// painted to go together, chosen in one tap.
export const COLLECTIONS =
    CEILINGS.filter((item) => item.ratio).map((item) => ({
        id: item.id,
        name: item.name,
        wallpaper: `set-${item.id}`,
        ceiling: item.id,
        window: `set-${item.id}`,
        case: `art-${item.id}`
    }));

const COLLECTION_KINDS = ["wallpaper", "ceiling", "window", "case"];

function collectionNow(fixtures) {
    return COLLECTIONS.find((set) => COLLECTION_KINDS.every((kind) => fixtures[kind] === set[kind])) || null;
}

export function chooseCollection(id) {

    const set =
        COLLECTIONS.find((item) => item.id === id);

    if (set) {
        COLLECTION_KINDS.forEach((kind) => chooseFixture(kind, set[kind]));
    }

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
    { id: "painted-black", name: "Black and gold", side: ["#050404", "#3a3226", "#1e1a16"], crown: ["#2e2820", "#1c1814", "#0e0c0a"], frieze: ["#241e18", "#120e0c"], back: ["#0c0a08", "#18140f"], board: ["#3a3226", "#24201a", "#14110e"] },
    // Painted bookcases (css/bookcase.css, PAINTED BOOKCASES); the
    // colours are for anything drawn rather than painted.
    { id: "art-walnut-evergreen", name: "Evergreen walnut", art: "walnut-evergreen", side: ["#3a2216", "#8f5335", "#824c31"], crown: ["#5f3525", "#573122", "#45271b"], frieze: ["#49291c", "#3c2217"], back: ["#351f14", "#43271a"], board: ["#905537", "#834e32", "#623a25"] },
    { id: "art-plum-star", name: "Plum with a star", art: "plum-star", side: ["#31191d", "#7a3e47", "#6f3941"], crown: ["#492326", "#432023", "#35191c"], frieze: ["#381b1d", "#2e1618"], back: ["#392015", "#48291b"], board: ["#7b3d46", "#703840", "#542a30"] },
    { id: "art-frosted-cream", name: "Frosted cream", art: "frosted-cream", side: ["#6a5c4c", "#ffe2bb", "#ecceaa"], crown: ["#cfa77d", "#bd9872", "#97795b"], frieze: ["#a08160", "#846a4f"], back: ["#3f2316", "#4f2c1c"], board: ["#f8d4ac", "#e2c19d", "#a99075"] },
    { id: "art-solstice-green", name: "Solstice green", art: "solstice-green", side: ["#2d2d1c", "#6f7046", "#656640"], crown: ["#525332", "#4b4c2e", "#3c3c24"], frieze: ["#3f4027", "#343520"], back: ["#442818", "#55321e"], board: ["#5c603b", "#545836", "#3f4228"] },
    // The collections' painted bookcases.
    { id: "art-bookish-whimsy", name: "Bookish whimsy", art: "bookish-whimsy", collection: true, side: ["#3a3e2e", "#8f9871", "#828b67"], crown: ["#d79580", "#c48875", "#9c6c5d"], frieze: ["#a67363", "#895f51"], back: ["#b49c7e", "#e1c39e"], board: ["#94ac82", "#879d77", "#657559"] },
    { id: "art-cozy-sage", name: "Cozy sage", art: "cozy-sage", collection: true, side: ["#3c3e2a", "#939867", "#868b5e"], crown: ["#939565", "#86885c", "#6b6c49"], frieze: ["#71734e", "#5d5f40"], back: ["#56341c", "#6c4224"], board: ["#8d9263", "#81855a", "#606343"] },
    { id: "art-fireside-library", name: "Fireside library", art: "fireside-library", collection: true, side: ["#3d1d12", "#95482e", "#88422a"], crown: ["#7b3422", "#70301f", "#592618"], frieze: ["#5f281a", "#4e2115"], back: ["#502416", "#642e1c"], board: ["#b44e2a", "#a44727", "#7b351d"] },
    { id: "art-ink-folklore", name: "Ink folklore", art: "ink-folklore", collection: true, side: ["#33363b", "#7d8692", "#727a85"], crown: ["#97664e", "#8a5d47", "#6e4a38"], frieze: ["#754f3c", "#604131"], back: ["#394234", "#485341"], board: ["#95634a", "#885a44", "#664333"] },
    { id: "art-snowy-fairytale", name: "Snowy fairytale", art: "snowy-fairytale", collection: true, side: ["#545a5e", "#cedee8", "#bccad3"], crown: ["#bdcdd9", "#acbbc6", "#89959e"], frieze: ["#929ea8", "#78828a"], back: ["#c19674", "#f2bc91"], board: ["#c9d9e4", "#b7c6d0", "#89949c"] },
    { id: "art-sugarplum-pastel", name: "Sugarplum pastel", art: "sugarplum-pastel", collection: true, side: ["#705a5a", "#ffdedd", "#f9cac9"], crown: ["#ffcdcc", "#f2bbba", "#c19594"], frieze: ["#cd9e9e", "#a98282"], back: ["#bea795", "#eed1bb"], board: ["#ffb8b6", "#eca8a6", "#b17e7c"] },
    { id: "art-vintage-woodland", name: "Vintage woodland", art: "vintage-woodland", collection: true, side: ["#543224", "#ce7b58", "#bc7050"], crown: ["#b6855b", "#a67953", "#846042"], frieze: ["#8d6646", "#74543a"], back: ["#6e3f32", "#8a4f3f"], board: ["#ca7a52", "#b86f4b", "#8a5338"] },
    { id: "art-warm-gouache", name: "Warm gouache", art: "warm-gouache", collection: true, side: ["#643b16", "#f59138", "#df8433"], crown: ["#f99142", "#e3843c", "#b56930"], frieze: ["#c07033", "#9e5c2a"], back: ["#5d2c17", "#75381d"], board: ["#e78231", "#d2772d", "#9d5921"] }
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
    ["wallpaper", "floor", "window", "wood", "curtains", "curtainColour", "rug", "rugColour", "time", "light", "tree", "season", "weather", "ceiling", "case"];

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
    weather: WEATHERS,
    ceiling: CEILINGS,
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
        return { wallpaper: "plaster", floor: "oak", window: "none", wood: prefs.wood, curtains: "none", curtainColour: "room", rug: "none", rugColour: "room", time: "night", light: "bright", tree: "oak", season: "auto", weather: "room", ceiling: "room", case: "walnut", hidden: "", windowX: null, windowY: null, windowRoom: false, rugX: null, rugY: null, rugRoom: false, caseX: null, caseSize: 1 };
    }

    return { wallpaper: "room", floor: "room", window: prefs.window, wood: prefs.wood, curtains: prefs.curtains, curtainColour: "room", rug: prefs.rug, rugColour: "room", time: "night", light: "bright", tree: "oak", season: "auto", weather: "room", ceiling: "room", case: "room", hidden: "", windowX: null, windowY: null, windowRoom: false, rugX: null, rugY: null, rugRoom: false, caseX: null, caseSize: 1 };

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
    // Snowing, with the season left to the calendar: winter outside.
    root.dataset.season = fixtures.season !== "auto" ? fixtures.season : fixtures.weather === "snow" ? "winter" : seasonNow();
    root.dataset.weather = fixtures.weather;

    // A painted ceiling, over the room's beams (css/room.css).
    const ceiling =
        CEILINGS.find((item) => item.id === fixtures.ceiling);

    if (ceiling?.ratio) {
        root.dataset.ceiling = ceiling.id;
        root.style.setProperty("--ceiling-art", `url("../assets/ceilings/${ceiling.id}.webp?v=__VERSION__")`);
        root.style.setProperty("--ceiling-art-ratio", String(ceiling.ratio));
    }
    else {
        delete root.dataset.ceiling;
        root.style.removeProperty("--ceiling-art");
        root.style.removeProperty("--ceiling-art-ratio");
    }
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

    // A painted bookcase (css/bookcase.css).
    if (finish?.art) {
        root.dataset.caseArt = finish.art;
    } else {
        delete root.dataset.caseArt;
    }

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

    placeCase(fixtures);

}


/*
    Where the window hangs: its middle as a share of the wall
    (the same measure as the wall's decorations), or its usual
    place beside the bookcase.
*/

/*
    THE WHOLE ROOM
    On a computer the room is one wall, floor to ceiling, with the
    bookcase standing free in it. Things measured across the whole
    room (the bookcase, a moved window or rug, pieces in the room
    layer) use a share of its width; the wall side (.journal-zone,
    where the window, chair and older pieces are measured) is its
    right-hand 1.04 of 2.04. On a phone the same measures fall
    across the room beside the shelves.
*/

export const ROOM_SPAN = 2.04 / 1.04;
export const ROOM_START = -100 / 1.04;

// The whole room's width over the wall side's. On a phone it is
// measured (js/room/fit-room.js sets --room-span): the whole
// screen's width, shelves and all, so a piece stands in the same
// place across the room as it does on a computer, not behind the
// shelves.
export function roomSpan() {

    const room =
        document.querySelector(".library-room");

    const measured =
        room ? Number.parseFloat(getComputedStyle(room).getPropertyValue("--room-span")) : 0;

    return measured > 1 ? measured : ROOM_SPAN;

}

// A share of the whole room's width, as a share of the wall side.
export function wallSide(x) {
    const span = roomSpan();
    return x * span - (span - 1) * 100;
}

// The whole room's box on the screen.
export function roomBox() {

    const zone =
        document.querySelector(".library-room .journal-zone")?.getBoundingClientRect();

    if (!zone) {
        return null;
    }

    const width =
        zone.width * roomSpan();

    return { left: zone.right - width, right: zone.right, width, top: zone.top, bottom: zone.bottom, height: zone.height };

}


/*
    Where the bookcase stands: its middle as a share of the whole
    room, or its usual place (the middle of the left side).
*/

function placeCase(fixtures) {

    const room =
        document.querySelector(".library-room");

    if (!room) {
        return;
    }

    // How big it stands (Decorate → The room → Bookcase → Size);
    // js/room/fit-room.js scales it by this.
    const size =
        Number(fixtures.caseSize) || 1;

    if (size === 1) {
        room.style.removeProperty("--case-size");
    }

    else {
        room.style.setProperty("--case-size", String(size));
    }

    document.dispatchEvent(new CustomEvent("novellow:case-sized"));

    if (fixtures.caseX === null || fixtures.caseX === undefined) {
        room.style.removeProperty("--case-x");
        return;
    }

    room.style.setProperty("--case-x", `${fixtures.caseX}%`);

}


/*
    Making the bookcase bigger or smaller: from a little smaller
    than usual to about half again as big. Saved on its row's
    scale, so it keeps its place and finish.
*/

export const CASE_SIZE_LEAST = 0.8;
export const CASE_SIZE_MOST = 1.6;

export function sizeCase(size, { persist = true } = {}) {

    const theme =
        themeId || document.documentElement.dataset.theme;

    const fixtures = {
        ...getFixtures(theme),
        caseSize: Number(Math.min(CASE_SIZE_MOST, Math.max(CASE_SIZE_LEAST, Number(size) || 1)).toFixed(2))
    };

    writeCache(theme, fixtures);

    placeCase(fixtures);

    if (persist) {
        save("case", fixtures.case, { scale: fixtures.caseSize });
    }

}


export function moveCase(x, { persist = true } = {}) {

    const theme =
        themeId || document.documentElement.dataset.theme;

    const fixtures = {
        ...getFixtures(theme),
        caseX: Number(Math.min(96, Math.max(4, x)).toFixed(2))
    };

    writeCache(theme, fixtures);

    placeCase(fixtures);

    if (persist) {
        save("case", fixtures.case, { position_x: fixtures.caseX, rotation: 2 });
    }

}


export function resetCase() {

    const theme =
        themeId || document.documentElement.dataset.theme;

    const fixtures =
        { ...getFixtures(theme), caseX: null };

    writeCache(theme, fixtures);

    placeCase(fixtures);

    save("case", fixtures.case, { rotation: 0 });

}


/*
    Dragging the bookcase along the floor while arranging. It
    stays standing on the floor and inside the room.
*/

export function dragCase(event) {

    const zone =
        document.querySelector(".library-room > .bookcase-zone");

    const bookcase =
        zone?.querySelector(".bookcase");

    const box =
        roomBox();

    if (!zone || !bookcase || !box) {
        return false;
    }

    event.preventDefault();

    zone.setPointerCapture?.(event.pointerId);

    const start =
        bookcase.getBoundingClientRect();

    const startX =
        ((start.left + start.width / 2 - box.left) / box.width) * 100;

    // Half the bookcase, as a share of the room: it keeps inside.
    const half =
        (start.width / 2 / box.width) * 100;

    let last = null;
    let moved = false;

    const move = (moveEvent) => {

        if (moveEvent.pointerId !== event.pointerId) {
            return;
        }

        if (!moved && Math.abs(moveEvent.clientX - event.clientX) < 5) {
            return;
        }

        if (!moved) {
            moved = true;
            zone.classList.add("is-dragging");
        }

        last = Math.min(100 - half, Math.max(half, startX + ((moveEvent.clientX - event.clientX) / box.width) * 100));

        moveCase(last, { persist: false });

    };

    const finish = (upEvent) => {

        if (upEvent.pointerId !== event.pointerId) {
            return;
        }

        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", finish);
        window.removeEventListener("pointercancel", finish);

        zone.classList.remove("is-dragging");

        if (last !== null) {
            moveCase(last);
            document.dispatchEvent(new CustomEvent("novellow:case-moved"));
        }

    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);

    return true;

}


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

    // Measured across the whole room (moved since the room became
    // one wall) or across the wall side (moved before).
    const x =
        fixtures.windowRoom ? wallSide(fixtures.windowX) : fixtures.windowX;

    wall.style.setProperty("--window-left", `calc(max(var(--window-least, -200%), ${x.toFixed(2)}%) - var(--window-width) / 2)`);
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

    const x =
        fixtures.rugRoom ? wallSide(fixtures.rugX) : fixtures.rugX;

    floor.style.setProperty("--rug-left", `max(var(--rug-least, -200%), ${x.toFixed(2)}%)`);
    floor.style.setProperty("--rug-bottom", `${-10 - fixtures.rugY * 0.7}px`);

}


export function moveRug(x, y, { persist = true } = {}) {

    const theme =
        themeId || document.documentElement.dataset.theme;

    // Across the whole room's floor.
    const fixtures = {
        ...getFixtures(theme),
        rugX: Number(Math.min(100, Math.max(0, x)).toFixed(2)),
        rugY: Number(Math.min(100, Math.max(0, y)).toFixed(2)),
        rugRoom: true
    };

    writeCache(theme, fixtures);

    placeRug(fixtures);

    if (persist) {
        save("rug", fixtures.rug, { position_x: fixtures.rugX, position_y: fixtures.rugY, rotation: 2 });
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

    // Measured across the whole room's floor.
    const box =
        roomBox() || floor.getBoundingClientRect();

    const start =
        rug.getBoundingClientRect();

    const current =
        getFixtures();

    // Start from where the rug is now, moved or not.
    const startX = ((start.left + start.width / 2 - box.left) / box.width) * 100;
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

        // rotation 1: moved, measured across the wall side;
        // 2: moved, measured across the whole room.
        if (kind === "window" && (row.rotation === 1 || row.rotation === 2)) {
            values.windowX = Number(row.position_x);
            values.windowY = Number(row.position_y);
            values.windowRoom = row.rotation === 2;
        }

        if (kind === "rug" && (row.rotation === 1 || row.rotation === 2)) {
            values.rugX = Number(row.position_x);
            values.rugY = Number(row.position_y);
            values.rugRoom = row.rotation === 2;
        }

        if (kind === "case" && row.rotation === 2) {
            values.caseX = Number(row.position_x);
        }

        if (kind === "case" && Number(row.scale) >= 0.8 && Number(row.scale) <= 1.6) {
            values.caseSize = Number(row.scale);
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

    // x across the whole room, y down the wall.
    const fixtures = {
        ...getFixtures(theme),
        windowX: Number(Math.min(96, Math.max(4, x)).toFixed(2)),
        windowY: Number(Math.min(78, Math.max(18, y)).toFixed(2)),
        windowRoom: true
    };

    writeCache(theme, fixtures);

    placeWindow(fixtures);

    if (persist) {
        save("window", fixtures.window, { position_x: fixtures.windowX, position_y: fixtures.windowY, rotation: 2 });
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

    // Across the whole room; down the wall side.
    const across =
        roomBox() || box;

    const at = (moveEvent) => ({
        x: ((moveEvent.clientX - grabX - across.left) / across.width) * 100,
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
            return `background: url("${choice.src}?v=__VERSION__") center / ${choice.holiday || choice.collection ? Math.round(parseFloat(choice.size) * 0.5) : 90}px auto`;
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

    if (kind === "ceiling") {
        return choice.ratio
            ? `background: url("assets/ceilings/${choice.id}.webp?v=__VERSION__") left center / auto 100% repeat-x`
            : `background: repeating-linear-gradient(90deg, #2a190f 0 10px, #6a432c 10px 22px, #2a190f 22px 32px)`;
    }

    if (kind === "case" && choice.art) {
        return `background: url("assets/bookcases/${choice.art}/thumb.webp?v=__VERSION__") center / contain no-repeat, #3a2a24`;
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


function swatches(kind, label, current, only = () => true) {

    return html`
        <fieldset class="room-choices">
            <legend class="room-choices__label">${label}</legend>
            <div class="room-choices__swatches">
                ${CHOICES[kind].filter(only).map((choice) => html`
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
// The winter windows are painted with their own view (and some
// with curtains), so a few of the room's choices don't reach them.
function windowNote(id) {

    const shape =
        WINDOW_SHAPES.find((item) => item.id === id);

    if (!shape?.view) {
        return "";
    }

    if (shape.layered) {
        return shape.curtains
            ? " Its own view drifts past its panes, with your weather in front of it. It has its own curtains, so the room's curtains and frame wood don't change it."
            : " Its own view drifts past its panes, with your weather in front of it. The frame wood doesn't change it, but you can add curtains.";
    }

    return shape.curtains
        ? " This one has its own snowy view and curtains, so the view outside, the curtains and the frame wood don't change it."
        : " This one has its own snowy view, so the view outside and the frame wood don't change it.";

}


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
            return html`
                ${swatches("wallpaper", "Wallpaper", fixtures.wallpaper, (choice) => !choice.holiday && !choice.collection)}
                ${swatches("wallpaper", "Collection wallpaper", fixtures.wallpaper, (choice) => choice.collection)}
                ${swatches("wallpaper", "Holiday wallpaper", fixtures.wallpaper, (choice) => choice.holiday)}
            `;

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
                    <p class="room-choices__note">Drag the window in the room to move it.${windowNote(fixtures.window)}</p>
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
                ${chips("weather", "Weather", fixtures.weather)}
            `;

        case "light":
            return chips("light", "Light in the room", fixtures.light);

        case "ceiling":
            return swatches("ceiling", "Ceiling", fixtures.ceiling);

        case "collection": {
            const now = collectionNow(fixtures);
            return html`
                <fieldset class="room-choices">
                    <legend class="room-choices__label">A whole collection</legend>
                    <p class="room-choices__note">Its wallpaper, ceiling, window and bookcase in one tap. Change any of them after, as you like.</p>
                    <div class="room-choices__tiles">
                        ${COLLECTIONS.map((set) => html`
                            <button class="room-tile ${now?.id === set.id ? "is-current" : ""}" type="button" data-collection="${set.id}" aria-pressed="${String(now?.id === set.id)}" title="${set.name}">
                                <img src="assets/bookcases/${set.id}/thumb.webp?v=__VERSION__" alt="" loading="lazy" draggable="false">
                                <span>${set.name}</span>
                            </button>
                        `)}
                    </div>
                </fieldset>
            `;
        }

        case "bookcase":
            return html`
                ${swatches("case", "The bookcase", fixtures.case, (choice) => !choice.collection)}
                ${swatches("case", "Collection bookcases", fixtures.case, (choice) => choice.collection)}
                <label class="room-size">
                    <span class="room-size__label">Size</span>
                    <span class="room-size__end" aria-hidden="true">Smaller</span>
                    <input type="range" data-case-size min="0.8" max="1.6" step="0.05" value="${Number(fixtures.caseSize) || 1}" aria-label="How big the bookcase stands">
                    <span class="room-size__end" aria-hidden="true">Bigger</span>
                </label>
                <p class="room-choices__note room-choices__note--wide">On a computer or tablet, drag the bookcase along the floor to move it (the pieces on its shelves come with it), and tap it when you're not decorating to look closer.</p>
                ${fixtures.caseX === null || fixtures.caseX === undefined ? "" : html`
                    <button class="text-button room-choices__reset" type="button" data-fixture-action="reset-case">Put the bookcase back in its usual place</button>
                `}
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
    What's chosen for one part of the room, in a few words, for
    the heading of its section in the decorating panel.
*/

export function roomSummary(section) {

    const fixtures =
        getFixtures();

    const name = (kind, id) =>
        CHOICES[kind].find((choice) => choice.id === id)?.name || "";

    const theme =
        document.documentElement.dataset.theme;

    switch (section) {

        case "wallpaper":
            return name("wallpaper", fixtures.wallpaper);

        case "floor":
            return [name("floor", fixtures.floor), fixtures.rug === "none" ? "" : name("rug", fixtures.rug)].filter(Boolean).join(", ");

        case "window":
            return fixtures.window === "none" ? name("window", "none") : [name("window", fixtures.window), fixtures.curtains === "none" ? "" : name("curtains", fixtures.curtains)].filter(Boolean).join(", ");

        case "outside":
            return [name("time", fixtures.time), fixtures.weather === "room" ? "" : name("weather", fixtures.weather)].filter(Boolean).join(", ");

        case "light":
            return name("light", fixtures.light);

        case "ceiling":
            return name("ceiling", fixtures.ceiling);

        case "collection":
            return collectionNow(fixtures)?.name || "Mix and match";

        case "bookcase":
            return name("case", fixtures.case);

        case "built-in": {
            const hidden = new Set(String(fixtures.hidden || "").split(",").filter(Boolean));
            const parts = BUILT_IN.filter((part) => part.rooms.includes(theme));
            const kept = parts.filter((part) => !hidden.has(part.id)).length;
            return parts.length ? `${kept} of ${parts.length} in the room` : "";
        }

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

    const set =
        event.target.closest("[data-collection]");

    if (set) {
        chooseCollection(set.dataset.collection);
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

    if (event.target.closest("[data-fixture-action=reset-case]")) {
        resetCase();
        return true;
    }

    return false;

}
