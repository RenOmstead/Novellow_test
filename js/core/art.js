/* =========================================================
   NOVELLOW
   ILLUSTRATIONS

   Loads assets/illustrations/sprite.svg once and places it
   in the page, so every <use href="#…"> can find its drawing.
========================================================= */

let spritePromise = null;


export function loadSprite() {

    if (spritePromise) {
        return spritePromise;
    }

    spritePromise =
        fetch("assets/illustrations/sprite.svg?v=__VERSION__")
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

            })
            .catch((error) => {

                // The app still works without drawings; log for debugging.
                console.error("Novellow illustrations could not load.", error);

            });

    return spritePromise;

}
