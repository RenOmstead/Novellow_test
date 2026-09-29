/* =========================================================
   NOVELLOW
   VISITING SOMEONE ELSE'S LIBRARY

   On visit.html the room, shelves and books belong to the
   reader being visited. Nothing there may be edited or
   dragged, and nothing about their room is remembered in the
   visitor's browser (so it never replaces the visitor's own
   room on their next visit home).
========================================================= */

let visiting = false;


export function setVisiting(on) {

    visiting = Boolean(on);

    document.documentElement.classList.toggle("is-visiting", visiting);

}


export function isVisiting() {
    return visiting;
}
