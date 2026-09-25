/* =========================================================
   NOVELLOW
   SOUNDSCAPE

   The sounds of the reading room, played from real
   recordings in assets/sounds/ (see the README there for the
   file names and where each recording came from).

   Two kinds of sound:
     - beds that play continuously (rain, fire, murmurs…).
       They are cross-faded with themselves, so even a
       recording that wasn't made to loop never clicks.
     - moments that happen now and then (thunder, a spoon
       stirring tea, a page turning, an owl), picked at
       random from their recordings, slightly varied each
       time.

   Each room theme has its own mix. The reader can turn sound
   on or off, set the volume and adjust each sound. These are
   saved on this device only (localStorage), because sound is
   a per-device choice: on for the laptop, off for the phone.

   Browsers only allow sound after the reader taps or clicks,
   so nothing plays until they do. A recording is only
   downloaded when its sound is turned up.
========================================================= */

const STORE =
    "novellow-sound";

const FOLDER =
    "assets/sounds/";

export const SOUNDS = [
    { id: "rain", name: "Rain", note: "Rain on the window and the roof", bed: ["rain.mp3"] },
    { id: "thunder", name: "Distant thunder", note: "Now and then, far away", moments: ["thunder-1.mp3", "thunder-2.mp3"], every: [45, 110], lightning: true },
    { id: "fire", name: "Crackling fire", note: "Logs burning in the grate", bed: ["fire.mp3"] },
    { id: "wind", name: "Wind", note: "Round the eaves on a stormy night", bed: ["wind.mp3"] },
    { id: "murmurs", name: "Soft murmurs", note: "People talking quietly nearby", bed: ["murmurs.mp3"] },
    { id: "spoon", name: "Spoon stirring", note: "A teaspoon clinking in a cup", moments: ["spoon-1.mp3", "spoon-2.mp3"], every: [25, 60] },
    { id: "coffee", name: "Coffee pouring", note: "A fresh cup being poured", moments: ["coffee-pour.mp3"], every: [50, 120] },
    { id: "purr", name: "Purring cat", note: "Curled up somewhere nearby", bed: ["purr.mp3"] },
    { id: "clock", name: "Ticking clock", note: "An old clock on the mantel", bed: ["clock.mp3"] },
    { id: "pages", name: "Turning pages", note: "Someone reading close by", moments: ["page-1.mp3", "page-2.mp3", "page-3.mp3"], every: [30, 75] },
    { id: "night", name: "Night garden", note: "Crickets, and sometimes an owl", bed: ["crickets.mp3"], moments: ["owl.mp3"], every: [50, 120] }
];

// Each room's own mix (0 = silent, 1 = full).
export const ROOM_MIXES = {
    original: { fire: 0.6, purr: 0.35, clock: 0.3, pages: 0.4, rain: 0.2 },
    haunted: { wind: 0.6, clock: 0.45, fire: 0.3, pages: 0.3, thunder: 0.35 },
    rainy: { rain: 0.8, thunder: 0.55, fire: 0.4, clock: 0.25, spoon: 0.3 },
    forest: { night: 0.7, wind: 0.25, fire: 0.3, pages: 0.25 },
    cafe: { murmurs: 0.7, spoon: 0.55, coffee: 0.5, rain: 0.25, pages: 0.25 },
    gothic: { fire: 0.6, wind: 0.4, clock: 0.4, thunder: 0.3 }
};

const CROSSFADE = 3;

let state = load();

let ctx = null;
let master = null;

const recordings = new Map();
const missing = new Set();
const playing = new Map();


/* =========================================================
   SAVED CHOICES
========================================================= */

function load() {

    const fallback =
        { on: false, volume: 0.7, matchRoom: true, levels: {} };

    try {
        return { ...fallback, ...JSON.parse(localStorage.getItem(STORE) || "{}") };
    }

    catch {
        return fallback;
    }

}


function save() {

    try {
        localStorage.setItem(STORE, JSON.stringify(state));
    }

    catch {
        // Private browsing: the choice lasts for this visit.
    }

    announce();

}


function announce() {
    document.dispatchEvent(new CustomEvent("novellow:sound", { detail: getSoundState() }));
}


function room() {
    return document.documentElement.dataset.theme || "original";
}


function filesOf(sound) {
    return [...(sound.bed || []), ...(sound.moments || [])];
}


export function getSoundState() {

    return {
        ...state,
        levels: currentLevels(),
        waiting: state.on && (!ctx || ctx.state !== "running"),
        unavailable: SOUNDS
            .filter((sound) => filesOf(sound).every((file) => missing.has(file)))
            .map((sound) => sound.id)
    };

}


function currentLevels() {

    const mix =
        ROOM_MIXES[room()] || ROOM_MIXES.original;

    return Object.fromEntries(
        SOUNDS.map((sound) => [
            sound.id,
            state.matchRoom ? mix[sound.id] || 0 : state.levels[sound.id] || 0
        ])
    );

}


/* =========================================================
   RECORDINGS
========================================================= */

function wake() {

    if (!ctx) {

        const AudioContext =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContext) {
            return false;
        }

        ctx = new AudioContext();

        master = ctx.createGain();
        master.gain.value = 0;
        master.connect(ctx.destination);

    }

    if (ctx.state !== "running") {
        ctx.resume();
    }

    return true;

}


/*
    Downloads and decodes a recording once. Resolves to null
    when the file hasn't been added yet.
*/

function recording(file) {

    if (!recordings.has(file)) {

        recordings.set(file,
            fetch(`${FOLDER}${file}?v=__VERSION__`)
                .then((response) => {

                    if (!response.ok) {
                        throw new Error(`${file}: ${response.status}`);
                    }

                    return response.arrayBuffer();

                })
                .then((bytes) => new Promise((resolve, reject) => ctx.decodeAudioData(bytes, resolve, reject)))
                .catch((error) => {

                    console.info(`Novellow sound not available yet: ${file}`, error.message);

                    missing.add(file);

                    announce();

                    return null;

                })
        );

    }

    return recordings.get(file);

}


/*
    Checks which recordings exist without downloading them,
    so the mixer can say which sounds are still to come.
*/

let checked = false;

export function checkRecordings() {

    if (checked) {
        return;
    }

    checked = true;

    SOUNDS.forEach((sound) => {

        filesOf(sound).forEach((file) => {

            fetch(`${FOLDER}${file}?v=__VERSION__`, { method: "HEAD" })
                .then((response) => {

                    if (!response.ok) {
                        missing.add(file);
                        announce();
                    }

                })
                .catch(() => {});

        });

    });

}


function random(min, max) {
    return min + Math.random() * (max - min);
}


/*
    Plays a bed forever by overlapping copies of the
    recording with long, gentle cross-fades.
*/

function playBed(buffer, out) {

    let stopped = false;
    let timer = null;
    const sources = new Set();

    const fade =
        Math.min(CROSSFADE, buffer.duration / 4);

    const segment = (at, offset) => {

        const source =
            ctx.createBufferSource();

        source.buffer = buffer;

        const shape =
            ctx.createGain();

        source.connect(shape);
        shape.connect(out);

        const length =
            buffer.duration - offset;

        shape.gain.setValueAtTime(0, at);
        shape.gain.linearRampToValueAtTime(1, at + fade);
        shape.gain.setValueAtTime(1, at + length - fade);
        shape.gain.linearRampToValueAtTime(0, at + length);

        source.start(at, offset);
        source.stop(at + length + 0.05);

        sources.add(source);
        source.onended = () => sources.delete(source);

        // Start the next copy as this one fades out.
        const next =
            at + length - fade;

        timer = window.setTimeout(() => {

            if (!stopped) {
                segment(next, 0);
            }

        }, Math.max(0, (next - ctx.currentTime - 1) * 1000));

    };

    // Begin somewhere in the middle, so each visit is different.
    segment(ctx.currentTime + 0.05, random(0, buffer.duration * 0.6));

    return () => {

        stopped = true;

        window.clearTimeout(timer);

        sources.forEach((source) => {
            try {
                source.stop();
            }
            catch {
                // Already finished.
            }
        });

    };

}


/*
    Plays one recording once, a little different each time:
    slightly louder or softer, a touch to the left or right.
*/

function playMoment(buffer, out) {

    const at =
        ctx.currentTime + 0.05;

    const source =
        ctx.createBufferSource();

    source.buffer = buffer;
    source.playbackRate.value = random(0.96, 1.04);

    const level =
        ctx.createGain();

    level.gain.value = random(0.75, 1);

    let last =
        level;

    if (ctx.createStereoPanner) {

        const pan =
            ctx.createStereoPanner();

        pan.pan.value = random(-0.4, 0.4);

        level.connect(pan);

        last = pan;

    }

    source.connect(level);
    last.connect(out);

    source.start(at);

}


/*
    Starts one sound: its bed (if any) and its moments
    (if any). Returns the function that stops it.
*/

function startSound(sound, out) {

    let stopped = false;
    let stopBed = null;
    let timer = null;

    if (sound.bed) {

        recording(sound.bed[0]).then((buffer) => {

            if (buffer && !stopped) {
                stopBed = playBed(buffer, out);
            }

        });

    }

    if (sound.moments) {

        const [min, max] =
            sound.every;

        const next = (delay) => {

            timer = window.setTimeout(async () => {

                if (stopped) {
                    return;
                }

                const file =
                    sound.moments[Math.floor(Math.random() * sound.moments.length)];

                const buffer =
                    await recording(file);

                if (buffer && !stopped) {

                    if (sound.lightning) {

                        // The window flashes first; the thunder follows.
                        document.dispatchEvent(new CustomEvent("novellow:lightning"));

                        window.setTimeout(() => {
                            if (!stopped) {
                                playMoment(buffer, out);
                            }
                        }, random(700, 2000));

                    }

                    else {
                        playMoment(buffer, out);
                    }

                }

                next(random(min, max));

            }, delay * 1000);

        };

        // The first moment comes fairly soon, so it's noticed.
        next(random(4, 12));

    }

    return () => {

        stopped = true;

        window.clearTimeout(timer);

        stopBed?.();

    };

}


/* =========================================================
   MIXING
========================================================= */

function sync() {

    if (!ctx || ctx.state !== "running") {
        return;
    }

    const now =
        ctx.currentTime;

    master.gain.setTargetAtTime(state.on ? state.volume : 0, now, 0.4);

    const levels =
        currentLevels();

    SOUNDS.forEach((sound) => {

        const level =
            state.on ? levels[sound.id] : 0;

        let layer =
            playing.get(sound.id);

        if (level > 0 && !layer) {

            const out =
                ctx.createGain();

            out.gain.value = 0;
            out.connect(master);

            layer = { out, stop: startSound(sound, out) };

            playing.set(sound.id, layer);

        }

        if (!layer) {
            return;
        }

        // A gentle curve, so low slider settings stay soft.
        layer.out.gain.setTargetAtTime(level * level, now, 0.6);

        // Silent sounds are stopped after they fade out.
        window.clearTimeout(layer.ending);

        if (level === 0) {

            layer.ending =
                window.setTimeout(() => {

                    layer.stop();
                    layer.out.disconnect();
                    playing.delete(sound.id);

                }, 3000);

        }

    });

}


/* =========================================================
   WHAT THE MIXER CALLS
========================================================= */

export function setSoundOn(on) {

    state.on = on;

    if (on && !wake()) {

        state.on = false;

        save();

        return false;

    }

    save();

    ctx?.resume().then(sync);

    sync();

    return true;

}


export function setVolume(volume) {

    state.volume = Math.max(0, Math.min(1, volume));

    save();
    sync();

}


export function setMatchRoom(match) {

    if (!match) {
        state.levels = currentLevels();
    }

    state.matchRoom = match;

    save();
    sync();

}


export function setLevel(id, level) {

    if (state.matchRoom) {
        state.levels = currentLevels();
        state.matchRoom = false;
    }

    state.levels[id] = Math.max(0, Math.min(1, level));

    save();
    sync();

}


/* =========================================================
   START
   If sound was left on, it begins at the reader's first tap
   or key press on the page.
========================================================= */

let started = false;

export function startSoundscape() {

    if (started) {
        return;
    }

    started = true;

    document.addEventListener("novellow:appearance", () => {
        sync();
        announce();
    });

    if (!state.on) {
        return;
    }

    const begin = () => {

        window.removeEventListener("pointerdown", begin, true);
        window.removeEventListener("keydown", begin, true);

        if (state.on && wake()) {
            ctx.resume().then(() => {
                sync();
                announce();
            });
        }

    };

    window.addEventListener("pointerdown", begin, true);
    window.addEventListener("keydown", begin, true);

}
