/* =========================================================
   NOVELLOW
   READER AVATARS

   A reader's avatar is a handful of choices (profiles.avatar,
   see sql/avatars.sql): skin, face, eyes, hair, clothes and a
   few extras. From them this draws two pictures in the same
   inked, cozy style as the room:

     avatarPortrait(avatar)  head and shoulders, for profiles,
                             friend cards, posts and the header
     avatarSeated(avatar)    curled up with a book, for the
                             armchair when someone visits

   Both are plain SVG strings, built only from the choices
   below (never from text a reader typed), so they're safe to
   drop into the page.
========================================================= */

const INK = "#2b1d24";


/* =========================================================
   THE CHOICES
========================================================= */

export const SKIN_TONES = [
    { id: "porcelain", label: "Porcelain", color: "#fbe4d5" },
    { id: "peach", label: "Peach", color: "#f5cfb4" },
    { id: "sand", label: "Sand", color: "#eab996" },
    { id: "honey", label: "Honey", color: "#d9a071" },
    { id: "caramel", label: "Caramel", color: "#bb7c50" },
    { id: "bronze", label: "Bronze", color: "#9a5f3a" },
    { id: "umber", label: "Umber", color: "#744429" },
    { id: "ebony", label: "Ebony", color: "#4c2c1d" }
];

export const FACE_SHAPES = [
    { id: "round", label: "Round" },
    { id: "oval", label: "Oval" },
    { id: "heart", label: "Heart" },
    { id: "soft-square", label: "Soft square" }
];

export const EYES = [
    { id: "round", label: "Round" },
    { id: "almond", label: "Almond" },
    { id: "sparkly", label: "Sparkly" },
    { id: "lashes", label: "Lashes" },
    { id: "sleepy", label: "Sleepy" },
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
    { id: "smirk", label: "Smirk" }
];

export const HAIR_STYLES = [
    { id: "short", label: "Short crop" },
    { id: "pixie", label: "Pixie" },
    { id: "bob", label: "Bob" },
    { id: "long", label: "Long" },
    { id: "waves", label: "Long waves" },
    { id: "curly", label: "Curls" },
    { id: "coils", label: "Coils" },
    { id: "bun", label: "Top bun" },
    { id: "ponytail", label: "Ponytail" },
    { id: "braids", label: "Braids" },
    { id: "locs", label: "Locs" },
    { id: "none", label: "Bald" }
];

export const HAIR_COLORS = [
    { id: "black", label: "Black", color: "#2a1f22" },
    { id: "espresso", label: "Espresso", color: "#4a3024" },
    { id: "chestnut", label: "Chestnut", color: "#7a4a2c" },
    { id: "auburn", label: "Auburn", color: "#9c4a2c" },
    { id: "copper", label: "Copper", color: "#c66a36" },
    { id: "honey", label: "Honey blonde", color: "#d9a55a" },
    { id: "platinum", label: "Platinum", color: "#efe0bd" },
    { id: "silver", label: "Silver", color: "#b9b4ae" },
    { id: "plum", label: "Plum", color: "#6e3b58" },
    { id: "rose", label: "Rose", color: "#d98ba1" },
    { id: "sage", label: "Sage", color: "#7f9a6e" },
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
    { id: "sweater", label: "Sweater" },
    { id: "moon-sweater", label: "Moon sweater" },
    { id: "cardigan", label: "Cardigan" },
    { id: "turtleneck", label: "Turtleneck" },
    { id: "hoodie", label: "Hoodie" },
    { id: "collar", label: "Collared dress" },
    { id: "shirt", label: "Button shirt" }
];

export const TOP_COLORS = [
    { id: "plum", label: "Plum", color: "#6e3b58" },
    { id: "berry", label: "Berry", color: "#9b3e5a" },
    { id: "rose", label: "Rose", color: "#d98ba1" },
    { id: "rust", label: "Rust", color: "#a85a3a" },
    { id: "mustard", label: "Mustard", color: "#c9973f" },
    { id: "sage", label: "Sage", color: "#6f8a5e" },
    { id: "forest", label: "Forest", color: "#3f5e45" },
    { id: "navy", label: "Navy", color: "#34416b" },
    { id: "cream", label: "Cream", color: "#efe2c8" },
    { id: "charcoal", label: "Charcoal", color: "#3b3438" }
];

export const EXTRAS = [
    { id: "none", label: "None" },
    { id: "witch-hat", label: "Witch hat" },
    { id: "beret", label: "Beret" },
    { id: "flower-crown", label: "Flower crown" },
    { id: "star-clips", label: "Star clips" },
    { id: "headscarf", label: "Headscarf" },
    { id: "scarf", label: "Cozy scarf" },
    { id: "headphones", label: "Headphones" },
    { id: "cat-ears", label: "Cat ears" }
];

// Everything the maker offers, in the order it shows them.
export const AVATAR_PARTS = [
    { key: "skin", label: "Skin", options: SKIN_TONES, swatch: true },
    { key: "face", label: "Face", options: FACE_SHAPES },
    { key: "eyes", label: "Eyes", options: EYES },
    { key: "eyeColor", label: "Eye colour", options: EYE_COLORS, swatch: true },
    { key: "mouth", label: "Mouth", options: MOUTHS },
    { key: "hair", label: "Hair", options: HAIR_STYLES },
    { key: "hairColor", label: "Hair colour", options: HAIR_COLORS, swatch: true },
    { key: "facialHair", label: "Facial hair", options: FACIAL_HAIR },
    { key: "glasses", label: "Glasses", options: GLASSES },
    { key: "top", label: "Clothes", options: TOPS },
    { key: "topColor", label: "Clothes colour", options: TOP_COLORS, swatch: true },
    { key: "extra", label: "Extra", options: EXTRAS }
];

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

    const choose = (list, salt) => list[(hash >>> salt) % list.length].id;

    const defaults = {
        skin: choose(SKIN_TONES, 1),
        face: "round",
        eyes: choose(["round", "almond", "sparkly"].map((id) => ({ id })), 3),
        eyeColor: choose(EYE_COLORS, 5),
        mouth: "smile",
        hair: choose(["short", "bob", "long", "curly", "bun", "waves"].map((id) => ({ id })), 7),
        hairColor: choose(HAIR_COLORS.slice(0, 7), 9),
        facialHair: "none",
        glasses: "none",
        top: choose(["sweater", "cardigan", "turtleneck", "moon-sweater"].map((id) => ({ id })), 11),
        topColor: choose(TOP_COLORS, 13),
        extra: "none",
        blush: true,
        freckles: false,
        inChair: false
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

        // Whether they sit in the armchair of their own room too
        // (visitors always find them there).
        avatar.inChair = saved.inChair === true;

    }

    return avatar;

}


/* =========================================================
   COLOUR HELPERS
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


/* =========================================================
   THE HEAD (drawn in a 100 × 100 box, face centred at 50)
========================================================= */

function faceShape(id) {

    switch (id) {
        case "oval":
            return "M50 25C62 25 67.5 35 67.5 47C67.5 60 59 68.5 50 68.5C41 68.5 32.5 60 32.5 47C32.5 35 38 25 50 25Z";
        case "heart":
            return "M50 26C63 26 69 34 69 45C69 57 58 67.5 50 68.5C42 67.5 31 57 31 45C31 34 37 26 50 26Z";
        case "soft-square":
            return "M50 26C62 26 68.5 30 68.5 44C68.5 58 63 66.5 50 67.5C37 66.5 31.5 58 31.5 44C31.5 30 38 26 50 26Z";
        default:
            return "M50 26C62.5 26 69.5 34.5 69.5 46.5C69.5 58.5 61 67.5 50 67.5C39 67.5 30.5 58.5 30.5 46.5C30.5 34.5 37.5 26 50 26Z";
    }

}


function eyesFor(avatar) {

    const iris =
        pick(EYE_COLORS, avatar.eyeColor).color;

    const one = (x, flip) => {

        switch (avatar.eyes) {

            case "sleepy":
                return `<path d="M${x - 3.4} 47.2Q${x} 50 ${x + 3.4} 47.2" fill="none" stroke="${INK}" stroke-width="1.5" stroke-linecap="round"/>`;

            case "monolid":
                return `<path d="M${x - 3.6} 46.6H${x + 3.6}" stroke="${INK}" stroke-width="1.5" stroke-linecap="round"/>
                    <path d="M${x - 2.6} 47.2Q${x} 49.4 ${x + 2.6} 47.2Z" fill="${iris}" stroke="${INK}" stroke-width="0.8"/>
                    <circle cx="${x + 0.8}" cy="47.7" r="0.5" fill="#fff"/>`;

            case "almond":
                return `<path d="M${x - 3.8} 47.2Q${x} 43.4 ${x + 3.8} 47.2Q${x} 50.4 ${x - 3.8} 47.2Z" fill="#fffaf2" stroke="${INK}" stroke-width="1"/>
                    <circle cx="${x}" cy="47.2" r="2" fill="${iris}"/>
                    <circle cx="${x}" cy="47.2" r="0.9" fill="${INK}"/>
                    <circle cx="${x + 0.8}" cy="46.4" r="0.55" fill="#fff"/>
                    <path d="M${x - 4} 46.8Q${x} 42.8 ${x + 4} 46.8" fill="none" stroke="${INK}" stroke-width="1.4" stroke-linecap="round"/>`;

            case "sparkly":
                return `<circle cx="${x}" cy="47" r="3.4" fill="${INK}"/>
                    <circle cx="${x}" cy="47.4" r="2.5" fill="${iris}"/>
                    <circle cx="${x + 1.1}" cy="45.9" r="1.1" fill="#fff"/>
                    <circle cx="${x - 1.2}" cy="48.6" r="0.55" fill="#fff"/>`;

            case "lashes": {
                const dir = flip ? -1 : 1;
                return `<circle cx="${x}" cy="47.2" r="2.7" fill="${INK}"/>
                    <circle cx="${x}" cy="47.6" r="1.9" fill="${iris}"/>
                    <circle cx="${x + 0.8}" cy="46.4" r="0.8" fill="#fff"/>
                    <path d="M${x + dir * 2.4} 45.2L${x + dir * 4.2} 43.8M${x + dir * 3} 46.3L${x + dir * 4.8} 45.6" stroke="${INK}" stroke-width="1" stroke-linecap="round"/>`;
            }

            default:
                return `<circle cx="${x}" cy="47.2" r="2.8" fill="${INK}"/>
                    <circle cx="${x}" cy="47.6" r="2" fill="${iris}"/>
                    <circle cx="${x + 0.9}" cy="46.3" r="0.85" fill="#fff"/>`;

        }

    };

    return one(41.5, true) + one(58.5, false);

}


function browsFor(avatar) {

    const color =
        avatar.hair === "none"
            ? shade(pick(SKIN_TONES, avatar.skin).color, -0.45)
            : shade(pick(HAIR_COLORS, avatar.hairColor).color, -0.25);

    return `<path d="M37.8 41.6Q41.5 39.4 45 41" fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round"/>
        <path d="M55 41Q58.5 39.4 62.2 41.6" fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round"/>`;

}


function mouthFor(avatar) {

    switch (avatar.mouth) {
        case "grin":
            return `<path d="M45.2 56.4Q50 57.4 54.8 56.4Q54 61.4 50 61.6Q46 61.4 45.2 56.4Z" fill="#7a2f3d" stroke="${INK}" stroke-width="1.1" stroke-linejoin="round"/>
                <path d="M46.6 57.2Q50 58 53.4 57.2" fill="none" stroke="#fff" stroke-width="1.1" stroke-linecap="round"/>`;
        case "calm":
            return `<path d="M46.8 57.8Q50 59 53.2 57.8" fill="none" stroke="${INK}" stroke-width="1.4" stroke-linecap="round"/>`;
        case "smirk":
            return `<path d="M46 58.2Q50 59.4 54.2 56.6" fill="none" stroke="${INK}" stroke-width="1.4" stroke-linecap="round"/>`;
        default:
            return `<path d="M45.6 56.6Q50 61 54.4 56.6" fill="none" stroke="${INK}" stroke-width="1.5" stroke-linecap="round"/>`;
    }

}


function facialHairFor(avatar, color) {

    switch (avatar.facialHair) {
        case "stubble":
            return `<path d="M35 55Q36 66 50 68Q64 66 65 55Q60 63 50 63Q40 63 35 55Z" fill="${color}" opacity="0.28"/>`;
        case "moustache":
            return `<path d="M44 55.2Q47 53.2 50 54.8Q53 53.2 56 55.2Q53 56.8 50 55.8Q47 56.8 44 55.2Z" fill="${color}" stroke="${INK}" stroke-width="0.8" stroke-linejoin="round"/>`;
        case "beard":
            return `<path d="M32.5 50Q33 66 50 70Q67 66 67.5 50Q64 60 58 60Q54 57 50 57.6Q46 57 42 60Q36 60 32.5 50Z" fill="${color}" stroke="${INK}" stroke-width="1.1" stroke-linejoin="round"/>
                <path d="M44 55.2Q47 53.2 50 54.8Q53 53.2 56 55.2Q53 56.8 50 55.8Q47 56.8 44 55.2Z" fill="${color}" stroke="${INK}" stroke-width="0.8" stroke-linejoin="round"/>
                <path d="M46.4 59.4Q50 61.2 53.6 59.4" fill="none" stroke="#7a2f3d" stroke-width="1.2" stroke-linecap="round"/>`;
        default:
            return "";
    }

}


function glassesFor(avatar) {

    const frame = `fill="rgba(220,236,240,0.28)" stroke="${INK}" stroke-width="1.3"`;

    switch (avatar.glasses) {
        case "round":
            return `<circle cx="41.5" cy="47.2" r="5.4" ${frame}/><circle cx="58.5" cy="47.2" r="5.4" ${frame}/>
                <path d="M46.9 46.6Q50 45 53.1 46.6M36.1 46.4L31.5 45M63.9 46.4L68.5 45" fill="none" stroke="${INK}" stroke-width="1.2"/>`;
        case "cateye":
            return `<path d="M35 44.2Q41 42.6 47 44.4Q47 51.6 41.4 51.8Q35.8 51.6 35 44.2Z" ${frame}/>
                <path d="M65 44.2Q59 42.6 53 44.4Q53 51.6 58.6 51.8Q64.2 51.6 65 44.2Z" ${frame}/>
                <path d="M47 45.4Q50 44.4 53 45.4M35 44.2L32.5 42.4M65 44.2L67.5 42.4" fill="none" stroke="${INK}" stroke-width="1.3"/>`;
        case "halfmoon":
            return `<path d="M36 47.6H47Q47 52.6 41.5 52.8Q36 52.6 36 47.6Z" ${frame}/>
                <path d="M53 47.6H64Q64 52.6 58.5 52.8Q53 52.6 53 47.6Z" ${frame}/>
                <path d="M47 48Q50 47 53 48M36 47.8L31.5 46.4M64 47.8L68.5 46.4" fill="none" stroke="${INK}" stroke-width="1.2"/>`;
        case "square":
            return `<rect x="35.4" y="43" width="11.6" height="8.6" rx="2" ${frame}/><rect x="53" y="43" width="11.6" height="8.6" rx="2" ${frame}/>
                <path d="M47 46.4Q50 45.2 53 46.4M35.4 45.6L31.5 44.6M64.6 45.6L68.5 44.6" fill="none" stroke="${INK}" stroke-width="1.2"/>`;
        default:
            return "";
    }

}


/*
    Hair comes in two layers: what falls behind the head (and
    shoulders), and the fringe and top in front of it.
*/
function hairLayers(avatar) {

    const color =
        pick(HAIR_COLORS, avatar.hairColor).color;

    const dark =
        shade(color, -0.22);

    const light =
        shade(color, 0.28);

    const fill = `fill="${color}" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"`;

    const sheen = (d) => `<path d="${d}" fill="none" stroke="${light}" stroke-width="1.6" stroke-linecap="round" opacity="0.75"/>`;

    const topCap =
        `<path d="M30 47C28 28 40 20 51 20C63 20 72 28 70 47C67 38 62 33 55 32C49 35 40 36 32 44Z" ${fill}/>`;

    switch (avatar.hair) {

        case "short":
            return {
                back: "",
                front: `<path d="M30.5 45C28.5 27 40 19.5 51 19.5C62 19.5 72 27 69.5 45C68 37 64 32.5 58 31.5C52 35 42 35.5 37 33C33.5 35.5 31.5 40 30.5 45Z" ${fill}/>`
                    + sheen("M41 24Q48 21 56 23")
            };

        case "pixie":
            return {
                back: "",
                front: `<path d="M30 46C27 27 40 19 51 19C63 19 72 27 70 44C68 36 63 32 56 31C57 36 52 40 44 41C47 37 46 34 44 33C40 36 34 39 30 46Z" ${fill}/>`
                    + sheen("M44 23Q51 20 58 23")
            };

        case "bob":
            return {
                back: `<path d="M27.5 46C26 25 38 18 50 18C62 18 74 25 72.5 46L73.5 64Q66 68 60 64L60 56L40 56L40 64Q34 68 26.5 64Z" fill="${dark}" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>`,
                front: `<path d="M29 50C27 27 40 19 51 19C63 19 73 28 71 50C69 40 66 35 60 33C54 38 44 40 34 38C31 42 29.5 46 29 50Z" ${fill}/>`
                    + sheen("M42 23Q50 20 58 23")
            };

        case "long":
            return {
                back: `<path d="M27.5 44C26 22 39 17 50 17C61 17 74 22 72.5 44L76 88Q64 93 58 88L57 64L43 64L42 88Q36 93 24 88Z" fill="${dark}" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>`,
                front: `<path d="M29 56C26 30 38 19 50 19C62 19 74 30 71 56C69 42 64 34 55 31C53 29 51 28 50 27C49 28 47 29 45 31C36 34 31 42 29 56Z" ${fill}/>`
                    + sheen("M40 25Q46 21 50 27M60 25Q54 21 50 27")
            };

        case "waves":
            return {
                back: `<path d="M27 44C25 22 39 17 50 17C61 17 75 22 73 44C77 52 72 58 76 66C79 74 72 80 76 88Q64 93 58 88L57 64L43 64L42 88Q36 93 24 88C28 80 21 74 24 66C28 58 23 52 27 44Z" fill="${dark}" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>`,
                front: `<path d="M29 54C26 30 38 19 50 19C62 19 74 30 71 54C70 46 67 40 64 38C64 34 60 31 56 31C52 33 46 33 42 31C37 32 34 36 34 40C31 43 30 48 29 54Z" ${fill}/>`
                    + sheen("M40 25Q50 19 60 25")
            };

        case "curly": {
            const puffs =
                [[30, 34], [36, 24], [46, 18], [57, 18], [66, 24], [71, 35], [73, 47], [27, 47], [70, 58], [30, 58]]
                    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8.2" fill="${color}" stroke="${INK}" stroke-width="1.4"/>`).join("");
            return {
                back: `<ellipse cx="50" cy="40" rx="26" ry="25" fill="${dark}" stroke="${INK}" stroke-width="1.5"/>` + puffs,
                front: [[36, 31], [43, 27], [51, 26], [59, 27], [65, 32]]
                    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5.6" fill="${color}" stroke="${INK}" stroke-width="1.2"/>`).join("")
                    + sheen("M44 21Q50 19 56 21")
            };
        }

        case "coils": {
            const coils =
                Array.from({ length: 16 }, (_, index) => {
                    const angle = Math.PI * (0.95 + (index / 15) * 1.1);
                    const x = 50 + Math.cos(angle) * 27;
                    const y = 42 + Math.sin(angle) * 25;
                    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5.2" fill="${color}" stroke="${INK}" stroke-width="1.1"/>`;
                }).join("");
            return {
                back: `<ellipse cx="50" cy="39" rx="28" ry="26" fill="${dark}" stroke="${INK}" stroke-width="1.5"/>` + coils,
                front: `<path d="M31 42C31 30 40 25 50 25C60 25 69 30 69 42C65 35 58 32 50 32C42 32 35 35 31 42Z" ${fill}/>`
                    + [[37, 30], [44, 27], [51, 26], [58, 27], [64, 31]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.6" fill="${color}" stroke="${INK}" stroke-width="1"/>`).join("")
            };
        }

        case "bun":
            return {
                back: `<circle cx="50" cy="15" r="9.5" fill="${color}" stroke="${INK}" stroke-width="1.5"/>`
                    + `<path d="M44 13Q50 9 56 13" fill="none" stroke="${dark}" stroke-width="1.2"/>`,
                front: topCap + sheen("M42 24Q50 21 58 24")
            };

        case "ponytail":
            return {
                back: `<path d="M64 26C76 28 80 44 76 62C74 72 78 80 72 84C70 74 66 66 66 56C66 46 64 38 60 32Z" fill="${dark}" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>`,
                front: topCap + `<circle cx="65" cy="30" r="2.6" fill="#c9973f" stroke="${INK}" stroke-width="1"/>` + sheen("M42 24Q50 21 58 24")
            };

        case "braids": {
            const braid = (x) => Array.from({ length: 6 }, (_, index) =>
                `<ellipse cx="${x}" cy="${58 + index * 5.4}" rx="4" ry="3.4" fill="${index % 2 ? dark : color}" stroke="${INK}" stroke-width="1.1"/>`).join("");
            return {
                back: braid(29) + braid(71),
                front: topCap.replace("M30 47", "M30 50") + sheen("M42 24Q50 21 58 24")
            };
        }

        case "locs": {
            const locs =
                [24, 28.5, 33, 67, 71.5, 76].map((x, index) =>
                    `<path d="M${x} 40Q${x + (index < 3 ? -2 : 2)} 64 ${x} 86" fill="none" stroke="${INK}" stroke-width="6.4" stroke-linecap="round"/>
                     <path d="M${x} 40Q${x + (index < 3 ? -2 : 2)} 64 ${x} 86" fill="none" stroke="${index % 2 ? color : dark}" stroke-width="4.2" stroke-linecap="round"/>`).join("");
            return {
                back: `<path d="M26 46C25 24 38 17 50 17C62 17 75 24 74 46Z" fill="${dark}" stroke="${INK}" stroke-width="1.5"/>` + locs,
                front: topCap + sheen("M42 24Q50 21 58 24")
            };
        }

        default:
            return { back: "", front: "" };

    }

}


function headwearFor(avatar, layer) {

    const hair =
        pick(HAIR_COLORS, avatar.hairColor).color;

    switch (avatar.extra) {

        case "witch-hat":
            return layer === "front"
                ? `<path d="M22 30Q50 20 78 30Q72 35 50 34Q28 35 22 30Z" fill="#3b2a3f" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>
                   <path d="M34 30Q42 12 52 2Q56 8 60 10Q62 20 66 29Q50 33 34 30Z" fill="#3b2a3f" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>
                   <path d="M35 28Q50 31 65 27" fill="none" stroke="#c9973f" stroke-width="3"/>
                   <path d="M56 18L57 20.4L59.4 21L57 21.6L56 24L55 21.6L52.6 21L55 20.4Z" fill="#f3cb79"/>`
                : "";

        case "beret":
            return layer === "front"
                ? `<path d="M28 34Q27 18 50 16Q74 16 74 30Q70 36 50 35Q34 36 28 34Z" fill="#9b3e5a" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>
                   <path d="M49 16Q50 11 52 12" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`
                : "";

        case "flower-crown":
            return layer === "front"
                ? `<path d="M29 33Q50 22 71 33" fill="none" stroke="#5d7a4a" stroke-width="2.4"/>`
                  + [[31, 32, "#e8a0b4"], [39, 27, "#f3cb79"], [47, 24.5, "#c9a0d8"], [55, 24.5, "#e8a0b4"], [63, 27, "#f3cb79"], [69, 32, "#c9a0d8"]]
                    .map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="3.3" fill="${c}" stroke="${INK}" stroke-width="0.9"/><circle cx="${x}" cy="${y}" r="1" fill="#fff4d6"/>`).join("")
                : "";

        case "star-clips":
            return layer === "front"
                ? [[35, 30], [64, 29]].map(([x, y]) =>
                    `<path d="M${x} ${y - 4}L${x + 1.3} ${y - 1.2}L${x + 4} ${y}L${x + 1.3} ${y + 1.2}L${x} ${y + 4}L${x - 1.3} ${y + 1.2}L${x - 4} ${y}L${x - 1.3} ${y - 1.2}Z" fill="#f3cb79" stroke="${INK}" stroke-width="0.9" stroke-linejoin="round"/>`).join("")
                : "";

        case "headscarf":
            return layer === "back"
                ? `<path d="M64 40Q76 50 72 66Q66 60 62 52Z" fill="#c9973f" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>`
                : `<path d="M29 46C27 26 39 18 50 18C61 18 73 26 71 46C66 36 60 32 50 32C40 32 34 36 29 46Z" fill="#c9973f" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>
                   <path d="M36 27Q50 22 64 27M33 34Q50 28 67 34" fill="none" stroke="#9b3e5a" stroke-width="1.4" stroke-dasharray="2 2.4"/>`;

        case "headphones":
            return layer === "front"
                ? `<path d="M28 46Q27 18 50 17Q73 18 72 46" fill="none" stroke="${INK}" stroke-width="5"/>
                   <path d="M28 46Q27 18 50 17Q73 18 72 46" fill="none" stroke="#9b3e5a" stroke-width="3"/>
                   <rect x="23" y="41" width="9" height="14" rx="4" fill="#9b3e5a" stroke="${INK}" stroke-width="1.4"/>
                   <rect x="68" y="41" width="9" height="14" rx="4" fill="#9b3e5a" stroke="${INK}" stroke-width="1.4"/>`
                : "";

        case "cat-ears":
            return layer === "front"
                ? `<path d="M31 30L30 14L43 24Z" fill="${hair === "#2a1f22" ? "#3b2a3f" : "#2a1f22"}" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>
                   <path d="M69 30L70 14L57 24Z" fill="${hair === "#2a1f22" ? "#3b2a3f" : "#2a1f22"}" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>
                   <path d="M33 25L33 18L39 23Z M67 25L67 18L61 23Z" fill="#e8a0b4"/>`
                : "";

        default:
            return "";

    }

}


function headGroup(avatar) {

    const skin =
        pick(SKIN_TONES, avatar.skin).color;

    const skinShade =
        shade(skin, -0.14);

    const hair =
        hairLayers(avatar);

    const hairColor =
        pick(HAIR_COLORS, avatar.hairColor).color;

    const freckles =
        avatar.freckles
            ? [[38, 53], [40.6, 54.6], [42.4, 52.6], [57.6, 52.6], [59.4, 54.6], [62, 53]]
                .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="0.55" fill="${shade(skin, -0.42)}"/>`).join("")
            : "";

    const blush =
        avatar.blush
            ? `<ellipse cx="38.5" cy="54" rx="3.8" ry="2.3" fill="#e8798f" opacity="0.38"/><ellipse cx="61.5" cy="54" rx="3.8" ry="2.3" fill="#e8798f" opacity="0.38"/>`
            : "";

    return `
        ${headwearFor(avatar, "back")}
        ${hair.back}
        <ellipse cx="30.8" cy="49" rx="3.4" ry="4.6" fill="${skinShade}" stroke="${INK}" stroke-width="1.3"/>
        <ellipse cx="69.2" cy="49" rx="3.4" ry="4.6" fill="${skinShade}" stroke="${INK}" stroke-width="1.3"/>
        <path d="${faceShape(avatar.face)}" fill="${skin}" stroke="${INK}" stroke-width="1.6"/>
        ${blush}
        ${freckles}
        ${eyesFor(avatar)}
        ${browsFor(avatar)}
        <path d="M49.6 50.4Q48.4 53.4 50.6 53.6" fill="none" stroke="${shade(skin, -0.35)}" stroke-width="1.1" stroke-linecap="round"/>
        ${facialHairFor(avatar, hairColor)}
        ${avatar.facialHair === "beard" ? "" : mouthFor(avatar)}
        ${hair.front}
        ${glassesFor(avatar)}
        ${headwearFor(avatar, "front")}
    `;

}


/* =========================================================
   CLOTHES (the shoulders, in the same 100 × 100 box)
========================================================= */

function topGroup(avatar) {

    const skin =
        pick(SKIN_TONES, avatar.skin).color;

    const color =
        pick(TOP_COLORS, avatar.topColor).color;

    const dark =
        shade(color, -0.2);

    const light =
        shade(color, 0.3);

    const body =
        `<path d="M16 100C17 82 30 72.5 50 72.5C70 72.5 83 82 84 100Z" fill="${color}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`;

    const neck =
        `<path d="M44 62H56V74Q50 77 44 74Z" fill="${shade(skin, -0.14)}" stroke="${INK}" stroke-width="1.4"/>`;

    let detail = "";

    switch (avatar.top) {

        case "moon-sweater":
            detail = `<path d="M40 73.5Q50 78 60 73.5" fill="none" stroke="${dark}" stroke-width="3"/>
                <path d="M53 83A6 6 0 1 0 55.5 93A4.8 4.8 0 0 1 53 83Z" fill="#f3cb79" stroke="${INK}" stroke-width="0.9"/>
                <path d="M39 86L39.8 88.2L42 89L39.8 89.8L39 92L38.2 89.8L36 89L38.2 88.2Z" fill="#fff4d6"/>`;
            break;

        case "cardigan":
            detail = `<path d="M42 73L50 92L58 73" fill="#efe2c8" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"/>
                <path d="M50 92V100" stroke="${INK}" stroke-width="1.3"/>
                <circle cx="47" cy="95" r="1.2" fill="#c9973f"/><circle cx="47" cy="99" r="1.2" fill="#c9973f"/>
                <path d="M30 80Q32 90 31 100M70 80Q68 90 69 100" fill="none" stroke="${dark}" stroke-width="1.2"/>`;
            break;

        case "turtleneck":
            detail = `<path d="M42 66Q50 69 58 66L59 76Q50 80 41 76Z" fill="${color}" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>
                <path d="M44 70Q50 72 56 70M43.5 73.5Q50 75.5 56.5 73.5" fill="none" stroke="${dark}" stroke-width="0.9"/>`;
            break;

        case "hoodie":
            detail = `<path d="M34 76Q38 68 50 69Q62 68 66 76Q58 80 50 80Q42 80 34 76Z" fill="${dark}" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>
                <path d="M46 80V92M54 80V92" stroke="#efe2c8" stroke-width="1.3" stroke-linecap="round"/>
                <circle cx="46" cy="93" r="1.1" fill="#efe2c8"/><circle cx="54" cy="93" r="1.1" fill="#efe2c8"/>`;
            break;

        case "collar":
            detail = `<path d="M50 74Q42 72 38 76Q40 82 48 80Z" fill="#fffaf2" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>
                <path d="M50 74Q58 72 62 76Q60 82 52 80Z" fill="#fffaf2" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>
                <circle cx="50" cy="82" r="1.6" fill="#c9973f" stroke="${INK}" stroke-width="0.8"/>`;
            break;

        case "shirt":
            detail = `<path d="M43 72.5L50 80L45 83L41 75Z M57 72.5L50 80L55 83L59 75Z" fill="${light}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>
                <path d="M50 80V100" stroke="${INK}" stroke-width="1.1"/>
                <circle cx="51.8" cy="86" r="0.9" fill="${INK}"/><circle cx="51.8" cy="92" r="0.9" fill="${INK}"/>`;
            break;

        default:
            detail = `<path d="M40 73.5Q50 78 60 73.5" fill="none" stroke="${dark}" stroke-width="3"/>
                <path d="M27 86Q29 93 28 100M73 86Q71 93 72 100" fill="none" stroke="${dark}" stroke-width="1.2"/>`;

    }

    const scarf =
        avatar.extra === "scarf"
            ? `<path d="M38 70Q50 78 62 70L63 77Q50 84 37 77Z" fill="#9b3e5a" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"/>
               <path d="M56 78L60 98L53 98L51 80Z" fill="#9b3e5a" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"/>
               <path d="M40 73L42 79M46 75L47 81M53 75L52 81M59 73L58 79M53 88H59M52.5 93H59.5" stroke="#f3cb79" stroke-width="1"/>`
            : "";

    return neck + body + detail + scarf;

}


/* =========================================================
   THE PICTURES
========================================================= */

let serial = 0;

// Head and shoulders in a circle.
export function avatarPortrait(saved, { seed = "reader", label = "" } = {}) {

    const avatar =
        normalizeAvatar(saved, seed);

    const id =
        `avatarClip${++serial}`;

    return `<svg class="avatar-art" viewBox="0 0 100 100" role="${label ? "img" : "presentation"}" ${label ? `aria-label="${label.replace(/"/g, "")}"` : `aria-hidden="true"`}>
        <defs><clipPath id="${id}"><circle cx="50" cy="50" r="49"/></clipPath></defs>
        <g clip-path="url(#${id})">
            <rect width="100" height="100" fill="#f1e2c6"/>
            <circle cx="50" cy="44" r="40" fill="#f8ecd4"/>
            ${topGroup(avatar)}
            <g transform="translate(0 2)">${headGroup(avatar)}</g>
        </g>
    </svg>`;

}


// Curled up in an armchair with a book and a blanket, in a
// 140 × 170 box (the head is the portrait's, moved across).
export function avatarSeated(saved, { seed = "reader", label = "" } = {}) {

    const avatar =
        normalizeAvatar(saved, seed);

    const skin =
        pick(SKIN_TONES, avatar.skin).color;

    const color =
        pick(TOP_COLORS, avatar.topColor).color;

    const dark =
        shade(color, -0.2);

    return `<svg class="avatar-seated" viewBox="0 0 140 170" role="${label ? "img" : "presentation"}" ${label ? `aria-label="${label.replace(/"/g, "")}"` : `aria-hidden="true"`}>
        <g transform="translate(20 0)">
            ${topGroup(avatar).replace("M16 100C17 82 30 72.5 50 72.5C70 72.5 83 82 84 100Z", "M18 128C16 96 28 72.5 50 72.5C72 72.5 84 96 82 128Z")}
            ${headGroup(avatar)}
        </g>
        <path d="M45 86Q33 112 50 124M95 86Q107 112 90 124" fill="none" stroke="${INK}" stroke-width="13" stroke-linecap="round"/>
        <path d="M45 86Q33 112 50 124M95 86Q107 112 90 124" fill="none" stroke="${dark}" stroke-width="10" stroke-linecap="round"/>
        <path d="M38 102L70 109L102 102L100 134L70 140L40 134Z" fill="#6e3b58" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M41 100L70 107L99 100L97.5 131L70 136.5L42.5 131Z" fill="#fff6e3" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M70 107V136.5" stroke="${INK}" stroke-width="1.1"/>
        <path d="M47 110L64 114M47 116L64 120M47 122L60 125M76 114L93 110M76 120L93 116M80 125L93 122" stroke="#b89868" stroke-width="0.9" stroke-linecap="round"/>
        <ellipse cx="50" cy="126" rx="5" ry="4.4" fill="${skin}" stroke="${INK}" stroke-width="1.2"/>
        <ellipse cx="90" cy="126" rx="5" ry="4.4" fill="${skin}" stroke="${INK}" stroke-width="1.2"/>
        <path d="M14 170Q12 144 36 139Q70 134 104 139Q128 144 126 170Z" fill="#c9973f" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
        <path d="M30 142L26 170M50 138V170M70 136V170M90 138V170M110 142L114 170M18 152H122M16 162H124" stroke="#9b6a2a" stroke-width="1.4" opacity="0.7"/>
    </svg>`;

}
