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

    candelabra: "flame 49.9 10.1 1.01; flame 85.2 20.4 1.06; flame 14.8 20.4 1.01; glow 50.0 21.0 3.2",
    candle_chandelier: "flame 13.7 40.1 1.18; flame 74.0 40.3 1.24; flame 41.7 46.9 1.18; flame 89.3 49.9 1.12; glow 54.7 48.3 3.4; sway",
    bat_candle: "flame 50.0 33.6 0.69; glow 50.0 37.6 2.4",
    candle_holder: "flame 39.2 13.2 1.07; glow 39.2 17.2 2.4",
    pillar_candle: "flame 50.7 16.7 1.28; glow 50.7 20.7 2.6",
    ghost_candle: "flame 50.1 16.7 1.08; glow 50.1 20.7 2.4; aura",
    skull_candle: "flame 54.5 17.6 1.39; glow 54.5 21.6 2.4",
    oil_lamp: "flame 39.7 48.1 1.17; glow 39.7 52.1 2.8",
    hanging_lantern: "flame 49.8 65.5 0.91; glow 49.8 69.5 3; sway",
    red_lantern: "flame 49.5 63 0.9; glow 49.5 64 3",
    pumpkin_lantern: "flame 49.9 64 1.1; glow 49.9 66 3.2; flicker",
    star_lantern: "glow 49 55 3.4; sparkle 49 55 70 50 5; sway",
    lantern_garland: "glow 16.5 62 1.6; glow 50.5 70 1.6; glow 85 59 1.6; twinkle 16.5 62; twinkle 50.5 70; twinkle 85 59; sway-soft",
    string_lights: "glow 14.1 61 1.5 bulb; glow 39.9 76 1.5 bulb; glow 65.7 72 1.5 bulb; glow 89.3 53.5 1.5 bulb; twinkle 14.1 61; twinkle 39.9 76; twinkle 65.7 72; twinkle 89.3 53.5; sway-soft",
    stone_fireplace: "fire 50 64 20; embers 50 56 16; glow 50 56 4",
    cold_fireplace: "motes",
    jack_o_lantern: "glow 50 55 3; flicker",
    fringed_lamp: "glow 50 26 3.2 bulb",
    pink_lamp: "glow 42 34 3 bulb",
    mushroom_lamp: "glow 50 32 3.4 bulb",
    moon_lamp: "glow 45 42 3.6 moon; sparkle 45 42 70 60 4",
    pendant_lamp: "glow 50 88 3.2 bulb; sway",
    wall_lamp: "glow 42 80 3 bulb",
    flashlight: "beam 6 60 -1",
    crystal_ball: "glow 45 37 3 amethyst; sparkle 45 37 70 55 5; sheen",
    retro_tv: "screen 49.3 50 53.3 61.7",
    tv_stand: "screen 40 25 38 30",
    camcorder: "blink 72 20",
    gramophone: "notes 60 5",
    boombox: "notes 50 5",
    rotary_phone: "ring",
    red_phone: "ring",
    phone_table: "ring",
    grandfather_clock: "tick",
    cuckoo_clock: "tick",
    plum_mug: "steam 37.0 12.3",
    sage_mug: "steam 36.9 13.1",
    ghost_mug: "steam 36.8 12.9",
    pumpkin_mug: "steam 54.0 0.6",
    pink_mug: "steam 37.0 12.2",
    moon_mug: "steam 36.6 9.8",
    plum_teacup: "steam 47.7 15.4",
    pink_teacup: "steam 46.8 18.2",
    espresso_cup: "steam 48.8 12.8",
    amber_teacup: "steam 67.2 0.7",
    cream_teacup: "steam 47 20",
    sage_teacup: "steam 49 17",
    plum_tea_set: "steam 24 8",
    sage_tea_set: "steam 20 30",
    pumpkin_tea_set: "steam 18 20",
    coffee_pot: "steam 72 45",
    french_press: "steam 72 50",
    moka_pot: "steam 20 5",
    cocoa_and_cookies: "steam 56 8",
    lemon_tea_and_book: "steam 28 30",
    pumpkin_kettle: "steam 6 34",
    espresso_machine: "steam 70 62",
    honey_jar: "sheen",
    cookie_jar: "sheen",
    cauldron: "bubbles 50 10 55; steam 50 4; glow 50 12 2.4 potion",
    potion_trio: "sparkle 50 50 90 60 5; sheen",
    potion_shelf: "sparkle 50 40 90 70 5; sheen",
    potion_cabinet: "sparkle 50 45 60 50 4; sheen",
    glass_cabinet: "sheen; sparkle 50 40 50 40 3",
    amethyst_cluster: "sparkle 50 40 80 60 6; sheen; glow 50 45 2.4 amethyst",
    mushroom_cloche: "sparkle 50 50 60 50 4; sheen",
    witch_hat: "sparkle 50 45 80 60 3",
    broom: "tilt",
    moon_mobile: "twinkle 50 62; twinkle 20 58; twinkle 80 60; twinkle 35 80; sparkle 50 60 80 60 3; sway-soft",
    star_garland: "twinkle 20 60; twinkle 42 62; twinkle 64 60; twinkle 85 55; sway-soft",
    herb_bundle: "sway-soft",
    drying_herbs: "sway-soft",
    hanging_ivy: "sway-soft",
    potted_mushrooms: "sparkle 50 30 70 40 3",
    ghost: "float; aura",
    black_cat: "tilt",
    bat: "flap",
    bat_garland: "sway-soft",
    ghost_garland: "sway-soft; aura",
    pumpkin_garland: "sway-soft",
    cobweb: "sway-soft; sheen",
    cobweb_corner: "sheen",
    cobweb_spider: "sway-soft",
    cobweb_swag: "sway-soft",
    ghost_portrait: "aura; sheen",
    haunted_portrait: "aura; motes",
    cracked_mirror: "sheen; aura",
    lady_portrait: "sheen",
    cat_painting: "sheen",
    pressed_flowers: "sheen",
    raven_moon_painting: "glow 56.6 39.4 2.6 red; sheen",
    lantern_forest_painting: "glow 49 53 1.8; sheen",
    haunted_house_painting: "glow 24.7 25.7 1.4 moon; glow 50 64 2 window; flicker",
    gargoyle: "aura",
    stone_mask: "aura",
    skull: "aura",
    flower_skull: "sparkle 50 20 80 30 3",
    voodoo_doll: "tilt",
    eye_sign: "glint 44 63",
    camp_sign: "sway-soft",
    hanging_cloak: "breeze",
    scarf_hook: "breeze",
    birdcage: "sway-soft",
    chain_padlock: "sway-soft",
    key_rack: "glint 50 70",
    raven_on_books: "hop",
    rusty_locker: "rattle",
    tattered_wingback: "motes",
    torn_recliner: "motes",
    leaning_bookcase: "motes",
    old_desk: "motes",
    white_cabinet: "motes",
    wooden_trunk: "motes",
    rocking_chair: "rock",
    autumn_wreath: "sway-soft",
    thorn_wreath: "sway-soft",
    rug_night_sky: "sparkle 50 50 80 70 5",
    rug_moon: "sparkle 50 50 80 70 5",
    rug_moth: "sparkle 50 50 70 60 3",
    rug_web: "sparkle 50 50 70 60 3",
    rug_ghost: "sparkle 50 50 70 60 3",
    raven_statue: "hop",
    moon_mask: "sparkle 50 30 70 40 3",
    skull_on_books: "aura",
    candle_painting: "flame 49.5 41.5 0.8; glow 49.5 46 2.2; sheen",
    jack_garland: "glow 12 60 1.4; glow 37 62 1.4; glow 62 62 1.4; glow 87 60 1.4; flicker",
    fairy_lights: "glow 9.4 54.5 1.3 bulb; glow 40.3 73.7 1.3 bulb; glow 73.5 67.7 1.3 bulb; glow 24 66 1.1 amethyst; glow 57 73 1.1 amethyst; glow 90 55 1.1 amethyst; twinkle 9.4 54.5; twinkle 24 66; twinkle 40.3 73.7; twinkle 57 73; twinkle 73.5 67.7; twinkle 90 55; sway-soft",
    lantern_string: "glow 13.2 56 1.4; glow 38.3 71 1.4; glow 63.6 71 1.4; glow 87.2 56 1.4; twinkle 13.2 56; twinkle 38.3 71; twinkle 63.6 71; twinkle 87.2 56; sway-soft",
    ivy_fairy_lights: "twinkle 15.1 19.9; twinkle 94.5 40.7; twinkle 8.2 44.8; twinkle 66.2 53.3; twinkle 28.1 54.4; twinkle 75.1 68.6; twinkle 49.1 70.8; twinkle 26.8 82.7; glow 49 60 2.4 bulb; sway-soft",
    cottage_painting: "glow 47 58 1.8 window; glint 20 25; sheen",
    moon_phases: "twinkle 30 20; twinkle 70 20; twinkle 30 80; twinkle 70 80; glow 50 50 2 moon",
    pumpkin_patch_painting: "glow 62 25 1.4 moon; sheen",
    crow_painting: "glow 40 55 2.2 red; sheen",
    ghost_tea_portrait: "aura; sheen",
    moth_portrait: "sparkle 50 45 60 40 3; sheen",
    cat_moon_portrait: "sheen",
    bare_tree_painting: "sheen; motes",
    mushroom_painting: "sheen",
    pressed_botanicals: "sheen",
    bat_diamond: "aura",
    potion_garland: "sparkle 50 70 90 40 4; sway-soft",
    moon_star_bunting: "twinkle 20 60; twinkle 40 65; twinkle 60 66; twinkle 80 60; sway-soft",
    ghost_bunting: "sway-soft; aura",
    skull_garland: "sway-soft",
    witch_hat_garland: "sway-soft",
    bat_bunting: "sway-soft",
    cat_garland: "sway-soft",
    maple_garland: "sway-soft",
    moth_garland: "sway-soft",
    ivy_swag: "sway-soft",
    ivy_hanging: "sway-soft",
    ivy_corner_left: "sway-soft",
    ivy_corner_right: "sway-soft",
    ivy_arch: "sway-soft",
    ivy_basket: "sway-soft",
    ivy_web_swag: "sway-soft; sheen",
    autumn_vine: "sway-soft",
    rose_vine: "sway-soft",
    bat_branch: "sway-soft",
    tea_trolley: "steam 15 17",
    arched_door: "glow 50 99 1.6 window; motes",
    wooden_door: "glow 50 99 1.6 window",
    book_cart: "motes",
    ivy_book_shelf: "motes; sway-soft",
    worn_books: "motes",
    empty_frame: "sheen",
    pumpkin_trio: "sheen",
    wall_shelf: "motes",
    tea_tin: "sheen",
    milk_jug: "sheen"

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
