/* =========================================================
   NOVELLOW
   A PICTURE OF THE ROOM

   Takes a picture of the bookcase and the room as they look,
   without any of the buttons around them, and hands it to the
   reader: the share sheet on a phone (Save Image, Instagram,
   Messages…), a download on a computer.
========================================================= */

import { toast } from "../core/ui.js?v=__VERSION__";


// Loaded only when a picture is taken.
const LIBRARY =
    "https://cdn.jsdelivr.net/npm/modern-screenshot@4.7.0/+esm";


// The longest side of the picture, in pixels.
const LONGEST = 2400;


let busy = false;


function download(file) {

    const link =
        document.createElement("a");

    link.href = URL.createObjectURL(file);
    link.download = file.name;

    document.body.append(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(link.href), 4000);

}


async function hand(file) {

    // Phones: the share sheet saves it to Photos or posts it.
    if (navigator.canShare?.({ files: [file] }) && matchMedia("(pointer: coarse)").matches) {

        try {
            await navigator.share({ files: [file], title: "My Novellow library" });
            return;
        }

        catch (error) {
            if (error.name === "AbortError") return;
        }

    }

    download(file);

}


export async function takeRoomPicture() {

    const room =
        document.querySelector(".library-room");

    if (!room || busy) {
        return;
    }

    busy = true;

    const root =
        document.documentElement;

    root.classList.add("is-capturing");

    toast("Taking a picture of your room…");

    try {

        const { domToBlob } =
            await import(LIBRARY);

        await document.fonts?.ready;

        // Let the buttons fade out and the room settle.
        await new Promise((resolve) => setTimeout(resolve, 250));

        const box =
            room.getBoundingClientRect();

        const scale =
            Math.min(3, LONGEST / Math.max(box.width, box.height));

        const blob =
            await domToBlob(room, {
                scale,
                type: "image/png",
                backgroundColor: getComputedStyle(document.body).backgroundColor,
                filter: (node) => !(node instanceof Element && node.matches(".piece-editor, .arrange-bar, .toast-region"))
            });

        const day =
            new Date().toISOString().slice(0, 10);

        await hand(new File([blob], `novellow-room-${day}.png`, { type: "image/png" }));

    }

    catch (error) {

        console.error("The room picture could not be taken.", error);

        toast("The picture couldn't be taken. Please try again.");

    }

    finally {

        root.classList.remove("is-capturing");

        busy = false;

    }

}
