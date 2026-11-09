/* =========================================================
   NOVELLOW
   DISCOVER (discover.html)

   Find a book through Open Library and Google Books (free
   public catalogues, js/books/catalogue.js) and add it with
   one click, pick something from your own
   To Be Read pile, or borrow a reading prompt.
========================================================= */

import { startApp } from "../shell/app-shell.js?v=__VERSION__";
import { loadLibrary, getBooks } from "../core/store.js?v=__VERSION__";
import { html, render, seededRandom, todayIso } from "../core/helpers.js?v=__VERSION__";
import { art, loader, emptyState, toastError, withBusy } from "../core/ui.js?v=__VERSION__";
import { coverUrls } from "../core/covers.js?v=__VERSION__";
import { coverMarkup } from "../books/cover.js?v=__VERSION__";
import { searchBooks, searchTopic } from "../books/catalogue.js?v=__VERSION__";


const content =
    document.getElementById("pageContent");

const PROMPTS = [
    { art: "motif-moon", title: "A moon on the cover", text: "Judge a book by its cover, just this once.", topic: "moon" },
    { art: "decor-teacup", title: "Under 200 pages", text: "Something you could finish in one long, rainy afternoon." },
    { art: "scene-window", title: "Somewhere it rains", text: "A story where the weather is practically a character.", topic: "rain" },
    { art: "tab-characters", title: "A new author", text: "Someone you've never read before." },
    { art: "decor-crystal", title: "A little magic", text: "Witches, familiars, spells, or an odd little shop.", topic: "witches" },
    { art: "tab-review", title: "An old favourite", text: "Reread a book you loved and see what's changed." }
];

let results = [];

// Ideas for searching by topic.
const TOPICS = [
    "Haunted house", "Witches", "Ghosts", "Cozy mystery", "Gothic", "Dark academia",
    "Fairy tales", "Vampires", "Time travel", "Small town", "Dragons", "Found family"
];

// What was searched for, to offer adding it by hand.
let searched = "";


function alreadyShelved(result) {

    const title =
        result.title.toLowerCase();

    return getBooks().some((book) => book.title.toLowerCase() === title);

}


function renderResults() {

    const holder =
        document.getElementById("results");

    if (!holder) {
        return;
    }

    render(holder, results.length ? html`
        <ul class="discover-results">
            ${results.map((result, index) => html`
                <li>
                    <article class="discover-card paper">
                        ${result.cover
                            ? html`<img src="${result.cover}" alt="Cover of ${result.title}" loading="lazy">`
                            : html`<span class="discover-card__blank">${art("motif-moon")}</span>`}
                        <div>
                            <strong>${result.title}</strong>
                            ${result.author ? html`<small>${result.author}</small>` : ""}
                            <small>${[result.year, result.pages ? `${result.pages} pages` : ""].filter(Boolean).join(" · ")}</small>
                            <small class="discover-card__source">${result.source}</small>
                            ${alreadyShelved(result)
                                ? html`<p class="muted" style="margin-top: 8px">Already on your shelves</p>`
                                : html`<button class="button button--brass button--small" type="button" data-add="${index}">${art("ui-add")} Add to my library</button>`}
                        </div>
                    </article>
                </li>
            `)}
        </ul>
        <p class="discover-by-hand">Not the one? <button class="text-button" type="button" data-add-by-hand>Add “${searched}” by hand</button></p>
    ` : html`
        ${emptyState({ symbol: "ui-search", title: "No books found", text: "Neither catalogue knows that one yet. Try the title and author together, or an ISBN, or add it yourself." })}
        <p class="discover-by-hand"><button class="button button--brass button--small" type="button" data-add-by-hand>${art("ui-add")} Add “${searched}” by hand</button></p>
    `);


    // A cover that won't load shows the plain moon instead.
    holder.querySelectorAll(".discover-card img").forEach((img) => {

        const blank = () => {
            img.outerHTML = `<span class="discover-card__blank">${art("motif-moon")}</span>`;
        };

        if (img.complete && !img.naturalWidth) {
            blank();
        }

        else {
            img.addEventListener("error", blank, { once: true });
        }

    });

}


/* =========================================================
   PAGE
========================================================= */

function renderPage() {

    const waiting =
        getBooks().filter((book) => book.status === "want_to_read");

    // One pick a day from the To Be Read pile.
    const pick =
        waiting.length
            ? waiting[Math.floor(seededRandom(todayIso())() * waiting.length)]
            : null;

    const genres =
        [...new Set(getBooks().map((book) => book.genre).filter(Boolean))].sort();

    render(content, html`

        <div class="page-heading">
            <div>
                <h1 class="page-heading__title">Discover</h1>
                <p class="page-heading__subtitle">Somewhere out there is the next book you'll love.</p>
            </div>
        </div>

        <div class="stack">

            <section aria-labelledby="findHeading">

                <h2 class="section-title section-title--light" id="findHeading">Find a book</h2>

                <form class="discover-search paper" id="discoverSearch" role="search">
                    <div class="discover-search__by" role="radiogroup" aria-label="Search by">
                        <label class="chip-picker__option">
                            <input class="visually-hidden" type="radio" name="by" value="title" checked>
                            <span>Title or author</span>
                        </label>
                        <label class="chip-picker__option">
                            <input class="visually-hidden" type="radio" name="by" value="topic">
                            <span>Topic, keyword or genre</span>
                        </label>
                    </div>
                    <label class="field">
                        <span class="field__label" data-search-label>Title, author or ISBN</span>
                        <input class="field__input" type="search" name="term" required placeholder="The Night Circus" autocomplete="off">
                    </label>
                    <button class="button button--primary" type="submit">${art("ui-search")} Search</button>
                    <button class="button button--brass" type="button" data-scan>${art("ui-scan")} Scan barcode</button>
                    <div class="discover-topics" data-topics hidden>
                        <span class="muted">Try:</span>
                        ${TOPICS.map((topic) => html`<button class="chip" type="button" data-topic="${topic}">${topic}</button>`)}
                    </div>
                </form>

                <p class="muted" style="margin-top: 8px; color: #f0dcc0">Book details and covers come from Open Library and Google Books, free public catalogues.</p>

                <div id="results"></div>

            </section>

            ${pick ? html`
                <section aria-labelledby="pickHeading">
                    <h2 class="section-title section-title--light" id="pickHeading">Maybe tonight?</h2>
                    <article class="reading-card paper" style="max-width: 560px">
                        ${coverMarkup(pick, { size: "small" })}
                        <div class="reading-card__body">
                            <p class="eyebrow">Today's pick from your To Be Read pile</p>
                            <h3 class="catalogue-card__title"><a href="journal.html?book=${pick.id}">${pick.title}</a></h3>
                            ${pick.author ? html`<p class="catalogue-card__author">${pick.author}</p>` : ""}
                            <a class="text-button" href="library.html?status=want_to_read">See the whole pile</a>
                        </div>
                    </article>
                </section>
            ` : ""}

            ${genres.length ? html`
                <section aria-labelledby="genreHeading">
                    <h2 class="section-title section-title--light" id="genreHeading">Your genres</h2>
                    <div class="chip-row">
                        ${genres.map((genre) => html`<a class="chip" href="library.html?genre=${encodeURIComponent(genre)}">${genre}</a>`)}
                    </div>
                </section>
            ` : ""}

            <section aria-labelledby="promptHeading">
                <h2 class="section-title section-title--light" id="promptHeading">Reading prompts</h2>
                <ul class="prompt-cards">
                    ${PROMPTS.map((prompt) => html`
                        <li>
                            <article class="prompt-card paper">
                                ${art(prompt.art)}
                                <h3>${prompt.title}</h3>
                                <p>${prompt.text}</p>
                                ${prompt.topic ? html`<button class="text-button" type="button" data-topic="${prompt.topic}">Find one</button>` : ""}
                            </article>
                        </li>
                    `)}
                </ul>
            </section>

        </div>

    `);

}


async function start() {

    await startApp({ page: "discover", eyebrow: "Discover" });

    render(content, loader("Lighting the lamps…"));

    try {

        await loadLibrary();

        await coverUrls(getBooks().map((book) => book.cover_path));

    }

    catch (error) {

        toastError(error);

        return;

    }

    renderPage();

    const searchForm = () =>
        document.getElementById("discoverSearch");

    // Searching by title or author, or by what a book is about.
    const showMode = () => {

        const form = searchForm();

        const topic =
            form.elements.by.value === "topic";

        form.querySelector("[data-search-label]").textContent = topic ? "What it's about" : "Title, author or ISBN";
        form.elements.term.placeholder = topic ? "Haunted house, witches, cozy mystery…" : "The Night Circus";
        form.querySelector("[data-topics]").hidden = !topic;

    };

    const searchTopicFor = (topic) => {

        const form = searchForm();

        form.elements.by.value = "topic";
        form.elements.term.value = topic;

        showMode();

        form.requestSubmit();

        form.scrollIntoView({ behavior: "smooth", block: "start" });

    };

    content.addEventListener("change", (event) => {
        if (event.target.name === "by") {
            showMode();
            searchForm().elements.term.focus();
        }
    });

    content.addEventListener("click", (event) => {

        const topic =
            event.target.closest("[data-topic]");

        if (topic) {
            searchTopicFor(topic.dataset.topic);
        }

    });

    // discover.html?topic=… (from elsewhere in the app) searches
    // straight away.
    const asked =
        new URL(window.location.href).searchParams.get("topic");

    if (asked) {
        window.setTimeout(() => searchTopicFor(asked), 0);
    }

    content.addEventListener("submit", async (event) => {

        if (event.target.id !== "discoverSearch") {
            return;
        }

        event.preventDefault();

        const term =
            event.target.elements.term.value.trim();

        if (!term) {
            return;
        }

        const holder =
            document.getElementById("results");

        await withBusy(event.target.querySelector("[type=submit]"), "Searching…", async () => {

            render(holder, loader("Searching the catalogue…"));

            try {

                searched = term;

                results = event.target.elements.by.value === "topic"
                    ? await searchTopic(term)
                    : await searchBooks(term);

                renderResults();

            }

            catch (error) {

                console.error(error);

                render(holder, emptyState({
                    symbol: "ui-alert",
                    title: "The catalogue didn't answer",
                    text: "Neither catalogue could be reached just now. You can still add the book by hand."
                }));

            }

        });

    });

    content.addEventListener("click", async (event) => {

        if (!event.target.closest("[data-scan]")) {
            return;
        }

        try {

            const { scanIsbn } =
                await import("../books/isbn-scanner.js?v=__VERSION__");

            const isbn =
                await scanIsbn();

            if (isbn) {
                const form = document.getElementById("discoverSearch");
                form.elements.term.value = isbn;
                form.requestSubmit();
            }

        }

        catch (error) {
            toastError(error);
        }

    });

    content.addEventListener("click", async (event) => {

        if (!event.target.closest("[data-add-by-hand]")) {
            return;
        }

        const { openBookEditor } =
            await import("../books/book-editor.js?v=__VERSION__");

        await openBookEditor({ prefill: { title: searched } });

    });

    content.addEventListener("click", async (event) => {

        const add =
            event.target.closest("[data-add]");

        if (!add) {
            return;
        }

        const result =
            results[Number(add.dataset.add)];

        try {

            const { openBookEditor } =
                await import("../books/book-editor.js?v=__VERSION__");

            const saved =
                await openBookEditor({
                    prefill: {
                        title: result.title,
                        author: result.author,
                        publication_year: result.year,
                        page_count: result.pages,
                        isbn: result.isbn,
                        genre: result.genre
                    },
                    coverUrl: result.coverLarge
                });

            if (saved) {
                renderResults();
            }

        }

        catch (error) {
            toastError(error);
        }

    });

}


start().catch((error) => console.error(error));
