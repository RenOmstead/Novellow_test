/* =========================================================
   NOVELLOW
   VISITING A READER'S LIBRARY (visit.html?u=username,
   or novellow.com/@username)

   Another reader's room, just as they arranged it: their
   theme, furniture and decorations, their shelves and books.
   Open a book to see its cover and details, and whatever else
   they've chosen to share (their review, quotes, journal
   notes). Nothing can be moved or changed.

   Anyone can visit a library shared with everyone, signed in
   or not; a library shared with friends needs a friend. The
   database (sql/public.sql) decides what can be read.
========================================================= */

import { supabase } from "../core/supabase.js?v=__VERSION__";
import { getSession } from "../core/auth.js?v=__VERSION__";
import { setVisiting } from "../core/visit-mode.js?v=__VERSION__";
import { loadSprite } from "../core/art.js?v=__VERSION__";
import { NovellowError } from "../core/errors.js?v=__VERSION__";

import { setUser, useVisitedSettings, loadLibrary, getBooks, getBook, getShelf } from "../core/store.js?v=__VERSION__";
import { coverUrls } from "../core/covers.js?v=__VERSION__";
import { html, raw, render, queryParam, formatDate } from "../core/helpers.js?v=__VERSION__";
import { art, loader, toast, toastError, confirmDialog, formDialog } from "../core/ui.js?v=__VERSION__";
import { ratingMarkup } from "../core/rating.js?v=__VERSION__";
import { READING_STATUSES } from "../config.js?v=__VERSION__";

import { applyAppearance } from "../shell/themes.js?v=__VERSION__";
import { growIvy } from "../room/ivy.js?v=__VERSION__";
import { renderCrown } from "../room/crown.js?v=__VERSION__";
import { startAmbience } from "../room/ambience.js?v=__VERSION__";
import { startDecorations } from "../room/decorations.js?v=__VERSION__";
import { startRoomFit } from "../room/fit-room.js?v=__VERSION__";
import { createBookcase } from "../books/bookcase.js?v=__VERSION__";
import { coverMarkup } from "../books/cover.js?v=__VERSION__";
import { avatarPortrait } from "../avatar/avatar.js?v=__VERSION__";


let page = null;
let signedIn = false;


function statusLabel(id) {
    return READING_STATUSES.find((status) => status.id === id)?.label || "";
}


function whose() {
    return `${page.display_name}’s`;
}


/* =========================================================
   THE BAR ACROSS THE TOP
========================================================= */

function renderBar() {

    // The same stage the app pages use, without the sidebar.
    const stage =
        document.createElement("div");

    stage.className = "app-stage visit-stage";

    const main =
        document.getElementById("main");

    main.before(stage);

    const bar =
        document.createElement("header");

    bar.className = "visit-bar";

    stage.append(bar, main);

    // The room fits the screen below the bar.
    const measure = () => {
        document.documentElement.style.setProperty("--header-h", `${Math.ceil(bar.offsetHeight)}px`);
    };

    new ResizeObserver(measure).observe(bar);

    render(bar, html`

        <a class="visit-bar__logo" href="${signedIn ? "dashboard.html" : "index.html"}" aria-label="${signedIn ? "Back to my library" : "Novellow"}">
            <img src="assets/brand/wordmark-light.png?v=__VERSION__" width="490" height="149" alt="Novellow">
        </a>

        <span class="reader-avatar reader-avatar--large visit-bar__avatar" aria-hidden="true">${raw(avatarPortrait(page.avatar, { seed: page.id }))}</span>

        <div class="visit-bar__who">
            <p class="visit-bar__eyebrow">${page.visibility === "public" ? "An open library" : "A friend’s library"}</p>
            <h2 class="visit-bar__name">${whose()} library <span class="visit-bar__handle">@${page.username}</span></h2>
            ${page.bio ? html`<p class="visit-bar__bio">${page.bio}</p>` : ""}
        </div>

        <div class="visit-bar__actions">
            ${page.is_me ? html`
                <span class="visit-bar__note">This is how visitors see your room.</span>
                <a class="button button--brass button--small" href="dashboard.html">Back to my library</a>
            ` : signedIn ? html`
                <a class="button button--brass button--small" href="dashboard.html">My library</a>
                <button class="button button--ghost button--small" type="button" data-action="report">Report</button>
                <button class="button button--ghost button--small" type="button" data-action="block">Block</button>
            ` : html`
                <a class="button button--brass button--small" href="index.html?mode=signup">Start your own library</a>
            `}
        </div>

    `);

    bar.addEventListener("click", (event) => {

        const action =
            event.target.closest("[data-action]")?.dataset.action;

        if (action === "report") {
            report();
        }

        if (action === "block") {
            block();
        }

    });

}


/* =========================================================
   A BOOK, OPENED
========================================================= */

async function sharedFor(book) {

    const lookups = [];

    lookups.push(page.share_reviews
        ? supabase.from("reviews").select("body, final_thoughts, would_reread").eq("book_id", book.id).maybeSingle()
        : Promise.resolve({ data: null }));

    lookups.push(page.share_quotes
        ? supabase.from("quotes").select("id, text, location").eq("book_id", book.id).order("created_at").limit(12)
        : Promise.resolve({ data: [] }));

    lookups.push(page.share_journal
        ? supabase.from("journal_entries").select("id, title, body, created_at").eq("book_id", book.id).order("created_at").limit(12)
        : Promise.resolve({ data: [] }));

    const [review, quotes, notes] =
        await Promise.all(lookups);

    return {
        review: review.data,
        quotes: quotes.data || [],
        notes: (notes.data || []).filter((note) => (note.body || "").trim())
    };

}


async function openBook(bookId) {

    const book =
        getBook(bookId);

    if (!book) {
        return;
    }

    const dialog =
        document.createElement("dialog");

    dialog.className = "parchment-dialog visit-book";

    dialog.setAttribute("aria-label", book.title);

    document.body.appendChild(dialog);

    const close = () => dialog.close();

    dialog.addEventListener("close", () => window.setTimeout(() => dialog.remove(), 50));
    dialog.addEventListener("click", (event) => {
        if (event.target === dialog || event.target.closest("[data-close]")) {
            close();
        }
    });

    render(dialog, loader("Taking it off the shelf…"));

    dialog.showModal();

    let shared = { review: null, quotes: [], notes: [] };

    try {
        shared = await sharedFor(book);
    }

    catch (error) {
        console.error(error);
    }

    const details =
        [book.publication_year, book.page_count ? `${book.page_count} pages` : "", book.genre].filter(Boolean).join(" · ");

    const shelf =
        getShelf(book.shelf_id);

    render(dialog, html`
        <article class="visit-book__inner">

            <button class="dialog-close" type="button" data-close aria-label="Close">
                ${art("ui-close", "dialog-close__art")}
            </button>

            <div class="visit-book__head">

                ${coverMarkup(book, { size: "medium" })}

                <div class="visit-book__facts">
                    ${shelf ? html`<p class="dialog-eyebrow">On the ${shelf.name} shelf</p>` : ""}
                    <h2 class="dialog-title">${book.title}</h2>
                    ${book.author ? html`<p class="visit-book__author">${book.author}</p>` : ""}
                    ${details ? html`<p class="visit-book__details">${details}</p>` : ""}
                    <p class="visit-book__status">${statusLabel(book.status)}${book.date_finished ? html` · finished ${formatDate(book.date_finished)}` : ""}</p>
                    ${book.rating ? ratingMarkup(book.rating, { label: `${whose()} rating` }) : ""}
                </div>

            </div>

            ${shared.review && (shared.review.body || shared.review.final_thoughts) ? html`
                <section class="visit-book__section">
                    <h3>${whose()} review</h3>
                    ${shared.review.body ? html`<p class="visit-book__text">${shared.review.body}</p>` : ""}
                    ${shared.review.final_thoughts ? html`<p class="visit-book__text visit-book__text--soft">${shared.review.final_thoughts}</p>` : ""}
                </section>
            ` : ""}

            ${shared.quotes.length ? html`
                <section class="visit-book__section">
                    <h3>Lines ${page.display_name} saved</h3>
                    ${shared.quotes.map((quote) => html`
                        <blockquote class="visit-book__quote handwritten">“${quote.text}”${quote.location ? html` <cite>${quote.location}</cite>` : ""}</blockquote>
                    `)}
                </section>
            ` : ""}

            ${shared.notes.length ? html`
                <section class="visit-book__section">
                    <h3>From ${whose()} journal</h3>
                    ${shared.notes.map((note) => html`
                        <div class="visit-book__note">
                            ${note.title ? html`<h4>${note.title}</h4>` : ""}
                            <p class="visit-book__text">${note.body}</p>
                        </div>
                    `)}
                </section>
            ` : ""}

        </article>
    `);

}


/* =========================================================
   REPORT AND BLOCK
========================================================= */

async function report() {

    const sent =
        await formDialog({
            eyebrow: `@${page.username}`,
            title: `Report ${whose()} library`,
            submitLabel: "Send report",
            body: html`
                <p>Tell Novellow what's wrong: something unkind, unsafe, or not suitable for everyone. Only Novellow sees reports, and ${page.display_name} won't know who sent it.</p>
                <label class="field">
                    <span class="field__label">What's the problem?</span>
                    <textarea class="field__input" name="message" rows="5" maxlength="2000" required></textarea>
                </label>
            `,
            onSubmit: async (values) => {

                const message =
                    String(values.get("message") || "").trim();

                if (!message) {
                    throw Object.assign(new Error("empty"), { userMessage: "Write a few words about the problem." });
                }

                const { error } =
                    await supabase
                        .from("reader_notes")
                        .insert({ kind: "report", message, reported_user_id: page.id });

                if (error) {
                    throw new NovellowError(error.code === "P0001" ? error.message : "The report couldn't be sent just now.", error);
                }

                return true;

            }
        });

    if (sent) {
        toast("Thank you. Novellow will look at it.", { tone: "success" });
    }

}


async function block() {

    const sure =
        await confirmDialog({
            title: `Block ${page.display_name}?`,
            message: `They won't be able to visit your library or send you friend requests, and if you're friends, that ends. They aren't told. You can unblock them in Settings.`,
            confirmLabel: "Block",
            tone: "danger"
        });

    if (!sure) {
        return;
    }

    try {

        const { error } =
            await supabase
                .from("reader_blocks")
                .insert({ blocked_id: page.id });

        if (error && error.code !== "23505") {
            throw new NovellowError("They couldn't be blocked just now.", error);
        }

        toast(`${page.display_name} is blocked.`, { tone: "success" });

    }

    catch (error) {
        toastError(error);
    }

}


/* =========================================================
   NOTHING TO SEE
========================================================= */

function showClosed() {

    document.getElementById("boot")?.remove();

    const main =
        document.getElementById("main");

    main.hidden = false;

    render(main, html`
        <section class="visit-closed paper">
            ${art("art-books", "visit-closed__art")}
            <h1>This library's door is closed</h1>
            <p>Either there's no reader with that name, or they keep their library private${signedIn ? "" : " or share it only with friends"}.</p>
            <a class="button button--brass" href="${signedIn ? "dashboard.html" : "index.html"}">${signedIn ? "Back to my library" : "Visit Novellow"}</a>
        </section>
    `);

}


/* =========================================================
   START
========================================================= */

async function start() {

    setVisiting(true);

    loadSprite();

    // visit.html?u=wren_reads, or /@wren_reads on novellow.com.
    const username =
        queryParam("u")
        || decodeURIComponent(window.location.pathname).match(/@([a-z0-9_]{3,24})/i)?.[1]
        || "";

    signedIn =
        Boolean(await getSession().catch(() => null));

    const { data, error } =
        await supabase.rpc("reader_page", { p_username: username });

    if (error || !data) {

        if (error) {
            console.error(error);
        }

        showClosed();

        return;

    }

    page = data;

    // Everything read from here on is the owner's.
    setUser(page.id);
    useVisitedSettings(page.room);

    document.title = `${whose()} library | Novellow`;
    document.getElementById("visitTitle").textContent = `${whose()} library`;

    applyAppearance(page.room);

    renderBar();

    document.getElementById("boot")?.remove();
    document.getElementById("main").hidden = false;

    const room =
        document.querySelector(".library-room");

    const body =
        document.getElementById("bookcaseBody");

    render(body, loader("Dusting the shelves…"));

    startRoomFit(room);
    renderCrown(document.querySelector("[data-crown-decor]"), page.room.theme);
    growIvy(document.getElementById("main"));
    startAmbience(document.getElementById("ambience"));

    const bookcase =
        createBookcase(body, {
            onOpenBook: (bookId) => openBook(bookId)
        });

    try {
        await loadLibrary();
    }

    catch (error) {
        toastError(error, "The shelves couldn't be loaded. Refresh to try again.");
        return;
    }

    await coverUrls(getBooks().map((book) => book.cover_path));

    bookcase.render();

    startDecorations(room, page.room.theme);

}


start().catch((error) => {
    console.error(error);
    showClosed();
});
