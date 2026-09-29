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
import { currentUserId } from "../core/store.js?v=__VERSION__";

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

// Signed in as the Novellow account (sql/notes-inbox.sql), the
// page also shows the Notes inbox: every reader's note.
let team = false;
let inbox = [];
let inboxAll = false;

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
            .eq("user_id", currentUserId())
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


async function loadTeam() {

    const { data, error } =
        await supabase.rpc("is_novellow_team");

    // Before notes-inbox.sql has been run, there's no inbox.
    return !error && data === true;

}


async function loadInbox() {

    const { data, error } =
        await supabase.rpc("team_notes", { only_open: !inboxAll });

    if (error) {
        throw new NovellowError("The Notes inbox couldn't be opened just now.", error);
    }

    return data;

}


async function setPageHidden(userId, hidden) {

    const { error } =
        await supabase.rpc("set_page_hidden", { p_user: userId, p_hidden: hidden });

    if (error) {
        throw new NovellowError(error.code === "P0001" ? error.message : "That page couldn't be changed just now.", error);
    }

}


async function answerNote(id, { status, reply }) {

    const { error } =
        await supabase
            .from("reader_notes")
            .update({ status, reply })
            .eq("id", id);

    if (error) {
        throw new NovellowError("That answer couldn't be saved just now. Please try again.", error);
    }

}


/* =========================================================
   RENDER
========================================================= */

function inboxSection() {

    if (!team) {
        return "";
    }

    const waiting =
        inbox.filter((note) => note.status === "new").length;

    return html`
        <section class="about-card paper notes-inbox" id="inbox" aria-labelledby="inboxTitle">

            <div class="notes-inbox__head">
                <div>
                    <p class="eyebrow">Only the Novellow account sees this</p>
                    <h2 id="inboxTitle" class="about-card__title">Notes inbox</h2>
                    <p class="about-quiet">${waiting ? `${plural(waiting, "new note")} to read.` : "You're all caught up."}</p>
                </div>
                <div class="chip-row" role="group" aria-label="Which notes">
                    <button class="note-filter ${inboxAll ? "" : "is-on"}" type="button" data-action="inbox-open" aria-pressed="${inboxAll ? "false" : "true"}">Open</button>
                    <button class="note-filter ${inboxAll ? "is-on" : ""}" type="button" data-action="inbox-all" aria-pressed="${inboxAll ? "true" : "false"}">All</button>
                </div>
            </div>

            ${inbox.length ? html`
                <ul class="note-list">
                    ${inbox.map((note) => html`
                        <li class="note-item ${note.status === "new" ? "is-new" : ""}">
                            <div class="note-item__meta">
                                <span>${note.reader_name} · ${note.kind === "report" ? "A report" : KINDS[note.kind] || "Note"} · ${formatDate(note.created_at)}</span>
                                <span class="note-status note-status--${note.status}">${STATUS[note.status] || "Sent"}</span>
                            </div>
                            <p class="note-item__message">${note.message}</p>
                            ${note.device ? html`<p class="note-item__device">${note.device}</p>` : ""}
                            ${note.kind === "report" && note.reported_id ? html`
                                <div class="note-report">
                                    <span>About ${note.reported_username ? html`<a href="visit.html?u=${note.reported_username}">@${note.reported_username}’s library</a>` : "a reader’s library"}${note.reported_hidden ? html` · <strong>hidden</strong>` : ""}</span>
                                    <button class="button button--ghost button--small" type="button" data-action="${note.reported_hidden ? "show-page" : "hide-page"}" data-user="${note.reported_id}">${note.reported_hidden ? "Show the page again" : "Hide this page"}</button>
                                </div>
                            ` : ""}
                            <form class="note-answer" data-answer="${note.id}" novalidate>
                                <label class="field">
                                    <span class="field__label">Your reply (the reader sees this in Novellow)</span>
                                    <textarea class="field__input" name="reply" rows="3" maxlength="${MAX_LENGTH}">${note.reply || ""}</textarea>
                                </label>
                                <div class="note-answer__row">
                                    <label class="field note-answer__status">
                                        <span class="field__label">Status</span>
                                        <select class="field__input" name="status">
                                            ${Object.entries(STATUS).map(([id, label]) => html`
                                                <option value="${id}" ${id === note.status ? "selected" : ""}>${label}</option>
                                            `)}
                                        </select>
                                    </label>
                                    <button class="button button--primary button--small" type="submit">Save</button>
                                </div>
                            </form>
                        </li>
                    `)}
                </ul>
            ` : html`<p class="about-quiet">${inboxAll ? "No notes yet." : "No open notes."}</p>`}

        </section>
    `;

}


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
                            <span>${note.kind === "report" ? "A report" : KINDS[note.kind] || "Note"} · ${formatDate(note.created_at)}</span>
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

        ${inboxSection()}

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

                    <p>Found something that isn't working, or wishing Novellow could do something new? Every note is read. You can also email <a href="mailto:novellow.contact@gmail.com">novellow.contact@gmail.com</a>.</p>

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

        team = await loadTeam();

        inbox = team ? await loadInbox() : [];

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

        // The link in a note's email goes straight to the inbox.
        if (location.hash === "#inbox") {
            document.getElementById("inbox")?.scrollIntoView({ block: "start" });
        }

    }

    catch (error) {
        toastError(error);
        ready = false;
        renderPage();
    }

    content.addEventListener("submit", async (event) => {

        if (event.target.dataset.answer) {

            event.preventDefault();

            const form =
                event.target;

            const reply =
                form.elements.reply.value.trim();

            let status =
                form.elements.status.value;

            // Answering a new note marks it read.
            if (reply && status === "new") {
                status = "seen";
            }

            await withBusy(form.querySelector("[type=submit]"), "Saving…", async () => {

                try {
                    await answerNote(form.dataset.answer, { status, reply: reply || null });
                    toast("Saved. The reader will see it on their About page.", { tone: "success" });
                    await refresh();
                }

                catch (error) {
                    toastError(error);
                }

            });

            return;

        }

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

        const pageToggle =
            event.target.closest("[data-action='hide-page'], [data-action='show-page']");

        if (pageToggle) {

            const hide =
                pageToggle.dataset.action === "hide-page";

            if (hide) {

                const sure =
                    await confirmDialog({
                        title: "Hide this library?",
                        message: "Nobody but its owner will be able to visit it until you show it again. Their friends still can, if they share with friends.",
                        confirmLabel: "Hide it",
                        tone: "danger"
                    });

                if (!sure) {
                    return;
                }

            }

            try {
                await setPageHidden(pageToggle.dataset.user, hide);
                toast(hide ? "The page is hidden." : "The page is visible again.", { tone: "success" });
                await refresh();
            }

            catch (error) {
                toastError(error);
            }

            return;

        }

        const filter =
            event.target.closest("[data-action='inbox-open'], [data-action='inbox-all']");

        if (filter) {

            inboxAll = filter.dataset.action === "inbox-all";

            try {
                inbox = await loadInbox();
                renderPage();
            }

            catch (error) {
                toastError(error);
            }

            return;

        }

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
