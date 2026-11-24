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

    candelabra: "flame 14 20 0.8; flame 50 8 0.8; flame 86 20 0.8; glow 50 24 3.2",
    candle_chandelier: "flame 13 36 0.7; flame 33 46 0.7; flame 64 46 0.7; flame 85 36 0.7; glow 50 50 3.4; sway",
    bat_candle: "flame 50 42 0.8; glow 50 48 2.4",
    candle_holder: "flame 39 14 1; glow 39 20 2.4",
    pillar_candle: "flame 49 16 1.1; glow 49 22 2.6",
    ghost_candle: "flame 51 12 1; glow 51 18 2.4; aura",
    skull_candle: "flame 53 14 1; glow 53 20 2.4",
    oil_lamp: "flame 52 37 0.9; glow 52 40 2.8",
    hanging_lantern: "flame 48 68 0.9; glow 48 68 3; sway",
    red_lantern: "flame 50 60 0.9; glow 50 60 3",
    pumpkin_lantern: "flame 48 63 1; glow 48 60 3.2; flicker",
    star_lantern: "glow 49.9 58.6 3.4 warm; sparkle 49.9 58.6 70 50 5; sway",
    lantern_garland: "glow 16.5 62 1.6; glow 50.5 70 1.6; glow 85 59 1.6; twinkle 16.5 62; twinkle 50.5 70; twinkle 85 59; sway-soft",
    string_lights: "glow 14.1 61 1.5 bulb; glow 39.9 76 1.5 bulb; glow 65.7 72 1.5 bulb; glow 89.3 53.5 1.5 bulb; twinkle 14.1 61; twinkle 39.9 76; twinkle 65.7 72; twinkle 89.3 53.5; sway-soft",
    stone_fireplace: "fire 50 66 22; embers 50 58 18; glow 50 58 4",
    cold_fireplace: "motes",
    jack_o_lantern: "glow 50 55 3; flicker",
    fringed_lamp: "shade; glow 50 30 7.5 bulb; glow 50 26 3 bulb",
    pink_lamp: "glow 42.5 64.4 3 bulb",
    mushroom_lamp: "glow 43.6 62.5 3.4 bulb",
    moon_lamp: "glow 39.6 38.7 3.6 moon; sparkle 39.6 38.7 70 60 4",
    pendant_lamp: "glow 50.4 84.4 3.2 bulb; sway",
    wall_lamp: "glow 66.6 89.6 3 bulb",
    flashlight: "beam 6 60 -1",
    crystal_ball: "glow 50 42 3 moon; sparkle 50 42 70 60 5; sheen",
    retro_tv: "screen 42 48 58 58",
    tv_stand: "screen 44 28 42 34",
    camcorder: "blink 72 20",
    gramophone: "notes 60 5",
    boombox: "notes 50 5",
    rotary_phone: "ring",
    red_phone: "ring",
    phone_table: "ring",
    grandfather_clock: "tick",
    cuckoo_clock: "tick",
    // Holiday pieces (assets/decor/holiday/).
    solstice_lantern: "flame 50 60 0.7; glow 50 64 2.6",
    krampus_lantern: "flame 50 63 0.7; glow 50 67 2.6",
    holiday_table_lamp: "glow 50 38 5 bulb",
    victorian_candleholder: "flame 37 3 0.9; glow 37 8 2.4",
    midnight_clock: "tick",
    cocoa_mug: "steam 37 3",
    cookies_milk: "sheen",
    krampus_snowglobe: "globe 50 34 46; sheen",
    krampus_bell: "ring",
    evergreen_garland: "sway-soft",
    new_year_star_garland: "sway-soft",
    hanukkah_star_hanging: "sway",
    plum_mug: "steam 42 4",
    sage_mug: "steam 37 4",
    ghost_mug: "steam 43 4",
    pumpkin_mug: "steam 39 4",
    pink_mug: "steam 39 5",
    moon_mug: "steam 38 4",
    plum_teacup: "steam 47 4",
    pink_teacup: "steam 49 4",
    espresso_cup: "steam 50 4",
    amber_teacup: "steam 48 5",
    cream_teacup: "steam 45 10",
    sage_teacup: "steam 49 4",
    plum_tea_set: "steam 22 4",
    sage_tea_set: "steam 30 4",
    pumpkin_tea_set: "steam 30 4",
    coffee_pot: "steam 62 40",
    french_press: "steam 40 30",
    moka_pot: "steam 62 0",
    cocoa_and_cookies: "steam 48 4",
    lemon_tea_and_book: "steam 50 4",
    pumpkin_kettle: "steam 10 30",
    espresso_machine: "steam 55 60",
    honey_jar: "sheen",
    cookie_jar: "sheen",
    cauldron: "bubbles 50 18 55; steam 50 10; glow 50 20 2.6 potion",
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
    black_cat: "breathe; part ear 4 0 27 25 70 100; part ear 54 0 28 25 30 100; part tail 68 37 32 27 15 95; glint 39 50",
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
    candle_painting: "flame 38.6 33.5 0.50; flame 55.3 47.8 0.50; flame 67.5 63.7 0.50; glow 53.8 51.3 2; sheen",
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
    tea_trolley: "steam 30 8",
    arched_door: "glow 50 99 1.6 window; motes",
    wooden_door: "glow 50 99 1.6 window",
    book_cart: "motes",
    ivy_book_shelf: "motes; sway-soft",
    worn_books: "motes",
    empty_frame: "sheen",
    pumpkin_trio: "sheen",
    wall_shelf: "motes",
    tea_tin: "sheen",
    milk_jug: "sheen",
    grey_fireplace: "fire 50 68 22; embers 50 60 18; glow 50 60 4",
    charcoal_wingback: "motes",
    hanging_herbs: "sway-soft",
    coffin_cabinet: "motes",
    curio_cabinet: "sparkle 50 40 60 60 4; sheen",
    door_knocker: "glint 50 60",
    ghost_moon_portrait: "aura; sheen",
    // The collections (assets/decor/sets/).
    cottage_snowglobe: "globe 50 37 46; glow 52 52 1.4 window; sheen",
    sleeping_mouse: "breathe-slow; part ear 25 19 15 20 60 100; part nose 29 58 9 11 50 50",
    // The collections' cozy additions.
    bookish_whimsy_cat: "breathe; part ear 5 0 24 22 70 100; part ear 55 0 24 22 30 100; part tail 70 55 30 32 5 85",
    cozy_sage_cat: "breathe-slow; part ear 5 12 16 24 70 100; part ear 45 12 16 24 30 100; part nose 28 44 9 10 50 50",
    fireside_library_cat: "breathe; part ear 2 0 19 26 70 100; part ear 32 0 19 26 30 100; part nose 22 42 8 8 50 50; glint 18 34; glint 37 34",
    ink_folklore_cat: "breathe-slow; part ear 1 7 15 25 70 100; part ear 24 7 15 24 30 100; part nose 25 47 9 9 50 50",
    snowy_fairytale_cat: "breathe-slow; part ear 2 29 13 22 60 100; part ear 30 13 16 26 30 100; part nose 31 56 8 8 50 50",
    sugarplum_pastel_cat: "breathe; part ear 7 0 24 21 60 100; part ear 61 0 25 21 40 100; part nose 43 19 12 8 50 50",
    vintage_woodland_cat: "breathe-slow; part ear 1 21 18 22 60 100; part ear 33 2 16 25 30 100; part nose 34 52 8 8 50 50",
    warm_gouache_cat: "breathe; part ear 13 1 20 20 60 100; part ear 57 1 20 20 40 100; part tail 74 58 26 36 15 90; part nose 42 19 11 8 50 50",
    bookish_whimsy_dog: "breathe-slow; part flop 1 30 24 46 70 8; part nose 21 61 9 11 50 50",
    cozy_sage_dog: "breathe; part flop 0 10 18 55 70 8; part flop 31 10 19 55 30 8; part tail 74 10 26 46 20 95; part nose 23 28 10 13 50 50",
    fireside_library_dog: "breathe-slow; part ear 5 7 13 26 50 100; part ear 25 0 12 26 50 100; part nose 38 60 8 10 50 50; part tail-soft 55 60 45 40 0 50",
    ink_folklore_dog: "breathe-slow; part flop 1 25 24 64 70 8; part flop 39 25 24 60 30 8; part nose 30 61 10 10 50 50",
    snowy_fairytale_dog: "breathe; part ear 9 1 20 20 60 100; part ear 49 1 21 20 40 100; part tail 68 54 32 32 10 70; part nose 35 21 13 10 50 50",
    sugarplum_pastel_dog: "breathe; part flop 0 14 23 42 70 8; part flop 76 14 24 42 30 8; part tail 79 63 18 20 0 60; part nose 46 31 11 8 50 50",
    vintage_woodland_dog: "breathe; part ear 1 0 22 19 80 80; part ear 61 0 35 23 15 40; part tail 78 60 22 33 30 95; part nose 38 26 13 9 50 50",
    warm_gouache_dog: "breathe-slow; part flop 41 9 18 37 70 8; part flop 84 9 16 37 30 8; part nose 64 14 13 10 50 50",
    bookish_whimsy_fireplace: "fire 50 62 22; flame 46 60 1.3; flame 53 58 1.6; embers 50 56 16; glow 50 62 4",
    cozy_sage_fireplace: "fire 50 68 22; flame 46 66 1.3; flame 53 64 1.6; embers 50 62 16; glow 50 68 4; flame 28.5 2 0.8; flame 70.5 2 0.8; glint 49 33",
    fireside_library_fireplace: "fire 50 62 22; flame 46 60 1.3; flame 53 58 1.6; embers 50 56 16; glow 50 62 4",
    ink_folklore_fireplace: "fire 50 68 24; flame 46 66 1.3; flame 53 64 1.6; embers 50 62 18; glow 50 68 4; flame 76.5 3 0.8; glow 76.5 6 1.6",
    snowy_fairytale_fireplace: "fire 50 64 24; flame 46 62 1.3; flame 53 60 1.6; embers 50 58 18; glow 50 64 4",
    sugarplum_pastel_fireplace: "fire 50 64 18; flame 46 62 1.3; flame 53 60 1.6; embers 50 58 12; glow 50 64 4",
    vintage_woodland_fireplace: "fire 50 76 20; flame 46 74 1.3; flame 53 72 1.6; embers 50 70 14; glow 50 76 4",
    warm_gouache_fireplace: "fire 50 70 22; flame 46 68 1.3; flame 53 66 1.6; embers 50 64 16; glow 50 70 4",
    bookish_whimsy_yule_log: "flame 38 17 0.6; flame 50.5 4 0.7; flame 64.5 17 0.6; glow 51 18 2.4",
    cozy_sage_yule_log: "flame 44.5 4 0.9; flame 61 18 0.8; glow 52 16 2.6",
    fireside_library_yule_log: "flame 29 20 0.7; flame 51 5 0.8; flame 70 20 0.7; glow 50 20 2.6",
    ink_folklore_yule_log: "flame 40 5 0.8; flame 62 17 0.7; glow 50 16 2.4",
    snowy_fairytale_yule_log: "flame 31 19 0.6; flame 52 4 0.7; flame 73.5 19 0.6; glow 52 18 2.4",
    sugarplum_pastel_yule_log: "flame 32 17 0.6; flame 51 4 0.7; flame 70 17 0.6; glow 51 18 2.4",
    vintage_woodland_yule_log: "flame 51 4 0.8; glow 51 12 2.2",
    warm_gouache_yule_log: "flame 31 17 0.6; flame 50 4 0.7; flame 71 17 0.6; glow 50 18 2.4",
    bookish_whimsy_garland: "sway-soft; twinkle 12 45; twinkle 29 72; twinkle 50 86; twinkle 70 72; twinkle 87 45",
    cozy_sage_garland: "sway-soft; glint 10 45; glint 50 86; glint 90 45; twinkle 22 46; twinkle 35 66; twinkle 65 66; twinkle 78 46",
    fireside_library_garland: "sway-soft; glint 17 55; glint 28 76; glint 50 90; glint 70 76; glint 83 55; twinkle 40 70; twinkle 60 70",
    ink_folklore_garland: "sway-soft; twinkle 12 55; twinkle 29 75; twinkle 50 86; twinkle 70 75; twinkle 88 55",
    snowy_fairytale_garland: "sway-soft; glint 12 55; glint 35 82; glint 63 82; glint 87 55; twinkle 25 72; twinkle 50 82; twinkle 75 72",
    sugarplum_pastel_garland: "sway-soft; twinkle 13 55; twinkle 30 66; twinkle 50 90; twinkle 70 66; twinkle 87 55",
    vintage_woodland_garland: "sway-soft; twinkle 20 50; twinkle 50 78; twinkle 80 50",
    warm_gouache_garland: "sway-soft; glint 20 55; glint 50 82; glint 80 55; twinkle 35 66; twinkle 65 66",
    bookish_whimsy_wall_art: "twinkle 50 19; twinkle 40 26; twinkle 60 26; twinkle 16 80; twinkle 84 80; sheen",
    cozy_sage_wall_art: "twinkle 50 45; twinkle 22 38; twinkle 78 38; sheen",
    fireside_library_wall_art: "flame 33 23 0.6; glow 33 32 1.6; sheen",
    ink_folklore_wall_art: "part ear 53 13 10 22 50 100; part nose 59 38 6 6 50 50; sheen",
    snowy_fairytale_wall_art: "glow 60 35 1.4 moon; glow 46 72 0.8 window; sparkle 50 62 60 30 4; sheen",
    sugarplum_pastel_wall_art: "glow 36 63 0.7 window; glow 64 63 0.7 window; sparkle 50 55 60 40 4; sheen",
    vintage_woodland_wall_art: "part ear 26 37 10 12 60 100; sheen",
    warm_gouache_wall_art: "part bob 55 27 26 20 30 100; part bob 22 49 26 20 70 100; sheen",
    snowflake_cocoa_mug: "steam 40 4",
    holly_cocoa_mug: "steam 40 4",
    tree_cocoa_mug: "steam 40 4",
    pine_teapot: "steam 4 12",
    copper_lantern: "flame 45 64 0.7; glow 45 68 2.6",
    book_tree: "twinkle 48 9; glow 48 9 1.4",
    gingerbread_ornament: "glow 22 74 1.2 window; glow 84 74 1.2 window; sway",
    gingham_rocking_stool: "rock",
    bunny_gift_box: "tilt",
    gingerbread_friend: "tilt",
    orb_garland: "glow 20 60 1.2; glow 50 62 1.2; glow 80 60 1.2; twinkle 20 60; twinkle 50 62; twinkle 80 60; sway-soft"

};


// Pieces whose whole picture moves, and how.
const MOTIONS = ["breathe", "breathe-slow", "shade", "float", "sway", "sway-soft", "rock", "flap", "breeze", "tilt", "hop", "ring", "rattle", "tick", "flicker"];


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

        // Snow inside a glass globe: its middle and the glass's
        // radius (percent of the picture's width). Flakes drift
        // down; a shake (css .is-shaken) whirls them all up.
        case "globe": {
            const flakes = Array.from({ length: 24 }, (_, i) =>
                `<b style="--x:${(i * 37 + 7) % 88 + 6}%;--s:${(i % 3) + 2}px;--d:${((i * 0.83) % 7).toFixed(2)}s;--t:${(6 + (i % 4) * 1.4).toFixed(1)}s;--w:${(i % 2 ? 1 : -1) * (3 + (i % 5) * 2)}px;--h:${(i * 29) % 60 + 6}"></b>`
            ).join("");
            return `<i class="fx fx-globe" style="left:${percent(a, 50)};top:${percent(b, 40)};width:${(Number(c) || 40) * 2}%">${flakes}</i>`;
        }

        // A living part of an animal (or a painted one): an ear
        // that twitches, a nose that sniffs, a tail that swings,
        // a bird's head that bobs. A soft-edged piece of the same
        // picture over itself, turning about its pivot: "part
        // ear 55 0 24 22 40 100" is the box (left, top, width,
        // height) and the pivot inside it.
        case "part": {
            const [x, y, w, h, ox, oy] = effect.args.slice(1).map(Number);
            const kind = ["ear", "nose", "tail", "tail-soft", "bob", "flop"].includes(a) ? a : "ear";
            const dir = (ox ?? 50) > 50 ? 1 : -1;
            return `<i class="fx fx-part fx-part--${kind}" style="left:${x}%;top:${y}%;width:${w}%;height:${h}%;transform-origin:${ox ?? 50}% ${oy ?? 100}%;--dir:${dir};--d:${((index * 1.7) % 5).toFixed(2)}s;--bx:${(-x / w * 100).toFixed(2)}%;--by:${(-y / h * 100).toFixed(2)}%;--bw:${(10000 / w).toFixed(2)}%;--bh:${(10000 / h).toFixed(2)}%"><b></b></i>`;
        }

        // The shade (the top of the picture) swings gently on
        // its finial, tassels and all.
        case "shade":
            return `<i class="fx fx-shade"></i>`;

        default:
            return "";

    }

}


// Whether a painted piece is a snow globe (it can be shaken).
export function isSnowGlobe(src) {
    const name = String(src || "").split("/").pop().replace(/\.\w+$/, "");
    return /(^|;)\s*globe\s/.test(FX[name] || "");
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
