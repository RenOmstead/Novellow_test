/* =========================================================
   NOVELLOW
   DECORATIONS

   The reader's own decorations on the library room: pick a
   piece, drag it anywhere on the wall or the bookcase, make
   it bigger or smaller, tilt it, bring it forward. Each room
   theme keeps its own arrangement, saved in the Supabase
   "decorations" table.

   Outside "Arrange the room" the pieces are pictures only:
   they never catch a click meant for a book.

   While arranging, the pieces wait in a tray that stays on
   screen as the page scrolls: a panel down one side on a
   computer, a strip along the bottom on a phone. Tap a piece
   to drop it into the part of the room in view, or drag it
   straight to its spot.
========================================================= */

import { listDecorations, createRow, updateRow, deleteRow } from "../core/store.js?v=__VERSION__";
import { html, render, clamp, debounce } from "../core/helpers.js?v=__VERSION__";
import { art, toast, toastError } from "../core/ui.js?v=__VERSION__";


/*
    Pieces the reader can place: sprite symbol, its viewBox,
    width in pixels at scale 1, and a friendly name.
*/

export const DECOR_GROUPS = [
    { id: "pictures", name: "Pictures" },
    { id: "bookish", name: "Bookish" },
    { id: "cozy", name: "Cozy" },
    { id: "plants", name: "Plants" },
    { id: "witchy", name: "Witchy" },
    { id: "spooky", name: "Spooky" }
];

export const DECOR_ASSETS = [
    // Pictures and frames
    { id: "portrait-ghost-reader", box: "0 0 120 152", width: 140, name: "Ghost reader portrait", group: "pictures" },
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
    { id: "decor-spellbook-stack", box: "0 0 86 84", width: 96, name: "Spellbooks and a mouse", group: "bookish" },
    { id: "decor-reading-mouse", box: "0 0 48 50", width: 52, name: "Reading mouse", group: "bookish" },
    { id: "decor-open-book", box: "0 0 86 44", width: 92, name: "Open book", group: "bookish" },
    { id: "decor-stack", box: "0 0 84 36", width: 64, name: "Book stack", group: "bookish" },
    { id: "decor-quill-mug", box: "0 0 46 82", width: 46, name: "Quills in a mug", group: "bookish" },
    { id: "decor-ink-ghost", box: "0 0 52 62", width: 52, name: "Ghost ink bottle", group: "bookish" },
    { id: "decor-fountain-pen", box: "0 0 98 24", width: 92, name: "Fountain pen", group: "bookish" },
    { id: "decor-typewriter", box: "0 0 86 66", width: 92, name: "Typewriter", group: "bookish" },
    { id: "decor-mixtape", box: "0 0 86 56", width: 84, name: "Ghostly mixtape", group: "bookish" },
    { id: "decor-hourglass", box: "0 0 38 64", width: 40, name: "Hourglass", group: "bookish" },
    { id: "decor-tarot", box: "0 0 72 60", width: 72, name: "Tarot cards", group: "bookish" },
    { id: "decor-teacup", box: "0 0 56 58", width: 40, name: "Teacup", group: "bookish" },
    { id: "decor-globe", box: "0 0 56 76", width: 44, name: "Globe", group: "bookish" },
    { id: "decor-bust", box: "0 0 48 76", width: 40, name: "Bust", group: "bookish" },
    { id: "decor-sign", box: "0 0 84 72", width: 64, name: "Sign", group: "bookish" },

    // Cozy lights and friends
    { id: "decor-fairy-lights", box: "0 0 140 54", width: 162, name: "Fairy lights", group: "cozy" },
    { id: "decor-candle-jars", box: "0 0 68 52", width: 76, name: "Candles in jars", group: "cozy" },
    { id: "decor-moon-lamp", box: "0 0 50 60", width: 56, name: "Moon lamp", group: "cozy" },
    { id: "decor-mushroom-lamp", box: "0 0 46 56", width: 50, name: "Mushroom lamp", group: "cozy" },
    { id: "decor-firefly-jar", box: "0 0 40 58", width: 44, name: "Jar of fireflies", group: "cozy" },
    { id: "decor-candle", box: "0 0 40 90", width: 28, name: "Candle", group: "cozy" },
    { id: "decor-candelabra", box: "0 0 110 220", width: 60, name: "Candelabra", group: "cozy" },
    { id: "decor-lantern", box: "0 0 50 92", width: 38, name: "Lantern", group: "cozy" },
    { id: "scene-cat", box: "0 0 220 160", width: 96, name: "Sleeping cat", group: "cozy" },
    { id: "decor-cat-sitting", box: "0 0 80 104", width: 60, name: "Cat", group: "cozy" },
    { id: "decor-belljar", box: "0 0 50 72", width: 40, name: "Bell jar", group: "cozy" },
    { id: "decor-umbrella-stand", box: "0 0 80 170", width: 50, name: "Umbrella stand", group: "cozy" },

    // Plants
    { id: "decor-pothos", box: "0 0 66 118", width: 76, name: "Hanging pothos", group: "plants" },
    { id: "decor-monstera", box: "0 0 66 84", width: 76, name: "Monstera", group: "plants" },
    { id: "decor-fern", box: "0 0 66 74", width: 76, name: "Fern", group: "plants" },
    { id: "decor-snake-plant", box: "0 0 44 84", width: 50, name: "Snake plant", group: "plants" },
    { id: "decor-succulents", box: "0 0 76 46", width: 84, name: "Succulents", group: "plants" },
    { id: "decor-cactus", box: "0 0 42 62", width: 46, name: "Cactus", group: "plants" },
    { id: "decor-lavender-jar", box: "0 0 40 74", width: 44, name: "Lavender", group: "plants" },
    { id: "decor-roses", box: "0 0 52 76", width: 58, name: "Dark roses", group: "plants" },
    { id: "decor-terrarium", box: "0 0 54 60", width: 60, name: "Terrarium", group: "plants" },
    { id: "decor-ivy-drape", box: "0 0 130 50", width: 150, name: "Trailing ivy", group: "plants" },
    { id: "decor-glow-mushrooms", box: "0 0 78 66", width: 88, name: "Glowing mushrooms", group: "plants" },
    { id: "decor-lantern-flowers", box: "0 0 66 106", width: 72, name: "Lantern flowers", group: "plants" },
    { id: "decor-plant", box: "0 0 60 78", width: 46, name: "Plant", group: "plants" },
    { id: "decor-flowers", box: "0 0 54 78", width: 42, name: "Flowers", group: "plants" },
    { id: "decor-mushrooms", box: "0 0 64 52", width: 46, name: "Toadstools", group: "plants" },
    { id: "decor-crow", box: "0 0 64 66", width: 50, name: "Crow", group: "plants" },

    // Witchy
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
    { id: "decor-potion", box: "0 0 40 64", width: 30, name: "Potion", group: "witchy" },
    { id: "decor-crystal", box: "0 0 48 60", width: 36, name: "Crystal", group: "witchy" },
    { id: "decor-starcharm", box: "0 0 40 52", width: 30, name: "Star charm", group: "witchy" },
    { id: "decor-cauldron", box: "0 0 140 140", width: 90, name: "Cauldron", group: "witchy" },
    { id: "decor-broom", box: "0 0 70 210", width: 44, name: "Broom", group: "witchy" },

    // Spooky
    { id: "decor-ghost-reader", box: "0 0 70 78", width: 78, name: "Ghost reading", group: "spooky" },
    { id: "decor-ghost-books", box: "0 0 70 80", width: 78, name: "Ghost with books", group: "spooky" },
    { id: "decor-ghost-scholar", box: "0 0 72 96", width: 78, name: "Scholar ghost", group: "spooky" },
    { id: "decor-ghost", box: "0 0 44 54", width: 40, name: "Ghost", group: "spooky" },
    { id: "decor-bat-pumpkin", box: "0 0 66 62", width: 72, name: "Bat in a pumpkin", group: "spooky" },
    { id: "decor-bat-hanging", box: "0 0 52 80", width: 56, name: "Sleepy bat", group: "spooky" },
    { id: "decor-bat-ghost", box: "0 0 58 66", width: 60, name: "Bat in a sheet", group: "spooky" },
    { id: "decor-bat-scarf", box: "0 0 88 60", width: 90, name: "Bat in a scarf", group: "spooky" },
    { id: "decor-bat", box: "0 0 84 46", width: 56, name: "Bat", group: "spooky" },
    { id: "decor-jack-lantern", box: "0 0 56 50", width: 64, name: "Jack-o'-lantern", group: "spooky" },
    { id: "decor-pumpkin", box: "0 0 56 42", width: 44, name: "Pumpkin", group: "spooky" },
    { id: "decor-spider", box: "0 0 34 74", width: 34, name: "Spider", group: "spooky" },
    { id: "decor-skull", box: "0 0 52 48", width: 42, name: "Skull", group: "spooky" },
    { id: "decor-cobweb", box: "0 0 120 120", width: 100, name: "Cobweb (left corner)", group: "spooky", dark: true },
    { id: "decor-cobweb-right", box: "0 0 120 120", width: 100, name: "Cobweb (right corner)", group: "spooky", dark: true },

    // Older pieces, still shown if they were placed before.
    { id: "frame-moth", box: "0 0 80 100", width: 70, name: "Moth frame", group: "retired" },
    { id: "frame-ghost", box: "0 0 70 90", width: 62, name: "Ghost portrait", group: "retired" },
    { id: "frame-castle", box: "0 0 130 100", width: 100, name: "Castle painting", group: "retired" }
];

const LIMIT = 60;

// room_area in the database → the part of the room it hangs on.
const AREAS = {
    wall: ".journal-zone",
    shelf: ".bookcase-zone"
};

let room = null;
let theme = "original";
let pieces = [];
let arranging = false;
let selectedId = null;
let bar = null;
let loadToken = 0;
let paletteGroup = "pictures";

// The tray: which side it sits on (computers) and whether it
// is folded down (phones).
const SIDE_KEY = "novellow-arrange-side";
let trayFolded = false;
let skipNextClick = false;
let trayObserver = null;


function onPhone() {
    return window.matchMedia("(max-width: 820px)").matches;
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
            class="placed-decor ${piece.id === selectedId ? "is-selected" : ""}"
            data-decor-id="${piece.id}"
            style="left: ${piece.position_x}%; top: ${piece.position_y}%; width: ${asset.width}px; z-index: ${piece.z_index}; --scale: ${piece.scale}; --rotation: ${piece.rotation}deg"
            ${arranging ? html`tabindex="0" role="button" aria-label="${asset.name}. Drag to move, or use the arrow keys."` : html`aria-hidden="true"`}
        >
            <svg viewBox="${asset.box}" aria-hidden="true"><use href="#${asset.id}"></use></svg>
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

    if (!arranging) {

        trayObserver?.disconnect();
        trayObserver = null;

        bar?.remove();
        bar = null;

        document.documentElement.style.removeProperty("--arrange-tray");

        return;

    }

    if (!bar) {

        document.body.insertAdjacentHTML("beforeend", `<section class="arrange-bar paper" aria-label="Arrange the room"></section>`);

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
            <p class="arrange-bar__title">Arrange the room</p>
            <button class="icon-button arrange-bar__fold" type="button" data-arrange="fold" aria-expanded="${String(!trayFolded)}" aria-label="${trayFolded ? "Show the decorations" : "Fold the tray down"}">
                ${art("ui-chevron-down")}
            </button>
            <button class="button button--primary button--small" type="button" data-arrange="done">Done</button>
        </div>

        <p class="arrange-bar__hint">Tap a piece to add it to the part of the room you can see, or drag it straight to its spot. Drag pieces to move them.</p>

        <div class="arrange-bar__tools" ${selected ? "" : html`hidden`}>
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
        </div>

        <div class="arrange-bar__tabs" role="tablist" aria-label="Kinds of decoration">
            ${DECOR_GROUPS.map((group) => html`
                <button class="arrange-bar__tab ${group.id === paletteGroup ? "is-current" : ""}" type="button" role="tab" aria-selected="${String(group.id === paletteGroup)}" data-decor-group="${group.id}">${group.name}</button>
            `)}
        </div>

        <ul class="arrange-bar__palette" aria-label="Decorations to add">
            ${DECOR_ASSETS.filter((asset) => asset.group === paletteGroup).map((asset) => html`
                <li>
                    <button class="arrange-bar__asset ${asset.dark ? "arrange-bar__asset--dark" : ""}" type="button" data-add-decor="${asset.id}" title="${asset.name}" aria-label="Add ${asset.name}">
                        <svg viewBox="${asset.box}" aria-hidden="true"><use href="#${asset.id}"></use></svg>
                        <span class="arrange-bar__label" aria-hidden="true">${asset.name}</span>
                    </button>
                </li>
            `)}
        </ul>

        <button class="text-button arrange-bar__side" type="button" data-arrange="side">
            ${bar.dataset.side === "left" ? html`Move this panel to the right ${art("ui-chevron-right")}` : html`${art("ui-chevron-left")} Move this panel to the left`}
        </button>

    `);

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

    return {
        position_x: Number(clamp(((x - box.left) / box.width) * 100, 0, 100).toFixed(2)),
        position_y: Number(clamp(((y - box.top) / box.height) * 100, 0, 100).toFixed(2))
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
                z_index: Math.min(50, pieces.reduce((top, piece) => Math.max(top, piece.z_index), 0) + 1)
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
        element.style.top = `${piece.position_y}%`;
        element.style.zIndex = piece.z_index;
        element.style.setProperty("--scale", piece.scale);
        element.style.setProperty("--rotation", `${piece.rotation}deg`);
    }

    saveSoon(piece);

}


/* =========================================================
   ARRANGE MODE: TOOLS, DRAGGING, KEYS
========================================================= */

function select(id) {

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

    const add =
        event.target.closest("[data-add-decor]");

    if (add) {
        addPiece(add.dataset.addDecor);
        return;
    }

    const action =
        event.target.closest("[data-arrange]")?.dataset.arrange;

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

        if (pointer.y < view.top + EDGE) {
            distance = -(view.top + EDGE - pointer.y);
        }

        else if (pointer.y > view.bottom - EDGE) {
            distance = pointer.y - (view.bottom - EDGE);
        }

        if (distance) {

            const before =
                window.scrollY;

            window.scrollBy(0, clamp(distance / 3, -18, 18));

            if (window.scrollY !== before) {
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
    it over the other part of the room moves it there.
*/

function onPointerDown(event) {

    const element =
        event.target.closest(".placed-decor");

    if (arranging && !element && !event.target.closest(".arrange-bar")) {

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
        }

        adjust(piece, positionIn(area, pointer.x, pointer.y));

    };

    const move = (moveEvent) => {

        pointer.x = moveEvent.clientX;
        pointer.y = moveEvent.clientY;

        place();

    };

    const stopScrolling =
        autoScroll(pointer, place);

    const stop = () => {

        stopScrolling();

        element.classList.remove("is-dragging");
        bar?.classList.remove("is-dragging");

        element.removeEventListener("pointermove", move);
        element.removeEventListener("pointerup", stop);
        element.removeEventListener("pointercancel", stop);

    };

    element.addEventListener("pointermove", move);
    element.addEventListener("pointerup", stop);
    element.addEventListener("pointercancel", stop);

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

    button.setPointerCapture(event.pointerId);

    const begin = () => {

        ghost = document.createElement("div");
        ghost.className = "decor-ghost";
        ghost.style.width = `${asset.width}px`;
        ghost.innerHTML = `<svg viewBox="${asset.box}" aria-hidden="true"><use href="#${asset.id}"></use></svg>`;
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

        button.removeEventListener("pointermove", move);
        button.removeEventListener("pointerup", finish);
        button.removeEventListener("pointercancel", cancel);

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

    const cancel = () => finish();

    button.addEventListener("pointermove", move);
    button.addEventListener("pointerup", finish);
    button.addEventListener("pointercancel", cancel);

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
        trayFolded = false;
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

        pieces = rows.map((row) => ({
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
