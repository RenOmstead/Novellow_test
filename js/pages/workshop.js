/* =========================================================
   NOVELLOW
   THE WORKSHOP (workshop.html)

   Furniture and decor made by readers:
     Gallery        every approved piece; add any to your room
     Make a piece   the guidelines, then upload your own drawing
                    (approved by Novellow first) or recolour one
                    of Novellow's pieces (shared straight away)
     My creations   what you've shared, and how it's doing
     Review         the Novellow account's approval queue
========================================================= */

import { startApp } from "../shell/app-shell.js?v=__VERSION__";
import { supabase } from "../core/supabase.js?v=__VERSION__";
import { html, raw, render, formatDate, plural, debounce } from "../core/helpers.js?v=__VERSION__";
import { art, loader, emptyState, toast, toastError, confirmDialog, formDialog, withBusy } from "../core/ui.js?v=__VERSION__";
import { DECOR_ASSETS, FABRICS } from "../room/decorations.js?v=__VERSION__";

import {
    CATEGORIES,
    PLACES,
    SIZES,
    MIN_SIDE,
    loadGallery,
    loadMine,
    loadQueue,
    pictureUrl,
    preparePicture,
    shareUpload,
    shareRecolour,
    removePiece,
    reviewPiece,
    reportPiece,
    addToRoom
} from "../workshop/workshop-data.js?v=__VERSION__";


const content =
    document.getElementById("pageContent");

const TINTABLE =
    DECOR_ASSETS.filter((asset) => asset.tint);

let tab = "gallery";
let category = null;
let search = "";
let gallery = [];
let mine = [];
let queue = [];
let team = false;

// The upload form, between redraws.
let picture = null;

// The recolour being made.
let recolour = { base: TINTABLE[0]?.id, fabric: "emerald" };


/* =========================================================
   PICTURES OF A PIECE
========================================================= */

function fabricVars(id) {

    const fabric =
        FABRICS.find((item) => item.id === id);

    return fabric
        ? `--up: ${fabric.colours[0]}; --up-light: ${fabric.colours[1]}; --up-shade: ${fabric.colours[2]}`
        : "";

}


function pieceArt(item) {

    if (item.kind === "upload") {

        const url =
            pictureUrl(item.image_path);

        return url
            ? html`<img src="${url}" alt="" loading="lazy">`
            : html`<span class="muted">Picture unavailable</span>`;

    }

    const asset =
        DECOR_ASSETS.find((entry) => entry.id === item.base_asset);

    return asset
        ? html`<svg viewBox="${asset.box}" style="${fabricVars(item.fabric)}" aria-hidden="true"><use href="#${asset.id}"></use></svg>`
        : "";

}


function labelFor(list, id) {
    return list.find((item) => item.id === id)?.label || "";
}


/* =========================================================
   TABS
========================================================= */

function tabs() {

    const waiting =
        queue.length;

    const list = [
        ["gallery", "Gallery"],
        ["make", "Make a piece"],
        ["mine", "My creations"],
        ...(team ? [["review", waiting ? `Review (${waiting})` : "Review"]] : [])
    ];

    return html`
        <div class="workshop-tabs" role="tablist">
            ${list.map(([id, label]) => html`
                <button class="workshop-tab ${tab === id ? "is-on" : ""}" type="button" role="tab" aria-selected="${tab === id}" data-tab="${id}">${label}</button>
            `)}
        </div>
    `;

}


/* =========================================================
   GALLERY
========================================================= */

function galleryView() {

    return html`

        <div class="workshop-filters">
            <div class="chip-row" role="group" aria-label="Kinds of piece">
                <button class="note-filter ${category ? "" : "is-on"}" type="button" data-category="">Everything</button>
                ${CATEGORIES.map((item) => html`
                    <button class="note-filter ${category === item.id ? "is-on" : ""}" type="button" data-category="${item.id}">${item.label}</button>
                `)}
            </div>
            <label class="field workshop-search">
                <span class="visually-hidden">Search the Workshop</span>
                <input class="field__input" type="search" name="search" value="${search}" placeholder="Search by name…" autocomplete="off">
            </label>
        </div>

        ${gallery.length ? html`
            <ul class="workshop-grid">
                ${gallery.map((item) => html`
                    <li class="workshop-card paper">
                        <div class="workshop-card__art">${pieceArt(item)}</div>
                        <div class="workshop-card__body">
                            <h3>${item.name}</h3>
                            <p class="workshop-card__meta">
                                ${item.maker_username ? html`by <a href="visit.html?u=${item.maker_username}">@${item.maker_username}</a>` : `by ${item.maker_name}`}
                                · ${item.kind === "recolour" ? "Recoloured" : "Hand drawn"}
                                ${item.added_count ? html` · in ${plural(item.added_count, "room")}` : ""}
                            </p>
                            ${item.description ? html`<p class="workshop-card__text">${item.description}</p>` : ""}
                        </div>
                        <div class="workshop-card__actions">
                            <button class="button button--brass button--small" type="button" data-add="${item.id}">${art("ui-add")} Add to my room</button>
                            <button class="text-button" type="button" data-report="${item.id}">Report</button>
                            ${team ? html`<button class="text-button" type="button" data-take-down="${item.id}">Take down</button>` : ""}
                        </div>
                    </li>
                `)}
            </ul>
        ` : emptyState({
            symbol: "art-workshop",
            title: category || search ? "Nothing here yet" : "The Workshop is waiting for its first piece",
            text: "Make something for your room and share it: it might be the first thing here.",
            actionLabel: "Make a piece",
            action: "go-make"
        })}

    `;

}


/* =========================================================
   MAKE A PIECE: GUIDELINES, UPLOAD, RECOLOUR
========================================================= */

function guidelines() {

    return html`
        <section class="workshop-guide paper" aria-labelledby="guideTitle">

            <p class="eyebrow">Before you start</p>
            <h2 id="guideTitle" class="about-card__title">Workshop guidelines</h2>

            <div class="workshop-guide__columns">

                <div>
                    <h3>What you can share</h3>
                    <ul class="workshop-list workshop-list--yes">
                        <li>Furniture, lamps, plants, pictures, tabletop treasures and cozy or witchy decor for a reading room.</li>
                        <li>Drawings you made yourself: by hand and scanned, in a drawing app, or as pixel art.</li>
                        <li>Spooky is welcome, if it's the cozy, cat-and-candle kind.</li>
                    </ul>
                </div>

                <div>
                    <h3>What you can't share</h3>
                    <ul class="workshop-list workshop-list--no">
                        <li>Anything you didn't make or don't have permission to share: no traced or copied art, and nothing taken from games, films, shops or other apps.</li>
                        <li>Brand logos, famous characters or anyone else's artwork.</li>
                        <li>Photos of people, or anything showing a real person, their name or where they live.</li>
                        <li>Words, usernames, links or contact details on the piece.</li>
                        <li>Anything violent, sexual, hateful or unkind, or not right for readers aged 13 and up.</li>
                    </ul>
                </div>

            </div>

            <h3>Preparing your picture</h3>
            <ol class="workshop-steps">
                <li><strong>One piece per picture,</strong> drawn from the front or a little from the side, like the room's own furniture.</li>
                <li><strong>A see-through background.</strong> Save it as a PNG (or WebP) with transparency; otherwise it shows as a rectangle in the room.</li>
                <li><strong>A good size:</strong> at least ${MIN_SIDE} pixels on its longest side, and a file under 5 MB.</li>
                <li><strong>Don't worry about empty space</strong> around the drawing: Novellow trims it for you.</li>
                <li><strong>Match the room:</strong> soft colours, dark outlines and gentle shading look most at home.</li>
            </ol>

            <h3>What happens next</h3>
            <ol class="workshop-steps">
                <li>You upload your picture and tell us what it is and where it goes.</li>
                <li>Novellow looks at it, usually within a few days. Until then, only you can see it (in My creations).</li>
                <li>Once it's approved, it's in the Gallery for everyone, and anyone can add it to their room.</li>
                <li>If it isn't approved, My creations tells you why, so you can fix it and share it again.</li>
            </ol>

            <p class="workshop-guide__small">
                By sharing a piece, you let other readers place it in their rooms and let Novellow show it in the
                Workshop. It stays yours: delete it any time from My creations, and it leaves the Gallery and every
                room it was in. See the <a href="terms.html#workshop">Terms of Use</a>.
            </p>

        </section>
    `;

}


function uploadForm() {

    return html`
        <section class="workshop-make paper" aria-labelledby="uploadTitle">

            <p class="eyebrow">Your own drawing</p>
            <h2 id="uploadTitle" class="about-card__title">Upload a piece</h2>

            <form class="workshop-form" id="uploadForm" novalidate>

                <div class="workshop-upload">
                    <label class="workshop-drop ${picture ? "has-picture" : ""}">
                        <input type="file" name="file" accept="image/png,image/webp">
                        ${picture ? html`
                            <img src="${picture.previewUrl}" alt="Your picture">
                            <span class="workshop-drop__hint">Tap to choose a different picture</span>
                        ` : html`
                            ${art("ui-upload", "workshop-drop__art")}
                            <strong>Choose a picture</strong>
                            <span class="workshop-drop__hint">PNG or WebP with a see-through background, under 5 MB</span>
                        `}
                    </label>
                    ${picture && !picture.transparent ? html`
                        <p class="workshop-warning">This picture doesn't seem to have a see-through background, so it will show as a rectangle in rooms.</p>
                    ` : ""}
                </div>

                <label class="field">
                    <span class="field__label">Name</span>
                    <input class="field__input" name="name" maxlength="60" required placeholder="Moonlit reading lamp">
                </label>

                <div class="workshop-form__row">
                    <label class="field">
                        <span class="field__label">What kind of piece</span>
                        <select class="field__input" name="category">
                            ${CATEGORIES.map((item) => html`<option value="${item.id}">${item.label}</option>`)}
                        </select>
                    </label>
                    <label class="field">
                        <span class="field__label">Where it goes</span>
                        <select class="field__input" name="room_area">
                            ${PLACES.map((item) => html`<option value="${item.id}">${item.label}</option>`)}
                        </select>
                    </label>
                </div>

                <label class="field">
                    <span class="field__label">How big it is in a room</span>
                    <select class="field__input" name="size">
                        ${SIZES.map((item) => html`<option value="${item.id}" ${item.id === "medium" ? "selected" : ""}>${item.label}</option>`)}
                    </select>
                </label>

                <label class="field">
                    <span class="field__label">A few words about it (optional)</span>
                    <textarea class="field__input" name="description" rows="2" maxlength="300"></textarea>
                </label>

                <label class="check-line">
                    <input type="checkbox" name="mine" required>
                    <span>I made this myself, or I have permission to share it.</span>
                </label>

                <label class="check-line">
                    <input type="checkbox" name="rules" required>
                    <span>It follows the Workshop guidelines above.</span>
                </label>

                <button class="button button--brass" type="submit">${art("ui-upload")} Send for approval</button>

            </form>

        </section>
    `;

}


function recolourForm() {

    const base =
        TINTABLE.find((asset) => asset.id === recolour.base) || TINTABLE[0];

    return html`
        <section class="workshop-make paper" aria-labelledby="recolourTitle">

            <p class="eyebrow">No drawing needed</p>
            <h2 id="recolourTitle" class="about-card__title">Recolour a piece</h2>
            <p class="muted">Choose one of Novellow's pieces and a fabric, name it, and share it. Recolours go straight into the Gallery.</p>

            <div class="workshop-recolour">

                <div class="workshop-recolour__preview">
                    ${base ? html`<svg viewBox="${base.box}" style="${fabricVars(recolour.fabric)}" aria-hidden="true"><use href="#${base.id}"></use></svg>` : ""}
                </div>

                <form class="workshop-form" id="recolourForm" novalidate>

                    <label class="field">
                        <span class="field__label">Piece</span>
                        <select class="field__input" name="base" data-recolour="base">
                            ${TINTABLE.map((asset) => html`<option value="${asset.id}" ${asset.id === base?.id ? "selected" : ""}>${asset.name}</option>`)}
                        </select>
                    </label>

                    <div class="field">
                        <span class="field__label">Fabric</span>
                        <div class="workshop-fabrics">
                            ${FABRICS.map((fabric) => html`
                                <button class="avatar-swatch ${recolour.fabric === fabric.id ? "is-chosen" : ""}" type="button" data-fabric="${fabric.id}" title="${fabric.name}" style="--swatch: ${fabric.colours[0]}"><span class="visually-hidden">${fabric.name}</span></button>
                            `)}
                        </div>
                    </div>

                    <label class="field">
                        <span class="field__label">Name</span>
                        <input class="field__input" name="name" maxlength="60" required placeholder="${FABRICS.find((fabric) => fabric.id === recolour.fabric)?.name || ""} ${base?.name.toLowerCase() || ""}">
                    </label>

                    <button class="button button--brass" type="submit">${art("ui-sparkle")} Share it</button>

                </form>

            </div>

        </section>
    `;

}


function makeView() {

    return html`
        ${guidelines()}
        <div class="workshop-make-grid">
            ${uploadForm()}
            ${recolourForm()}
        </div>
    `;

}


/* =========================================================
   MY CREATIONS, AND THE REVIEW QUEUE
========================================================= */

const STATUS = {
    pending: "Waiting for approval",
    approved: "In the Gallery",
    declined: "Not approved"
};

function mineView() {

    if (!mine.length) {
        return emptyState({
            symbol: "art-workshop",
            title: "Nothing shared yet",
            text: "Pieces you upload or recolour appear here, with how they're doing.",
            actionLabel: "Make a piece",
            action: "go-make"
        });
    }

    return html`
        <ul class="workshop-grid">
            ${mine.map((item) => html`
                <li class="workshop-card paper">
                    <div class="workshop-card__art">${pieceArt(item)}</div>
                    <div class="workshop-card__body">
                        <h3>${item.name}</h3>
                        <p class="workshop-card__meta">
                            <span class="note-status note-status--${item.status === "approved" ? "done" : item.status === "declined" ? "not_planned" : "new"}">${STATUS[item.status]}</span>
                            ${item.added_count ? html` · in ${plural(item.added_count, "room")}` : ""}
                        </p>
                        ${item.review_note ? html`
                            <div class="note-reply">
                                <p class="note-reply__from">Novellow says</p>
                                <p>${item.review_note}</p>
                            </div>
                        ` : ""}
                    </div>
                    <div class="workshop-card__actions">
                        ${item.status === "approved" ? html`<button class="button button--brass button--small" type="button" data-add="${item.id}">${art("ui-add")} Add to my room</button>` : ""}
                        <button class="text-button" type="button" data-remove="${item.id}">Delete</button>
                    </div>
                </li>
            `)}
        </ul>
    `;

}


function reviewView() {

    if (!queue.length) {
        return emptyState({
            symbol: "art-workshop",
            title: "Nothing waiting",
            text: "New uploads appear here for you to approve or decline."
        });
    }

    return html`
        <ul class="workshop-review">
            ${queue.map((item) => html`
                <li class="workshop-review__item paper">
                    <div class="workshop-card__art workshop-card__art--large">${pieceArt({ ...item, kind: "upload" })}</div>
                    <div class="workshop-card__body">
                        <h3>${item.name}</h3>
                        <p class="workshop-card__meta">
                            by ${item.maker_name}${item.maker_username ? ` (@${item.maker_username})` : ""} · ${formatDate(item.created_at)}
                            · ${labelFor(CATEGORIES, item.category)} · ${labelFor(PLACES, item.room_area).toLowerCase()} · ${item.width}px wide
                        </p>
                        ${item.description ? html`<p class="workshop-card__text">${item.description}</p>` : ""}
                        <form class="workshop-form" data-review="${item.id}" novalidate>
                            <label class="field">
                                <span class="field__label">A note for them (needed if you decline)</span>
                                <textarea class="field__input" name="note" rows="2" maxlength="500" placeholder="Lovely work! / This looks traced from another app, so we can't share it."></textarea>
                            </label>
                            <div class="workshop-card__actions">
                                <button class="button button--brass button--small" type="submit" name="decision" value="approve">Approve</button>
                                <button class="button button--ghost button--small" type="submit" name="decision" value="decline">Decline</button>
                            </div>
                        </form>
                    </div>
                </li>
            `)}
        </ul>
    `;

}


/* =========================================================
   RENDER
========================================================= */

function renderPage() {

    const views = {
        gallery: galleryView,
        make: makeView,
        mine: mineView,
        review: reviewView
    };

    render(content, html`

        <div class="page-heading">
            <div>
                <h1 class="page-heading__title">Workshop</h1>
                <p class="page-heading__subtitle">Furniture and decor made by readers. Add any piece to your room, or make your own.</p>
            </div>
        </div>

        ${tabs()}

        <div class="workshop-view">${(views[tab] || galleryView)()}</div>

    `);

}


async function refresh(which = tab) {

    try {

        if (which === "gallery") {
            gallery = await loadGallery({ category, search });
        }

        if (which === "mine") {
            mine = await loadMine();
        }

        if (team) {
            queue = await loadQueue();
        }

    }

    catch (error) {
        toastError(error);
    }

    renderPage();

}


/* =========================================================
   START
========================================================= */

async function start() {

    await startApp({ page: "workshop", eyebrow: "Workshop" });

    render(content, loader("Opening the workshop…"));

    const { data } =
        await supabase.rpc("is_novellow_team");

    team = data === true;

    await refresh("gallery");

    content.addEventListener("click", async (event) => {

        const target =
            event.target.closest("button, a");

        if (!target) {
            return;
        }

        const pieceFrom = (id) =>
            gallery.find((item) => item.id === id) || mine.find((item) => item.id === id);

        try {

            if (target.dataset.tab) {
                tab = target.dataset.tab;
                renderPage();
                await refresh(tab);
                return;
            }

            if (target.dataset.action === "go-make") {
                tab = "make";
                renderPage();
                return;
            }

            if (target.dataset.category !== undefined) {
                category = target.dataset.category || null;
                await refresh("gallery");
                return;
            }

            if (target.dataset.fabric) {
                recolour = { ...recolour, fabric: target.dataset.fabric };
                keepTyping(() => renderPage());
                return;
            }

            if (target.dataset.add) {

                await withBusy(target, "Adding…", async () => {
                    await addToRoom(pieceFrom(target.dataset.add));
                });

                toast("Added to your room. Open Arrange the room at home to move it.", { tone: "success", timeout: 6000 });

                return;

            }

            if (target.dataset.remove) {

                const item =
                    pieceFrom(target.dataset.remove);

                const sure =
                    await confirmDialog({
                        title: `Delete “${item.name}”?`,
                        message: "It leaves the Gallery, and any room it was in.",
                        confirmLabel: "Delete",
                        tone: "danger"
                    });

                if (sure) {
                    await removePiece(item);
                    toast("Deleted.");
                    await refresh("mine");
                }

                return;

            }

            if (target.dataset.takeDown) {

                const item =
                    pieceFrom(target.dataset.takeDown);

                const sure =
                    await confirmDialog({
                        title: `Take down “${item.name}”?`,
                        message: "It leaves the Gallery and every room it was in, for good.",
                        confirmLabel: "Take it down",
                        tone: "danger"
                    });

                if (sure) {
                    await removePiece(item);
                    toast("Taken down.");
                    await refresh("gallery");
                }

                return;

            }

            if (target.dataset.report) {

                const item =
                    pieceFrom(target.dataset.report);

                const sent =
                    await formDialog({
                        eyebrow: "Workshop",
                        title: `Report “${item.name}”`,
                        submitLabel: "Send report",
                        body: html`
                            <p>Tell Novellow what's wrong: copied from someone else, unkind, or not right for everyone. Only Novellow sees reports.</p>
                            <label class="field">
                                <span class="field__label">What's the problem?</span>
                                <textarea class="field__input" name="message" rows="4" maxlength="1500" required></textarea>
                            </label>
                        `,
                        onSubmit: async (values) => {

                            const message =
                                String(values.get("message") || "").trim();

                            if (!message) {
                                throw Object.assign(new Error("empty"), { userMessage: "Write a few words about the problem." });
                            }

                            await reportPiece(item, message);

                            return true;

                        }
                    });

                if (sent) {
                    toast("Thank you. Novellow will look at it.", { tone: "success" });
                }

            }

        }

        catch (error) {
            toastError(error);
        }

    });

    content.addEventListener("input", debounce(async (event) => {

        if (event.target.name === "search" && tab === "gallery") {
            search = event.target.value.trim();
            await refresh("gallery");
            content.querySelector("input[name=search]")?.focus();
        }

    }, 350));

    content.addEventListener("change", async (event) => {

        if (event.target.dataset.recolour === "base") {
            recolour = { ...recolour, base: event.target.value };
            keepTyping(() => renderPage());
            return;
        }

        if (event.target.name === "file" && event.target.files?.[0]) {

            try {

                if (picture?.previewUrl) {
                    URL.revokeObjectURL(picture.previewUrl);
                }

                picture = await preparePicture(event.target.files[0]);

            }

            catch (error) {
                picture = null;
                toastError(error);
            }

            keepTyping(() => renderPage());

        }

    });

    content.addEventListener("submit", async (event) => {

        event.preventDefault();

        const form =
            event.target;

        const button =
            event.submitter || form.querySelector("[type=submit]");

        try {

            if (form.id === "uploadForm") {

                if (!picture) {
                    throw Object.assign(new Error("picture"), { userMessage: "Choose a picture first." });
                }

                const name =
                    form.elements.name.value.trim();

                if (!name) {
                    form.elements.name.focus();
                    throw Object.assign(new Error("name"), { userMessage: "Give your piece a name." });
                }

                if (!form.elements.mine.checked || !form.elements.rules.checked) {
                    throw Object.assign(new Error("promise"), { userMessage: "Please tick both boxes: that it's yours to share, and that it follows the guidelines." });
                }

                await withBusy(button, "Sending…", () => shareUpload({
                    picture,
                    name,
                    description: form.elements.description.value.trim(),
                    category: form.elements.category.value,
                    room_area: form.elements.room_area.value,
                    size: form.elements.size.value
                }));

                picture = null;

                toast("Sent! Novellow will look at it soon. You'll see how it's doing in My creations.", { tone: "success", timeout: 7000 });

                tab = "mine";

                await refresh("mine");

                return;

            }

            if (form.id === "recolourForm") {

                const base =
                    TINTABLE.find((asset) => asset.id === recolour.base);

                const name =
                    form.elements.name.value.trim() || form.elements.name.placeholder.trim();

                await withBusy(button, "Sharing…", () => shareRecolour({
                    name: name.charAt(0).toUpperCase() + name.slice(1),
                    category: base?.group === "lighting" ? "lighting" : "furniture",
                    room_area: "floor",
                    base_asset: recolour.base,
                    fabric: recolour.fabric
                }));

                toast("Shared! It's in the Gallery now.", { tone: "success" });

                tab = "gallery";

                await refresh("gallery");

                return;

            }

            if (form.dataset.review) {

                const approve =
                    button?.value === "approve";

                const note =
                    form.elements.note.value.trim();

                if (!approve && !note) {
                    form.elements.note.focus();
                    throw Object.assign(new Error("note"), { userMessage: "Add a short note so they know why." });
                }

                const item =
                    queue.find((entry) => entry.id === form.dataset.review);

                await withBusy(button, approve ? "Approving…" : "Declining…", () => reviewPiece(item, approve, note));

                toast(approve ? "Approved: it's in the Gallery." : "Declined, with your note.", { tone: "success" });

                await refresh("review");

            }

        }

        catch (error) {
            toastError(error);
        }

    });

}


// Redraw the page without losing what's typed in the forms.
function keepTyping(draw) {

    const saved = {};

    content.querySelectorAll("form input:not([type=file]), form select, form textarea").forEach((field) => {
        const key = `${field.form?.id}:${field.name}`;
        saved[key] = field.type === "checkbox" ? field.checked : field.value;
    });

    draw();

    content.querySelectorAll("form input:not([type=file]), form select, form textarea").forEach((field) => {

        const key = `${field.form?.id}:${field.name}`;

        if (!(key in saved) || field.dataset.recolour) {
            return;
        }

        if (field.type === "checkbox") {
            field.checked = saved[key];
        }

        else {
            field.value = saved[key];
        }

    });

}


start().catch((error) => console.error(error));
