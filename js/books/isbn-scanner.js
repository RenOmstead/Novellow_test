/* =========================================================
   NOVELLOW
   SCANNING A BOOK'S BARCODE

   scanIsbn() opens the camera and reads the barcode on the back
   of a book (an ISBN is printed as an EAN-13 barcode starting
   978 or 979), or lets the reader type the number instead.
   lookupIsbn() then asks Open Library for the book's details.

   The browser's own barcode reader is used where there is one
   (Chrome on Android, for example); elsewhere (Safari on iPhone
   and Mac) the ZXing library in js/vendor/ is loaded, only then.
   Nothing from the camera leaves the device.
========================================================= */

import { html, render } from "../core/helpers.js?v=__VERSION__";
import { art } from "../core/ui.js?v=__VERSION__";


const ZXING_SRC =
    "js/vendor/zxing-library-0.23.0.min.js?v=__VERSION__";

const OPEN_LIBRARY =
    "https://openlibrary.org/search.json";


/* =========================================================
   ISBN NUMBERS
========================================================= */

function isbn13Valid(digits) {

    if (!/^97[89]\d{10}$/.test(digits)) {
        return false;
    }

    const sum =
        [...digits.slice(0, 12)].reduce((total, digit, index) => total + Number(digit) * (index % 2 ? 3 : 1), 0);

    return (10 - (sum % 10)) % 10 === Number(digits[12]);

}


function isbn10Valid(digits) {

    if (!/^\d{9}[\dX]$/.test(digits)) {
        return false;
    }

    const sum =
        [...digits].reduce((total, digit, index) => total + (digit === "X" ? 10 : Number(digit)) * (10 - index), 0);

    return sum % 11 === 0;

}


// Accepts an ISBN typed with spaces or dashes; returns the
// clean number, or null if it isn't a real ISBN.
export function cleanIsbn(value) {

    const digits =
        String(value || "").toUpperCase().replace(/[^0-9X]/g, "");

    if (isbn13Valid(digits) || isbn10Valid(digits)) {
        return digits;
    }

    return null;

}


/* =========================================================
   LOOKING IT UP
========================================================= */

export async function lookupIsbn(isbn) {

    const url =
        `${OPEN_LIBRARY}?isbn=${encodeURIComponent(isbn)}&limit=1&fields=key,title,author_name,first_publish_year,number_of_pages_median,isbn,cover_i,subject`;

    const response =
        await fetch(url);

    if (!response.ok) {
        throw new Error(`Open Library ${response.status}`);
    }

    const doc =
        (await response.json()).docs?.[0];

    if (!doc) {
        return null;
    }

    return {
        prefill: {
            title: doc.title,
            author: doc.author_name?.[0] || null,
            publication_year: doc.first_publish_year || null,
            page_count: doc.number_of_pages_median || null,
            isbn,
            genre: doc.subject?.find((subject) => subject.length < 24) || null
        },
        coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : null
    };

}


/* =========================================================
   READERS
========================================================= */

let zxingLoading = null;

function loadZxing() {

    if (window.ZXing) {
        return Promise.resolve(window.ZXing);
    }

    zxingLoading ??= new Promise((resolve, reject) => {

        const script =
            document.createElement("script");

        script.src = ZXING_SRC;
        script.onload = () => resolve(window.ZXing);
        script.onerror = () => {
            zxingLoading = null;
            reject(new Error("The barcode reader couldn't be loaded."));
        };

        document.head.appendChild(script);

    });

    return zxingLoading;

}


async function nativeReader() {

    if (!("BarcodeDetector" in window)) {
        return null;
    }

    try {

        const formats =
            await window.BarcodeDetector.getSupportedFormats();

        if (!formats.includes("ean_13")) {
            return null;
        }

        const detector =
            new window.BarcodeDetector({ formats: ["ean_13"] });

        return async (video) => {
            const codes = await detector.detect(video);
            return codes.map((code) => code.rawValue);
        };

    }

    catch {
        return null;
    }

}


async function zxingReader() {

    const ZXing =
        await loadZxing();

    const hints =
        new Map([
            [ZXing.DecodeHintType.POSSIBLE_FORMATS, [ZXing.BarcodeFormat.EAN_13]],
            [ZXing.DecodeHintType.TRY_HARDER, true]
        ]);

    const reader =
        new ZXing.MultiFormatReader();

    reader.setHints(hints);

    const canvas =
        document.createElement("canvas");

    const context =
        canvas.getContext("2d", { willReadFrequently: true });

    return async (video) => {

        const width =
            video.videoWidth;

        const height =
            video.videoHeight;

        if (!width || !height) {
            return [];
        }

        // The middle band of the picture, where the guide is,
        // scaled down a little so each try is quick.
        const cropHeight =
            Math.round(height * 0.5);

        const scale =
            Math.min(1, 960 / width);

        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(cropHeight * scale);

        context.drawImage(video, 0, (height - cropHeight) / 2, width, cropHeight, 0, 0, canvas.width, canvas.height);

        const luminance =
            new ZXing.HTMLCanvasElementLuminanceSource(canvas);

        try {

            const result =
                reader.decodeWithState(new ZXing.BinaryBitmap(new ZXing.HybridBinarizer(luminance)));

            return [result.getText()];

        }

        // Nothing readable in this frame.
        catch {
            return [];
        }

    };

}


/* =========================================================
   THE SCANNER
========================================================= */

export function scanIsbn() {

    return new Promise((resolve) => {

        const dialog =
            document.createElement("dialog");

        dialog.className =
            "parchment-dialog scanner-dialog";

        dialog.setAttribute("aria-labelledby", "scannerTitle");

        document.body.appendChild(dialog);

        render(dialog, html`
            <div class="scanner">

                <button class="dialog-close" type="button" data-close aria-label="Close">
                    ${art("ui-close", "dialog-close__art")}
                </button>

                <p class="dialog-eyebrow">Add a book</p>
                <h2 class="dialog-title" id="scannerTitle">Scan the barcode</h2>

                <div class="scanner__view">
                    <video class="scanner__video" playsinline muted autoplay></video>
                    <div class="scanner__guide" aria-hidden="true"><span></span></div>
                </div>

                <p class="scanner__status" role="status">Starting the camera…</p>

                <form class="scanner__manual" novalidate>
                    <label class="field">
                        <span class="field__label">Or type the ISBN</span>
                        <input class="field__input" name="isbn" inputmode="numeric" autocomplete="off" placeholder="978…" maxlength="20">
                    </label>
                    <button class="button button--ghost" type="submit">Look it up</button>
                </form>

            </div>
        `);

        const video =
            dialog.querySelector("video");

        const status =
            dialog.querySelector(".scanner__status");

        let stream = null;
        let timer = 0;
        let done = false;
        let found = null;

        const say = (text) => {
            status.textContent = text;
        };

        const finish = (isbn) => {
            found = isbn;
            dialog.close();
        };

        dialog.addEventListener("close", () => {

            done = true;

            window.clearTimeout(timer);

            stream?.getTracks().forEach((track) => track.stop());

            resolve(found);

            window.setTimeout(() => dialog.remove(), 50);

        });

        dialog.querySelectorAll("[data-close]").forEach((button) => {
            button.addEventListener("click", () => dialog.close());
        });

        dialog.querySelector(".scanner__manual").addEventListener("submit", (event) => {

            event.preventDefault();

            const input =
                event.target.elements.isbn;

            const isbn =
                cleanIsbn(input.value);

            if (!isbn) {
                input.setAttribute("aria-invalid", "true");
                say("That doesn't look like an ISBN. It's the 10 or 13 digits by the barcode.");
                input.focus();
                return;
            }

            finish(isbn);

        });

        dialog.showModal();

        const start = async () => {

            if (!navigator.mediaDevices?.getUserMedia) {
                say("This browser can't use the camera here. Type the ISBN below instead.");
                return;
            }

            try {

                stream =
                    await navigator.mediaDevices.getUserMedia({
                        audio: false,
                        video: {
                            facingMode: { ideal: "environment" },
                            width: { ideal: 1280 },
                            height: { ideal: 720 }
                        }
                    });

            }

            catch (error) {

                console.error(error);

                say(error?.name === "NotAllowedError"
                    ? "Novellow wasn't allowed to use the camera. You can allow it in your browser's settings, or type the ISBN below."
                    : "The camera couldn't be started. Type the ISBN below instead.");

                return;

            }

            if (done) {
                stream.getTracks().forEach((track) => track.stop());
                return;
            }

            video.srcObject = stream;

            try {
                await video.play();
            }

            catch {
                // Autoplay is allowed for a muted camera preview.
            }

            let read;

            try {
                read = (await nativeReader()) || (await zxingReader());
            }

            catch (error) {
                console.error(error);
                say("The barcode reader couldn't start. Type the ISBN below instead.");
                return;
            }

            say("Hold the barcode on the back of the book inside the frame.");

            let misses = 0;

            const tick = async () => {

                if (done) {
                    return;
                }

                try {

                    const codes =
                        video.readyState >= 2 ? await read(video) : [];

                    const isbn =
                        codes.map(cleanIsbn).find(Boolean);

                    if (isbn) {
                        navigator.vibrate?.(60);
                        finish(isbn);
                        return;
                    }

                    // A barcode that isn't a book's (a price code).
                    if (codes.length && ++misses > 4) {
                        say("That barcode isn't the book's ISBN. Look for the one that starts with 978 or 979.");
                    }

                }

                catch (error) {
                    console.error(error);
                }

                timer = window.setTimeout(tick, 180);

            };

            tick();

        };

        start();

    });

}
