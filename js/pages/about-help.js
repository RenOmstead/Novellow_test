/* =========================================================
   NOVELLOW
   HELP ON THE ABOUT PAGE

   Putting Novellow on a phone's home screen (with steps for
   iPhone and iPad, and for Android), and answers to the
   questions readers ask about finding their way around.
========================================================= */

import { html, render } from "../core/helpers.js?v=__VERSION__";
import { openedAsApp } from "../core/offline.js?v=__VERSION__";


// Which set of home-screen steps to show first.
function guessDevice() {

    const agent =
        navigator.userAgent || "";

    const apple =
        /iPhone|iPad|iPod/.test(agent) || (/Macintosh/.test(agent) && navigator.maxTouchPoints > 1);

    return apple ? "apple" : "android";

}




const STEPS = {

    apple: {
        label: "iPhone & iPad",
        intro: "Use Safari, the browser with the compass icon.",
        steps: [
            html`Open <strong>novellow.com</strong> in Safari and sign in.`,
            html`Tap the <strong>Share</strong> button: the square with an arrow pointing up. On an iPhone it's at the bottom of the screen; on an iPad it's at the top right.`,
            html`Scroll down the list and tap <strong>Add to Home Screen</strong>. (If you don't see it, tap <strong>Edit Actions</strong> at the bottom of the list and add it.)`,
            html`Keep the name <strong>Novellow</strong> and tap <strong>Add</strong>.`,
            html`Novellow's icon is now on your home screen. Tap it to open your library full screen, like an app.`
        ],
        note: "On iOS 16.4 or later, Chrome and other browsers can do this too: tap their Share button (at the top, beside the address) and choose Add to Home Screen."
    },

    android: {
        label: "Android",
        intro: "Use Chrome, or Samsung Internet on a Samsung phone.",
        steps: [
            html`Open <strong>novellow.com</strong> in Chrome and sign in.`,
            html`Tap the <strong>menu</strong> button: the three dots <strong>⋮</strong> at the top right.`,
            html`Tap <strong>Add to Home screen</strong> (on some phones it says <strong>Install app</strong>).`,
            html`Tap <strong>Add</strong> or <strong>Install</strong>. If your phone asks, tap <strong>Add</strong> again, or drag the icon where you'd like it.`,
            html`Novellow's icon is now on your home screen. Tap it to open your library full screen, like an app.`
        ],
        note: "In Samsung Internet, tap the menu (three lines) at the bottom right, then Add page to, then Home screen."
    }

};


const QUESTIONS = [

    {
        q: "How do I get around?",
        a: html`<p>On a computer, the menu down the left side takes you everywhere: <strong>Home</strong> (your library room), <strong>My Books</strong>, <strong>Reading Now</strong>, <strong>To Be Read</strong>, <strong>Community</strong>, <strong>Challenges</strong>, <strong>Journal</strong>, <strong>Discover</strong>, <strong>About Novellow</strong> and <strong>Settings</strong>.</p>
            <p>On a phone, tap the <strong>menu button</strong> (three lines) at the top of the screen to open that menu.</p>`
    },

    {
        q: "How do I add a book?",
        a: html`<p>Tap <strong>Add Book</strong> at the top of any page. Search by title or author and choose the right book, or tap <strong>Scan barcode</strong> and point your camera at the barcode on the back cover. You can also type the details in yourself and add your own cover picture.</p>`
    },

    {
        q: "How do I open a book's journal?",
        a: html`<p>On <strong>Home</strong>, tap a book's spine on the shelf: it slides out and opens its journal, where you keep notes, favourite passages, new words, characters and a review. You can also find any book in <strong>My Books</strong> and open it from there.</p>
            <p>The <strong>Journal</strong> page gathers your recent entries, with links to <strong>All quotes</strong> and <strong>The wordbook</strong>.</p>`
    },

    {
        q: "How do I make a new shelf?",
        a: html`<p>Go to <strong>My Books</strong> and tap <strong>Add a shelf</strong>. When you add or edit a book, you can choose which shelf it sits on.</p>`
    },

    {
        q: "How do I move books around on my shelves?",
        a: html`<p>On a phone or tablet, <strong>press and hold</strong> a book until it lifts off the shelf, then slide it to where you'd like it, on the same shelf or another one, and let go. Hold it near the top or bottom of the bookcase to scroll to shelves out of sight. On a computer, just drag it.</p>
            <p>Books stay where you put them when your shelves are in <strong>My own order</strong> (Settings → <strong>Arrange books on each shelf by</strong>). If they're sorted by title or author instead, Novellow will offer to switch, keeping every book where it is.</p>`
    },

    {
        q: "How do I look closer at my bookcase, or move it?",
        a: html`<p>The bookcase stands in your room like a piece of furniture. <strong>Tap it</strong> to step in close, so its spines are big and easy to read; tap a book to open it, or tap the room (or <strong>Step back</strong>) to see the whole room again. When it has more shelves than fit, scroll or swipe on it and the shelves slide up and down inside it, with the pieces on them.</p>
            <p>To move it, tap the <strong>paintbrush</strong> and drag the bookcase along the floor; the pieces on its shelves come with it. <strong>The room → Bookcase</strong> changes its wood or paint, and puts it back in its usual place. Each shelf can also have a style of its own in its shelf settings.</p>
            <p>A bookcase always stands whole, with at least three shelves showing (empty ones wait for new shelves); with more than three, its shelves slide. On a phone it stands beside the room, and a tap there looks closer too.</p>`
    },

    {
        q: "How do I decorate my room?",
        a: html`<p>Tap the <strong>paintbrush</strong> at the top of your home page. The panel has two parts. <strong>The room</strong> is the room itself: a whole collection in one tap, or the wallpaper, floor and rug, window and curtains, the view and weather outside (clear, rain or snow), the ceiling, the light, and the bookcase's wood or paint. Tap a heading to open it; it shows what's chosen now.</p>
            <p>The eight collections (Bookish whimsy, Cozy sage, Fireside library, Ink folklore, Snowy fairytale, Sugarplum pastel, Vintage woodland and Warm gouache) each have a wallpaper, a painted ceiling, a window whose view drifts past its panes, a bookcase, furniture and decorations (in Pieces → Collections, the first tile), and three book bindings (in each book's design).</p>
            <p><strong>Pieces</strong> are the things you place. Choose a kind (Furniture, Lights, Wall, Tabletop, Plants, Rugs or Friends) and, if you like, a style: Everyday, Autumn, Spooky or Holidays, where you can pick Christmas, Hanukkah, Harvest, Krampus, Kwanzaa, New Year, Winter or Yule. Or search for a piece by name. Friends has a sleeping cat and a sleeping dog: choose the cat, and the dog's breed and colouring, in <strong>Settings</strong>. For winter there are painted bookcases and snowy windows in The room, winter rugs in Rugs, and a <strong>Holiday</strong> group of bindings in each book's design.</p>
            <p>Tap a piece to add it, or drag it into the room. Drag any piece to move it, pull its corner handle to make it bigger or smaller, and its top handle to turn it. The little bar beside it flips it, copies it, brings it to the front or sends it behind, and removes it; <strong>More</strong> has buttons for fine changes. Undo and redo are at the top of the panel. Tap a snow globe to shake it (or shake your phone). Pieces can go anywhere on the wall, from one side of the room to the other and right up to the ceiling, and out across the floor. The bookcase, the window and the rug move the same way: just drag them. Tap <strong>Done</strong> when you're finished. To change the whole look at once, choose a different room from the <strong>moon</strong> button.</p>
            <p>For just the room, tap the <strong>frame</strong> button at the top of the page: the menus step aside and the floor runs deeper. The little bar in the corner brings the menus back.</p>
            <p>To save a picture of your bookcase and room, tap the <strong>camera</strong> at the top of the decorating panel. On a phone you can save it to your photos or share it straight away.</p>
            <p>On a phone, turn it sideways on Home to step into the whole room.</p>`
    },

    {
        q: "How do I turn on the room sounds?",
        a: html`<p>Tap the <strong>speaker</strong> button at the top of the page and choose the sounds you like, such as rain or a crackling fire, and how loud each one is.</p>`
    },

    {
        q: "How do I add friends or share my library?",
        a: html`<p>Go to <strong>Community</strong> and tap <strong>Add a friend</strong>. Under <strong>Who can visit my library</strong>, choose <strong>Only me</strong>, <strong>Friends</strong>, or <strong>Everyone</strong> (18 and over). Your journals stay private unless you choose to share them.</p>`
    },

    {
        q: "How do book clubs and buddy reads work?",
        a: html`<p>In <strong>Community</strong>, tap <strong>Start a book club</strong> or <strong>Start a buddy read</strong> and invite friends. In a buddy read, comments on chapters you haven't reached yet stay hidden, so nothing gets spoiled.</p>`
    },

    {
        q: "Where are my reading stats?",
        a: html`<p>Tap your name at the top right, then <strong>Reading stats</strong>. Reading goals and challenges are on the <strong>Challenges</strong> page.</p>`
    },

    {
        q: "How do I download or delete my library?",
        a: html`<p>Go to <strong>Settings</strong>. <strong>Download my library</strong> saves a copy of everything, and <strong>Delete my account</strong> removes your account and everything in it for good.</p>`
    },

    {
        q: "Something isn't working. What should I do?",
        a: html`<p>Send a note with <strong>Report a problem or share an idea</strong> on this page, or email <a href="mailto:novellow.contact@gmail.com">novellow.contact@gmail.com</a>. Leave "Include my browser and screen size" ticked: it helps find the problem faster.</p>`
    }

];


function stepsMarkup(device) {

    const guide =
        STEPS[device];

    return html`
        <div class="home-screen__panel" id="homeScreenSteps" role="tabpanel" aria-label="${guide.label}">
            <p class="home-screen__intro">${guide.intro}</p>
            <ol class="home-screen__steps">
                ${guide.steps.map((step) => html`<li>${step}</li>`)}
            </ol>
            <p class="home-screen__note">${guide.note}</p>
        </div>
    `;

}


export function helpSection(device = guessDevice()) {

    return html`
        <section class="about-card paper help-card" id="help" aria-labelledby="helpTitle">

            <p class="eyebrow">Help</p>
            <h2 id="helpTitle" class="about-card__title">Questions and answers</h2>

            <div class="home-screen">

                <h3 class="help-card__subtitle">Put Novellow on your home screen</h3>

                ${openedAsApp() ? html`
                    <p class="home-screen__done">You're already using Novellow as an app, so you're all set.</p>
                ` : html`
                    <p>Novellow works in your phone's browser, and you can add it to your home screen so it opens full screen, like an app.</p>

                    <div class="home-screen__tabs" role="tablist" aria-label="Your phone">
                        ${Object.entries(STEPS).map(([id, guide]) => html`
                            <button class="home-screen__tab ${id === device ? "is-current" : ""}" type="button" role="tab" aria-selected="${String(id === device)}" aria-controls="homeScreenSteps" data-home-screen="${id}">${guide.label}</button>
                        `)}
                    </div>

                    ${stepsMarkup(device)}
                `}

            </div>

            <h3 class="help-card__subtitle">Finding your way around</h3>

            <div class="faq">
                ${QUESTIONS.map((item) => html`
                    <details class="faq__item">
                        <summary>${item.q}</summary>
                        <div class="faq__answer">${item.a}</div>
                    </details>
                `)}
            </div>

        </section>
    `;

}


// Switching between iPhone and Android steps.
export function wireHelp(container) {

    container.addEventListener("click", (event) => {

        const tab =
            event.target.closest("[data-home-screen]");

        if (!tab) {
            return;
        }

        const card =
            tab.closest(".home-screen");

        card.querySelectorAll("[data-home-screen]").forEach((button) => {
            const current = button === tab;
            button.classList.toggle("is-current", current);
            button.setAttribute("aria-selected", String(current));
        });

        const panel =
            card.querySelector("#homeScreenSteps");

        const holder =
            document.createElement("div");

        render(holder, stepsMarkup(tab.dataset.homeScreen));

        panel.replaceWith(holder.firstElementChild);

    });

}
