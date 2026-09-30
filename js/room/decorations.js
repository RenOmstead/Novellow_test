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
import { setFixtureRows, roomPanelMarkup, onRoomPanelClick, dragWindow, dragRug, builtInAt, builtInElements, toggleBuiltIn } from "./fixtures.js?v=__VERSION__";


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
    { id: "bookish", name: "Bookish" },
    { id: "cozy", name: "Cozy" },
    { id: "treats", name: "Treats" },
    { id: "autumn", name: "Autumn" },
    { id: "plants", name: "Plants" },
    { id: "witchy", name: "Witchy" },
    { id: "spooky", name: "Spooky" },
    { id: "haunted", name: "Haunted" },
    { id: "rugs", name: "Rugs" }
];

export const DECOR_ASSETS = [
    // Hand-painted pieces (pictures, not drawings): each shows first in its tab.
    { id: "art-armchair-plum", src: "assets/decor/painted/armchair_plum.webp", size: [218, 231], width: 190, name: "Plum tufted armchair", group: "seating" },
    { id: "art-sofa-pumpkin", src: "assets/decor/painted/sofa_pumpkin.webp", size: [345, 193], width: 300, name: "Pumpkin scalloped sofa", group: "seating" },
    { id: "art-moon-pillow", src: "assets/decor/painted/moon_pillow.webp", size: [198, 157], width: 90, name: "Plaid moon pillow", group: "seating" },
    { id: "art-side-table", src: "assets/decor/painted/side_table.webp", size: [157, 183], width: 120, name: "Carved side table", group: "tables" },
    { id: "art-gothic-bookcase", src: "assets/decor/painted/gothic_bookcase.webp", size: [162, 257], width: 150, name: "Gothic bookcase", group: "storage" },
    { id: "art-apothecary-cabinet", src: "assets/decor/painted/apothecary_cabinet.webp", size: [237, 253], width: 200, name: "Apothecary cabinet", group: "storage" },
    { id: "art-stone-fireplace", src: "assets/decor/painted/stone_fireplace.webp", size: [251, 213], width: 250, name: "Stone fireplace", group: "storage" },
    { id: "art-fringed-lamp", src: "assets/decor/painted/fringed_lamp.webp", size: [118, 217], width: 100, name: "Fringed floor lamp", group: "lighting" },
    { id: "art-candelabra", src: "assets/decor/painted/candelabra.webp", size: [171, 205], width: 100, name: "Brass candelabra", group: "lighting" },
    { id: "art-hanging-lantern", src: "assets/decor/painted/hanging_lantern.webp", size: [97, 228], width: 60, name: "Hanging lantern", group: "lighting" },
    { id: "art-pumpkin-lantern", src: "assets/decor/painted/pumpkin_lantern.webp", size: [146, 195], width: 80, name: "Pumpkin lantern", group: "lighting" },
    { id: "art-moon-lamp", src: "assets/decor/painted/moon_lamp.webp", size: [138, 190], width: 90, name: "Crescent moon lamp", group: "lighting" },
    { id: "art-star-garland", src: "assets/decor/painted/star_garland.webp", size: [358, 139], width: 240, name: "Moon and star garland", group: "cozy" },
    { id: "art-retro-tv", src: "assets/decor/painted/retro_tv.webp", size: [228, 172], width: 150, name: "Retro television", group: "cozy" },
    { id: "art-vhs-stack", src: "assets/decor/painted/vhs_stack.webp", size: [228, 156], width: 100, name: "Stack of tapes", group: "cozy" },
    { id: "art-rotary-phone", src: "assets/decor/painted/rotary_phone.webp", size: [216, 150], width: 100, name: "Rotary telephone", group: "cozy" },
    { id: "art-camp-sign", src: "assets/decor/painted/camp_sign.webp", size: [294, 162], width: 150, name: "Forest trail sign", group: "cozy" },
    { id: "art-flashlight", src: "assets/decor/painted/flashlight.webp", size: [196, 121], width: 80, name: "Flashlight", group: "cozy" },
    { id: "art-jack-o-lantern", src: "assets/decor/painted/jack_o_lantern.webp", size: [180, 169], width: 100, name: "Jack-o'-lantern", group: "autumn" },
    { id: "art-autumn-wreath", src: "assets/decor/painted/autumn_wreath.webp", size: [211, 226], width: 130, name: "Autumn leaf wreath", group: "autumn" },
    { id: "art-bubbling-cauldron", src: "assets/decor/painted/bubbling_cauldron.webp", size: [190, 189], width: 120, name: "Bubbling cauldron", group: "witchy" },
    { id: "art-potion-trio", src: "assets/decor/painted/potion_trio.webp", size: [238, 180], width: 110, name: "Three potions", group: "witchy" },
    { id: "art-witch-hat", src: "assets/decor/painted/witch_hat.webp", size: [245, 189], width: 130, name: "Witch's hat", group: "witchy" },
    { id: "art-ghost", src: "assets/decor/painted/ghost.webp", size: [206, 191], width: 110, name: "Friendly ghost", group: "spooky" },
    { id: "art-ghost-friend", src: "assets/decor/painted/ghost_friend.webp", size: [209, 181], width: 100, name: "Little ghost", group: "spooky" },
    { id: "art-bat", src: "assets/decor/painted/bat.webp", size: [260, 122], width: 130, name: "Paper bat", group: "spooky" },
    { id: "art-rug-night-sky", src: "assets/decor/painted/rug_night_sky.webp", size: [253, 154], width: 280, name: "Night sky rug", group: "rugs", floor: true },
    { id: "art-rug-mushroom", src: "assets/decor/painted/rug_mushroom.webp", size: [276, 139], width: 280, name: "Mushroom rug", group: "rugs", floor: true },
    { id: "art-rug-pumpkin", src: "assets/decor/painted/rug_pumpkin.webp", size: [249, 154], width: 260, name: "Pumpkin rug", group: "rugs", floor: true },
    { id: "art-rug-crescent", src: "assets/decor/painted/rug_crescent.webp", size: [223, 173], width: 260, name: "Crescent moon rug", group: "rugs", floor: true },
    { id: "art-tattered-wingback", src: "assets/decor/painted/tattered_wingback.webp", size: [231, 236], width: 190, name: "Tattered wingback", group: "seating" },
    { id: "art-torn-recliner", src: "assets/decor/painted/torn_recliner.webp", size: [263, 217], width: 210, name: "Torn recliner", group: "seating" },
    { id: "art-haunted-tv-stand", src: "assets/decor/painted/haunted_tv_stand.webp", size: [240, 235], width: 200, name: "Haunted TV stand", group: "storage" },
    { id: "art-dusty-bookcase", src: "assets/decor/painted/dusty_bookcase.webp", size: [188, 226], width: 160, name: "Dusty bookcase", group: "storage" },
    { id: "art-rusty-locker", src: "assets/decor/painted/rusty_locker.webp", size: [189, 235], width: 160, name: "Rusty locker", group: "storage" },
    { id: "art-phone-table", src: "assets/decor/painted/phone_table.webp", size: [209, 198], width: 150, name: "Table with red telephone", group: "tables" },
    { id: "art-stitched-mask", src: "assets/decor/painted/stitched_mask.webp", size: [126, 208], width: 80, name: "Stitched mask", group: "haunted" },
    { id: "art-button-eye-doll", src: "assets/decor/painted/button_eye_doll.webp", size: [207, 221], width: 110, name: "Button-eyed doll", group: "haunted" },
    { id: "art-rusty-saw", src: "assets/decor/painted/rusty_saw.webp", size: [263, 203], width: 150, name: "Rusty saw", group: "haunted" },
    { id: "art-axe-stump", src: "assets/decor/painted/axe_stump.webp", size: [239, 203], width: 140, name: "Axe in a stump", group: "haunted" },
    { id: "art-straight-razor", src: "assets/decor/painted/straight_razor.webp", size: [262, 190], width: 130, name: "Straight razor", group: "haunted" },
    { id: "art-hanging-cloak", src: "assets/decor/painted/hanging_cloak.webp", size: [169, 266], width: 110, name: "Hanging red cloak", group: "haunted" },
    { id: "art-red-cage-lamp", src: "assets/decor/painted/red_cage_lamp.webp", size: [161, 202], width: 90, name: "Red cage lamp", group: "lighting" },
    { id: "art-rusty-flashlight", src: "assets/decor/painted/rusty_flashlight.webp", size: [254, 165], width: 120, name: "Rusty flashlight", group: "haunted" },
    { id: "art-oil-lantern", src: "assets/decor/painted/oil_lantern.webp", size: [138, 224], width: 80, name: "Oil lantern", group: "lighting" },
    { id: "art-torn-lamp", src: "assets/decor/painted/torn_lamp.webp", size: [196, 208], width: 110, name: "Torn red lamp", group: "lighting" },
    { id: "art-screaming-candle", src: "assets/decor/painted/screaming_candle.webp", size: [213, 215], width: 90, name: "Screaming candle", group: "haunted" },
    { id: "art-hanging-shop-lamp", src: "assets/decor/painted/hanging_shop_lamp.webp", size: [207, 211], width: 120, name: "Hanging metal lamp", group: "lighting" },
    { id: "art-rug-handprint", src: "assets/decor/painted/rug_handprint.webp", size: [263, 149], width: 270, name: "Handprint rug", group: "rugs", floor: true },
    { id: "art-rug-checker", src: "assets/decor/painted/rug_checker.webp", size: [185, 148], width: 220, name: "Checkered rug", group: "rugs", floor: true },
    { id: "art-rug-mask", src: "assets/decor/painted/rug_mask.webp", size: [298, 149], width: 280, name: "Masked face rug", group: "rugs", floor: true },
    { id: "art-rug-dead-tree", src: "assets/decor/painted/rug_dead_tree.webp", size: [271, 152], width: 270, name: "Bare tree rug", group: "rugs", floor: true },
    { id: "art-rug-thorn-spiral", src: "assets/decor/painted/rug_thorn_spiral.webp", size: [230, 169], width: 230, name: "Thorn spiral rug", group: "rugs", floor: true },
    { id: "art-rug-footprints", src: "assets/decor/painted/rug_footprints.webp", size: [255, 148], width: 250, name: "Footprints rug", group: "rugs", floor: true },
    { id: "art-worn-books", src: "assets/decor/painted/worn_books.webp", size: [209, 183], width: 110, name: "Worn book stack", group: "bookish" },
    { id: "art-camcorder", src: "assets/decor/painted/camcorder.webp", size: [255, 178], width: 120, name: "Old camcorder", group: "haunted" },
    { id: "art-cream-phone", src: "assets/decor/painted/cream_phone.webp", size: [245, 168], width: 110, name: "Cream push-button phone", group: "cozy" },
    { id: "art-boarded-window", src: "assets/decor/painted/boarded_window.webp", size: [205, 193], width: 140, name: "Boarded-up window", group: "haunted" },
    { id: "art-chain-padlock", src: "assets/decor/painted/chain_padlock.webp", size: [192, 174], width: 100, name: "Chain and padlock", group: "haunted" },
    { id: "art-eye-sign", src: "assets/decor/painted/eye_sign.webp", size: [237, 169], width: 140, name: "All-seeing eye sign", group: "haunted" },
    { id: "art-faded-wingback", src: "assets/decor/painted/faded_wingback.webp", size: [196, 228], width: 180, name: "Faded wingback", group: "seating" },
    { id: "art-tattered-chaise", src: "assets/decor/painted/tattered_chaise.webp", size: [315, 201], width: 290, name: "Tattered chaise", group: "seating" },
    { id: "art-cobweb-bookcase", src: "assets/decor/painted/cobweb_bookcase.webp", size: [180, 232], width: 160, name: "Cobwebbed bookcase", group: "storage" },
    { id: "art-old-writing-desk", src: "assets/decor/painted/old_writing_desk.webp", size: [254, 222], width: 210, name: "Old writing desk", group: "tables" },
    { id: "art-broken-cabinet", src: "assets/decor/painted/broken_cabinet.webp", size: [164, 235], width: 150, name: "Broken glass cabinet", group: "storage" },
    { id: "art-cold-fireplace", src: "assets/decor/painted/cold_fireplace.webp", size: [243, 219], width: 240, name: "Cold stone fireplace", group: "storage" },
    { id: "art-cracked-mirror", src: "assets/decor/painted/cracked_mirror.webp", size: [189, 235], width: 110, name: "Cracked mirror", group: "pictures" },
    { id: "art-haunted-portrait", src: "assets/decor/painted/haunted_portrait.webp", size: [212, 232], width: 120, name: "Haunted portrait", group: "pictures" },
    { id: "art-raven-statue", src: "assets/decor/painted/raven_statue.webp", size: [188, 211], width: 110, name: "Raven on a stone", group: "haunted" },
    { id: "art-open-birdcage", src: "assets/decor/painted/open_birdcage.webp", size: [191, 243], width: 110, name: "Open birdcage", group: "haunted" },
    { id: "art-skull-on-books", src: "assets/decor/painted/skull_on_books.webp", size: [239, 190], width: 120, name: "Skull on old books", group: "bookish" },
    { id: "art-grandfather-clock", src: "assets/decor/painted/grandfather_clock.webp", size: [122, 243], width: 110, name: "Grandfather clock", group: "storage" },
    { id: "art-cobweb-candelabra", src: "assets/decor/painted/cobweb_candelabra.webp", size: [218, 224], width: 120, name: "Cobwebbed candelabra", group: "lighting" },
    { id: "art-iron-lantern", src: "assets/decor/painted/iron_lantern.webp", size: [115, 233], width: 70, name: "Iron lantern", group: "lighting" },
    { id: "art-tattered-lamp", src: "assets/decor/painted/tattered_lamp.webp", size: [166, 215], width: 100, name: "Tattered fringed lamp", group: "lighting" },
    { id: "art-candle-sconce", src: "assets/decor/painted/candle_sconce.webp", size: [143, 181], width: 80, name: "Candle sconce", group: "lighting" },
    { id: "art-candle-dish", src: "assets/decor/painted/candle_dish.webp", size: [207, 159], width: 90, name: "Candle in a dish", group: "lighting" },
    { id: "art-candle-chandelier", src: "assets/decor/painted/candle_chandelier.webp", size: [232, 209], width: 170, name: "Candle chandelier", group: "lighting" },
    { id: "art-rug-red-medallion", src: "assets/decor/painted/rug_red_medallion.webp", size: [245, 133], width: 260, name: "Worn medallion rug", group: "rugs", floor: true },
    { id: "art-rug-web", src: "assets/decor/painted/rug_web.webp", size: [229, 127], width: 240, name: "Cobweb rug", group: "rugs", floor: true },
    { id: "art-rug-moth", src: "assets/decor/painted/rug_moth.webp", size: [248, 143], width: 260, name: "Moth rug", group: "rugs", floor: true },
    { id: "art-rug-thorn-oval", src: "assets/decor/painted/rug_thorn_oval.webp", size: [240, 144], width: 250, name: "Thorn oval rug", group: "rugs", floor: true },
    { id: "art-rug-green-diamond", src: "assets/decor/painted/rug_green_diamond.webp", size: [304, 115], width: 290, name: "Green diamond runner", group: "rugs", floor: true },
    { id: "art-rug-rose", src: "assets/decor/painted/rug_rose.webp", size: [183, 145], width: 190, name: "Faded rose rug", group: "rugs", floor: true },
    { id: "art-boarded-arch-window", src: "assets/decor/painted/boarded_arch_window.webp", size: [139, 214], width: 110, name: "Boarded arched window", group: "haunted" },
    { id: "art-arched-door", src: "assets/decor/painted/arched_door.webp", size: [144, 207], width: 120, name: "Arched wooden door", group: "haunted" },
    { id: "art-empty-frame", src: "assets/decor/painted/empty_frame.webp", size: [146, 202], width: 100, name: "Empty gilded frame", group: "pictures" },
    { id: "art-cobweb-shelf", src: "assets/decor/painted/cobweb_shelf.webp", size: [225, 154], width: 170, name: "Cobwebbed shelf", group: "storage" },
    { id: "art-gargoyle", src: "assets/decor/painted/gargoyle.webp", size: [217, 196], width: 130, name: "Gargoyle", group: "haunted" },
    { id: "art-torn-curtains", src: "assets/decor/painted/torn_curtains.webp", size: [307, 195], width: 240, name: "Torn curtains", group: "haunted" },
    { id: "art-velvet-chaise", src: "assets/decor/painted/velvet_chaise.webp", size: [344, 207], width: 290, name: "Velvet chaise", group: "seating" },
    { id: "art-rocking-chair", src: "assets/decor/painted/rocking_chair.webp", size: [203, 234], width: 170, name: "Cushioned rocking chair", group: "seating" },
    { id: "art-moon-writing-desk", src: "assets/decor/painted/moon_writing_desk.webp", size: [236, 199], width: 210, name: "Moon writing desk", group: "tables" },
    { id: "art-potion-cabinet", src: "assets/decor/painted/potion_cabinet.webp", size: [143, 237], width: 130, name: "Potion cabinet", group: "storage" },
    { id: "art-gothic-shelf", src: "assets/decor/painted/gothic_shelf.webp", size: [164, 236], width: 140, name: "Gothic arched shelf", group: "storage" },
    { id: "art-gramophone", src: "assets/decor/painted/gramophone.webp", size: [160, 247], width: 120, name: "Gramophone", group: "cozy" },
    { id: "art-flower-skull", src: "assets/decor/painted/flower_skull.webp", size: [207, 181], width: 110, name: "Flower-crowned skull", group: "spooky" },
    { id: "art-amethyst-cluster", src: "assets/decor/painted/amethyst_cluster.webp", size: [161, 186], width: 100, name: "Amethyst cluster", group: "witchy" },
    { id: "art-lavender-bundle", src: "assets/decor/painted/lavender_bundle.webp", size: [169, 209], width: 100, name: "Lavender bundle", group: "plants" },
    { id: "art-raven-on-books", src: "assets/decor/painted/raven_on_books.webp", size: [199, 193], width: 120, name: "Raven on books", group: "bookish" },
    { id: "art-mushroom-cloche", src: "assets/decor/painted/mushroom_cloche.webp", size: [155, 205], width: 100, name: "Mushroom cloche", group: "witchy" },
    { id: "art-ghost-portrait", src: "assets/decor/painted/ghost_portrait.webp", size: [192, 218], width: 110, name: "Ghost portrait", group: "pictures" },
    { id: "art-tiffany-lamp", src: "assets/decor/painted/tiffany_lamp.webp", size: [186, 200], width: 110, name: "Tiffany lamp", group: "lighting" },
    { id: "art-oil-lamp", src: "assets/decor/painted/oil_lamp.webp", size: [137, 186], width: 80, name: "Brass oil lamp", group: "lighting" },
    { id: "art-bat-candle", src: "assets/decor/painted/bat_candle.webp", size: [239, 157], width: 130, name: "Bat candle sconce", group: "spooky" },
    { id: "art-star-lantern", src: "assets/decor/painted/star_lantern.webp", size: [147, 202], width: 90, name: "Star lantern", group: "lighting" },
    { id: "art-skull-candle", src: "assets/decor/painted/skull_candle.webp", size: [139, 190], width: 80, name: "Skull candle", group: "spooky" },
    { id: "art-fringed-table-lamp", src: "assets/decor/painted/fringed_table_lamp.webp", size: [179, 191], width: 110, name: "Rose fringed lamp", group: "lighting" },
    { id: "art-rug-poppy", src: "assets/decor/painted/rug_poppy.webp", size: [267, 145], width: 270, name: "Poppy rug", group: "rugs", floor: true },
    { id: "art-rug-moth-oval", src: "assets/decor/painted/rug_moth_oval.webp", size: [230, 166], width: 240, name: "Moon moth rug", group: "rugs", floor: true },
    { id: "art-rug-maple-leaf", src: "assets/decor/painted/rug_maple_leaf.webp", size: [204, 164], width: 210, name: "Maple leaf rug", group: "rugs", floor: true },
    { id: "art-rug-fern", src: "assets/decor/painted/rug_fern.webp", size: [264, 140], width: 270, name: "Fern oval rug", group: "rugs", floor: true },
    { id: "art-rug-web-moon", src: "assets/decor/painted/rug_web_moon.webp", size: [272, 141], width: 270, name: "Web and moon rug", group: "rugs", floor: true },
    { id: "art-rug-moon", src: "assets/decor/painted/rug_moon.webp", size: [192, 149], width: 200, name: "Crescent rug", group: "rugs", floor: true },
    { id: "art-boombox", src: "assets/decor/painted/boombox.webp", size: [246, 176], width: 150, name: "Boombox", group: "cozy" },
    { id: "art-red-phone", src: "assets/decor/painted/red_phone.webp", size: [223, 164], width: 120, name: "Red telephone", group: "cozy" },
    { id: "art-cuckoo-clock", src: "assets/decor/painted/cuckoo_clock.webp", size: [165, 203], width: 100, name: "Bat cuckoo clock", group: "cozy" },
    { id: "art-camping-lantern", src: "assets/decor/painted/camping_lantern.webp", size: [109, 205], width: 70, name: "Camping lantern", group: "lighting" },
    { id: "art-moon-mask", src: "assets/decor/painted/moon_mask.webp", size: [130, 196], width: 80, name: "Moon mask", group: "witchy" },
    { id: "art-wooden-door", src: "assets/decor/painted/wooden_door.webp", size: [156, 196], width: 110, name: "Little wooden door", group: "cozy" },
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
    { id: "frame-castle", box: "0 0 130 100", width: 100, name: "Castle painting", group: "retired" }
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


function fabricFor(piece) {

    const id =
        String(piece.decoration_type || "").startsWith("tint:") ? piece.decoration_type.slice(5) : null;

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


function topFor(piece) {

    return piece.room_area === "shelf"
        ? `${(piece.position_y * SHELF_SPAN) / 100}px`
        : `${piece.position_y}%`;

}

// room_area in the database → the part of the room it hangs on.
const AREAS = {
    wall: ".journal-zone",
    shelf: ".bookcase"
};

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
let paletteGroup = "room";

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
function artMarkup(asset) {
    return asset.src
        ? `<img class="decor-picture" src="${asset.src}?v=__VERSION__" width="${asset.size[0]}" height="${asset.size[1]}" alt="" draggable="false" loading="lazy">`
        : `<svg viewBox="${asset.box}" aria-hidden="true"><use href="#${asset.id}"></use></svg>`;
}


function layerFor(area) {

    const zone =
        room.querySelector(AREAS[area] || AREAS.wall);

    let layer =
        zone?.querySelector(":scope > .decor-layer");

    if (zone && !layer) {

        zone.insertAdjacentHTML("beforeend", `<div class="decor-layer" data-area="${area}"></div>`);

        layer = zone.lastElementChild;

    }

    return layer;

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
            class="placed-decor ${piece.id === selectedId ? "is-selected" : ""} ${asset.plain ? "placed-decor--plain" : ""}"
            data-decor-id="${piece.id}"
            style="left: ${piece.position_x}%; top: ${topFor(piece)}; width: ${asset.width}px; z-index: ${piece.z_index}; --scale: ${piece.scale}; --rotation: ${piece.rotation}deg${fabricStyle(piece)}"
            ${arranging ? html`tabindex="0" role="button" aria-label="${asset.name}. Drag to move, or use the arrow keys."` : html`aria-hidden="true"`}
        >
            ${raw(artMarkup(asset))}
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

        if (layer) {
            render(layer, pieces.filter((piece) => piece.room_area === area).map(pieceMarkup));
        }

    });

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

        // Leave room under the page for the tray on a phone.
        trayObserver = new ResizeObserver(() => {
            document.documentElement.style.setProperty("--arrange-tray", `${bar ? bar.offsetHeight : 0}px`);
        });

        trayObserver.observe(bar);

    }

    bar.dataset.side = traySide();
    bar.dataset.folded = String(trayFolded);

    const selected =
        pieces.find((piece) => piece.id === selectedId);

    render(bar, html`

        <div class="arrange-bar__head">
            <p class="arrange-bar__title">Edit the room</p>
            <button class="icon-button arrange-bar__fold" type="button" data-arrange="fold" aria-expanded="${String(!trayFolded)}" aria-label="${trayFolded ? "Show the panel" : "Hide the panel"}" title="${trayFolded ? "Show the panel" : "Hide the panel"}">
                ${art("ui-chevron-down")}
            </button>
            <button class="button button--primary button--small" type="button" data-arrange="done">Done</button>
        </div>

        <p class="arrange-bar__hint" ${selectedBuiltIn ? html`hidden` : ""}>${paletteGroup === "room"
            ? "Choose the wallpaper, floor, window, curtains and rug for this room."
            : "Tap a piece to add it to the part of the room you can see, or drag it straight to its spot. Drag pieces to move them."}</p>

        <div class="arrange-bar__tabs" role="tablist" aria-label="Kinds of decoration">
            <button class="arrange-bar__tab arrange-bar__tab--room ${paletteGroup === "room" ? "is-current" : ""}" type="button" role="tab" aria-selected="${String(paletteGroup === "room")}" data-decor-group="room">Room</button>
            ${DECOR_GROUPS.map((group) => html`
                <button class="arrange-bar__tab ${group.id === paletteGroup ? "is-current" : ""}" type="button" role="tab" aria-selected="${String(group.id === paletteGroup)}" data-decor-group="${group.id}">${group.name}</button>
            `)}
        </div>

        ${paletteGroup === "room" ? roomPanelMarkup() : html`<ul class="arrange-bar__palette" aria-label="Decorations to add">
            ${DECOR_ASSETS.filter((asset) => asset.group === paletteGroup).map((asset) => html`
                <li>
                    <button class="arrange-bar__asset ${asset.dark ? "arrange-bar__asset--dark" : ""} ${asset.plain ? "arrange-bar__asset--plain" : ""}" type="button" data-add-decor="${asset.id}" title="${asset.name}" aria-label="Add ${asset.name}">
                        ${raw(artMarkup(asset))}
                        <span class="arrange-bar__label" aria-hidden="true">${asset.name}</span>
                    </button>
                </li>
            `)}
        </ul>`}

        <button class="text-button arrange-bar__side" type="button" data-arrange="side">
            ${bar.dataset.side === "left" ? html`Move this panel to the right ${art("ui-chevron-right")}` : html`${art("ui-chevron-left")} Move this panel to the left`}
        </button>

    `);

}



/*
    The editor that pops up beside a piece tapped in the room:
    its size, tilt, layer, fabric colour, or taking it away.
*/

let editor = null;
let editorFrame = 0;

function drawEditor() {

    const selected =
        pieces.find((piece) => piece.id === selectedId);

    if (!arranging || (!selected && !selectedBuiltIn)) {
        editor?.remove();
        editor = null;
        cancelAnimationFrame(editorFrame);
        return;
    }

    if (!editor) {
        document.body.insertAdjacentHTML("beforeend", `<section class="piece-editor paper" aria-label="Edit this piece"></section>`);
        editor = document.body.lastElementChild;
        editor.addEventListener("click", onBarClick);
    }

    render(editor, html`
        <button class="icon-button piece-editor__close" type="button" data-arrange="deselect" aria-label="Close">${art("ui-close")}</button>
        ${selectedBuiltIn ? html`
            <div class="arrange-bar__tools arrange-bar__tools--built-in">
                <span class="arrange-bar__selected">${selectedBuiltIn.name}</span>
                <p class="arrange-bar__built-in-note">This came with the room. Take it out to make space for your own pieces; you can put it back in the Room tab.</p>
                <button class="button button--small arrange-bar__remove-built-in" type="button" data-arrange="remove-built-in">${art("ui-trash")} Take it out of the room</button>
            </div>
        ` : ""}

        ${selected ? html`<div class="arrange-bar__tools">
            <span class="arrange-bar__selected">${selected ? assetFor(selected.asset_id)?.name : ""}</span>
            <div class="arrange-bar__buttons">
                <button class="icon-button" type="button" data-arrange="smaller" aria-label="Smaller" title="Smaller">−</button>
                <button class="icon-button" type="button" data-arrange="bigger" aria-label="Bigger" title="Bigger">+</button>
                <button class="icon-button" type="button" data-arrange="tilt-left" aria-label="Tilt left" title="Tilt left">↺</button>
                <button class="icon-button" type="button" data-arrange="tilt-right" aria-label="Tilt right" title="Tilt right">↻</button>
                <button class="icon-button" type="button" data-arrange="back" aria-label="Send behind" title="Send behind">⤓</button>
                <button class="icon-button" type="button" data-arrange="forward" aria-label="Bring to front" title="Bring to front">⤒</button>
                <button class="icon-button" type="button" data-arrange="remove" aria-label="Remove" title="Remove">${art("ui-trash")}</button>
            </div>
            <p class="piece-editor__tip">Hold it with one finger and pinch with another to resize or turn it.</p>
            ${selected && assetFor(selected.asset_id)?.tint ? html`
                <div class="arrange-bar__fabrics" role="group" aria-label="Fabric colour">
                    <button class="arrange-bar__fabric arrange-bar__fabric--own ${fabricFor(selected) ? "" : "is-current"}" type="button" data-fabric="" title="Its own colours" aria-label="Its own colours"></button>
                    ${FABRICS.map((fabric) => html`
                        <button class="arrange-bar__fabric ${fabricFor(selected)?.id === fabric.id ? "is-current" : ""}" type="button" data-fabric="${fabric.id}" title="${fabric.name}" aria-label="${fabric.name}" style="background: linear-gradient(135deg, ${fabric.colours[1]} 0 35%, ${fabric.colours[0]} 35% 75%, ${fabric.colours[2]} 75%)"></button>
                    `)}
                </div>
            ` : ""}
        </div>` : ""}

    `);

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

    if (target) {

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

        let top =
            box.top - height - margin;

        if (top < 64) {
            top = box.bottom + margin;
        }

        left = clamp(left, 8, window.innerWidth - width - 8);
        top = clamp(top, 8, window.innerHeight - height - 8);

        editor.style.left = `${Math.round(left)}px`;
        editor.style.top = `${Math.round(top)}px`;

    }

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

            try {

                await updateRow("decorations", latest.id, {
                    decoration_type: latest.decoration_type,
                    room_area: latest.room_area,
                    position_x: latest.position_x,
                    position_y: latest.position_y,
                    scale: latest.scale,
                    rotation: latest.rotation,
                    z_index: latest.z_index
                });

            }

            catch (error) {
                toastError(error, "That decoration didn't save. Please try again.");
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
        tries.map(([x, y]) => areaAt(x, y)).find(Boolean)
        || Object.keys(AREAS).find((name) => layerShown(name));

    if (!area) {
        return null;
    }

    const box =
        room.querySelector(AREAS[area]).getBoundingClientRect();

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

function positionIn(area, pointX, pointY) {

    const zone =
        room.querySelector(AREAS[area]).getBoundingClientRect();

    const x =
        clamp(pointX, zone.left + 8, zone.right - 8);

    const y =
        clamp(pointY, zone.top + 8, zone.bottom - 28);

    const box =
        layerFor(area).getBoundingClientRect();

    // On the bookcase, pixels on screen are scaled pixels.
    const height =
        area === "shelf" ? SHELF_SPAN * caseZoom() : box.height;

    return {
        position_x: Number(clamp(((x - box.left) / box.width) * 100, 0, 100).toFixed(2)),
        position_y: Number(clamp(((y - box.top) / height) * 100, 0, 100).toFixed(2))
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

    try {

        const saved =
            await createRow("decorations", {
                asset_id: assetId,
                decoration_type: assetId.startsWith("frame-") ? "frame" : "ornament",
                room_area: spot.area,
                theme,
                ...positionIn(spot.area, spot.x, spot.y),
                scale: 1,
                rotation: 0,
                z_index: assetFor(assetId)?.floor ? 0 : Math.min(50, pieces.reduce((top, piece) => Math.max(top, piece.z_index), 0) + 1)
            });

        pieces.push({
            ...saved,
            position_x: Number(saved.position_x),
            position_y: Number(saved.position_y),
            scale: Number(saved.scale),
            rotation: Number(saved.rotation)
        });

        selectedId = saved.id;

        draw();

        const element =
            room.querySelector(`[data-decor-id="${saved.id}"]`);

        element?.focus({ preventScroll: true });

        element?.classList.add("is-new");

    }

    catch (error) {
        toastError(error, "That decoration couldn't be added.");
    }

}


async function removePiece(piece) {

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
    piece.position_y = Number(clamp(piece.position_y, 0, 100).toFixed(2));

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

    const tab =
        event.target.closest("[data-decor-group]");

    if (tab) {
        paletteGroup = tab.dataset.decorGroup;
        drawBar();
        bar.querySelector(`[data-decor-group="${paletteGroup}"]`)?.focus();
        return;
    }

    if (paletteGroup === "room" && onRoomPanelClick(event)) {

        // Redraw, keeping the panel where it was scrolled to.
        const scrolled =
            bar.querySelector(".arrange-bar__room")?.scrollTop || 0;

        drawBar();

        const panel =
            bar.querySelector(".arrange-bar__room");

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
        toast(`${selectedBuiltIn.name} taken out. Put it back any time from the Room tab.`);
        selectBuiltIn(null);
        return;
    }

    if (action === "done") {
        setArranging(false);
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

            tinted.decoration_type = fabricButton.dataset.fabric ? `tint:${fabricButton.dataset.fabric}` : "ornament";

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

    const changes = {
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

    adjust(piece, changes[action]);

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

        // The room stays one screen tall and a tall bookcase
        // scrolls by itself; near its top or bottom, scroll it.
        const caseZone =
            room.querySelector(".bookcase-zone");

        const shelves =
            caseZone && caseZone.scrollHeight > caseZone.clientHeight + 1
                ? caseZone
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

    select(piece.id);

    element.classList.remove("is-new");

    element.setPointerCapture(event.pointerId);
    element.classList.add("is-dragging");

    bar?.classList.add("is-dragging");

    const pointer = {
        x: event.clientX,
        y: event.clientY
    };

    const place = () => {

        const area =
            areaAt(pointer.x, pointer.y) || piece.room_area;

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

        adjust(piece, positionIn(area, pointer.x, pointer.y));

    };

    // The second finger, while it's down.
    let pinch = null;

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
            pointer.x = moveEvent.clientX;
            pointer.y = moveEvent.clientY;
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
            if (!pinch) {
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

    return Object.keys(AREAS).find((area) => {

        if (!layerShown(area)) {
            return false;
        }

        const box =
            room.querySelector(AREAS[area]).getBoundingClientRect();

        return x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;

    });

}


function onKeyDown(event) {

    const element =
        event.target.closest?.(".placed-decor");

    if (!arranging) {
        return;
    }

    if (event.key === "Escape") {
        setArranging(false);
        return;
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
        ArrowUp: { position_y: piece.position_y - step },
        ArrowDown: { position_y: piece.position_y + step },
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
        adjust(piece, moves[event.key]);
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

    if (on) {
        bar?.querySelector("[data-add-decor]")?.focus();
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
        }));

    }

    catch (error) {

        console.error(error);

        pieces = [];

    }

    selectedId = null;

    draw();

}


export async function startDecorations(container, themeId) {

    room = container;

    if (!room) {
        return;
    }

    room.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    room.addEventListener("focusin", (event) => {

        const element =
            event.target.closest(".placed-decor");

        if (arranging && element) {
            select(element.dataset.decorId);
        }

    });

    document.addEventListener("novellow:arrange", () => setArranging(!arranging));

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
