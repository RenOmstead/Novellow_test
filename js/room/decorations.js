/* =========================================================
   NOVELLOW
   DECORATIONS

   The reader's own decorations on the library room: pick a
   piece, drag it anywhere on the wall or the bookcase, make
   it bigger or smaller, tilt it, bring it forward. Each room
   theme keeps its own arrangement, saved in the Supabase
   "decorations" table.

   Outside "Edit the room" the pieces are pictures only:
   they never catch a click meant for a book.

   While arranging, the pieces wait in a tray that stays on
   screen as the page scrolls: a panel down one side on a
   computer, a strip along the bottom on a phone. Tap a piece
   to drop it into the part of the room in view, or drag it
   straight to its spot.
========================================================= */

import { listDecorations, createRow, updateRow, deleteRow } from "../core/store.js?v=__VERSION__";
import { html, raw, render, clamp, debounce } from "../core/helpers.js?v=__VERSION__";
import { art, toast, toastError } from "../core/ui.js?v=__VERSION__";
import { takeRoomPicture } from "./capture.js?v=__VERSION__";
import { paintedFx, isSnowGlobe } from "./painted-fx.js?v=__VERSION__";
import { setFixtureRows, roomSectionMarkup, roomSummary, onRoomPanelClick, dragWindow, dragRug, dragCase, sizeCase, sizeWindow, roomBox, builtInAt, builtInElements, toggleBuiltIn } from "./fixtures.js?v=__VERSION__";


/*
    Pieces the reader can place: sprite symbol, its viewBox,
    width in pixels at scale 1, and a friendly name.
*/

export const DECOR_GROUPS = [
    { id: "seating", name: "Seating" },
    { id: "tables", name: "Tables" },
    { id: "tabletop", name: "Mugs & tea" },
    { id: "lighting", name: "Lamps" },
    { id: "storage", name: "Storage & hearth" },
    { id: "pictures", name: "Pictures" },
    { id: "garlands", name: "Garlands & cobwebs" },
    { id: "vines", name: "Ivy & vines" },
    { id: "bookish", name: "Bookish" },
    { id: "cozy", name: "Cozy" },
    { id: "treats", name: "Treats" },
    { id: "autumn", name: "Autumn" },
    { id: "plants", name: "Plants" },
    { id: "witchy", name: "Witchy" },
    { id: "spooky", name: "Spooky" },
    { id: "haunted", name: "Haunted" },
    { id: "rugs", name: "Rugs" },
    // The holidays, alphabetical, so none comes first by default.
    { id: "holiday-christmas", name: "Christmas" },
    { id: "holiday-hanukkah", name: "Hanukkah" },
    { id: "holiday-harvest", name: "Harvest" },
    { id: "holiday-krampus", name: "Krampus" },
    { id: "holiday-kwanzaa", name: "Kwanzaa" },
    { id: "holiday-new-year", name: "New Year" },
    { id: "holiday-winter", name: "Winter" },
    { id: "holiday-yule", name: "Yule" },
    // The collections: whole rooms painted in one style each
    // (assets/decor/sets/), alphabetical.
    { id: "set-bookish-whimsy", name: "Bookish whimsy" },
    { id: "set-cozy-sage", name: "Cozy sage" },
    { id: "set-fireside-library", name: "Fireside library" },
    { id: "set-ink-folklore", name: "Ink folklore" },
    { id: "set-snowy-fairytale", name: "Snowy fairytale" },
    { id: "set-sugarplum-pastel", name: "Sugarplum pastel" },
    { id: "set-vintage-woodland", name: "Vintage woodland" },
    { id: "set-warm-gouache", name: "Warm gouache" }
];


/*
    THE CATALOGUE
    Every piece has a kind (what it is) and a style (the mood
    it's for), so the panel can find it either way: all the
    lamps, or everything for Christmas, or just the spooky
    lamps. "icon" is a piece drawn on the kind's button.
*/

export const PIECE_KINDS = [
    // Every piece of the painted collections, set by set.
    { id: "collections", name: "Collections", icon: "set-cottage-snowglobe" },
    { id: "furniture", name: "Furniture", icon: "art-armchair-plum" },
    { id: "lights", name: "Lights", icon: "art-fringed-lamp" },
    { id: "wall", name: "Wall", icon: "art-ghost-moon-portrait" },
    { id: "tabletop", name: "Tabletop", icon: "art-pink-teacup" },
    { id: "plants", name: "Plants", icon: "art-potted-mushrooms" },
    { id: "rugs", name: "Rugs", icon: "art-rug-night-sky" },
    { id: "friends", name: "Friends", icon: "art-black-cat" }
];

export const PIECE_STYLES = [
    { id: "everyday", name: "Everyday" },
    { id: "autumn", name: "Autumn" },
    { id: "spooky", name: "Spooky" },
    { id: "holiday", name: "Holidays" },
    { id: "collection", name: "Collections" }
];

// The holidays (alphabetical, so none comes first), and the
// collections: the choices under those two styles.
export const PIECE_HOLIDAYS =
    DECOR_GROUPS.filter((group) => group.id.startsWith("holiday-"));

export const PIECE_COLLECTIONS =
    DECOR_GROUPS.filter((group) => group.id.startsWith("set-"));

// Groups that are all one kind of thing.
const KIND_OF_GROUP = {
    seating: "furniture", tables: "furniture", storage: "furniture",
    lighting: "lights",
    pictures: "wall", garlands: "wall", vines: "wall",
    tabletop: "tabletop", treats: "tabletop", bookish: "tabletop",
    plants: "plants",
    rugs: "rugs"
};

// The rest (the cozy, autumn, spooky and holiday groups mix all
// sorts) go by what each piece is, the first match winning.
const KIND_WORDS = [
    ["tabletop", /candle box|mkeka|gift/],
    ["friends", /^ghost (with|cat|and|knitting|reading)|^bat in|^sleepy bat/],
    ["rugs", /\brug\b/],
    ["wall", /wreath|garland|bunting|portrait|painting|frame|plaque|\bsign\b|mirror|cobweb|stocking|hanging star|snowflake|mobile|sconce|cloak/],
    ["lights", /lamp|lantern|candle|candelabra|chandelier|fairy lights|hanukkiah|kinara|fireflies/],
    ["tabletop", /mug|cup|\btea\b|teapot|cocoa|latte|plate|cookie|cake|\bpie\b|book|glass|bottle|jar\b|bowl|dish|pitcher|basket|figurine|globe|dreidel|gelt|\bhat\b|watch|clock|camera|socks|slippers|boots|cardigan|headphones|watercolours|embroidery|\bbow\b|potion|crystal|skull|mask|brew|poison|newt|charm|incense|cloche|planchette|pestle|razor|camcorder|padlock|doll|herb|corn|fruit|oranges|pinecones|throw|cushion|mittens|\bbell\b|\bboot\b|sufganiyot|latkes|turkey|acorn|umbrella$/],
    ["friends", /\bcat\b|\bdog\b|ghost|\bbats?\b|raven|crow|mouse|spider|snake|\bmoth\b|goat|snowman|gargoyle/],
    ["plants", /\btree\b|\bpine\b|plant|fern|\bivy\b|flower|roses|mushroom|toadstool|olive branch|evergreen|wheat|vine/],
    ["furniture", /chair|sofa|table|cabinet|bookcase|fireplace|television|\btv\b|gramophone|stand\b|trunk|sled|birdcage|cauldron|broom|stump/]
];

const SPOOKY_WORDS =
    /ghost|\bbats?\b|batty|skull|cobweb|spider|witch|haunted|vampire|raven|crow|coffin|potion|spell|gothic|gargoyle|planchette|tarot|cauldron|all-seeing|\beye\b|thorn|moth\b|anatomical|poison|tattered|torn\b|cracked|rusty|masked|void|black cat|spooky/;

const AUTUMN_WORDS =
    /pumpkin|autumn|maple|\bleaf\b|leaves|acorn|october|jack-o|cider|spice|apple|sunflower/;

// The winter rugs came with the holiday pieces.
const HOLIDAY_OF_PIECE = {
    "hol-rug-burgundy-stars": "holiday-christmas",
    "hol-rug-winter-plaid": "holiday-winter",
    "hol-rug-frosted-snowflake": "holiday-winter",
    "hol-rug-solstice-orange": "holiday-yule"
};

const catalogue =
    new Map();

// A piece's kind, style and (for the holidays) which holiday.
export function catalogueEntry(asset) {

    if (catalogue.has(asset.id)) {
        return catalogue.get(asset.id);
    }

    const name =
        asset.name.toLowerCase();

    const kind =
        asset.kind || KIND_OF_GROUP[asset.group] || KIND_WORDS.find(([, words]) => words.test(name))?.[0] || "tabletop";

    const holiday =
        asset.group.startsWith("holiday-") ? asset.group : HOLIDAY_OF_PIECE[asset.id] || null;

    const collection =
        asset.group.startsWith("set-") ? asset.group : null;

    const style =
        collection ? "collection"
            : holiday ? "holiday"
            : ["witchy", "spooky", "haunted"].includes(asset.group) ? "spooky"
                : asset.group === "autumn" ? "autumn"
                    : SPOOKY_WORDS.test(name) ? "spooky"
                        : AUTUMN_WORDS.test(name) ? "autumn"
                            : "everyday";

    // "sub" is the holiday or collection, for the panel's second row.
    const entry =
        { kind, style, holiday, collection, sub: holiday || collection };

    catalogue.set(asset.id, entry);

    return entry;

}

export const DECOR_ASSETS = [
    // Hand-painted pieces (pictures, not drawings): each shows first in its tab.
    { id: "art-armchair-plum", src: "assets/decor/painted/armchair_plum.webp", size: [478, 379], width: 190, name: "Wine armchair", group: "seating" },
    { id: "art-curio-cabinet", src: "assets/decor/painted/curio_cabinet.webp", size: [376, 478], width: 170, name: "Curio cabinet", group: "storage" },
    { id: "art-coffin-cabinet", src: "assets/decor/painted/coffin_cabinet.webp", size: [308, 414], width: 130, name: "Coffin cabinet", group: "storage" },
    { id: "art-door-knocker", src: "assets/decor/painted/door_knocker.webp", size: [308, 460], width: 70, name: "Door knocker", group: "pictures" },
    { id: "art-ghost-moon-portrait", src: "assets/decor/painted/ghost_moon_portrait.webp", size: [391, 460], width: 95, name: "Ghost in a gilded frame", group: "pictures" },
    { id: "art-orb-garland", src: "assets/decor/painted/orb_garland.webp", size: [460, 237], width: 200, name: "Moon lantern garland", group: "garlands" },
    { id: "art-charcoal-wingback", src: "assets/decor/painted/charcoal_wingback.webp", size: [410, 478], width: 190, name: "Charcoal wingback", group: "seating" },
    { id: "art-wine-sofa", src: "assets/decor/painted/wine_sofa.webp", size: [478, 251], width: 290, name: "Wine camelback sofa", group: "seating" },
    { id: "art-walnut-bookcase", src: "assets/decor/painted/walnut_bookcase.webp", size: [373, 478], width: 160, name: "Walnut bookcase", group: "storage" },
    { id: "art-walnut-desk", src: "assets/decor/painted/walnut_desk.webp", size: [478, 337], width: 210, name: "Walnut writing desk", group: "tables" },
    { id: "art-walnut-pedestal-table", src: "assets/decor/painted/walnut_pedestal_table.webp", size: [338, 380], width: 120, name: "Walnut pedestal table", group: "tables" },
    { id: "art-grey-fireplace", src: "assets/decor/painted/grey_fireplace.webp", size: [478, 379], width: 250, name: "Grey stone fireplace", group: "storage" },
    { id: "art-sofa-pumpkin", src: "assets/decor/painted/sofa_pumpkin.webp", size: [420, 258], width: 300, name: "Pumpkin scalloped sofa", group: "seating" },
    { id: "art-moon-pillow", src: "assets/decor/painted/moon_pillow.webp", size: [198, 157], width: 90, name: "Plaid moon pillow", group: "seating" },
    { id: "art-side-table", src: "assets/decor/painted/side_table.webp", size: [214, 230], width: 120, name: "Carved cabinet table", group: "tables" },
    { id: "art-gothic-bookcase", src: "assets/decor/painted/gothic_bookcase.webp", size: [350, 420], width: 150, name: "Gothic bookcase", group: "storage" },
    { id: "art-apothecary-cabinet", src: "assets/decor/painted/potion_cabinet.webp", size: [378, 472], width: 200, name: "Potion cabinet", group: "retired" },
    { id: "art-stone-fireplace", src: "assets/decor/painted/stone_fireplace.webp", size: [478, 414], width: 250, name: "Dark stone fireplace", group: "storage" },
    { id: "art-fringed-lamp", src: "assets/decor/painted/fringed_lamp.webp", size: [240, 460], width: 100, name: "Fringed floor lamp", group: "lighting" },
    { id: "art-candelabra", src: "assets/decor/painted/candelabra.webp", size: [329, 460], width: 100, name: "Brass candelabra", group: "lighting" },
    { id: "art-hanging-lantern", src: "assets/decor/painted/hanging_lantern.webp", size: [201, 460], width: 60, name: "Hanging lantern", group: "lighting" },
    { id: "art-pumpkin-lantern", src: "assets/decor/painted/pumpkin_lantern.webp", size: [298, 418], width: 80, name: "Pumpkin lantern", group: "lighting" },
    { id: "art-moon-lamp", src: "assets/decor/painted/moon_lamp.webp", size: [306, 434], width: 90, name: "Crescent moon lamp", group: "lighting" },
    { id: "art-star-garland", src: "assets/decor/painted/star_garland.webp", size: [460, 281], width: 240, name: "Moon and star garland", group: "garlands" },
    { id: "art-retro-tv", src: "assets/decor/painted/retro_tv.webp", size: [468, 410], width: 150, name: "Retro television", group: "cozy" },
    { id: "art-vhs-stack", src: "assets/decor/painted/vhs_stack.webp", size: [440, 362], width: 100, name: "Stack of tapes", group: "cozy" },
    { id: "art-rotary-phone", src: "assets/decor/painted/rotary_phone.webp", size: [478, 314], width: 100, name: "Rotary telephone", group: "cozy" },
    { id: "art-camp-sign", src: "assets/decor/painted/camp_sign.webp", size: [460, 458], width: 150, name: "Pine tree banner", group: "pictures" },
    { id: "art-flashlight", src: "assets/decor/painted/flashlight.webp", size: [460, 322], width: 80, name: "Flashlight", group: "cozy" },
    { id: "art-jack-o-lantern", src: "assets/decor/painted/jack_o_lantern.webp", size: [446, 426], width: 100, name: "Jack-o'-lantern", group: "autumn" },
    { id: "art-autumn-wreath", src: "assets/decor/painted/autumn_wreath.webp", size: [429, 460], width: 130, name: "Autumn leaf wreath", group: "garlands" },
    { id: "art-bubbling-cauldron", src: "assets/decor/painted/cauldron.webp", size: [474, 408], width: 120, name: "Black cauldron", group: "witchy" },
    { id: "art-potion-trio", src: "assets/decor/painted/potion_trio.webp", size: [456, 402], width: 110, name: "Three potions", group: "witchy" },
    { id: "art-witch-hat", src: "assets/decor/painted/witch_hat.webp", size: [478, 409], width: 130, name: "Witch's hat", group: "witchy" },
    { id: "art-ghost", src: "assets/decor/painted/ghost.webp", size: [398, 446], width: 110, name: "Friendly ghost", group: "spooky" },
    { id: "art-ghost-friend", src: "assets/decor/painted/ghost.webp", size: [398, 446], width: 100, name: "Little ghost", group: "retired" },
    { id: "art-bat", src: "assets/decor/painted/bat.webp", size: [460, 275], width: 130, name: "Hanging bat", group: "garlands" },
    { id: "art-rug-night-sky", src: "assets/decor/painted/rug_night_sky.webp", size: [460, 335], width: 280, name: "Night sky rug", group: "rugs", floor: true },
    { id: "art-rug-mushroom", src: "assets/decor/painted/rug_mushroom.webp", size: [460, 304], width: 280, name: "Mushroom rug", group: "rugs", floor: true },
    { id: "art-rug-pumpkin", src: "assets/decor/painted/rug_pumpkin.webp", size: [249, 154], width: 260, name: "Pumpkin rug", group: "rugs", floor: true },
    { id: "art-rug-crescent", src: "assets/decor/painted/rug_moon.webp", size: [388, 454], width: 260, name: "Crescent moon rug", group: "retired", floor: true },
    { id: "art-tattered-wingback", src: "assets/decor/painted/tattered_wingback.webp", size: [310, 308], width: 190, name: "Tattered wingback", group: "seating" },
    { id: "art-torn-recliner", src: "assets/decor/painted/torn_recliner.webp", size: [312, 308], width: 210, name: "Torn recliner", group: "seating" },
    { id: "art-haunted-tv-stand", src: "assets/decor/painted/tv_stand.webp", size: [440, 466], width: 200, name: "TV stand", group: "storage" },
    { id: "art-dusty-bookcase", src: "assets/decor/painted/leaning_bookcase.webp", size: [368, 478], width: 160, name: "Dusty bookcase", group: "retired" },
    { id: "art-rusty-locker", src: "assets/decor/painted/rusty_locker.webp", size: [338, 476], width: 160, name: "Rusty locker", group: "storage" },
    { id: "art-phone-table", src: "assets/decor/painted/phone_table.webp", size: [322, 418], width: 150, name: "Telephone table", group: "tables" },
    { id: "art-stitched-mask", src: "assets/decor/painted/stone_mask.webp", size: [402, 426], width: 80, name: "Masquerade mask", group: "haunted" },
    { id: "art-button-eye-doll", src: "assets/decor/painted/voodoo_doll.webp", size: [385, 478], width: 110, name: "Stitched doll", group: "haunted" },
    { id: "art-rusty-saw", src: "assets/decor/painted/saw_stump.webp", size: [478, 410], width: 150, name: "Saw in a stump", group: "haunted" },
    { id: "art-axe-stump", src: "assets/decor/painted/axe_stump.webp", size: [427, 478], width: 140, name: "Axe in a stump", group: "haunted" },
    { id: "art-straight-razor", src: "assets/decor/painted/straight_razor.webp", size: [262, 190], width: 130, name: "Straight razor", group: "haunted" },
    { id: "art-hanging-cloak", src: "assets/decor/painted/hanging_cloak.webp", size: [292, 478], width: 110, name: "Hanging red cloak", group: "haunted" },
    { id: "art-red-cage-lamp", src: "assets/decor/painted/red_lantern.webp", size: [268, 460], width: 90, name: "Red cage lamp", group: "retired" },
    { id: "art-rusty-flashlight", src: "assets/decor/painted/flashlight.webp", size: [460, 322], width: 120, name: "Rusty flashlight", group: "retired" },
    { id: "art-oil-lantern", src: "assets/decor/painted/red_lantern.webp", size: [268, 460], width: 80, name: "Oil lantern", group: "retired" },
    { id: "art-torn-lamp", src: "assets/decor/painted/fringed_lamp.webp", size: [240, 460], width: 110, name: "Torn red lamp", group: "retired" },
    { id: "art-screaming-candle", src: "assets/decor/painted/skull_candle.webp", size: [413, 460], width: 90, name: "Screaming candle", group: "retired" },
    { id: "art-hanging-shop-lamp", src: "assets/decor/painted/pendant_lamp.webp", size: [434, 402], width: 120, name: "Green pendant lamp", group: "lighting" },
    { id: "art-rug-handprint", src: "assets/decor/painted/rug_handprint.webp", size: [396, 456], width: 270, name: "Handprint rug", group: "rugs", floor: true },
    { id: "art-rug-checker", src: "assets/decor/painted/rug_checker.webp", size: [460, 209], width: 220, name: "Checkered rug", group: "rugs", floor: true },
    { id: "art-rug-mask", src: "assets/decor/painted/rug_mask.webp", size: [298, 149], width: 280, name: "Masked face rug", group: "rugs", floor: true },
    { id: "art-rug-dead-tree", src: "assets/decor/painted/rug_dead_tree.webp", size: [271, 152], width: 270, name: "Bare tree rug", group: "rugs", floor: true },
    { id: "art-rug-thorn-spiral", src: "assets/decor/painted/rug_thorn_spiral.webp", size: [230, 169], width: 230, name: "Thorn spiral rug", group: "rugs", floor: true },
    { id: "art-rug-footprints", src: "assets/decor/painted/rug_footprints.webp", size: [460, 350], width: 250, name: "Footprints rug", group: "rugs", floor: true },
    { id: "art-worn-books", src: "assets/decor/painted/worn_books.webp", size: [209, 183], width: 110, name: "Worn book stack", group: "bookish" },
    { id: "art-camcorder", src: "assets/decor/painted/camcorder.webp", size: [476, 328], width: 120, name: "Old camcorder", group: "haunted" },
    { id: "art-cream-phone", src: "assets/decor/painted/rotary_phone.webp", size: [478, 314], width: 110, name: "Cream push-button phone", group: "retired" },
    { id: "art-boarded-window", src: "assets/decor/painted/boarded_window.webp", size: [262, 315], width: 140, name: "Boarded-up window", group: "retired" },
    { id: "art-chain-padlock", src: "assets/decor/painted/chain_padlock.webp", size: [438, 410], width: 100, name: "Chain and padlock", group: "haunted" },
    { id: "art-eye-sign", src: "assets/decor/painted/eye_sign.webp", size: [460, 415], width: 140, name: "All-seeing eye sign", group: "pictures" },
    { id: "art-faded-wingback", src: "assets/decor/painted/tattered_wingback.webp", size: [310, 308], width: 180, name: "Faded wingback", group: "retired" },
    { id: "art-tattered-chaise", src: "assets/decor/painted/velvet_chaise.webp", size: [478, 296], width: 290, name: "Tattered chaise", group: "retired" },
    { id: "art-cobweb-bookcase", src: "assets/decor/painted/leaning_bookcase.webp", size: [368, 478], width: 160, name: "Leaning bookcase", group: "storage" },
    { id: "art-old-writing-desk", src: "assets/decor/painted/old_desk.webp", size: [478, 380], width: 210, name: "Hutch desk", group: "tables" },
    { id: "art-broken-cabinet", src: "assets/decor/painted/glass_cabinet.webp", size: [319, 478], width: 190, name: "Glass-front cabinet", group: "storage" },
    { id: "art-cold-fireplace", src: "assets/decor/painted/cold_fireplace.webp", size: [326, 230], width: 240, name: "Cold stone fireplace", group: "storage" },
    { id: "art-cracked-mirror", src: "assets/decor/painted/cracked_mirror.webp", size: [322, 460], width: 110, name: "Cracked mirror", group: "pictures" },
    { id: "art-haunted-portrait", src: "assets/decor/painted/haunted_portrait.webp", size: [220, 296], width: 120, name: "Haunted portrait", group: "pictures" },
    { id: "art-raven-statue", src: "assets/decor/painted/raven_statue.webp", size: [188, 211], width: 110, name: "Raven on a stone", group: "haunted" },
    { id: "art-open-birdcage", src: "assets/decor/painted/birdcage.webp", size: [358, 478], width: 110, name: "Birdcage", group: "haunted" },
    { id: "art-skull-on-books", src: "assets/decor/painted/skull_on_books.webp", size: [239, 190], width: 120, name: "Skull on old books", group: "bookish" },
    { id: "art-grandfather-clock", src: "assets/decor/painted/grandfather_clock.webp", size: [186, 478], width: 110, name: "Grandfather clock", group: "storage" },
    { id: "art-cobweb-candelabra", src: "assets/decor/painted/candelabra.webp", size: [329, 460], width: 120, name: "Cobwebbed candelabra", group: "retired" },
    { id: "art-iron-lantern", src: "assets/decor/painted/red_lantern.webp", size: [268, 460], width: 70, name: "Red lantern", group: "lighting" },
    { id: "art-tattered-lamp", src: "assets/decor/painted/fringed_lamp.webp", size: [240, 460], width: 100, name: "Tattered fringed lamp", group: "retired" },
    { id: "art-candle-sconce", src: "assets/decor/painted/candle_holder.webp", size: [374, 360], width: 80, name: "Chamberstick candle", group: "lighting" },
    { id: "art-candle-dish", src: "assets/decor/painted/pillar_candle.webp", size: [290, 322], width: 90, name: "Pillar candle", group: "lighting" },
    { id: "art-candle-chandelier", src: "assets/decor/painted/candle_chandelier.webp", size: [405, 460], width: 170, name: "Candle chandelier", group: "lighting" },
    { id: "art-rug-red-medallion", src: "assets/decor/painted/rug_red_medallion.webp", size: [460, 351], width: 260, name: "Worn medallion rug", group: "rugs", floor: true },
    { id: "art-rug-web", src: "assets/decor/painted/rug_web.webp", size: [460, 333], width: 240, name: "Cobweb rug", group: "rugs", floor: true },
    { id: "art-rug-moth", src: "assets/decor/painted/rug_moth.webp", size: [460, 319], width: 260, name: "Moth rug", group: "rugs", floor: true },
    { id: "art-rug-thorn-oval", src: "assets/decor/painted/rug_thorn_oval.webp", size: [240, 144], width: 250, name: "Thorn oval rug", group: "rugs", floor: true },
    { id: "art-rug-green-diamond", src: "assets/decor/painted/rug_green_diamond.webp", size: [304, 115], width: 290, name: "Green diamond runner", group: "rugs", floor: true },
    { id: "art-rug-rose", src: "assets/decor/painted/rug_rose.webp", size: [183, 145], width: 190, name: "Faded rose rug", group: "rugs", floor: true },
    { id: "art-boarded-arch-window", src: "assets/decor/painted/boarded_arch_window.webp", size: [237, 292], width: 110, name: "Boarded arched window", group: "retired" },
    { id: "art-arched-door", src: "assets/decor/painted/arched_door.webp", size: [353, 460], width: 120, name: "Arched wooden door", group: "pictures" },
    { id: "art-empty-frame", src: "assets/decor/painted/empty_frame.webp", size: [426, 460], width: 100, name: "Empty gilded frame", group: "pictures" },
    { id: "art-cobweb-shelf", src: "assets/decor/painted/wall_shelf.webp", size: [478, 310], width: 170, name: "Wall shelf", group: "storage" },
    { id: "art-gargoyle", src: "assets/decor/painted/gargoyle.webp", size: [432, 460], width: 130, name: "Gargoyle", group: "haunted" },
    { id: "art-torn-curtains", src: "assets/decor/painted/torn_curtains.webp", size: [344, 276], width: 240, name: "Torn curtains", group: "retired" },
    { id: "art-velvet-chaise", src: "assets/decor/painted/velvet_chaise.webp", size: [478, 296], width: 290, name: "Velvet chaise", group: "seating" },
    { id: "art-rocking-chair", src: "assets/decor/painted/rocking_chair.webp", size: [404, 478], width: 170, name: "Cushioned rocking chair", group: "seating" },
    { id: "art-moon-writing-desk", src: "assets/decor/painted/writing_desk.webp", size: [420, 262], width: 210, name: "Writing desk", group: "tables" },
    { id: "art-potion-cabinet", src: "assets/decor/painted/potion_cabinet.webp", size: [378, 472], width: 130, name: "Potion cabinet", group: "storage" },
    { id: "art-gothic-shelf", src: "assets/decor/painted/gothic_bookcase.webp", size: [350, 420], width: 140, name: "Gothic arched shelf", group: "retired" },
    { id: "art-gramophone", src: "assets/decor/painted/gramophone.webp", size: [320, 478], width: 120, name: "Gramophone", group: "cozy" },
    { id: "art-flower-skull", src: "assets/decor/painted/flower_skull.webp", size: [439, 478], width: 110, name: "Flower-crowned skull", group: "spooky" },
    { id: "art-amethyst-cluster", src: "assets/decor/painted/amethyst_cluster.webp", size: [436, 462], width: 100, name: "Amethyst cluster", group: "witchy" },
    { id: "art-lavender-bundle", src: "assets/decor/painted/herb_bundle.webp", size: [293, 478], width: 100, name: "Herb and flower bundle", group: "plants" },
    { id: "art-raven-on-books", src: "assets/decor/painted/raven_on_books.webp", size: [423, 478], width: 120, name: "Raven on books", group: "bookish" },
    { id: "art-mushroom-cloche", src: "assets/decor/painted/mushroom_cloche.webp", size: [390, 478], width: 100, name: "Mushroom cloche", group: "witchy" },
    { id: "art-ghost-portrait", src: "assets/decor/painted/ghost_portrait.webp", size: [335, 460], width: 110, name: "Ghost portrait", group: "pictures" },
    { id: "art-tiffany-lamp", src: "assets/decor/painted/pink_lamp.webp", size: [314, 460], width: 110, name: "Pink table lamp", group: "lighting" },
    { id: "art-oil-lamp", src: "assets/decor/painted/oil_lamp.webp", size: [204, 460], width: 80, name: "Brass oil lamp", group: "lighting" },
    { id: "art-bat-candle", src: "assets/decor/painted/bat_candle.webp", size: [460, 316], width: 130, name: "Bat candle sconce", group: "spooky" },
    { id: "art-star-lantern", src: "assets/decor/painted/star_lantern.webp", size: [340, 460], width: 90, name: "Star lantern", group: "lighting" },
    { id: "art-skull-candle", src: "assets/decor/painted/skull_candle.webp", size: [413, 460], width: 80, name: "Skull candle", group: "spooky" },
    { id: "art-fringed-table-lamp", src: "assets/decor/painted/pink_lamp.webp", size: [314, 460], width: 110, name: "Rose fringed lamp", group: "retired" },
    { id: "art-rug-poppy", src: "assets/decor/painted/rug_poppy.webp", size: [267, 145], width: 270, name: "Poppy rug", group: "rugs", floor: true },
    { id: "art-rug-moth-oval", src: "assets/decor/painted/rug_moth.webp", size: [460, 319], width: 240, name: "Moon moth rug", group: "retired", floor: true },
    { id: "art-rug-maple-leaf", src: "assets/decor/painted/rug_leaf.webp", size: [460, 334], width: 210, name: "Leaf oval rug", group: "rugs", floor: true },
    { id: "art-rug-fern", src: "assets/decor/painted/rug_leaf.webp", size: [460, 334], width: 270, name: "Fern oval rug", group: "retired", floor: true },
    { id: "art-rug-web-moon", src: "assets/decor/painted/rug_web.webp", size: [460, 333], width: 270, name: "Web and moon rug", group: "retired", floor: true },
    { id: "art-rug-moon", src: "assets/decor/painted/rug_moon.webp", size: [388, 454], width: 200, name: "Crescent moon rug", group: "rugs", floor: true },
    { id: "art-boombox", src: "assets/decor/painted/boombox.webp", size: [478, 347], width: 150, name: "Boombox", group: "cozy" },
    { id: "art-red-phone", src: "assets/decor/painted/red_phone.webp", size: [478, 332], width: 120, name: "Red telephone", group: "cozy" },
    { id: "art-cuckoo-clock", src: "assets/decor/painted/cuckoo_clock.webp", size: [356, 460], width: 100, name: "Bat cuckoo clock", group: "pictures" },
    { id: "art-camping-lantern", src: "assets/decor/painted/hanging_lantern.webp", size: [201, 460], width: 70, name: "Camping lantern", group: "retired" },
    { id: "art-moon-mask", src: "assets/decor/painted/moon_mask.webp", size: [130, 196], width: 80, name: "Moon mask", group: "witchy" },
    { id: "art-wooden-door", src: "assets/decor/painted/wooden_door.webp", size: [236, 290], width: 110, name: "Little wooden door", group: "pictures" },
    { id: "art-plum-tea-set", src: "assets/decor/painted/plum_tea_set.webp", size: [460, 399], width: 110, name: "Plum tea set", group: "tabletop" },
    { id: "art-sage-tea-set", src: "assets/decor/painted/sage_tea_set.webp", size: [460, 395], width: 110, name: "Sage tea set", group: "tabletop" },
    { id: "art-pumpkin-tea-set", src: "assets/decor/painted/pumpkin_tea_set.webp", size: [454, 406], width: 110, name: "Pumpkin tea set", group: "tabletop" },
    { id: "art-cream-teacup", src: "assets/decor/painted/cream_teacup.webp", size: [460, 354], width: 60, name: "Cream teacup", group: "tabletop" },
    { id: "art-plum-teacup", src: "assets/decor/painted/plum_teacup.webp", size: [460, 363], width: 60, name: "Plum teacup", group: "tabletop" },
    { id: "art-sage-teacup", src: "assets/decor/painted/sage_teacup.webp", size: [460, 367], width: 60, name: "Sage teacup", group: "tabletop" },
    { id: "art-pink-teacup", src: "assets/decor/painted/pink_teacup.webp", size: [460, 352], width: 60, name: "Pink teacup", group: "tabletop" },
    { id: "art-amber-teacup", src: "assets/decor/painted/amber_teacup.webp", size: [460, 359], width: 60, name: "Amber glass teacup", group: "tabletop" },
    { id: "art-espresso-cup", src: "assets/decor/painted/espresso_cup.webp", size: [460, 343], width: 55, name: "Espresso cup", group: "tabletop" },
    { id: "art-plum-mug", src: "assets/decor/painted/plum_mug.webp", size: [460, 366], width: 55, name: "Plum mug", group: "tabletop" },
    { id: "art-sage-mug", src: "assets/decor/painted/sage_mug.webp", size: [458, 396], width: 55, name: "Sage mug", group: "tabletop" },
    { id: "art-pink-mug", src: "assets/decor/painted/pink_mug.webp", size: [460, 375], width: 55, name: "Pink mug", group: "tabletop" },
    { id: "art-pumpkin-mug", src: "assets/decor/painted/pumpkin_mug.webp", size: [460, 336], width: 55, name: "Pumpkin mug", group: "tabletop" },
    { id: "art-ghost-mug", src: "assets/decor/painted/ghost_mug.webp", size: [460, 374], width: 55, name: "Ghost mug", group: "tabletop" },
    { id: "art-moon-mug", src: "assets/decor/painted/moon_mug.webp", size: [460, 374], width: 55, name: "Moon mug", group: "tabletop" },
    { id: "art-coffee-pot", src: "assets/decor/painted/coffee_pot.webp", size: [460, 437], width: 80, name: "Coffee pot and mug", group: "tabletop" },
    { id: "art-french-press", src: "assets/decor/painted/french_press.webp", size: [460, 433], width: 75, name: "French press", group: "tabletop" },
    { id: "art-moka-pot", src: "assets/decor/painted/moka_pot.webp", size: [450, 444], width: 75, name: "Moka pot and cups", group: "tabletop" },
    { id: "art-pumpkin-kettle", src: "assets/decor/painted/pumpkin_kettle.webp", size: [460, 437], width: 80, name: "Pumpkin kettle", group: "tabletop" },
    { id: "art-espresso-machine", src: "assets/decor/painted/espresso_machine.webp", size: [431, 460], width: 90, name: "Espresso machine", group: "tabletop" },
    { id: "art-milk-jug", src: "assets/decor/painted/milk_jug.webp", size: [442, 420], width: 55, name: "Milk jug", group: "tabletop" },
    { id: "art-sugar-bowl", src: "assets/decor/painted/sugar_bowl.webp", size: [460, 334], width: 55, name: "Sugar bowl", group: "tabletop" },
    { id: "art-honey-jar", src: "assets/decor/painted/honey_jar.webp", size: [460, 409], width: 55, name: "Honey jar", group: "tabletop" },
    { id: "art-tea-tin", src: "assets/decor/painted/tea_tin.webp", size: [339, 460], width: 50, name: "Tea tin", group: "tabletop" },
    { id: "art-cookie-jar", src: "assets/decor/painted/cookie_jar.webp", size: [388, 460], width: 60, name: "Cookie jar", group: "treats" },
    { id: "art-cocoa-and-cookies", src: "assets/decor/painted/cocoa_and_cookies.webp", size: [460, 396], width: 85, name: "Cocoa and cookies", group: "treats" },
    { id: "art-lemon-tea-and-book", src: "assets/decor/painted/lemon_tea_and_book.webp", size: [460, 404], width: 90, name: "Lemon tea and a book", group: "bookish" },
    { id: "art-plate-stack", src: "assets/decor/painted/plate_stack.webp", size: [460, 289], width: 70, name: "Stack of plates", group: "tabletop" },
    { id: "art-mushroom-lamp", src: "assets/decor/painted/mushroom_lamp.webp", size: [362, 396], width: 90, name: "Mushroom lamp", group: "lighting" },
    { id: "art-ghost-candle", src: "assets/decor/painted/ghost_candle.webp", size: [300, 434], width: 60, name: "Ghost candle", group: "lighting" },
    { id: "art-wall-lamp", src: "assets/decor/painted/wall_lamp.webp", size: [460, 333], width: 90, name: "Wall lamp", group: "lighting" },
    { id: "art-tufted-ottoman", src: "assets/decor/painted/tufted_ottoman.webp", size: [454, 318], width: 130, name: "Tufted ottoman", group: "seating" },
    { id: "art-mushroom-stool", src: "assets/decor/painted/mushroom_stool.webp", size: [400, 358], width: 90, name: "Mushroom stool", group: "seating" },
    { id: "art-wooden-bench", src: "assets/decor/painted/wooden_bench.webp", size: [478, 254], width: 180, name: "Tufted bench", group: "seating" },
    { id: "art-round-table", src: "assets/decor/painted/round_table.webp", size: [347, 420], width: 130, name: "Round pedestal table", group: "tables" },
    { id: "art-pedestal-table", src: "assets/decor/painted/pedestal_table.webp", size: [338, 420], width: 110, name: "Small pedestal table", group: "tables" },
    { id: "art-tea-trolley", src: "assets/decor/painted/tea_trolley.webp", size: [466, 478], width: 150, name: "Tea trolley", group: "tables" },
    { id: "art-book-cart", src: "assets/decor/painted/book_cart.webp", size: [478, 457], width: 150, name: "Book cart", group: "storage" },
    { id: "art-chest-of-drawers", src: "assets/decor/painted/chest_of_drawers.webp", size: [441, 478], width: 150, name: "Chest of drawers", group: "storage" },
    { id: "art-white-cabinet", src: "assets/decor/painted/white_cabinet.webp", size: [243, 237], width: 140, name: "Worn white cabinet", group: "storage" },
    { id: "art-wooden-trunk", src: "assets/decor/painted/wooden_trunk.webp", size: [478, 299], width: 160, name: "Wooden trunk", group: "storage" },
    { id: "art-cat-painting", src: "assets/decor/painted/cat_painting.webp", size: [327, 460], width: 100, name: "Cat on books painting", group: "pictures" },
    { id: "art-haunted-house-painting", src: "assets/decor/painted/haunted_house_painting.webp", size: [460, 331], width: 100, name: "Haunted house painting", group: "pictures" },
    { id: "art-raven-moon-painting", src: "assets/decor/painted/raven_moon_painting.webp", size: [460, 409], width: 100, name: "Raven and moon painting", group: "pictures" },
    { id: "art-lantern-forest-painting", src: "assets/decor/painted/lantern_forest_painting.webp", size: [292, 460], width: 100, name: "Lantern in the woods painting", group: "pictures" },
    { id: "art-lady-portrait", src: "assets/decor/painted/lady_portrait.webp", size: [351, 460], width: 100, name: "Lady's portrait", group: "pictures" },
    { id: "art-pressed-flowers", src: "assets/decor/painted/pressed_flowers.webp", size: [346, 336], width: 150, name: "Pressed flower frames", group: "pictures" },
    { id: "art-potion-shelf", src: "assets/decor/painted/potion_shelf.webp", size: [460, 396], width: 140, name: "Potion shelf", group: "pictures" },
    { id: "art-ivy-book-shelf", src: "assets/decor/painted/ivy_book_shelf.webp", size: [460, 373], width: 170, name: "Shelf with books and ivy", group: "pictures" },
    { id: "art-key-rack", src: "assets/decor/painted/key_rack.webp", size: [394, 398], width: 100, name: "Key rack", group: "pictures" },
    { id: "art-scarf-hook", src: "assets/decor/painted/scarf_hook.webp", size: [211, 460], width: 60, name: "Scarf on a hook", group: "pictures" },
    { id: "art-moon-mobile", src: "assets/decor/painted/moon_mobile.webp", size: [375, 460], width: 110, name: "Moon mobile", group: "garlands" },
    { id: "art-drying-herbs", src: "assets/decor/painted/drying_herbs.webp", size: [443, 460], width: 140, name: "Herb shelf", group: "garlands" },
    { id: "art-string-lights", src: "assets/decor/painted/string_lights.webp", size: [460, 214], width: 200, name: "Fairy lights", group: "garlands" },
    { id: "art-lantern-garland", src: "assets/decor/painted/lantern_garland.webp", size: [460, 278], width: 200, name: "Lantern garland", group: "garlands" },
    { id: "art-pumpkin-garland", src: "assets/decor/painted/pumpkin_garland.webp", size: [460, 241], width: 200, name: "Pumpkin garland", group: "garlands" },
    { id: "art-ghost-garland", src: "assets/decor/painted/ghost_garland.webp", size: [460, 269], width: 200, name: "Ghost garland", group: "garlands" },
    { id: "art-bat-garland", src: "assets/decor/painted/bat_garland.webp", size: [460, 276], width: 200, name: "Bat garland", group: "garlands" },
    { id: "art-thorn-wreath", src: "assets/decor/painted/thorn_wreath.webp", size: [396, 460], width: 130, name: "Thorn and rose wreath", group: "garlands" },
    { id: "art-cobweb", src: "assets/decor/painted/cobweb.webp", size: [460, 284], width: 130, name: "Cobweb", group: "garlands" },
    { id: "art-cobweb-corner", src: "assets/decor/painted/cobweb_corner.webp", size: [460, 229], width: 130, name: "Corner cobweb", group: "garlands" },
    { id: "art-cobweb-spider", src: "assets/decor/painted/cobweb_spider.webp", size: [419, 460], width: 120, name: "Cobweb with a spider", group: "garlands" },
    { id: "art-cobweb-swag", src: "assets/decor/painted/cobweb_swag.webp", size: [218, 448], width: 200, name: "Cobweb swag", group: "garlands" },
    { id: "art-rug-bat", src: "assets/decor/painted/rug_bat.webp", size: [460, 282], width: 260, name: "Bat rug", group: "rugs", floor: true },
    { id: "art-rug-ghost", src: "assets/decor/painted/rug_ghost.webp", size: [432, 438], width: 230, name: "Ghost rug", group: "rugs", floor: true },
    { id: "art-black-cat", src: "assets/decor/painted/black_cat.webp", size: [326, 466], width: 90, name: "Black cat", group: "spooky" },
    { id: "art-skull", src: "assets/decor/painted/skull.webp", size: [446, 412], width: 80, name: "Skull", group: "spooky" },
    { id: "art-pumpkin-trio", src: "assets/decor/painted/pumpkin_trio.webp", size: [478, 385], width: 120, name: "Three pumpkins", group: "autumn" },
    { id: "art-broom", src: "assets/decor/painted/broom.webp", size: [355, 478], width: 130, name: "Witch's broom", group: "witchy" },
    { id: "art-crystal-ball", src: "assets/decor/painted/crystal_ball.webp", size: [344, 418], width: 80, name: "Crystal ball", group: "witchy" },
    { id: "art-potted-mushrooms", src: "assets/decor/painted/potted_mushrooms.webp", size: [370, 470], width: 90, name: "Potted mushrooms", group: "plants" },
    { id: "art-hanging-ivy", src: "assets/decor/painted/hanging_ivy.webp", size: [476, 478], width: 110, name: "Hanging ivy", group: "plants" },
    { id: "art-cat-moon-portrait", src: "assets/decor/painted/cat_moon_portrait.webp", size: [378, 460], width: 100, name: "Black cat portrait", group: "pictures" },
    { id: "art-moth-portrait", src: "assets/decor/painted/moth_portrait.webp", size: [385, 460], width: 100, name: "Moon moth portrait", group: "pictures" },
    { id: "art-ghost-tea-portrait", src: "assets/decor/painted/ghost_tea_portrait.webp", size: [410, 460], width: 105, name: "Ghost with tea", group: "pictures" },
    { id: "art-bare-tree-painting", src: "assets/decor/painted/bare_tree_painting.webp", size: [349, 460], width: 90, name: "Bare tree at dusk", group: "pictures" },
    { id: "art-pumpkin-patch-painting", src: "assets/decor/painted/pumpkin_patch_painting.webp", size: [460, 349], width: 110, name: "Pumpkin patch painting", group: "pictures" },
    { id: "art-cottage-painting", src: "assets/decor/painted/cottage_painting.webp", size: [460, 349], width: 110, name: "Cottage in the woods", group: "pictures" },
    { id: "art-mushroom-painting", src: "assets/decor/painted/mushroom_painting.webp", size: [460, 335], width: 100, name: "Mushroom painting", group: "pictures" },
    { id: "art-crow-painting", src: "assets/decor/painted/crow_painting.webp", size: [378, 460], width: 100, name: "Crow at sunset", group: "pictures" },
    { id: "art-candle-painting", src: "assets/decor/painted/candle_painting.webp", size: [340, 460], width: 75, name: "Candle painting", group: "pictures" },
    { id: "art-moon-phases", src: "assets/decor/painted/moon_phases.webp", size: [330, 460], width: 160, name: "Moon phases", group: "pictures" },
    { id: "art-pressed-botanicals", src: "assets/decor/painted/pressed_botanicals.webp", size: [460, 321], width: 160, name: "Pressed leaf frames", group: "pictures" },
    { id: "art-bat-diamond", src: "assets/decor/painted/bat_diamond.webp", size: [419, 460], width: 95, name: "Bat in a diamond frame", group: "pictures" },
    { id: "art-jack-garland", src: "assets/decor/painted/jack_garland.webp", size: [460, 259], width: 200, name: "Jack-o'-lantern garland", group: "garlands" },
    { id: "art-ghost-bunting", src: "assets/decor/painted/ghost_bunting.webp", size: [460, 253], width: 200, name: "Ghost bunting", group: "garlands" },
    { id: "art-bat-bunting", src: "assets/decor/painted/bat_bunting.webp", size: [460, 250], width: 200, name: "Bat bunting", group: "garlands" },
    { id: "art-moon-star-bunting", src: "assets/decor/painted/moon_star_bunting.webp", size: [460, 262], width: 200, name: "Moon and star bunting", group: "garlands" },
    { id: "art-skull-garland", src: "assets/decor/painted/skull_garland.webp", size: [460, 251], width: 200, name: "Skull garland", group: "garlands" },
    { id: "art-witch-hat-garland", src: "assets/decor/painted/witch_hat_garland.webp", size: [460, 274], width: 200, name: "Witch hat garland", group: "garlands" },
    { id: "art-fairy-lights", src: "assets/decor/painted/fairy_lights.webp", size: [356, 124], width: 200, name: "Fairy lights", group: "garlands" },
    { id: "art-lantern-string", src: "assets/decor/painted/lantern_string.webp", size: [460, 303], width: 200, name: "String of lanterns", group: "garlands" },
    { id: "art-cat-garland", src: "assets/decor/painted/cat_garland.webp", size: [460, 250], width: 200, name: "Black cat garland", group: "garlands" },
    { id: "art-maple-garland", src: "assets/decor/painted/maple_garland.webp", size: [460, 262], width: 200, name: "Maple leaf garland", group: "garlands" },
    { id: "art-moth-garland", src: "assets/decor/painted/moth_garland.webp", size: [460, 244], width: 200, name: "Moth garland", group: "garlands" },
    { id: "art-potion-garland", src: "assets/decor/painted/potion_garland.webp", size: [460, 279], width: 200, name: "Potion bottle garland", group: "garlands" },
    { id: "art-ivy-swag", src: "assets/decor/painted/ivy_swag.webp", size: [460, 259], width: 230, name: "Ivy swag", group: "vines" },
    { id: "art-ivy-hanging", src: "assets/decor/painted/ivy_hanging.webp", size: [160, 460], width: 60, name: "Trailing ivy", group: "vines" },
    { id: "art-ivy-corner-left", src: "assets/decor/painted/ivy_corner_left.webp", size: [431, 460], width: 160, name: "Ivy corner (left)", group: "vines" },
    { id: "art-ivy-corner-right", src: "assets/decor/painted/ivy_corner_right.webp", size: [460, 458], width: 140, name: "Ivy corner (right)", group: "vines" },
    { id: "art-ivy-arch", src: "assets/decor/painted/ivy_arch.webp", size: [458, 460], width: 220, name: "Ivy arch", group: "vines" },
    { id: "art-ivy-basket", src: "assets/decor/painted/ivy_basket.webp", size: [444, 460], width: 110, name: "Ivy in a hanging pot", group: "vines" },
    { id: "art-ivy-fairy-lights", src: "assets/decor/painted/ivy_fairy_lights.webp", size: [460, 429], width: 210, name: "Ivy with fairy lights", group: "vines" },
    { id: "art-ivy-web-swag", src: "assets/decor/painted/ivy_web_swag.webp", size: [460, 432], width: 190, name: "Ivy and cobweb swag", group: "vines" },
    { id: "art-autumn-vine", src: "assets/decor/painted/autumn_vine.webp", size: [460, 325], width: 200, name: "Autumn leaf vine", group: "vines" },
    { id: "art-rose-vine", src: "assets/decor/painted/rose_vine.webp", size: [460, 404], width: 200, name: "Rose vine", group: "vines" },
    { id: "art-bat-branch", src: "assets/decor/painted/bat_branch.webp", size: [460, 365], width: 210, name: "Branch with bats", group: "vines" },
    { id: "art-hanging-herbs", src: "assets/decor/painted/hanging_herbs.webp", size: [446, 444], width: 180, name: "Drying herb garland", group: "vines" },
    // Furniture: seating, tables, lamps, storage and fireplaces
    { id: "furn-wingback-floral", box: "0 0 220 236", width: 200, name: "Floral wingback chair", group: "seating" },
    { id: "furn-wingback-rust", box: "0 0 220 236", width: 200, name: "Velvet wingback chair", group: "seating", tint: true },
    { id: "furn-wingback-black", box: "0 0 220 262", width: 200, name: "Black gothic wingback", group: "seating", tint: true },
    { id: "furn-armchair-pink", box: "0 0 220 224", width: 210, name: "Pink tufted armchair", group: "seating", tint: true },
    { id: "furn-throne-purple", box: "0 -20 220 258", width: 210, name: "Purple tufted throne", group: "seating", tint: true },
    { id: "furn-chair-carved", box: "0 0 130 222", width: 120, name: "Carved wooden chair", group: "seating", tint: true },
    { id: "furn-chair-wood", box: "0 0 110 206", width: 100, name: "Wooden chair", group: "seating", tint: true },
    { id: "furn-sofa-coral", box: "0 0 350 196", width: 330, name: "Coral sofa", group: "seating", tint: true },
    { id: "furn-daybed-purple", box: "0 0 320 196", width: 290, name: "Velvet daybed", group: "seating", tint: true },
    { id: "furn-bench-cushions", box: "0 0 240 144", width: 220, name: "Cushioned bench", group: "seating", tint: true },
    { id: "furn-club-chair", box: "0 0 230 196", width: 214, name: "Leather club chair", group: "seating", tint: true },
    { id: "furn-peacock-chair", box: "0 0 200 250", width: 190, name: "Rattan peacock chair", group: "seating", tint: true },
    { id: "furn-parlor-chair", box: "0 0 130 222", width: 120, name: "Parlour chair", group: "seating", tint: true },
    { id: "furn-slipper-chair", box: "0 0 150 214", width: 140, name: "Skirted slipper chair", group: "seating", tint: true },
    { id: "furn-rocking-chair", box: "0 0 180 212", width: 170, name: "Rocking chair", group: "seating", tint: true },
    { id: "furn-shell-chair", box: "0 0 210 196", width: 196, name: "Velvet shell chair", group: "seating", tint: true },
    { id: "furn-loveseat", box: "0 0 290 196", width: 270, name: "Camelback loveseat", group: "seating", tint: true },
    { id: "furn-gothic-chair", box: "0 0 150 244", width: 140, name: "Spiky gothic chair", group: "seating", tint: true },
    { id: "furn-floor-cushions", box: "0 0 200 118", width: 180, name: "Floor cushions", group: "seating", tint: true },
    { id: "furn-ottoman", box: "0 0 140 104", width: 130, name: "Tufted footstool", group: "seating", tint: true },
    { id: "furn-table-round-empty", box: "0 0 150 200", width: 140, name: "Round table (empty)", group: "tables" },
    { id: "furn-table-cloth-empty", box: "0 0 170 200", width: 160, name: "Table with a lace cloth (empty)", group: "tables" },
    { id: "furn-table-side-empty", box: "0 0 100 200", width: 90, name: "Side table (empty)", group: "tables" },
    { id: "furn-desk-empty", box: "0 0 260 200", width: 230, name: "Writing desk (empty)", group: "tables" },
    { id: "furn-nightstand", box: "0 0 120 166", width: 110, name: "Nightstand (empty)", group: "tables" },
    { id: "furn-table-side", box: "0 0 100 170", width: 90, name: "Little side table", group: "tables" },
    { id: "furn-table-tea", box: "0 0 170 250", width: 160, name: "Tea table", group: "tables" },
    { id: "furn-table-rustic", box: "0 0 260 250", width: 240, name: "Table with a runner", group: "tables" },
    { id: "furn-candle-stand", box: "0 0 70 200", width: 64, name: "Candle stand", group: "tables" },
    { id: "furn-dresser-apothecary", box: "0 0 200 200", width: 190, name: "Apothecary dresser", group: "storage" },
    { id: "furn-shelf-potions", box: "0 0 180 116", width: 170, name: "Potion shelf", group: "storage" },
    { id: "furn-bookcase-tall", box: "0 0 170 336", width: 160, name: "Tall bookcase", group: "storage" },
    { id: "furn-bookcase-low", box: "0 0 190 180", width: 180, name: "Low bookcase", group: "storage" },
    { id: "furn-wardrobe", box: "0 0 160 310", width: 150, name: "Wardrobe", group: "storage" },
    { id: "furn-clock-grandfather", box: "0 0 90 290", width: 86, name: "Grandfather clock", group: "storage" },
    { id: "furn-tv-vintage", box: "0 0 130 150", width: 120, name: "Vintage television", group: "storage" },
    { id: "furn-fireplace-marble", box: "0 0 270 246", width: 250, name: "Marble fireplace", group: "storage" },
    { id: "furn-fireplace-gothic", box: "0 0 270 262", width: 250, name: "Gothic stone fireplace", group: "storage" },
    { id: "furn-fireplace-brick", box: "0 0 270 246", width: 250, name: "Brick fireplace", group: "storage" },
    { id: "furn-lamp-floor-pink", box: "0 0 84 246", width: 78, name: "Pink floor lamp", group: "lighting", tint: true },
    { id: "furn-lamp-table", box: "0 0 64 90", width: 56, name: "Table lamp", group: "lighting", tint: true },
    { id: "furn-candelabra-floor", box: "0 0 80 226", width: 76, name: "Standing candelabra", group: "lighting" },
    { id: "furn-chandelier-gold", box: "0 0 200 156", width: 190, name: "Gold chandelier", group: "lighting" },
    { id: "furn-lantern-hanging", box: "0 0 60 156", width: 56, name: "Hanging lantern", group: "lighting" },
    { id: "furn-lamp-banker", box: "0 0 72 86", width: 58, name: "Banker's lamp", group: "lighting" },
    { id: "furn-lamp-tiffany", box: "0 0 72 92", width: 62, name: "Tiffany lamp", group: "lighting" },
    { id: "furn-lamp-fringe-table", box: "0 0 68 92", width: 58, name: "Fringed table lamp", group: "lighting", tint: true },
    { id: "furn-lamp-oil", box: "0 0 44 82", width: 38, name: "Oil lamp", group: "lighting" },
    { id: "furn-lamp-crystal", box: "0 0 60 86", width: 52, name: "Crystal lamp", group: "lighting" },
    { id: "furn-lamp-floor-fringe", box: "0 0 100 250", width: 94, name: "Victorian fringed floor lamp", group: "lighting", tint: true },
    { id: "furn-lamp-arc", box: "0 0 160 246", width: 150, name: "Brass arc lamp", group: "lighting" },
    { id: "furn-lamp-tripod", box: "0 0 92 246", width: 86, name: "Wooden tripod lamp", group: "lighting", tint: true },
    { id: "furn-lamp-torchiere", box: "0 0 80 246", width: 74, name: "Alabaster torchiere", group: "lighting" },
    { id: "furn-lantern-moroccan", box: "0 0 72 152", width: 62, name: "Moroccan lantern", group: "lighting" },
    { id: "furn-lantern-paper", box: "0 0 80 140", width: 70, name: "Paper lantern", group: "lighting", tint: true },
    { id: "furn-plant-hanging", box: "0 0 120 270", width: 110, name: "Hanging plant", group: "plants" },
    { id: "cup-mug-tea", box: "0 0 40 50", width: 30, name: "Mug of tea", group: "tabletop", tint: true },
    { id: "cup-mug-latte", box: "0 0 40 50", width: 30, name: "Latte with a heart", group: "tabletop", tint: true },
    { id: "cup-mug-cocoa", box: "0 0 40 50", width: 30, name: "Cocoa with marshmallows", group: "tabletop", tint: true },
    { id: "cup-mug-cream", box: "0 0 40 50", width: 30, name: "Hot chocolate with cream", group: "tabletop", tint: true },
    { id: "cup-mug-cider", box: "0 0 40 50", width: 30, name: "Spiced cider", group: "tabletop", tint: true },
    { id: "cup-mug-matcha", box: "0 0 40 50", width: 30, name: "Matcha latte", group: "tabletop", tint: true },
    { id: "cup-mug-dots", box: "0 0 40 50", width: 30, name: "Spotty mug", group: "tabletop", tint: true },
    { id: "cup-mug-stripes", box: "0 0 40 50", width: 30, name: "Striped mug", group: "tabletop", tint: true },
    { id: "cup-mug-heart", box: "0 0 40 50", width: 30, name: "Heart mug", group: "tabletop", tint: true },
    { id: "cup-mug-stoneware", box: "0 0 40 50", width: 30, name: "Speckled stoneware mug", group: "tabletop", tint: true },
    { id: "cup-mug-cat", box: "0 0 40 50", width: 30, name: "Black cat mug", group: "tabletop" },
    { id: "cup-mug-ghost", box: "0 0 40 50", width: 30, name: "Ghost mug", group: "tabletop", tint: true },
    { id: "cup-mug-moon", box: "0 0 40 50", width: 30, name: "Moon mug", group: "tabletop", tint: true },
    { id: "cup-mug-pumpkin", box: "0 0 42 50", width: 32, name: "Pumpkin mug", group: "tabletop" },
    { id: "cup-mug-enamel", box: "0 0 40 50", width: 30, name: "Enamel camp mug", group: "tabletop" },
    { id: "cup-mug-glass", box: "0 0 40 50", width: 30, name: "Glass of tea", group: "tabletop" },
    { id: "cup-teacup-rose", box: "0 0 40 44", width: 32, name: "Rose teacup", group: "tabletop" },
    { id: "cup-teacup-blue", box: "0 0 40 44", width: 32, name: "Blue and white teacup", group: "tabletop" },
    { id: "cup-teacup-gold", box: "0 0 40 44", width: 32, name: "Gilded teacup", group: "tabletop", tint: true },
    { id: "cup-teapot-rose", box: "0 0 64 60", width: 56, name: "Rose teapot", group: "tabletop" },
    { id: "cup-teapot-plain", box: "0 0 64 60", width: 56, name: "Teapot", group: "tabletop", tint: true },
    { id: "cup-teapot-iron", box: "0 0 52 54", width: 46, name: "Cast iron teapot", group: "tabletop" },
    { id: "cup-tea-set", box: "0 0 140 68", width: 120, name: "Tea set on a tray", group: "tabletop" },
    { id: "cup-tea-for-two", box: "0 0 120 66", width: 104, name: "Tea for two", group: "tabletop" },
    { id: "cup-biscuits", box: "0 0 40 16", width: 34, name: "Plate of biscuits", group: "tabletop" },
    { id: "cup-cake-stand", box: "0 0 60 72", width: 52, name: "Cake stand", group: "tabletop" },
    { id: "cup-lemonade", box: "0 0 30 42", width: 24, name: "Lemonade", group: "tabletop" },
    { id: "cup-iced-coffee", box: "0 0 30 42", width: 24, name: "Iced coffee", group: "tabletop" },
    { id: "cup-milk", box: "0 0 24 32", width: 20, name: "Glass of milk", group: "tabletop" },
    { id: "cup-wine", box: "0 0 24 42", width: 20, name: "Glass of red wine", group: "tabletop" },
    { id: "cup-wine-bottle", box: "0 0 24 56", width: 20, name: "Bottle of wine", group: "tabletop" },
    { id: "cup-wine-pair", box: "0 0 50 56", width: 42, name: "Wine for two", group: "tabletop" },
    { id: "cup-candle", box: "0 0 34 44", width: 28, name: "Candle in a holder", group: "tabletop" },
    { id: "cup-books", box: "0 0 56 30", width: 46, name: "Stack of books", group: "tabletop" },
    { id: "cup-books-mug", box: "0 0 60 52", width: 50, name: "Books and a mug", group: "tabletop", tint: true },
    // Pictures and frames
    { id: "portrait-ghost-reader", box: "0 0 120 152", width: 140, name: "Ghost reader portrait", group: "pictures" },
    { id: "portrait-moth-ornate", box: "0 0 120 152", width: 140, name: "Moth in a gilt frame", group: "pictures" },
    { id: "picture-gallery-pastoral", box: "0 0 120 90", width: 120, name: "Country landscape", group: "pictures" },
    { id: "picture-gallery-sea", box: "0 0 120 90", width: 120, name: "Stormy sea", group: "pictures" },
    { id: "picture-gallery-stilllife", box: "0 0 84 116", width: 84, name: "Flowers in a vase", group: "pictures" },
    { id: "picture-gallery-lake", box: "0 0 80 80", width: 80, name: "Moonlit lake", group: "pictures" },
    { id: "picture-gallery-mountains", box: "0 -8 80 124", width: 76, name: "Pink mountains", group: "pictures" },
    { id: "portrait-spooky-witch", box: "0 0 80 100", width: 76, name: "Witch portrait", group: "pictures" },
    { id: "portrait-spooky-cat", box: "0 0 80 100", width: 76, name: "Black cat portrait", group: "pictures" },
    { id: "portrait-spooky-vampire", box: "0 0 80 100", width: 76, name: "Vampire portrait", group: "pictures" },
    { id: "picture-heart", box: "0 0 80 96", width: 76, name: "Anatomical heart", group: "pictures" },
    { id: "picture-butterflies", box: "0 0 100 84", width: 96, name: "Pinned butterflies", group: "pictures" },
    { id: "picture-october", box: "0 0 100 112", width: 96, name: "October", group: "pictures" },
    { id: "picture-ghost-polaroids", box: "0 0 100 124", width: 96, name: "Ghost love polaroids", group: "pictures" },
    { id: "picture-castle", box: "0 0 150 116", width: 120, name: "Castle at dusk", group: "pictures" },
    { id: "picture-haunted-house", box: "0 0 150 116", width: 120, name: "Haunted house", group: "pictures" },
    { id: "picture-london-rain", box: "0 0 150 116", width: 120, name: "London in the rain", group: "pictures" },
    { id: "picture-forest-glade", box: "0 0 150 116", width: 120, name: "Forest glade", group: "pictures" },
    { id: "picture-paris-cafe", box: "0 0 150 116", width: 120, name: "Paris café", group: "pictures" },
    { id: "picture-cathedral", box: "0 0 150 116", width: 120, name: "Moonlit cathedral", group: "pictures" },
    { id: "portrait-moth", box: "0 0 100 130", width: 70, name: "Moth portrait", group: "pictures" },
    { id: "portrait-ghost", box: "0 0 100 130", width: 70, name: "Ghost portrait", group: "pictures" },
    { id: "portrait-umbrella", box: "0 0 100 130", width: 70, name: "Umbrella portrait", group: "pictures" },
    { id: "portrait-toadstool", box: "0 0 100 130", width: 70, name: "Toadstool portrait", group: "pictures" },
    { id: "portrait-teapot", box: "0 0 100 130", width: 70, name: "Teapot portrait", group: "pictures" },
    { id: "portrait-rose", box: "0 0 100 130", width: 70, name: "Black rose portrait", group: "pictures" },
    { id: "decor-polaroid", box: "0 0 44 52", width: 50, name: "Moon polaroid", group: "pictures" },

    // Bookish
    { id: "decor-books-chapter", box: "0 0 118 108", width: 110, name: "One More Chapter books", group: "bookish" },
    { id: "decor-books-fungi", box: "0 0 146 100", width: 140, name: "Forager's books", group: "bookish" },
    { id: "decor-book-embossed", box: "0 0 92 92", width: 70, name: "Pink storybook", group: "bookish" },
    { id: "decor-books-floral", box: "0 0 118 108", width: 110, name: "Painted flower books", group: "bookish" },
    { id: "decor-books-blooming", box: "0 0 100 106", width: 96, name: "Books in bloom", group: "bookish" },
    { id: "decor-books-spooky", box: "0 0 90 70", width: 80, name: "Spooky Season books", group: "bookish" },
    { id: "decor-spellbook-ghosts", box: "0 0 80 84", width: 70, name: "Haunted spellbook", group: "bookish" },
    { id: "decor-book-club", box: "0 0 96 50", width: 84, name: "Book club ticket", group: "bookish" },
    { id: "decor-ereader", box: "0 0 60 82", width: 50, name: "Emotional support e-reader", group: "bookish" },
    { id: "decor-glasses", box: "0 0 64 30", width: 54, name: "Reading glasses", group: "bookish" },
    { id: "decor-keys", box: "0 0 64 56", width: 52, name: "Old keys", group: "bookish" },
    { id: "decor-spellbook-stack", box: "0 0 86 84", width: 96, name: "Spellbooks and a mouse", group: "bookish" },
    { id: "decor-reading-mouse", box: "0 0 48 50", width: 52, name: "Reading mouse", group: "bookish" },
    { id: "decor-open-book", box: "0 0 86 44", width: 92, name: "Open book", group: "bookish" },
    { id: "decor-stack", box: "0 0 160 76", width: 80, name: "Book stack", group: "bookish" },
    { id: "decor-quill-mug", box: "0 0 46 82", width: 46, name: "Quills in a mug", group: "bookish" },
    { id: "decor-ink-ghost", box: "0 0 52 62", width: 52, name: "Ghost ink bottle", group: "bookish" },
    { id: "decor-fountain-pen", box: "0 0 98 24", width: 92, name: "Fountain pen", group: "bookish" },
    { id: "decor-typewriter", box: "0 0 86 66", width: 92, name: "Typewriter", group: "bookish" },
    { id: "decor-mixtape", box: "0 0 86 56", width: 84, name: "Ghostly mixtape", group: "bookish" },
    { id: "decor-hourglass", box: "0 0 38 64", width: 40, name: "Hourglass", group: "bookish" },
    { id: "decor-tarot", box: "0 0 72 60", width: 72, name: "Tarot cards", group: "bookish" },
    { id: "decor-teacup", box: "0 0 112 106", width: 52, name: "Teacup", group: "bookish" },
    { id: "decor-globe", box: "0 0 112 152", width: 54, name: "Globe", group: "bookish" },
    { id: "decor-bust", box: "0 0 96 158", width: 50, name: "Bust", group: "bookish" },
    { id: "decor-sign", box: "0 0 168 128", width: 84, name: "Sign", group: "bookish" },

    // Cozy lights and friends
    { id: "decor-fairy-lights", box: "0 0 140 54", width: 162, name: "Fairy lights", group: "cozy", plain: true },
    { id: "decor-candle-jars", box: "0 0 68 52", width: 76, name: "Candles in jars", group: "cozy" },
    { id: "decor-moon-lamp", box: "0 0 50 60", width: 56, name: "Moon lamp", group: "cozy" },
    { id: "decor-mushroom-lamp", box: "0 0 46 56", width: 50, name: "Mushroom lamp", group: "cozy" },
    { id: "decor-firefly-jar", box: "0 0 40 58", width: 44, name: "Jar of fireflies", group: "cozy" },
    { id: "decor-candle", box: "0 0 80 178", width: 36, name: "Candle", group: "cozy" },
    { id: "decor-candelabra", box: "0 0 220 220", width: 110, name: "Candelabra", group: "cozy" },
    { id: "decor-lantern", box: "0 0 100 186", width: 48, name: "Lantern", group: "cozy" },
    { id: "scene-cat", box: "0 0 220 160", width: 96, name: "Sleeping cat", group: "cozy" },
    { id: "scene-dog", box: "0 0 220 160", width: 104, name: "Sleeping dog", group: "cozy" },
    { id: "decor-cat-sitting", box: "0 0 80 104", width: 60, name: "Cat", group: "cozy" },
    { id: "decor-belljar", box: "0 0 100 150", width: 50, name: "Bell jar", group: "cozy" },
    { id: "decor-umbrella-stand", box: "0 0 160 210", width: 80, name: "Umbrella stand", group: "cozy" },

    // Tea, cocoa and treats
    { id: "decor-teabag-cat", box: "0 0 78 92", width: 62, name: "Kit Tea", group: "treats" },
    { id: "decor-teabag-bat", box: "0 0 78 92", width: 62, name: "Batty Brew", group: "treats" },
    { id: "decor-bat-teacup", box: "0 0 70 52", width: 60, name: "Bat teacup", group: "treats" },
    { id: "decor-pumpkin-teapot", box: "0 0 96 84", width: 84, name: "Pumpkin teapot", group: "treats" },
    { id: "decor-cocoa", box: "0 0 66 64", width: 56, name: "Hot cocoa", group: "treats" },
    { id: "decor-pumpkin-latte", box: "0 0 56 66", width: 46, name: "Pumpkin spice latte", group: "treats" },
    { id: "decor-cinnamon-roll", box: "0 0 60 44", width: 52, name: "Cinnamon roll", group: "treats" },
    { id: "decor-pie", box: "0 0 70 50", width: 60, name: "Cherry pie", group: "treats" },
    { id: "decor-jam", box: "0 0 44 56", width: 36, name: "Strawberry jam", group: "treats" },
    { id: "decor-cookies", box: "0 0 64 40", width: 56, name: "Cookies and chocolate", group: "treats" },
    { id: "decor-heart-cake", box: "0 0 64 60", width: 54, name: "Heart cake", group: "treats" },
    { id: "decor-popcorn", box: "0 0 60 50", width: 52, name: "Ghost popcorn", group: "treats" },
    { id: "decor-void-milk", box: "0 0 64 86", width: 50, name: "Void milk", group: "treats" },
    { id: "decor-swan-carton", box: "0 0 56 86", width: 44, name: "Midnight swan", group: "treats" },

    // Autumn
    { id: "decor-pumpkin-stack", box: "0 0 56 78", width: 50, name: "Stacked pumpkins", group: "autumn" },
    { id: "decor-pumpkin-cherries", box: "0 0 64 70", width: 54, name: "Pumpkin cherries", group: "autumn" },
    { id: "decor-pumpkin-candle", box: "0 0 44 58", width: 38, name: "Pumpkin spice candle", group: "autumn" },
    { id: "decor-bunting", box: "0 0 128 42", width: 124, name: "Autumn bunting", group: "autumn" },
    { id: "decor-star-garland", box: "0 0 120 40", width: 116, name: "Star garland", group: "autumn", plain: true },
    { id: "decor-cardigan", box: "0 0 84 70", width: 70, name: "Cardigan", group: "autumn" },
    { id: "decor-socks", box: "0 0 70 66", width: 56, name: "Cozy socks", group: "autumn" },
    { id: "decor-slippers", box: "0 0 66 56", width: 56, name: "Ghost slippers", group: "autumn" },
    { id: "decor-boots", box: "0 0 76 64", width: 64, name: "Lace-up boots", group: "autumn" },
    { id: "decor-umbrella", box: "0 0 30 92", width: 26, name: "Umbrella", group: "autumn" },
    { id: "decor-yarn-basket", box: "0 0 70 58", width: 60, name: "Yarn basket", group: "autumn" },
    { id: "decor-embroidery", box: "0 0 60 70", width: 50, name: "Bat embroidery", group: "autumn" },
    { id: "decor-paints", box: "0 0 64 40", width: 54, name: "Watercolours", group: "autumn" },
    { id: "decor-camera", box: "0 0 70 56", width: 56, name: "Camera", group: "autumn" },
    { id: "decor-headphones", box: "0 0 70 60", width: 56, name: "Cat headphones", group: "autumn" },
    { id: "decor-old-tv", box: "0 0 76 70", width: 66, name: "Movie night TV", group: "autumn" },
    { id: "decor-flower-hat", box: "0 0 80 58", width: 70, name: "Sunflower witch hat", group: "autumn" },
    { id: "decor-bow-pink", box: "0 0 60 64", width: 44, name: "Pink bow", group: "autumn" },
    { id: "decor-bow-gold", box: "0 0 60 64", width: 44, name: "Gold bow", group: "autumn" },

    // Plants
    { id: "decor-pothos", box: "0 0 66 118", width: 76, name: "Hanging pothos", group: "plants" },
    { id: "decor-monstera", box: "0 0 66 84", width: 76, name: "Monstera", group: "plants" },
    { id: "decor-fern", box: "0 0 66 74", width: 76, name: "Fern", group: "plants" },
    { id: "decor-snake-plant", box: "0 0 88 190", width: 60, name: "Snake plant", group: "plants" },
    { id: "decor-succulents", box: "0 0 76 46", width: 84, name: "Succulents", group: "plants" },
    { id: "decor-cactus", box: "0 0 100 148", width: 52, name: "Cactus", group: "plants" },
    { id: "decor-lavender-jar", box: "0 0 40 74", width: 44, name: "Lavender", group: "plants" },
    { id: "decor-roses", box: "0 0 112 152", width: 64, name: "Dark roses", group: "plants" },
    { id: "decor-terrarium", box: "0 0 54 60", width: 60, name: "Terrarium", group: "plants" },
    { id: "decor-ivy-drape", box: "0 0 130 50", width: 150, name: "Trailing ivy", group: "plants", plain: true },
    { id: "decor-glow-mushrooms", box: "0 0 78 66", width: 88, name: "Glowing mushrooms", group: "plants" },
    { id: "decor-lantern-flowers", box: "0 0 66 106", width: 72, name: "Lantern flowers", group: "plants", plain: true },
    { id: "decor-plant", box: "0 0 120 156", width: 58, name: "Plant", group: "plants" },
    { id: "decor-flowers", box: "0 0 112 152", width: 54, name: "Flowers", group: "plants" },
    { id: "decor-mushrooms", box: "0 0 128 102", width: 60, name: "Toadstools", group: "plants" },
    { id: "decor-crow", box: "0 0 128 148", width: 62, name: "Crow", group: "plants" },

    // Witchy
    { id: "decor-spell-tome", box: "0 0 76 88", width: 60, name: "Book of spells", group: "witchy" },
    { id: "decor-flower-skull", box: "0 0 64 56", width: 52, name: "Flower-crowned skull", group: "witchy" },
    { id: "decor-butterfly-dome", box: "0 0 50 70", width: 42, name: "Butterfly under glass", group: "witchy" },
    { id: "decor-mushroom-burner", box: "0 0 44 70", width: 36, name: "Mushroom incense", group: "witchy" },
    { id: "decor-ouija-sign", box: "0 0 100 70", width: 84, name: "Yes / no sign", group: "witchy" },
    { id: "decor-evil-eye", box: "0 0 60 44", width: 64, name: "All-seeing eye", group: "witchy" },
    { id: "decor-planchette", box: "0 0 50 60", width: 46, name: "Planchette", group: "witchy" },
    { id: "decor-witch-hat", box: "0 0 74 56", width: 76, name: "Witch's hat", group: "witchy" },
    { id: "decor-mortar", box: "0 0 56 54", width: 54, name: "Mortar and pestle", group: "witchy" },
    { id: "decor-crystal-hand", box: "0 0 56 84", width: 52, name: "Skeleton hand and crystal", group: "witchy" },
    { id: "decor-moth", box: "0 0 60 48", width: 64, name: "Moth", group: "witchy" },
    { id: "decor-snake", box: "0 0 56 60", width: 54, name: "Snake", group: "witchy" },
    { id: "decor-magic-shop", box: "0 0 124 172", width: 144, name: "Magic shop", group: "witchy" },
    { id: "decor-crystal-ball", box: "0 0 52 64", width: 58, name: "Crystal ball", group: "witchy" },
    { id: "decor-crystal-cloche", box: "0 0 48 68", width: 52, name: "Crystal under glass", group: "witchy" },
    { id: "decor-potion-love", box: "0 0 44 62", width: 46, name: "Love potion", group: "witchy" },
    { id: "decor-potion-brew", box: "0 0 48 74", width: 52, name: "Witch's brew", group: "witchy" },
    { id: "decor-potion-poison", box: "0 0 32 74", width: 34, name: "Poison", group: "witchy" },
    { id: "decor-eye-newt", box: "0 0 46 56", width: 50, name: "Eye of newt", group: "witchy" },
    { id: "decor-spellbook", box: "0 0 50 62", width: 56, name: "Spellbook", group: "witchy" },
    { id: "decor-heart-skull", box: "0 0 52 50", width: 58, name: "Heart-eyed skull", group: "witchy" },
    { id: "decor-herbs", box: "0 0 34 76", width: 40, name: "Drying herbs", group: "witchy" },
    { id: "decor-moon-charm", box: "0 0 38 70", width: 44, name: "Moon charm", group: "witchy" },
    { id: "decor-potion", box: "0 0 80 124", width: 40, name: "Potion", group: "witchy" },
    { id: "decor-crystal", box: "0 0 96 120", width: 48, name: "Crystal", group: "witchy" },
    { id: "decor-starcharm", box: "0 0 80 104", width: 38, name: "Star charm", group: "witchy" },
    { id: "decor-cauldron", box: "0 0 140 140", width: 90, name: "Cauldron", group: "witchy" },
    { id: "decor-broom", box: "0 0 70 210", width: 44, name: "Broom", group: "witchy" },

    // Spooky
    { id: "decor-ghost-knitting", box: "0 0 110 108", width: 100, name: "Ghost knitting in a chair", group: "spooky" },
    { id: "decor-ghost-cat", box: "0 0 60 64", width: 50, name: "Ghost cat", group: "spooky" },
    { id: "decor-ghost-cat-tea", box: "0 0 60 66", width: 50, name: "Ghost cat with tea", group: "spooky" },
    { id: "decor-vampire-cat", box: "0 0 86 70", width: 70, name: "Vampire cat", group: "spooky" },
    { id: "decor-ghost-kitten", box: "0 0 64 74", width: 52, name: "Ghost and kitten", group: "spooky" },
    { id: "decor-ghost-mug", box: "0 0 60 70", width: 50, name: "Ghost with a mug", group: "spooky" },
    { id: "decor-skull-wreath", box: "0 0 100 112", width: 90, name: "Skull wreath", group: "spooky" },
    { id: "decor-ghost-reader", box: "0 0 70 78", width: 78, name: "Ghost reading", group: "spooky" },
    { id: "decor-ghost-books", box: "0 0 70 80", width: 78, name: "Ghost with books", group: "spooky" },
    { id: "decor-ghost-scholar", box: "0 0 72 96", width: 78, name: "Scholar ghost", group: "spooky" },
    { id: "decor-ghost", box: "0 0 92 108", width: 50, name: "Ghost", group: "spooky" },
    { id: "decor-bat-pumpkin", box: "0 0 66 62", width: 72, name: "Bat in a pumpkin", group: "spooky" },
    { id: "decor-bat-hanging", box: "0 0 52 80", width: 56, name: "Sleepy bat", group: "spooky" },
    { id: "decor-bat-ghost", box: "0 0 58 66", width: 60, name: "Bat in a sheet", group: "spooky" },
    { id: "decor-bat-scarf", box: "0 0 88 60", width: 90, name: "Bat in a scarf", group: "spooky" },
    { id: "decor-bat", box: "0 0 168 84", width: 72, name: "Bat", group: "spooky" },
    { id: "decor-jack-lantern", box: "0 0 56 50", width: 64, name: "Jack-o'-lantern", group: "spooky" },
    { id: "decor-pumpkin", box: "0 0 120 86", width: 56, name: "Pumpkin", group: "spooky" },
    { id: "decor-spider", box: "0 0 34 74", width: 34, name: "Spider", group: "spooky" },
    { id: "decor-skull", box: "0 -22 104 114", width: 52, name: "Skull", group: "spooky" },
    { id: "decor-cobweb", box: "0 0 120 120", width: 100, name: "Cobweb (left corner)", group: "spooky", dark: true, plain: true },
    { id: "decor-cobweb-right", box: "0 0 120 120", width: 100, name: "Cobweb (right corner)", group: "spooky", dark: true, plain: true },

    // Older pieces, still shown if they were placed before.
    { id: "frame-moth", box: "0 0 80 100", width: 70, name: "Moth frame", group: "retired" },
    { id: "frame-ghost", box: "0 0 70 90", width: 62, name: "Ghost portrait", group: "retired" },
    { id: "frame-castle", box: "0 0 130 100", width: 100, name: "Castle painting", group: "retired" },

    // Winter rugs (in Floor, with the other rugs).
    { id: "hol-rug-burgundy-stars", src: "assets/decor/holiday/rug_burgundy_stars.webp", size: [480, 225], width: 270, name: "Burgundy star rug", group: "rugs", floor: true },
    { id: "hol-rug-winter-plaid", src: "assets/decor/holiday/rug_winter_plaid.webp", size: [480, 164], width: 260, name: "Winter plaid rug", group: "rugs", floor: true },
    { id: "hol-rug-frosted-snowflake", src: "assets/decor/holiday/rug_frosted_snowflake.webp", size: [480, 277], width: 240, name: "Frosted snowflake rug", group: "rugs", floor: true },
    { id: "hol-rug-solstice-orange", src: "assets/decor/holiday/rug_solstice_orange.webp", size: [480, 232], width: 270, name: "Solstice orange rug", group: "rugs", floor: true },
    // The collections' furniture and decorations (assets/decor/sets/).
    { id: "set-folk-oval-table", src: "assets/decor/sets/folk_oval_table.webp", size: [460, 402], width: 190, name: "Folk-painted oval table", group: "set-ink-folklore", kind: "furniture" },
    { id: "set-coral-scarf-armchair", src: "assets/decor/sets/coral_scarf_armchair.webp", size: [460, 440], width: 180, name: "Coral armchair with a scarf", group: "set-ink-folklore", kind: "furniture" },
    { id: "set-snowflake-cocoa-mug", src: "assets/decor/sets/snowflake_cocoa_mug.webp", size: [460, 423], width: 64, name: "Snowflake cocoa mug", group: "set-ink-folklore", kind: "tabletop" },
    { id: "set-winterberry-pot", src: "assets/decor/sets/winterberry_pot.webp", size: [368, 460], width: 74, name: "Winterberry pot", group: "set-ink-folklore", kind: "plants" },
    { id: "set-rose-writing-desk", src: "assets/decor/sets/rose_writing_desk.webp", size: [460, 358], width: 210, name: "Rose writing desk", group: "set-bookish-whimsy", kind: "furniture" },
    { id: "set-tufted-window-bench", src: "assets/decor/sets/tufted_window_bench.webp", size: [460, 235], width: 230, name: "Tufted window bench", group: "set-bookish-whimsy", kind: "furniture" },
    { id: "set-bunny-gift-box", src: "assets/decor/sets/bunny_gift_box.webp", size: [335, 460], width: 80, name: "Bunny in a gift box", group: "set-bookish-whimsy", kind: "friends" },
    { id: "set-book-tree", src: "assets/decor/sets/book_tree.webp", size: [314, 460], width: 84, name: "Book tree", group: "set-bookish-whimsy", kind: "tabletop" },
    { id: "set-gingham-pedestal-table", src: "assets/decor/sets/gingham_pedestal_table.webp", size: [460, 442], width: 170, name: "Gingham pedestal table", group: "set-fireside-library", kind: "furniture" },
    { id: "set-red-wingback", src: "assets/decor/sets/red_wingback.webp", size: [352, 460], width: 180, name: "Red striped wingback", group: "set-fireside-library", kind: "furniture" },
    { id: "set-copper-lantern", src: "assets/decor/sets/copper_lantern.webp", size: [222, 460], width: 66, name: "Copper candle lantern", group: "set-fireside-library", kind: "lights" },
    { id: "set-gingham-rocking-stool", src: "assets/decor/sets/gingham_rocking_stool.webp", size: [460, 362], width: 120, name: "Gingham rocking footstool", group: "set-fireside-library", kind: "furniture" },
    { id: "set-gingham-tea-table", src: "assets/decor/sets/gingham_tea_table.webp", size: [460, 408], width: 170, name: "Gingham tea table", group: "set-warm-gouache", kind: "furniture" },
    { id: "set-folk-flower-chair", src: "assets/decor/sets/folk_flower_chair.webp", size: [323, 460], width: 140, name: "Folk flower chair", group: "set-warm-gouache", kind: "furniture" },
    { id: "set-holly-cocoa-mug", src: "assets/decor/sets/holly_cocoa_mug.webp", size: [460, 445], width: 64, name: "Holly cocoa mug", group: "set-warm-gouache", kind: "tabletop" },
    { id: "set-gingerbread-cookie-plate", src: "assets/decor/sets/gingerbread_cookie_plate.webp", size: [460, 455], width: 84, name: "Plate of gingerbread cookies", group: "set-warm-gouache", kind: "tabletop" },
    { id: "set-painted-side-table", src: "assets/decor/sets/painted_side_table.webp", size: [373, 460], width: 120, name: "Painted side table", group: "set-snowy-fairytale", kind: "furniture" },
    { id: "set-lavender-armchair", src: "assets/decor/sets/lavender_armchair.webp", size: [446, 460], width: 180, name: "Lavender armchair", group: "set-snowy-fairytale", kind: "furniture" },
    { id: "set-cottage-snowglobe", src: "assets/decor/sets/cottage_snowglobe.webp", size: [361, 460], width: 76, name: "Cottage snow globe", group: "set-snowy-fairytale", kind: "tabletop" },
    { id: "set-pine-teapot", src: "assets/decor/sets/pine_teapot.webp", size: [460, 323], width: 80, name: "Pine teapot", group: "set-snowy-fairytale", kind: "tabletop" },
    { id: "set-scalloped-pink-table", src: "assets/decor/sets/scalloped_pink_table.webp", size: [441, 460], width: 150, name: "Scalloped pink table", group: "set-sugarplum-pastel", kind: "furniture" },
    { id: "set-bow-shell-chair", src: "assets/decor/sets/bow_shell_chair.webp", size: [332, 460], width: 140, name: "Velvet shell chair with a bow", group: "set-sugarplum-pastel", kind: "furniture" },
    { id: "set-gingerbread-ornament", src: "assets/decor/sets/gingerbread_ornament.webp", size: [392, 460], width: 70, name: "Gingerbread house ornament", group: "set-sugarplum-pastel", kind: "wall" },
    { id: "set-ribboned-gifts", src: "assets/decor/sets/ribboned_gifts.webp", size: [327, 460], width: 84, name: "Stack of ribboned gifts", group: "set-sugarplum-pastel", kind: "tabletop" },
    { id: "set-painted-country-table", src: "assets/decor/sets/painted_country_table.webp", size: [460, 449], width: 160, name: "Painted country table", group: "set-vintage-woodland", kind: "furniture" },
    { id: "set-rust-velvet-armchair", src: "assets/decor/sets/rust_velvet_armchair.webp", size: [439, 460], width: 180, name: "Rust velvet armchair", group: "set-vintage-woodland", kind: "furniture" },
    { id: "set-pinecone-basket", src: "assets/decor/sets/pinecone_basket.webp", size: [396, 460], width: 80, name: "Basket of pinecones", group: "set-vintage-woodland", kind: "tabletop" },
    { id: "set-sleeping-mouse", src: "assets/decor/sets/sleeping_mouse.webp", size: [460, 268], width: 96, name: "Sleeping mouse in a blanket", group: "set-vintage-woodland", kind: "friends" },
    { id: "set-oval-coffee-table", src: "assets/decor/sets/oval_coffee_table.webp", size: [460, 230], width: 210, name: "Oval coffee table", group: "set-cozy-sage", kind: "furniture" },
    { id: "set-peppermint-armchair", src: "assets/decor/sets/peppermint_armchair.webp", size: [460, 425], width: 190, name: "Peppermint armchair", group: "set-cozy-sage", kind: "furniture" },
    { id: "set-tree-cocoa-mug", src: "assets/decor/sets/tree_cocoa_mug.webp", size: [460, 439], width: 64, name: "Tree cocoa mug", group: "set-cozy-sage", kind: "tabletop" },
    { id: "set-gingerbread-friend", src: "assets/decor/sets/gingerbread_friend.webp", size: [306, 460], width: 60, name: "Gingerbread friend", group: "set-cozy-sage", kind: "friends" },
    // The collections' cozy additions: a rug, a cat and a dog, a picture, a garland, a fireplace and a Yule log each.
    { id: "set-bookish-whimsy-rug", src: "assets/decor/sets/bookish_whimsy_rug.webp", size: [640, 323], width: 280, name: "Dusty-rose botanical rug", group: "set-bookish-whimsy", kind: "rugs", floor: true },
    { id: "set-bookish-whimsy-cat", src: "assets/decor/sets/bookish_whimsy_cat.webp", size: [308, 460], width: 80, name: "White cat with a rose collar", group: "set-bookish-whimsy", kind: "friends" },
    { id: "set-bookish-whimsy-dog", src: "assets/decor/sets/bookish_whimsy_dog.webp", size: [460, 247], width: 120, name: "Sleeping cream-and-tan dog", group: "set-bookish-whimsy", kind: "friends" },
    { id: "set-bookish-whimsy-wall-art", src: "assets/decor/sets/bookish_whimsy_wall_art.webp", size: [442, 460], width: 100, name: "Open book picture", group: "set-bookish-whimsy", kind: "wall" },
    { id: "set-bookish-whimsy-garland", src: "assets/decor/sets/bookish_whimsy_garland.webp", size: [720, 228], width: 260, name: "Book-page garland", group: "set-bookish-whimsy", kind: "wall" },
    { id: "set-bookish-whimsy-fireplace", src: "assets/decor/sets/bookish_whimsy_fireplace.webp", size: [600, 464], width: 230, name: "Jade-tiled fireplace", group: "set-bookish-whimsy", kind: "furniture" },
    { id: "set-bookish-whimsy-yule-log", src: "assets/decor/sets/bookish_whimsy_yule_log.webp", size: [460, 225], width: 110, name: "Birch Yule log with rose ribbon", group: "set-bookish-whimsy", kind: "tabletop" },
    { id: "set-cozy-sage-rug", src: "assets/decor/sets/cozy_sage_rug.webp", size: [640, 406], width: 280, name: "Sage checker rug", group: "set-cozy-sage", kind: "rugs", floor: true },
    { id: "set-cozy-sage-cat", src: "assets/decor/sets/cozy_sage_cat.webp", size: [460, 332], width: 120, name: "Sleeping cream cat", group: "set-cozy-sage", kind: "friends" },
    { id: "set-cozy-sage-dog", src: "assets/decor/sets/cozy_sage_dog.webp", size: [460, 287], width: 120, name: "Chocolate-and-cream dog", group: "set-cozy-sage", kind: "friends" },
    { id: "set-cozy-sage-wall-art", src: "assets/decor/sets/cozy_sage_wall_art.webp", size: [450, 460], width: 100, name: "Snowflake picture", group: "set-cozy-sage", kind: "wall" },
    { id: "set-cozy-sage-garland", src: "assets/decor/sets/cozy_sage_garland.webp", size: [720, 222], width: 260, name: "Pine garland with bells", group: "set-cozy-sage", kind: "wall" },
    { id: "set-cozy-sage-fireplace", src: "assets/decor/sets/cozy_sage_fireplace.webp", size: [600, 553], width: 230, name: "Sage-tiled fireplace", group: "set-cozy-sage", kind: "furniture" },
    { id: "set-cozy-sage-yule-log", src: "assets/decor/sets/cozy_sage_yule_log.webp", size: [460, 325], width: 110, name: "Walnut Yule log", group: "set-cozy-sage", kind: "tabletop" },
    { id: "set-fireside-library-rug", src: "assets/decor/sets/fireside_library_rug.webp", size: [640, 422], width: 280, name: "Oxblood vine rug", group: "set-fireside-library", kind: "rugs", floor: true },
    { id: "set-fireside-library-cat", src: "assets/decor/sets/fireside_library_cat.webp", size: [460, 322], width: 120, name: "Black cat with amber eyes", group: "set-fireside-library", kind: "friends" },
    { id: "set-fireside-library-dog", src: "assets/decor/sets/fireside_library_dog.webp", size: [460, 296], width: 120, name: "Curled-up collie", group: "set-fireside-library", kind: "friends" },
    { id: "set-fireside-library-wall-art", src: "assets/decor/sets/fireside_library_wall_art.webp", size: [460, 368], width: 100, name: "Candlestick and books painting", group: "set-fireside-library", kind: "wall" },
    { id: "set-fireside-library-garland", src: "assets/decor/sets/fireside_library_garland.webp", size: [720, 232], width: 260, name: "Fir garland with gold bells", group: "set-fireside-library", kind: "wall" },
    { id: "set-fireside-library-fireplace", src: "assets/decor/sets/fireside_library_fireplace.webp", size: [600, 505], width: 230, name: "Brick fireplace with a brass grate", group: "set-fireside-library", kind: "furniture" },
    { id: "set-fireside-library-yule-log", src: "assets/decor/sets/fireside_library_yule_log.webp", size: [460, 260], width: 110, name: "Oak Yule log with three candles", group: "set-fireside-library", kind: "tabletop" },
    { id: "set-ink-folklore-rug", src: "assets/decor/sets/ink_folklore_rug.webp", size: [640, 427], width: 280, name: "Slate-blue star rug", group: "set-ink-folklore", kind: "rugs", floor: true },
    { id: "set-ink-folklore-cat", src: "assets/decor/sets/ink_folklore_cat.webp", size: [460, 357], width: 120, name: "Sleeping calico cat", group: "set-ink-folklore", kind: "friends" },
    { id: "set-ink-folklore-dog", src: "assets/decor/sets/ink_folklore_dog.webp", size: [460, 236], width: 120, name: "Sleeping spaniel", group: "set-ink-folklore", kind: "friends" },
    { id: "set-ink-folklore-wall-art", src: "assets/decor/sets/ink_folklore_wall_art.webp", size: [365, 460], width: 100, name: "Winter hare picture", group: "set-ink-folklore", kind: "wall" },
    { id: "set-ink-folklore-garland", src: "assets/decor/sets/ink_folklore_garland.webp", size: [720, 219], width: 260, name: "Berry garland with paper stars", group: "set-ink-folklore", kind: "wall" },
    { id: "set-ink-folklore-fireplace", src: "assets/decor/sets/ink_folklore_fireplace.webp", size: [600, 599], width: 230, name: "Cream plaster fireplace", group: "set-ink-folklore", kind: "furniture" },
    { id: "set-ink-folklore-yule-log", src: "assets/decor/sets/ink_folklore_yule_log.webp", size: [460, 379], width: 110, name: "Bark Yule log", group: "set-ink-folklore", kind: "tabletop" },
    { id: "set-snowy-fairytale-rug", src: "assets/decor/sets/snowy_fairytale_rug.webp", size: [640, 624], width: 230, name: "Round snowflake rug", group: "set-snowy-fairytale", kind: "rugs", floor: true },
    { id: "set-snowy-fairytale-cat", src: "assets/decor/sets/snowy_fairytale_cat.webp", size: [460, 343], width: 120, name: "Sleeping blue-grey cat", group: "set-snowy-fairytale", kind: "friends" },
    { id: "set-snowy-fairytale-dog", src: "assets/decor/sets/snowy_fairytale_dog.webp", size: [357, 460], width: 80, name: "Fluffy white spitz", group: "set-snowy-fairytale", kind: "friends" },
    { id: "set-snowy-fairytale-wall-art", src: "assets/decor/sets/snowy_fairytale_wall_art.webp", size: [440, 460], width: 100, name: "Snowy cabin picture", group: "set-snowy-fairytale", kind: "wall" },
    { id: "set-snowy-fairytale-garland", src: "assets/decor/sets/snowy_fairytale_garland.webp", size: [720, 224], width: 260, name: "Garland with lavender baubles", group: "set-snowy-fairytale", kind: "wall" },
    { id: "set-snowy-fairytale-fireplace", src: "assets/decor/sets/snowy_fairytale_fireplace.webp", size: [600, 464], width: 230, name: "Icy-blue cottage fireplace", group: "set-snowy-fairytale", kind: "furniture" },
    { id: "set-snowy-fairytale-yule-log", src: "assets/decor/sets/snowy_fairytale_yule_log.webp", size: [460, 256], width: 110, name: "Birch Yule log with blue ribbon", group: "set-snowy-fairytale", kind: "tabletop" },
    { id: "set-sugarplum-pastel-rug", src: "assets/decor/sets/sugarplum_pastel_rug.webp", size: [640, 459], width: 280, name: "Scalloped blush rug", group: "set-sugarplum-pastel", kind: "rugs", floor: true },
    { id: "set-sugarplum-pastel-cat", src: "assets/decor/sets/sugarplum_pastel_cat.webp", size: [269, 460], width: 80, name: "Fluffy cream cat", group: "set-sugarplum-pastel", kind: "friends" },
    { id: "set-sugarplum-pastel-dog", src: "assets/decor/sets/sugarplum_pastel_dog.webp", size: [329, 460], width: 80, name: "Little cream poodle", group: "set-sugarplum-pastel", kind: "friends" },
    { id: "set-sugarplum-pastel-wall-art", src: "assets/decor/sets/sugarplum_pastel_wall_art.webp", size: [410, 460], width: 100, name: "Gingerbread cottage picture", group: "set-sugarplum-pastel", kind: "wall" },
    { id: "set-sugarplum-pastel-garland", src: "assets/decor/sets/sugarplum_pastel_garland.webp", size: [720, 221], width: 260, name: "Mint garland with bows", group: "set-sugarplum-pastel", kind: "wall" },
    { id: "set-sugarplum-pastel-fireplace", src: "assets/decor/sets/sugarplum_pastel_fireplace.webp", size: [600, 471], width: 230, name: "Blush-tiled fireplace", group: "set-sugarplum-pastel", kind: "furniture" },
    { id: "set-sugarplum-pastel-yule-log", src: "assets/decor/sets/sugarplum_pastel_yule_log.webp", size: [460, 248], width: 110, name: "Birch Yule log with berry bows", group: "set-sugarplum-pastel", kind: "tabletop" },
    { id: "set-vintage-woodland-rug", src: "assets/decor/sets/vintage_woodland_rug.webp", size: [640, 445], width: 280, name: "Moss oak-leaf rug", group: "set-vintage-woodland", kind: "rugs", floor: true },
    { id: "set-vintage-woodland-cat", src: "assets/decor/sets/vintage_woodland_cat.webp", size: [460, 332], width: 120, name: "Sleeping tabby cat", group: "set-vintage-woodland", kind: "friends" },
    { id: "set-vintage-woodland-dog", src: "assets/decor/sets/vintage_woodland_dog.webp", size: [264, 460], width: 80, name: "Wiry brown terrier", group: "set-vintage-woodland", kind: "friends" },
    { id: "set-vintage-woodland-wall-art", src: "assets/decor/sets/vintage_woodland_wall_art.webp", size: [355, 460], width: 100, name: "Sleeping fox painting", group: "set-vintage-woodland", kind: "wall" },
    { id: "set-vintage-woodland-garland", src: "assets/decor/sets/vintage_woodland_garland.webp", size: [720, 218], width: 260, name: "Pinecone garland", group: "set-vintage-woodland", kind: "wall" },
    { id: "set-vintage-woodland-fireplace", src: "assets/decor/sets/vintage_woodland_fireplace.webp", size: [547, 600], width: 230, name: "Stone cottage fireplace", group: "set-vintage-woodland", kind: "furniture" },
    { id: "set-vintage-woodland-yule-log", src: "assets/decor/sets/vintage_woodland_yule_log.webp", size: [460, 257], width: 110, name: "Mossy Yule log with acorns", group: "set-vintage-woodland", kind: "tabletop" },
    { id: "set-warm-gouache-rug", src: "assets/decor/sets/warm_gouache_rug.webp", size: [638, 640], width: 230, name: "Braided folk-flower rug", group: "set-warm-gouache", kind: "rugs", floor: true },
    { id: "set-warm-gouache-cat", src: "assets/decor/sets/warm_gouache_cat.webp", size: [375, 460], width: 80, name: "Ginger tabby cat", group: "set-warm-gouache", kind: "friends" },
    { id: "set-warm-gouache-dog", src: "assets/decor/sets/warm_gouache_dog.webp", size: [460, 372], width: 120, name: "Cream retriever", group: "set-warm-gouache", kind: "friends" },
    { id: "set-warm-gouache-wall-art", src: "assets/decor/sets/warm_gouache_wall_art.webp", size: [412, 460], width: 100, name: "Winter birds picture", group: "set-warm-gouache", kind: "wall" },
    { id: "set-warm-gouache-garland", src: "assets/decor/sets/warm_gouache_garland.webp", size: [720, 225], width: 260, name: "Garland with orange slices", group: "set-warm-gouache", kind: "wall" },
    { id: "set-warm-gouache-fireplace", src: "assets/decor/sets/warm_gouache_fireplace.webp", size: [600, 513], width: 230, name: "Folk-flower tiled fireplace", group: "set-warm-gouache", kind: "furniture" },
    { id: "set-warm-gouache-yule-log", src: "assets/decor/sets/warm_gouache_yule_log.webp", size: [460, 306], width: 110, name: "Yule log with orange slices", group: "set-warm-gouache", kind: "tabletop" },

    // Holiday pieces (assets/decor/holiday/): the Holidays style in the panel.
    { id: "hol-christmas-tree", src: "assets/decor/holiday/christmas_tree.webp", size: [304, 460], width: 170, name: "Christmas tree", group: "holiday-christmas" },
    { id: "hol-christmas-wreath", src: "assets/decor/holiday/christmas_wreath.webp", size: [424, 460], width: 120, name: "Christmas wreath", group: "holiday-christmas" },
    { id: "hol-christmas-stocking", src: "assets/decor/holiday/christmas_stocking.webp", size: [241, 460], width: 70, name: "Christmas stocking", group: "holiday-christmas" },
    { id: "hol-evergreen-garland", src: "assets/decor/holiday/evergreen_garland.webp", size: [560, 164], width: 260, name: "Evergreen garland", group: "holiday-christmas" },
    { id: "hol-gingerbread-house", src: "assets/decor/holiday/gingerbread_house.webp", size: [444, 460], width: 100, name: "Gingerbread house", group: "holiday-christmas" },
    { id: "hol-gift-stack", src: "assets/decor/holiday/gift_stack.webp", size: [286, 460], width: 80, name: "Stack of gifts", group: "holiday-christmas" },
    { id: "hol-cookies-milk", src: "assets/decor/holiday/cookies_milk.webp", size: [460, 362], width: 100, name: "Cookies and milk", group: "holiday-christmas" },
    { id: "hol-holiday-table-lamp", src: "assets/decor/holiday/holiday_table_lamp.webp", size: [293, 460], width: 80, name: "Holly table lamp", group: "holiday-christmas" },
    { id: "hol-hanukkah-hanukkiah", src: "assets/decor/holiday/hanukkah_hanukkiah.webp", size: [454, 460], width: 100, name: "Hanukkiah", group: "holiday-hanukkah" },
    { id: "hol-wooden-dreidel", src: "assets/decor/holiday/wooden_dreidel.webp", size: [317, 460], width: 45, name: "Wooden dreidel", group: "holiday-hanukkah" },
    { id: "hol-hanukkah-star-hanging", src: "assets/decor/holiday/hanukkah_star_hanging.webp", size: [236, 460], width: 60, name: "Hanging Star of David", group: "holiday-hanukkah" },
    { id: "hol-sufganiyot-plate", src: "assets/decor/holiday/sufganiyot_plate.webp", size: [460, 352], width: 95, name: "Plate of sufganiyot", group: "holiday-hanukkah" },
    { id: "hol-latkes-plate", src: "assets/decor/holiday/latkes_plate.webp", size: [460, 338], width: 95, name: "Plate of latkes", group: "holiday-hanukkah" },
    { id: "hol-gelt-bowl", src: "assets/decor/holiday/gelt_bowl.webp", size: [460, 411], width: 80, name: "Bowl of gelt", group: "holiday-hanukkah" },
    { id: "hol-hanukkah-candle-box", src: "assets/decor/holiday/hanukkah_candle_box.webp", size: [376, 460], width: 60, name: "Hanukkah candle box", group: "holiday-hanukkah" },
    { id: "hol-olive-branch-vase", src: "assets/decor/holiday/olive_branch_vase.webp", size: [299, 460], width: 75, name: "Olive branch vase", group: "holiday-hanukkah" },
    { id: "hol-turkey", src: "assets/decor/holiday/turkey.webp", size: [455, 460], width: 110, name: "Turkey", group: "holiday-harvest" },
    { id: "hol-pumpkin", src: "assets/decor/holiday/pumpkin.webp", size: [460, 408], width: 85, name: "Harvest pumpkin", group: "holiday-harvest" },
    { id: "hol-pumpkin-pie", src: "assets/decor/holiday/pumpkin_pie.webp", size: [460, 359], width: 90, name: "Pumpkin pie", group: "holiday-harvest" },
    { id: "hol-apple-basket", src: "assets/decor/holiday/apple_basket.webp", size: [404, 460], width: 90, name: "Apple basket", group: "holiday-harvest" },
    { id: "hol-harvest-wreath", src: "assets/decor/holiday/harvest_wreath.webp", size: [430, 460], width: 120, name: "Harvest wreath", group: "holiday-harvest" },
    { id: "hol-harvest-pitcher", src: "assets/decor/holiday/harvest_pitcher.webp", size: [363, 460], width: 80, name: "Wheat pitcher", group: "holiday-harvest" },
    { id: "hol-acorn-dish", src: "assets/decor/holiday/acorn_dish.webp", size: [460, 411], width: 75, name: "Acorn dish", group: "holiday-harvest" },
    { id: "hol-plaid-throw", src: "assets/decor/holiday/plaid_throw.webp", size: [460, 289], width: 110, name: "Plaid throw", group: "holiday-harvest" },
    { id: "hol-krampus-figurine", src: "assets/decor/holiday/krampus_figurine.webp", size: [310, 460], width: 75, name: "Krampus figurine", group: "holiday-krampus" },
    { id: "hol-horned-mask", src: "assets/decor/holiday/horned_mask.webp", size: [367, 460], width: 95, name: "Horned mask", group: "holiday-krampus" },
    { id: "hol-krampus-bell", src: "assets/decor/holiday/krampus_bell.webp", size: [298, 460], width: 55, name: "Krampus bell", group: "holiday-krampus" },
    { id: "hol-bell-wreath", src: "assets/decor/holiday/bell_wreath.webp", size: [448, 460], width: 120, name: "Bell wreath", group: "holiday-krampus" },
    { id: "hol-krampus-boot", src: "assets/decor/holiday/krampus_boot.webp", size: [421, 460], width: 75, name: "Krampus boot", group: "holiday-krampus" },
    { id: "hol-krampus-lantern", src: "assets/decor/holiday/krampus_lantern.webp", size: [259, 460], width: 60, name: "Krampus lantern", group: "holiday-krampus" },
    { id: "hol-krampus-snowglobe", src: "assets/decor/holiday/krampus_snowglobe.webp", size: [337, 460], width: 70, name: "Krampus snow globe", group: "holiday-krampus" },
    { id: "hol-goat-plush", src: "assets/decor/holiday/goat_plush.webp", size: [350, 460], width: 75, name: "Goat plush", group: "holiday-krampus" },
    { id: "hol-kwanzaa-kinara", src: "assets/decor/holiday/kwanzaa_kinara.webp", size: [460, 325], width: 110, name: "Kinara", group: "holiday-kwanzaa" },
    { id: "hol-unity-cup", src: "assets/decor/holiday/unity_cup.webp", size: [411, 460], width: 60, name: "Unity cup", group: "holiday-kwanzaa" },
    { id: "hol-mkeka-mat", src: "assets/decor/holiday/mkeka_mat.webp", size: [460, 319], width: 120, name: "Mkeka mat", group: "holiday-kwanzaa" },
    { id: "hol-kwanzaa-corn", src: "assets/decor/holiday/kwanzaa_corn.webp", size: [268, 460], width: 55, name: "Ears of corn", group: "holiday-kwanzaa" },
    { id: "hol-harvest-basket", src: "assets/decor/holiday/harvest_basket.webp", size: [352, 460], width: 85, name: "Harvest basket", group: "holiday-kwanzaa" },
    { id: "hol-harvest-fruit-bowl", src: "assets/decor/holiday/harvest_fruit_bowl.webp", size: [429, 460], width: 90, name: "Bowl of fruit", group: "holiday-kwanzaa" },
    { id: "hol-kwanzaa-gift", src: "assets/decor/holiday/kwanzaa_gift.webp", size: [460, 332], width: 75, name: "Kwanzaa gift", group: "holiday-kwanzaa" },
    { id: "hol-kwanzaa-cushion", src: "assets/decor/holiday/kwanzaa_cushion.webp", size: [460, 448], width: 90, name: "Kwanzaa cushion", group: "holiday-kwanzaa" },
    { id: "hol-midnight-clock", src: "assets/decor/holiday/midnight_clock.webp", size: [460, 372], width: 110, name: "Midnight clock", group: "holiday-new-year" },
    { id: "hol-new-year-star-garland", src: "assets/decor/holiday/new_year_star_garland.webp", size: [560, 159], width: 260, name: "Gold star garland", group: "holiday-new-year" },
    { id: "hol-new-year-wreath", src: "assets/decor/holiday/new_year_wreath.webp", size: [392, 460], width: 120, name: "New Year wreath", group: "holiday-new-year" },
    { id: "hol-pocket-watch", src: "assets/decor/holiday/pocket_watch.webp", size: [388, 460], width: 60, name: "Pocket watch", group: "holiday-new-year" },
    { id: "hol-new-year-party-hat", src: "assets/decor/holiday/new_year_party_hat.webp", size: [308, 460], width: 50, name: "Party hat", group: "holiday-new-year" },
    { id: "hol-new-year-gift", src: "assets/decor/holiday/new_year_gift.webp", size: [415, 460], width: 70, name: "New Year gift", group: "holiday-new-year" },
    { id: "hol-victorian-candleholder", src: "assets/decor/holiday/victorian_candleholder.webp", size: [355, 460], width: 75, name: "Victorian candleholder", group: "holiday-new-year" },
    { id: "hol-winter-ghost-portrait", src: "assets/decor/holiday/winter_ghost_portrait.webp", size: [344, 460], width: 110, name: "Winter ghost portrait", group: "holiday-new-year" },
    { id: "hol-snowman", src: "assets/decor/holiday/snowman.webp", size: [333, 460], width: 120, name: "Snowman", group: "holiday-winter" },
    { id: "hol-snowy-pine", src: "assets/decor/holiday/snowy_pine.webp", size: [294, 460], width: 120, name: "Snowy pine", group: "holiday-winter" },
    { id: "hol-winter-sled", src: "assets/decor/holiday/winter_sled.webp", size: [460, 172], width: 150, name: "Wooden sled", group: "holiday-winter" },
    { id: "hol-winter-armchair", src: "assets/decor/holiday/winter_armchair.webp", size: [460, 456], width: 180, name: "Winter armchair", group: "holiday-winter" },
    { id: "hol-snowflake", src: "assets/decor/holiday/snowflake.webp", size: [303, 460], width: 80, name: "Snowflake", group: "holiday-winter" },
    { id: "hol-mittens", src: "assets/decor/holiday/mittens.webp", size: [460, 460], width: 100, name: "Mittens", group: "holiday-winter" },
    { id: "hol-cocoa-mug", src: "assets/decor/holiday/cocoa_mug.webp", size: [460, 425], width: 60, name: "Mug of cocoa", group: "holiday-winter" },
    { id: "hol-snowy-cottage", src: "assets/decor/holiday/snowy_cottage.webp", size: [414, 460], width: 95, name: "Snowy cottage", group: "holiday-winter" },
    { id: "hol-yule-log", src: "assets/decor/holiday/yule_log.webp", size: [460, 315], width: 120, name: "Yule log", group: "holiday-yule" },
    { id: "hol-yule-wreath", src: "assets/decor/holiday/yule_wreath.webp", size: [460, 444], width: 120, name: "Yule wreath", group: "holiday-yule" },
    { id: "hol-solstice-sun-plaque", src: "assets/decor/holiday/solstice_sun_plaque.webp", size: [405, 460], width: 110, name: "Solstice sun plaque", group: "holiday-yule" },
    { id: "hol-solstice-lantern", src: "assets/decor/holiday/solstice_lantern.webp", size: [243, 460], width: 60, name: "Solstice lantern", group: "holiday-yule" },
    { id: "hol-winter-herb-bundle", src: "assets/decor/holiday/winter_herb_bundle.webp", size: [228, 460], width: 70, name: "Winter herb bundle", group: "holiday-yule" },
    { id: "hol-orange-cinnamon-bundle", src: "assets/decor/holiday/orange_cinnamon_bundle.webp", size: [460, 335], width: 85, name: "Oranges and cinnamon", group: "holiday-yule" },
    { id: "hol-pinecone-bowl", src: "assets/decor/holiday/pinecone_bowl.webp", size: [442, 460], width: 85, name: "Bowl of pinecones", group: "holiday-yule" },
    { id: "hol-evergreen-pitcher", src: "assets/decor/holiday/evergreen_pitcher.webp", size: [311, 460], width: 75, name: "Evergreen pitcher", group: "holiday-yule" }
];

/*
    Fabrics for chairs, sofas and cushions: the piece's main
    colour, a lighter one for seats and buttons, and a shade.
    Saved on the piece as decoration_type "tint:<id>".
*/

export const FABRICS = [
    { id: "rose", name: "Rose velvet", colours: ["#c86a88", "#e08aa4", "#8a3a56"] },
    { id: "blush", name: "Blush", colours: ["#e8a0a8", "#f2bcc2", "#b0606a"] },
    { id: "oxblood", name: "Oxblood leather", colours: ["#7a2a26", "#9a3a32", "#4a1614"] },
    { id: "rust", name: "Rust", colours: ["#c8622e", "#d8784a", "#8e3c16"] },
    { id: "mustard", name: "Mustard", colours: ["#e0a83a", "#f0c460", "#9a6818"] },
    { id: "sage", name: "Sage", colours: ["#7a9a78", "#94b290", "#4a6448"] },
    { id: "emerald", name: "Emerald", colours: ["#2f6e4e", "#3f8a62", "#18402c"] },
    { id: "teal", name: "Teal", colours: ["#3f8a88", "#5aa4a0", "#1f5654"] },
    { id: "blue", name: "Dusty blue", colours: ["#7a92b8", "#94aacc", "#4a5e82"] },
    { id: "navy", name: "Navy", colours: ["#2c3a70", "#3e4e8a", "#161e40"] },
    { id: "lavender", name: "Lavender", colours: ["#9a82c8", "#b8a2e0", "#5a4488"] },
    { id: "plum", name: "Plum", colours: ["#5e3056", "#7a4070", "#361a30"] },
    { id: "cream", name: "Cream", colours: ["#e8dcc4", "#f6efe2", "#b0a080"] },
    { id: "charcoal", name: "Charcoal", colours: ["#3a363c", "#4e4a52", "#1e1c20"] },
    { id: "black", name: "Black", colours: ["#242026", "#38323c", "#0c0a0e"] }
];


/*
    A piece's look is saved on it as decoration_type: its kind
    ("ornament" or "frame", or "tint:<fabric>" for a recovered
    piece), then " flip" when it's turned to face the other way.
*/

function typeParts(piece) {
    return String(piece.decoration_type || "ornament").split(" ").filter(Boolean);
}

function isFlipped(piece) {
    return typeParts(piece).includes("flip");
}

function withLook(piece, { tint, flip } = {}) {

    const parts =
        typeParts(piece);

    const base =
        parts.find((part) => !part.startsWith("tint:") && part !== "flip") || "ornament";

    const fabric =
        tint === undefined ? parts.find((part) => part.startsWith("tint:")) : tint ? `tint:${tint}` : null;

    const flipped =
        flip === undefined ? parts.includes("flip") : flip;

    return [fabric || base, flipped ? "flip" : null].filter(Boolean).join(" ");

}

function fabricFor(piece) {

    const id =
        typeParts(piece).find((part) => part.startsWith("tint:"))?.slice(5) || null;

    return FABRICS.find((fabric) => fabric.id === id) || null;

}


function fabricStyle(piece) {

    const fabric =
        fabricFor(piece);

    return fabric
        ? `; --up: ${fabric.colours[0]}; --up-light: ${fabric.colours[1]}; --up-shade: ${fabric.colours[2]}`
        : "";

}


const LIMIT = 80;

// Bookcase pieces are placed in pixels down from the top of
// the bookcase: position_y is a percentage of this height.
// The bookcase is always drawn 760 wide and scaled to fit
// (fit-room.js), so a piece stays on the same spot on every
// screen.
const SHELF_SPAN = 1600;


// How much the bookcase is scaled down on this screen.
function caseZoom() {

    return Number.parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue("--case-zoom")
    ) || 1;

}


// On top of the bookcase, pieces are measured up from its top
// edge (0) to TOP_SPAN pixels above it (100).
const TOP_SPAN = 400;

/*
    How far a piece's height can go. The wall is measured up
    from the floor across 820px, so a piece above that (on a
    tall screen, up to the ceiling) is below 0; a piece above
    the bookcase is measured up from its top across TOP_SPAN,
    so one higher than that is past 100. Until the database
    takes those heights (sql/wall.sql), they stop at 0 and 100.
*/
let wholeWall = true;

function heightRange(area) {

    if (!wholeWall || area === "shelf") {
        return [0, 100];
    }

    // Past 100 is out across a deep floor (the room view).
    return area === "bookcase_top" ? [0, 400] : [-300, 200];

}

// The database doesn't have shelf_id and shelf_row yet
// (sql/shelf-pieces.sql).
function isAnchorRefused(error) {
    return /shelf_(id|row)/.test(`${error?.message || ""} ${error?.details || ""}`);
}

// Measured from the top of the bookcase again, the old way.
function unanchor(piece) {

    if (anchoredOnShelf(piece)) {
        piece.position_y = Number(((shelfTop(piece) / SHELF_SPAN) * 100).toFixed(2));
    }

    delete piece.shelf_id;
    delete piece.shelf_row;

}

// What a piece remembers about its shelf, for saving.
function anchorValues(piece) {

    if (!shelfAnchors) {
        return {};
    }

    return anchoredOnShelf(piece)
        ? { shelf_id: piece.shelf_id || null, shelf_row: piece.shelf_row }
        : { shelf_id: null, shelf_row: null };

}

// The database hasn't taken the new heights yet (sql/wall.sql).
function isHeightRefused(error) {
    return error?.code === "23514" && /position_y/.test(error.message || "");
}

function topFor(piece) {

    if (piece.room_area === "bookcase_top") {
        return `${(-piece.position_y * TOP_SPAN) / 100}px`;
    }

    if (piece.room_area === "shelf") {
        return `${shelfTop(piece)}px`;
    }

    // Out on a deep floor: past 100 is a share of the floor's
    // extra depth, so with a shallow floor it stays at the back.
    return piece.position_y > 100
        ? `calc(100% + ${(piece.position_y - 100) / 100} * var(--floor-lift, 0px))`
        : `${piece.position_y}%`;

}

// room_area in the database → the part of the room it hangs on.
// "floor" is the whole room: the wall from one side to the other
// and the floor in front of it (css/decorations.css), where pieces
// go now the bookcase stands free. "wall" is the wall side only,
// where pieces placed before were measured; they stay where they
// are until they're moved, and then join the whole room.
const AREAS = {
    bookcase_top: ".bookcase",
    shelf: ".bookcase",
    wall: ".journal-zone",
    floor: ".journal-zone"
};

// Where a dragged or new piece can land, nearest first.
const LANDINGS = ["bookcase_top", "shelf", "floor"];

// Pieces measured from the floor up (the wall side or whole room).
const onWall = (area) => area === "wall" || area === "floor";

// The bookcase stands free in the room on a computer (not on a
// phone, where it stands beside the room at full size).
const freeCase = () => !document.documentElement.classList.contains("room-compact");

let room = null;
let theme = "original";
let pieces = [];
let arranging = false;
let selectedId = null;
// A piece the room came with (the armchair, the chandelier…),
// picked out to be removed.
let selectedBuiltIn = null;
let bar = null;
let loadToken = 0;

/*
    What the panel shows: the room's own choices (wallpaper,
    floor, window…) or the pieces to place, which kind and
    style of piece, and which room section is open. Kept on
    this device, so the panel opens where it was left.
*/
const PANEL_KEY = "novellow-decorate-panel";

let panelMode = "pieces";
let pieceKind = "furniture";
let pieceStyle = "";
let pieceHoliday = "";
let roomOpen = "collection";

try {
    const kept = JSON.parse(localStorage.getItem(PANEL_KEY) || "{}") || {};
    if (["room", "pieces"].includes(kept.mode)) panelMode = kept.mode;
    if (PIECE_KINDS.some((kind) => kind.id === kept.kind)) pieceKind = kept.kind;
    if (PIECE_STYLES.some((style) => style.id === kept.style)) pieceStyle = kept.style;
    if ([...PIECE_HOLIDAYS, ...PIECE_COLLECTIONS].some((group) => group.id === kept.holiday)) pieceHoliday = kept.holiday;
}
catch {
    // Private browsing: the panel opens on its defaults.
}

function keepPanel() {
    try {
        localStorage.setItem(PANEL_KEY, JSON.stringify({ mode: panelMode, kind: pieceKind, style: pieceStyle, holiday: pieceHoliday }));
    }
    catch {
        // Not remembered this time.
    }
}

// The room's own choices, in the order of the panel's sections.
const ROOM_SECTIONS = [
    { id: "collection", name: "Whole collection", parts: ["collection"] },
    { id: "wallpaper", name: "Wallpaper", parts: ["wallpaper"] },
    { id: "floor", name: "Floor and rug", parts: ["floor", "rug"] },
    { id: "window", name: "Window and curtains", parts: ["window"] },
    { id: "outside", name: "View and weather", parts: ["outside"] },
    { id: "ceiling", name: "Ceiling", parts: ["ceiling"] },
    { id: "light", name: "Light", parts: ["light"] },
    { id: "bookcase", name: "Bookcase", parts: ["bookcase"] },
    { id: "built-in", name: "Built into the room", parts: ["built-in"] }
];

// The tray: which side it sits on (computers) and whether it
// is folded down (phones).
const SIDE_KEY = "novellow-arrange-side";
let trayFolded = false;
let skipNextClick = false;
let trayObserver = null;


function onPhone() {
    // The tray is a strip along the bottom (css/decorations.css).
    return window.matchMedia("(max-width: 820px) and (orientation: portrait)").matches;
}


function traySide() {

    try {

        const saved =
            localStorage.getItem(SIDE_KEY);

        if (saved === "left" || saved === "right") {
            return saved;
        }

    }

    catch {
        // Private windows can refuse storage; use the default.
    }

    // With the sidebar folded to a rail, the bookcase starts
    // near the left edge, so the tray waits on the right.
    return document.body.classList.contains("sidebar-collapsed") ? "right" : "left";

}


function setTraySide(side) {

    try {
        localStorage.setItem(SIDE_KEY, side);
    }

    catch {
        // Not remembered, but it still moves.
    }

}


function assetFor(id) {
    return DECOR_ASSETS.find((asset) => asset.id === id);
}


// A piece's picture: hand-painted pieces are images, the rest
// are drawings in the sprite.
function artMarkup(asset, { live = false } = {}) {

    if (!asset.src) {
        return `<svg viewBox="${asset.box}" aria-hidden="true"><use href="#${asset.id}"></use></svg>`;
    }

    const picture =
        `<img class="decor-picture" src="${asset.src}?v=__VERSION__" width="${asset.size[0]}" height="${asset.size[1]}" alt="" draggable="false" loading="lazy">`;

    if (!live) {
        return picture;
    }

    // In the room, painted pieces get their light and movement
    // (js/room/painted-fx.js). --art is read by css/painted-fx.css,
    // so its path starts from css/.
    const fx =
        paintedFx(asset.src);

    return `<span class="decor-art ${fx.motion}" style="--art: url('../${asset.src}?v=__VERSION__')">${picture}<span class="decor-fx">${fx.layers}</span></span>`;

}




function layerFor(area) {

    const zone =
        room.querySelector(AREAS[area] || AREAS.wall);

    let layer =
        zone?.querySelector(`:scope > .decor-layer[data-area="${area in AREAS ? area : "wall"}"]`);

    if (zone && !layer) {

        zone.insertAdjacentHTML("beforeend", `<div class="decor-layer" data-area="${area in AREAS ? area : "wall"}"></div>`);

        layer = zone.lastElementChild;

    }

    return layer;

}


// How far down the bookcase its shelves begin (below the crown).
function crownHeight() {
    return room?.querySelector(".bookcase-body")?.offsetTop || 0;
}


/*
    A piece on the shelves remembers which shelf it's on and
    which of that shelf's rows (shelf_id, shelf_row), and its
    height (position_y) is measured from the top of that row.
    Books come and go, and a narrower bookcase wraps them into
    more rows, so shelves move up and down; the piece moves with
    its shelf instead of staying at a fixed distance from the
    top of the bookcase. A piece saved before this (shelf_row
    empty) is still measured from the top of the bookcase, until
    it's moved.

    Until the database has these columns (sql/shelf-pieces.sql),
    pieces are saved the old way.
*/
let shelfAnchors = true;

// A piece's height on its row: a little above the row's top (a
// tall piece leaning up) to well below it.
const ROW_RANGE = [-40, 100];

const anchoredOnShelf = (piece) =>
    piece.room_area === "shelf" && piece.shelf_row !== null && piece.shelf_row !== undefined;

// The row of books level with a point on the screen.
function shelfRowAt(y) {

    const rows =
        [...(room?.querySelectorAll(".bookcase-body .shelf-unit[data-shelf-id] > .shelf-row") || [])]
            .map((row) => ({ row, box: row.getBoundingClientRect() }));

    if (!rows.length) {
        return null;
    }

    const found =
        rows.find(({ box }) => y >= box.top && y < box.bottom)
        || rows.reduce((best, item) => (Math.abs((item.box.top + item.box.bottom) / 2 - y) < Math.abs((best.box.top + best.box.bottom) / 2 - y) ? item : best));

    const unit =
        found.row.closest(".shelf-unit");

    return {
        shelfId: unit.dataset.shelfId,
        row: [...unit.querySelectorAll(":scope > .shelf-row")].indexOf(found.row),
        top: found.box.top
    };

}

// Where a shelf's row starts, in the shelf layer's pixels (from
// the top of the bookcase, before the shelves slide). A shelf
// that's gone puts its pieces on the first shelf; a row that's
// gone (a wider bookcase needs fewer) puts them on its last row.
function rowTop(shelfId, rowIndex) {

    const body =
        room?.querySelector(".bookcase-body");

    const units =
        [...(body?.querySelectorAll(".shelf-unit[data-shelf-id]") || [])];

    if (!units.length) {
        return null;
    }

    const unit =
        units.find((item) => item.dataset.shelfId === shelfId) || units[0];

    const rows =
        unit.querySelectorAll(":scope > .shelf-row");

    const row =
        rows[Math.min(Math.max(0, Number(rowIndex) || 0), rows.length - 1)];

    return body.offsetTop + unit.offsetTop + (row ? row.offsetTop : 0);

}

// A piece's height in the shelf layer, in pixels.
function shelfTop(piece) {

    const base =
        anchoredOnShelf(piece) ? rowTop(piece.shelf_id, piece.shelf_row) : 0;

    return (base ?? 0) + (piece.position_y * SHELF_SPAN) / 100;

}

// The shelves were drawn again (books added or moved, or the
// bookcase changed width): put their pieces back on their rows.
function followRows() {

    if (!room) {
        return;
    }

    const crown =
        crownHeight();

    const misplaced =
        pieces.some((piece) => {

            if (!anchoredOnShelf(piece)) {
                return false;
            }

            const element =
                room.querySelector(`[data-decor-id="${piece.id}"]`);

            const onCrown =
                Boolean(element?.closest(".decor-layer[data-area=crown]"));

            return !element || onCrown !== (shelfTop(piece) < crown);

        });

    // A piece that has to change layer: draw them all again.
    if (misplaced) {
        draw();
        return;
    }

    pieces.forEach((piece) => {

        if (anchoredOnShelf(piece)) {

            const element =
                room.querySelector(`[data-decor-id="${piece.id}"]`);

            if (element) {
                element.style.top = topFor(piece);
            }

        }

    });

    followShelves();

}

// The pieces up on the crown, which stay put while the shelves
// slide (measured from the top of the bookcase, like the rest).
function crownLayer() {

    const bookcase =
        room?.querySelector(".bookcase");

    if (!bookcase) {
        return null;
    }

    let layer =
        bookcase.querySelector(":scope > .decor-layer[data-area=crown]");

    if (!layer) {
        bookcase.insertAdjacentHTML("beforeend", `<div class="decor-layer" data-area="crown"></div>`);
        layer = bookcase.lastElementChild;
    }

    return layer;

}

// The shelves' pieces slide with the shelves, and are hidden
// where the shelves go under the crown or into the base.
function followShelves() {

    const body =
        room?.querySelector(".bookcase-body");

    const layer =
        room?.querySelector(".bookcase > .decor-layer[data-area=shelf]");

    if (!body || !layer) {
        return;
    }

    const scrolled =
        body.scrollTop;

    const sliding =
        body.scrollHeight > body.clientHeight + 1;

    layer.style.transform = scrolled ? `translateY(${-scrolled}px)` : "";

    if (!sliding) {
        layer.style.clipPath = "";
        return;
    }

    const top =
        body.offsetTop + scrolled;

    const bottom =
        body.offsetTop + scrolled + body.clientHeight;

    // The layer has no height, so its clip is measured from its
    // top: above the shelves (if scrolled) and below them.
    layer.style.clipPath = `inset(${scrolled ? top : -2000}px -400px ${-bottom}px -400px)`;

}

/* =========================================================
   DRAWING
========================================================= */

function pieceMarkup(piece) {

    const asset =
        assetFor(piece.asset_id);

    if (!asset) {
        return "";
    }

    return html`
        <div
            class="placed-decor ${piece.id === selectedId ? "is-selected" : ""} ${asset.plain ? "placed-decor--plain" : ""} ${asset.floor ? "placed-decor--floor" : ""}"
            data-decor-id="${piece.id}"
            style="left: ${piece.position_x}%; top: ${topFor(piece)}; width: ${asset.width}px; z-index: ${piece.z_index}; --scale: ${piece.scale}; --rotation: ${piece.rotation}deg${isFlipped(piece) ? "; --flip: -1" : ""}${fabricStyle(piece)}"
            ${arranging ? html`tabindex="0" role="button" aria-label="${asset.name}. Drag to move, or use the arrow keys."` : html`aria-hidden="true"`}
        >
            ${raw(artMarkup(asset, { live: true }))}
        </div>
    `;

}


function draw() {

    if (!room) {
        return;
    }

    Object.keys(AREAS).forEach((area) => {

        const layer =
            layerFor(area);

        if (!layer) {
            return;
        }

        let list =
            pieces.filter((piece) => piece.room_area === area);

        // The shelves slide inside the bookcase, and their pieces
        // with them; a piece up on the crown stays with the crown.
        if (area === "shelf") {

            const crown =
                crownHeight();

            const onCrown =
                list.filter((piece) => shelfTop(piece) < crown);

            const still =
                crownLayer();

            if (still) {
                render(still, onCrown.map(pieceMarkup));
                list = list.filter((piece) => !onCrown.includes(piece));
            }

        }

        render(layer, list.map(pieceMarkup));

    });

    followShelves();

    room.classList.toggle("is-arranging", arranging);

    drawBar();

}


function drawBar() {

    drawBarNow();

    drawEditor();

}


function drawBarNow() {

    if (!arranging) {

        trayObserver?.disconnect();
        trayObserver = null;

        bar?.remove();
        bar = null;

        document.documentElement.style.removeProperty("--arrange-tray");

        return;

    }

    if (!bar) {

        document.body.insertAdjacentHTML("beforeend", `<section class="arrange-bar paper" aria-label="Edit the room"></section>`);

        bar = document.body.lastElementChild;

        bar.addEventListener("click", onBarClick);
        bar.addEventListener("pointerdown", onPalettePointerDown);
        bar.addEventListener("input", onCaseSize);
        bar.addEventListener("change", onCaseSize);
        bar.addEventListener("input", onPaletteSearch);

        // Leave room under the page for the tray on a phone.
        trayObserver = new ResizeObserver(() => {
            document.documentElement.style.setProperty("--arrange-tray", `${bar ? bar.offsetHeight : 0}px`);
        });

        trayObserver.observe(bar);

    }

    bar.dataset.side = traySide();
    bar.dataset.folded = String(trayFolded);
    bar.dataset.mode = panelMode;

    const sideLabel =
        bar.dataset.side === "left" ? "Move this panel to the right" : "Move this panel to the left";

    render(bar, html`

        <div class="arrange-bar__head">
            <button class="icon-button arrange-bar__undo" type="button" data-history="undo" aria-label="Undo" title="Undo (Ctrl+Z)" ${history.done.length ? "" : html`disabled`}><span aria-hidden="true">↶</span></button>
            <button class="icon-button arrange-bar__redo" type="button" data-history="redo" aria-label="Redo" title="Redo (Ctrl+Shift+Z)" ${history.undone.length ? "" : html`disabled`}><span aria-hidden="true">↷</span></button>
            <span class="arrange-bar__spacer"></span>
            <button class="icon-button arrange-bar__picture" type="button" data-arrange="picture" aria-label="Take a picture of your room" title="Take a picture of your room">
                ${art("ui-camera")}
            </button>
            <button class="icon-button arrange-bar__side" type="button" data-arrange="side" aria-label="${sideLabel}" title="${sideLabel}">
                <span aria-hidden="true">⇆</span>
            </button>
            <button class="icon-button arrange-bar__fold" type="button" data-arrange="fold" aria-expanded="${String(!trayFolded)}" aria-label="${trayFolded ? "Show the panel" : "Hide the panel"}" title="${trayFolded ? "Show the panel" : "Hide the panel"}">
                ${art("ui-chevron-down")}
            </button>
            <button class="button button--primary button--small" type="button" data-arrange="done">Done</button>
        </div>

        <div class="arrange-bar__modes" role="tablist" aria-label="Decorate">
            <button class="arrange-bar__mode ${panelMode === "room" ? "is-current" : ""}" type="button" role="tab" aria-selected="${String(panelMode === "room")}" data-panel-mode="room">The room</button>
            <button class="arrange-bar__mode ${panelMode === "pieces" ? "is-current" : ""}" type="button" role="tab" aria-selected="${String(panelMode === "pieces")}" data-panel-mode="pieces">Pieces</button>
        </div>

        <div class="arrange-bar__palette-holder">${panelMode === "room" ? roomMarkup() : piecesMarkup()}</div>

    `);

}


/*
    The room's own choices: one section open at a time, each
    heading saying what's chosen now.
*/

function roomMarkup() {

    return html`<div class="room-sections">
        ${ROOM_SECTIONS.map((section) => {

            const now =
                roomSummary(section.id);

            // Rooms with nothing built in skip that section.
            if (section.id === "built-in" && !now) {
                return "";
            }

            const open =
                roomOpen === section.id;

            return html`
                <section class="room-section ${open ? "is-open" : ""}">
                    <button class="room-section__head" type="button" data-room-section="${section.id}" aria-expanded="${String(open)}">
                        <span class="room-section__name">${section.name}</span>
                        <span class="room-section__now">${now}</span>
                        ${art("ui-chevron-down")}
                    </button>
                    ${open ? html`
                        <div class="room-section__body">
                            ${section.parts.map((part) => html`<div class="arrange-bar__room">${roomSectionMarkup(part)}</div>`)}
                        </div>
                    ` : ""}
                </section>
            `;

        })}
        <p class="arrange-bar__hint">Drag the window or the rug in the room to move them.</p>
    </div>`;

}


/*
    The pieces: what kind of thing, in what style, and a search
    across them all.
*/

function piecesMarkup() {

    const searching =
        Boolean(paletteQuery.trim());

    return html`
        <label class="arrange-bar__search">
            <span class="visually-hidden">Find a piece</span>
            <input type="search" placeholder="Find a piece…" value="${paletteQuery}" data-palette-search autocomplete="off" enterkeyhint="search">
        </label>

        <div class="piece-filters ${searching ? "is-searching" : ""}">

            <div class="piece-kinds" role="tablist" aria-label="Kinds of pieces">
                ${PIECE_KINDS.map((kind) => html`
                    <button class="piece-kind ${kind.id === pieceKind ? "is-current" : ""}" type="button" role="tab" aria-selected="${String(kind.id === pieceKind)}" data-piece-kind="${kind.id}">
                        ${raw(artMarkup(assetFor(kind.icon)))}
                        <span>${kind.name}</span>
                    </button>
                `)}
            </div>

            ${pieceKind === "collections" ? html`
                <div class="piece-styles piece-styles--holidays" role="group" aria-label="Collection">
                    <button class="piece-style ${pieceHoliday ? "" : "is-current"}" type="button" aria-pressed="${String(!pieceHoliday)}" data-piece-holiday="">Every collection</button>
                    ${PIECE_COLLECTIONS.map((group) => html`
                        <button class="piece-style ${group.id === pieceHoliday ? "is-current" : ""}" type="button" aria-pressed="${String(group.id === pieceHoliday)}" data-piece-holiday="${group.id}">${group.name}</button>
                    `)}
                </div>
                <p class="arrange-bar__hint">Each collection's wallpaper, ceiling, window and bookcase are in The room → Whole collection.</p>
            ` : html`
            <div class="piece-styles" role="group" aria-label="Style">
                <button class="piece-style ${pieceStyle ? "" : "is-current"}" type="button" aria-pressed="${String(!pieceStyle)}" data-piece-style="">All styles</button>
                ${PIECE_STYLES.map((style) => html`
                    <button class="piece-style ${style.id === pieceStyle ? "is-current" : ""}" type="button" aria-pressed="${String(style.id === pieceStyle)}" data-piece-style="${style.id}">${style.name}</button>
                `)}
            </div>

            ${pieceStyle === "holiday" || pieceStyle === "collection" ? html`
                <div class="piece-styles piece-styles--holidays" role="group" aria-label="${pieceStyle === "holiday" ? "Holiday" : "Collection"}">
                    <button class="piece-style ${pieceHoliday ? "" : "is-current"}" type="button" aria-pressed="${String(!pieceHoliday)}" data-piece-holiday="">${pieceStyle === "holiday" ? "Every holiday" : "Every collection"}</button>
                    ${(pieceStyle === "holiday" ? PIECE_HOLIDAYS : PIECE_COLLECTIONS).map((group) => html`
                        <button class="piece-style ${group.id === pieceHoliday ? "is-current" : ""}" type="button" aria-pressed="${String(group.id === pieceHoliday)}" data-piece-holiday="${group.id}">${group.name}</button>
                    `)}
                </div>
            ` : ""}
            `}

        </div>

        <div class="arrange-bar__palette-list">${listMarkup()}</div>
    `;

}


// Heading for a group of pieces in the list.
function groupHeading(group) {
    return { rugs: "Rugs to place", cozy: "Cozy", autumn: "Autumn" }[group.id] || group.name;
}

// What's typed in the panel's search box.
let paletteQuery = "";

function assetButton(asset) {
    return html`
        <li>
            <button class="arrange-bar__asset ${asset.dark ? "arrange-bar__asset--dark" : ""} ${asset.plain ? "arrange-bar__asset--plain" : ""}" type="button" data-add-decor="${asset.id}" title="${asset.name}" aria-label="Add ${asset.name}">
                ${raw(artMarkup(asset))}
                <span class="arrange-bar__label" aria-hidden="true">${asset.name}</span>
            </button>
        </li>
    `;
}

// Words that find a piece besides its name: its group and tab.
function searchText(asset) {
    const group = DECOR_GROUPS.find((item) => item.id === asset.group);
    const entry = catalogueEntry(asset);
    const kind = PIECE_KINDS.find((item) => item.id === entry.kind);
    const style = PIECE_STYLES.find((item) => item.id === entry.style);
    return `${asset.name} ${group?.name || ""} ${kind?.name || ""} ${style?.name || ""}`.toLowerCase();
}

function listMarkup() {

    const query =
        paletteQuery.trim().toLowerCase();

    const shown =
        (asset) => asset.group !== "retired";

    // Searching looks through every piece, whatever's chosen.
    if (query) {

        const words =
            query.split(/\s+/);

        const found =
            DECOR_ASSETS.filter((asset) => shown(asset) && words.every((word) => searchText(asset).includes(word)));

        return html`<div class="arrange-bar__palette" aria-label="Pieces found">
            <p class="arrange-bar__group">${found.length ? `${found.length} found` : "Nothing found"}</p>
            <ul class="arrange-bar__assets">${found.slice(0, 120).map(assetButton)}</ul>
        </div>`;

    }

    const fits = (asset) => {
        const entry = catalogueEntry(asset);
        if (pieceKind === "collections") {
            return Boolean(entry.collection) && (!pieceHoliday || entry.collection === pieceHoliday);
        }

        return entry.kind === pieceKind
            && (!pieceStyle || entry.style === pieceStyle)
            && (!pieceHoliday || entry.sub === pieceHoliday);
    };

    const list =
        DECOR_ASSETS.filter((asset) => shown(asset) && fits(asset));

    const kind =
        PIECE_KINDS.find((item) => item.id === pieceKind);

    if (!list.length) {
        const which =
            [...PIECE_HOLIDAYS, ...PIECE_COLLECTIONS].find((item) => item.id === pieceHoliday)?.name
            || (PIECE_STYLES.find((item) => item.id === pieceStyle)?.name || "").toLowerCase();

        return html`<p class="arrange-bar__empty">No ${which} ${kind.name.toLowerCase()} yet. Try another style.</p>`;
    }

    const recent =
        recentlyUsed().map(assetFor).filter((asset) => asset && shown(asset) && fits(asset));

    return html`<div class="arrange-bar__palette" aria-label="${kind.name}">
        <p class="arrange-bar__hint">Tap a piece to add it, or drag it into the room.</p>
        ${recent.length > 1 ? html`
            <p class="arrange-bar__group">Recently used</p>
            <ul class="arrange-bar__assets">${recent.map(assetButton)}</ul>
        ` : ""}
        ${DECOR_GROUPS.map((group) => {
            const inGroup = list.filter((asset) => asset.group === group.id);
            return inGroup.length ? html`
                <p class="arrange-bar__group">${groupHeading(group)}</p>
                <ul class="arrange-bar__assets">${inGroup.map(assetButton)}</ul>
            ` : "";
        })}
    </div>`;

}

// Decorate → The room → Bookcase → Size: it grows as the slider
// moves and is saved when let go.
function onCaseSize(event) {

    const slider =
        event.target.closest?.("[data-case-size]");

    if (slider) {
        sizeCase(slider.value, { persist: event.type === "change" });
    }

    const windowSlider =
        event.target.closest?.("[data-window-size]");

    if (windowSlider) {
        sizeWindow(windowSlider.value, { persist: event.type === "change" });
    }

}


function onPaletteSearch(event) {

    const input =
        event.target.closest?.("[data-palette-search]");

    if (!input || !bar) {
        return;
    }

    paletteQuery = input.value;

    const list =
        bar.querySelector(".arrange-bar__palette-list");

    if (list) {
        render(list, listMarkup());
    }

    bar.querySelector(".piece-filters")?.classList.toggle("is-searching", Boolean(paletteQuery.trim()));

}


// The last pieces this reader added (kept on this device only).
const RECENT = "novellow-recent-decor";

function recentlyUsed() {
    try {
        return JSON.parse(localStorage.getItem(RECENT) || "[]").slice(0, 8);
    }
    catch {
        return [];
    }
}

function rememberUsed(assetId) {
    try {
        const list = [assetId, ...recentlyUsed().filter((id) => id !== assetId)].slice(0, 8);
        localStorage.setItem(RECENT, JSON.stringify(list));
    }
    catch {
        // Storage may be switched off; the row just stays empty.
    }
}


// Small steps for the arrow buttons in the piece editor.
const NUDGES = {
    "nudge-left": [-1, 0],
    "nudge-right": [1, 0],
    "nudge-up": [0, -1],
    "nudge-down": [0, 1]
};

function nudge(piece, [dx, dy]) {

    // On top of the bookcase, heights count upward.
    const up =
        piece.room_area === "bookcase_top" ? -1 : 1;

    return {
        position_x: piece.position_x + dx * 0.6,
        position_y: piece.position_y + dy * 0.6 * up
    };

}


// A copy of a piece, just beside it.
async function duplicate(piece) {

    if (pieces.length >= LIMIT) {
        toast(`The room can hold ${LIMIT} decorations. Remove one to add another.`);
        return;
    }

    try {

        const saved =
            await createRow("decorations", {
                asset_id: piece.asset_id,
                decoration_type: piece.decoration_type,
                room_area: piece.room_area,
                theme,
                position_x: clamp(piece.position_x + 4, 0, 100),
                position_y: piece.position_y,
                scale: piece.scale,
                rotation: piece.rotation,
                z_index: Math.min(50, piece.z_index + 1),
                ...anchorValues(piece)
            });

        const copy = {
            ...saved,
            position_x: Number(saved.position_x),
            position_y: Number(saved.position_y),
            scale: Number(saved.scale),
            rotation: Number(saved.rotation)
        };

        pieces.push(copy);

        remember({ kind: "add", row: { ...copy } });

        draw();
        select(copy.id);

    }

    catch (error) {
        toastError(error, "That piece couldn't be copied. Please try again.");
    }

}



/*
    The editor that pops up beside a piece tapped in the room:
    its size, tilt, layer, fabric colour, or taking it away.
*/

let editor = null;
let editorFrame = 0;

// The chosen piece's hand controls (size, turn, nudge), folded
// away under More unless they were wanted.
let toolsMore = false;

// The handles drawn on the chosen piece: one to resize, one to turn.
let handles = null;

function drawHandles(piece) {

    if (!piece || !arranging) {
        handles?.remove();
        handles = null;
        return;
    }

    if (!handles) {
        document.body.insertAdjacentHTML("beforeend", `
            <div class="piece-handles" aria-hidden="true">
                <span class="piece-handles__stem"></span>
                <button class="piece-handle piece-handle--turn" type="button" tabindex="-1" data-handle="turn" title="Drag to turn"></button>
                <button class="piece-handle piece-handle--size" type="button" tabindex="-1" data-handle="size" title="Drag to resize"></button>
            </div>
        `);
        handles = document.body.lastElementChild;
        handles.addEventListener("pointerdown", onHandleDown);
    }

}


// Puts the handles on the chosen piece's corner and crown,
// turned with it.
function placeHandles(target) {

    if (!handles) {
        return;
    }

    const piece =
        pieces.find((item) => item.id === selectedId);

    if (!target || !piece) {
        handles.hidden = true;
        return;
    }

    const box =
        target.getBoundingClientRect();

    const centre = {
        x: box.left + box.width / 2,
        y: box.top + box.height / 2
    };

    const halfWidth =
        target.offsetWidth * piece.scale / 2 + 6;

    const halfHeight =
        target.offsetHeight * piece.scale / 2 + 6;

    const turn =
        piece.rotation * Math.PI / 180;

    // Kept on the screen, even for a piece up by the ceiling.
    const at = (x, y) => ({
        x: clamp(centre.x + x * Math.cos(turn) - y * Math.sin(turn), 16, window.innerWidth - 16),
        y: clamp(centre.y + x * Math.sin(turn) + y * Math.cos(turn), 16, window.innerHeight - 16)
    });

    const corner =
        at(halfWidth, halfHeight);

    const crown =
        at(0, -halfHeight - 26);

    const top =
        at(0, -halfHeight);

    handles.hidden = false;

    handles.style.setProperty("--size-x", `${corner.x}px`);
    handles.style.setProperty("--size-y", `${corner.y}px`);
    handles.style.setProperty("--turn-x", `${crown.x}px`);
    handles.style.setProperty("--turn-y", `${crown.y}px`);
    handles.style.setProperty("--stem-x", `${top.x}px`);
    handles.style.setProperty("--stem-y", `${top.y}px`);
    handles.style.setProperty("--stem-turn", `${piece.rotation}deg`);

}


// Dragging a handle: resize from the middle, or turn about it.
function onHandleDown(event) {

    const handle =
        event.target.closest("[data-handle]");

    const piece =
        pieces.find((item) => item.id === selectedId);

    const element =
        piece && room.querySelector(`[data-decor-id="${piece.id}"]`);

    if (!handle || !piece || !element || event.button > 0) {
        return;
    }

    event.preventDefault();
    event.stopPropagation();

    const kind =
        handle.dataset.handle;

    const box =
        element.getBoundingClientRect();

    const centre = {
        x: box.left + box.width / 2,
        y: box.top + box.height / 2
    };

    const before =
        snapshot(piece);

    const start = {
        scale: piece.scale,
        rotation: piece.rotation,
        reach: Math.max(12, Math.hypot(event.clientX - centre.x, event.clientY - centre.y)),
        angle: Math.atan2(event.clientY - centre.y, event.clientX - centre.x) * 180 / Math.PI
    };

    try {
        handle.setPointerCapture(event.pointerId);
    }
    catch {
        // The pointer already lifted.
    }

    draggingPiece = true;
    document.documentElement.classList.add("is-dragging-piece", "is-adjusting-piece");
    element.classList.add("is-adjusting");

    const move = (moveEvent) => {

        if (moveEvent.pointerId !== event.pointerId) {
            return;
        }

        if (kind === "size") {
            const reach = Math.hypot(moveEvent.clientX - centre.x, moveEvent.clientY - centre.y);
            adjust(piece, { scale: start.scale * reach / start.reach });
            return;
        }

        let rotation =
            start.rotation + Math.atan2(moveEvent.clientY - centre.y, moveEvent.clientX - centre.x) * 180 / Math.PI - start.angle;

        rotation = ((rotation + 540) % 360) - 180;

        // Close to straight, it settles straight; with Shift, in steps.
        if (moveEvent.shiftKey) {
            rotation = Math.round(rotation / 15) * 15;
        }
        else if (Math.abs(rotation) < 4) {
            rotation = 0;
        }

        adjust(piece, { rotation });

    };

    const stop = (upEvent) => {

        if (upEvent.pointerId !== event.pointerId) {
            return;
        }

        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", stop);
        window.removeEventListener("pointercancel", stop);

        draggingPiece = false;
        document.documentElement.classList.remove("is-dragging-piece", "is-adjusting-piece");
        element.classList.remove("is-adjusting");

        const after =
            snapshot(piece);

        if (!same(before, after)) {
            remember({ kind: "change", id: piece.id, before, after });
        }

    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);

}

function drawEditor() {

    const selected =
        pieces.find((piece) => piece.id === selectedId);

    if (!arranging || (!selected && !selectedBuiltIn)) {
        editor?.remove();
        editor = null;
        drawHandles(null);
        cancelAnimationFrame(editorFrame);
        return;
    }

    if (!editor) {
        document.body.insertAdjacentHTML("beforeend", `<section class="piece-editor paper" aria-label="Edit this piece"></section>`);
        editor = document.body.lastElementChild;
        editor.addEventListener("click", onBarClick);
    }

    const asset =
        selected ? assetFor(selected.asset_id) : null;

    render(editor, html`
        ${selectedBuiltIn ? html`
            <div class="arrange-bar__tools arrange-bar__tools--built-in">
                <button class="icon-button piece-editor__close" type="button" data-arrange="deselect" aria-label="Close">${art("ui-close")}</button>
                <span class="arrange-bar__selected">${selectedBuiltIn.name}</span>
                <p class="arrange-bar__built-in-note">This came with the room. Take it out to make space for your own pieces; you can put it back from The room → Built into the room.</p>
                <button class="button button--small arrange-bar__remove-built-in" type="button" data-arrange="remove-built-in">${art("ui-trash")} Take it out of the room</button>
            </div>
        ` : ""}

        ${selected ? html`<div class="piece-tools">
            <p class="piece-tools__name">${asset?.name || ""}</p>
            <div class="piece-tools__row" role="group" aria-label="This piece">
                ${isSnowGlobe(asset?.src) ? html`<button class="piece-tool" type="button" data-arrange="shake" title="Shake the snow globe"><b aria-hidden="true">❄</b><small>Shake</small></button>` : ""}
                <button class="piece-tool" type="button" data-arrange="flip" aria-pressed="${String(isFlipped(selected))}" title="Flip it to face the other way"><b aria-hidden="true">⇋</b><small>Flip</small></button>
                <button class="piece-tool" type="button" data-arrange="duplicate" title="Make a copy"><b aria-hidden="true">⧉</b><small>Copy</small></button>
                <button class="piece-tool" type="button" data-arrange="forward" title="Bring it in front of other pieces"><b aria-hidden="true">⤒</b><small>Front</small></button>
                <button class="piece-tool" type="button" data-arrange="back" title="Send it behind other pieces"><b aria-hidden="true">⤓</b><small>Back</small></button>
                <button class="piece-tool piece-tool--remove" type="button" data-arrange="remove" title="Remove it from the room">${art("ui-trash")}<small>Remove</small></button>
                <button class="piece-tool piece-tool--more" type="button" data-arrange="more" aria-expanded="${String(toolsMore)}" title="Size, turn and nudge by hand"><b aria-hidden="true">⋯</b><small>More</small></button>
            </div>
            ${toolsMore ? html`
                <div class="piece-tools__more">
                    <div class="piece-tools__row" role="group" aria-label="Size and turn">
                        <button class="piece-tool" type="button" data-arrange="smaller" aria-label="Smaller" title="Smaller"><b aria-hidden="true">−</b><small>Smaller</small></button>
                        <button class="piece-tool" type="button" data-arrange="bigger" aria-label="Bigger" title="Bigger"><b aria-hidden="true">+</b><small>Bigger</small></button>
                        <button class="piece-tool" type="button" data-arrange="tilt-left" aria-label="Turn left" title="Turn left"><b aria-hidden="true">↺</b><small>Turn</small></button>
                        <button class="piece-tool" type="button" data-arrange="tilt-right" aria-label="Turn right" title="Turn right"><b aria-hidden="true">↻</b><small>Turn</small></button>
                        <button class="piece-tool" type="button" data-arrange="straighten" aria-label="Straighten" title="Straighten"><b aria-hidden="true">⊥</b><small>Straight</small></button>
                    </div>
                    <div class="piece-tools__row piece-tools__row--nudge" role="group" aria-label="Move a little">
                        <button class="piece-tool" type="button" data-arrange="nudge-left" aria-label="Move left a little"><b aria-hidden="true">◀</b></button>
                        <button class="piece-tool" type="button" data-arrange="nudge-up" aria-label="Move up a little"><b aria-hidden="true">▲</b></button>
                        <button class="piece-tool" type="button" data-arrange="nudge-down" aria-label="Move down a little"><b aria-hidden="true">▼</b></button>
                        <button class="piece-tool" type="button" data-arrange="nudge-right" aria-label="Move right a little"><b aria-hidden="true">▶</b></button>
                    </div>
                </div>
            ` : ""}
            ${asset?.tint ? html`
                <div class="arrange-bar__fabrics" role="group" aria-label="Fabric colour">
                    <button class="arrange-bar__fabric arrange-bar__fabric--own ${fabricFor(selected) ? "" : "is-current"}" type="button" data-fabric="" title="Its own colours" aria-label="Its own colours"></button>
                    ${FABRICS.map((fabric) => html`
                        <button class="arrange-bar__fabric ${fabricFor(selected)?.id === fabric.id ? "is-current" : ""}" type="button" data-fabric="${fabric.id}" title="${fabric.name}" aria-label="${fabric.name}" style="background: linear-gradient(135deg, ${fabric.colours[1]} 0 35%, ${fabric.colours[0]} 35% 75%, ${fabric.colours[2]} 75%)"></button>
                    `)}
                </div>
            ` : ""}
            <p class="piece-tools__tip">Drag it to move it. Pull the corner handle to resize, the top one to turn.</p>
        </div>` : ""}

    `);

    drawHandles(selected);

    placeEditor();

}


// Keeps the editor beside its piece (above it, or below when
// there's no room), inside the screen.
function placeEditor() {

    cancelAnimationFrame(editorFrame);

    if (!editor) {
        return;
    }

    const target =
        selectedId
            ? room.querySelector(`[data-decor-id="${selectedId}"]`)
            : selectedBuiltIn ? room.querySelector(".is-built-in-selected") : null;

    // A short screen (a phone held sideways): a slim bar docked at
    // the top, or at the bottom when the piece is up high, beside
    // the panel, so the piece and the floor under it stay in view.
    const docked =
        window.innerHeight <= 540;

    editor.classList.toggle("piece-editor--docked", docked);

    if (target && docked) {

        const box =
            target.getBoundingClientRect();

        const panel =
            bar && bar.dataset.folded !== "true" ? bar.getBoundingClientRect() : null;

        const from =
            panel && panel.left < window.innerWidth / 2 ? panel.right + 8 : 8;

        const to =
            panel && panel.left >= window.innerWidth / 2 ? panel.left - 8 : window.innerWidth - 8;

        const width =
            Math.min(editor.offsetWidth, to - from);

        const high =
            box.top + box.height / 2 < window.innerHeight * 0.45;

        editor.style.maxWidth = `${Math.round(to - from)}px`;
        editor.style.left = `${Math.round(from + (to - from - width) / 2)}px`;
        editor.style.top = high ? `${Math.round(window.innerHeight - editor.offsetHeight - 8)}px` : "8px";

    }

    else if (target) {

        const box =
            target.getBoundingClientRect();

        const width =
            editor.offsetWidth;

        const height =
            editor.offsetHeight;

        const margin =
            10;

        let left =
            box.left + box.width / 2 - width / 2;

        // Below the piece, clear of its corner handle; above it
        // (clear of the turning handle) when there's no room below.
        let top =
            box.bottom + margin + 14;

        if (top + height > window.innerHeight - 8) {
            top = box.top - height - margin - 40;
        }

        left = clamp(left, 8, window.innerWidth - width - 8);
        top = clamp(top, 8, window.innerHeight - height - 8);

        editor.style.left = `${Math.round(left)}px`;
        editor.style.top = `${Math.round(top)}px`;

    }

    placeHandles(selectedId ? target : null);

    editorFrame = requestAnimationFrame(placeEditor);

}


/* =========================================================
   SAVING
========================================================= */

const pendingSaves =
    new Map();

function saveSoon(piece) {

    if (!pendingSaves.has(piece.id)) {

        pendingSaves.set(piece.id, debounce(async (latest) => {

            const values = () => ({
                decoration_type: latest.decoration_type,
                room_area: latest.room_area,
                position_x: latest.position_x,
                position_y: latest.position_y,
                scale: latest.scale,
                rotation: latest.rotation,
                z_index: latest.z_index,
                ...anchorValues(latest)
            });

            try {

                await updateRow("decorations", latest.id, values());

            }

            catch (error) {

                if (isAnchorRefused(error)) {

                    // Measured the old way for now (sql/shelf-pieces.sql).
                    shelfAnchors = false;
                    pieces.forEach(unanchor);
                    adjust(latest, {});

                    return;

                }

                if (!isHeightRefused(error)) {
                    toastError(error, "That decoration didn't save. Please try again.");
                    return;
                }

                // Save it as high as the database allows for now.
                wholeWall = false;
                adjust(latest, {});

                try {
                    await updateRow("decorations", latest.id, values());
                }

                catch (again) {
                    toastError(again, "That decoration didn't save. Please try again.");
                }

            }

        }, 500));

    }

    pendingSaves.get(piece.id)(piece);

}


/*
    The part of the screen the room shows through: the whole
    window, less the tray.
*/

function openView() {

    const view = {
        left: 0,
        top: 0,
        right: window.innerWidth,
        bottom: window.innerHeight
    };

    if (!bar) {
        return view;
    }

    const box =
        bar.getBoundingClientRect();

    if (onPhone()) {
        view.bottom = Math.max(view.top + 80, box.top);
    }

    else if (bar.dataset.side === "left") {
        view.left = box.right;
    }

    else {
        view.right = box.left;
    }

    return view;

}


/*
    Where a tapped piece goes: the middle of whichever part of
    the room (wall or bookcase) is in view, nudged a little so
    several in a row don't stack exactly.
*/

function spotInView() {

    const view =
        openView();

    const middleX =
        (view.left + view.right) / 2;

    const middleY =
        (view.top + view.bottom) / 2;

    const tries = [
        [middleX, middleY],
        [middleX, view.top + (view.bottom - view.top) * 0.3],
        [middleX, view.top + (view.bottom - view.top) * 0.7],
        [view.left + (view.right - view.left) * 0.25, middleY],
        [view.left + (view.right - view.left) * 0.75, middleY]
    ];

    const area =
        tries.map(([x, y]) => areaAt(x, y)).find((name) => name && name !== "bookcase_top")
        || ["floor", "shelf"].find((name) => layerShown(name));

    if (!area) {
        return null;
    }

    const box =
        area === "floor" ? areaBox("floor") : room.querySelector(AREAS[area]).getBoundingClientRect();

    const left = Math.max(box.left, view.left);
    const right = Math.min(box.right, view.right);
    const top = Math.max(box.top, view.top);
    const bottom = Math.min(box.bottom, view.bottom);

    const nudge =
        () => Math.round((Math.random() - 0.5) * 50);

    return {
        area,
        x: clamp((left + right) / 2 + nudge(), left + 20, right - 20),
        y: clamp((top + bottom) / 2 + nudge(), top + 20, bottom - 20)
    };

}


/*
    A point on screen as a place in one part of the room. A
    point outside that part (dragged past the bottom of the
    bookcase, say) is kept to its edge.
*/

/*
    The part of the screen each area takes pieces in. The top of
    the bookcase is the space just above it; the wall reaches
    right to the edge of the room, under a phone's rounded
    corners too.
*/
// A spot moved down onto the floor (for rugs): the floor's
// middle, or lower if it was dropped lower.
function onFloor(spot) {

    const floor =
        room.querySelector(".room-floorboards, .room-floor")?.getBoundingClientRect();

    if (!floor) {
        return spot;
    }

    const lowest =
        Math.min(window.innerHeight - 12, floor.bottom - 10);

    return { ...spot, area: "floor", y: clamp(spot.y, floor.top + Math.min(40, floor.height / 2), lowest) };

}

// How much deeper than usual the floor runs (the room view).
function floorLift() {
    const box = room.getBoundingClientRect();
    const zone = room.querySelector(".journal-zone")?.getBoundingClientRect();
    return zone ? Math.max(0, box.bottom - zone.bottom) : 0;
}

function areaBox(area) {

    const zone =
        room.querySelector(AREAS[area]).getBoundingClientRect();

    if (area === "bookcase_top") {
        // Standing free, just above it (higher is the wall above
        // it); beside the room, up to the ceiling (at least TOP_SPAN).
        const ceiling = room.getBoundingClientRect().top;
        const reach = freeCase() ? 130 * caseZoom() : Math.max(TOP_SPAN * caseZoom(), wholeWall ? zone.top - ceiling : 0);
        return { left: zone.left, right: zone.right, top: zone.top - reach, bottom: zone.top + 6 * caseZoom() };
    }

    if (area === "wall") {
        return { left: zone.left, right: room.getBoundingClientRect().right, top: zone.top, bottom: zone.bottom + floorLift() };
    }

    if (area === "floor") {
        const whole = roomBox();
        const edge = room.getBoundingClientRect();
        return { left: Math.max(edge.left, whole.left), right: edge.right, top: zone.top, bottom: zone.bottom + floorLift() };
    }

    return { left: zone.left, right: zone.right, top: zone.top, bottom: zone.bottom };

}


function positionIn(area, pointX, pointY) {

    const zone =
        areaBox(area);

    const x =
        clamp(pointX, zone.left + 8, zone.right - 8);

    const y =
        area === "bookcase_top"
            ? clamp(pointY, zone.top, zone.bottom)
            : clamp(pointY, zone.top + 8, zone.bottom - 28);

    let box =
        layerFor(area).getBoundingClientRect();

    let onCrown =
        false;

    // Over the crown, a piece stays with the crown however far the
    // shelves have slid, so it's measured from the bookcase's top.
    if (area === "shelf") {

        const still =
            crownLayer()?.getBoundingClientRect();

        if (still && y - still.top < crownHeight() * caseZoom()) {
            box = still;
            onCrown = true;
        }

    }

    if (area === "bookcase_top") {
        return {
            position_x: Number(clamp(((x - box.left) / box.width) * 100, 0, 100).toFixed(2)),
            position_y: Number(clamp(((box.top - y) / (TOP_SPAN * caseZoom())) * 100, ...heightRange(area)).toFixed(2))
        };
    }

    // On the bookcase, pixels on screen are scaled pixels.
    const height =
        area === "shelf" ? SHELF_SPAN * caseZoom() : box.height;

    // Below the wall, out on a deep floor.
    const lift =
        onWall(area) ? floorLift() : 0;

    if (lift > 0 && y > box.bottom) {
        return {
            position_x: Number(clamp(((x - box.left) / box.width) * 100, 0, 100).toFixed(2)),
            position_y: Number(clamp(100 + ((y - box.bottom) / lift) * 100, ...heightRange(area)).toFixed(2))
        };
    }

    // On the shelves (below the crown): which shelf and row, and
    // how far down that row.
    if (area === "shelf" && !onCrown && shelfAnchors) {

        const anchor =
            shelfRowAt(y);

        if (anchor) {
            return {
                position_x: Number(clamp(((x - box.left) / box.width) * 100, 0, 100).toFixed(2)),
                position_y: Number(clamp(((y - anchor.top) / height) * 100, ...ROW_RANGE).toFixed(2)),
                shelf_id: anchor.shelfId,
                shelf_row: anchor.row
            };
        }

    }

    return {
        position_x: Number(clamp(((x - box.left) / box.width) * 100, 0, 100).toFixed(2)),
        position_y: Number(clamp(((y - box.top) / height) * 100, ...heightRange(area)).toFixed(2)),
        ...(area === "shelf" && shelfAnchors ? { shelf_id: null, shelf_row: null } : {})
    };

}


async function addPiece(assetId, spot = spotInView()) {

    if (pieces.length >= LIMIT) {
        toast(`The room can hold ${LIMIT} decorations. Remove one to add another.`);
        return;
    }

    if (!spot) {
        toast("Scroll to the part of the room where it should go, then try again.");
        return;
    }

    // A rug lies on the floor, wherever it was dropped.
    if (assetFor(assetId)?.floor) {
        spot = onFloor(spot);
    }

    try {

        const row = () => ({
            asset_id: assetId,
            decoration_type: assetId.startsWith("frame-") ? "frame" : "ornament",
            room_area: spot.area,
            theme,
            ...positionIn(spot.area, spot.x, spot.y),
            scale: 1,
            rotation: 0,
            z_index: assetFor(assetId)?.floor ? 0 : Math.min(50, pieces.reduce((top, piece) => Math.max(top, piece.z_index), 0) + 1)
        });

        const saved =
            await createRow("decorations", row()).catch((error) => {
                if (isAnchorRefused(error)) {
                    // Measured the old way for now (sql/shelf-pieces.sql).
                    shelfAnchors = false;
                    return createRow("decorations", row());
                }
                if (!isHeightRefused(error)) throw error;
                // As high as the database allows for now (sql/wall.sql).
                wholeWall = false;
                return createRow("decorations", row());
            });

        pieces.push({
            ...saved,
            position_x: Number(saved.position_x),
            position_y: Number(saved.position_y),
            scale: Number(saved.scale),
            rotation: Number(saved.rotation)
        });

        remember({ kind: "add", row: { ...pieces[pieces.length - 1] } });
        rememberUsed(assetId);

        selectedId = saved.id;

        draw();

        const element =
            room.querySelector(`[data-decor-id="${saved.id}"]`);

        element?.focus({ preventScroll: true });

        element?.classList.add("is-new");

        settle(pieces[pieces.length - 1]);

    }

    catch (error) {
        toastError(error, "That decoration couldn't be added.");
    }

}


/* =========================================================
   UNDO AND REDO
   Each change to a piece is remembered while arranging: what
   it was before and after. Undo puts it back; redo does it
   again. Taking a piece out and undoing puts it back as a new
   row, so later steps follow it by its new id.
========================================================= */

const KEPT = ["room_area", "position_x", "position_y", "scale", "rotation", "z_index", "decoration_type", "shelf_id", "shelf_row"];

const history = { done: [], undone: [] };

// A removed piece that was put back has a new id.
const renamed = new Map();

const idNow = (id) => {
    while (renamed.has(id)) id = renamed.get(id);
    return id;
};

const pieceById = (id) =>
    pieces.find((item) => item.id === idNow(id));

function snapshot(piece) {
    return Object.fromEntries(KEPT.map((key) => [key, piece[key]]));
}

const same = (a, b) =>
    KEPT.every((key) => a[key] === b[key]);

let lastMark = null;

/*
    Remembers a change to a piece. Quick repeats of the same
    kind of change (tapping + four times, holding an arrow key)
    become one step.
*/
function remember(entry, mergeKey = null) {

    const now = Date.now();

    const top =
        history.done[history.done.length - 1];

    if (mergeKey && top && lastMark && lastMark.key === mergeKey && now - lastMark.at < 1200 && top.kind === "change" && idNow(top.id) === idNow(entry.id)) {
        top.after = entry.after;
    }

    else {
        history.done.push(entry);
        if (history.done.length > 80) history.done.shift();
    }

    lastMark = mergeKey ? { key: mergeKey, at: now } : null;

    history.undone.length = 0;

    drawHistory();

}

function changePiece(piece, change, mergeKey = null) {

    const before =
        snapshot(piece);

    adjust(piece, change);

    const after =
        snapshot(piece);

    if (!same(before, after)) {
        remember({ kind: "change", id: piece.id, before, after }, mergeKey);
    }

}

function applyState(id, state) {

    const piece =
        pieceById(id);

    if (!piece) {
        return;
    }

    Object.assign(piece, state);

    draw();
    select(piece.id);
    saveSoon(piece);

}

async function putBack(row) {

    const values = {
        asset_id: row.asset_id,
        decoration_type: row.decoration_type,
        room_area: row.room_area,
        theme: row.theme,
        position_x: row.position_x,
        position_y: row.position_y,
        scale: row.scale,
        rotation: row.rotation,
        z_index: row.z_index,
        ...anchorValues(row)
    };

    const saved =
        await createRow("decorations", values);

    const piece = {
        ...saved,
        position_x: Number(saved.position_x),
        position_y: Number(saved.position_y),
        scale: Number(saved.scale),
        rotation: Number(saved.rotation)
    };

    renamed.set(idNow(row.id), piece.id);

    pieces.push(piece);

    draw();
    select(piece.id);

    return piece;

}

let historyBusy = false;

async function step(direction) {

    const from =
        direction === "undo" ? history.done : history.undone;

    const to =
        direction === "undo" ? history.undone : history.done;

    const entry =
        from.pop();

    if (!entry || historyBusy) {
        if (entry) from.push(entry);
        return;
    }

    historyBusy = true;
    lastMark = null;

    try {

        if (entry.kind === "change") {
            applyState(entry.id, direction === "undo" ? entry.before : entry.after);
        }

        // Undoing an added piece takes it away; redoing puts it back.
        else if ((entry.kind === "add") === (direction === "undo")) {
            const piece = pieceById(entry.row.id);
            if (piece) {
                entry.row = { ...piece };
                await removePiece(piece, { remembered: false });
            }
        }

        else {
            await putBack(entry.row);
        }

        to.push(entry);

    }

    catch (error) {
        toastError(error, "That couldn't be undone. Please try again.");
    }

    finally {
        historyBusy = false;
        drawHistory();
    }

}

const undo = () => step("undo");
const redo = () => step("redo");

function forgetHistory() {
    history.done.length = 0;
    history.undone.length = 0;
    renamed.clear();
    lastMark = null;
    drawHistory();
}


// The Undo and Redo buttons, floating over the room while arranging.
// Undo and redo sit in the panel's header.
function drawHistory() {

    if (!bar) {
        return;
    }

    bar.querySelector("[data-history=undo]")?.toggleAttribute("disabled", !history.done.length);
    bar.querySelector("[data-history=redo]")?.toggleAttribute("disabled", !history.undone.length);

}


async function removePiece(piece, { remembered = true } = {}) {

    if (remembered) {
        remember({ kind: "remove", row: { ...piece } });
    }

    pieces = pieces.filter((item) => item.id !== piece.id);

    selectedId = null;

    draw();

    try {
        await deleteRow("decorations", piece.id);
    }

    catch (error) {
        toastError(error, "That decoration couldn't be removed.");
    }

}


function adjust(piece, change) {

    Object.assign(piece, change);

    piece.scale = Number(clamp(piece.scale, 0.25, 3).toFixed(2));
    piece.rotation = Number(clamp(piece.rotation, -180, 180).toFixed(1));
    piece.z_index = clamp(Math.round(piece.z_index), 0, 50);
    piece.position_x = Number(clamp(piece.position_x, 0, 100).toFixed(2));
    piece.position_y = Number(clamp(piece.position_y, ...(anchoredOnShelf(piece) ? ROW_RANGE : heightRange(piece.room_area))).toFixed(2));

    const element =
        room.querySelector(`[data-decor-id="${piece.id}"]`);

    if (element) {
        element.style.left = `${piece.position_x}%`;
        element.style.top = topFor(piece);
        element.style.zIndex = piece.z_index;
        element.style.setProperty("--scale", piece.scale);
        element.style.setProperty("--rotation", `${piece.rotation}deg`);
    }

    saveSoon(piece);

}


/*
    Letting go of a piece just above a shelf, the top of the
    bookcase, the window sill or the floor sets it down on it,
    rather than leaving it hovering. Pieces on top of the
    bookcase always rest on it. Rugs lie wherever they're put.
*/

const SETTLE_REACH = 26;

function settle(piece) {

    const asset =
        assetFor(piece.asset_id);

    const element =
        room.querySelector(`[data-decor-id="${piece.id}"]`);

    if (!asset || asset.floor || !element) {
        return;
    }

    const bottom =
        element.getBoundingClientRect().bottom;

    const tops = [];

    if (piece.room_area === "bookcase_top") {
        tops.push(room.querySelector(AREAS.bookcase_top).getBoundingClientRect().top + 3);
    }

    else if (piece.room_area === "shelf") {
        room.querySelectorAll(".bookcase .shelf-board").forEach((board) => tops.push(board.getBoundingClientRect().top + 2));
    }

    else {
        const sill = room.querySelector(".window-sill");
        if (sill && sill.offsetParent) tops.push(sill.getBoundingClientRect().top + 3);
        const floor = room.querySelector(".room-floor");
        if (floor) tops.push(floor.getBoundingClientRect().top + 8);
    }

    // The nearest surface just below (or a touch above) the piece.
    const target = tops
        .filter((top) => top - bottom <= (piece.room_area === "bookcase_top" ? SETTLE_REACH * 2.5 : SETTLE_REACH) && bottom - top <= 10)
        .sort((a, b) => Math.abs(a - bottom) - Math.abs(b - bottom))[0];

    if (target === undefined) {
        return;
    }

    const shift =
        target - bottom;

    if (Math.abs(shift) < 0.5) {
        return;
    }

    const span =
        piece.room_area === "bookcase_top" ? -TOP_SPAN * caseZoom()
            : piece.room_area === "shelf" ? SHELF_SPAN * caseZoom()
            : layerFor(piece.room_area).getBoundingClientRect().height;

    element.classList.add("is-settling");
    window.setTimeout(() => element.classList.remove("is-settling"), 260);

    adjust(piece, { position_y: piece.position_y + (shift / span) * 100 });

}


/* =========================================================
   ARRANGE MODE: TOOLS, DRAGGING, KEYS
========================================================= */

function selectBuiltIn(part) {

    selectedBuiltIn = part;
    selectedId = null;

    room.querySelectorAll(".placed-decor.is-selected").forEach((element) => element.classList.remove("is-selected"));
    room.querySelectorAll(".is-built-in-selected").forEach((element) => element.classList.remove("is-built-in-selected"));

    if (part) {
        builtInElements(part.id).forEach((element) => element.classList.add("is-built-in-selected"));
    }

    drawBar();

}


function select(id) {

    if (selectedBuiltIn) {
        selectedBuiltIn = null;
        room.querySelectorAll(".is-built-in-selected").forEach((element) => element.classList.remove("is-built-in-selected"));
    }

    selectedId = id;

    room.querySelectorAll(".placed-decor").forEach((element) => {
        element.classList.toggle("is-selected", element.dataset.decorId === id);
    });

    drawBar();

}


function onBarClick(event) {

    // A drag out of the tray ends in a click; it isn't a tap.
    if (skipNextClick) {
        skipNextClick = false;
        return;
    }

    const step =
        event.target.closest("[data-history]")?.dataset.history;

    if (step) {
        step === "undo" ? undo() : redo();
        return;
    }

    const mode =
        event.target.closest("[data-panel-mode]")?.dataset.panelMode;

    if (mode) {
        panelMode = mode;
        keepPanel();
        drawBar();
        bar.querySelector(`[data-panel-mode="${mode}"]`)?.focus();
        return;
    }

    const section =
        event.target.closest("[data-room-section]")?.dataset.roomSection;

    if (section) {
        roomOpen = roomOpen === section ? "" : section;
        drawBar();
        const head = bar.querySelector(`[data-room-section="${section}"]`);
        head?.focus();
        head?.scrollIntoView({ block: "nearest" });
        return;
    }

    const filter =
        event.target.closest("[data-piece-kind], [data-piece-style], [data-piece-holiday]");

    if (filter) {

        if (filter.dataset.pieceKind) {
            // Collections have their own choices; other kinds start
            // from every style.
            if ((filter.dataset.pieceKind === "collections") !== (pieceKind === "collections")) {
                pieceStyle = "";
                pieceHoliday = "";
            }
            pieceKind = filter.dataset.pieceKind;
        }

        else if (filter.dataset.pieceStyle !== undefined) {
            pieceStyle = filter.dataset.pieceStyle;
            pieceHoliday = "";
        }

        else {
            pieceHoliday = filter.dataset.pieceHoliday;
        }

        paletteQuery = "";
        keepPanel();

        const scrolled =
            bar.querySelector(".arrange-bar__palette-holder")?.scrollTop || 0;

        drawBar();

        const holder =
            bar.querySelector(".arrange-bar__palette-holder");

        const filters =
            holder?.querySelector(".piece-filters");

        // Keep the filters where they were; the list starts again.
        if (holder) {
            holder.scrollTop = Math.min(scrolled, filters ? filters.offsetTop + filters.offsetHeight - holder.clientHeight / 3 : 0);
        }

        const again =
            filter.dataset.pieceKind ? `[data-piece-kind="${pieceKind}"]` : filter.dataset.pieceStyle !== undefined ? `[data-piece-style="${pieceStyle}"]` : `[data-piece-holiday="${pieceHoliday}"]`;

        bar.querySelector(again)?.focus({ preventScroll: true });

        return;

    }

    if (onRoomPanelClick(event)) {

        // Redraw, keeping the panel where it was scrolled to.
        const scrolled =
            bar.querySelector(".arrange-bar__palette-holder")?.scrollTop || 0;

        drawBar();

        const panel =
            bar.querySelector(".arrange-bar__palette-holder");

        if (panel) {
            panel.scrollTop = scrolled;
        }

        return;

    }

    const add =
        event.target.closest("[data-add-decor]");

    if (add) {
        addPiece(add.dataset.addDecor);
        return;
    }

    const action =
        event.target.closest("[data-arrange]")?.dataset.arrange;

    if (action === "deselect") {

        if (selectedBuiltIn) {
            selectBuiltIn(null);
        }

        else {
            select(null);
        }

        return;

    }

    if (action === "remove-built-in" && selectedBuiltIn) {
        toggleBuiltIn(selectedBuiltIn.id);
        toast(`${selectedBuiltIn.name} taken out. Put it back any time from The room → Built into the room.`);
        selectBuiltIn(null);
        return;
    }

    if (action === "done") {
        setArranging(false);
        return;
    }

    if (action === "picture") {
        select(null);
        selectBuiltIn(null);
        takeRoomPicture();
        return;
    }

    if (action === "side") {
        setTraySide(bar.dataset.side === "left" ? "right" : "left");
        drawBar();
        bar.querySelector("[data-arrange=side]")?.focus();
        return;
    }

    if (action === "fold") {
        trayFolded = !trayFolded;
        drawBar();
        bar.querySelector("[data-arrange=fold]")?.focus();
        return;
    }

    const fabricButton =
        event.target.closest("[data-fabric]");

    if (fabricButton) {

        const tinted =
            pieces.find((item) => item.id === selectedId);

        if (tinted) {

            const before = snapshot(tinted);

            tinted.decoration_type = withLook(tinted, { tint: fabricButton.dataset.fabric || null });

            remember({ kind: "change", id: tinted.id, before, after: snapshot(tinted) });

            draw();
            drawBar();
            saveSoon(tinted);

        }

        return;

    }

    const piece =
        pieces.find((item) => item.id === selectedId);

    if (!piece || !action) {
        return;
    }

    if (action === "shake") {
        shakeGlobe(room.querySelector(`[data-decor-id="${piece.id}"]`));
        askForMotion();
        return;
    }

    if (action === "more") {
        toolsMore = !toolsMore;
        drawEditor();
        editor?.querySelector("[data-arrange=more]")?.focus();
        return;
    }

    if (action === "flip") {
        changePiece(piece, { decoration_type: withLook(piece, { flip: !isFlipped(piece) }) }, null);
        draw();
        editor?.querySelector("[data-arrange=flip]")?.focus();
        return;
    }

    const changes = {
        straighten: { rotation: 0 },
        smaller: { scale: piece.scale - 0.15 },
        bigger: { scale: piece.scale + 0.15 },
        "tilt-left": { rotation: piece.rotation - 8 },
        "tilt-right": { rotation: piece.rotation + 8 },
        back: { z_index: piece.z_index - 1 },
        forward: { z_index: piece.z_index + 1 }
    };

    if (action === "remove") {
        removePiece(piece);
        return;
    }

    if (action === "duplicate") {
        duplicate(piece);
        return;
    }

    if (NUDGES[action]) {
        changePiece(piece, nudge(piece, NUDGES[action]), `nudge:${action}`);
        return;
    }

    changePiece(piece, changes[action], `edit:${action}`);

}


/*
    While something is dragged near the top or bottom of the
    open view, the page scrolls so it can travel the whole
    room. `follow` re-places the dragged thing after each step.
*/

function autoScroll(pointer, follow, ready = () => true) {

    let frame = 0;

    const EDGE = 70;

    const step = () => {

        const view =
            openView();

        let distance = 0;

        if (!ready()) {
            frame = requestAnimationFrame(step);
            return;
        }

        // The room stays one screen tall and a tall bookcase's
        // shelves slide inside it; near their top or bottom,
        // slide them.
        const caseShelves =
            room.querySelector(".bookcase-body");

        const shelves =
            caseShelves && caseShelves.scrollHeight > caseShelves.clientHeight + 1
                ? caseShelves
                : null;

        let scroller = null;

        if (shelves) {

            const box =
                shelves.getBoundingClientRect();

            if (pointer.x >= box.left && pointer.x <= box.right) {
                scroller = shelves;
                view.top = Math.max(view.top, box.top);
                view.bottom = Math.min(view.bottom, box.bottom);
            }

        }

        if (pointer.y < view.top + EDGE) {
            distance = -(view.top + EDGE - pointer.y);
        }

        else if (pointer.y > view.bottom - EDGE) {
            distance = pointer.y - (view.bottom - EDGE);
        }

        if (distance && (scroller || !shelves)) {

            const target =
                scroller || document.scrollingElement;

            const before =
                target.scrollTop;

            target.scrollBy(0, clamp(distance / 3, -18, 18));

            if (target.scrollTop !== before) {
                follow();
            }

        }

        frame = requestAnimationFrame(step);

    };

    frame = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frame);

}


/*
    Dragging a placed piece: it follows the pointer. Dropping
    it over the other part of the room moves it there. On a
    touch screen a second finger pinches it bigger or smaller
    and twists it round.
*/

let draggingPiece = false;

function onPointerDown(event) {

    // A second finger during a drag pinches the piece (below).
    if (draggingPiece) {
        return;
    }

    // While arranging, the rug can be dragged across the floor.
    if (arranging && event.button <= 0 && event.target.closest(".room-rug") && !event.target.closest(".placed-decor")) {

        if (selectedId) {
            select(null);
        }

        dragRug(event);

        return;

    }

    // While arranging, the bookcase (standing free) can be moved
    // along the floor: a drag anywhere on it that isn't a piece or
    // one of its buttons.
    if (arranging && freeCase() && event.button <= 0
        && event.target.closest(".library-room > .bookcase-zone .bookcase")
        && !event.target.closest(".placed-decor, button, a, input, .book-spine")) {

        if (selectedId) {
            select(null);
        }

        dragCase(event);

        return;

    }

    // While arranging, the window can be dragged along the wall.
    if (arranging && event.button <= 0 && event.target.closest(".moon-window") && !event.target.closest(".placed-decor")) {

        if (selectedId) {
            select(null);
        }

        dragWindow(event);

        return;

    }

    // A piece the room came with: pick it out, to remove it.
    const builtIn =
        arranging && event.button <= 0 && !event.target.closest(".placed-decor") ? builtInAt(event.target) : null;

    if (builtIn) {
        event.preventDefault();
        selectBuiltIn(builtIn);
        return;
    }

    const element =
        event.target.closest(".placed-decor");

    if (arranging && !element && !event.target.closest(".arrange-bar")) {

        if (selectedBuiltIn) {
            selectBuiltIn(null);
        }


        // A tap on the room itself puts the tools away.
        if (selectedId) {
            select(null);
        }

        return;

    }

    if (!arranging || !element || event.button > 0) {
        return;
    }

    const piece =
        pieces.find((item) => item.id === element.dataset.decorId);

    if (!piece) {
        return;
    }

    event.preventDefault();

    // Picked up and moved in one go. It only moves once the
    // finger really travels (below), so a tap just chooses it.
    if (selectedId !== piece.id) {
        select(piece.id);
    }

    element.classList.remove("is-new");

    const before =
        snapshot(piece);

    // Where on the piece it was taken hold of, so it doesn't jump
    // to put its middle under the finger.
    const box =
        element.getBoundingClientRect();

    const grip = {
        x: event.clientX - (box.left + box.width / 2),
        y: event.clientY - (box.top + box.height / 2)
    };

    // It only starts moving once the finger really moves.
    let moved = false;

    // A globe dragged quickly back and forth gets shaken.
    const globe =
        isGlobePiece(element);

    let lastX = event.clientX;
    let lastSign = 0;
    let turns = [];

    element.setPointerCapture(event.pointerId);
    element.classList.add("is-dragging");

    bar?.classList.add("is-dragging");

    const pointer = {
        x: event.clientX,
        y: event.clientY
    };

    const place = () => {

        const x =
            pointer.x - grip.x;

        // A rug stays down on the floor.
        const y =
            assetFor(piece.asset_id)?.floor ? onFloor({ y: pointer.y - grip.y }).y : pointer.y - grip.y;

        const area =
            areaAt(x, y) || piece.room_area;

        const layer =
            layerFor(area);

        if (!layer) {
            return;
        }

        if (area !== piece.room_area) {

            piece.room_area = area;
            layer.appendChild(element);

            // Moving the piece to the other layer lets go of the
            // pointer; take it again so the page doesn't scroll.
            try {
                element.setPointerCapture(event.pointerId);
            }

            catch {
                // The finger already lifted.
            }

        }

        adjust(piece, positionIn(area, x, y));

    };

    // The second finger, while it's down.
    let pinch = null;
    let pinched = false;

    const spread = () =>
        Math.hypot(pinch.x - pointer.x, pinch.y - pointer.y);

    const angle = () =>
        Math.atan2(pinch.y - pointer.y, pinch.x - pointer.x) * 180 / Math.PI;

    const secondFinger = (downEvent) => {

        if (downEvent.pointerId === event.pointerId || downEvent.pointerType !== "touch" || pinch) {
            return;
        }

        downEvent.preventDefault();

        pinch = { id: downEvent.pointerId, x: downEvent.clientX, y: downEvent.clientY };
        pinched = true;
        pinch.spread = Math.max(20, spread());
        pinch.angle = angle();
        pinch.scale = piece.scale;
        pinch.rotation = piece.rotation;

    };

    const move = (moveEvent) => {

        if (pinch && moveEvent.pointerId === pinch.id) {
            pinch.x = moveEvent.clientX;
            pinch.y = moveEvent.clientY;
        }

        else if (moveEvent.pointerId === event.pointerId) {

            if (!moved && Math.hypot(moveEvent.clientX - event.clientX, moveEvent.clientY - event.clientY) < 5) {
                return;
            }

            moved = true;

            pointer.x = moveEvent.clientX;
            pointer.y = moveEvent.clientY;

            if (globe) {

                const step = moveEvent.clientX - lastX;

                if (Math.abs(step) > 3) {

                    const sign = Math.sign(step);
                    const now = performance.now();

                    if (lastSign && sign !== lastSign) {
                        turns = [...turns.filter((time) => now - time < 1200), now];
                        if (turns.length >= 3) {
                            shakeGlobe(element);
                            turns = [];
                        }
                    }

                    lastSign = sign;
                    lastX = moveEvent.clientX;

                }

            }

        }

        else {
            return;
        }

        if (pinch) {

            let turn =
                angle() - pinch.angle;

            turn = ((turn + 540) % 360) - 180;

            adjust(piece, {
                scale: pinch.scale * spread() / pinch.spread,
                // A small twist is a slip of the fingers.
                rotation: Math.abs(turn) < 8 ? pinch.rotation : pinch.rotation + turn
            });

            return;

        }

        place();

    };

    const stopScrolling =
        autoScroll(pointer, () => {
            if (!pinch && moved) {
                place();
            }
        });

    // Listened for on the whole window, so the drag carries on
    // even when the piece moves between the wall and the shelves.
    const stop = (upEvent) => {

        // The second finger lifting ends the pinch; the first
        // finger carries on dragging from where it is.
        if (pinch && upEvent.pointerId === pinch.id) {
            pinch = null;
            return;
        }

        if (upEvent.pointerId !== event.pointerId) {
            return;
        }

        stopScrolling();

        draggingPiece = false;
        document.documentElement.classList.remove("is-dragging-piece");

        element.classList.remove("is-dragging");
        bar?.classList.remove("is-dragging");

        window.removeEventListener("pointerdown", secondFinger, true);
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", stop);
        window.removeEventListener("pointercancel", stop);

        if (moved || pinched) {
            settle(piece);
        }

        const after =
            snapshot(piece);

        if (!same(before, after)) {
            remember({ kind: "change", id: piece.id, before, after });
        }

        drawEditor();

    };

    draggingPiece = true;
    document.documentElement.classList.add("is-dragging-piece");

    window.addEventListener("pointerdown", secondFinger, true);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);

}


/*
    Dragging a new piece out of the tray. A short press is a
    tap (handled as a click). On a touch screen the tray's own
    scrolling direction is left to the browser, so a drag out
    has to head the other way: up out of the phone's strip, or
    sideways out of the computer's panel.
*/

function onPalettePointerDown(event) {

    const button =
        event.target.closest("[data-add-decor]");

    if (!button || event.button > 0) {
        return;
    }

    const asset =
        assetFor(button.dataset.addDecor);

    const start = {
        x: event.clientX,
        y: event.clientY
    };

    const pointer = { ...start };

    const touch =
        event.pointerType !== "mouse";

    let ghost = null;
    let stopScrolling = null;

    // Until the piece is out of the tray, the page stays put.
    let outOfTray = false;

    const begin = () => {

        // Held only once a drag begins: holding it from the first
        // touch can stop iPhones scrolling the tray.
        try {
            button.setPointerCapture(event.pointerId);
        }

        catch {
            // The pointer has already gone.
        }

        ghost = document.createElement("div");
        ghost.className = "decor-ghost";
        ghost.style.width = `${asset.width}px`;
        ghost.innerHTML = artMarkup(asset);
        document.body.appendChild(ghost);

        bar.classList.add("is-dragging");

        stopScrolling = autoScroll(pointer, () => follow(), () => outOfTray);

    };

    const follow = () => {

        ghost.style.left = `${pointer.x}px`;
        ghost.style.top = `${pointer.y}px`;

        const inTray =
            overTray(pointer.x, pointer.y);

        outOfTray = outOfTray || !inTray;

        const area =
            inTray ? null : areaAt(pointer.x, pointer.y);

        ghost.classList.toggle("is-droppable", Boolean(area));

    };

    const move = (moveEvent) => {

        if (moveEvent.pointerId !== event.pointerId) {
            return;
        }

        pointer.x = moveEvent.clientX;
        pointer.y = moveEvent.clientY;

        if (!ghost) {

            const dx =
                Math.abs(pointer.x - start.x);

            const dy =
                Math.abs(pointer.y - start.y);

            if (Math.max(dx, dy) < 8) {
                return;
            }

            // Let the browser scroll the tray if that's what
            // this touch is doing.
            if (touch && (onPhone() ? dx > dy : dy > dx)) {
                finish();
                return;
            }

            begin();

        }

        follow();

    };

    const finish = (upEvent) => {

        if (upEvent && upEvent.pointerId !== event.pointerId) {
            return;
        }

        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", finish);
        window.removeEventListener("pointercancel", cancel);

        if (!ghost) {
            return;
        }

        stopScrolling?.();

        ghost.remove();

        bar?.classList.remove("is-dragging");

        // The click that follows a drag isn't a tap.
        skipNextClick = true;
        window.setTimeout(() => {
            skipNextClick = false;
        }, 400);

        if (!upEvent) {
            return;
        }

        const area =
            overTray(pointer.x, pointer.y) ? null : areaAt(pointer.x, pointer.y);

        if (area) {
            addPiece(asset.id, { area, x: pointer.x, y: pointer.y });
        }

    };

    const cancel = (cancelEvent) => {

        if (cancelEvent.pointerId === event.pointerId) {
            finish();
        }

    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", cancel);

}


function overTray(x, y) {

    if (!bar) {
        return false;
    }

    const box =
        bar.getBoundingClientRect();

    return x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;

}


/* Only parts of the room on show take pieces (a phone folds the wall away). */

function layerShown(area) {

    const layer =
        layerFor(area);

    return Boolean(layer && layer.offsetParent && getComputedStyle(layer).display !== "none");

}


function areaAt(x, y) {

    return LANDINGS.find((area) => {

        if (!layerShown(area)) {
            return false;
        }

        const box =
            areaBox(area);

        return x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;

    });

}


function onKeyDown(event) {

    const element =
        event.target.closest?.(".placed-decor");

    if (!arranging) {
        return;
    }

    // Escape lets go of the chosen piece; again, finishes.
    if (event.key === "Escape") {
        if (selectedId || selectedBuiltIn) {
            selectBuiltIn(null);
            select(null);
        }
        else {
            setArranging(false);
        }
        return;
    }

    // Undo and redo, wherever the focus is (but not while typing).
    if ((event.ctrlKey || event.metaKey) && !event.target.closest?.("input, textarea")) {

        const key = event.key.toLowerCase();

        if (key === "z" || key === "y") {
            event.preventDefault();
            (key === "y" || event.shiftKey) ? redo() : undo();
            return;
        }

    }

    if (!element) {
        return;
    }

    const piece =
        pieces.find((item) => item.id === element.dataset.decorId);

    const step =
        event.shiftKey ? 5 : 1;

    const moves = {
        ArrowLeft: { position_x: piece.position_x - step },
        ArrowRight: { position_x: piece.position_x + step },
        // On top of the bookcase, up is further from its edge.
        ArrowUp: { position_y: piece.position_y + (piece.room_area === "bookcase_top" ? step : -step) },
        ArrowDown: { position_y: piece.position_y - (piece.room_area === "bookcase_top" ? step : -step) },
        "+": { scale: piece.scale + 0.1 },
        "=": { scale: piece.scale + 0.1 },
        "-": { scale: piece.scale - 0.1 },
        "[": { rotation: piece.rotation - 5 },
        "]": { rotation: piece.rotation + 5 }
    };

    if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        removePiece(piece);
        return;
    }

    if (moves[event.key]) {
        event.preventDefault();
        select(piece.id);
        changePiece(piece, moves[event.key], `key:${event.key}`);
    }

}


export function setArranging(on) {

    if (!room) {
        return;
    }

    arranging = on;

    if (!on) {
        selectedId = null;
        selectedBuiltIn = null;
        trayFolded = false;
        forgetHistory();
        room.querySelectorAll(".is-built-in-selected").forEach((element) => element.classList.remove("is-built-in-selected"));
    }

    document.documentElement.classList.toggle("is-arranging-room", on);

    // Opened from another page with ?arrange=1: don't reopen
    // on the next reload.
    if (!on) {

        const url =
            new URL(window.location.href);

        if (url.searchParams.has("arrange")) {
            url.searchParams.delete("arrange");
            window.history.replaceState(null, "", url);
        }

    }

    draw();

    drawHistory();

    // Start at the panel's choice of room or pieces.
    if (on) {
        bar?.querySelector(".arrange-bar__mode.is-current")?.focus({ preventScroll: true });
    }

}


/* =========================================================
   START
========================================================= */

async function load(themeId) {

    theme = themeId;

    const token =
        ++loadToken;

    try {

        const rows =
            await listDecorations(themeId);

        if (token !== loadToken) {
            return;
        }

        // The room's own fixtures (wallpaper, window…) come with
        // the decorations; js/room/fixtures.js looks after them.
        setFixtureRows(themeId, rows.filter((row) => row.decoration_type === "fixture"));

        pieces = rows.filter((row) => row.decoration_type !== "fixture").map((row) => ({
            ...row,
            position_x: Number(row.position_x),
            position_y: Number(row.position_y),
            scale: Number(row.scale),
            rotation: Number(row.rotation),
            room_area: AREAS[row.room_area] ? row.room_area : "wall"
            // ("floor" is in AREAS: the whole room.)
        }));

    }

    catch (error) {

        console.error(error);

        pieces = [];

    }

    selectedId = null;

    draw();

}


/* =========================================================
   SNOW GLOBES
   Shaken with a tap (whenever the room is shown), with the
   Shake button or a quick back-and-forth while decorating, or
   by shaking the phone itself.
========================================================= */

function isGlobePiece(element) {
    const piece = element && pieces.find((item) => item.id === element.dataset.decorId);
    return Boolean(piece && isSnowGlobe(assetFor(piece.asset_id)?.src));
}

function stillness() {
    // Settings → Keep things still (the room's own life doesn't
    // follow the device's setting).
    return document.documentElement.classList.contains("reduce-motion");
}

export function shakeGlobe(element) {

    if (!element || stillness()) {
        return;
    }

    element.classList.remove("is-shaken");

    // A fresh shake starts the flurry again.
    void element.offsetWidth;

    element.classList.add("is-shaken");

    clearTimeout(element.shakeTimer);

    element.shakeTimer = setTimeout(() => element.classList.remove("is-shaken"), 4200);

}

function shakeAllGlobes() {
    room?.querySelectorAll(".placed-decor").forEach((element) => {
        if (isGlobePiece(element)) {
            shakeGlobe(element);
        }
    });
}

// Shaking the phone shakes every globe in the room.
let listeningForShakes = false;

function listenForShakes() {

    if (listeningForShakes || !("DeviceMotionEvent" in window)) {
        return;
    }

    listeningForShakes = true;

    let last = 0;

    window.addEventListener("devicemotion", (event) => {

        const moved =
            event.acceleration?.x !== null && event.acceleration?.x !== undefined
                ? Math.hypot(event.acceleration.x, event.acceleration.y, event.acceleration.z)
                : Math.abs(Math.hypot(event.accelerationIncludingGravity?.x || 0, event.accelerationIncludingGravity?.y || 0, event.accelerationIncludingGravity?.z || 0) - 9.81);

        if (moved < 14 || Date.now() - last < 1500) {
            return;
        }

        last = Date.now();

        shakeAllGlobes();

    });

}

// iPhones ask first, and only from a tap.
let askedForMotion = false;

function askForMotion() {

    if (askedForMotion) {
        return;
    }

    askedForMotion = true;

    const ask =
        window.DeviceMotionEvent?.requestPermission;

    if (typeof ask !== "function") {
        listenForShakes();
        return;
    }

    ask.call(window.DeviceMotionEvent)
        .then((answer) => {
            if (answer === "granted") {
                listenForShakes();
            }
        })
        .catch(() => {
            // No shaking the phone; tapping still works.
        });

}

// Outside decorating, a tap on a globe shakes it.
function onRoomClick(event) {

    if (arranging) {
        return;
    }

    const element =
        event.target.closest(".placed-decor");

    if (isGlobePiece(element)) {
        shakeGlobe(element);
        askForMotion();
    }

}


export async function startDecorations(container, themeId) {

    room = container;

    if (!room) {
        return;
    }

    room.addEventListener("pointerdown", onPointerDown);
    room.addEventListener("click", onRoomClick);
    document.addEventListener("keydown", onKeyDown);

    // Where no permission is needed, shaking the phone works
    // straight away.
    if (typeof window.DeviceMotionEvent?.requestPermission !== "function") {
        listenForShakes();
    }

    room.addEventListener("focusin", (event) => {

        const element =
            event.target.closest(".placed-decor");

        if (arranging && element) {
            select(element.dataset.decorId);
        }

    });

    document.addEventListener("novellow:arrange", () => setArranging(!arranging));

    // The shelves slide inside the bookcase; their pieces follow.
    let following = 0;

    const follow = () => {
        cancelAnimationFrame(following);
        following = requestAnimationFrame(followShelves);
    };

    room.querySelector(".bookcase-body")?.addEventListener("scroll", follow, { passive: true });
    window.addEventListener("resize", follow);

    // When the shelves are drawn again, their pieces go back on
    // their rows.
    const body =
        room.querySelector(".bookcase-body");

    if (body && "MutationObserver" in window) {

        let reflowing = 0;

        new MutationObserver(() => {
            cancelAnimationFrame(reflowing);
            reflowing = requestAnimationFrame(followRows);
        }).observe(body, { childList: true });

    }

    document.addEventListener("novellow:appearance", (event) => {

        if (event.detail.theme.id !== theme) {
            load(event.detail.theme.id);
        }

    });

    await load(themeId);

    if (new URLSearchParams(window.location.search).get("arrange") === "1") {
        setArranging(true);
    }

}
