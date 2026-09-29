/* =========================================================
   NOVELLOW
   READER AVATARS

   A reader's avatar is a handful of choices (profiles.avatar,
   see sql/public.sql): skin, body, face, hair, clothes, shoes,
   a wrap, something on their head and, if they like, a little
   companion. From them this draws one storybook reader,
   standing with a book held to their chest, in soft brown
   ink like the room:

     avatarFigure(avatar)    the whole reader, for their room
                             and the avatar maker
     avatarPortrait(avatar)  the same drawing, head and
                             shoulders in a circle, for profiles,
                             friend cards, posts and the header

   Both are plain SVG strings, built only from the choices
   below (never from text a reader typed), so they're safe to
   drop into the page.

   Everything is drawn in one set of coordinates: the face is
   centred on x = 50, the chin sits at y = 70 and the feet at
   y = 194.
========================================================= */

const LINE = "#4a2c2c";

const CREAM = "#f6ead2";

const GOLD = "#e0ad4f";


/* =========================================================
   THE CHOICES
========================================================= */

export const SKIN_TONES = [
    { id: "porcelain", label: "Porcelain", color: "#fbe6d8" },
    { id: "peach", label: "Peach", color: "#f6d0b6" },
    { id: "sand", label: "Sand", color: "#ebbb98" },
    { id: "honey", label: "Honey", color: "#d9a173" },
    { id: "caramel", label: "Caramel", color: "#bd7f53" },
    { id: "bronze", label: "Bronze", color: "#9c613c" },
    { id: "umber", label: "Umber", color: "#77472c" },
    { id: "ebony", label: "Ebony", color: "#533222" }
];

export const BUILDS = [
    { id: "slim", label: "Slim", shoulders: 15, waist: 11.5, hips: 12.5 },
    { id: "average", label: "In between", shoulders: 16.5, waist: 13, hips: 14 },
    { id: "curvy", label: "Soft & curvy", shoulders: 17, waist: 15.5, hips: 18 },
    { id: "broad", label: "Broad", shoulders: 19.5, waist: 16, hips: 15 }
];

export const FACE_SHAPES = [
    { id: "round", label: "Round" },
    { id: "oval", label: "Oval" },
    { id: "heart", label: "Heart" },
    { id: "soft-square", label: "Soft square" }
];

export const EYES = [
    { id: "sleepy", label: "Lost in a book" },
    { id: "round", label: "Round" },
    { id: "sparkly", label: "Big & sparkly" },
    { id: "happy", label: "Happy" },
    { id: "lashes", label: "Lashes" },
    { id: "almond", label: "Almond" },
    { id: "monolid", label: "Monolid" }
];

export const EYE_COLORS = [
    { id: "brown", label: "Brown", color: "#5a3320" },
    { id: "hazel", label: "Hazel", color: "#8a6a2e" },
    { id: "amber", label: "Amber", color: "#b9772a" },
    { id: "green", label: "Green", color: "#4f7a45" },
    { id: "blue", label: "Blue", color: "#4a6f9e" },
    { id: "grey", label: "Grey", color: "#7a8088" },
    { id: "violet", label: "Violet", color: "#7a5a9a" }
];

export const MOUTHS = [
    { id: "smile", label: "Smile" },
    { id: "grin", label: "Grin" },
    { id: "calm", label: "Calm" },
    { id: "smirk", label: "Smirk" },
    { id: "cat", label: "Cat smile" }
];

export const HAIR_STYLES = [
    { id: "waves", label: "Long waves" },
    { id: "long", label: "Long & straight" },
    { id: "half-up", label: "Half up" },
    { id: "curly", label: "Big curls" },
    { id: "coils", label: "Coils" },
    { id: "bob", label: "Bob & fringe" },
    { id: "short", label: "Short crop" },
    { id: "pixie", label: "Pixie" },
    { id: "bun", label: "Messy bun" },
    { id: "space-buns", label: "Space buns" },
    { id: "ponytail", label: "Ponytail" },
    { id: "braids", label: "Braids" },
    { id: "locs", label: "Locs" },
    { id: "none", label: "Bald" }
];

export const HAIR_COLORS = [
    { id: "black", label: "Black", color: "#2e2226" },
    { id: "espresso", label: "Espresso", color: "#4d3226" },
    { id: "chestnut", label: "Chestnut", color: "#7a4a2c" },
    { id: "auburn", label: "Auburn", color: "#9c4a2c" },
    { id: "copper", label: "Copper", color: "#c96a36" },
    { id: "honey", label: "Honey blonde", color: "#dba95e" },
    { id: "platinum", label: "Platinum", color: "#f0e2c0" },
    { id: "silver", label: "Silver", color: "#bdb8b2" },
    { id: "plum", label: "Plum", color: "#6e3b58" },
    { id: "rose", label: "Rose", color: "#e29aae" },
    { id: "sage", label: "Sage", color: "#86a074" },
    { id: "midnight", label: "Midnight blue", color: "#34416b" }
];

export const FACIAL_HAIR = [
    { id: "none", label: "None" },
    { id: "stubble", label: "Stubble" },
    { id: "moustache", label: "Moustache" },
    { id: "beard", label: "Beard" }
];

export const GLASSES = [
    { id: "none", label: "None" },
    { id: "round", label: "Round" },
    { id: "cateye", label: "Cat-eye" },
    { id: "halfmoon", label: "Half-moon" },
    { id: "square", label: "Square" }
];

export const TOPS = [
    { id: "sweater", label: "Chunky sweater" },
    { id: "fair-isle", label: "Fair Isle sweater" },
    { id: "moon-sweater", label: "Moon sweater" },
    { id: "cardigan", label: "Cardigan" },
    { id: "turtleneck", label: "Turtleneck" },
    { id: "hoodie", label: "Hoodie" },
    { id: "collar", label: "Collared blouse" },
    { id: "shirt", label: "Button shirt" },
    { id: "tee", label: "T-shirt" }
];

export const TOP_COLORS = [
    { id: "plum", label: "Plum", color: "#6e3b58" },
    { id: "berry", label: "Berry", color: "#9b3e5a" },
    { id: "rose", label: "Rose", color: "#e2a0ad" },
    { id: "rust", label: "Rust", color: "#b0603c" },
    { id: "mustard", label: "Mustard", color: "#d2a041" },
    { id: "sage", label: "Sage", color: "#8aa07a" },
    { id: "forest", label: "Forest", color: "#4a6a4e" },
    { id: "navy", label: "Navy", color: "#3a4872" },
    { id: "lilac", label: "Lilac", color: "#b49ac8" },
    { id: "cream", label: "Cream", color: "#efe2c8" },
    { id: "oat", label: "Oat", color: "#cdb593" },
    { id: "charcoal", label: "Charcoal", color: "#403a3e" }
];

export const BOTTOMS = [
    { id: "trousers", label: "Trousers" },
    { id: "jeans", label: "Rolled jeans" },
    { id: "wide", label: "Wide trousers" },
    { id: "skirt", label: "Skirt" },
    { id: "pleated", label: "Plaid skirt" },
    { id: "long-skirt", label: "Long skirt" },
    { id: "shorts", label: "Shorts" },
    { id: "overalls", label: "Overalls" },
    { id: "pinafore", label: "Pinafore" }
];

export const BOTTOM_COLORS = [
    { id: "denim", label: "Denim", color: "#5d7ca6" },
    { id: "indigo", label: "Indigo", color: "#3a4a72" },
    { id: "charcoal", label: "Charcoal", color: "#403a3e" },
    { id: "cocoa", label: "Cocoa", color: "#6b4a3a" },
    { id: "oat", label: "Oat", color: "#d6c3a2" },
    { id: "plum", label: "Plum", color: "#6e3b58" },
    { id: "berry", label: "Berry", color: "#9b3e5a" },
    { id: "rust", label: "Rust", color: "#b0603c" },
    { id: "mustard", label: "Mustard", color: "#d2a041" },
    { id: "forest", label: "Forest", color: "#4a6a4e" },
    { id: "sage", label: "Sage", color: "#8aa07a" },
    { id: "rose", label: "Rose", color: "#e2a0ad" }
];

export const LEGWEAR = [
    { id: "bare", label: "Bare" },
    { id: "knee-socks", label: "Knee socks" },
    { id: "striped", label: "Striped socks" },
    { id: "tights", label: "Tights" }
];

export const SHOES = [
    { id: "boots", label: "Lace-up boots" },
    { id: "tall-boots", label: "Tall boots" },
    { id: "mary-janes", label: "Mary Janes" },
    { id: "sneakers", label: "Sneakers" },
    { id: "slippers", label: "Bunny slippers" },
    { id: "socks", label: "Cozy socks" }
];

export const WRAPS = [
    { id: "none", label: "None" },
    { id: "scarf", label: "Cozy scarf" },
    { id: "quilt", label: "Patchwork quilt" },
    { id: "shawl", label: "Knitted shawl" },
    { id: "cloak", label: "Hooded cloak" }
];

export const EXTRAS = [
    { id: "none", label: "None" },
    { id: "witch-hat", label: "Witch hat" },
    { id: "beret", label: "Beret" },
    { id: "flower-crown", label: "Flower crown" },
    { id: "bow", label: "Hair bow" },
    { id: "star-clips", label: "Star clips" },
    { id: "headscarf", label: "Headscarf" },
    { id: "headphones", label: "Headphones" },
    { id: "cat-ears", label: "Cat ears" }
];

export const COMPANIONS = [
    { id: "none", label: "None" },
    { id: "cat-ginger", label: "Ginger cat" },
    { id: "cat-black", label: "Black cat" },
    { id: "cat-grey", label: "Grey cat" },
    { id: "cat-calico", label: "Calico cat" },
    { id: "puppy", label: "Puppy" },
    { id: "raven", label: "Raven" },
    { id: "dragon", label: "Little dragon" }
];

// Everything the maker offers, in the order it shows them.
export const AVATAR_PARTS = [
    { key: "skin", label: "Skin", options: SKIN_TONES, swatch: true },
    { key: "build", label: "Body", options: BUILDS },
    { key: "face", label: "Face", options: FACE_SHAPES },
    { key: "eyes", label: "Eyes", options: EYES },
    { key: "eyeColor", label: "Eye colour", options: EYE_COLORS, swatch: true },
    { key: "mouth", label: "Mouth", options: MOUTHS },
    { key: "hair", label: "Hair", options: HAIR_STYLES },
    { key: "hairColor", label: "Hair colour", options: HAIR_COLORS, swatch: true },
    { key: "facialHair", label: "Facial hair", options: FACIAL_HAIR },
    { key: "glasses", label: "Glasses", options: GLASSES },
    { key: "top", label: "Top", options: TOPS },
    { key: "topColor", label: "Top colour", options: TOP_COLORS, swatch: true },
    { key: "bottom", label: "Bottoms", options: BOTTOMS },
    { key: "bottomColor", label: "Bottoms colour", options: BOTTOM_COLORS, swatch: true },
    { key: "legwear", label: "Socks & tights", options: LEGWEAR },
    { key: "shoes", label: "Shoes", options: SHOES },
    { key: "wrap", label: "Wrap", options: WRAPS },
    { key: "extra", label: "On your head", options: EXTRAS },
    { key: "companion", label: "Companion", options: COMPANIONS }
];

// Which choices show on the face and shoulders (the portrait),
// and which need the whole reader to be seen.
export const PORTRAIT_PARTS = ["face", "eyes", "mouth", "hair", "facialHair", "glasses", "top", "extra"];

export const FIGURE_PARTS = ["build", "bottom", "legwear", "shoes", "wrap", "companion"];

// Little touches, on or off.
export const AVATAR_TOUCHES = [
    { key: "blush", label: "Rosy cheeks" },
    { key: "freckles", label: "Freckles" }
];


/* =========================================================
   READING A SAVED AVATAR
========================================================= */

function pick(list, id, fallback = list[0]) {
    return list.find((item) => item.id === id) || fallback;
}


// Any saved avatar, cleaned to known choices. Readers who've
// never made one get a gentle one of their own, the same every
// time (seeded by their id).
export function normalizeAvatar(saved, seed = "reader") {

    let hash = 0;

    for (const char of String(seed)) {
        hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    }

    const choose = (ids, salt) => ids[(hash >>> salt) % ids.length];

    const defaults = {
        skin: choose(SKIN_TONES.map((tone) => tone.id), 1),
        build: "average",
        face: "round",
        eyes: choose(["sleepy", "round", "sparkly", "happy"], 3),
        eyeColor: choose(EYE_COLORS.map((color) => color.id), 5),
        mouth: "smile",
        hair: choose(["waves", "long", "bob", "curly", "bun", "half-up", "short", "coils"], 7),
        hairColor: choose(HAIR_COLORS.slice(0, 7).map((color) => color.id), 9),
        facialHair: "none",
        glasses: "none",
        top: choose(["sweater", "fair-isle", "cardigan", "turtleneck", "moon-sweater"], 11),
        topColor: choose(TOP_COLORS.map((color) => color.id), 13),
        bottom: choose(["trousers", "jeans", "skirt", "long-skirt", "pleated"], 15),
        bottomColor: choose(["denim", "indigo", "charcoal", "cocoa", "oat", "forest"], 17),
        legwear: "knee-socks",
        shoes: "boots",
        wrap: "none",
        extra: "none",
        companion: "none",
        blush: true,
        freckles: false
    };

    const avatar = { ...defaults };

    if (saved && typeof saved === "object") {

        AVATAR_PARTS.forEach(({ key, options }) => {
            if (options.some((option) => option.id === saved[key])) {
                avatar[key] = saved[key];
            }
        });

        AVATAR_TOUCHES.forEach(({ key }) => {
            if (typeof saved[key] === "boolean") {
                avatar[key] = saved[key];
            }
        });

        // The first avatars kept the scarf with the hats.
        if (saved.extra === "scarf" && !saved.wrap) {
            avatar.wrap = "scarf";
        }

    }

    return avatar;

}


/* =========================================================
   DRAWING HELPERS
========================================================= */

function shade(hex, amount) {

    const value =
        parseInt(hex.slice(1), 16);

    const channel = (shift) => {
        const c = (value >> shift) & 255;
        const next = amount < 0 ? c * (1 + amount) : c + (255 - c) * amount;
        return Math.max(0, Math.min(255, Math.round(next)));
    };

    return `#${[16, 8, 0].map((shift) => channel(shift).toString(16).padStart(2, "0")).join("")}`;

}

function lightness(hex) {
    const value = parseInt(hex.slice(1), 16);
    return (((value >> 16) & 255) * 0.3 + ((value >> 8) & 255) * 0.59 + (value & 255) * 0.11) / 255;
}

const f = (n) => +n.toFixed(2);

// An outlined shape.
function fill(d, color, width = 1.2) {
    return `<path d="${d}" fill="${color}" stroke="${LINE}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"/>`;
}

// Lines with no fill: strands, folds, stitches.
function strokes(d, color, width = 0.8, opacity = 1) {
    return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"${opacity < 1 ? ` opacity="${opacity}"` : ""}/>`;
}

// An outlined round-ended limb: an arm, a loc.
function limb(d, color, width) {
    return strokes(d, LINE, width + 2.4) + strokes(d, color, width);
}

// A path drawn for the reader's right side (our left), flipped
// to their other side.
function mirror(d) {

    let index = 0;

    return d.replace(/[MLCQZ]|-?\d*\.?\d+/g, (token) => {

        if (/[MLCQZ]/.test(token)) {
            index = 0;
            return token;
        }

        const out = index % 2 === 0 ? String(f(100 - Number(token))) : token;

        index += 1;

        return out;

    });

}

const both = (d) => `${d} ${mirror(d)}`;

// A puffy outline around an ellipse (curls, fluff, petals).
function cloud(cx, cy, rx, ry, count, bump, from = 0, to = Math.PI * 2) {

    const points = [];

    for (let index = 0; index <= count; index += 1) {
        const angle = from + (to - from) * (index / count);
        points.push([cx + Math.cos(angle) * rx, cy + Math.sin(angle) * ry, angle]);
    }

    const reach = 2 + 2 * bump - Math.cos(Math.abs(to - from) / count / 2);

    let d = `M${f(points[0][0])} ${f(points[0][1])}`;

    for (let index = 1; index < points.length; index += 1) {
        const angle = (points[index - 1][2] + points[index][2]) / 2;
        d += `Q${f(cx + Math.cos(angle) * rx * reach)} ${f(cy + Math.sin(angle) * ry * reach)} ${f(points[index][0])} ${f(points[index][1])}`;
    }

    return `${d}Z`;

}


// Everything a drawing needs, worked out once.
function paletteFor(avatar) {

    const build = pick(BUILDS, avatar.build, BUILDS[1]);

    const skin = pick(SKIN_TONES, avatar.skin).color;
    const hair = pick(HAIR_COLORS, avatar.hairColor).color;
    const top = pick(TOP_COLORS, avatar.topColor).color;
    const bottom = pick(BOTTOM_COLORS, avatar.bottomColor).color;

    const pale = (hex) => lightness(hex) > 0.7;

    return {
        avatar,
        S: build.shoulders,
        W: build.waist,
        H: build.hips,
        skin,
        skinDark: shade(skin, -0.12),
        skinDeep: shade(skin, -0.32),
        hair,
        hairDark: shade(hair, pale(hair) ? -0.22 : -0.3),
        hairLight: shade(hair, pale(hair) ? 0.55 : 0.32),
        top,
        topDark: shade(top, pale(top) ? -0.16 : -0.24),
        topLight: shade(top, 0.3),
        bottom,
        bottomDark: shade(bottom, -0.24),
        bottomLight: shade(bottom, 0.3),
        // A book that stands out against the top.
        book: ["berry", "plum", "rose", "rust"].includes(avatar.topColor) ? "#3f5e4a" : "#8a3a50"
    };

}


/* =========================================================
   HAIR
   In three layers: what falls behind the reader, locks that
   fall in front of their shoulders, and the fringe and crown
   over their forehead.
========================================================= */

const CAP_BACK =
    "M29.5 52C27 28 38 19 50 19C62 19 73 28 70.5 52C69 44 66 37.5 60 34.5C56.5 33 53 32.5 50 32.5C47 32.5 43.5 33 40 34.5C34 37.5 31 44 29.5 52Z";

const CAP_BACK_STRANDS =
    "M40 34.5C42 28 46 23 50 21M60 34.5C58 28 54 23 50 21M34 42C35 32 41 25 46 22M66 42C65 32 59 25 54 22";

function hairLayers(p) {

    const { hair, hairDark, hairLight } = p;

    const sheen = (d) => strokes(d, hairLight, 1.3, 0.8);

    const strand = (d) => strokes(d, hairDark, 0.75, 0.85);

    const pulledBack =
        fill(CAP_BACK, hair) + strand(CAP_BACK_STRANDS) + sheen("M41 25Q46 22 49 22.5M59 25Q54 22 51 22.5");

    const wavesBack =
        fill("M28 44C26 24 38 15.5 50 15.5C62 15.5 74 24 72 44C75 56 73 66 77 78C81 92 75 104 79 118C70 123 62 120 57 117L43 117C38 120 30 123 21 118C25 104 19 92 23 78C27 66 25 56 28 44Z", hairDark);

    const wavesSides =
        fill(both("M31.5 44C27 56 30 68 27 80C24 92 30 102 27.5 114C33 112.5 37.5 105 36.5 95C35.5 85 39.5 76 37.5 64C36.5 56 35 49 31.5 44Z"), hair)
        + strand(both("M31 56C29 68 32 78 29.5 90C28 100 31 106 30.5 111M34.5 62C35 74 33 84 33.5 96"));

    const wavesFront =
        fill("M29 56C26 32 37 19 50 19C63 19 74 32 71 56C69.5 47 66.5 39.5 60.5 35.5C57 33 53.5 31.5 50 30C46.5 31.5 43 33 39.5 35.5C33.5 39.5 30.5 47 29 56Z", hair)
        + strand("M50 21C46 24 42 29 39.5 35.5M50 21C54 24 58 29 60.5 35.5M44.5 21.5C38 25 33.5 32 31.5 44M55.5 21.5C62 25 66.5 32 68.5 44")
        + sheen("M39 26Q44 22.5 47.5 23M61 26Q56 22.5 52.5 23");

    switch (p.avatar.hair) {

        case "waves":
            return { back: wavesBack, sides: wavesSides, front: wavesFront };

        case "half-up":
            return {
                back: fill(cloud(50, 15.5, 6.5, 5.5, 8, 0.1), hair) + strand("M47 14Q50 11.5 53 14") + wavesBack,
                sides: wavesSides,
                front: wavesFront
            };

        case "long":
            return {
                back: fill("M28 44C26 24 38 15.5 50 15.5C62 15.5 74 24 72 44L74.5 119Q66 122 58 119L42 119Q34 122 25.5 119Z", hairDark),
                sides: fill(both("M31.5 44C29.5 64 30.5 90 29 116Q33 117 36.5 114.5C37 92 37.5 70 37 55C36 50 34 46 31.5 44Z"), hair)
                    + strand(both("M32.5 60C32 80 33 98 32 112")),
                front: fill("M29 58C26 32 37 19 50 19C63 19 74 32 71 58C70 49 68 43 63.5 40C59 37.5 54.5 34.5 50 30.5C45.5 34.5 41 37.5 36.5 40C32 43 30 49 29 58Z", hair)
                    + strand("M50 21C47 25 45 29 44 36M50 21C53 25 55 29 56 36M44 21.5C37 25 33 33 31.5 46M56 21.5C63 25 67 33 68.5 46")
                    + sheen("M39 26Q44 22.5 47.5 23M61 26Q56 22.5 52.5 23")
            };

        case "bob":
            return {
                back: fill("M27 46C25 24 38 16.5 50 16.5C62 16.5 75 24 73 46C73.5 54 74.5 62 74 70Q66 73.5 60 70.5L40 70.5Q34 73.5 26 70C25.5 62 26.5 54 27 46Z", hairDark),
                sides: "",
                front: fill("M28 64C24.5 30 37 19 50 19C63 19 75.5 30 72 64Q70 66 67.5 64.5C68 56 67.5 48 66.5 43Q62.5 45 58.3 42.4Q54.2 45 50 42.4Q45.8 45 41.7 42.4Q37.5 45 33.5 43C32.5 48 32 56 32.5 64.5Q30 66 28 64Z", hair)
                    + strand("M41.7 42.4C41 34 43 26 47 21.5M58.3 42.4C59 34 57 26 53 21.5M50 42.4V22M33.5 43C33 34 37 26 43 22M66.5 43C67 34 63 26 57 22M30 60C29 50 30 42 33 36M70 60C71 50 70 42 67 36")
                    + sheen("M38 27Q44 22.5 48 22.5M62 27Q56 22.5 52 22.5")
            };

        case "short":
            return {
                back: fill("M29.5 52C27 27 38 17.5 50 17.5C62 17.5 73 27 70.5 52L69 58L31 58Z", hairDark),
                sides: "",
                front: fill("M30 53C27 28 39 18 51 18C64 18 74 28 70 53C69.5 45 67.5 40.5 64 38C58 38.5 52 37 46 38C41 38.5 35.5 40 33 43.5C31.5 46 30.5 49.5 30 53Z", hair)
                    + fill("M33 43.5C37 33 50 28.5 64 32C60 35 56 36.5 52 36.5C45 36.5 38 39 33 43.5Z", hair)
                    + strand("M38 38C43 32 52 30 60 32M44 22C52 20 60 23 66 30M36 26C33 32 31 40 31 48")
                    + sheen("M44 24Q52 21 58 24")
            };

        case "pixie":
            return {
                back: fill("M29.5 52C27 27 38 17.5 50 17.5C62 17.5 73 27 70.5 52L69 57L31 57Z", hairDark),
                sides: "",
                front: fill("M30 50C27 27 39 18 51 18C63 18 73 27 70 48C69 42 66 38 62 36L63 41.5L57.5 37.5L55.5 43L51 38L47.5 43.5L45 38.5L41 42L40.5 37.5C35.5 39.5 31.5 44 30 50Z", hair)
                    + strand("M51 38C52 30 55 25 60 22M45 38.5C45 30 48 24 52 20.5M40.5 37.5C39 31 40 26 44 21.5M62 36C63 30 64 27 67 25")
                    + sheen("M44 24Q51 20.5 57 23")
            };

        case "curly": {
            const curls = (points) => points.map(([x, y]) => `M${x - 2} ${y}q1.6 -2.6 3.4 -0.4q1 1.8 -1.2 2.4`).join("");
            return {
                back: fill(cloud(50, 55, 30, 41, 20, 0.11), hairDark)
                    + strokes(curls([[25, 60], [24, 74], [75, 60], [76, 74], [26, 88], [74, 88], [31, 94], [69, 94]]), hair, 1, 0.9),
                sides: "",
                front: fill(cloud(31.5, 46, 5, 7.5, 7, 0.18), hair) + fill(cloud(68.5, 46, 5, 7.5, 7, 0.18), hair)
                    + fill(cloud(50, 30.5, 22, 12.5, 14, 0.16), hair)
                    + strokes(curls([[38, 30], [45, 26], [53, 27], [60, 31], [43, 36], [56, 36], [50, 21]]), hairDark, 0.8)
                    + sheen("M40 22Q46 19 51 19.5")
            };
        }

        case "coils": {
            const texture =
                Array.from({ length: 30 }, (_, index) => {
                    const angle = Math.PI * (0.95 + (index % 15) / 14 * 1.1);
                    const r = index < 15 ? 25 : 18;
                    const x = 50 + Math.cos(angle) * r * 1.08;
                    const y = 38 + Math.sin(angle) * r;
                    return `M${f(x - 1.4)} ${f(y)}q1.4 -2 2.8 0`;
                }).join("");
            return {
                back: fill(cloud(50, 38, 31, 27.5, 26, 0.07), hair) + strokes(texture, hairDark, 0.8, 0.85),
                sides: "",
                front: fill("M30.5 48C30.5 32 39 26 50 26C61 26 69.5 32 69.5 48C67 40 60 35.5 50 35.5C40 35.5 33 40 30.5 48Z", hair)
                    + strokes("M36 36q1.4 -2 2.8 0M43 32.5q1.4 -2 2.8 0M50 31.5q1.4 -2 2.8 0M57 33q1.4 -2 2.8 0M63 37q1.4 -2 2.8 0", hairDark, 0.8)
                    + sheen("M38 20Q46 15 54 16")
            };
        }

        case "bun":
            return {
                back: fill(cloud(50, 15, 9.5, 8.5, 10, 0.1), hair)
                    + strand("M44.5 15C45.5 10 54 9.5 55.5 14C56 18 49.5 19 48.5 15"),
                sides: "",
                front: pulledBack
                    + strokes(both("M31 50C29 56 31.5 60 30 65"), LINE, 2)
                    + strokes(both("M31 50C29 56 31.5 60 30 65"), hair, 1.1)
            };

        case "space-buns":
            return {
                back: fill(cloud(33.5, 21, 8.5, 8, 9, 0.1), hair) + fill(cloud(66.5, 21, 8.5, 8, 9, 0.1), hair)
                    + strand(both("M30 20C31 16.5 36 16 37.5 19.5C38 22.5 34 23.5 33.5 21"))
                    + fill("M29 50C27 28 38 18 50 18C62 18 73 28 71 50L72 64L28 64Z", hairDark),
                sides: "",
                front: pulledBack
            };

        case "ponytail":
            return {
                back: fill("M62 22C74 20 80 32 78 48C77 60 80 70 76 82C73 90 75 96 72 100C70 92 68 86 68 76C68 64 70 52 66 40C65 34 63 28 62 22Z", hair)
                    + strand("M70 30C75 42 73 60 74 78M67 36C70 50 69 66 71 86"),
                sides: "",
                front: pulledBack + fill("M61 20.5Q65 18.5 67.5 22Q66 26 62 25Z", "#c9607a", 1)
            };

        case "braids": {
            const braid = (x, dir) => Array.from({ length: 9 }, (_, index) => {
                const y = 60 + index * 6;
                const cx = x + Math.sin(index * 0.6) * 0.6 * dir;
                return `<ellipse cx="${f(cx)}" cy="${y}" rx="4.4" ry="3.9" fill="${index % 2 ? hair : shade(hair, -0.1)}" stroke="${LINE}" stroke-width="1"/>`
                    + strokes(`M${f(cx - 2.6)} ${y - 1.2}Q${f(cx)} ${y + 1.6} ${f(cx + 2.6)} ${y - 1.2}`, hairDark, 0.7);
            }).join("")
                + fill(`M${x - 3} 111Q${x} 109 ${x + 3} 111L${x + 3.5} 113L${x - 3.5} 113Z`, "#c9607a", 1)
                + fill(`M${x - 3} 113Q${x - 4} 119 ${x - 1} 120Q${x} 118 ${x + 1} 120Q${x + 4} 119 ${x + 3} 113Z`, hair, 1);
            return {
                back: fill("M28 46C26 24 38 16 50 16C62 16 74 24 72 46L71 62L29 62Z", hairDark),
                sides: fill(both("M32 44C30 50 30 54 31 58L35 58C34.5 52 34.5 48 35 45Z"), hair) + braid(31.5, -1) + braid(68.5, 1),
                front: pulledBack
            };
        }

        case "locs": {
            const backLocs = [24, 28.5, 71.5, 76].map((x, index) =>
                `M${x} 42Q${x + (index < 2 ? -2 : 2)} 70 ${x + (index < 2 ? -1 : 1)} 104`);
            const frontLocs = [31, 35, 65, 69].map((x, index) =>
                `M${x} 46Q${x + (index < 2 ? -3 : 3)} 76 ${x + (index < 2 ? -2 : 2)} 108`);
            return {
                back: fill("M27 46C25 22 38 15.5 50 15.5C62 15.5 75 22 73 46L71 60L29 60Z", hairDark)
                    + backLocs.map((d) => limb(d, hairDark, 4.2)).join(""),
                sides: frontLocs.map((d, index) => limb(d, index % 2 ? hair : shade(hair, -0.1), 4.2)
                    + strokes(d, hairLight, 0.7, 0.5)).join(""),
                front: fill(CAP_BACK, hair)
                    + strokes(`${CAP_BACK_STRANDS}M45 33C46 27 48 23 50 21M55 33C54 27 52 23 50 21`, hairDark, 1.6, 0.6)
            };
        }

        default:
            return { back: "", sides: "", front: strokes("M40 30Q45 27 50 27.5", "#fff", 1.4, 0.35) };

    }

}


/* =========================================================
   THE FACE
========================================================= */

function faceShape(id) {

    switch (id) {
        case "oval":
            return "M50 26.5C62 26.5 68 36 68 48.5C68 62 59.5 71 50 71C40.5 71 32 62 32 48.5C32 36 38 26.5 50 26.5Z";
        case "heart":
            return "M50 27C63.5 27 70.5 35 70.5 46.5C70.5 58.5 59 68.5 50 70.5C41 68.5 29.5 58.5 29.5 46.5C29.5 35 36.5 27 50 27Z";
        case "soft-square":
            return "M50 27C63 27 69.5 31 69.5 46C69.5 60 64 68.5 50 69.5C36 68.5 30.5 60 30.5 46C30.5 31 37 27 50 27Z";
        default:
            return "M50 27C63 27 70 36 70 48.5C70 61 61 70 50 70C39 70 30 61 30 48.5C30 36 37 27 50 27Z";
    }

}


function eyesFor(p) {

    const iris =
        pick(EYE_COLORS, p.avatar.eyeColor).color;

    const dark = "#2e1d1d";

    const y = 53;

    // side is -1 for the eye on our left, 1 for the one on our right.
    const one = (x, side) => {

        switch (p.avatar.eyes) {

            case "sleepy":
                return strokes(`M${x - 3.3} ${y - 0.4}Q${x} ${y + 2.6} ${x + 3.3} ${y - 0.4}`, LINE, 1.35)
                    + strokes(`M${x + side * 3.1} ${y - 0.1}L${x + side * 4.4} ${y - 1.2}M${x + side * 2.3} ${y + 0.9}L${x + side * 3.4} ${y + 1.9}`, LINE, 0.9);

            case "happy":
                return strokes(`M${x - 3} ${y + 1.2}Q${x} ${y - 2.6} ${x + 3} ${y + 1.2}`, LINE, 1.4);

            case "sparkly":
                return `<ellipse cx="${x}" cy="${y}" rx="3.1" ry="3.7" fill="${dark}"/>
                    <ellipse cx="${x}" cy="${y + 0.9}" rx="2.3" ry="2.6" fill="${iris}"/>
                    <circle cx="${x + 1}" cy="${y - 1.3}" r="1.15" fill="#fff"/>
                    <circle cx="${x - 1.1}" cy="${y + 1.8}" r="0.55" fill="#fff"/>`
                    + strokes(`M${x - 3.4} ${y - 2.2}Q${x} ${y - 5} ${x + 3.4} ${y - 2.2}M${x + side * 3.2} ${y - 2.5}L${x + side * 4.6} ${y - 3.6}`, LINE, 1.3);

            case "lashes":
                return `<ellipse cx="${x}" cy="${y + 0.2}" rx="2.4" ry="2.9" fill="${dark}"/>
                    <ellipse cx="${x}" cy="${y + 0.9}" rx="1.7" ry="1.9" fill="${iris}"/>
                    <circle cx="${x + 0.8}" cy="${y - 0.9}" r="0.8" fill="#fff"/>`
                    + strokes(`M${x - 3} ${y - 1.6}Q${x} ${y - 4.2} ${x + 3} ${y - 1.6}M${x + side * 2.6} ${y - 2.2}L${x + side * 4.3} ${y - 3.6}M${x + side * 3.1} ${y - 1}L${x + side * 4.9} ${y - 1.8}`, LINE, 1);

            case "almond":
                return `<path d="M${x - 3.6} ${y}Q${x} ${y - 3.6} ${x + 3.6} ${y}Q${x} ${y + 3} ${x - 3.6} ${y}Z" fill="#fffaf2" stroke="${LINE}" stroke-width="0.9"/>
                    <circle cx="${x}" cy="${y}" r="1.9" fill="${iris}"/>
                    <circle cx="${x}" cy="${y}" r="0.85" fill="${dark}"/>
                    <circle cx="${x + 0.7}" cy="${y - 0.7}" r="0.5" fill="#fff"/>`
                    + strokes(`M${x - 3.9} ${y - 0.4}Q${x} ${y - 4.4} ${x + 3.9} ${y - 0.4}`, LINE, 1.3);

            case "monolid":
                return strokes(`M${x - 3.4} ${y - 0.8}Q${x} ${y - 1.8} ${x + 3.4} ${y - 0.8}`, LINE, 1.4)
                    + `<path d="M${x - 2.5} ${y - 0.4}Q${x} ${y + 2.2} ${x + 2.5} ${y - 0.4}Z" fill="${iris}" stroke="${LINE}" stroke-width="0.7"/>
                    <circle cx="${x + 0.7}" cy="${y + 0.2}" r="0.45" fill="#fff"/>`;

            default:
                return `<ellipse cx="${x}" cy="${y + 0.2}" rx="2.3" ry="2.8" fill="${dark}"/>
                    <ellipse cx="${x}" cy="${y + 0.9}" rx="1.6" ry="1.8" fill="${iris}"/>
                    <circle cx="${x + 0.8}" cy="${y - 0.9}" r="0.8" fill="#fff"/>`
                    + strokes(`M${x - 2.8} ${y - 1.7}Q${x} ${y - 3.8} ${x + 2.8} ${y - 1.7}`, LINE, 1);

        }

    };

    return one(42, -1) + one(58, 1);

}


function browsFor(p) {

    const color =
        p.avatar.hair === "none" ? p.skinDeep : shade(p.hair, -0.2);

    return strokes("M38.8 47.4Q42 45.4 45.2 46.6M54.8 46.6Q58 45.4 61.2 47.4", color, 1.3);

}


function mouthFor(p) {

    switch (p.avatar.mouth) {
        case "grin":
            return fill("M46.3 60.4Q50 61.4 53.7 60.4Q53 64.4 50 64.6Q47 64.4 46.3 60.4Z", "#8e3b48", 0.9)
                + `<path d="M47.8 63.2Q50 62 52.2 63.2Q51 64.4 50 64.4Q49 64.4 47.8 63.2Z" fill="#e0808e"/>`;
        case "calm":
            return strokes("M47.6 61.6Q50 62.6 52.4 61.6", LINE, 1.1);
        case "smirk":
            return strokes("M46.8 61.8Q50 62.8 53.4 60.4", LINE, 1.1);
        case "cat":
            return strokes("M46.4 60.6Q48.2 62.8 50 61Q51.8 62.8 53.6 60.6", LINE, 1.05);
        default:
            return strokes("M46.8 60.6Q50 63.6 53.2 60.6", LINE, 1.15);
    }

}


function facialHairFor(p) {

    const color = p.hair;

    const moustache =
        fill("M45 59.4Q47.5 57.4 50 58.9Q52.5 57.4 55 59.4Q52.5 61 50 60.1Q47.5 61 45 59.4Z", color, 0.8);

    switch (p.avatar.facialHair) {
        case "stubble":
            return `<path d="M34 58Q36 69 50 70.5Q64 69 66 58Q61 66 50 66Q39 66 34 58Z" fill="${color}" opacity="0.28"/>`;
        case "moustache":
            return moustache;
        case "beard":
            return fill("M31.5 52Q32 68 50 72.5Q68 68 68.5 52Q65 62.5 58.5 62.5Q54.5 60 50 60.6Q45.5 60 41.5 62.5Q35 62.5 31.5 52Z", color, 1)
                + moustache
                + strokes("M47.2 63Q50 64.4 52.8 63", "#8e3b48", 1)
                + strokes("M38 64Q40 67 43 68M62 64Q60 67 57 68", shade(color, -0.25), 0.7, 0.8);
        default:
            return "";
    }

}


function glassesFor(p) {

    const frame = `fill="rgba(235,246,250,0.12)" stroke="${LINE}" stroke-width="1.1"`;

    switch (p.avatar.glasses) {
        case "round":
            return `<circle cx="42" cy="53" r="5.2" ${frame}/><circle cx="58" cy="53" r="5.2" ${frame}/>`
                + strokes("M47.2 52.4Q50 51 52.8 52.4M36.8 52.4L31.5 50.8M63.2 52.4L68.5 50.8", LINE, 1);
        case "cateye":
            return `<path d="M35.6 50.2Q41.5 48.6 47.2 50.4Q47 57.4 41.8 57.6Q36.4 57.4 35.6 50.2Z" ${frame}/>
                <path d="M64.4 50.2Q58.5 48.6 52.8 50.4Q53 57.4 58.2 57.6Q63.6 57.4 64.4 50.2Z" ${frame}/>`
                + strokes("M47.2 51.4Q50 50.4 52.8 51.4M35.6 50.2L32.5 48.2M64.4 50.2L67.5 48.2", LINE, 1.1);
        case "halfmoon":
            return `<path d="M36.6 53.4H47.2Q47.2 58.4 41.9 58.6Q36.6 58.4 36.6 53.4Z" ${frame}/>
                <path d="M52.8 53.4H63.4Q63.4 58.4 58.1 58.6Q52.8 58.4 52.8 53.4Z" ${frame}/>`
                + strokes("M47.2 53.8Q50 52.8 52.8 53.8M36.6 53.6L31.5 52M63.4 53.6L68.5 52", LINE, 1);
        case "square":
            return `<rect x="36" y="49" width="11.2" height="8.4" rx="2" ${frame}/><rect x="52.8" y="49" width="11.2" height="8.4" rx="2" ${frame}/>`
                + strokes("M47.2 52.2Q50 51 52.8 52.2M36 51.4L31.5 50.4M64 51.4L68.5 50.4", LINE, 1);
        default:
            return "";
    }

}


function headFor(p) {

    const { avatar, skin, skinDark, skinDeep } = p;

    const freckles =
        avatar.freckles
            ? [[38.5, 57.6], [41, 59], [43, 57.2], [57, 57.2], [59, 59], [61.5, 57.6], [47.6, 55.6], [52.4, 55.6]]
                .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="0.5" fill="${skinDeep}"/>`).join("")
            : "";

    const blush =
        avatar.blush
            ? `<ellipse cx="39.8" cy="58.6" rx="3.8" ry="2.2" fill="#ef7f8f" opacity="0.4"/><ellipse cx="60.2" cy="58.6" rx="3.8" ry="2.2" fill="#ef7f8f" opacity="0.4"/>`
              + strokes("M38.2 58.8L39.4 57.4M40.4 59.2L41.6 57.8M58.4 59.2L59.6 57.8M60.6 58.8L61.8 57.4", "#d95f72", 0.5, 0.55)
            : "";

    return `<ellipse cx="30.8" cy="53" rx="3" ry="4.2" fill="${skinDark}" stroke="${LINE}" stroke-width="1.1"/>`
        + `<ellipse cx="69.2" cy="53" rx="3" ry="4.2" fill="${skinDark}" stroke="${LINE}" stroke-width="1.1"/>`
        + strokes("M30.4 51Q31.8 53 30.4 55M69.6 51Q68.2 53 69.6 55", skinDeep, 0.7)
        + fill(faceShape(avatar.face), skin, 1.3)
        + blush
        + freckles
        + eyesFor(p)
        + browsFor(p)
        + strokes("M49.3 56.6Q50.3 57.8 51.2 56.9", skinDeep, 0.9)
        + facialHairFor(p)
        + (avatar.facialHair === "beard" ? "" : mouthFor(p));

}


function headwearFor(p, layer) {

    switch (p.avatar.extra) {

        case "witch-hat":
            return layer === "front"
                ? fill("M20 33Q50 22 80 33Q74 39 50 38Q26 39 20 33Z", "#3b2a40")
                  + fill("M33.5 32.5Q41 16 50 5Q54 1 60 3.5Q56 5 55.5 9Q60 20 66.5 31.5Q50 36 33.5 32.5Z", "#3b2a40")
                  + strokes("M34.5 30.5Q50 34.5 65.5 29.5", "#b44d5e", 3)
                  + strokes("M41 22Q46 10 52 6", "#5a4460", 1, 0.8)
                  + fill("M57 20L58 22.6L60.6 23.2L58 23.8L57 26.4L56 23.8L53.4 23.2L56 22.6Z", "#f3cb79", 0.6)
                : "";

        case "beret":
            return layer === "front"
                ? fill("M27 36Q25 19 50 17Q75 17 75 31Q71 38 50 37Q33 38 27 36Z", "#9b3e5a")
                  + strokes("M31 33Q50 36 71 31", shade("#9b3e5a", -0.25), 1)
                  + strokes("M49 17Q50 12 52.5 13", LINE, 1.5)
                : "";

        case "flower-crown":
            return layer === "front"
                ? strokes("M29 36Q50 24 71 36", "#5d7a4a", 2.2)
                  + [[29.5, 34.5, "#e8a0b4"], [37, 29.5, "#f3cb79"], [44.5, 26.5, "#c9a0d8"], [52, 26, "#e8a0b4"], [59.5, 27.5, "#f3cb79"], [66.5, 31, "#c9a0d8"], [71, 35.5, "#e8a0b4"]]
                    .map(([x, y, c]) => fill(cloud(x, y, 2.9, 2.9, 5, 0.2), c, 0.8) + `<circle cx="${x}" cy="${y}" r="0.9" fill="#fff4d6"/>`).join("")
                  + fill("M40.5 28.5Q42 25.5 43.5 27.5Q42 29.5 40.5 28.5Z M55.5 26Q57 23 58.5 25Q57 27 55.5 26Z", "#7a9a5e", 0.6)
                : "";

        case "bow":
            return layer === "front"
                ? fill("M60 25Q66 18 70 22Q71 28 63 29Z", "#c9607a", 1)
                  + fill("M60 25Q60 33 65 34Q69 32 63 29Z", "#c9607a", 1)
                  + fill("M58 23.5Q55 16 50.5 18.5Q49.5 24 57.5 27.5Z", "#c9607a", 1)
                  + `<circle cx="60.3" cy="26" r="2.2" fill="#b04e68" stroke="${LINE}" stroke-width="0.9"/>`
                : "";

        case "star-clips":
            return layer === "front"
                ? [[36, 34], [63.5, 32.5]].map(([x, y]) =>
                    fill(`M${x} ${y - 4}L${x + 1.3} ${y - 1.2}L${x + 4} ${y}L${x + 1.3} ${y + 1.2}L${x} ${y + 4}L${x - 1.3} ${y + 1.2}L${x - 4} ${y}L${x - 1.3} ${y - 1.2}Z`, "#f3cb79", 0.8)).join("")
                : "";

        case "headscarf":
            return layer === "back"
                ? fill("M64 42Q77 52 74 70Q67 63 62 54Z", "#d2a041")
                : fill("M28.5 50C26 26 39 17.5 50 17.5C61 17.5 74 26 71.5 50C66 39 60 34 50 34C40 34 34 39 28.5 50Z", "#d2a041")
                  + strokes("M35 27Q50 21 65 27M31.5 36Q50 29 68.5 36M29.5 44Q50 36 70.5 44", "#9b3e5a", 1.2, 0.9)
                  + `<circle cx="42" cy="24.5" r="0.9" fill="#fff4d6"/><circle cx="56" cy="24" r="0.9" fill="#fff4d6"/><circle cx="49" cy="31" r="0.9" fill="#fff4d6"/>`;

        case "headphones":
            return layer === "front"
                ? limb("M28.5 52Q27 18 50 17Q73 18 71.5 52", "#9b3e5a", 2.6)
                  + `<rect x="23.5" y="46" width="9" height="14" rx="4" fill="#9b3e5a" stroke="${LINE}" stroke-width="1.2"/>`
                  + `<rect x="67.5" y="46" width="9" height="14" rx="4" fill="#9b3e5a" stroke="${LINE}" stroke-width="1.2"/>`
                  + strokes("M26 49.5V56.5M74 49.5V56.5", "#e29aae", 1, 0.8)
                : "";

        case "cat-ears": {
            const ear = p.hair === "#2e2226" ? "#3b2a40" : "#2e2226";
            return layer === "front"
                ? fill("M31 32L30 15L43 25Z", ear) + fill("M69 32L70 15L57 25Z", ear)
                  + `<path d="M33 27L32.8 19.5L39 24.5Z M67 27L67.2 19.5L61 24.5Z" fill="#e8a0b4"/>`
                : "";
        }

        default:
            return "";

    }

}


/* =========================================================
   CLOTHES
========================================================= */

function torsoPath(p, hem = 126, flare = 2) {

    const L = 50 - p.S;
    const R = 50 + p.S;

    return `M45.5 77.5C${L + 4} 78 ${L} 79.5 ${L - 0.5} 86C${L - 1} 100 ${50 - p.W - 1.5} 108 ${50 - p.H - flare} ${hem}`
        + `Q50 ${hem + 2.5} ${50 + p.H + flare} ${hem}C${50 + p.W + 1.5} 108 ${R + 1} 100 ${R + 0.5} 86`
        + `C${R} 79.5 ${R - 4} 78 54.5 77.5Q50 80.5 45.5 77.5Z`;

}

// Tiny knit stitches across the body.
function knit(p, color) {

    let d = "";

    for (const y of [90, 99, 108, 117]) {
        const half = (y < 100 ? p.S : p.W) - 3;
        for (let x = 50 - half; x <= 50 + half; x += 4) {
            d += `M${f(x - 1)} ${y - 1}L${f(x)} ${y}L${f(x + 1)} ${y - 1}`;
        }
    }

    return strokes(d, color, 0.6, 0.45);

}

function ribbedHem(p, color, hem = 126, flare = 2) {

    const left = 50 - p.H - flare;
    const right = 50 + p.H + flare;

    let ribs = "";

    for (let x = left + 2; x < right - 1; x += 2.2) {
        ribs += `M${f(x)} ${hem - 3.4}L${f(x)} ${hem + 0.8}`;
    }

    return strokes(`M${f(left + 0.4)} ${hem - 3.6}Q50 ${hem - 1.2} ${f(right - 0.4)} ${hem - 3.6}`, color, 0.9)
        + strokes(ribs, color, 0.5, 0.6);

}


// The top: its body, what sits over it, and its sleeves.
function topFor(p) {

    const { avatar, top, topDark, topLight } = p;

    const L = 50 - p.S;
    const R = 50 + p.S;

    let body = fill(torsoPath(p), top, 1.3);
    let over = "";
    let sleeve = top;
    let cuff = topDark;
    let short = false;

    const crew = strokes("M45.5 77.8Q50 81.8 54.5 77.8", topDark, 2.2);

    switch (avatar.top) {

        case "fair-isle": {
            const band = `M${L + 0.5} 85Q50 97 ${R - 0.5} 85`;
            let pattern = "";
            for (let t = 0.04; t < 0.98; t += 0.075) {
                const x = (1 - t) * (1 - t) * (L + 0.5) + 2 * (1 - t) * t * 50 + t * t * (R - 0.5);
                const y = (1 - t) * (1 - t) * 85 + 2 * (1 - t) * t * 97 + t * t * 85;
                pattern += `M${f(x - 1.1)} ${f(y + 1.2)}L${f(x)} ${f(y - 1.2)}L${f(x + 1.1)} ${f(y + 1.2)}`;
            }
            body += strokes(band, LINE, 7.4) + strokes(band, CREAM, 6)
                + strokes(pattern, topDark, 0.9)
                + strokes(`M${L + 1} 81.5Q50 91.5 ${R - 1} 81.5`, "#b44d5e", 1.2, 0.9)
                + strokes(`M${L} 89Q50 102 ${R} 89`, "#b44d5e", 1.2, 0.9)
                + crew + ribbedHem(p, topDark) + strokes(`M${50 - p.W} 116Q50 118 ${50 + p.W} 116`, CREAM, 2.2);
            break;
        }

        case "moon-sweater":
            body += crew + ribbedHem(p, topDark)
                + fill("M55 92A6.5 6.5 0 1 0 57.6 103A5.2 5.2 0 0 1 55 92Z", "#f3cb79", 0.8)
                + fill("M40 90L40.8 92.2L43 93L40.8 93.8L40 96L39.2 93.8L37 93L39.2 92.2Z", "#fff4d6", 0.5)
                + fill("M45 101L45.5 102.4L47 103L45.5 103.6L45 105L44.5 103.6L43 103L44.5 102.4Z", "#fff4d6", 0.5)
                + fill("M61.5 107L62 108.4L63.5 109L62 109.6L61.5 111L61 109.6L59.5 109L61 108.4Z", "#fff4d6", 0.5);
            break;

        case "cardigan":
            body = fill(torsoPath(p, 127, 3.2), top, 1.3)
                + knit(p, topDark)
                + fill("M45 77.8Q50 81 55 77.8L56.8 126.8Q50 128.2 43.2 126.8Z", CREAM, 1.1)
                + strokes("M45 77.8L43.2 126.8M55 77.8L56.8 126.8", topDark, 2)
                + [92, 101, 110, 119].map((y) => `<circle cx="${f(45 - (y - 78) * 0.037)}" cy="${y}" r="1.1" fill="${GOLD}" stroke="${LINE}" stroke-width="0.5"/>`).join("")
                + fill(`M${50 - p.W - 1} 112H${50 - p.W + 6}V120H${50 - p.W - 0.5}Z`, top, 0.8)
                + fill(`M${50 + p.W + 1} 112H${50 + p.W - 6}V120H${50 + p.W + 0.5}Z`, top, 0.8)
                + ribbedHem(p, topDark, 127, 3.2);
            break;

        case "turtleneck":
            body += ribbedHem(p, topDark) + knit(p, topDark);
            over = fill("M44.3 70Q50 72.5 55.7 70L56.4 79.5Q50 82.4 43.6 79.5Z", top, 1.2)
                + strokes("M44.4 73.6Q50 76 55.6 73.6M46 70.8V80.6M48 71.4V81.4M50 71.6V81.6M52 71.4V81.4M54 70.8V80.6", topDark, 0.6, 0.7);
            break;

        case "hoodie":
            body += ribbedHem(p, topDark)
                + fill(`M${50 - p.W + 2} 124L${50 - p.W + 4} 110H${50 + p.W - 4}L${50 + p.W - 2} 124Z`, top, 0.9);
            over = fill("M39.5 80C37 72 43 68.5 50 70.5C57 68.5 63 72 60.5 80Q50 85.5 39.5 80Z", topDark, 1.2)
                + strokes("M47 82V92M53 82V92", CREAM, 1.1)
                + `<circle cx="47" cy="93" r="1" fill="${CREAM}"/><circle cx="53" cy="93" r="1" fill="${CREAM}"/>`;
            break;

        case "collar":
            body += strokes("M50 82V124", topDark, 0.8)
                + [90, 98, 106, 114].map((y) => `<circle cx="51.6" cy="${y}" r="0.9" fill="${CREAM}" stroke="${LINE}" stroke-width="0.4"/>`).join("");
            over = fill("M50 78.6Q42 76 38.4 80Q40 87 48 84.6Z", "#fffaf2", 1)
                + fill("M50 78.6Q58 76 61.6 80Q60 87 52 84.6Z", "#fffaf2", 1)
                + fill("M50 81.5L46.5 79.6V84.4Z M50 81.5L53.5 79.6V84.4Z", "#b44d5e", 0.7);
            break;

        case "shirt":
            body += strokes("M50 82V126", LINE, 0.8)
                + [89, 97, 105, 113, 121].map((y) => `<circle cx="51.5" cy="${y}" r="0.8" fill="${topDark}"/>`).join("")
                + fill(`M${L + 3} 90H${L + 9}V97H${L + 3}Z`, top, 0.7);
            over = fill("M45 77.6L50 83.5L44.5 86L41.6 79.6Z", topLight, 1)
                + fill("M55 77.6L50 83.5L55.5 86L58.4 79.6Z", topLight, 1);
            cuff = topLight;
            break;

        case "tee":
            body += strokes("M45.5 77.8Q50 81.4 54.5 77.8", topDark, 1.6)
                + strokes(`M${50 - p.H - 1.5} 124Q50 127 ${50 + p.H + 1.5} 124`, topDark, 0.8, 0.8);
            sleeve = p.skin;
            short = true;
            break;

        default:
            body += crew + ribbedHem(p, topDark) + knit(p, topDark);

    }

    return { body, over, sleeve, cuff, short };

}


// Arms bent up to hold the book to the chest.
function armsFor(p, clothes) {

    const L = 50 - p.S;

    const arm = `M${L + 2.5} 86C${L - 2} 94 ${L - 2.5} 102 ${L - 0.5} 107C${L + 1} 110.5 34 110.5 36 109`;

    let out = limb(both(arm), clothes.sleeve, 7.2);

    if (clothes.short) {
        const sleeveTop = `M${L + 2.5} 86C${L - 0.6} 89.6 ${L - 1.6} 92.6 ${L - 2} 96`;
        out += limb(both(sleeveTop), p.top, 8.4)
            + strokes(both(`M${L - 6.4} 96.4L${L + 2.4} 96.4`), LINE, 0.9);
    } else {
        out += `<ellipse cx="35.6" cy="109.6" rx="2.6" ry="3.4" fill="${clothes.cuff}" stroke="${LINE}" stroke-width="1"/>`
            + `<ellipse cx="64.4" cy="109.6" rx="2.6" ry="3.4" fill="${clothes.cuff}" stroke="${LINE}" stroke-width="1"/>`
            + strokes(both(`M${L - 2.2} 96C${L - 1.4} 99 ${L - 1.4} 101 ${L - 1} 103`), shade(clothes.sleeve, -0.22), 0.7, 0.8);
    }

    return out;

}


function bookAndHands(p) {

    return fill("M38.2 95.6L50 97.6L61.8 95.6L62.4 113L50 115L37.6 113Z", "#fbf3e2", 1)
        + fill("M37 97.6L50 99.8L63 97.6L63.6 115.4L50 117.6L36.4 115.4Z", p.book, 1.2)
        + strokes("M50 99.8V117.6", LINE, 1)
        + strokes("M39 100.4L48 102M52 102L61 100.4M39 112.8L48 114.6M52 114.6L61 112.8", GOLD, 0.8, 0.9)
        + fill("M56.5 104.8L57.3 106.8L59.4 107.4L57.3 108L56.5 110L55.7 108L53.6 107.4L55.7 106.8Z", GOLD, 0.5)
        + fill("M40.6 104.2L46.6 105.2L46.6 108.4L40.6 107.4Z", GOLD, 0.5)
        + fill(both("M34.4 106.2C34 103.4 37.4 102.4 39.6 104.4L40.6 105.6C41.4 106.6 40.6 108 39.4 107.6L38.8 107.4C39.4 109.4 38.6 111.8 36.4 111.6C34.6 111.4 34.2 109 34.4 106.2Z"), p.skin, 1.1)
        + strokes(both("M36 107.6Q37.4 108.2 38.8 107.4"), p.skinDeep, 0.6, 0.8);

}


/* Legs, socks and shoes. The feet stand at x = 44 and x = 56. */

const LEG = "M39.8 124C39.4 148 40.8 168 41.4 186L46.6 186C47.2 168 48.6 148 48.4 124Z";

function legsFor(p) {

    const { legwear } = p.avatar;

    const legs = fill(both(LEG), legwear === "tights" ? "#3b3438" : p.skin, 1.1);

    switch (legwear) {

        case "knee-socks":
            return legs + fill(both("M40.8 160L48 160C47.6 170 47 178 46.6 186L41.4 186C41 178 40.9 170 40.8 160Z"), CREAM, 1)
                + strokes(both("M40.9 162.6L47.9 162.6M40.9 164.6L47.8 164.6"), "#b44d5e", 0.9);

        case "striped": {
            let stripes = "";
            for (let y = 152; y < 186; y += 4) {
                stripes += `M40.8 ${y}L48 ${y}`;
            }
            return legs + fill(both("M40.6 150L48.2 150C47.8 165 47 176 46.6 186L41.4 186C41 176 40.7 165 40.6 150Z"), CREAM, 1)
                + strokes(both(stripes), "#b44d5e", 1.6);
        }

        case "tights":
            return legs + strokes(both("M42.6 130C42.6 150 43.6 170 44 184"), "#5a5256", 0.8, 0.8);

        default:
            return legs + strokes(both("M42.4 162Q44 163.4 45.8 162"), p.skinDeep, 0.6, 0.7);

    }

}

function shoesFor(p) {

    const foot = "M39.6 184C38.4 188 37.4 193.4 42 194.2L46.6 194.2C48.4 193.8 48.8 189 48.2 184Z";

    switch (p.avatar.shoes) {

        case "tall-boots":
            return fill(both("M39.6 158L48.8 158C48.4 170 48.2 178 48.2 186L39.6 186C39.8 178 39.8 170 39.6 158Z"), "#3a2a2a", 1.1)
                + fill(both("M39.2 157L49.2 157L49.2 161.6L39.2 161.6Z"), "#533b35", 1)
                + fill(both(foot), "#3a2a2a", 1.1)
                + strokes(both("M38.6 192.8L47.8 192.8"), "#1f1515", 1.2);

        case "mary-janes":
            return fill(both(foot), "#3a2a2a", 1.1)
                + strokes(both("M40.4 187.6L47.8 186.8"), "#3a2a2a", 1.8)
                + `<circle cx="47" cy="187" r="0.8" fill="${GOLD}"/><circle cx="53" cy="187" r="0.8" fill="${GOLD}"/>`
                + strokes(both("M41.8 190.4Q44 189.4 46.4 190.4"), "#5a4444", 0.7, 0.8);

        case "sneakers":
            return fill(both(foot), "#f8f1e4", 1.1)
                + strokes(both("M38.8 192.2L47.9 192.2"), "#c9b99c", 1.4)
                + strokes(both("M41 189.2Q44 186 47.6 187.6"), p.avatar.topColor === "cream" ? "#b44d5e" : p.top, 1.4)
                + strokes(both("M42 185.6L46 185.6M42.2 187.2L45.6 187.2"), "#9c8a70", 0.6);

        case "slippers":
            return fill(both("M40.2 183.4L37.6 175.4Q39 173.8 40.8 175.6L42.6 183Z"), "#f8f1e4", 0.9)
                + fill(both("M42.6 183L44.6 174.8Q46.4 174 46.6 176L45.2 183.2Z"), "#f8f1e4", 0.9)
                + strokes(both("M39.6 177.6L40.8 181.4M44.9 177.4L44.4 181.2"), "#ef9aa9", 1, 0.9)
                + fill(cloud(44, 189.6, 5.8, 4.8, 10, 0.12), "#f8f1e4", 1)
                + fill(cloud(56, 189.6, 5.8, 4.8, 10, 0.12), "#f8f1e4", 1)
                + `<circle cx="42" cy="188.4" r="0.6" fill="${LINE}"/><circle cx="45.8" cy="188.4" r="0.6" fill="${LINE}"/>`
                + `<circle cx="54.2" cy="188.4" r="0.6" fill="${LINE}"/><circle cx="58" cy="188.4" r="0.6" fill="${LINE}"/>`
                + `<circle cx="43.9" cy="190.2" r="0.7" fill="#ef9aa9"/><circle cx="56.1" cy="190.2" r="0.7" fill="#ef9aa9"/>`;

        case "socks":
            return fill(both("M40.8 176L47.6 176L48 184C48.8 189 48.4 193.8 46.6 194.2L42 194.2C37.4 193.4 38.6 188 40.6 184Z"), CREAM, 1.1)
                + strokes(both("M41 178.4L47.6 178.4M41 180.4L47.7 180.4"), "#b44d5e", 0.8)
                + strokes(both("M40.4 191.4Q43 190 46 191"), "#d8c7a8", 0.7);

        default:
            return fill(both("M40.4 176L48.2 176C48.2 180 48.2 183 48.2 186L40 186C40.2 183 40.4 180 40.4 176Z"), "#7a4a2e", 1.1)
                + fill(both(foot), "#7a4a2e", 1.1)
                + strokes(both("M41.4 178.4L47 180.4M47 178.4L41.4 180.4M41.4 181.6L47 183.6M47 181.6L41.4 183.6"), CREAM, 0.6)
                + strokes(both("M38.6 192.8L47.8 192.8"), "#4a2c1e", 1.3);

    }

}

// Trousers and skirts (drawn under the top), and anything that
// sits over the top (the bib of overalls or a pinafore).
function bottomsFor(p) {

    const { bottom, bottomDark, bottomLight, H, W, S } = p;

    const left = 50 - H;
    const right = 50 + H;

    const trousers = (hem = 185, outL = 39, outR = 61) =>
        `M${left} 119L${right} 119C${right + 0.5} 140 ${outR + 0.5} 165 ${outR} ${hem}L51 ${hem}L50 136L49 ${hem}L${outL} ${hem}C${outL - 0.5} 165 ${left - 0.5} 140 ${left} 119Z`;

    const skirt = (hem, spread) =>
        `M${left} 119L${right} 119C${right + 3} 132 ${right + spread - 1} 146 ${right + spread} ${hem}Q50 ${hem + 3.5} ${left - spread} ${hem}C${left - spread + 1} 146 ${left - 3} 132 ${left} 119Z`;

    const cuffs =
        fill("M38.8 180.6L49 180.6L49 185.4L38.8 185.4Z M51 180.6L61.2 180.6L61.2 185.4L51 185.4Z", bottomLight, 1);

    const straps = `M43 95L${50 - S + 4.5} 80.5M57 95L${50 + S - 4.5} 80.5`;

    const bib =
        strokes(straps, LINE, 3.6)
        + strokes(straps, bottom, 2.2)
        + fill(`M42 94L58 94L${50 + W - 1} 124L${50 - W + 1} 124Z`, bottom, 1.1)
        + fill("M45.5 99L54.5 99L54.5 106L45.5 106Z", bottom, 0.8)
        + `<circle cx="43.4" cy="96" r="1.2" fill="${GOLD}" stroke="${LINE}" stroke-width="0.5"/><circle cx="56.6" cy="96" r="1.2" fill="${GOLD}" stroke="${LINE}" stroke-width="0.5"/>`;

    switch (p.avatar.bottom) {

        case "jeans":
            return {
                under: fill(trousers(), bottom, 1.2)
                    + strokes("M44 138L43.6 180M56 138L56.4 180", bottomLight, 0.6, 0.7)
                    + cuffs
            };

        case "wide":
            return {
                under: fill(trousers(186, 35.5, 64.5), bottom, 1.2)
                    + strokes("M43 140L41 184M57 140L59 184", bottomDark, 0.7, 0.7)
            };

        case "skirt":
            return {
                under: fill(skirt(157, 8), bottom, 1.2)
                    + strokes("M44 128L41 156M50 128L50 158M56 128L59 156", bottomDark, 0.7, 0.7)
            };

        case "pleated": {
            let pleats = "";
            for (let t = 0.12; t < 0.95; t += 0.15) {
                pleats += `M${f(left + t * (right - left))} 121L${f(left - 6 + t * (right - left + 12))} 150`;
            }
            return {
                under: fill(skirt(150, 6), bottom, 1.2)
                    + strokes(pleats, bottomDark, 0.8, 0.8)
                    + strokes(`M${left - 1} 129L${right + 1} 129M${left - 3} 137L${right + 3} 137M${left - 4.8} 145L${right + 4.8} 145`, bottomLight, 1.1, 0.8)
                    + strokes(`M${left - 1} 131L${right + 1} 131M${left - 3} 139L${right + 3} 139`, "#b44d5e", 0.6, 0.8)
            };
        }

        case "long-skirt":
            return {
                under: fill(skirt(182, 11), bottom, 1.2)
                    + strokes(`M${left - 4} 152Q50 156 ${right + 4} 152`, bottomDark, 0.9)
                    + strokes("M45 124L42 180M55 124L58 180M50 156L50 184", bottomDark, 0.6, 0.6)
            };

        case "shorts":
            return {
                under: fill(`M${left} 119L${right} 119L${right + 2.5} 142L50.8 142L50 135L49.2 142L${left - 2.5} 142Z`, bottom, 1.2)
                    + fill(`M${left - 2.3} 138.4L49.3 138.4L49.2 142L${left - 2.5} 142Z M${right + 2.3} 138.4L50.7 138.4L50.8 142L${right + 2.5} 142Z`, bottomLight, 0.9)
            };

        case "overalls":
            return {
                under: fill(trousers(), bottom, 1.2) + cuffs,
                over: bib
            };

        case "pinafore":
            return {
                under: fill(skirt(156, 8), bottom, 1.2)
                    + strokes("M44 128L41 155M56 128L59 155", bottomDark, 0.7, 0.7),
                over: bib
            };

        default:
            return {
                under: fill(trousers(), bottom, 1.2)
                    + strokes("M44 140L44 184M56 140L56 184", bottomDark, 0.6, 0.6)
            };

    }

}


/* Wraps: a scarf, a quilt, a shawl or a cloak. */

function wrapFor(p, uid) {

    const L = 50 - p.S;
    const R = 50 + p.S;

    switch (p.avatar.wrap) {

        case "scarf": {
            const color = ["berry", "rose", "plum"].includes(p.avatar.topColor) ? "#d2a041" : "#b44d5e";
            return {
                front: fill("M40.5 75.5Q50 83.5 59.5 75.5L60.6 82.6Q50 90.6 39.4 82.6Z", color, 1.2)
                    + fill("M53.2 85.5L56.8 107L49.6 108.2L49.4 87.6Z", color, 1.2)
                    + strokes("M49.8 108L49.4 111M52 107.6L51.8 110.8M54.2 107.3L54.4 110.4M56.4 107L57 110", color, 1)
                    + strokes("M42 78L43.6 84.4M46 79.8L47 86M54 79.8L53 86M58 78L56.4 84.4M50.2 92L55.1 92M50.4 97L55.8 97M50.6 102L56.4 102", CREAM, 0.9, 0.85)
            };
        }

        case "quilt": {
            const id = `quilt${uid}`;
            const colors = ["#c96a4a", "#e8c07a", "#8aa07a", "#d98ba1", "#f4e6cc", "#6e8fae"];
            let squares = "";
            for (let row = 0; row < 3; row += 1) {
                for (let col = 0; col < 3; col += 1) {
                    squares += `<rect x="${col * 7}" y="${row * 7}" width="7" height="7" fill="${colors[(row * 2 + col * 5) % colors.length]}"/>`;
                }
            }
            const half = `M45 76.5C${L - 3} 77 ${L - 8.5} 86 ${50 - p.H - 10} 108C${50 - p.H - 12.5} 122 ${50 - p.H - 11} 132 ${50 - p.H - 8} 140L${50 - p.H + 3} 140C46 126 44.5 100 46.5 80Z`;
            return {
                defs: `<pattern id="${id}" width="21" height="21" patternUnits="userSpaceOnUse" patternTransform="rotate(6)">${squares}<path d="M0 7H21M0 14H21M7 0V21M14 0V21" stroke="${LINE}" stroke-width="0.35" stroke-dasharray="1 1" opacity="0.6"/></pattern>`,
                back: fill(`M${L - 2} 80C${L - 10} 96 ${50 - p.H - 13} 124 ${50 - p.H - 12} 146Q50 152 ${50 + p.H + 12} 146C${50 + p.H + 13} 124 ${R + 10} 96 ${R + 2} 80Z`, `url(#${id})`, 1.3)
                    + `<path d="M${L - 2} 80C${L - 10} 96 ${50 - p.H - 13} 124 ${50 - p.H - 12} 146Q50 152 ${50 + p.H + 12} 146C${50 + p.H + 13} 124 ${R + 10} 96 ${R + 2} 80Z" fill="rgba(60,30,30,0.22)"/>`,
                front: fill(both(half), `url(#${id})`, 1.3)
                    + strokes(both(`M${50 - p.H + 3} 140Q${50 - p.H - 3} 143 ${50 - p.H - 8} 140`), LINE, 0.5, 0.5)
            };
        }

        case "shawl":
            return {
                front: fill(`M${L - 2.5} 84Q50 76 ${R + 2.5} 84L${R + 2} 96Q60 104 50 118Q40 104 ${L - 2} 96Z`, "#e8d2b0", 1.2)
                    + strokes(`M${L - 1.6} 88Q50 81 ${R + 1.6} 88`, "#c9ad84", 0.8, 0.8)
                    + [[40, 92], [46, 90], [54, 90], [60, 92], [44, 98], [50, 97], [56, 98], [47, 105], [53, 105], [50, 111]]
                        .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1" fill="none" stroke="#b89868" stroke-width="0.6"/>`).join("")
                    + strokes(`M${R + 2} 96L${R + 3} 100M60 104L60.6 108M56 109L56.4 113M52 115L52.2 119M48 115L47.8 119M44 109L43.6 113M40 104L39.4 108M${L - 2} 96L${L - 3} 100`, "#c9ad84", 0.9)
            };

        case "cloak": {
            const green = "#4d6a4a";
            return {
                back: fill(`M${L} 80C${L - 8} 100 ${50 - p.H - 12} 140 ${50 - p.H - 13} 166Q50 171 ${50 + p.H + 13} 166C${50 + p.H + 12} 140 ${R + 8} 100 ${R} 80Z`, shade(green, -0.15), 1.3)
                    + fill("M35.5 81C31 70 40 64.5 50 66.5C60 64.5 69 70 64.5 81Z", green, 1.2),
                front: fill(both(`M45 78C${L} 79 ${L - 3.5} 86 ${L - 4.5} 97C${L - 5.5} 112 ${50 - p.H - 9} 134 ${50 - p.H - 11} 158L${50 - p.H - 4} 158C${50 - p.H - 1} 134 ${L + 5} 110 ${L + 5.5} 94C${L + 6} 86 42 81 45 78Z`), green, 1.2)
                    + strokes(both(`M${L - 1.5} 90C${L - 3} 110 ${50 - p.H - 6} 132 ${50 - p.H - 7.5} 152`), shade(green, 0.25), 0.8, 0.6)
                    + strokes("M44.6 80.5Q50 83 55.4 80.5", GOLD, 0.9)
                    + `<circle cx="44.6" cy="80.5" r="1.8" fill="${GOLD}" stroke="${LINE}" stroke-width="0.7"/><circle cx="55.4" cy="80.5" r="1.8" fill="${GOLD}" stroke="${LINE}" stroke-width="0.7"/>`
            };
        }

        default:
            return {};

    }

}


/* =========================================================
   COMPANIONS
   Cats and the puppy sit at the reader's feet; the raven and
   the dragon perch on a shoulder (so they're in the portrait
   too).
========================================================= */

function catAt(x, coat, { patches = "", stripes = "", eyes = "closed" } = {}) {

    const dark = shade(coat, -0.3);

    const face = eyes === "open"
        ? `<ellipse cx="${x - 3}" cy="171.4" rx="1.3" ry="1.6" fill="#e8c04a"/><ellipse cx="${x + 3}" cy="171.4" rx="1.3" ry="1.6" fill="#e8c04a"/>`
          + `<ellipse cx="${x - 3}" cy="171.5" rx="0.45" ry="1.2" fill="#1b1416"/><ellipse cx="${x + 3}" cy="171.5" rx="0.45" ry="1.2" fill="#1b1416"/>`
        : strokes(`M${x - 4.4} 171.2Q${x - 3} 172.8 ${x - 1.6} 171.2M${x + 1.6} 171.2Q${x + 3} 172.8 ${x + 4.4} 171.2`, LINE, 0.9);

    return fill(`M${x + 6} 192C${x + 16} 193 ${x + 17} 184 ${x + 12} 181C${x + 10} 180 ${x + 9} 182 ${x + 11} 183C${x + 13} 185 ${x + 12} 190 ${x + 5} 190Z`, coat, 1.1)
        + fill(`M${x - 6.5} 194C${x - 9} 186 ${x - 6.5} 177 ${x} 176.5C${x + 6.5} 177 ${x + 9} 186 ${x + 6.5} 194Z`, coat, 1.2)
        + patches
        + fill(`M${x - 7.5} 166L${x - 7} 159.5L${x - 3} 163.4Z`, coat, 1.1)
        + fill(`M${x + 7.5} 166L${x + 7} 159.5L${x + 3} 163.4Z`, coat, 1.1)
        + `<ellipse cx="${x}" cy="170" rx="8" ry="6.8" fill="${coat}" stroke="${LINE}" stroke-width="1.2"/>`
        + `<path d="M${x - 6.4} 164.6L${x - 6} 161.6L${x - 4} 163.6Z M${x + 6.4} 164.6L${x + 6} 161.6L${x + 4} 163.6Z" fill="#e8a0b4"/>`
        + stripes
        + face
        + fill(`M${x - 0.9} 173.6L${x + 0.9} 173.6L${x} 174.6Z`, "#e8798f", 0.4)
        + strokes(`M${x} 174.6Q${x - 1} 176 ${x - 2} 175.4M${x} 174.6Q${x + 1} 176 ${x + 2} 175.4`, LINE, 0.6)
        + strokes(`M${x - 5} 174L${x - 10} 173M${x - 5} 175.2L${x - 9.6} 176M${x + 5} 174L${x + 10} 173M${x + 5} 175.2L${x + 9.6} 176`, dark, 0.45)
        + strokes(`M${x - 3} 190L${x - 3} 194M${x + 3} 190L${x + 3} 194`, dark, 0.6);

}

function companionFor(p) {

    const x = 80;

    switch (p.avatar.companion) {

        case "cat-ginger":
            return catAt(x, "#e0955a", {
                stripes: strokes(`M${x - 2} 164.4L${x - 1} 166.6M${x} 164L${x} 166.6M${x + 2} 164.4L${x + 1} 166.6M${x - 6} 185L${x - 3} 185.6M${x + 6} 185L${x + 3} 185.6`, "#b0643a", 0.9)
            });

        case "cat-black":
            return catAt(x, "#35303a", { eyes: "open" });

        case "cat-grey":
            return catAt(x, "#a4a4ae", {
                stripes: strokes(`M${x - 2} 164.4L${x - 1} 166.6M${x + 2} 164.4L${x + 1} 166.6`, "#76767f", 0.9)
            });

        case "cat-calico":
            return catAt(x, "#f6ecdc", {
                patches: `<path d="M${x - 6} 182C${x - 7} 178 ${x - 3} 177 ${x - 1} 180C${x} 184 ${x - 4} 186 ${x - 6} 182Z" fill="#e0955a"/><path d="M${x + 3} 186C${x + 4} 183 ${x + 7} 184 ${x + 6.6} 188C${x + 5} 190 ${x + 3} 189 ${x + 3} 186Z" fill="#3b3438"/>`,
                stripes: `<path d="M${x - 7.6} 167C${x - 7} 163 ${x - 3} 163 ${x - 2.4} 166C${x - 3} 168 ${x - 6} 169 ${x - 7.6} 167Z" fill="#e0955a"/><path d="M${x + 3} 164.2C${x + 5} 163 ${x + 7.6} 165 ${x + 7.6} 168C${x + 6} 168 ${x + 4} 167 ${x + 3} 164.2Z" fill="#3b3438"/>`
            });

        case "puppy": {
            const px = 20;
            const coat = "#c08a5a";
            return strokes(`M${px - 6} 190C${px - 13} 190 ${px - 15} 185 ${px - 12} 182`, LINE, 3.4)
                + strokes(`M${px - 6} 190C${px - 13} 190 ${px - 15} 185 ${px - 12} 182`, coat, 1.8)
                + fill(`M${px - 7} 194C${px - 9.5} 186 ${px - 7} 177 ${px} 176.5C${px + 7} 177 ${px + 9.5} 186 ${px + 7} 194Z`, coat, 1.2)
                + fill(`M${px - 4} 194C${px - 4} 188 ${px + 4} 188 ${px + 4} 194Z`, "#f4e6cc", 0.9)
                + `<ellipse cx="${px}" cy="170" rx="8.4" ry="7.2" fill="${coat}" stroke="${LINE}" stroke-width="1.2"/>`
                + fill(`M${px - 7} 165C${px - 12} 165 ${px - 12} 176 ${px - 8} 177C${px - 6} 174 ${px - 5.6} 169 ${px - 7} 165Z`, "#7a4f33", 1.1)
                + fill(`M${px + 7} 165C${px + 12} 165 ${px + 12} 176 ${px + 8} 177C${px + 6} 174 ${px + 5.6} 169 ${px + 7} 165Z`, "#7a4f33", 1.1)
                + `<ellipse cx="${px}" cy="173.6" rx="3.8" ry="2.8" fill="#f4e6cc"/>`
                + `<circle cx="${px - 3.2}" cy="169.8" r="1" fill="${LINE}"/><circle cx="${px + 3.2}" cy="169.8" r="1" fill="${LINE}"/>`
                + `<ellipse cx="${px}" cy="172.4" rx="1.4" ry="1" fill="${LINE}"/>`
                + fill(`M${px - 1} 175.2Q${px} 178.6 ${px + 1.2} 175.2Z`, "#e8798f", 0.5)
                + strokes(`M${px - 2} 174.6Q${px} 176 ${px + 2} 174.6`, LINE, 0.6);
        }

        case "raven":
            return fill("M73 73C76 69 82 69 84 73C86 78 83 83 77 84L72 84C70 80 71 76 73 73Z", "#2e2a36", 1.1)
                + fill("M76 82L86 88L84 84Z", "#2e2a36", 1)
                + `<circle cx="72" cy="70.5" r="4.4" fill="#2e2a36" stroke="${LINE}" stroke-width="1.1"/>`
                + fill("M68 70L64 71.6L68 72.6Z", GOLD, 0.8)
                + `<circle cx="71" cy="69.6" r="0.9" fill="#fff4d6"/>`
                + strokes("M76 76Q79 78 82 76M75 79Q78 81 81 80", "#5a5468", 0.7)
                + strokes("M74.5 84L74 86.6M77 84L77 86.6", GOLD, 0.8);

        case "dragon": {
            const green = "#7aa36a";
            return fill("M24 76C18 72 16 64 21 60C22 66 24 68 27 69Z", "#b8d6a0", 1)
                + fill("M34 83C28 84 24 80 26 75C28 71 35 71 37 76Z", green, 1.1)
                + fill("M35 80C38 84 36 90 31 90C29 90 29 88 31 87.6C34 87 34 84 32.8 82Z", green, 1)
                + `<circle cx="28.6" cy="71" r="4.6" fill="${green}" stroke="${LINE}" stroke-width="1.1"/>`
                + fill("M26 67.4L24.6 63.4L28 66.2Z M31 66.8L32 62.6L33 67Z", "#f3cb79", 0.7)
                + strokes("M26.6 71Q27.6 72 28.6 71", LINE, 0.8)
                + `<circle cx="31.4" cy="73" r="0.6" fill="${LINE}"/>`
                + `<ellipse cx="26.4" cy="73" rx="1.2" ry="0.7" fill="#ef7f8f" opacity="0.5"/>`
                + strokes("M29 78L30 79M31.4 77.4L32.4 78.4", "#4f7a45", 0.7);
        }

        default:
            return "";

    }

}

const ON_SHOULDER = ["raven", "dragon"];


/* =========================================================
   THE PICTURES
========================================================= */

let serial = 0;

// The reader, back to front (without a companion at their feet).
function readerLayers(avatar, uid) {

    const p = paletteFor(avatar);

    const hair = hairLayers(p);

    const clothes = topFor(p);

    const bottoms = bottomsFor(p);

    const wrap = wrapFor(p, uid);

    return {
        p,
        defs: wrap.defs || "",
        body: [
            wrap.back || "",
            headwearFor(p, "back"),
            hair.back,
            legsFor(p),
            shoesFor(p),
            bottoms.under,
            fill("M45.5 64L45.5 79Q50 81.6 54.5 79L54.5 64Z", p.skinDark, 1.1),
            `<path d="M45.5 69.5Q50 73.5 54.5 69.5L54.5 72.5Q50 76 45.5 72.5Z" fill="${p.skinDeep}" opacity="0.35"/>`,
            clothes.body,
            bottoms.over || "",
            clothes.over,
            armsFor(p, clothes),
            wrap.front || "",
            hair.sides,
            headFor(p),
            hair.front,
            glassesFor(p),
            headwearFor(p, "front"),
            bookAndHands(p),
            ON_SHOULDER.includes(avatar.companion) ? companionFor(p) : ""
        ].join("")
    };

}

function labelAttributes(label) {
    return label
        ? `role="img" aria-label="${String(label).replace(/[<>"&]/g, "")}"`
        : `aria-hidden="true"`;
}


// The whole reader, standing, in a 92 × 206 box.
export function avatarFigure(saved, { seed = "reader", label = "" } = {}) {

    const avatar =
        normalizeAvatar(saved, seed);

    const layers =
        readerLayers(avatar, ++serial);

    const atFeet =
        ON_SHOULDER.includes(avatar.companion) ? "" : companionFor(layers.p);

    const shadow =
        avatar.companion.startsWith("cat") ? { cx: 60, rx: 32 }
            : avatar.companion === "puppy" ? { cx: 40, rx: 32 }
            : { cx: 50, rx: 20 };

    return `<svg class="avatar-figure" viewBox="4 -6 92 206" ${labelAttributes(label)}>
        <defs>${layers.defs}</defs>
        <ellipse cx="${shadow.cx}" cy="195" rx="${shadow.rx}" ry="3.4" fill="rgba(40, 18, 18, 0.2)"/>
        ${layers.body}
        ${atFeet}
    </svg>`;

}


// Head and shoulders in a circle.
export function avatarPortrait(saved, { seed = "reader", label = "" } = {}) {

    const avatar =
        normalizeAvatar(saved, seed);

    const uid = ++serial;

    const layers =
        readerLayers(avatar, uid);

    return `<svg class="avatar-art" viewBox="13 12 74 74" ${labelAttributes(label)}>
        <defs>${layers.defs}<clipPath id="avatarClip${uid}"><circle cx="50" cy="49" r="37"/></clipPath></defs>
        <g clip-path="url(#avatarClip${uid})">
            <rect x="0" y="0" width="100" height="100" fill="#f1e2c6"/>
            <circle cx="50" cy="46" r="31" fill="#f8ecd4"/>
            ${layers.body}
        </g>
    </svg>`;

}
