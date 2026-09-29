/* =========================================================
   NOVELLOW
   ABOUT NOVELLOW (about.html)

   What Novellow is, what's new (site_updates, written in
   Supabase), and a place to send a problem or an idea
   (reader_notes). Readers only ever see their own notes, and
   any reply to them; sql/notes.sql makes sure of that.
========================================================= */

import { startApp } from "../shell/app-shell.js?v=__VERSION__";
import { supabase } from "../core/supabase.js?v=__VERSION__";
import { NovellowError } from "../core/errors.js?v=__VERSION__";

import { html, render, formatDate, plural } from "../core/helpers.js?v=__VERSION__";
import { art, loader, toast, toastError, confirmDialog, withBusy } from "../core/ui.js?v=__VERSION__";


const content =
    document.getElementById("pageContent");

const KINDS = {
    problem: "Something's not working",
    idea: "An idea or wish",
    other: "Something else"
};

const UPDATE_KINDS = {
    new: "New",
    improved: "Better",
    fixed: "Fixed",
    news: "News"
};

const STATUS = {
    new: "Sent",
    seen: "Read",
    planned: "On the list",
    done: "Done",
    not_planned: "Not for now"
};

const MAX_LENGTH = 4000;

let updates = [];
let notes = [];

// Until sql/notes.sql has been run, the page still shows the
// About section and says the rest is on its way.
let ready = true;


/* =========================================================
   DATA
========================================================= */

function missingTable(error) {
    return ["42P01", "PGRST205"].includes(error?.code);
}


async function loadUpdates() {

    const { data, error } =
        await supabase
            .from("site_updates")
            .select("id, posted_on, kind, title, body")
            .order("posted_on", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(30);

    if (error) {
        throw error;
    }

    return data;

}


async function loadNotes() {

    const { data, error } =
        await supabase
            .from("reader_notes")
            .select("id, kind, message, status, reply, created_at")
            .order("created_at", { ascending: false })
            .limit(50);

    if (error) {
        throw error;
    }

    return data;

}


// The browser and screen size help reproduce a problem; nothing
// else about the device is sent.
function describeDevice() {

    const agent =
        navigator.userAgent || "";

    const browser =
        /Edg\//.test(agent) ? "Edge"
            : /CriOS|Chrome\//.test(agent) ? "Chrome"
            : /FxiOS|Firefox\//.test(agent) ? "Firefox"
            : /Safari\//.test(agent) ? "Safari"
            : "Another browser";

    const system =
        /iPhone/.test(agent) ? "iPhone"
            : /iPad|Macintosh.*Mobile/.test(agent) || (/Macintosh/.test(agent) && navigator.maxTouchPoints > 1) ? "iPad"
            : /Android/.test(agent) ? "Android"
            : /Mac OS X/.test(agent) ? "Mac"
            : /Windows/.test(agent) ? "Windows"
            : /CrOS/.test(agent) ? "Chromebook"
            : /Linux/.test(agent) ? "Linux"
            : "another system";

    const app =
        window.matchMedia("(display-mode: standalone)").matches || navigator.standalone ? ", home-screen app" : "";

    return `${browser} on ${system}${app}, ${window.innerWidth}×${window.innerHeight}`;

}


async function sendNote({ kind, message, includeDevice }) {

    const { error } =
        await supabase
            .from("reader_notes")
            .insert({
                kind,
                message,
                device: includeDevice ? describeDevice() : null
            });

    if (error) {

        if (missingTable(error)) {
            throw new NovellowError("Notes aren't set up on this site yet. Please try again soon.", error);
        }

        if (error.code === "P0001") {
            throw new NovellowError(error.message, error);
        }

        throw new NovellowError("Your note couldn't be sent just now. Please try again.", error);

    }

}


async function takeBack(id) {

    const { error } =
        await supabase
            .from("reader_notes")
            .delete()
            .eq("id", id);

    if (error) {
        throw new NovellowError("That note couldn't be taken back just now.", error);
    }

}


/* =========================================================
   RENDER
========================================================= */

function updateList() {

    if (!ready) {
        return html`<p class="about-quiet">News of the library will appear here soon.</p>`;
    }

    if (!updates.length) {
        return html`<p class="about-quiet">Nothing new just yet.</p>`;
    }

    return html`
        <ol class="update-list">
            ${updates.map((update) => html`
                <li class="update-item">
                    <div class="update-item__meta">
                        <span class="update-tag update-tag--${update.kind}">${UPDATE_KINDS[update.kind] || "News"}</span>
                        <time datetime="${update.posted_on}">${formatDate(update.posted_on)}</time>
                    </div>
                    <h3 class="update-item__title">${update.title}</h3>
                    <p class="update-item__body">${update.body}</p>
                </li>
            `)}
        </ol>
    `;

}


function noteForm() {

    return html`
        <form class="note-form" id="noteForm" novalidate>

            <fieldset class="note-kinds">
                <legend class="field__label">What's it about?</legend>
                ${Object.entries(KINDS).map(([id, label], index) => html`
                    <label class="note-kind">
                        <input type="radio" name="kind" value="${id}" ${index === 0 ? "checked" : ""}>
                        <span>${label}</span>
                    </label>
                `)}
            </fieldset>

            <label class="field">
                <span class="field__label">Your note</span>
                <textarea class="field__input" name="message" rows="6" maxlength="${MAX_LENGTH}" required
                    placeholder="Tell us what happened, or what you'd love to see. If something went wrong, what were you doing just before?"></textarea>
            </label>

            <label class="check-line">
                <input type="checkbox" name="device" checked>
                <span>Include my browser and screen size (it helps us fix problems)</span>
            </label>

            <div class="note-form__actions">
                <button class="button button--brass" type="submit">${art("ui-add")} Send note</button>
                <span class="note-form__hint">Only you and Novellow can read your notes.</span>
            </div>

        </form>
    `;

}


function noteList() {

    if (!notes.length) {
        return "";
    }

    return html`
        <section class="about-card paper" aria-labelledby="notesTitle">

            <p class="eyebrow">Sent from your library</p>
            <h2 id="notesTitle" class="about-card__title">Your notes</h2>

            <ul class="note-list">
                ${notes.map((note) => html`
                    <li class="note-item">
                        <div class="note-item__meta">
                            <span>${KINDS[note.kind] || "Note"} · ${formatDate(note.created_at)}</span>
                            <span class="note-status note-status--${note.status}">${STATUS[note.status] || "Sent"}</span>
                        </div>
                        <p class="note-item__message">${note.message}</p>
                        ${note.reply ? html`
                            <div class="note-reply">
                                <p class="note-reply__from">Novellow replied</p>
                                <p>${note.reply}</p>
                            </div>
                        ` : ""}
                        <button class="text-button note-item__remove" type="button" data-action="take-back" data-id="${note.id}">Take back</button>
                    </li>
                `)}
            </ul>

        </section>
    `;

}


function renderPage() {

    render(content, html`

        <div class="page-heading">
            <div>
                <h1 class="page-heading__title">About Novellow</h1>
                <p class="page-heading__subtitle">News from the library, and a way to reach us.</p>
            </div>
        </div>

        <div class="about-grid">

            <div class="about-column">

                <section class="about-card paper" aria-labelledby="storyTitle">

                    <p class="eyebrow">Welcome in</p>
                    <h2 id="storyTitle" class="about-card__title">A cozy home for your reading life</h2>

                    <p>Novellow is an illustrated library and reading journal. Build shelves, fill them with the books you've read and the ones you're longing to, and open any book to keep your notes, favourite passages, new words and reviews inside.</p>

                    <p>It's made with care by a reader, for readers, and it's free. Your library is private unless you choose to share your shelves with friends, and your journals are never shared.</p>

                    <p class="about-links">
                        <a href="privacy.html">Privacy Policy</a>
                        <span aria-hidden="true">·</span>
                        <a href="terms.html">Terms of Use</a>
                        <span aria-hidden="true">·</span>
                        <a href="settings.html">Your account</a>
                    </p>

                </section>

                <section class="about-card paper" aria-labelledby="newsTitle">

                    <p class="eyebrow">From the library</p>
                    <h2 id="newsTitle" class="about-card__title">What's new</h2>

                    ${updateList()}

                </section>

            </div>

            <div class="about-column">

                <section class="about-card paper" aria-labelledby="noteTitle">

                    <p class="eyebrow">Write to us</p>
                    <h2 id="noteTitle" class="about-card__title">Report a problem or share an idea</h2>

                    <p>Found something that isn't working, or wishing Novellow could do something new? Every note is read.</p>

                    ${ready ? noteForm() : html`<p class="about-quiet">Notes will open here very soon.</p>`}

                </section>

                ${noteList()}

            </div>

        </div>

    `);

}


/* =========================================================
   START
========================================================= */

async function refresh() {

    try {

        [updates, notes] =
            await Promise.all([loadUpdates(), loadNotes()]);

        ready = true;

    }

    catch (error) {

        if (!missingTable(error)) {
            throw error;
        }

        ready = false;
        updates = [];
        notes = [];

    }

    renderPage();

}


async function start() {

    await startApp({ page: "about", eyebrow: "About Novellow" });

    render(content, loader("Opening the letters…"));

    try {
        await refresh();
    }

    catch (error) {
        toastError(error);
        ready = false;
        renderPage();
    }

    content.addEventListener("submit", async (event) => {

        if (event.target.id !== "noteForm") {
            return;
        }

        event.preventDefault();

        const form =
            event.target;

        const message =
            form.elements.message.value.trim();

        if (!message) {
            form.elements.message.setAttribute("aria-invalid", "true");
            form.elements.message.focus();
            toast("Write a few words first.", { tone: "error" });
            return;
        }

        await withBusy(form.querySelector("[type=submit]"), "Sending…", async () => {

            try {

                await sendNote({
                    kind: form.elements.kind.value,
                    message: message.slice(0, MAX_LENGTH),
                    includeDevice: form.elements.device.checked
                });

                toast("Thank you! Your note is on its way.", { tone: "success" });

                await refresh();

            }

            catch (error) {
                toastError(error);
            }

        });

    });

    content.addEventListener("click", async (event) => {

        const trigger =
            event.target.closest("[data-action='take-back']");

        if (!trigger) {
            return;
        }

        const sure =
            await confirmDialog({
                title: "Take back this note?",
                message: "It will be deleted, along with any reply.",
                confirmLabel: "Take back",
                tone: "danger"
            });

        if (!sure) {
            return;
        }

        try {
            await takeBack(trigger.dataset.id);
            toast(`Taken back. ${plural(notes.length - 1, "note")} left.`);
            await refresh();
        }

        catch (error) {
            toastError(error);
        }

    });

}


start().catch((error) => console.error(error));
