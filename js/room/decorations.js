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
========================================================= */

import { listDecorations, createRow, updateRow, deleteRow } from "../core/store.js?v=__VERSION__";
import { html, render, clamp, debounce } from "../core/helpers.js?v=__VERSION__";
import { art, toast, toastError } from "../core/ui.js?v=__VERSION__";


/*
    Pieces the reader can place: sprite symbol, its viewBox,
    width in pixels at scale 1, and a friendly name.
*/

export const DECOR_ASSETS = [
    { id: "decor-candle", box: "0 0 40 90", width: 28, name: "Candle" },
    { id: "decor-lantern", box: "0 0 50 92", width: 38, name: "Lantern" },
    { id: "decor-potion", box: "0 0 40 64", width: 30, name: "Potion" },
    { id: "decor-skull", box: "0 0 52 48", width: 42, name: "Skull" },
    { id: "decor-crow", box: "0 0 64 66", width: 50, name: "Crow" },
    { id: "decor-bust", box: "0 0 48 76", width: 40, name: "Bust" },
    { id: "decor-belljar", box: "0 0 50 72", width: 40, name: "Bell jar" },
    { id: "decor-teacup", box: "0 0 56 58", width: 40, name: "Teacup" },
    { id: "decor-plant", box: "0 0 60 78", width: 46, name: "Plant" },
    { id: "decor-flowers", box: "0 0 54 78", width: 42, name: "Flowers" },
    { id: "decor-mushrooms", box: "0 0 64 52", width: 46, name: "Toadstools" },
    { id: "decor-crystal", box: "0 0 48 60", width: 36, name: "Crystal" },
    { id: "decor-globe", box: "0 0 56 76", width: 44, name: "Globe" },
    { id: "decor-stack", box: "0 0 84 36", width: 64, name: "Book stack" },
    { id: "decor-pumpkin", box: "0 0 56 42", width: 44, name: "Pumpkin" },
    { id: "decor-ghost", box: "0 0 44 54", width: 40, name: "Ghost" },
    { id: "decor-bat", box: "0 0 84 46", width: 56, name: "Bat" },
    { id: "decor-cat-sitting", box: "0 0 80 104", width: 60, name: "Cat" },
    { id: "decor-starcharm", box: "0 0 40 52", width: 30, name: "Star charm" },
    { id: "decor-sign", box: "0 0 84 72", width: 64, name: "Sign" },
    { id: "frame-moth", box: "0 0 80 100", width: 70, name: "Moth frame" },
    { id: "frame-ghost", box: "0 0 70 90", width: 62, name: "Ghost portrait" },
    { id: "frame-castle", box: "0 0 130 100", width: 100, name: "Castle painting" }
];

const LIMIT = 40;

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

        bar?.remove();
        bar = null;

        return;

    }

    if (!bar) {

        document.body.insertAdjacentHTML("beforeend", `<section class="arrange-bar paper" aria-label="Arrange the room"></section>`);

        bar = document.body.lastElementChild;

        bar.addEventListener("click", onBarClick);

    }

    const selected =
        pieces.find((piece) => piece.id === selectedId);

    render(bar, html`

        <div class="arrange-bar__head">
            <div>
                <p class="eyebrow">Arrange the room</p>
                <p class="arrange-bar__hint">Choose a piece to add it, then drag it anywhere on the wall or the bookcase.</p>
            </div>
            <button class="button button--primary button--small" type="button" data-arrange="done">Done</button>
        </div>

        <ul class="arrange-bar__palette" aria-label="Decorations to add">
            ${DECOR_ASSETS.map((asset) => html`
                <li>
                    <button class="arrange-bar__asset" type="button" data-add-decor="${asset.id}" title="${asset.name}" aria-label="Add ${asset.name}">
                        <svg viewBox="${asset.box}" aria-hidden="true"><use href="#${asset.id}"></use></svg>
                    </button>
                </li>
            `)}
        </ul>

        <div class="arrange-bar__tools" ${selected ? "" : html`hidden`}>
            <span class="arrange-bar__selected">${selected ? assetFor(selected.asset_id)?.name : ""}</span>
            <button class="icon-button" type="button" data-arrange="smaller" aria-label="Smaller">−</button>
            <button class="icon-button" type="button" data-arrange="bigger" aria-label="Bigger">+</button>
            <button class="icon-button" type="button" data-arrange="tilt-left" aria-label="Tilt left">↺</button>
            <button class="icon-button" type="button" data-arrange="tilt-right" aria-label="Tilt right">↻</button>
            <button class="icon-button" type="button" data-arrange="back" aria-label="Send behind">⤓</button>
            <button class="icon-button" type="button" data-arrange="forward" aria-label="Bring to front">⤒</button>
            <button class="icon-button" type="button" data-arrange="remove" aria-label="Remove">${art("ui-trash")}</button>
        </div>

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


async function addPiece(assetId) {

    if (pieces.length >= LIMIT) {
        toast(`The room can hold ${LIMIT} decorations. Remove one to add another.`);
        return;
    }

    const onPhone =
        window.matchMedia("(max-width: 820px)").matches;

    try {

        const saved =
            await createRow("decorations", {
                asset_id: assetId,
                decoration_type: assetId.startsWith("frame-") ? "frame" : "ornament",
                room_area: onPhone ? "shelf" : "wall",
                theme,
                position_x: 30 + Math.round(Math.random() * 40),
                position_y: onPhone ? 8 : 18 + Math.round(Math.random() * 20),
                scale: 1,
                rotation: 0,
                z_index: Math.min(50, pieces.reduce((top, piece) => Math.max(top, piece.z_index), 0) + 1)
            });

        pieces.push(saved);

        selectedId = saved.id;

        draw();

        room.querySelector(`[data-decor-id="${saved.id}"]`)?.focus();

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
    Dragging: the piece follows the pointer. Dropping it over
    the other half of the room moves it there.
*/

function onPointerDown(event) {

    const element =
        event.target.closest(".placed-decor");

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

    element.setPointerCapture(event.pointerId);
    element.classList.add("is-dragging");

    const move = (moveEvent) => {

        const area =
            areaAt(moveEvent.clientX, moveEvent.clientY) || piece.room_area;

        const layer =
            layerFor(area);

        if (!layer) {
            return;
        }

        if (area !== piece.room_area) {
            piece.room_area = area;
            layer.appendChild(element);
        }

        const box =
            layer.getBoundingClientRect();

        adjust(piece, {
            position_x: ((moveEvent.clientX - box.left) / box.width) * 100,
            position_y: ((moveEvent.clientY - box.top) / box.height) * 100
        });

    };

    const stop = () => {

        element.classList.remove("is-dragging");
        element.removeEventListener("pointermove", move);
        element.removeEventListener("pointerup", stop);
        element.removeEventListener("pointercancel", stop);

    };

    element.addEventListener("pointermove", move);
    element.addEventListener("pointerup", stop);
    element.addEventListener("pointercancel", stop);

}


function areaAt(x, y) {

    return Object.keys(AREAS).find((area) => {

        const zone =
            room.querySelector(AREAS[area]);

        if (!zone || !zone.offsetParent) {
            return false;
        }

        const box =
            zone.getBoundingClientRect();

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
    }

    draw();

    if (on) {
        bar?.querySelector("[data-add-decor]")?.focus();
        toast("Arrange the room: add pieces, then drag them into place.", { timeout: 3200 });
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
