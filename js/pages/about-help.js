/* =========================================================
   NOVELLOW
   HELP ON THE ABOUT PAGE

   Putting Novellow on a phone's home screen (with steps for
   iPhone and iPad, and for Android), and answers to the
   questions readers ask about finding their way around.
========================================================= */

import { html, render } from "../core/helpers.js?v=__VERSION__";


// Which set of home-screen steps to show first.
function guessDevice() {

    const agent =
        navigator.userAgent || "";

    const apple =
        /iPhone|iPad|iPod/.test(agent) || (/Macintosh/.test(agent) && navigator.maxTouchPoints > 1);

    return apple ? "apple" : "android";

}


// Already opened from the home screen?
function fromHomeScreen() {
    return window.matchMedia?.("(display-mode: standalone)").matches || navigator.standalone === true;
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
        q: "How do I decorate my room?",
        a: html`<p>Tap the <strong>moon</strong> button at the top of the page. Choose a room to change the whole look, or tap <strong>Edit the room</strong> to add furniture and decorations. Drag pieces where you'd like them, tap one to resize, tilt or remove it, and tap <strong>Done</strong> when you're finished. Pieces can go anywhere on the wall, right up to the ceiling, and out across the floor.</p>
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

                ${fromHomeScreen() ? html`
                    <p class="home-screen__done">You're already using Novellow from your home screen.</p>
                ` : html`
                    <p>Novellow works in your phone's browser, and you can add it to your home screen so it opens full screen, like an app. Nothing to download from an app store.</p>

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
