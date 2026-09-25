/* =========================================================
   NOVELLOW
   BOOK COVERS

   Covers live in the private "book-covers" bucket under
   {user_id}/{book_id}/{file}. Images are resized in the
   browser before upload and shown through short-lived
   signed URLs.
========================================================= */

import { supabase } from "./supabase.js?v=__VERSION__";
import { NovellowError } from "./errors.js?v=__VERSION__";

import {
    COVER_BUCKET,
    COVER_MAX_HEIGHT,
    COVER_MAX_UPLOAD_BYTES,
    COVER_URL_LIFETIME_SECONDS
} from "../config.js?v=__VERSION__";


const ACCEPTED_TYPES =
    ["image/jpeg", "image/png", "image/webp"];

// path -> { url, expires }
const signedUrls =
    new Map();


/* =========================================================
   CHECK AND RESIZE
========================================================= */

export function checkCoverFile(file) {

    if (!file) {
        return;
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
        throw new NovellowError("Covers can be JPEG, PNG or WebP images.");
    }

    if (file.size > 20 * 1024 * 1024) {
        throw new NovellowError("That image is very large. Choose one under 20 MB.");
    }

}


async function resizeCover(file) {

    const bitmap =
        await createImageBitmap(file);

    const scale =
        Math.min(1, COVER_MAX_HEIGHT / bitmap.height);

    const canvas =
        document.createElement("canvas");

    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);

    canvas
        .getContext("2d")
        .drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    bitmap.close?.();

    const toBlob = (type, quality) =>
        new Promise((resolve) => canvas.toBlob(resolve, type, quality));

    // WebP where the browser can make it, JPEG otherwise.
    let blob =
        await toBlob("image/webp", 0.86);

    if (!blob || blob.type !== "image/webp") {
        blob = await toBlob("image/jpeg", 0.88);
    }

    if (!blob) {
        throw new NovellowError("That image couldn't be prepared. Try a different file.");
    }

    return blob;

}


/* =========================================================
   UPLOAD / REMOVE
========================================================= */

export async function uploadCover(userId, bookId, file) {

    checkCoverFile(file);

    const blob =
        await resizeCover(file);

    if (blob.size > COVER_MAX_UPLOAD_BYTES) {
        throw new NovellowError("That image is too large even after resizing. Choose a smaller one.");
    }

    const extension =
        blob.type === "image/webp" ? "webp" : "jpg";

    const path =
        `${userId}/${bookId}/${crypto.randomUUID()}.${extension}`;

    const { error } =
        await supabase
            .storage
            .from(COVER_BUCKET)
            .upload(path, blob, {
                contentType: blob.type,
                cacheControl: "31536000",
                upsert: false
            });

    if (error) {
        throw error;
    }

    return path;

}


export async function removeCover(path) {

    if (!path) {
        return;
    }

    signedUrls.delete(path);

    const { error } =
        await supabase
            .storage
            .from(COVER_BUCKET)
            .remove([path]);

    if (error) {
        console.error("Old cover could not be removed.", error);
    }

}


export async function removeCoverFolder(userId, bookId) {

    const folder =
        `${userId}/${bookId}`;

    const { data, error } =
        await supabase
            .storage
            .from(COVER_BUCKET)
            .list(folder);

    if (error) {
        throw error;
    }

    if (data?.length) {

        await supabase
            .storage
            .from(COVER_BUCKET)
            .remove(data.map((file) => `${folder}/${file.name}`));

    }

}


/* =========================================================
   SIGNED URLS
========================================================= */

export async function coverUrls(paths) {

    const now = Date.now();

    const needed =
        [...new Set(paths.filter(Boolean))]
            .filter((path) => {

                const cached =
                    signedUrls.get(path);

                return !cached || cached.expires < now + 60_000;

            });

    if (needed.length) {

        const { data, error } =
            await supabase
                .storage
                .from(COVER_BUCKET)
                .createSignedUrls(needed, COVER_URL_LIFETIME_SECONDS);

        if (error) {
            console.error("Cover links could not be created.", error);
        }

        (data || []).forEach((item) => {

            if (item.signedUrl) {

                signedUrls.set(item.path, {
                    url: item.signedUrl,
                    expires: now + COVER_URL_LIFETIME_SECONDS * 1000
                });

            }

        });

    }

    return Object.fromEntries(
        paths
            .filter(Boolean)
            .map((path) => [path, signedUrls.get(path)?.url || null])
    );

}


export async function coverUrl(path) {

    if (!path) {
        return null;
    }

    return (await coverUrls([path]))[path];

}


export function cachedCoverUrl(path) {
    return path ? signedUrls.get(path)?.url || null : null;
}
