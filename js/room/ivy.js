/* =========================================================
   NOVELLOW
   IVY

   Grows leaves along every <path class="ivy-stem"> inside an
   <svg class="ivy">, so vines look hand-placed but stay light
   in the markup.

   Options on the <svg>:
     data-seed       stable randomness (same vine every visit)
     data-density    distance between leaves
     data-leaf-size  overall leaf scale
     data-palette    "ivy", "autumn" or "forest"; without
                     it the vine follows the room theme
                     (html[data-ivy], set by applyAppearance)
========================================================= */

import { seededRandom } from "../core/helpers.js?v=__VERSION__";


const SVG_NS =
    "http://www.w3.org/2000/svg";

const LEAF =
    "M0 0C-2-2-6-2-8-4C-6-6-7-9-9-11C-5-11-3-10-2-9C-2-12-1-15 0-17C1-15 2-12 2-9C3-10 5-11 9-11C7-9 6-6 8-4C6-2 2-2 0 0Z";

const VEINS =
    "M0 0V-14M0-5L-6-9M0-5L6-9";

const PALETTES = {

    ivy: {
        leaves: ["#3e5a36", "#4f6b3c", "#5f7d45", "#6f8b4e", "#7f9c56"],
        outline: "#22301c",
        vein: "#a9bf7a",
        stem: "#4a5a2c"
    },

    autumn: {
        leaves: ["#8e2f2a", "#a8453a", "#c0643f", "#b8553d", "#7a2a2e", "#d08a4a"],
        outline: "#3a140f",
        vein: "#f0b58a",
        stem: "#5a3a22"
    },

    forest: {
        leaves: ["#2f4a2c", "#3e5a36", "#4b6b3a", "#5a7a40", "#6b8c48"],
        outline: "#172414",
        vein: "#9fb877",
        stem: "#3a4a24"
    }

};


export function growIvy(root = document) {

    root
        .querySelectorAll("svg.ivy:not([data-grown])")
        .forEach(growVine);

}


/*
    Re-grows the vines that follow the theme, after the room
    theme changes. Same seed, so the same vine in new leaves.
*/

export function recolorIvy(root = document) {

    root
        .querySelectorAll("svg.ivy[data-grown]:not([data-palette])")
        .forEach((ivy) => {

            ivy.querySelector(":scope > .ivy-leaves")?.remove();

            delete ivy.dataset.grown;

            growVine(ivy);

        });

}


function growVine(ivy) {

    const palette =
        PALETTES[ivy.dataset.palette]
        || PALETTES[document.documentElement.dataset.ivy]
        || PALETTES.ivy;

    const random =
        seededRandom(ivy.dataset.seed || "7");

    const spacing =
        Number(ivy.dataset.density) || 16;

    const leafSize =
        Number(ivy.dataset.leafSize) || 0.72;

    const leaves =
        document.createElementNS(SVG_NS, "g");

    ivy
        .querySelectorAll(".ivy-stem")
        .forEach((stem) => {

            stem.setAttribute("stroke", palette.stem);

            const length =
                stem.getTotalLength();

            let side = 1;

            for (
                let distance = 4;
                distance < length - 2;
                distance += spacing * (0.75 + random() * 0.5)
            ) {

                const point =
                    stem.getPointAtLength(distance);

                const ahead =
                    stem.getPointAtLength(Math.min(length, distance + 1));

                const heading =
                    Math.atan2(ahead.y - point.y, ahead.x - point.x) * 180 / Math.PI;

                const angle =
                    heading + side * (55 + random() * 45);

                const scale =
                    leafSize * (0.7 + random() * 0.55);

                const color =
                    palette.leaves[Math.floor(random() * palette.leaves.length)];

                const leaf =
                    document.createElementNS(SVG_NS, "g");

                leaf.setAttribute(
                    "transform",
                    `translate(${point.x.toFixed(1)} ${point.y.toFixed(1)}) rotate(${(angle + 90).toFixed(1)}) scale(${scale.toFixed(2)})`
                );

                leaf.innerHTML =
                    `<path d="M0 0V-3" stroke="${palette.stem}" stroke-width="1.4" />` +
                    `<path d="${LEAF}" transform="translate(0 -2)" fill="${color}" stroke="${palette.outline}" stroke-width="0.9" stroke-linejoin="round" />` +
                    `<path d="${VEINS}" transform="translate(0 -2)" fill="none" stroke="${palette.vein}" stroke-width="0.6" stroke-opacity="0.55" />`;

                leaves.appendChild(leaf);

                side *= -1;

            }

        });

    leaves.setAttribute("class", "ivy-leaves");

    ivy.appendChild(leaves);

    ivy.dataset.grown = "true";

}
