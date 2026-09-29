/* =========================================================
   NOVELLOW
   THE WORKSHOP'S DATA

   Every query for pieces readers share (sql/workshop.sql
   decides who can see what), preparing an uploaded picture,
   and adding a piece to a room.
========================================================= */

import { supabase } from "../core/supabase.js?v=__VERSION__";
import { NovellowError } from "../core/errors.js?v=__VERSION__";
import { createRow, currentUserId, getSettings } from "../core/store.js?v=__VERSION__";


const BUCKET = "workshop";
const URL_LIFETIME = 60 * 60 * 6;

// How big a picture may be before it's prepared, and how big
// it's kept.
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MIN_SIDE = 300;
export const MAX_SIDE = 4000;
const KEEP_SIDE = 1000;

// Workshop pieces in a room are saved as "workshop:<id>".
export const WORKSHOP_PREFIX = "workshop:";

export const CATEGORIES = [
    { id: "furniture", label: "Furniture" },
    { id: "lighting", label: "Lamps & lights" },
    { id: "wall", label: "Pictures & wall" },
    { id: "tabletop", label: "Tabletop" },
    { id: "plants", label: "Plants" },
    { id: "cozy", label: "Cozy things" },
    { id: "witchy", label: "Witchy & spooky" },
    { id: "other", label: "Something else" }
];

export const PLACES = [
    { id: "floor", label: "On the floor" },
    { id: "wall", label: "On the wall" },
    { id: "bookcase_top", label: "On top of the bookcase" },
    { id: "window", label: "On the windowsill" }
];

export const SIZES = [
    { id: "small", label: "Small (a mug, a candle)", width: 70 },
    { id: "medium", label: "Medium (a lamp, a plant)", width: 140 },
    { id: "large", label: "Large (a chair, a cabinet)", width: 220 },
    { id: "huge", label: "Very large (a sofa, a bed)", width: 320 }
];


function fail(error, message) {

    if (error?.code === "P0001") {
        return new NovellowError(error.message, error);
    }

    if (["42P01", "PGRST205", "PGRST202"].includes(error?.code)) {
        return new NovellowError("The Workshop isn't open on this site yet. Please try again soon.", error);
    }

    return new NovellowError(message, error);

}


/* =========================================================
   PICTURES
========================================================= */

const urls = new Map();

export async function signPictures(paths) {

    const needed =
        [...new Set(paths)].filter((path) => path && !urls.has(path));

    if (needed.length) {

        const { data, error } =
            await supabase.storage.from(BUCKET).createSignedUrls(needed, URL_LIFETIME);

        if (!error) {
            (data || []).forEach((row) => row.signedUrl && urls.set(row.path, row.signedUrl));
        }

    }

    return paths.map((path) => urls.get(path) || null);

}


export function pictureUrl(path) {
    return urls.get(path) || null;
}


/*
    Reads the chosen file, checks it, trims the empty edges and
    draws it afresh as a new picture (WebP where the browser can
    make one, PNG otherwise). Only this new picture is uploaded:
    nothing else inside the original file ever leaves the device.
*/
export async function preparePicture(file) {

    if (!file) {
        throw new NovellowError("Choose a picture first.");
    }

    if (!["image/png", "image/webp"].includes(file.type)) {
        throw new NovellowError("Please use a PNG or WebP picture (they can have a see-through background).");
    }

    if (file.size > MAX_FILE_BYTES) {
        throw new NovellowError("That picture is over 5 MB. Please make it smaller and try again.");
    }

    let bitmap;

    try {
        bitmap = await createImageBitmap(file);
    }

    catch (error) {
        throw new NovellowError("That picture couldn't be opened. Is it a PNG or WebP image?", error);
    }

    if (Math.max(bitmap.width, bitmap.height) < MIN_SIDE) {
        throw new NovellowError(`That picture is quite small. Please make it at least ${MIN_SIDE} pixels on its longest side.`);
    }

    if (Math.max(bitmap.width, bitmap.height) > MAX_SIDE) {
        throw new NovellowError(`That picture is very large. Please keep it under ${MAX_SIDE} pixels on each side.`);
    }

    // Find the drawing: the box around every pixel that isn't
    // see-through.
    const probe =
        document.createElement("canvas");

    probe.width = bitmap.width;
    probe.height = bitmap.height;

    const context =
        probe.getContext("2d", { willReadFrequently: true });

    context.drawImage(bitmap, 0, 0);

    const { data } =
        context.getImageData(0, 0, probe.width, probe.height);

    let left = probe.width, top = probe.height, right = -1, bottom = -1, clear = 0;

    for (let y = 0; y < probe.height; y += 1) {
        for (let x = 0; x < probe.width; x += 1) {

            const alpha = data[(y * probe.width + x) * 4 + 3];

            if (alpha < 250) {
                clear += 1;
            }

            if (alpha > 8) {
                left = Math.min(left, x);
                right = Math.max(right, x);
                top = Math.min(top, y);
                bottom = Math.max(bottom, y);
            }

        }
    }

    if (right < 0) {
        throw new NovellowError("That picture looks empty (it's all see-through).");
    }

    const cropWidth = right - left + 1;
    const cropHeight = bottom - top + 1;

    const scale =
        Math.min(1, KEEP_SIDE / Math.max(cropWidth, cropHeight));

    const canvas =
        document.createElement("canvas");

    canvas.width = Math.max(1, Math.round(cropWidth * scale));
    canvas.height = Math.max(1, Math.round(cropHeight * scale));

    const out =
        canvas.getContext("2d");

    out.imageSmoothingQuality = "high";
    out.drawImage(probe, left, top, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);

    let blob =
        await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.9));

    if (!blob || blob.type !== "image/webp") {
        blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    }

    if (!blob || blob.size > 2 * 1024 * 1024) {
        throw new NovellowError("That picture is still too big after tidying. Please try a smaller one.");
    }

    return {
        blob,
        width: canvas.width,
        height: canvas.height,
        previewUrl: URL.createObjectURL(blob),
        // Mostly a solid rectangle: worth a gentle warning.
        transparent: clear / (bitmap.width * bitmap.height) > 0.04
    };

}


/* =========================================================
   READING
========================================================= */

export async function loadGallery({ category = null, search = null } = {}) {

    const { data, error } =
        await supabase.rpc("workshop_gallery", { p_category: category, p_search: search || null });

    if (error) {
        throw fail(error, "The Workshop couldn't be opened just now.");
    }

    await signPictures(data.map((item) => item.image_path).filter(Boolean));

    return data;

}


export async function loadMine() {

    const { data, error } =
        await supabase
            .from("workshop_items")
            .select("*")
            .eq("maker_id", currentUserId())
            .order("created_at", { ascending: false });

    if (error) {
        throw fail(error, "Your creations couldn't be loaded just now.");
    }

    await signPictures(data.map((item) => item.image_path).filter(Boolean));

    return data;

}


export async function loadQueue() {

    const { data, error } =
        await supabase.rpc("workshop_queue");

    if (error) {
        return [];
    }

    await signPictures(data.map((item) => item.image_path).filter(Boolean));

    return data;

}


// Pieces already placed in a room, by id (for drawing them).
export async function loadPieces(ids) {

    if (!ids.length) {
        return [];
    }

    const { data, error } =
        await supabase
            .from("workshop_items")
            .select("id, kind, name, image_path, width, room_area")
            .in("id", ids);

    if (error) {
        return [];
    }

    await signPictures(data.map((item) => item.image_path).filter(Boolean));

    return data;

}


/* =========================================================
   SHARING
========================================================= */

export async function shareUpload({ picture, name, description, category, room_area, size }) {

    const path =
        `${currentUserId()}/${crypto.randomUUID()}.${picture.blob.type === "image/webp" ? "webp" : "png"}`;

    const { error: uploadError } =
        await supabase.storage
            .from(BUCKET)
            .upload(path, picture.blob, { contentType: picture.blob.type, upsert: false });

    if (uploadError) {
        throw fail(uploadError, "Your picture couldn't be uploaded just now. Please try again.");
    }

    const width =
        SIZES.find((option) => option.id === size)?.width || 140;

    const { error } =
        await supabase
            .from("workshop_items")
            .insert({ kind: "upload", name, description: description || null, category, room_area, image_path: path, width });

    if (error) {
        await supabase.storage.from(BUCKET).remove([path]);
        throw fail(error, "Your piece couldn't be shared just now. Please try again.");
    }

}


export async function shareRecolour({ name, description, category, room_area, base_asset, fabric }) {

    const { error } =
        await supabase
            .from("workshop_items")
            .insert({ kind: "recolour", name, description: description || null, category, room_area, base_asset, fabric });

    if (error) {
        throw fail(error, "Your piece couldn't be shared just now. Please try again.");
    }

}


export async function removePiece(item) {

    const { error } =
        await supabase
            .from("workshop_items")
            .delete()
            .eq("id", item.id);

    if (error) {
        throw fail(error, "That piece couldn't be removed just now.");
    }

    if (item.image_path) {
        await supabase.storage.from(BUCKET).remove([item.image_path]);
    }

}


export async function reviewPiece(item, approve, note = "") {

    const { error } =
        await supabase.rpc("review_workshop_item", { p_item: item.id, p_approve: approve, p_note: note || null });

    if (error) {
        throw fail(error, "That piece couldn't be reviewed just now.");
    }

}


export async function reportPiece(item, message) {

    const { error } =
        await supabase
            .from("reader_notes")
            .insert({
                kind: "report",
                message: `About the Workshop piece “${item.name}”: ${message}`,
                reported_user_id: item.maker_id
            });

    if (error) {
        throw fail(error, "The report couldn't be sent just now.");
    }

}


/* =========================================================
   INTO A ROOM
========================================================= */

const SPOTS = {
    floor: { room_area: "wall", position_x: 55, position_y: 80 },
    wall: { room_area: "wall", position_x: 40, position_y: 28 },
    window: { room_area: "wall", position_x: 46, position_y: 60 },
    bookcase_top: { room_area: "shelf", position_x: 30, position_y: 1.5 }
};


export async function addToRoom(item) {

    const theme =
        getSettings().theme || "original";

    const { count } =
        await supabase
            .from("decorations")
            .select("id", { count: "exact", head: true })
            .eq("user_id", currentUserId())
            .eq("theme", theme)
            .neq("decoration_type", "fixture");

    if ((count || 0) >= 80) {
        throw new NovellowError("Your room already holds 80 decorations. Take one out to add another.");
    }

    const upload =
        item.kind === "upload";

    // The room has two places to hang things: its wall-and-floor
    // side, and the bookcase. A starting spot for each kind; the
    // reader moves it in Arrange the room.
    const spot =
        SPOTS[item.room_area] || SPOTS.floor;

    await createRow("decorations", {
        asset_id: upload ? `${WORKSHOP_PREFIX}${item.id}` : item.base_asset,
        decoration_type: upload ? "workshop" : `tint:${item.fabric}`,
        theme,
        ...spot,
        scale: 1,
        rotation: 0,
        z_index: 30
    });

    await supabase.rpc("workshop_added", { p_item: item.id });

}
