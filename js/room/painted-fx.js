/* =========================================================
   NOVELLOW
   LIFE FOR THE HAND-PAINTED PIECES

   The painted decorations are pictures, so their movement is
   laid over them: flames that flicker, lamps that glow (more
   as the room grows dim), fire and embers, bubbles and steam,
   sparkles, a sheen across glass, drifting dust, music notes,
   and whole-piece movement (floating, swaying, rocking…).

   Each piece lists its effects in a short line:

     "flame 48 9; glow 48 20 2; sway"

   Numbers are where on the picture (percent across, percent
   down) and a size. Drawn by css/painted-fx.css.
========================================================= */


const FX = {

    // Lamps and candles
    candelabra: "flame 11.5 35 0.8; flame 48.7 8 0.8; flame 86.5 28 0.8; glow 49 30 3.2",
    candle_chandelier: "flame 11.6 36 0.6; flame 29 28 0.6; flame 66.7 42 0.6; flame 89 31 0.6; flame 48 22 0.6; glow 50 40 3.4; sway",
    cobweb_candelabra: "flame 11.6 15 0.6; flame 33.8 22 0.6; flame 59.2 12 0.6; flame 87.4 15 0.6; glow 50 25 3; motes",
    candle_dish: "flame 41.8 12 1; glow 42 25 2.4",
    candle_sconce: "flame 75.6 17 1; glow 72 25 2.2",
    bat_candle: "flame 49.5 28 0.9; glow 50 35 2.4",
    skull_candle: "flame 50 7 1; glow 50 25 2.6",
    screaming_candle: "flame 50 7 1; glow 50 25 2.6; smoke 50 2",
    oil_lamp: "flame 40 48 0.9; glow 40 45 2.8",
    oil_lantern: "flame 46 58 0.9; glow 46 55 3",
    camping_lantern: "flame 47.5 60 0.9; glow 47.5 57 3",
    iron_lantern: "flame 50 68 0.9; glow 50 66 3; sway",
    hanging_lantern: "flame 48 70 0.9; glow 48 68 3; sway",
    hanging_shop_lamp: "glow 50 82 3.2 bulb; sway",
    pumpkin_lantern: "flame 49 70 0.9; glow 49 64 3",
    star_lantern: "glow 49 58 3.4; sparkle 49 58 70 60 5; sway",
    red_cage_lamp: "glow 55 58 2.8 red",
    tiffany_lamp: "glow 44 55 3.4 bulb",
    fringed_lamp: "glow 50 30 3 bulb",
    fringed_table_lamp: "glow 50 60 3 bulb",
    torn_lamp: "glow 50 58 3 red",
    tattered_lamp: "glow 50 50 2.8 bulb; motes",
    moon_lamp: "glow 42 42 3.6 moon; sparkle 42 40 70 60 4",

    // Fire, screens and beams
    stone_fireplace: "fire 50 70 40; embers 50 62 30",
    cold_fireplace: "flame 81 3 0.6; glow 81 10 1.6; motes",
    flashlight: "beam 6 56 -1",
    rusty_flashlight: "beam 18 64 -1",
    retro_tv: "screen 42 50 50 48",
    haunted_tv_stand: "screen 45 25 48 34",
    camcorder: "blink 72 20",
    boarded_window: "glow 45 45 2.6 window; flicker",
    jack_o_lantern: "glow 50 62 3; flicker",

    // Witchy, starry and glassy
    bubbling_cauldron: "bubbles 50 14 60; steam 50 8; glow 50 16 2.6 potion",
    potion_trio: "sparkle 50 40 90 70 5; sheen",
    potion_cabinet: "sparkle 50 45 60 50 4; sheen",
    apothecary_cabinet: "sparkle 50 30 70 40 4",
    amethyst_cluster: "sparkle 50 40 80 60 6; sheen; glow 50 45 2.4 amethyst",
    mushroom_cloche: "sparkle 50 55 60 50 4; sheen",
    witch_hat: "sparkle 50 45 80 60 3",
    moon_mask: "sparkle 50 30 70 40 3",
    star_garland: "twinkle 30 80; twinkle 10 62; twinkle 77 79; twinkle 55 88; twinkle 86 52; twinkle 45 70; sway-soft",
    ghost: "float; aura",
    ghost_friend: "float; aura",
    ghost_portrait: "aura; sheen",
    bat: "flap",
    flower_skull: "sparkle 50 20 80 30 3",
    rug_night_sky: "sparkle 50 50 80 70 5",
    rug_crescent: "sparkle 50 50 80 70 5",
    rug_moon: "sparkle 50 50 80 70 4",
    rug_web_moon: "sparkle 50 50 80 70 4",
    rug_moth_oval: "sparkle 50 50 70 60 3",

    // Haunted and horror
    cracked_mirror: "sheen; aura",
    haunted_portrait: "aura; motes",
    broken_cabinet: "sheen; motes",
    dusty_bookcase: "motes",
    cobweb_bookcase: "motes",
    cobweb_shelf: "motes",
    tattered_chaise: "motes",
    faded_wingback: "motes",
    tattered_wingback: "motes",
    torn_recliner: "motes",
    old_writing_desk: "motes",
    grandfather_clock: "motes; tick",
    cuckoo_clock: "tick",
    torn_curtains: "breeze",
    hanging_cloak: "breeze",
    open_birdcage: "sway-soft",
    chain_padlock: "sway-soft",
    button_eye_doll: "tilt",
    raven_statue: "hop",
    raven_on_books: "hop",
    gargoyle: "aura",
    eye_sign: "glint 50 50",
    stitched_mask: "aura",
    rusty_locker: "rattle",

    // Cozy
    rocking_chair: "rock",
    gramophone: "notes 70 10",
    boombox: "notes 50 5",
    rotary_phone: "ring",
    red_phone: "ring",
    cream_phone: "ring",
    phone_table: "ring",
    autumn_wreath: "sway-soft",
    lavender_bundle: "sway-soft"

};


// Pieces whose whole picture moves, and how.
const MOTIONS = ["float", "sway", "sway-soft", "rock", "flap", "breeze", "tilt", "hop", "ring", "rattle", "tick", "flicker"];


function parse(line) {
    return String(line || "").split(";").map((part) => part.trim()).filter(Boolean).map((part) => {
        const [kind, ...rest] = part.split(/\s+/);
        return { kind, args: rest };
    });
}


const percent = (value, fallback) => `${Number.isFinite(Number(value)) ? Number(value) : fallback}%`;


function layer(effect, index) {

    const [a, b, c, d, e] = effect.args;

    switch (effect.kind) {

        case "flame":
            return `<i class="fx fx-flame" style="left:${percent(a, 50)};top:${percent(b, 10)};--s:${c || 1};--d:${(index * 0.37) % 1.3}s"></i>`;

        case "glow":
            return `<i class="fx fx-glow fx-glow--${d || "warm"}" style="left:${percent(a, 50)};top:${percent(b, 50)};--s:${c || 2};--d:${(index * 0.53) % 2}s"></i>`;

        case "fire":
            return `<i class="fx fx-fire" style="left:${percent(a, 50)};top:${percent(b, 70)};--w:${c || 40}%"></i>`;

        case "embers":
            return `<i class="fx fx-embers" style="left:${percent(a, 50)};top:${percent(b, 60)};--w:${c || 30}%">${"<b></b>".repeat(7)}</i>`;

        case "bubbles":
            return `<i class="fx fx-bubbles" style="left:${percent(a, 50)};top:${percent(b, 15)};--w:${c || 50}%">${"<b></b>".repeat(6)}</i>`;

        case "steam":
        case "smoke":
            return `<i class="fx fx-steam ${effect.kind === "smoke" ? "fx-steam--smoke" : ""}" style="left:${percent(a, 50)};top:${percent(b, 5)}"><b></b><b></b><b></b></i>`;

        case "sparkle":
            return `<i class="fx fx-sparkles" style="left:${percent(a, 50)};top:${percent(b, 50)};width:${percent(c, 60)};height:${percent(d, 50)}">${Array.from({ length: Number(e) || 4 }, (_, i) => `<b style="left:${(i * 37 + 11) % 90 + 5}%;top:${(i * 53 + 23) % 86 + 7}%;--d:${(i * 0.71) % 3}s"></b>`).join("")}</i>`;

        case "twinkle":
            return `<i class="fx fx-twinkle" style="left:${percent(a, 50)};top:${percent(b, 50)};--d:${(index * 0.61) % 2.4}s"></i>`;

        case "screen":
            return `<i class="fx fx-screen" style="left:${percent(a, 50)};top:${percent(b, 50)};width:${percent(c, 40)};height:${percent(d, 30)}"></i>`;

        case "beam":
            return `<i class="fx fx-beam ${Number(c) < 0 ? "fx-beam--left" : ""}" style="left:${percent(a, 10)};top:${percent(b, 50)}"></i>`;

        case "blink":
            return `<i class="fx fx-blink" style="left:${percent(a, 50)};top:${percent(b, 50)}"></i>`;

        case "glint":
            return `<i class="fx fx-glint" style="left:${percent(a, 50)};top:${percent(b, 50)}"></i>`;

        case "notes":
            return `<i class="fx fx-notes" style="left:${percent(a, 50)};top:${percent(b, 10)}"><b>♪</b><b>♫</b><b>♪</b></i>`;

        case "motes":
            return `<i class="fx fx-motes">${"<b></b>".repeat(5)}</i>`;

        case "aura":
            return `<i class="fx fx-aura"></i>`;

        case "sheen":
            return `<i class="fx fx-sheen"></i>`;

        default:
            return "";

    }

}


/*
    The extra markup for a painted piece: its movement class
    (for the picture's wrapper) and the effects laid over it.
*/
export function paintedFx(src) {

    const name =
        String(src).split("/").pop().replace(/\.\w+$/, "");

    const effects =
        parse(FX[name]);

    return {
        motion: effects.filter((effect) => MOTIONS.includes(effect.kind)).map((effect) => `fx-move--${effect.kind}`).join(" "),
        layers: effects.map(layer).join("")
    };

}
