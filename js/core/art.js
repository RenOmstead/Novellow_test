/* =========================================================
   NOVELLOW
   ILLUSTRATIONS

   Loads the drawings (assets/illustrations/sprite-core.svg,
   and sprite.svg on pages with the room) once and places them
   in the page, so every <use href="#…"> can find its drawing.
========================================================= */

let spritePromise = null;


// Pages showing the room (<html data-art="room">) also load its
// furniture and decorations; the others only need the icons and
// small drawings, which keeps them light.
function fetchSprite(file) {

    return fetch(`assets/illustrations/${file}?v=__VERSION__`)
        .then((response) => {

            if (!response.ok) {
                throw new Error(`Sprite request failed: ${response.status}`);
            }

            return response.text();

        })
        .then((markup) => {

            const holder =
                document.createElement("div");

            holder.className = "art-sprite";
            holder.setAttribute("aria-hidden", "true");
            holder.innerHTML = markup;

            document.body.prepend(holder);

        });

}


export function loadSprite() {

    if (spritePromise) {
        return spritePromise;
    }

    const files =
        document.documentElement.dataset.art === "room"
            ? ["sprite-core.svg", "sprite.svg"]
            : ["sprite-core.svg"];

    spritePromise =
        Promise.all(files.map(fetchSprite))
            .catch((error) => {

                // The app still works without drawings; log for debugging.
                console.error("Novellow illustrations could not load.", error);

            });

    return spritePromise;

}
