/* =========================================================
   NOVELLOW
   APP SHELL

   Every page inside the library calls startApp(). It checks
   the session, loads the reader's profile and settings,
   applies their room theme, and builds the shared sidebar
   and header around the page's <main>.
========================================================= */

import { requireSession, signOut } from "../core/auth.js?v=__VERSION__";
import { loadSprite } from "../core/art.js?v=__VERSION__";

import {
    setUser,
    loadProfile,
    loadSettings,
    updateSettings,
    loadLibrary,
    getBooks,
    getShelf,
    searchJournal,
    events
} from "../core/store.js?v=__VERSION__";

import { html, raw, render, $, $all, initials, debounce, truncate } from "../core/helpers.js?v=__VERSION__";
import { friendlyDataError } from "../core/errors.js?v=__VERSION__";
import { art, toastError, loader } from "../core/ui.js?v=__VERSION__";
import { growIvy, recolorIvy } from "../room/ivy.js?v=__VERSION__";
import { startSoundscape, getSoundState } from "../sound/soundscape.js?v=__VERSION__";
import { mountMixer } from "../sound/mixer.js?v=__VERSION__";
import { THEMES, getTheme, applyAppearance, applyCachedAppearance } from "./themes.js?v=__VERSION__";


const COLLAPSE_KEY =
    "novellow-sidebar-collapsed";

const NAV = [
    { id: "home", href: "dashboard.html", label: "Home", art: "art-home" },
    { id: "books", href: "library.html", label: "My Books", art: "art-books" },
    { id: "reading", href: "reading.html", label: "Reading Now", art: "art-reading" },
    { id: "tbr", href: "library.html?status=want_to_read", label: "To Be Read", art: "art-tbr" },
    { id: "community", href: "community.html", label: "Community", art: "art-community" },
    { id: "challenges", href: "challenges.html", label: "Challenges", art: "art-challenge" },
    { id: "journal", href: "journal.html", label: "Journal", art: "art-journal" },
    { id: "discover", href: "discover.html", label: "Discover", art: "art-discover" },
    { divider: true },
    { id: "settings", href: "settings.html", label: "Settings", art: "art-settings" }
];


let session = null;
let profile = null;


/* =========================================================
   START
========================================================= */

export async function startApp({ page, eyebrow = "My Library" }) {

    applyCachedAppearance();

    const sprite =
        loadSprite();

    try {

        session =
            await requireSession();

        setUser(session.user.id);

        const [loadedProfile, settings] =
            await Promise.all([
                loadProfile(),
                loadSettings(),
                sprite
            ]);

        profile = loadedProfile;

        applyAppearance(settings);

        buildShell(page, eyebrow);

        finishBoot();

        return { session, profile, settings };

    }

    catch (error) {

        showBootError(error);

        throw error;

    }

}


function finishBoot() {

    const boot =
        document.getElementById("boot");

    if (boot) {

        boot.classList.add("is-done");

        window.setTimeout(() => boot.remove(), 450);

    }

}


function showBootError(error) {

    console.error(error);

    const boot =
        document.getElementById("boot");

    if (!boot) {
        return;
    }

    render(boot, html`
        <div class="empty-state">
            ${art("ui-alert", "empty-state__art")}
            <h2>The library door is stuck</h2>
            <p>${friendlyDataError(error, "Novellow couldn't open your library just now.")}</p>
            <button class="button button--primary" type="button" onclick="location.reload()">Try again</button>
            <a class="text-button" href="index.html">Go to the entrance</a>
        </div>
    `);

}


/* =========================================================
   BUILD
========================================================= */

function buildShell(page, eyebrow) {

    const main =
        document.getElementById("main");

    const collapsed =
        localStorage.getItem(COLLAPSE_KEY) === "true";

    document.body.classList.toggle("sidebar-collapsed", collapsed);

    const shell =
        document.createElement("div");

    render(shell, html`
        <a class="skip-link" href="#main">Skip to content</a>

        <div class="mobile-overlay" id="mobileOverlay" aria-hidden="true"></div>

        ${sidebarMarkup(page, collapsed)}

        <div class="app-stage" id="appStage">
            ${headerMarkup(eyebrow)}
        </div>
    `);

    document.body.prepend(...shell.childNodes);

    const stage =
        document.getElementById("appStage");

    stage.appendChild(main);

    main.hidden = false;
    main.tabIndex = -1;

    growIvy(document.querySelector(".library-sidebar"));

    // Vines take on each room's own leaves.
    document.addEventListener("novellow:appearance", () => recolorIvy());

    wireSidebar();
    wireSearch();
    wirePopovers();
    wireSound();
    measureHeader();

    document.addEventListener("novellow:user-updated", async () => {

        profile = await loadProfile();

        refreshNames();

    });

    events.addEventListener("profile-changed", (event) => {

        profile = event.detail.profile;

        refreshNames();

    });

}


function sidebarMarkup(page, collapsed) {

    return html`
        <aside class="library-sidebar ${collapsed ? "is-collapsed" : ""}" id="sidebar" aria-label="Library navigation">

            <div class="sidebar-panel" aria-hidden="true"></div>

            <svg class="ivy ivy--sidebar-right" viewBox="0 0 60 700" preserveAspectRatio="xMidYMin slice" data-seed="11" data-density="22" data-leaf-size="0.7" aria-hidden="true">
                <path class="ivy-stem" d="M40 0C52 60 30 120 44 190C56 250 34 310 42 380C50 450 36 520 46 600C50 640 44 670 40 700" />
            </svg>

            <svg class="ivy ivy--sidebar-left" viewBox="0 0 60 420" data-seed="23" data-density="22" data-leaf-size="0.7" aria-hidden="true">
                <path class="ivy-stem" d="M14 420C4 360 26 320 16 260C6 200 24 150 18 90C14 60 20 30 26 0" />
            </svg>

            <div class="sidebar-brand">

                <a class="brand-logo" href="dashboard.html" aria-label="Novellow — home">
                    <svg class="brand-logo__art" viewBox="0 0 240 210" aria-hidden="true"><use href="#brand-logo"></use></svg>
                    <svg class="brand-logo__emblem" viewBox="0 0 120 90" aria-hidden="true"><use href="#brand-emblem"></use></svg>
                </a>

                <svg class="ivy ivy--garland" viewBox="0 0 220 40" data-seed="5" data-density="16" data-leaf-size="0.55" aria-hidden="true">
                    <path class="ivy-stem" d="M6 12C40 30 80 34 110 26C140 18 180 22 214 10" />
                </svg>

            </div>

            <nav class="sidebar-nav" aria-label="Main">
                ${NAV.map((item) => item.divider
                    ? html`<div class="sidebar-divider" role="separator"></div>`
                    : html`
                        <a class="sidebar-link ${item.id === page ? "is-active" : ""}" href="${item.href}" ${item.id === page ? raw('aria-current="page"') : ""}>
                            <span class="sidebar-link__icon">
                                <svg class="nav-art" aria-hidden="true"><use href="#${item.art}"></use></svg>
                            </span>
                            <span class="sidebar-link__text">${item.label}</span>
                        </a>
                    `)}
            </nav>

            <a class="sidebar-user" href="settings.html">
                <span class="avatar" data-avatar>${initials(profile?.display_name)}</span>
                <span class="sidebar-user__text">
                    <strong data-display-name>${profile?.display_name || "Reader"}</strong>
                    <span>My library</span>
                </span>
            </a>

            <button class="sidebar-collapse" id="sidebarCollapse" type="button" aria-label="${collapsed ? "Expand sidebar" : "Collapse sidebar"}" aria-expanded="${String(!collapsed)}">
                <svg aria-hidden="true"><use href="#ui-chevron-left"></use></svg>
            </button>

        </aside>
    `;

}


function headerMarkup(eyebrow) {

    return html`
        <header class="scene-header">

            <button class="icon-button mobile-menu" id="menuButton" type="button" aria-label="Open navigation" aria-controls="sidebar" aria-expanded="false">
                <svg aria-hidden="true"><use href="#art-books"></use></svg>
            </button>

            <div class="greeting">
                <span class="greeting__eyebrow">${eyebrow}</span>
                <span class="greeting__title">Welcome back, <span data-display-name>${profile?.display_name || "Reader"}</span></span>
            </div>

            <div class="header-spacer"></div>

            <div class="header-search" id="headerSearch">

                <label class="library-search">
                    <span class="visually-hidden">Search your library</span>
                    <svg aria-hidden="true"><use href="#ui-search"></use></svg>
                    <input id="librarySearch" type="search" placeholder="Search your library…" autocomplete="off" aria-controls="searchResults" aria-expanded="false">
                </label>

                <div class="search-results paper" id="searchResults" role="region" aria-label="Search results" hidden></div>

            </div>

            <div class="header-tools">

                <button class="button button--brass header-add" id="headerAddBook" type="button" aria-label="Add a book">
                    <svg aria-hidden="true"><use href="#ui-add"></use></svg>
                    <span>Add Book</span>
                </button>

                <div class="popover-anchor">

                    <button class="icon-button sound-button" type="button" data-popover="soundPopover" aria-expanded="false" aria-label="Room sounds">
                        <svg aria-hidden="true"><use href="#ui-sound-off"></use></svg>
                    </button>

                    <div class="popover paper mixer" id="soundPopover" hidden>
                        <p class="popover-heading">Sounds of the room</p>
                        <div data-sound-mixer></div>
                    </div>

                </div>

                <div class="popover-anchor">

                    <button class="icon-button" type="button" data-popover="themePopover" aria-expanded="false" aria-label="Change the room's theme">
                        <svg aria-hidden="true"><use href="#ui-moon"></use></svg>
                    </button>

                    <div class="popover paper" id="themePopover" hidden>
                        <p class="popover-heading">Choose a room</p>
                        <div data-theme-list></div>
                        <div class="popover-divider" role="separator"></div>
                        <button class="popover-item" type="button" data-arrange-room>
                            <svg aria-hidden="true"><use href="#ui-brush"></use></svg>
                            Arrange the room
                        </button>
                    </div>

                </div>

                <div class="popover-anchor">

                    <button class="profile-button" type="button" data-popover="profilePopover" aria-expanded="false" aria-label="Your profile">
                        <span class="avatar" data-avatar>${initials(profile?.display_name)}</span>
                        <span class="profile-button__name" data-display-name>${profile?.display_name || "Reader"}</span>
                        <svg aria-hidden="true"><use href="#ui-chevron-down"></use></svg>
                    </button>

                    <div class="popover paper" id="profilePopover" hidden>
                        <p class="popover-heading">${session?.user?.email || ""}</p>
                        <a class="popover-item" href="settings.html">
                            <svg aria-hidden="true"><use href="#art-settings"></use></svg>
                            Settings
                        </a>
                        <a class="popover-item" href="stats.html">
                            <svg aria-hidden="true"><use href="#art-challenge"></use></svg>
                            Reading stats
                        </a>
                        <button class="popover-item" type="button" data-sign-out>
                            <svg aria-hidden="true"><use href="#ui-door"></use></svg>
                            Sign out
                        </button>
                    </div>

                </div>

            </div>

        </header>
    `;

}


function refreshNames() {

    $all("[data-display-name]").forEach((node) => {
        node.textContent = profile?.display_name || "Reader";
    });

    $all("[data-avatar]").forEach((node) => {
        node.textContent = initials(profile?.display_name);
    });

}


/* =========================================================
   SIDEBAR
========================================================= */

/*
    The top bar's real height (it wraps onto two lines on some
    screens), so the reading room can fill exactly the rest of
    the window.
*/

function measureHeader() {

    const header =
        document.querySelector(".scene-header");

    if (!header || !("ResizeObserver" in window)) {
        return;
    }

    new ResizeObserver(() => {
        document.documentElement.style.setProperty("--header-h", `${Math.ceil(header.offsetHeight)}px`);
    }).observe(header);

}


function wireSidebar() {

    const sidebar = $("#sidebar");
    const overlay = $("#mobileOverlay");
    const menuButton = $("#menuButton");
    const collapse = $("#sidebarCollapse");

    collapse.addEventListener("click", () => {

        const collapsed =
            sidebar.classList.toggle("is-collapsed");

        document.body.classList.toggle("sidebar-collapsed", collapsed);

        collapse.setAttribute("aria-expanded", String(!collapsed));
        collapse.setAttribute("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar");

        localStorage.setItem(COLLAPSE_KEY, String(collapsed));

        document.dispatchEvent(new CustomEvent("novellow:layout"));

    });

    const closeDrawer = () => {

        sidebar.classList.remove("is-open");
        overlay.classList.remove("is-active");

        menuButton.setAttribute("aria-expanded", "false");

    };

    menuButton.addEventListener("click", () => {

        sidebar.classList.add("is-open");
        overlay.classList.add("is-active");

        menuButton.setAttribute("aria-expanded", "true");

        sidebar.querySelector(".sidebar-link")?.focus();

    });

    overlay.addEventListener("click", closeDrawer);

    document.addEventListener("keydown", (event) => {

        if (event.key === "Escape") {
            closeDrawer();
        }

    });

    $("#headerAddBook").addEventListener("click", async () => {

        try {

            const { openBookEditor } =
                await import("../books/book-editor.js?v=__VERSION__");

            openBookEditor();

        }

        catch (error) {
            toastError(error);
        }

    });

}


/* =========================================================
   SOUND
   The header button shows whether sound is on; its menu
   holds the mixer (js/sound/mixer.js).
========================================================= */

function wireSound() {

    const button =
        $(".sound-button");

    const show = () => {

        const { on } =
            getSoundState();

        button.querySelector("use").setAttribute("href", on ? "#ui-sound" : "#ui-sound-off");
        button.setAttribute("aria-label", on ? "Room sounds (on)" : "Room sounds (off)");
        button.classList.toggle("is-on", on);

    };

    mountMixer($("[data-sound-mixer]"));

    startSoundscape();

    show();

    document.addEventListener("novellow:sound", show);

}


/* =========================================================
   POPOVERS (theme picker, profile menu)
========================================================= */

function wirePopovers() {

    const closeAll = (except) => {

        $all("[data-popover]").forEach((button) => {

            if (button.dataset.popover !== except) {

                button.setAttribute("aria-expanded", "false");

                document.getElementById(button.dataset.popover).hidden = true;

            }

        });

    };

    $all("[data-popover]").forEach((button) => {

        button.addEventListener("click", (event) => {

            event.stopPropagation();

            const popover =
                document.getElementById(button.dataset.popover);

            const opening =
                popover.hidden;

            closeAll(button.dataset.popover);

            popover.hidden = !opening;

            button.setAttribute("aria-expanded", String(opening));

            if (opening && button.dataset.popover === "themePopover") {
                renderThemeList();
            }

            if (opening) {
                popover.querySelector("a, button, input")?.focus();
            }

        });

    });

    document.addEventListener("click", (event) => {

        if (!event.target.closest(".popover")) {
            closeAll();
        }

    });

    document.addEventListener("keydown", (event) => {

        if (event.key === "Escape") {
            closeAll();
        }

    });

    $("[data-sign-out]").addEventListener("click", () => signOut());

    // Decorations are arranged on the library room (dashboard).
    $("[data-arrange-room]").addEventListener("click", () => {

        if (document.body.dataset.page === "home" || document.querySelector(".library-room")) {
            document.dispatchEvent(new CustomEvent("novellow:arrange"));
            $("#themePopover").hidden = true;
            $("[data-popover=themePopover]").setAttribute("aria-expanded", "false");
        }

        else {
            window.location.href = "dashboard.html?arrange=1";
        }

    });

}


function renderThemeList() {

    const list =
        $("[data-theme-list]");

    const current =
        document.documentElement.dataset.theme;

    render(list, THEMES.map((theme) => html`
        <button class="popover-item ${theme.id === current ? "is-current" : ""}" type="button" data-theme-id="${theme.id}" aria-pressed="${String(theme.id === current)}">
            <span class="theme-swatch" aria-hidden="true">
                ${theme.swatch.map((color) => html`<span style="background: ${color}"></span>`)}
            </span>
            ${theme.name}
        </button>
    `));

    list.onclick = async (event) => {

        const choice =
            event.target.closest("[data-theme-id]");

        if (!choice) {
            return;
        }

        try {

            const settings =
                await updateSettings({ theme: choice.dataset.themeId });

            applyAppearance(settings);

            renderThemeList();

        }

        catch (error) {
            toastError(error, "The room couldn't be changed just now.");
        }

    };

}


/* =========================================================
   SEARCH
   Books (title, author, genre, shelf) are searched in the
   loaded library; notes, quotes and words in Supabase.
========================================================= */

function wireSearch() {

    const input = $("#librarySearch");
    const results = $("#searchResults");
    const box = $("#headerSearch");

    let libraryReady = null;
    let latest = "";

    const ensureLibrary = () => {
        libraryReady ||= loadLibrary().catch((error) => toastError(error));
        return libraryReady;
    };

    const close = () => {
        results.hidden = true;
        input.setAttribute("aria-expanded", "false");
    };

    const run = debounce(async () => {

        const term =
            input.value.trim();

        latest = term;

        document.dispatchEvent(new CustomEvent("novellow:search", { detail: { term } }));

        if (term.length < 2) {
            close();
            return;
        }

        await ensureLibrary();

        const lower =
            term.toLowerCase();

        const books =
            getBooks()
                .filter((book) => [
                    book.title,
                    book.author,
                    book.genre,
                    book.series,
                    getShelf(book.shelf_id)?.name
                ].some((value) => (value || "").toLowerCase().includes(lower)))
                .slice(0, 8);

        render(results, html`
            ${searchGroup("Books", books.map((book) => ({
                href: `journal.html?book=${book.id}`,
                art: "tab-overview",
                title: book.title,
                detail: [book.author, getShelf(book.shelf_id)?.name].filter(Boolean).join(" · ")
            })))}
            ${term.length >= 3 ? html`<div class="search-group" data-journal-results>${loader("Turning pages…")}</div>` : ""}
            ${!books.length && term.length < 3 ? html`<p class="search-empty">No books match “${term}” yet.</p>` : ""}
        `);

        results.hidden = false;
        input.setAttribute("aria-expanded", "true");

        if (term.length < 3) {
            return;
        }

        try {

            const found =
                await searchJournal(term);

            if (latest !== term) {
                return;
            }

            const holder =
                results.querySelector("[data-journal-results]");

            render(holder, html`
                ${searchGroup("Quotes", found.quotes.map((quote) => ({
                    href: `journal.html?book=${quote.book?.id}&tab=quotes`,
                    art: "tab-quotes",
                    title: `“${truncate(quote.text, 80)}”`,
                    detail: quote.book?.title
                })))}
                ${searchGroup("Words", found.words.map((word) => ({
                    href: `journal.html?book=${word.book?.id}&tab=words`,
                    art: "tab-words",
                    title: word.word,
                    detail: [truncate(word.definition, 60), word.book?.title].filter(Boolean).join(" · ")
                })))}
                ${searchGroup("Notes & thoughts", found.entries.map((entry) => ({
                    href: `journal.html?book=${entry.book?.id}&tab=${entry.kind === "thought" ? "thoughts" : "notes"}`,
                    art: entry.kind === "thought" ? "tab-thoughts" : "tab-notes",
                    title: entry.title || truncate(entry.body, 70),
                    detail: entry.book?.title
                })))}
                ${!books.length && !found.quotes.length && !found.words.length && !found.entries.length
                    ? html`<p class="search-empty">Nothing in your library matches “${term}”.</p>`
                    : ""}
            `);

        }

        catch (error) {

            console.error(error);

            const holder =
                results.querySelector("[data-journal-results]");

            if (holder) {
                holder.innerHTML = "";
            }

        }

    }, 220);

    input.addEventListener("focus", ensureLibrary);
    input.addEventListener("input", run);

    input.addEventListener("keydown", (event) => {

        if (event.key === "Escape") {

            input.value = "";

            run();
            close();

        }

        if (event.key === "ArrowDown") {

            event.preventDefault();

            results.querySelector("a")?.focus();

        }

    });

    document.addEventListener("click", (event) => {

        if (!box.contains(event.target)) {
            close();
        }

    });

}


function searchGroup(title, items) {

    if (!items.length) {
        return "";
    }

    return html`
        <div class="search-group">
            <p class="search-group__title">${title}</p>
            ${items.map((item) => html`
                <a class="search-result" href="${item.href}">
                    ${art(item.art, "search-result__art")}
                    <span>
                        <strong>${item.title}</strong>
                        ${item.detail ? html`<small>${item.detail}</small>` : ""}
                    </span>
                </a>
            `)}
        </div>
    `;

}


export function currentProfile() {
    return profile;
}


export function currentThemeInfo() {
    return getTheme(document.documentElement.dataset.theme);
}
