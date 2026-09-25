/* =========================================================
   NOVELLOW
   SOUNDSCAPE

   The sounds of the reading room, made live in the browser
   with the Web Audio API (no sound files): rain, thunder, a
   crackling fire, wind, a café with coffee being poured and a
   spoon stirring tea, a purring cat, a ticking clock, turning
   pages and a night garden.

   Each room theme has its own mix. The reader can turn sound
   on or off, set the volume, and adjust each sound. These are
   saved on this device only (localStorage), because sound is
   a per-device choice: on for the laptop, off for the phone.

   Browsers only allow sound after the reader taps or clicks,
   so nothing plays until they do.
========================================================= */

const STORE =
    "novellow-sound";

export const SOUNDS = [
    { id: "rain", name: "Rain", note: "Soft rain against the glass" },
    { id: "thunder", name: "Distant thunder", note: "Now and then, far away" },
    { id: "fire", name: "Crackling fire", note: "Logs settling in the grate" },
    { id: "wind", name: "Wind", note: "Whistling round the eaves" },
    { id: "cafe", name: "Café", note: "Coffee poured, a spoon stirring tea" },
    { id: "purr", name: "Purring cat", note: "Curled up somewhere nearby" },
    { id: "clock", name: "Ticking clock", note: "An old clock on the mantel" },
    { id: "pages", name: "Turning pages", note: "Someone reading close by" },
    { id: "night", name: "Night garden", note: "Crickets and the odd owl" }
];

// Each room's own mix (0 = silent, 1 = full).
export const ROOM_MIXES = {
    original: { fire: 0.55, purr: 0.4, clock: 0.3, pages: 0.35, rain: 0.15 },
    haunted: { wind: 0.6, clock: 0.45, fire: 0.25, pages: 0.3, thunder: 0.2 },
    rainy: { rain: 0.8, thunder: 0.45, fire: 0.35, clock: 0.25 },
    forest: { night: 0.7, wind: 0.25, fire: 0.3, pages: 0.2 },
    cafe: { cafe: 0.8, rain: 0.25, pages: 0.3, purr: 0.2 },
    gothic: { fire: 0.6, wind: 0.4, clock: 0.4, thunder: 0.25 }
};

let state = load();

let ctx = null;
let master = null;
let buffers = {};
const playing = new Map();


/* =========================================================
   SAVED CHOICES
========================================================= */

function load() {

    const fallback =
        { on: false, volume: 0.6, matchRoom: true, levels: {} };

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

    document.dispatchEvent(new CustomEvent("novellow:sound", { detail: getSoundState() }));

}


function room() {
    return document.documentElement.dataset.theme || "original";
}


export function getSoundState() {

    return {
        ...state,
        levels: currentLevels(),
        waiting: state.on && (!ctx || ctx.state !== "running")
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
   AUDIO BUILDING BLOCKS
========================================================= */

function makeNoise(kind, seconds) {

    const length =
        Math.floor(ctx.sampleRate * seconds);

    const buffer =
        ctx.createBuffer(1, length, ctx.sampleRate);

    const data =
        buffer.getChannelData(0);

    let last = 0;

    for (let index = 0; index < length; index += 1) {

        const white =
            Math.random() * 2 - 1;

        if (kind === "brown") {
            last = (last + 0.02 * white) / 1.02;
            data[index] = last * 3.5;
        }

        else {
            data[index] = white;
        }

    }

    return buffer;

}


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

        buffers = {
            white: makeNoise("white", 3),
            brown: makeNoise("brown", 5)
        };

    }

    if (ctx.state !== "running") {
        ctx.resume();
    }

    return true;

}


function loop(kind) {

    const source =
        ctx.createBufferSource();

    source.buffer = buffers[kind];
    source.loop = true;
    source.start(0, Math.random() * source.buffer.duration);

    return source;

}


function filter(type, frequency, q = 0.7) {

    const node =
        ctx.createBiquadFilter();

    node.type = type;
    node.frequency.value = frequency;
    node.Q.value = q;

    return node;

}


function gain(value) {

    const node =
        ctx.createGain();

    node.gain.value = value;

    return node;

}


function chain(...nodes) {

    for (let index = 0; index < nodes.length - 1; index += 1) {
        nodes[index].connect(nodes[index + 1]);
    }

    return nodes[nodes.length - 1];

}


/*
    A short burst of noise through a filter, with its own
    envelope. The building block of drops, crackles, rustles.
*/

function burst(out, { at, kind = "white", duration, type = "bandpass", frequency = 1000, q = 1, level = 0.3, attack = 0.002 }) {

    const source =
        ctx.createBufferSource();

    source.buffer = buffers[kind];

    const shape =
        gain(0);

    chain(source, filter(type, frequency, q), shape, out);

    shape.gain.setValueAtTime(0, at);
    shape.gain.linearRampToValueAtTime(level, at + attack);
    shape.gain.exponentialRampToValueAtTime(0.0001, at + attack + duration);

    // Loop the noise so long bursts (thunder) never run out.
    source.loop = true;
    source.start(at, Math.random() * source.buffer.duration);
    source.stop(at + attack + duration + 0.05);

}


function tone(out, { at, frequency, duration, level = 0.2, type = "sine", glideTo = null, attack = 0.004 }) {

    const oscillator =
        ctx.createOscillator();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, at);

    if (glideTo) {
        oscillator.frequency.exponentialRampToValueAtTime(glideTo, at + duration);
    }

    const shape =
        gain(0);

    chain(oscillator, shape, out);

    shape.gain.setValueAtTime(0, at);
    shape.gain.linearRampToValueAtTime(level, at + attack);
    shape.gain.exponentialRampToValueAtTime(0.0001, at + attack + duration);

    oscillator.start(at);
    oscillator.stop(at + attack + duration + 0.05);

}


function random(min, max) {
    return min + Math.random() * (max - min);
}


/*
    Runs `happen(time)` again and again at random intervals
    until stopped. Returns the stop function.
*/

function every(minSeconds, maxSeconds, happen, { startAfter = null } = {}) {

    let timer = null;
    let stopped = false;

    const next = (delay) => {

        timer = window.setTimeout(() => {

            if (stopped) {
                return;
            }

            happen(ctx.currentTime + 0.05);

            next(random(minSeconds, maxSeconds));

        }, delay * 1000);

    };

    next(startAfter ?? random(minSeconds, maxSeconds));

    return () => {
        stopped = true;
        window.clearTimeout(timer);
    };

}


/*
    Slowly wanders an AudioParam between two values, so steady
    sounds (wind, fire) breathe instead of droning.
*/

function wander(param, min, max, minSeconds, maxSeconds) {

    return every(minSeconds, maxSeconds, (at) => {
        param.setTargetAtTime(random(min, max), at, random(minSeconds, maxSeconds) / 3);
    }, { startAfter: 0 });

}


/* =========================================================
   THE SOUNDS
   Each builder connects into `out` and returns a function
   that stops it.
========================================================= */

const BUILDERS = {

    rain(out) {

        const hiss =
            loop("white");

        const body =
            loop("brown");

        const hissLevel =
            gain(0.12);

        chain(hiss, filter("highpass", 900), filter("lowpass", 7000), hissLevel, out);
        chain(body, filter("lowpass", 900), gain(0.5), out);

        const stops = [
            wander(hissLevel.gain, 0.08, 0.16, 3, 7),
            every(0.03, 0.11, (at) => burst(out, {
                at,
                duration: random(0.006, 0.02),
                frequency: random(2200, 6500),
                q: 3,
                level: random(0.04, 0.2)
            }))
        ];

        return () => {
            stops.forEach((stop) => stop());
            hiss.stop();
            body.stop();
        };

    },

    thunder(out) {

        return every(35, 90, (at) => {

            // The window flashes first; the sound follows.
            document.dispatchEvent(new CustomEvent("novellow:lightning"));

            const delay =
                random(0.8, 2.2);

            burst(out, { at: at + delay, kind: "brown", type: "lowpass", frequency: 140, q: 0.5, duration: random(3.5, 6), attack: 0.4, level: 1 });
            burst(out, { at: at + delay + 0.15, kind: "brown", type: "lowpass", frequency: 260, q: 0.7, duration: 1.4, attack: 0.08, level: 0.6 });

        }, { startAfter: random(6, 14) });

    },

    fire(out) {

        const roar =
            loop("brown");

        const roarLevel =
            gain(0.35);

        chain(roar, filter("lowpass", 240), roarLevel, out);

        const crackle = (at) => {

            burst(out, {
                at,
                duration: random(0.003, 0.012),
                type: "highpass",
                frequency: random(1400, 3000),
                level: random(0.08, 0.45)
            });

        };

        const stops = [

            wander(roarLevel.gain, 0.22, 0.45, 1, 3),

            every(0.05, 0.3, (at) => {

                crackle(at);

                // Sometimes a flurry of little snaps.
                if (Math.random() < 0.12) {
                    for (let index = 1; index < 3 + Math.random() * 4; index += 1) {
                        crackle(at + index * random(0.02, 0.06));
                    }
                }

                // And now and then a log pops.
                if (Math.random() < 0.03) {
                    burst(out, { at, kind: "brown", duration: 0.05, frequency: 420, q: 1.2, level: 0.9 });
                }

            })

        ];

        return () => {
            stops.forEach((stop) => stop());
            roar.stop();
        };

    },

    wind(out) {

        const air =
            loop("white");

        const band =
            filter("bandpass", 450, 3.5);

        const level =
            gain(0.3);

        chain(air, band, level, out);

        const stops = [
            wander(band.frequency, 260, 900, 2, 5),
            wander(level.gain, 0.12, 0.55, 2.5, 6)
        ];

        return () => {
            stops.forEach((stop) => stop());
            air.stop();
        };

    },

    cafe(out) {

        // The low murmur of a room.
        const murmur =
            loop("brown");

        const murmurLevel =
            gain(0.1);

        chain(murmur, filter("bandpass", 380, 0.8), murmurLevel, out);

        const pour = (at) => {

            const length =
                random(3.2, 4.8);

            const stream =
                ctx.createBufferSource();

            stream.buffer = buffers.white;
            stream.loop = true;

            const band =
                filter("bandpass", 520, 2.2);

            const shape =
                gain(0);

            // The gurgle: the stream wobbles as it fills the cup.
            const gurgle =
                ctx.createOscillator();

            gurgle.frequency.value = random(9, 14);

            const depth =
                gain(0.35);

            const wobble =
                gain(0.6);

            chain(gurgle, depth, wobble.gain);
            chain(stream, band, shape, wobble, out);

            // The note rises as the cup fills.
            band.frequency.setValueAtTime(520, at);
            band.frequency.exponentialRampToValueAtTime(random(1300, 1700), at + length);

            shape.gain.setValueAtTime(0, at);
            shape.gain.linearRampToValueAtTime(0.5, at + 0.25);
            shape.gain.setValueAtTime(0.5, at + length - 0.4);
            shape.gain.linearRampToValueAtTime(0, at + length);

            stream.start(at);
            stream.stop(at + length + 0.1);
            gurgle.start(at);
            gurgle.stop(at + length + 0.1);

            // A little splash at the start.
            burst(out, { at, kind: "brown", type: "lowpass", frequency: 500, duration: 0.3, level: 0.35 });

        };

        // A teaspoon: bright, bell-like clinks against china.
        const clink = (at, level) => {

            const base =
                random(2500, 2900);

            [[1, 0.28], [1.47, 0.2], [2.09, 0.14], [2.76, 0.09]].forEach(([ratio, ring], index) => {
                tone(out, { at, frequency: base * ratio, duration: ring, level: level / (index + 1) });
            });

        };

        const stir = (at) => {

            let time = at;

            const turns =
                Math.floor(random(6, 10));

            for (let index = 0; index < turns; index += 1) {
                clink(time, index % 2 ? random(0.05, 0.08) : random(0.1, 0.14));
                time += random(0.26, 0.4);
            }

            // Tap, tap on the rim.
            clink(time + 0.2, 0.18);
            clink(time + 0.38, 0.16);

        };

        let pourNext = true;

        const stops = [
            wander(murmurLevel.gain, 0.06, 0.13, 3, 8),
            every(14, 30, (at) => {

                if (pourNext) {
                    pour(at);
                }

                else {
                    stir(at);
                }

                pourNext = !pourNext;

            }, { startAfter: random(2, 5) })
        ];

        return () => {
            stops.forEach((stop) => stop());
            murmur.stop();
        };

    },

    purr(out) {

        const rumble =
            loop("brown");

        const throb =
            gain(0.5);

        const breath =
            gain(0);

        chain(rumble, filter("lowpass", 420), throb, breath, out);

        const flutter =
            ctx.createOscillator();

        flutter.frequency.value = 25;

        chain(flutter, gain(0.5), throb.gain);

        flutter.start();

        // In and out, like a sleeping cat.
        const stopBreathing =
            every(2.8, 3.4, (at) => {

                breath.gain.setTargetAtTime(0.9, at, 0.25);
                flutter.frequency.setTargetAtTime(26, at, 0.2);

                breath.gain.setTargetAtTime(0.55, at + 1.5, 0.3);
                flutter.frequency.setTargetAtTime(22, at + 1.5, 0.3);

            }, { startAfter: 0 });

        return () => {
            stopBreathing();
            rumble.stop();
            flutter.stop();
        };

    },

    clock(out) {

        let tock = false;

        const timer =
            window.setInterval(() => {

                const at =
                    ctx.currentTime + 0.05;

                tone(out, { at, frequency: tock ? 2300 : 2900, duration: 0.03, level: 0.14, type: "triangle" });
                burst(out, { at, duration: 0.006, type: "highpass", frequency: 3500, level: 0.12 });

                tock = !tock;

            }, 1000);

        return () => window.clearInterval(timer);

    },

    pages(out) {

        return every(25, 60, (at) => {

            burst(out, { at, duration: 0.22, frequency: 2600, q: 0.8, attack: 0.08, level: 0.25 });
            burst(out, { at: at + 0.18, duration: 0.3, frequency: 3400, q: 0.7, attack: 0.1, level: 0.2 });
            burst(out, { at: at + 0.5, duration: 0.1, type: "lowpass", frequency: 1100, level: 0.25 });

        }, { startAfter: random(4, 10) });

    },

    night(out) {

        const cricket = (pitch, level) => (at) => {

            for (let index = 0; index < 3; index += 1) {
                tone(out, { at: at + index * 0.055, frequency: pitch, duration: 0.03, level });
            }

        };

        const hoot = (at) => {

            tone(out, { at, frequency: 390, glideTo: 350, duration: 0.45, level: 0.22, attack: 0.08 });
            tone(out, { at: at + 0.75, frequency: 400, glideTo: 330, duration: 0.8, level: 0.26, attack: 0.1 });

        };

        const stops = [
            every(0.8, 1.4, cricket(4400, 0.04)),
            every(1.1, 1.9, cricket(4950, 0.03)),
            every(30, 70, hoot, { startAfter: random(8, 20) })
        ];

        return () => stops.forEach((stop) => stop());

    }

};


/* =========================================================
   MIXING
========================================================= */

function sync() {

    if (!ctx || ctx.state !== "running") {
        return;
    }

    const now =
        ctx.currentTime;

    master.gain.setTargetAtTime(state.on ? state.volume * 0.8 : 0, now, 0.4);

    const levels =
        currentLevels();

    SOUNDS.forEach(({ id }) => {

        const level =
            state.on ? levels[id] : 0;

        let layer =
            playing.get(id);

        if (level > 0 && !layer) {

            const out =
                gain(0);

            out.connect(master);

            layer = { out, stop: BUILDERS[id](out) };

            playing.set(id, layer);

        }

        if (!layer) {
            return;
        }

        layer.out.gain.setTargetAtTime(level, now, 0.5);

        // Silent sounds are stopped after they fade out, to
        // save the battery.
        window.clearTimeout(layer.ending);

        if (level === 0) {

            layer.ending =
                window.setTimeout(() => {

                    layer.stop();
                    layer.out.disconnect();
                    playing.delete(id);

                }, 2500);

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
        save();
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
                save();
            });
        }

    };

    window.addEventListener("pointerdown", begin, true);
    window.addEventListener("keydown", begin, true);

}
