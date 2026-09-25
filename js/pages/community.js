/* =========================================================
   NOVELLOW
   COMMUNITY (community.html)

   A foundation for later: libraries stay private today.
   This page explains what's coming and shows what the
   reader could one day share, without any pretend buttons.
========================================================= */

import { startApp } from "../shell/app-shell.js?v=__VERSION__";
import { loadLibrary, getBooks, libraryCounts } from "../core/store.js?v=__VERSION__";
import { html, render, plural } from "../core/helpers.js?v=__VERSION__";
import { art, loader, toastError } from "../core/ui.js?v=__VERSION__";


const content =
    document.getElementById("pageContent");


async function start() {

    await startApp({ page: "community", eyebrow: "Community" });

    render(content, loader("Opening the reading room…"));

    let counts = {};

    try {

        await loadLibrary();

        counts = await libraryCounts();

    }

    catch (error) {
        toastError(error);
    }

    const books =
        getBooks();

    const finished =
        books.filter((book) => book.status === "finished").length;

    render(content, html`

        <div class="page-heading">
            <div>
                <h1 class="page-heading__title">Community</h1>
                <p class="page-heading__subtitle">A reading room where libraries will one day meet.</p>
            </div>
        </div>

        <div class="stack">

            <section class="community-foundation paper" aria-labelledby="comingHeading">

                ${art("art-community", "community-foundation__art")}

                <div class="stack" style="gap: 12px">
                    <p class="eyebrow">Still being built</p>
                    <h2 id="comingHeading">The reading room isn't open yet</h2>
                    <p>
                        Novellow is a private library first. Everything on your shelves, and every
                        note, quote, word and review in your journals, is visible only to you.
                    </p>
                    <p>When the reading room opens, you'll be able to choose to:</p>
                    <ul>
                        <li>share a public view of your bookcase and reviews, while keeping your journals private</li>
                        <li>visit friends' libraries and see what they're reading</li>
                        <li>start a small book club around a single book</li>
                        <li>read alongside someone, chapter by chapter</li>
                    </ul>
                    <p class="muted">Nothing will be shared unless you turn it on.</p>
                </div>

            </section>

            <section class="chart-card paper" aria-labelledby="yoursHeading">
                <h2 class="section-title" id="yoursHeading">What a visitor would one day see</h2>
                <ul class="stat-list">
                    <li><span>Books on your shelves</span><span>${books.length}</span></li>
                    <li><span>Finished</span><span>${finished}</span></li>
                    <li><span>Reviews written</span><span>${counts.reviews || 0}</span></li>
                    <li><span>Kept private, always</span><span>${plural((counts.journal_entries || 0) + (counts.quotes || 0) + (counts.vocabulary || 0), "journal entry", "journal entries")}</span></li>
                </ul>
            </section>

        </div>

    `);

}


start().catch((error) => console.error(error));
