/* =========================================================
   NOVELLOW
   MAKING YOUR AVATAR

   A dialog with the avatar drawn large on one side and every
   choice on the other, redrawn as you go. Saves to your
   profile (profiles.avatar).
========================================================= */

import { getProfile, updateProfile } from "../core/store.js?v=__VERSION__";
import { html, raw, render } from "../core/helpers.js?v=__VERSION__";
import { art, toast, toastError, withBusy } from "../core/ui.js?v=__VERSION__";
import { AVATAR_PARTS, AVATAR_TOUCHES, normalizeAvatar, avatarPortrait, avatarSeated } from "./avatar.js?v=__VERSION__";


// These choices show as little portraits, the rest as words
// or colour swatches.
const PICTURED = ["hair", "top", "extra", "glasses", "eyes", "facialHair"];


function optionMarkup(part, option, avatar, seed) {

    const chosen =
        avatar[part.key] === option.id;

    const attributes =
        `type="button" data-part="${part.key}" data-value="${option.id}" aria-pressed="${chosen}" title="${option.label}"`;

    if (part.swatch) {
        return html`<button class="avatar-swatch ${chosen ? "is-chosen" : ""}" ${raw(attributes)} style="--swatch: ${option.color}"><span class="visually-hidden">${option.label}</span></button>`;
    }

    if (PICTURED.includes(part.key)) {
        return html`
            <button class="avatar-choice avatar-choice--pictured ${chosen ? "is-chosen" : ""}" ${raw(attributes)}>
                ${raw(avatarPortrait({ ...avatar, [part.key]: option.id }, { seed }))}
                <span>${option.label}</span>
            </button>
        `;
    }

    return html`<button class="avatar-choice ${chosen ? "is-chosen" : ""}" ${raw(attributes)}>${option.label}</button>`;

}


function makerMarkup(avatar, seed, openPart) {

    return html`
        <div class="avatar-maker">

            <button class="dialog-close" type="button" data-close aria-label="Close without saving">
                ${art("ui-close", "dialog-close__art")}
            </button>

            <div class="avatar-maker__preview">
                <p class="dialog-eyebrow">Your reader</p>
                <h2 class="dialog-title">Make your avatar</h2>
                <div class="avatar-maker__portrait">${raw(avatarPortrait(avatar, { seed }))}</div>
                <div class="avatar-maker__seated">${raw(avatarSeated(avatar, { seed }))}</div>
                <p class="muted">This is how you'll look on your reader card, in book clubs, and curled up in your armchair when someone visits your room.</p>
                <button class="button button--ghost button--small" type="button" data-surprise>${art("ui-sparkle")} Surprise me</button>
            </div>

            <div class="avatar-maker__choices">

                ${AVATAR_PARTS.map((part) => html`
                    <details class="avatar-part" data-key="${part.key}" ${part.key === openPart ? "open" : ""}>
                        <summary>
                            <span>${part.label}</span>
                            <span class="avatar-part__current">${part.options.find((option) => option.id === avatar[part.key])?.label || ""}</span>
                        </summary>
                        <div class="avatar-part__options ${part.swatch ? "avatar-part__options--swatches" : ""} ${PICTURED.includes(part.key) ? "avatar-part__options--pictured" : ""}">
                            ${part.options.map((option) => optionMarkup(part, option, avatar, seed))}
                        </div>
                    </details>
                `)}

                <div class="avatar-touches">
                    ${AVATAR_TOUCHES.map((touch) => html`
                        <label class="check-line">
                            <input type="checkbox" data-touch="${touch.key}" ${avatar[touch.key] ? "checked" : ""}>
                            <span>${touch.label}</span>
                        </label>
                    `)}
                    <label class="check-line">
                        <input type="checkbox" data-touch="inChair" ${avatar.inChair ? "checked" : ""}>
                        <span>Sit in the armchair of my own room, too</span>
                    </label>
                </div>

                <div class="dialog-actions">
                    <button class="button button--ghost" type="button" data-close>Cancel</button>
                    <button class="button button--primary" type="button" data-save>Save my avatar</button>
                </div>

            </div>

        </div>
    `;

}


export function openAvatarMaker() {

    const profile =
        getProfile();

    const seed =
        profile?.id || "reader";

    let avatar =
        normalizeAvatar(profile?.avatar, seed);

    let openPart = "hair";

    const dialog =
        document.createElement("dialog");

    dialog.className = "parchment-dialog avatar-dialog";

    document.body.appendChild(dialog);

    const draw = () => {

        // Keep the choices scrolled where they were.
        const scroller =
            dialog.querySelector(".avatar-maker__choices");

        const scrollTop =
            scroller?.scrollTop || 0;

        render(dialog, makerMarkup(avatar, seed, openPart));

        const next =
            dialog.querySelector(".avatar-maker__choices");

        if (next) {
            next.scrollTop = scrollTop;
        }

    };

    draw();

    return new Promise((resolve) => {

        let saved = null;

        dialog.addEventListener("close", () => {
            resolve(saved);
            window.setTimeout(() => dialog.remove(), 50);
        });

        dialog.addEventListener("toggle", (event) => {
            if (event.target.matches?.("details[open]")) {
                openPart = event.target.dataset.key;
            }
        }, true);

        dialog.addEventListener("click", async (event) => {

            if (event.target === dialog || event.target.closest("[data-close]")) {
                dialog.close();
                return;
            }

            const choice =
                event.target.closest("[data-part]");

            if (choice) {
                avatar = { ...avatar, [choice.dataset.part]: choice.dataset.value };
                openPart = choice.dataset.part;
                draw();
                return;
            }

            if (event.target.closest("[data-surprise]")) {

                const random = (list) => list[Math.floor(Math.random() * list.length)].id;

                const surprise = {};

                AVATAR_PARTS.forEach(({ key, options }) => {
                    surprise[key] = random(options);
                });

                // Not everyone needs a beard, glasses and a hat at once.
                surprise.facialHair = Math.random() < 0.8 ? "none" : surprise.facialHair;
                surprise.glasses = Math.random() < 0.6 ? "none" : surprise.glasses;
                surprise.extra = Math.random() < 0.5 ? "none" : surprise.extra;

                avatar = normalizeAvatar({ ...avatar, ...surprise, blush: Math.random() < 0.6, freckles: Math.random() < 0.3 }, seed);

                draw();

                return;

            }

            const save =
                event.target.closest("[data-save]");

            if (save) {

                await withBusy(save, "Saving…", async () => {

                    try {
                        await updateProfile({ avatar });
                        saved = avatar;
                        toast("Your avatar is saved.", { tone: "success" });
                        dialog.close();
                    }

                    catch (error) {
                        toastError(error, "Your avatar couldn't be saved just now.");
                    }

                });

            }

        });

        dialog.addEventListener("change", (event) => {

            const touch =
                event.target.closest("[data-touch]");

            if (touch) {
                avatar = { ...avatar, [touch.dataset.touch]: touch.checked };
                draw();
            }

        });

        dialog.showModal();

    });

}
