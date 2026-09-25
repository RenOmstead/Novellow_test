/* =========================================================
   NOVELLOW
   SETTINGS (settings.html)

   Account, reading preferences, the look of the room, and
   the reader's data (export, import, clear). Appearance and
   reading choices save as soon as they change.
========================================================= */

import { startApp } from "../shell/app-shell.js?v=__VERSION__";
import { THEMES, applyAppearance } from "../shell/themes.js?v=__VERSION__";
import { updatePassword, signOut } from "../core/auth.js?v=__VERSION__";

import {
    events,
    getProfile,
    updateProfile,
    getSettings,
    updateSettings,
    listSignIns,
    loadLibrary,
    getBooks,
    getShelves,
    clearLibrary
} from "../core/store.js?v=__VERSION__";

import { html, render, formatDateTime, intOrNull, plural } from "../core/helpers.js?v=__VERSION__";
import { art, loader, toast, toastError, confirmDialog, formDialog, withBusy } from "../core/ui.js?v=__VERSION__";
import { NovellowError } from "../core/errors.js?v=__VERSION__";
import { SHELF_SORTS } from "../config.js?v=__VERSION__";
import { exportLibrary, checkImport, importLibrary } from "../data/transfer.js?v=__VERSION__";
import { mountMixer } from "../sound/mixer.js?v=__VERSION__";
import { CATS, GHOST_CHOICES, CURTAINS, RUGS, MUGS, CHINA_COLOURS, TEASETS, getPreferences, setPreference } from "../shell/preferences.js?v=__VERSION__";


const content =
    document.getElementById("pageContent");

let email = "";

const METHODS = {
    password: "Password",
    sign_up: "New account",
    email_link: "Email link"
};

const DENSITIES = [
    { id: "sparse", label: "Sparse: just a few pieces" },
    { id: "cozy", label: "Cozy: a comfortable amount" },
    { id: "abundant", label: "Abundant: every shelf a little crowded" }
];


/* =========================================================
   SMALL PIECES
========================================================= */

function toggle(name, title, text, checked) {

    return html`
        <label class="toggle">
            <span class="toggle__text">
                <strong>${title}</strong>
                <small>${text}</small>
            </span>
            <input type="checkbox" name="${name}" data-setting="${name}" ${checked ? html`checked` : ""}>
        </label>
    `;

}


/*
    A readable name for the device behind a sign-in, from its
    user agent. Only a hint; it is never used for security.
*/

function deviceName(agent = "") {

    const browser =
        /Edg\//.test(agent) ? "Edge"
            : /Firefox\//.test(agent) ? "Firefox"
                : /Chrome\//.test(agent) ? "Chrome"
                    : /Safari\//.test(agent) ? "Safari"
                        : "A browser";

    const system =
        /iPhone/.test(agent) ? "iPhone"
            : /iPad/.test(agent) ? "iPad"
                : /Android/.test(agent) ? "Android"
                    : /Mac OS X/.test(agent) ? "Mac"
                        : /Windows/.test(agent) ? "Windows"
                            : /Linux/.test(agent) ? "Linux"
                                : "";

    return system ? `${browser} on ${system}` : browser;

}


/* =========================================================
   RENDER
========================================================= */

function renderPage() {

    const profile =
        getProfile() || {};

    const settings =
        getSettings();

    const prefs =
        getPreferences();

    const rain =
        settings.rain === null || settings.rain === undefined
            ? ""
            : settings.rain ? "on" : "off";

    render(content, html`

        <div class="page-heading">
            <div>
                <h1 class="page-heading__title">Settings</h1>
                <p class="page-heading__subtitle">Arrange the reading room just the way you like it.</p>
            </div>
        </div>

        <div class="settings-grid">

            <section class="settings-section paper" aria-labelledby="accountHeading">

                <h2 id="accountHeading">${art("ui-user")} Your account</h2>

                <form class="stack" id="nameForm" style="gap: 10px" novalidate>
                    <label class="field">
                        <span class="field__label">Display name</span>
                        <input class="field__input" name="display_name" maxlength="60" required autocomplete="nickname" value="${profile.display_name || ""}">
                    </label>
                    <p class="form-error" role="alert" hidden></p>
                    <div>
                        <button class="button button--ghost button--small" type="submit">Save name</button>
                    </div>
                </form>

                <div class="field">
                    <span class="field__label">Email</span>
                    <p>${email}</p>
                </div>

                <form class="stack" id="passwordForm" style="gap: 10px" novalidate>
                    <label class="field">
                        <span class="field__label">New password</span>
                        <input class="field__input" type="password" name="password" minlength="8" required autocomplete="new-password">
                    </label>
                    <label class="field">
                        <span class="field__label">Type it again</span>
                        <input class="field__input" type="password" name="confirm" minlength="8" required autocomplete="new-password">
                    </label>
                    <p class="form-error" role="alert" hidden></p>
                    <div>
                        <button class="button button--ghost button--small" type="submit">${art("ui-lock")} Change password</button>
                    </div>
                </form>

                <div>
                    <button class="button button--ghost" type="button" data-action="sign-out">${art("ui-door")} Sign out</button>
                </div>

            </section>

            <section class="settings-section paper" aria-labelledby="signinHeading">

                <h2 id="signinHeading">${art("ui-lock")} Recent sign-ins</h2>

                <p class="muted">Every time someone signs in to your library, it's written down here. If you don't recognise one, change your password.</p>

                <div id="signins">${loader("Reading the guest book…")}</div>

            </section>

            <section class="settings-section paper" aria-labelledby="readingHeading">

                <h2 id="readingHeading">${art("art-reading")} Reading</h2>

                <label class="field">
                    <span class="field__label">Books I'd like to finish each year</span>
                    <input class="field__input" type="number" name="annual_goal" data-setting="annual_goal" min="0" max="1000" value="${settings.annual_goal}">
                </label>

                <label class="field">
                    <span class="field__label">Arrange books on each shelf by</span>
                    <select class="field__input" name="default_shelf_sort" data-setting="default_shelf_sort">
                        ${SHELF_SORTS.map((sort) => html`
                            <option value="${sort.id}" ${sort.id === settings.default_shelf_sort ? html`selected` : ""}>${sort.label}</option>
                        `)}
                    </select>
                </label>

                <p class="muted">“My own order” lets you drag books around the shelves yourself.</p>

            </section>

            <section class="settings-section settings-section--wide paper" aria-labelledby="roomHeading">

                <h2 id="roomHeading">${art("ui-brush")} The reading room</h2>

                <fieldset class="theme-choices" aria-label="Room theme">
                    ${THEMES.map((theme) => html`
                        <label class="theme-choice">
                            <input type="radio" name="theme" value="${theme.id}" data-setting="theme" ${theme.id === settings.theme ? html`checked` : ""}>
                            <span class="theme-swatch" aria-hidden="true">
                                ${theme.swatch.map((color) => html`<span style="background: ${color}"></span>`)}
                            </span>
                            <strong>${theme.name}</strong>
                            <small>${theme.description}</small>
                        </label>
                    `)}
                </fieldset>

                <div class="settings-grid" style="gap: 6px 28px">

                    <div>
                        ${toggle("candle_glow", "Candle glow", "Soft, flickering light around the candles and lamps.", settings.candle_glow)}
                        ${toggle("dust", "Floating dust", "Motes drifting slowly through the lamplight.", settings.dust)}
                        ${toggle("oddities", "Little oddities", "Now and then something small happens. Keep an eye on the cat.", settings.oddities)}
                        ${toggle("reduced_motion", "Keep things still", "Turns off animation throughout Novellow.", settings.reduced_motion)}
                    </div>

                    <div class="stack" style="gap: 12px">

                        <label class="field">
                            <span class="field__label">Rain on the window</span>
                            <select class="field__input" name="rain" data-setting="rain">
                                <option value="" ${rain === "" ? html`selected` : ""}>Whatever the theme likes</option>
                                <option value="on" ${rain === "on" ? html`selected` : ""}>Always raining</option>
                                <option value="off" ${rain === "off" ? html`selected` : ""}>Never raining</option>
                            </select>
                        </label>

                        <label class="field">
                            <span class="field__label">Decorations</span>
                            <select class="field__input" name="decoration_density" data-setting="decoration_density">
                                ${DENSITIES.map((density) => html`
                                    <option value="${density.id}" ${density.id === settings.decoration_density ? html`selected` : ""}>${density.label}</option>
                                `)}
                            </select>
                        </label>

                        <label class="field">
                            <span class="field__label">The library cat</span>
                            <select class="field__input" data-pref="cat">
                                ${CATS.map((cat) => html`
                                    <option value="${cat.id}" ${cat.id === prefs.cat ? html`selected` : ""}>${cat.name}</option>
                                `)}
                            </select>
                        </label>

                        <label class="field">
                            <span class="field__label">Curtains</span>
                            <select class="field__input" data-pref="curtains">
                                ${CURTAINS.map((choice) => html`
                                    <option value="${choice.id}" ${choice.id === prefs.curtains ? html`selected` : ""}>${choice.name}</option>
                                `)}
                            </select>
                        </label>

                        <label class="field">
                            <span class="field__label">Rug</span>
                            <select class="field__input" data-pref="rug">
                                ${RUGS.map((choice) => html`
                                    <option value="${choice.id}" ${choice.id === prefs.rug ? html`selected` : ""}>${choice.name}</option>
                                `)}
                            </select>
                        </label>

                        <label class="field">
                            <span class="field__label">On the side table</span>
                            <select class="field__input" data-pref="mug">
                                ${MUGS.map((choice) => html`
                                    <option value="${choice.id}" ${choice.id === prefs.mug ? html`selected` : ""}>${choice.name}</option>
                                `)}
                            </select>
                        </label>

                        <label class="field">
                            <span class="field__label">The café's tea set</span>
                            <select class="field__input" data-pref="teaset">
                                ${TEASETS.map((choice) => html`
                                    <option value="${choice.id}" ${choice.id === prefs.teaset ? html`selected` : ""}>${choice.name}</option>
                                `)}
                            </select>
                        </label>

                        <label class="field">
                            <span class="field__label">China colour (mug and tea set)</span>
                            <select class="field__input" data-pref="china">
                                ${CHINA_COLOURS.map((choice) => html`
                                    <option value="${choice.id}" ${choice.id === prefs.china ? html`selected` : ""}>${choice.name}</option>
                                `)}
                            </select>
                        </label>

                        <label class="field">
                            <span class="field__label">Floating ghosts</span>
                            <select class="field__input" data-pref="ghosts">
                                ${GHOST_CHOICES.map((choice) => html`
                                    <option value="${choice.id}" ${choice.id === prefs.ghosts ? html`selected` : ""}>${choice.name}</option>
                                `)}
                            </select>
                        </label>

                        <p class="muted">To place and move decorations, choose “Arrange the room” from the moon menu at the top of the page.</p>

                    </div>

                </div>

            </section>

            <section class="settings-section paper mixer" aria-labelledby="soundHeading">

                <h2 id="soundHeading">${art("ui-sound")} Sounds of the room</h2>

                <div data-settings-mixer></div>

                <p class="muted">Sounds are made right in your browser and saved on this device only, so your phone can stay quiet while your laptop plays.</p>

            </section>

            <section class="settings-section settings-section--wide paper" aria-labelledby="dataHeading">

                <h2 id="dataHeading">${art("ui-download")} Your library's data</h2>

                <p>
                    Download everything (shelves, books, journals, quotes, words, reviews, challenges and room
                    decorations) as a single file you can keep safe, or bring a saved file back in.
                    Book cover pictures aren't included in the file.
                </p>

                <div class="data-actions">
                    <button class="button button--brass" type="button" data-action="export">${art("ui-download")} Download my library</button>
                    <label class="button button--ghost">
                        ${art("ui-import")} Bring in a saved library
                        <input class="visually-hidden" type="file" accept="application/json,.json" data-action="import">
                    </label>
                </div>

                <div class="danger-zone paper" style="padding: 16px 18px; border-width: 1.5px; border-style: dashed">
                    <p><strong>Start over.</strong> Empties every shelf and journal. Your account, settings and sign-in history stay. This can't be undone, so download your library first.</p>
                    <div style="margin-top: 10px">
                        <button class="button button--danger" type="button" data-action="clear">${art("ui-trash")} Empty my library</button>
                    </div>
                </div>

            </section>

        </div>

    `);

    loadSignIns();

    mountMixer(content.querySelector("[data-settings-mixer]"));

}


async function loadSignIns() {

    const holder =
        document.getElementById("signins");

    try {

        const rows =
            await listSignIns(12);

        render(holder, rows.length ? html`
            <ul class="signin-list">
                ${rows.map((row) => html`
                    <li>
                        <span>
                            ${formatDateTime(row.signed_in_at)}
                            <small>· ${METHODS[row.method] || row.method}</small>
                        </span>
                        <small>${deviceName(row.user_agent || "")}</small>
                    </li>
                `)}
            </ul>
        ` : html`<p class="muted">No sign-ins recorded yet.</p>`);

    }

    catch (error) {

        console.error(error);

        render(holder, html`<p class="muted">The sign-in history couldn't be read just now.</p>`);

    }

}


/*
    Keeps the controls in step when settings change elsewhere
    (for example the theme menu in the header).
*/

function syncControls(settings) {

    content.querySelectorAll("[data-setting]").forEach((control) => {

        const key =
            control.dataset.setting;

        if (control.type === "radio") {
            control.checked = control.value === settings[key];
        }

        else if (control.type === "checkbox") {
            control.checked = Boolean(settings[key]);
        }

        else if (key === "rain") {
            control.value = settings.rain === null || settings.rain === undefined ? "" : settings.rain ? "on" : "off";
        }

        else if (document.activeElement !== control) {
            control.value = settings[key];
        }

    });

}


/* =========================================================
   SAVING
========================================================= */

function readSetting(control) {

    const key =
        control.dataset.setting;

    if (control.type === "checkbox") {
        return { [key]: control.checked };
    }

    if (key === "rain") {
        return { rain: control.value === "" ? null : control.value === "on" };
    }

    if (key === "annual_goal") {

        const goal =
            intOrNull(control.value);

        if (goal === null || goal < 0 || goal > 1000) {
            throw new NovellowError("Choose a yearly goal between 0 and 1000 books.");
        }

        return { annual_goal: goal };

    }

    return { [key]: control.value };

}


async function saveSetting(control) {

    const before =
        getSettings();

    let patch;

    try {
        patch = readSetting(control);
    }

    catch (error) {

        toastError(error);

        syncControls(before);

        return;

    }

    // Show appearance changes straight away, then save.
    applyAppearance({ ...before, ...patch });

    try {

        const saved =
            await updateSettings(patch);

        applyAppearance(saved);

        toast("Saved.", { tone: "success", timeout: 1600 });

    }

    catch (error) {

        applyAppearance(before);

        syncControls(before);

        toastError(error, "That setting didn't save. Please try again.");

    }

}


function showFormError(form, message) {

    const line =
        form.querySelector(".form-error");

    line.textContent = message;
    line.hidden = !message;

}


async function saveName(form) {

    const name =
        form.elements.display_name.value.trim();

    if (!name) {
        showFormError(form, "Your display name can't be empty.");
        return;
    }

    if (name.length > 60) {
        showFormError(form, "Keep your display name under 60 characters.");
        return;
    }

    showFormError(form, "");

    await withBusy(form.querySelector("[type=submit]"), "Saving…", async () => {

        try {

            await updateProfile({ display_name: name });

            toast("Your name has been updated.", { tone: "success" });

        }

        catch (error) {
            toastError(error);
        }

    });

}


async function savePassword(form) {

    const password =
        form.elements.password.value;

    if (password.length < 8) {
        showFormError(form, "Use at least 8 characters for your password.");
        return;
    }

    if (password !== form.elements.confirm.value) {
        showFormError(form, "Those two passwords don't match.");
        return;
    }

    showFormError(form, "");

    await withBusy(form.querySelector("[type=submit]"), "Saving…", async () => {

        try {

            await updatePassword(password);

            form.reset();

            toast("Your password has been changed.", { tone: "success" });

        }

        catch (error) {
            showFormError(form, error.userMessage || "Your password couldn't be changed. Please try again.");
        }

    });

}


/* =========================================================
   DATA
========================================================= */

async function runExport(button) {

    await withBusy(button, "Packing…", async () => {

        try {

            const counts =
                await exportLibrary();

            toast(`Downloaded ${plural(counts.books, "book")} on ${plural(counts.shelves, "shelf", "shelves")}.`, { tone: "success" });

        }

        catch (error) {
            toastError(error, "Your library couldn't be downloaded just now.");
        }

    });

}


async function runImport(input) {

    const file =
        input.files?.[0];

    input.value = "";

    if (!file) {
        return;
    }

    let checked;

    try {

        if (file.size > 20 * 1024 * 1024) {
            throw new NovellowError("That file is too large to be a Novellow library export.");
        }

        checked = checkImport(await file.text());

    }

    catch (error) {

        toastError(error, "That file couldn't be read.");

        return;

    }

    const { summary } =
        checked;

    if (!summary.books && !summary.shelves) {
        toast("That file doesn't have any shelves or books in it.", { tone: "error" });
        return;
    }

    const result =
        await formDialog({
            eyebrow: "Bring in a saved library",
            title: "Add these to your library?",
            submitLabel: "Bring them in",
            body: html`
                <ul class="stat-list">
                    <li><span>Shelves</span><span>${summary.shelves}</span></li>
                    <li><span>Books</span><span>${summary.books}</span></li>
                    <li><span>Notes and thoughts</span><span>${summary.entries}</span></li>
                    <li><span>Quotes</span><span>${summary.quotes}</span></li>
                    <li><span>Words</span><span>${summary.words}</span></li>
                </ul>
                ${summary.skipped ? html`<p class="form-note">${plural(summary.skipped, "damaged record")} will be left out.</p>` : ""}
                <p>Everything is added alongside what's already on your shelves. Nothing is replaced. Shelves with the same name are shared.</p>
                <label class="check">
                    <input type="checkbox" name="skip_duplicates" checked>
                    <span>Skip books I already have (same title and author)</span>
                </label>
                ${checked.settings ? html`
                    <label class="check">
                        <input type="checkbox" name="use_settings">
                        <span>Also use the file's room and reading settings</span>
                    </label>
                ` : ""}
            `,
            onSubmit: (values) => importLibrary(checked, {
                skipDuplicates: values.get("skip_duplicates") === "on",
                useSettings: values.get("use_settings") === "on"
            })
        });

    if (!result) {
        return;
    }

    if (result.shelves || result.books) {
        toast(`Added ${plural(result.books, "book")} and ${plural(result.shelves, "new shelf", "new shelves")}.`, { tone: "success" });
    }

    else {
        toast("Everything in that file was already on your shelves.", { tone: "info" });
    }

    if (result.duplicates) {
        toast(`${plural(result.duplicates, "book")} you already had ${result.duplicates === 1 ? "was" : "were"} skipped.`);
    }

    applyAppearance(getSettings());

    renderPage();

}


async function runClear(button) {

    await loadLibrary();

    const books =
        getBooks().length;

    const shelves =
        getShelves().length;

    if (!books && !shelves) {
        toast("Your library is already empty.");
        return;
    }

    const sure =
        await confirmDialog({
            title: "Empty your whole library?",
            message: `This removes ${plural(books, "book")}, ${plural(shelves, "shelf", "shelves")}, and every journal, quote, word, review and challenge. It can't be undone.`,
            confirmLabel: "Empty my library",
            tone: "danger",
            requireText: "CLEAR"
        });

    if (!sure) {
        return;
    }

    await withBusy(button, "Emptying…", async () => {

        try {

            await clearLibrary();

            toast("Your library is empty and ready for new stories.", { tone: "success" });

        }

        catch (error) {
            toastError(error, "Your library couldn't be emptied just now.");
        }

    });

}


/* =========================================================
   START
========================================================= */

async function start() {

    const { session } =
        await startApp({ page: "settings", eyebrow: "Settings" });

    email = session.user.email || "";

    renderPage();

    content.addEventListener("change", (event) => {

        const pref =
            event.target.closest("[data-pref]");

        if (pref) {

            setPreference(pref.dataset.pref, pref.value);

            toast("Saved on this device.", { tone: "success", timeout: 1600 });

            return;

        }

        const control =
            event.target.closest("[data-setting]");

        if (control) {
            saveSetting(control);
            return;
        }

        if (event.target.matches("input[type=file][data-action=import]")) {
            runImport(event.target);
        }

    });

    content.addEventListener("submit", (event) => {

        event.preventDefault();

        if (event.target.id === "nameForm") {
            saveName(event.target);
        }

        if (event.target.id === "passwordForm") {
            savePassword(event.target);
        }

    });

    content.addEventListener("click", (event) => {

        const trigger =
            event.target.closest("button[data-action]");

        if (!trigger) {
            return;
        }

        if (trigger.dataset.action === "export") {
            runExport(trigger);
        }

        if (trigger.dataset.action === "clear") {
            runClear(trigger);
        }

        if (trigger.dataset.action === "sign-out") {
            signOut();
        }

    });

    events.addEventListener("settings-changed", (event) => {
        syncControls(event.detail.settings);
    });

}


start().catch((error) => console.error(error));
