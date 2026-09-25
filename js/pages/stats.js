/* =========================================================
   NOVELLOW
   READING STATS (stats.html)

   Everything is worked out from the reader's own books,
   journals and progress logs.
========================================================= */

import { startApp } from "../shell/app-shell.js?v=__VERSION__";
import { loadLibrary, getBooks, getSettings, libraryCounts, listReadingSessions } from "../core/store.js?v=__VERSION__";
import { html, render, raw, yearOf, plural, clamp } from "../core/helpers.js?v=__VERSION__";
import { loader, emptyState, toastError } from "../core/ui.js?v=__VERSION__";


const content =
    document.getElementById("pageContent");

const MONTHS =
    ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const BAR_COLORS =
    ["#c47f82", "#879078", "#9b82a0", "#d8aa66", "#b5643f", "#5f7d45", "#74485c", "#c69a4a", "#6a5486", "#a1493f", "#34503f", "#e7b18f"];

let counts = {};
let sessions = [];
let year = new Date().getFullYear();


/* =========================================================
   ILLUSTRATIONS
========================================================= */

/*
    A glass jar that fills with little books as the year's
    goal gets closer.
*/

function goalJar(finished, goal) {

    const fill =
        goal ? clamp(finished / goal, 0, 1) : 0;

    const top = 150 - fill * 110;

    const books = [];

    const colors = ["#74444f", "#34503f", "#c47f82", "#3b3560", "#d8aa66", "#5f7d45"];

    for (let row = 0; row < 8; row += 1) {

        const y = 142 - row * 13;

        if (y < top) {
            break;
        }

        books.push(`<rect x="${36 + (row % 2) * 6}" y="${y}" width="${66 - (row % 3) * 6}" height="11" rx="2" fill="${colors[row % colors.length]}" stroke="#2a1a1f" stroke-width="1"/>`);

    }

    return raw(`
        <svg class="goal-jar" viewBox="0 0 140 170" role="img" aria-label="Goal jar ${Math.round(fill * 100)} percent full">
            <rect x="44" y="10" width="52" height="14" rx="3" fill="#b98955" stroke="#2a1a1f" stroke-width="1.4"/>
            <path d="M40 24H100V34C116 40 124 56 124 76V146C124 158 116 164 104 164H36C24 164 16 158 16 146V76C16 56 24 40 40 34Z" fill="#e8f1f2" fill-opacity="0.3" stroke="#5b6f73" stroke-width="2"/>
            <clipPath id="jarInside"><path d="M42 36C28 42 20 56 20 76V146C20 155 26 160 36 160H104C114 160 120 155 120 146V76C120 56 112 42 98 36Z"/></clipPath>
            <g clip-path="url(#jarInside)">${books.join("")}</g>
            <path d="M28 70C28 56 34 46 44 42" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.6"/>
            <path d="M112 30L114 36L120 38L114 40L112 46L110 40L104 38L110 36Z" fill="#f3cb79"/>
            ${fill >= 1 ? '<path d="M24 18L26 24L32 26L26 28L24 34L22 28L16 26L22 24Z" fill="#f3cb79"/>' : ""}
        </svg>
    `);

}


function monthChart(values) {

    const max =
        Math.max(1, ...values);

    const width = 640;
    const height = 220;
    const barWidth = 34;
    const gap = (width - 40 - barWidth * 12) / 11;

    const bars =
        values.map((value, index) => {

            const barHeight =
                (value / max) * 150;

            const x =
                20 + index * (barWidth + gap);

            const y =
                180 - barHeight;

            return `
                <g>
                    <rect class="bar-chart__bar" x="${x}" y="${y}" width="${barWidth}" height="${Math.max(2, barHeight)}" rx="4" fill="${BAR_COLORS[index]}" stroke="#2a1a1f" stroke-width="1.2"><title>${MONTHS[index]}: ${value}</title></rect>
                    ${value ? `<rect x="${x + 4}" y="${y + 6}" width="${barWidth - 8}" height="2" fill="#f3cb79" opacity="0.8"/>` : ""}
                    <text x="${x + barWidth / 2}" y="200" text-anchor="middle">${MONTHS[index]}</text>
                    ${value ? `<text class="bar-chart__value" x="${x + barWidth / 2}" y="${y - 6}" text-anchor="middle">${value}</text>` : ""}
                </g>
            `;

        }).join("");

    return raw(`
        <svg class="bar-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Books finished each month">
            <path d="M10 181H${width - 10}" stroke="#8a5a36" stroke-width="3" stroke-linecap="round"/>
            ${bars}
        </svg>
    `);

}


/* =========================================================
   CALCULATIONS
========================================================= */

function calculate() {

    const books =
        getBooks();

    const finishedThisYear =
        books.filter((book) => book.status === "finished" && yearOf(book.date_finished) === year);

    const rated =
        books.filter((book) => Number(book.rating) > 0);

    const withPages =
        books.filter((book) => book.page_count);

    const byMonth =
        Array(12).fill(0);

    finishedThisYear.forEach((book) => {
        byMonth[Number(book.date_finished.slice(5, 7)) - 1] += 1;
    });

    const genres = {};

    books.forEach((book) => {

        const genre =
            book.genre || "Unsorted";

        genres[genre] = (genres[genre] || 0) + 1;

    });

    const authors = {};

    books.forEach((book) => {

        if (book.author) {
            authors[book.author] = (authors[book.author] || 0) + 1;
        }

    });

    const pagesFinished =
        finishedThisYear.reduce((sum, book) => sum + (book.page_count || 0), 0);

    const pagesLogged =
        sessions
            .filter((session) => yearOf(session.logged_on) === year)
            .reduce((sum, session) => sum + (session.pages_read || 0), 0);

    const sortedByPages =
        [...withPages].sort((a, b) => b.page_count - a.page_count);

    return {
        total: books.length,
        finishedThisYear,
        reading: books.filter((book) => book.status === "reading").length,
        wantToRead: books.filter((book) => book.status === "want_to_read").length,
        dnf: books.filter((book) => book.status === "dnf").length,
        finishedAll: books.filter((book) => book.status === "finished").length,
        averageRating: rated.length ? rated.reduce((sum, book) => sum + Number(book.rating), 0) / rated.length : 0,
        rereads: books.filter((book) => (book.times_read || 0) > 1).length,
        favourites: books.filter((book) => book.is_favorite).length,
        pagesFinished,
        pagesLogged,
        byMonth,
        genres: Object.entries(genres).sort((a, b) => b[1] - a[1]),
        authors: Object.entries(authors).sort((a, b) => b[1] - a[1]).filter(([, count]) => count > 1).slice(0, 5),
        longest: sortedByPages[0],
        shortest: sortedByPages[sortedByPages.length - 1]
    };

}


function availableYears() {

    const years =
        new Set([new Date().getFullYear()]);

    getBooks().forEach((book) => {

        const finished =
            yearOf(book.date_finished);

        if (finished) {
            years.add(finished);
        }

    });

    return [...years].sort((a, b) => b - a);

}


/* =========================================================
   RENDER
========================================================= */

function renderPage() {

    const books =
        getBooks();

    if (!books.length) {

        render(content, html`
            <div class="page-heading"><div><h1 class="page-heading__title">Reading Stats</h1></div></div>
            ${emptyState({
                symbol: "art-challenge",
                title: "Nothing to count yet",
                text: "Add books to your shelves and your reading life will start to take shape here.",
                actionLabel: "Go to the bookcase",
                href: "dashboard.html"
            })}
        `);

        return;

    }

    const stats =
        calculate();

    const goal =
        getSettings().annual_goal || 0;

    const finished =
        stats.finishedThisYear.length;

    const biggestGenre =
        stats.genres[0]?.[1] || 1;

    render(content, html`

        <div class="page-heading">
            <div>
                <h1 class="page-heading__title">Reading Stats</h1>
                <p class="page-heading__subtitle">Your reading life, counted with care.</p>
            </div>
            <label class="field">
                <span class="field__label" style="color: #f0dcc0">Year</span>
                <select class="field__input" id="yearPicker">
                    ${availableYears().map((option) => html`<option ${option === year ? html`selected` : ""}>${option}</option>`)}
                </select>
            </label>
        </div>

        <section class="goal-card paper" aria-labelledby="goalHeading">
            ${goalJar(finished, goal)}
            <div>
                <p class="eyebrow">Reading goal for ${year}</p>
                <h2 class="visually-hidden" id="goalHeading">Reading goal</h2>
                <p class="goal-card__numbers">${finished} <span class="muted">of</span> ${goal || "—"}</p>
                <p>
                    ${goal
                        ? finished >= goal
                            ? "The jar is full. Every book from here is a bonus."
                            : `${plural(goal - finished, "book")} to go.`
                        : "Set a yearly goal in Challenges or Settings."}
                </p>
                <a class="text-button" href="challenges.html">Change the goal</a>
            </div>
        </section>

        <ul class="stat-plaques" style="margin-top: 22px">
            <li class="stat-plaque"><strong>${stats.total}</strong><span>Books in the library</span></li>
            <li class="stat-plaque"><strong>${finished}</strong><span>Finished in ${year}</span></li>
            <li class="stat-plaque"><strong>${stats.reading}</strong><span>Reading now</span></li>
            <li class="stat-plaque"><strong>${stats.wantToRead}</strong><span>Want to read</span></li>
            <li class="stat-plaque"><strong>${stats.dnf}</strong><span>Did not finish</span></li>
            <li class="stat-plaque"><strong>${stats.pagesFinished.toLocaleString()}</strong><span>Pages finished</span><small>${stats.pagesLogged ? `${stats.pagesLogged.toLocaleString()} logged in ${year}` : `in ${year}`}</small></li>
            <li class="stat-plaque"><strong>${stats.averageRating ? stats.averageRating.toFixed(1) : "—"}</strong><span>Average rating</span></li>
            <li class="stat-plaque"><strong>${stats.rereads}</strong><span>Rereads</span></li>
            <li class="stat-plaque"><strong>${counts.journal_entries || 0}</strong><span>Journal entries</span></li>
            <li class="stat-plaque"><strong>${counts.quotes || 0}</strong><span>Quotes saved</span></li>
            <li class="stat-plaque"><strong>${counts.vocabulary || 0}</strong><span>Words kept</span></li>
            <li class="stat-plaque"><strong>${counts.reviews || 0}</strong><span>Reviews written</span></li>
        </ul>

        <div class="split">

            <section class="chart-card paper" aria-labelledby="monthsHeading">
                <h2 class="section-title" id="monthsHeading">Books finished each month of ${year}</h2>
                ${monthChart(stats.byMonth)}
            </section>

            <section class="chart-card paper" aria-labelledby="genresHeading">
                <h2 class="section-title" id="genresHeading">By genre</h2>
                <ul class="genre-list">
                    ${stats.genres.slice(0, 8).map(([genre, count], index) => html`
                        <li>
                            <span>${genre}</span>
                            <span class="genre-list__bar" style="width: ${Math.max(6, (count / biggestGenre) * 100)}%; --bar: ${BAR_COLORS[index % BAR_COLORS.length]}"></span>
                            <strong>${count}</strong>
                        </li>
                    `)}
                </ul>
            </section>

        </div>

        <section class="chart-card paper" style="margin-top: 20px" aria-labelledby="recordsHeading">
            <h2 class="section-title" id="recordsHeading">Little records</h2>
            <ul class="stat-list">
                <li><span>Longest book</span><span>${stats.longest ? `${stats.longest.title} (${stats.longest.page_count} pages)` : "—"}</span></li>
                <li><span>Shortest book</span><span>${stats.shortest ? `${stats.shortest.title} (${stats.shortest.page_count} pages)` : "—"}</span></li>
                <li><span>Favourite authors</span><span>${stats.authors.length ? stats.authors.map(([author, count]) => `${author} (${count})`).join(", ") : "—"}</span></li>
                <li><span>Favourites</span><span>${stats.favourites}</span></li>
                <li><span>Finished, all time</span><span>${stats.finishedAll}</span></li>
                <li><span>Questions asked</span><span>${counts.questions || 0}</span></li>
                <li><span>Characters noted</span><span>${counts.characters || 0}</span></li>
            </ul>
        </section>

    `);

}


async function start() {

    await startApp({ page: "challenges", eyebrow: "Reading Stats" });

    render(content, loader("Counting the pages…"));

    try {

        await loadLibrary();

        [counts, sessions] =
            await Promise.all([
                libraryCounts(),
                listReadingSessions()
            ]);

    }

    catch (error) {

        toastError(error);

        return;

    }

    renderPage();

    content.addEventListener("change", (event) => {

        if (event.target.id === "yearPicker") {

            year = Number(event.target.value);

            renderPage();

        }

    });

}


start().catch((error) => console.error(error));
