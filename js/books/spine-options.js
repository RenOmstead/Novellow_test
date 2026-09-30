/* =========================================================
   NOVELLOW
   BOOK DESIGN OPTIONS

   Everything a spine can be: fonts, styles, title panels,
   ornaments, sizes and palettes. A book's choices are saved
   in books.spine (jsonb).
========================================================= */

import { seededRandom } from "../core/helpers.js?v=__VERSION__";


export const SPINE_FONTS = [
    { id: "fell", label: "IM Fell — engraved", family: "'IM Fell English SC', Georgia, serif" },
    { id: "fraunces", label: "Fraunces — storybook", family: "'Fraunces', Georgia, serif" },
    { id: "cormorant", label: "Cormorant — elegant", family: "'Cormorant Garamond', Georgia, serif" },
    { id: "averia", label: "Averia — old book", family: "'Averia Serif Libre', Georgia, serif" },
    { id: "swash", label: "Berkshire Swash — whimsical", family: "'Berkshire Swash', Georgia, cursive" },
    { id: "cinzel", label: "Cinzel — classical", family: "'Cinzel', Georgia, serif" },
    { id: "almendra", label: "Almendra — fairytale", family: "'Almendra', Georgia, serif" },
    { id: "uncial", label: "Uncial — ancient", family: "'Uncial Antiqua', Georgia, serif" },
    { id: "gothic", label: "Grenze Gotisch — gothic", family: "'Grenze Gotisch', Georgia, serif" },
    { id: "playfair", label: "Playfair — editorial", family: "'Playfair Display', Georgia, serif" },
    { id: "hand", label: "Patrick Hand — handwritten", family: "'Patrick Hand', cursive" }
];


export const SPINE_STYLES = [
    { id: "classic", label: "Classic bands" },
    { id: "panel", label: "Arched panel" },
    { id: "lattice", label: "Diamond lattice" },
    { id: "vine", label: "Climbing vine" },
    { id: "banded", label: "Raised leather bands" },
    { id: "cloth", label: "Linen cloth" },
    { id: "starry", label: "Starry night" },
    { id: "plain", label: "Plain" },
    { id: "rosestem", label: "Rose stem" },
    { id: "wildflowers", label: "Wildflowers" },
    { id: "fern", label: "Fern frond" },
    { id: "mycelium", label: "Mushrooms and roots" },
    { id: "serpent", label: "Serpent" },
    { id: "dagger", label: "Dagger" },
    { id: "moonphases", label: "Moon phases" },
    { id: "constellation", label: "Constellation" },
    { id: "filigree", label: "Gilded filigree" },
    { id: "garden", label: "Painted garden" },
    { id: "strawberries", label: "Strawberry patch" },
    { id: "painted-moon", label: "Painted: Crescent moon" },
    { id: "painted-maple", label: "Painted: Maple leaf" },
    { id: "painted-mushroom", label: "Painted: Toadstools" },
    { id: "painted-ghost", label: "Painted: Little ghosts" },
    { id: "painted-bat", label: "Painted: Bat and star" },
    { id: "painted-starlight", label: "Painted: Starlight" },
    { id: "painted-damask", label: "Painted: Damask" },
    { id: "painted-fern", label: "Painted: Fern" },
    { id: "painted-potion", label: "Painted: Potion bottles" },
    { id: "painted-compass-star", label: "Painted: Compass star" },
    { id: "painted-moth", label: "Painted: Moon moth" },
    { id: "painted-antique", label: "Painted: Antique leather" },
    { id: "painted-slasher", label: "Painted: Slasher stripes" },
    { id: "painted-film-reel", label: "Painted: Film reel" },
    { id: "painted-blood-moon", label: "Painted: Blood moon" },
    { id: "painted-plaid", label: "Painted: Red plaid" },
    { id: "painted-pine-forest", label: "Painted: Pine forest" },
    { id: "painted-eye", label: "Painted: All-seeing eye" },
    { id: "painted-cathedral", label: "Painted: Cathedral window" },
    { id: "painted-lightning", label: "Painted: Violet lightning" },
    { id: "painted-sunburst", label: "Painted: Sunburst" },
    { id: "painted-treasure-map", label: "Painted: Treasure map" },
    { id: "painted-gothic-arch", label: "Painted: Gothic arch" },
    { id: "painted-claw-marks", label: "Painted: Claw marks" },
    { id: "painted-pumpkin", label: "Painted: Pumpkin" },
    { id: "painted-cauldron", label: "Painted: Cauldron" },
    { id: "painted-moth-pink", label: "Painted: Pink moth" },
    { id: "painted-toadstool", label: "Painted: Toadstool" },
    { id: "painted-moon-cream", label: "Painted: Cream crescent" },
    { id: "painted-raven", label: "Painted: Raven" },
    { id: "painted-lavender", label: "Painted: Lavender" },
    { id: "painted-flower-skull", label: "Painted: Flower skull" },
    { id: "painted-amethyst", label: "Painted: Amethyst" },
    { id: "painted-black-cat", label: "Painted: Black cat" },
    { id: "painted-star-lantern", label: "Painted: Star lantern" },
    { id: "painted-bat-black", label: "Painted: Black bat" },
    { id: "painted-gothic-window", label: "Painted: Gothic window" },
    { id: "painted-torn-red", label: "Painted: Torn red" },
    { id: "painted-cobweb-lilac", label: "Painted: Lilac cobweb" },
    { id: "painted-stained-glass", label: "Painted: Stained glass" },
    { id: "painted-thorn-frame", label: "Painted: Thorn frame" },
    { id: "painted-fleur-green", label: "Painted: Green fleur-de-lis" },
    { id: "painted-gilded-decay", label: "Painted: Gilded decay" },
    { id: "painted-ghost-cameo", label: "Painted: Ghost cameo" },
    { id: "painted-skeleton-keys", label: "Painted: Skeleton keys" },
    { id: "painted-gargoyle", label: "Painted: Gargoyle" },
    { id: "painted-candelabra", label: "Painted: Candelabra" },
    { id: "painted-rose-vine", label: "Painted: Rose vine" },
    { id: "painted-claw-red", label: "Painted: Red claws" },
    { id: "painted-checkerboard", label: "Painted: Checkerboard" },
    { id: "painted-film-strip", label: "Painted: Film strip" },
    { id: "painted-dead-tree", label: "Painted: Dead tree" },
    { id: "painted-footprints", label: "Painted: Footprints" },
    { id: "painted-chains", label: "Painted: Chains" },
    { id: "painted-stitched-mask", label: "Painted: Stitched mask" },
    { id: "painted-button-doll", label: "Painted: Button doll" },
    { id: "painted-cabin-woods", label: "Painted: Cabin in the woods" },
    { id: "painted-bloody-hand", label: "Painted: Bloody hand" },
    { id: "painted-red-lightning", label: "Painted: Red lightning" },
    { id: "painted-eye-lock", label: "Painted: Eye and lock" }
];


/*
    Hand-painted spines: a picture the length of the book, with
    the title in its panel. Their colours come from the picture,
    so each sets its own title colour.
*/

export const SPINE_PAINTED = {
    "painted-moon": { src: "assets/spines/painted/moon.webp", text: "#f3dca6" },
    "painted-maple": { src: "assets/spines/painted/maple.webp", text: "#fff1d8" },
    "painted-mushroom": { src: "assets/spines/painted/mushroom.webp", text: "#fff4dc" },
    "painted-ghost": { src: "assets/spines/painted/ghost.webp", text: "#3b2a2a" },
    "painted-bat": { src: "assets/spines/painted/bat.webp", text: "#f3dca6" },
    "painted-starlight": { src: "assets/spines/painted/starlight.webp", text: "#fff1e4" },
    "painted-damask": { src: "assets/spines/painted/damask.webp", text: "#fbe6d6" },
    "painted-fern": { src: "assets/spines/painted/fern.webp", text: "#f7f0d8" },
    "painted-potion": { src: "assets/spines/painted/potion.webp", text: "#fff1dc" },
    "painted-compass-star": { src: "assets/spines/painted/compass_star.webp", text: "#3b2a1e" },
    "painted-moth": { src: "assets/spines/painted/moth.webp", text: "#3b2336" },
    "painted-antique": { src: "assets/spines/painted/antique.webp", text: "#f3dca6" },
    "painted-slasher": { src: "assets/spines/painted/slasher.webp", text: "#f2e4d6" },
    "painted-film-reel": { src: "assets/spines/painted/film_reel.webp", text: "#fff1ff" },
    "painted-blood-moon": { src: "assets/spines/painted/blood_moon.webp", text: "#f2d0b8" },
    "painted-plaid": { src: "assets/spines/painted/plaid.webp", text: "#fff0e4" },
    "painted-pine-forest": { src: "assets/spines/painted/pine_forest.webp", text: "#2c2c3a" },
    "painted-eye": { src: "assets/spines/painted/eye.webp", text: "#2e2a14" },
    "painted-cathedral": { src: "assets/spines/painted/cathedral.webp", text: "#3b2a2a" },
    "painted-lightning": { src: "assets/spines/painted/lightning.webp", text: "#fbe8ff" },
    "painted-sunburst": { src: "assets/spines/painted/sunburst.webp", text: "#3a1c0c" },
    "painted-treasure-map": { src: "assets/spines/painted/treasure_map.webp", text: "#3b2a1e" },
    "painted-gothic-arch": { src: "assets/spines/painted/gothic_arch.webp", text: "#f5e2ec" },
    "painted-claw-marks": { src: "assets/spines/painted/claw_marks.webp", text: "#f7e2dc" },
    "painted-pumpkin": { src: "assets/spines/painted/pumpkin.webp", text: "#3a2626" },
    "painted-cauldron": { src: "assets/spines/painted/cauldron.webp", text: "#fbeedd" },
    "painted-moth-pink": { src: "assets/spines/painted/moth_pink.webp", text: "#3a2626" },
    "painted-toadstool": { src: "assets/spines/painted/toadstool.webp", text: "#3a2626" },
    "painted-moon-cream": { src: "assets/spines/painted/moon_cream.webp", text: "#3a2626" },
    "painted-raven": { src: "assets/spines/painted/raven.webp", text: "#fbeedd" },
    "painted-lavender": { src: "assets/spines/painted/lavender.webp", text: "#fbeedd" },
    "painted-flower-skull": { src: "assets/spines/painted/flower_skull.webp", text: "#3a2626" },
    "painted-amethyst": { src: "assets/spines/painted/amethyst.webp", text: "#3a2626" },
    "painted-black-cat": { src: "assets/spines/painted/black_cat.webp", text: "#fbeedd" },
    "painted-star-lantern": { src: "assets/spines/painted/star_lantern.webp", text: "#3a2626" },
    "painted-bat-black": { src: "assets/spines/painted/bat_black.webp", text: "#fbeedd" },
    "painted-gothic-window": { src: "assets/spines/painted/gothic_window.webp", text: "#fbeedd" },
    "painted-torn-red": { src: "assets/spines/painted/torn_red.webp", text: "#fbeedd" },
    "painted-cobweb-lilac": { src: "assets/spines/painted/cobweb_lilac.webp", text: "#fbeedd" },
    "painted-stained-glass": { src: "assets/spines/painted/stained_glass.webp", text: "#3a2626" },
    "painted-thorn-frame": { src: "assets/spines/painted/thorn_frame.webp", text: "#fbeedd" },
    "painted-fleur-green": { src: "assets/spines/painted/fleur_green.webp", text: "#fbeedd" },
    "painted-gilded-decay": { src: "assets/spines/painted/gilded_decay.webp", text: "#fbeedd" },
    "painted-ghost-cameo": { src: "assets/spines/painted/ghost_cameo.webp", text: "#fbeedd" },
    "painted-skeleton-keys": { src: "assets/spines/painted/skeleton_keys.webp", text: "#3a2626" },
    "painted-gargoyle": { src: "assets/spines/painted/gargoyle.webp", text: "#fbeedd" },
    "painted-candelabra": { src: "assets/spines/painted/candelabra.webp", text: "#fbeedd" },
    "painted-rose-vine": { src: "assets/spines/painted/rose_vine.webp", text: "#fbeedd" },
    "painted-claw-red": { src: "assets/spines/painted/claw_red.webp", text: "#fbeedd" },
    "painted-checkerboard": { src: "assets/spines/painted/checkerboard.webp", text: "#fbeedd" },
    "painted-film-strip": { src: "assets/spines/painted/film_strip.webp", text: "#fbeedd" },
    "painted-dead-tree": { src: "assets/spines/painted/dead_tree.webp", text: "#fbeedd" },
    "painted-footprints": { src: "assets/spines/painted/footprints.webp", text: "#3a2626" },
    "painted-chains": { src: "assets/spines/painted/chains.webp", text: "#fbeedd" },
    "painted-stitched-mask": { src: "assets/spines/painted/stitched_mask.webp", text: "#fbeedd" },
    "painted-button-doll": { src: "assets/spines/painted/button_doll.webp", text: "#fbeedd" },
    "painted-cabin-woods": { src: "assets/spines/painted/cabin_woods.webp", text: "#fbeedd" },
    "painted-bloody-hand": { src: "assets/spines/painted/bloody_hand.webp", text: "#fbeedd" },
    "painted-red-lightning": { src: "assets/spines/painted/red_lightning.webp", text: "#fbeedd" },
    "painted-eye-lock": { src: "assets/spines/painted/eye_lock.webp", text: "#fbeedd" }
};


/*
    Styles drawn as one picture the whole length of the spine
    (behind the title), and the drawing each one uses.
*/

export const SPINE_ART = {
    vine: "leafvine",
    rosestem: "rosestem",
    wildflowers: "wildflowers",
    fern: "fern",
    mycelium: "mycelium",
    serpent: "serpent",
    dagger: "dagger",
    moonphases: "moonphases",
    constellation: "constellation",
    filigree: "filigree",
    garden: "garden",
    strawberries: "strawberries"
};


export const TITLE_PANELS = [
    { id: "none", label: "No panel" },
    { id: "label", label: "Paper label" },
    { id: "arch", label: "Arched window" },
    { id: "oval", label: "Oval cartouche" },
    { id: "ribbon", label: "Ribbon band" },
    { id: "hidden", label: "No title (just the picture)" }
];


export const ORNAMENTS = [
    { id: "none", label: "None" },
    { id: "moon", label: "Moon" },
    { id: "star", label: "Star" },
    { id: "moth", label: "Moth" },
    { id: "butterfly", label: "Butterfly" },
    { id: "mushroom", label: "Mushroom" },
    { id: "teacup", label: "Teacup" },
    { id: "cat", label: "Cat" },
    { id: "house", label: "Tiny house" },
    { id: "key", label: "Key" },
    { id: "bird", label: "Bird" },
    { id: "crow", label: "Crow" },
    { id: "lantern", label: "Lantern" },
    { id: "candle", label: "Candle" },
    { id: "skull", label: "Skull" },
    { id: "flower", label: "Flower" },
    { id: "sprig", label: "Botanical sprig" },
    { id: "potion", label: "Potion" },
    { id: "heart", label: "Heart" },
    { id: "castle", label: "Castle" },
    { id: "feather", label: "Feather" },
    { id: "eye", label: "Mystic eye" },
    { id: "fleur", label: "Fleur-de-lis" },
    { id: "diamond", label: "Diamond" },
    { id: "rose", label: "Rose" },
    { id: "snake", label: "Snake" },
    { id: "dagger-small", label: "Dagger" },
    { id: "fern-small", label: "Fern" },
    { id: "toadstools", label: "Toadstools" },
    { id: "moons", label: "Three moons" },
    { id: "sun", label: "Sun" },
    { id: "crown", label: "Crown" },
    { id: "quill", label: "Quill" },
    { id: "witchhat", label: "Witch's hat" },
    { id: "crystalball", label: "Crystal ball" },
    { id: "pentacle", label: "Pentacle" },
    { id: "planchette", label: "Planchette" },
    { id: "hand", label: "Skeleton hand" },
    { id: "ghost", label: "Ghost" },
    { id: "bat", label: "Bat" },
    { id: "pumpkin", label: "Pumpkin" },
    { id: "spider", label: "Spider" }
];


export const MOTIF_VIEWBOX = {
    moon: "0 0 20 20",
    star: "0 0 20 20",
    moth: "0 0 24 22",
    butterfly: "0 0 24 20",
    mushroom: "0 0 20 20",
    teacup: "0 0 24 22",
    cat: "0 0 20 28",
    house: "0 0 22 24",
    key: "0 0 16 40",
    bird: "0 0 26 20",
    crow: "0 0 24 22",
    lantern: "0 0 16 28",
    candle: "0 0 14 28",
    skull: "0 0 20 20",
    flower: "0 0 20 20",
    sprig: "0 0 20 40",
    potion: "0 0 20 26",
    heart: "0 0 20 20",
    castle: "0 0 24 26",
    feather: "0 0 16 34",
    eye: "0 0 24 16",
    fleur: "0 0 20 26",
    diamond: "0 0 20 28",
    leafvine: "0 0 16 60",
    rosestem: "0 0 16 60",
    wildflowers: "0 0 16 60",
    fern: "0 0 16 60",
    mycelium: "0 0 16 60",
    serpent: "0 0 16 60",
    dagger: "0 0 16 60",
    moonphases: "0 0 16 60",
    constellation: "0 0 16 60",
    filigree: "0 0 16 60",
    garden: "0 0 16 60",
    strawberries: "0 0 16 60",
    rose: "0 0 20 20",
    snake: "0 0 20 24",
    "dagger-small": "0 0 12 34",
    "fern-small": "0 0 16 34",
    toadstools: "0 0 22 20",
    moons: "0 0 12 30",
    sun: "0 0 22 22",
    crown: "0 0 22 16",
    quill: "0 0 14 34",
    witchhat: "0 0 24 22",
    crystalball: "0 0 20 22",
    pentacle: "0 0 20 20",
    planchette: "0 0 20 24",
    hand: "0 0 20 26",
    ghost: "0 0 18 22",
    bat: "0 0 26 14",
    pumpkin: "0 0 22 20",
    spider: "0 0 20 22"
};


export const HEIGHTS = [
    { id: "short", label: "Short", px: 104 },
    { id: "medium", label: "Medium", px: 118 },
    { id: "tall", label: "Tall", px: 130 },
    { id: "grand", label: "Grand", px: 142 }
];


export const THICKNESS = [
    { id: "slim", label: "Slim", px: 30 },
    { id: "medium", label: "Medium", px: 40 },
    { id: "chunky", label: "Chunky", px: 54 }
];


export const FONT_SIZES = [
    { id: "small", label: "Small", px: 12 },
    { id: "medium", label: "Medium", px: 14 },
    { id: "large", label: "Large", px: 17 }
];


export const FONT_WEIGHTS = [
    { id: "regular", label: "Regular", value: 400 },
    { id: "bold", label: "Bold", value: 700 }
];


export const LETTER_SPACING = [
    { id: "tight", label: "Tight", value: "0" },
    { id: "normal", label: "Normal", value: "0.04em" },
    { id: "wide", label: "Wide", value: "0.14em" }
];


export const TEXT_CASES = [
    { id: "as-typed", label: "As typed" },
    { id: "upper", label: "UPPERCASE" },
    { id: "small-caps", label: "Small caps" }
];


export const FONT_STYLES = [
    { id: "normal", label: "Upright" },
    { id: "italic", label: "Italic" }
];


export const ALIGNMENTS = [
    { id: "top", label: "Near the top" },
    { id: "center", label: "Centred" },
    { id: "bottom", label: "Near the bottom" }
];


/*
    Storybook colour pairings: cover, ornaments, title text.
*/

export const PALETTE = [
    { color: "#74444f", accent: "#ecc68a", text: "#f6e0b6" },
    { color: "#34503f", accent: "#d8b27a", text: "#f3ddb2" },
    { color: "#dca4a6", accent: "#4a2f36", text: "#3b2a2e" },
    { color: "#3b3560", accent: "#ecc68a", text: "#f3ddb2" },
    { color: "#c86f7e", accent: "#f6e0b6", text: "#fff3dc" },
    { color: "#2f5552", accent: "#e2b76c", text: "#f3ddb2" },
    { color: "#6a5486", accent: "#f0cf8a", text: "#fbe7c4" },
    { color: "#e6d2ac", accent: "#6e4029", text: "#4a2f1e" },
    { color: "#a1493f", accent: "#f0cf8a", text: "#fbe7c4" },
    { color: "#2f3552", accent: "#e2b76c", text: "#f3ddb2" },
    { color: "#5f7d45", accent: "#f3ddb2", text: "#fbf0d8" },
    { color: "#5b3a52", accent: "#ecc68a", text: "#f6e0b6" },
    { color: "#b0654e", accent: "#f3ddb2", text: "#fff3dc" },
    { color: "#9fa883", accent: "#3f3328", text: "#2f261e" },
    { color: "#c69a4a", accent: "#4a2f1e", text: "#3a2416" },
    { color: "#4a2230", accent: "#e2b76c", text: "#f3ddb2" },
    { color: "#7b5d8c", accent: "#f0cf8a", text: "#fbe7c4" },
    { color: "#d98f9c", accent: "#fbe7d0", text: "#4a2330" }
];


/* =========================================================
   DEFAULTS
========================================================= */

function pick(list, random) {
    return list[Math.floor(random() * list.length)];
}


/*
    A pleasant starting design, chosen from the title so the
    same book always gets the same look until it's changed.
*/

export function suggestedSpine(seedText = "") {

    const random =
        seededRandom(seedText || String(Math.random()));

    const colors =
        pick(PALETTE, random);

    return {
        style: pick(["classic", "panel", "lattice", "vine", "banded", "cloth", "starry", "rosestem", "fern", "moonphases", "filigree"], random),
        color: colors.color,
        accent: colors.accent,
        text: colors.text,
        font: pick(["fell", "fraunces", "cormorant", "averia", "cinzel", "almendra", "playfair"], random),
        size: "medium",
        weight: pick(["regular", "bold"], random),
        spacing: pick(["normal", "wide"], random),
        textCase: pick(["as-typed", "upper", "small-caps"], random),
        fontStyle: random() > 0.85 ? "italic" : "normal",
        align: "center",
        panel: pick(["none", "label", "arch", "oval", "ribbon"], random),
        ornament: pick(["moon", "star", "moth", "mushroom", "teacup", "cat", "house", "key", "bird", "lantern", "flower", "sprig", "fleur", "rose", "crown", "sun", "toadstools", "quill"], random),
        height: pick(["medium", "tall", "tall", "grand"], random),
        thickness: pick(["slim", "medium", "medium", "chunky"], random)
    };

}


const VALID = {
    style: SPINE_STYLES.map((item) => item.id),
    font: SPINE_FONTS.map((item) => item.id),
    size: FONT_SIZES.map((item) => item.id),
    weight: FONT_WEIGHTS.map((item) => item.id),
    spacing: LETTER_SPACING.map((item) => item.id),
    textCase: TEXT_CASES.map((item) => item.id),
    fontStyle: FONT_STYLES.map((item) => item.id),
    align: ALIGNMENTS.map((item) => item.id),
    panel: TITLE_PANELS.map((item) => item.id),
    ornament: ORNAMENTS.map((item) => item.id),
    height: HEIGHTS.map((item) => item.id),
    thickness: THICKNESS.map((item) => item.id)
};


const HEX =
    /^#[0-9a-f]{6}$/i;


/*
    Fills in anything missing or unrecognised, so older or
    imported books always render.
*/

export function normalizeSpine(spine = {}, seedText = "") {

    const fallback =
        suggestedSpine(seedText);

    const result = { ...fallback };

    Object.keys(VALID).forEach((key) => {

        if (VALID[key].includes(spine?.[key])) {
            result[key] = spine[key];
        }

    });

    ["color", "accent", "text"].forEach((key) => {

        if (HEX.test(spine?.[key] || "")) {
            result[key] = spine[key];
        }

    });

    return result;

}


export function spineWidth(spine) {
    return THICKNESS.find((item) => item.id === spine.thickness)?.px || 40;
}


export function spineHeight(spine) {
    return HEIGHTS.find((item) => item.id === spine.height)?.px || 118;
}


export function spineFont(spine) {
    return SPINE_FONTS.find((item) => item.id === spine.font)?.family || SPINE_FONTS[0].family;
}
