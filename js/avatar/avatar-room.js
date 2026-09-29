/* =========================================================
   NOVELLOW
   A READER IN THEIR ARMCHAIR

   Seats a reader's avatar in the room's armchair (the cozy
   and café corners; the haunted room has no armchair), with a
   book and a blanket. Visitors always find the owner there;
   at home, only if they've chosen to sit in it.
========================================================= */

import { avatarSeated } from "./avatar.js?v=__VERSION__";


export function sitReader(room, avatar, { seed = "reader", show = true, label = "" } = {}) {

    if (!room) {
        return;
    }

    room
        .querySelectorAll(".chair-reader")
        .forEach((node) => node.remove());

    if (!show) {
        return;
    }

    room
        .querySelectorAll(".corner-scene--armchair, .corner-scene--cafe")
        .forEach((scene) => {

            const seat =
                document.createElement("div");

            seat.className = "chair-reader";
            seat.innerHTML = avatarSeated(avatar, { seed, label });

            scene.querySelector(".armchair")?.after(seat);

        });

}
