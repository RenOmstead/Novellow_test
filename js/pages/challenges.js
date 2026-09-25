/* =========================================================
   NOVELLOW
   CHALLENGES (challenges.html)

   The yearly reading goal, and challenges the reader makes
   for themselves (books or pages, optionally only a genre,
   author or shelf, between two dates).
========================================================= */

import { startApp } from "../shell/app-shell.js?v=__VERSION__";

import {
    loadLibrary,
    getBooks,
    getShelves,
    getShelf,
    getSettings,
    updateSettings,
    listChallenges,
    createRow,
    updateRow,
    deleteRow
} from "../core/store.js?v=__VERSION__";

import { html, render, formatDate, plural, clamp, intOrNull, textOrNull, yearOf } from "../core/helpers.js?v=__VERSION__";
import { art, loader, emptyState, toast, toastError, confirmDialog, formDialog, withBusy } from "../core/ui.js?v=__VERSION__";


const content =
    document.getElementById("pageContent");

let challenges = [];


/* =========================================================
   PROGRESS
========================================================= */

function progressFor(challenge) {

    const criteria =
        challenge.criteria || {};

    const start =
        challenge.starts_on || "0000-01-01";

    const end =
        challenge.ends_on || "9999-12-31";

    const finished =
        getBooks().filter((book) =>
            book.status === "finished"
            && book.date_finished
            && book.date_finished >= start
            && book.date_finished <= end
            && (!criteria.genre || (book.genre || "").toLowerCase() === criteria.genre.toLowerCase())
            && (!criteria.author || (book.author || "").toLowerCase().includes(criteria.author.toLowerCase()))
            && (!criteria.shelf_id || book.shelf_id === criteria.shelf_id)
        );

    const value =
        criteria.measure === "pages"
            ? finished.reduce((sum, book) => sum + (book.page_count || 0), 0)
            : finished.length;

    return { value, books: finished };

}


function describe(challenge) {

    const criteria =
        challenge.criteria || {};

    const bits = [];

    if (criteria.genre) {
        bits.push(`in ${criteria.genre}`);
    }

    if (criteria.author) {
        bits.push(`by ${criteria.author}`);
    }

    if (criteria.shelf_id) {
        bits.push(`from ${getShelf(criteria.shelf_id)?.name || "a shelf"}`);
    }

    const range =
        challenge.starts_on || challenge.ends_on
            ? `${challenge.starts_on ? formatDate(challenge.starts_on) : "the beginning"} – ${challenge.ends_on ? formatDate(challenge.ends_on) : "any time"}`
            : "any time";

    return `${criteria.measure === "pages" ? "Pages" : "Books"} finished ${bits.join(" ")} · ${range}`;

}


/* =========================================================
   RENDER
========================================================= */

function renderPage() {

    const goal =
        getSettings().annual_goal || 0;

    const year =
        new Date().getFullYear();

    const finishedThisYear =
        getBooks().filter((book) => book.status === "finished" && yearOf(book.date_finished) === year).length;

    const percent =
        goal ? clamp(Math.round((finishedThisYear / goal) * 100), 0, 100) : 0;

    render(content, html`

        <div class="page-heading">
            <div>
                <h1 class="page-heading__title">Challenges</h1>
                <p class="page-heading__subtitle">Little quests to make the reading year your own.</p>
            </div>
            <div class="page-heading__actions">
                <a class="button button--ghost" href="stats.html">${art("art-challenge")} Reading stats</a>
                <button class="button button--brass" type="button" data-action="add">${art("ui-add")} New challenge</button>
            </div>
        </div>

        <section class="challenge-card paper" aria-labelledby="goalTitle" style="margin-bottom: 22px">

            <p class="eyebrow">The yearly goal</p>

            <h2 id="goalTitle">Read ${goal || "…"} books in ${year}</h2>

            <div class="progress-large">
                <div class="progress-large__label">
                    <span>${plural(finishedThisYear, "book")} finished</span>
                    <strong>${percent}%</strong>
                </div>
                <div class="progress-ribbon" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}" aria-label="Yearly goal progress">
                    <span style="width: ${percent}%"></span>
                </div>
            </div>

            <form class="progress-update" id="goalForm">
                <label class="field">
                    <span class="field__label">My goal for the year</span>
                    <input class="field__input" type="number" name="goal" min="0" max="1000" value="${goal}" required>
                </label>
                <button class="button button--ghost button--small" type="submit">Save goal</button>
            </form>

        </section>

        ${challenges.length ? html`
            <ul class="challenge-list">
                ${challenges.map((challenge) => {

                    const { value } =
                        progressFor(challenge);

                    const share =
                        clamp(Math.round((value / challenge.target) * 100), 0, 100);

                    return html`
                        <li>
                            <article class="challenge-card paper">
                                <h3>${challenge.title}</h3>
                                ${challenge.description ? html`<p>${challenge.description}</p>` : ""}
                                <p class="challenge-card__meta">${describe(challenge)}</p>
                                <div class="progress-large">
                                    <div class="progress-large__label">
                                        <span>${value.toLocaleString()} of ${challenge.target.toLocaleString()}</span>
                                        <strong>${share >= 100 ? "Complete!" : `${share}%`}</strong>
                                    </div>
                                    <div class="progress-ribbon" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${share}" aria-label="${challenge.title} progress">
                                        <span style="width: ${share}%"></span>
                                    </div>
                                </div>
                                <div class="challenge-card__actions">
                                    <button class="button button--ghost button--small" type="button" data-action="edit" data-id="${challenge.id}">Edit</button>
                                    <button class="button button--ghost button--small" type="button" data-action="delete" data-id="${challenge.id}">Remove</button>
                                </div>
                            </article>
                        </li>
                    `;

                })}
            </ul>
        ` : emptyState({
            symbol: "art-challenge",
            title: "No challenges yet",
            text: "Try “Five classics before autumn” or “2,000 pages of fantasy this year”.",
            actionLabel: "Create a challenge",
            action: "add"
        })}

    `);

}


/* =========================================================
   CHALLENGE FORM
========================================================= */

function challengeForm(challenge = {}) {

    const criteria =
        challenge.criteria || {};

    const year =
        new Date().getFullYear();

    const genres =
        [...new Set(getBooks().map((book) => book.genre).filter(Boolean))].sort();

    return html`
        <label class="field">
            <span class="field__label">Name</span>
            <input class="field__input" name="title" maxlength="120" required value="${challenge.title || ""}" placeholder="Five classics before autumn">
        </label>
        <label class="field">
            <span class="field__label">A note <span class="muted">(optional)</span></span>
            <textarea class="field__input" name="description" rows="2" maxlength="1000">${challenge.description || ""}</textarea>
        </label>
        <div class="field-row">
            <label class="field">
                <span class="field__label">Count</span>
                <select class="field__input" name="measure">
                    <option value="books" ${criteria.measure !== "pages" ? html`selected` : ""}>Books finished</option>
                    <option value="pages" ${criteria.measure === "pages" ? html`selected` : ""}>Pages finished</option>
                </select>
            </label>
            <label class="field">
                <span class="field__label">Target</span>
                <input class="field__input" type="number" name="target" min="1" required value="${challenge.target || 5}">
            </label>
        </div>
        <div class="field-row">
            <label class="field">
                <span class="field__label">Only this genre</span>
                <input class="field__input" name="genre" list="challengeGenres" maxlength="80" value="${criteria.genre || ""}">
                <datalist id="challengeGenres">${genres.map((genre) => html`<option value="${genre}"></option>`)}</datalist>
            </label>
            <label class="field">
                <span class="field__label">Only this author</span>
                <input class="field__input" name="author" maxlength="200" value="${criteria.author || ""}">
            </label>
        </div>
        <label class="field">
            <span class="field__label">Only this shelf</span>
            <select class="field__input" name="shelf_id">
                <option value="">Any shelf</option>
                ${getShelves().map((shelf) => html`<option value="${shelf.id}" ${shelf.id === criteria.shelf_id ? html`selected` : ""}>${shelf.name}</option>`)}
            </select>
        </label>
        <div class="field-row">
            <label class="field">
                <span class="field__label">From</span>
                <input class="field__input" type="date" name="starts_on" value="${challenge.starts_on || `${year}-01-01`}">
            </label>
            <label class="field">
                <span class="field__label">Until</span>
                <input class="field__input" type="date" name="ends_on" value="${challenge.ends_on || `${year}-12-31`}">
            </label>
        </div>
    `;

}


function readChallenge(values) {

    const criteria = {
        measure: values.get("measure") === "pages" ? "pages" : "books"
    };

    ["genre", "author", "shelf_id"].forEach((key) => {

        const value =
            textOrNull(values.get(key));

        if (value) {
            criteria[key] = value;
        }

    });

    const record = {
        title: String(values.get("title") || "").trim(),
        description: textOrNull(values.get("description")),
        target: intOrNull(values.get("target")) || 1,
        criteria,
        starts_on: values.get("starts_on") || null,
        ends_on: values.get("ends_on") || null
    };

    if (record.starts_on && record.ends_on && record.ends_on < record.starts_on) {
        throw Object.assign(new Error("dates"), { userMessage: "The end date is before the start date." });
    }

    return record;

}


/* =========================================================
   START
========================================================= */

async function refresh() {

    challenges = await listChallenges();

    renderPage();

}


async function start() {

    await startApp({ page: "challenges", eyebrow: "Challenges" });

    render(content, loader("Unrolling the challenges…"));

    try {

        await loadLibrary();

        await refresh();

    }

    catch (error) {

        toastError(error);

        return;

    }

    content.addEventListener("submit", async (event) => {

        if (event.target.id !== "goalForm") {
            return;
        }

        event.preventDefault();

        const goal =
            intOrNull(event.target.elements.goal.value);

        if (goal === null || goal < 0 || goal > 1000) {
            toast("Choose a goal between 0 and 1000.", { tone: "error" });
            return;
        }

        await withBusy(event.target.querySelector("[type=submit]"), "Saving…", async () => {

            try {

                await updateSettings({ annual_goal: goal });

                toast(`Your goal is ${plural(goal, "book")} this year.`, { tone: "success" });

                renderPage();

            }

            catch (error) {
                toastError(error);
            }

        });

    });

    content.addEventListener("click", async (event) => {

        const trigger =
            event.target.closest("[data-action]");

        if (!trigger) {
            return;
        }

        const challenge =
            challenges.find((item) => item.id === trigger.dataset.id);

        try {

            if (trigger.dataset.action === "add") {

                const saved =
                    await formDialog({
                        eyebrow: "A new quest",
                        title: "Create a challenge",
                        submitLabel: "Create challenge",
                        body: challengeForm(),
                        onSubmit: (values) => createRow("reading_challenges", readChallenge(values))
                    });

                if (saved) {
                    toast("Challenge accepted.", { tone: "success" });
                    await refresh();
                }

            }

            if (trigger.dataset.action === "edit" && challenge) {

                const saved =
                    await formDialog({
                        title: `Edit “${challenge.title}”`,
                        body: challengeForm(challenge),
                        onSubmit: (values) => updateRow("reading_challenges", challenge.id, readChallenge(values))
                    });

                if (saved) {
                    await refresh();
                }

            }

            if (trigger.dataset.action === "delete" && challenge) {

                const sure =
                    await confirmDialog({
                        title: `Remove “${challenge.title}”?`,
                        message: "Your books aren't affected, only this challenge.",
                        confirmLabel: "Remove",
                        tone: "danger"
                    });

                if (sure) {
                    await deleteRow("reading_challenges", challenge.id);
                    await refresh();
                }

            }

        }

        catch (error) {
            toastError(error);
        }

    });

}


start().catch((error) => console.error(error));
