/* =========================================================
   NOVELLOW
   COMMUNITY (community.html)

   Friends, shared shelves, book clubs and buddy reads.

     community.html              friends, requests, groups
     community.html?friend=ID    a friend's shelves (read only)
     community.html?group=ID     a book club or buddy read

   Libraries are private until the reader turns sharing on,
   and then only friends can look. Journals, notes, quotes and
   words are never shared. The database enforces all of this
   (sql/community.sql); this page only shows what it's given.
========================================================= */

import { startApp, showCommunityBadge } from "../shell/app-shell.js?v=__VERSION__";
import { loadLibrary, getBooks, getProfile, updateProfile } from "../core/store.js?v=__VERSION__";

import {
    loadFriends,
    sendFriendRequest,
    acceptFriendRequest,
    removeFriendship,
    loadFriendLibrary,
    loadFriendReview,
    loadGroups,
    loadGroup,
    createGroup,
    updateGroup,
    deleteGroup,
    inviteToGroup,
    joinGroup,
    removeMember,
    setMyChapter,
    listPosts,
    waitingComments,
    addPost,
    deletePost
} from "../core/community.js?v=__VERSION__";

import { html, render, on, plural, initials, formatDate, formatDateTime, queryParam, seededRandom, textOrNull, intOrNull, debounce } from "../core/helpers.js?v=__VERSION__";
import { art, loader, emptyState, toast, toastError, confirmDialog, formDialog, withBusy } from "../core/ui.js?v=__VERSION__";
import { friendlyDataError } from "../core/errors.js?v=__VERSION__";
import { ratingMarkup } from "../core/rating.js?v=__VERSION__";
import { coverUrls } from "../core/covers.js?v=__VERSION__";
import { coverMarkup } from "../books/cover.js?v=__VERSION__";
import { spineMarkup, fitSpineTitles } from "../books/spine.js?v=__VERSION__";
import { packRows } from "../books/bookcase.js?v=__VERSION__";
import { READING_STATUSES } from "../config.js?v=__VERSION__";


const content =
    document.getElementById("pageContent");

const AVATAR_COLORS =
    ["#74485c", "#5d6f4e", "#8a5a3c", "#4f6278", "#7a4b6e", "#6b5a3a", "#8b4a4a", "#3f6660"];

let friends = { friends: [], incoming: [], outgoing: [] };
let groups = [];


/* =========================================================
   SMALL PIECES
========================================================= */

function avatar(person, size = "medium") {

    const random =
        seededRandom(person?.id || "reader");

    const color =
        AVATAR_COLORS[Math.floor(random() * AVATAR_COLORS.length)];

    return html`<span class="reader-avatar reader-avatar--${size}" style="--avatar: ${color}" aria-hidden="true">${initials(person?.display_name || "Reader")}</span>`;

}


function handle(person) {
    return person?.username ? html`<span class="reader-handle">@${person.username}</span>` : "";
}


function nameOf(person, me) {
    return person?.id === me ? "You" : (person?.display_name || "A reader");
}


function statusLabel(id) {
    return READING_STATUSES.find((status) => status.id === id)?.label || "";
}


// Paragraphs from plain text, safely escaped.
function paragraphs(text) {

    return String(text || "")
        .split(/\n{2,}/)
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => html`<p>${part}</p>`);

}


function groupBook(group) {
    return html`<em>${group.book_title}</em>${group.book_author ? html` by ${group.book_author}` : ""}`;
}


function notSetUp(error) {

    // The community tables haven't been created yet.
    return ["42P01", "PGRST205", "PGRST202", "42883", "PGRST200"].includes(error?.code)
        && /reading_groups|friendships|group_members|group_posts|send_friend_request|schema cache|does not exist/i
            .test(`${error?.message || ""} ${error?.details || ""} ${error?.hint || ""}`);

}


function setupNeeded() {

    return html`
        <div class="page-heading">
            <div>
                <h1 class="page-heading__title">Community</h1>
                <p class="page-heading__subtitle">Friends, book clubs and buddy reads.</p>
            </div>
        </div>
        ${emptyState({
            symbol: "art-community",
            title: "The reading room is almost ready",
            text: "Community needs one more step in Supabase: run sql/community.sql in the SQL Editor (see docs/SETUP.md), then reload this page."
        })}
    `;

}


/* =========================================================
   START
========================================================= */

async function start() {

    await startApp({ page: "community", eyebrow: "Community" });

    render(content, loader("Opening the reading room…"));

    const friendId =
        queryParam("friend");

    const groupId =
        queryParam("group");

    try {

        if (friendId) {
            await showFriend(friendId);
        }

        else if (groupId) {
            await showGroup(groupId);
        }

        else {
            await showHub();
        }

    }

    catch (error) {

        console.error(error);

        if (notSetUp(error)) {
            render(content, setupNeeded());
            return;
        }

        render(content, emptyState({
            symbol: "ui-alert",
            title: "The reading room door is stuck",
            text: friendlyDataError(error, "Novellow couldn't open Community just now."),
            actionLabel: "Back to Community",
            href: "community.html"
        }));

    }

}


/* =========================================================
   THE HUB
========================================================= */

async function refreshHub() {

    [friends, groups] =
        await Promise.all([loadFriends(), loadGroups()]);

    const covers =
        friends.friends.flatMap((entry) => (entry.reading || []).map((book) => book.cover_path));

    await coverUrls(covers.filter(Boolean)).catch(() => {});

    renderHub();

    showCommunityBadge();

}


async function showHub() {

    await refreshHub();

    wireHub();

}


function renderHub() {

    const me =
        getProfile();

    const invitations =
        groups.filter((group) => group.mine?.status === "invited");

    const joined =
        groups.filter((group) => group.mine?.status === "joined");

    const clubs =
        joined.filter((group) => group.kind === "club");

    const buddies =
        joined.filter((group) => group.kind === "buddy");

    const waiting =
        friends.incoming.length + invitations.length;

    render(content, html`

        <div class="page-heading">
            <div>
                <h1 class="page-heading__title">Community</h1>
                <p class="page-heading__subtitle">Friends, book clubs and buddy reads.</p>
            </div>
            <div class="page-heading__actions">
                <button class="button button--brass" type="button" data-action="add-friend">${art("ui-add")} Add a friend</button>
                <button class="button button--ghost" type="button" data-action="new-club">Start a book club</button>
                <button class="button button--ghost" type="button" data-action="new-buddy">Start a buddy read</button>
            </div>
        </div>

        <div class="community-layout">

            <div class="stack">

                ${waiting ? html`
                    <section class="community-card paper community-waiting" aria-labelledby="waitingTitle">
                        <h2 class="section-title" id="waitingTitle">Waiting for you</h2>
                        <ul class="community-list">
                            ${friends.incoming.map((entry) => html`
                                <li class="community-row">
                                    ${avatar(entry.person)}
                                    <div class="community-row__text">
                                        <strong>${entry.person.display_name}</strong> ${handle(entry.person)}
                                        <span class="muted">wants to be friends</span>
                                    </div>
                                    <div class="community-row__actions">
                                        <button class="button button--primary button--small" type="button" data-action="accept-friend" data-id="${entry.id}">Accept</button>
                                        <button class="button button--ghost button--small" type="button" data-action="decline-friend" data-id="${entry.id}">Decline</button>
                                    </div>
                                </li>
                            `)}
                            ${invitations.map((group) => html`
                                <li class="community-row">
                                    <span class="community-row__badge">${art(group.kind === "club" ? "art-community" : "art-reading")}</span>
                                    <div class="community-row__text">
                                        <strong>${group.name}</strong>
                                        <span class="muted">
                                            ${group.invitedBy ? `${group.invitedBy.display_name} invited you to ` : "You're invited to "}
                                            ${group.kind === "club" ? "a book club" : "a buddy read"} for ${groupBook(group)}
                                        </span>
                                    </div>
                                    <div class="community-row__actions">
                                        <button class="button button--primary button--small" type="button" data-action="join-group" data-id="${group.id}">Join</button>
                                        <button class="button button--ghost button--small" type="button" data-action="decline-group" data-id="${group.id}">No thanks</button>
                                    </div>
                                </li>
                            `)}
                        </ul>
                    </section>
                ` : ""}

                <section class="community-card paper" aria-labelledby="friendsTitle">

                    <div class="community-card__head">
                        <h2 class="section-title" id="friendsTitle">Friends</h2>
                        ${friends.friends.length ? html`<span class="muted">${plural(friends.friends.length, "friend")}</span>` : ""}
                    </div>

                    ${friends.friends.length ? html`
                        <ul class="friend-grid">
                            ${friends.friends.map((entry) => friendCard(entry))}
                        </ul>
                    ` : html`
                        <div class="community-empty">
                            ${art("art-community", "community-empty__art")}
                            <p>No friends here yet. Ask a friend for their Novellow username, or share yours${me?.username ? html`: <strong>@${me.username}</strong>` : ""}.</p>
                            <button class="button button--brass button--small" type="button" data-action="add-friend">Add a friend</button>
                        </div>
                    `}

                    ${friends.outgoing.length ? html`
                        <div class="community-sent">
                            <p class="eyebrow">Requests you've sent</p>
                            <ul class="community-list community-list--compact">
                                ${friends.outgoing.map((entry) => html`
                                    <li class="community-row">
                                        ${avatar(entry.person, "small")}
                                        <div class="community-row__text">
                                            <strong>${entry.person.display_name}</strong> ${handle(entry.person)}
                                            <span class="muted">waiting since ${formatDate(entry.since)}</span>
                                        </div>
                                        <button class="button button--ghost button--small" type="button" data-action="cancel-friend" data-id="${entry.id}">Cancel</button>
                                    </li>
                                `)}
                            </ul>
                        </div>
                    ` : ""}

                </section>

                ${groupSection("Book clubs", "clubsTitle", clubs, "club")}

                ${groupSection("Buddy reads", "buddyTitle", buddies, "buddy")}

            </div>

            <aside class="stack">
                ${readerCard(me)}
                <section class="community-card paper community-privacy">
                    <h2 class="section-title">What friends can see</h2>
                    <ul class="stat-list">
                        <li><span>Your shelves, books and ratings</span><span>${me?.library_visibility === "friends" ? "Friends" : "Only you"}</span></li>
                        <li><span>Your reviews</span><span>${me?.library_visibility === "friends" ? "Friends" : "Only you"}</span></li>
                        <li><span>Journals, notes, quotes and words</span><span>Only you, always</span></li>
                    </ul>
                </section>
            </aside>

        </div>

    `);

}


function readerCard(me) {

    const sharing =
        me?.library_visibility === "friends";

    return html`
        <section class="community-card paper reader-card" aria-labelledby="meTitle">

            <div class="reader-card__top">
                ${avatar(me, "large")}
                <div>
                    <h2 id="meTitle">${me?.display_name || "Reader"}</h2>
                    ${me?.username ? handle(me) : html`<span class="muted">No username yet</span>`}
                </div>
            </div>

            ${me?.bio ? html`<p class="reader-card__bio">${me.bio}</p>` : ""}

            ${me?.username ? "" : html`
                <p class="reader-card__nudge">Choose a username so friends can find you.</p>
            `}

            <label class="toggle reader-card__share">
                <span class="toggle__text">
                    <strong>Share my shelves with friends</strong>
                    <small>${sharing ? "Friends can visit your bookcase and read your reviews." : "Your bookcase is private."}</small>
                </span>
                <input type="checkbox" data-action="toggle-sharing" ${sharing ? html`checked` : ""}>
            </label>

            <button class="button button--ghost button--small" type="button" data-action="edit-profile">
                ${me?.username ? "Edit my reader card" : "Choose a username"}
            </button>

        </section>
    `;

}


function friendCard(entry) {

    const person =
        entry.person;

    const sharing =
        person.library_visibility === "friends";

    const reading =
        entry.reading || [];

    return html`
        <li class="friend-card">

            <div class="friend-card__top">
                ${avatar(person)}
                <div class="friend-card__name">
                    <strong>${person.display_name}</strong>
                    ${handle(person)}
                </div>
                <button class="icon-button friend-card__more" type="button" data-action="remove-friend" data-id="${entry.id}" data-name="${person.display_name}" aria-label="Remove ${person.display_name} as a friend" title="Remove friend">
                    ${art("ui-close")}
                </button>
            </div>

            ${person.bio ? html`<p class="friend-card__bio">${person.bio}</p>` : ""}

            ${sharing ? html`
                ${reading.length ? html`
                    <div class="friend-card__reading">
                        <span class="eyebrow">Reading now</span>
                        ${reading.slice(0, 2).map((book) => html`
                            <span class="friend-card__book">
                                <em>${book.title}</em>
                                ${book.page_count ? html`<span class="muted">p. ${book.current_page} of ${book.page_count}</span>` : ""}
                            </span>
                        `)}
                    </div>
                ` : html`<p class="muted friend-card__quiet">Between books right now.</p>`}
                <a class="button button--brass button--small" href="community.html?friend=${person.id}">Visit their shelves</a>
            ` : html`
                <p class="muted friend-card__quiet">Keeps their shelves private.</p>
            `}

        </li>
    `;

}


function groupSection(title, id, list, kind) {

    return html`
        <section class="community-card paper" aria-labelledby="${id}">

            <div class="community-card__head">
                <h2 class="section-title" id="${id}">${title}</h2>
                <button class="button button--ghost button--small" type="button" data-action="${kind === "club" ? "new-club" : "new-buddy"}">${art("ui-add")} ${kind === "club" ? "New club" : "New buddy read"}</button>
            </div>

            ${list.length ? html`
                <ul class="group-grid">
                    ${list.map((group) => groupCard(group))}
                </ul>
            ` : html`
                <p class="muted community-card__hint">
                    ${kind === "club"
                        ? "Gather a few friends around one book and talk it over in one thread."
                        : "Read a book alongside a friend, chapter by chapter. Their thoughts on a chapter stay hidden until you get there."}
                </p>
            `}

        </section>
    `;

}


function groupCard(group) {

    const joined =
        group.members.filter((member) => member.status === "joined");

    return html`
        <li>
            <a class="group-card" href="community.html?group=${group.id}">
                <span class="group-card__kind">${group.kind === "club" ? "Book club" : "Buddy read"}</span>
                <strong class="group-card__name">${group.name}</strong>
                <span class="group-card__book">${groupBook(group)}</span>

                ${group.kind === "buddy" ? html`
                    <span class="group-card__progress">
                        ${joined.map((member) => html`
                            <span class="mini-progress" title="${member.person.display_name}: chapter ${member.current_chapter} of ${group.chapter_count}">
                                ${avatar(member.person, "tiny")}
                                <span class="mini-progress__bar"><span style="width: ${Math.round((member.current_chapter / group.chapter_count) * 100)}%"></span></span>
                            </span>
                        `)}
                    </span>
                ` : html`
                    <span class="group-card__faces">
                        ${joined.slice(0, 6).map((member) => avatar(member.person, "tiny"))}
                        <span class="muted">${plural(joined.length, "member")}</span>
                    </span>
                `}
            </a>
        </li>
    `;

}


function wireHub() {

    on(content, "click", "[data-action]", async (event, target) => {

        const action =
            target.dataset.action;

        const id =
            target.dataset.id;

        if (action === "toggle-sharing") {
            return;
        }

        try {

            if (action === "add-friend") {
                await addFriendDialog();
            }

            if (action === "edit-profile") {
                await profileDialog();
            }

            if (action === "new-club" || action === "new-buddy") {

                const created =
                    await groupDialog(action === "new-club" ? "club" : "buddy");

                if (created) {
                    window.location.href = `community.html?group=${created}`;
                }

                return;

            }

            if (action === "accept-friend") {
                await withBusy(target, "…", () => acceptFriendRequest(id));
                toast("You're friends now.", { tone: "success" });
            }

            if (action === "decline-friend" || action === "cancel-friend") {
                await withBusy(target, "…", () => removeFriendship(id));
            }

            if (action === "remove-friend") {

                const sure =
                    await confirmDialog({
                        title: `Remove ${target.dataset.name}?`,
                        message: "You'll stop seeing each other's shelves. Any clubs and buddy reads you share stay as they are.",
                        confirmLabel: "Remove friend",
                        tone: "danger"
                    });

                if (!sure) {
                    return;
                }

                await removeFriendship(id);

            }

            if (action === "join-group") {
                await withBusy(target, "…", () => joinGroup(id));
                window.location.href = `community.html?group=${id}`;
                return;
            }

            if (action === "decline-group") {
                await withBusy(target, "…", () => removeMember(id, getProfile().id));
            }

            await refreshHub();

        }

        catch (error) {
            toastError(error);
        }

    });

    content.addEventListener("change", async (event) => {

        const toggle =
            event.target.closest("[data-action=toggle-sharing]");

        if (!toggle) {
            return;
        }

        try {

            await updateProfile({ library_visibility: toggle.checked ? "friends" : "private" });

            toast(toggle.checked ? "Friends can now visit your shelves." : "Your shelves are private again.", { tone: "success" });

            renderHub();

        }

        catch (error) {
            toggle.checked = !toggle.checked;
            toastError(error);
        }

    });

}


/* =========================================================
   DIALOGS: PROFILE AND FRIENDS
========================================================= */

async function profileDialog({ reason = "" } = {}) {

    const me =
        getProfile();

    return formDialog({
        title: "Your reader card",
        eyebrow: "Community",
        submitLabel: "Save",
        body: html`
            ${reason ? html`<p class="dialog-note">${reason}</p>` : ""}
            <label class="field">
                <span class="field__label">Username</span>
                <span class="field__prefix">
                    <span aria-hidden="true">@</span>
                    <input class="field__input" name="username" required minlength="3" maxlength="24" pattern="[a-z0-9_]{3,24}" autocomplete="off" autocapitalize="off" spellcheck="false" value="${me?.username || ""}" placeholder="moonlit_reader">
                </span>
                <span class="field__hint">3 to 24 lowercase letters, numbers or underscores. Friends use it to find you.</span>
            </label>
            <label class="field">
                <span class="field__label">A line about you <span class="muted">(optional)</span></span>
                <textarea class="field__input" name="bio" rows="3" maxlength="300" placeholder="Gothic novels, rainy days and too much tea.">${me?.bio || ""}</textarea>
            </label>
        `,
        onOpen: (dialog, form) => {
            form.elements.username.addEventListener("input", (event) => {
                event.target.value = event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
            });
        },
        onSubmit: async (values) => {

            await updateProfile({
                username: String(values.get("username") || "").trim().toLowerCase(),
                bio: textOrNull(values.get("bio"))
            });

            toast("Your reader card is saved.", { tone: "success" });

            renderHub();

            return true;

        }
    });

}


async function addFriendDialog() {

    if (!getProfile()?.username) {

        const saved =
            await profileDialog({ reason: "First, choose a username. Your friend will need it to accept you back." });

        if (!saved) {
            return;
        }

    }

    return formDialog({
        title: "Add a friend",
        eyebrow: "Community",
        submitLabel: "Send request",
        body: html`
            <p class="dialog-note">Ask your friend for their Novellow username. Yours is <strong>@${getProfile().username}</strong>.</p>
            <label class="field">
                <span class="field__label">Their username</span>
                <span class="field__prefix">
                    <span aria-hidden="true">@</span>
                    <input class="field__input" name="username" required maxlength="25" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="their_username">
                </span>
            </label>
        `,
        onSubmit: async (values) => {

            await sendFriendRequest(String(values.get("username") || ""));

            toast("Request sent. You'll be friends once they accept.", { tone: "success" });

            return true;

        }
    });

}


/* =========================================================
   DIALOGS: CLUBS AND BUDDY READS
========================================================= */

async function groupDialog(kind, group = null) {

    await loadLibrary().catch(() => {});

    if (!friends.friends.length && !group) {
        friends = await loadFriends();
    }

    const books =
        getBooks()
            .slice()
            .sort((a, b) => (a.status === "reading" ? -1 : 0) - (b.status === "reading" ? -1 : 0) || a.title.localeCompare(b.title));

    const club =
        kind === "club";

    const invitable =
        group ? [] : friends.friends;

    return formDialog({
        title: group ? `Edit ${group.name}` : club ? "Start a book club" : "Start a buddy read",
        eyebrow: club ? "Book club" : "Buddy read",
        submitLabel: group ? "Save" : club ? "Start the club" : "Start reading",
        className: "community-dialog",
        body: html`

            ${!group && books.length ? html`
                <label class="field">
                    <span class="field__label">Pick a book from your shelves <span class="muted">(or type one below)</span></span>
                    <select class="field__input" name="from_library">
                        <option value="">Choose a book…</option>
                        ${books.map((book) => html`<option value="${book.id}">${book.title}${book.author ? ` · ${book.author}` : ""}</option>`)}
                    </select>
                </label>
            ` : ""}

            <div class="field-row">
                <label class="field">
                    <span class="field__label">Book title</span>
                    <input class="field__input" name="book_title" required maxlength="300" value="${group?.book_title || ""}">
                </label>
                <label class="field">
                    <span class="field__label">Author</span>
                    <input class="field__input" name="book_author" maxlength="200" value="${group?.book_author || ""}">
                </label>
            </div>

            <label class="field">
                <span class="field__label">${club ? "Club name" : "Name this read"}</span>
                <input class="field__input" name="name" required maxlength="80" value="${group?.name || ""}" placeholder="${club ? "Tea & Tomes" : "Autumn read-along"}">
            </label>

            ${club ? "" : html`
                <label class="field">
                    <span class="field__label">Chapters in the book</span>
                    <input class="field__input" type="number" name="chapter_count" min="1" max="500" required value="${group?.chapter_count || ""}" placeholder="24">
                    <span class="field__hint">Comments are tied to chapters, and stay hidden from anyone who hasn't reached them yet.</span>
                </label>
            `}

            <label class="field">
                <span class="field__label">${club ? "What's the plan?" : "A note"} <span class="muted">(optional)</span></span>
                <textarea class="field__input" name="description" rows="2" maxlength="1000" placeholder="${club ? "Finish by the end of October, then meet for tea." : "Two chapters a night?"}">${group?.description || ""}</textarea>
            </label>

            ${group ? "" : invitable.length ? html`
                <fieldset class="field invite-picker">
                    <legend class="field__label">Invite friends</legend>
                    ${invitable.map((entry) => html`
                        <label class="invite-picker__option">
                            <input type="checkbox" name="invite" value="${entry.person.id}">
                            ${avatar(entry.person, "small")}
                            <span>${entry.person.display_name}</span>
                        </label>
                    `)}
                </fieldset>
            ` : html`
                <p class="dialog-note">Once you've added friends, you can invite them from the ${club ? "club" : "buddy read"} page.</p>
            `}

        `,
        onOpen: (dialog, form) => {

            form.elements.from_library?.addEventListener("change", (event) => {

                const book =
                    books.find((item) => item.id === event.target.value);

                if (!book) {
                    return;
                }

                form.elements.book_title.value = book.title;
                form.elements.book_author.value = book.author || "";

                if (!form.elements.name.value) {
                    form.elements.name.value = (club ? `${book.title} club` : `Reading ${book.title}`).slice(0, 80);
                }

            });

        },
        onSubmit: async (values) => {

            const record = {
                name: String(values.get("name") || "").trim(),
                book_title: String(values.get("book_title") || "").trim(),
                book_author: textOrNull(values.get("book_author")),
                description: textOrNull(values.get("description"))
            };

            if (!club) {
                record.chapter_count = intOrNull(values.get("chapter_count"));
            }

            if (group) {
                await updateGroup(group.id, record);
                return group.id;
            }

            return createGroup({
                kind,
                name: record.name,
                bookTitle: record.book_title,
                bookAuthor: record.book_author,
                description: record.description,
                chapterCount: record.chapter_count,
                invite: values.getAll("invite")
            });

        }
    });

}


async function inviteDialog(group) {

    friends = await loadFriends();

    const inGroup =
        new Set(group.members.map((member) => member.user_id));

    const choices =
        friends.friends.filter((entry) => !inGroup.has(entry.person.id));

    if (!choices.length) {

        toast(friends.friends.length
            ? "All your friends are already here."
            : "Add friends first, then you can invite them.");

        return null;

    }

    return formDialog({
        title: "Invite friends",
        eyebrow: group.name,
        submitLabel: "Send invitations",
        body: html`
            <fieldset class="field invite-picker">
                <legend class="field__label">Who should join?</legend>
                ${choices.map((entry) => html`
                    <label class="invite-picker__option">
                        <input type="checkbox" name="invite" value="${entry.person.id}">
                        ${avatar(entry.person, "small")}
                        <span>${entry.person.display_name}</span>
                    </label>
                `)}
            </fieldset>
        `,
        onSubmit: async (values, form) => {

            const picked =
                values.getAll("invite");

            if (!picked.length) {
                form.querySelector(".form-error").textContent = "Choose at least one friend.";
                form.querySelector(".form-error").hidden = false;
                return false;
            }

            for (const friendId of picked) {
                await inviteToGroup(group.id, friendId);
            }

            toast(`${plural(picked.length, "invitation")} sent.`, { tone: "success" });

            return true;

        }
    });

}


/* =========================================================
   A FRIEND'S SHELVES
========================================================= */

async function showFriend(friendId) {

    const { person, shelves, books } =
        await loadFriendLibrary(friendId);

    if (!person) {

        render(content, html`
            <a class="back-link" href="community.html">${art("ui-chevron-left")} Community</a>
            ${emptyState({
                symbol: "art-community",
                title: "This library isn't open to you",
                text: "You can visit a reader's shelves once you're friends and they've chosen to share them.",
                actionLabel: "Back to Community",
                href: "community.html"
            })}
        `);

        return;

    }

    document.title = `${person.display_name}'s shelves | Novellow`;

    await coverUrls(books.map((book) => book.cover_path).filter(Boolean)).catch(() => {});

    const reading =
        books.filter((book) => book.status === "reading");

    const finished =
        books.filter((book) => book.status === "finished").length;

    const byId =
        new Map(books.map((book) => [book.id, book]));

    const draw = () => {

        render(content, html`

            <a class="back-link" href="community.html">${art("ui-chevron-left")} Community</a>

            <div class="page-heading friend-heading">
                <div class="friend-heading__who">
                    ${avatar(person, "large")}
                    <div>
                        <h1 class="page-heading__title">${person.display_name}'s shelves</h1>
                        <p class="page-heading__subtitle">
                            ${person.username ? `@${person.username} · ` : ""}${plural(books.length, "book")} · ${finished} finished
                        </p>
                    </div>
                </div>
            </div>

            ${person.bio ? html`<p class="friend-bio paper">${person.bio}</p>` : ""}

            ${person.library_visibility !== "friends" ? emptyState({
                symbol: "art-community",
                title: `${person.display_name} keeps their shelves private`,
                text: "If they turn on sharing, their bookcase will appear here."
            }) : html`

                ${reading.length ? html`
                    <section class="friend-reading" aria-labelledby="friendReadingTitle">
                        <h2 class="section-title section-title--light" id="friendReadingTitle">Reading now</h2>
                        <ul class="friend-reading__list">
                            ${reading.map((book) => html`
                                <li>
                                    <button class="friend-reading__book paper" type="button" data-book-id="${book.id}">
                                        ${coverMarkup(book, { size: "small" })}
                                        <span>
                                            <strong>${book.title}</strong>
                                            ${book.author ? html`<span class="muted">${book.author}</span>` : ""}
                                            ${book.page_count ? html`
                                                <span class="progress-ribbon progress-ribbon--thin" aria-hidden="true"><span style="width: ${Math.min(100, Math.round((book.current_page / book.page_count) * 100))}%"></span></span>
                                                <span class="muted">Page ${book.current_page} of ${book.page_count}</span>
                                            ` : ""}
                                        </span>
                                    </button>
                                </li>
                            `)}
                        </ul>
                    </section>
                ` : ""}

                <div class="bookcase friend-bookcase">
                    <div class="bookcase-body">
                        ${shelves.length ? shelves.map((shelf) => friendShelf(shelf, books.filter((book) => book.shelf_id === shelf.id))) : emptyState({
                            symbol: "scene-cat",
                            title: "No shelves yet",
                            text: `${person.display_name} hasn't added any books.`
                        })}
                    </div>
                    <div class="bookcase-base" aria-hidden="true"></div>
                </div>

            `}

        `);

        fitSpineTitles(content);

    };

    draw();

    let lastWidth =
        content.clientWidth;

    window.addEventListener("resize", debounce(() => {

        if (Math.abs(content.clientWidth - lastWidth) > 24) {
            lastWidth = content.clientWidth;
            draw();
        }

    }, 150));

    on(content, "click", "[data-book-id]", (event, target) => {

        const book =
            byId.get(target.dataset.bookId);

        if (book) {
            friendBookDialog(book, person).catch(toastError);
        }

    });

}


function friendShelf(shelf, books) {

    // The bookcase is at most 760 wide, less its carved sides.
    const width =
        Math.max(220, Math.min(760, content.clientWidth || 760) - 44);

    const rows =
        packRows(books, width);

    return html`
        <section class="shelf-unit shelf-style--${shelf.style}" aria-label="${shelf.name} shelf" style="${shelf.color ? `--shelf-paint: ${shelf.color}` : ""}">
            ${rows.map((row, index) => html`
                <div class="shelf-row">
                    <div class="shelf-interior">
                        <div class="shelf-books">
                            ${row.map((book) => spineMarkup(book, { extra: "is-shelved" }))}
                            ${!books.length ? html`<div class="shelf-waiting"><p>An empty shelf</p></div>` : ""}
                        </div>
                    </div>
                    <div class="shelf-board">
                        ${index === rows.length - 1 ? html`
                            <span class="shelf-plaque"><span class="shelf-plaque__name">${shelf.name}</span></span>
                        ` : ""}
                    </div>
                </div>
            `)}
        </section>
    `;

}


async function friendBookDialog(book, person) {

    const review =
        await loadFriendReview(book.id).catch(() => null);

    const dialog =
        document.createElement("dialog");

    dialog.className = "parchment-dialog parchment-dialog--form friend-book-dialog";

    render(dialog, html`
        <div class="dialog-form">

            <button class="dialog-close" type="button" data-close aria-label="Close">
                ${art("ui-close", "dialog-close__art")}
            </button>

            <div class="friend-book">
                ${coverMarkup(book, { size: "medium" })}
                <div class="friend-book__details">
                    <p class="dialog-eyebrow">On ${person.display_name}'s shelves</p>
                    <h2 class="dialog-title">${book.title}</h2>
                    ${book.author ? html`<p class="friend-book__author">${book.author}</p>` : ""}
                    <ul class="stat-list">
                        <li><span>Status</span><span>${statusLabel(book.status)}${book.is_favorite ? " · a favourite" : ""}</span></li>
                        ${book.rating ? html`<li><span>Their rating</span><span>${ratingMarkup(Number(book.rating))}</span></li>` : ""}
                        ${book.status === "reading" && book.page_count ? html`<li><span>Progress</span><span>Page ${book.current_page} of ${book.page_count}</span></li>` : ""}
                        ${book.date_finished ? html`<li><span>Finished</span><span>${formatDate(book.date_finished)}</span></li>` : ""}
                        ${book.genre ? html`<li><span>Genre</span><span>${book.genre}</span></li>` : ""}
                        ${book.page_count ? html`<li><span>Pages</span><span>${book.page_count}</span></li>` : ""}
                    </ul>
                </div>
            </div>

            ${review && (review.body || review.final_thoughts) ? html`
                <section class="friend-review">
                    <h3>${person.display_name}'s review</h3>
                    ${paragraphs(review.body)}
                    ${review.final_thoughts ? html`<p class="friend-review__final"><strong>Final thoughts:</strong> ${review.final_thoughts}</p>` : ""}
                    ${review.would_reread === true ? html`<p class="muted">Would read it again.</p>` : ""}
                </section>
            ` : ""}

        </div>
    `);

    document.body.appendChild(dialog);

    dialog.querySelector("[data-close]").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
        if (event.target === dialog) {
            dialog.close();
        }
    });
    dialog.addEventListener("close", () => dialog.remove());

    dialog.showModal();

}


/* =========================================================
   A BOOK CLUB OR BUDDY READ
========================================================= */

async function showGroup(groupId) {

    const state = {
        group: null,
        posts: [],
        waiting: []
    };

    const refresh = async () => {

        state.group =
            await loadGroup(groupId);

        if (!state.group) {

            render(content, html`
                <a class="back-link" href="community.html">${art("ui-chevron-left")} Community</a>
                ${emptyState({
                    symbol: "art-community",
                    title: "This group isn't open to you",
                    text: "It may have been closed, or you're no longer a member.",
                    actionLabel: "Back to Community",
                    href: "community.html"
                })}
            `);

            return;

        }

        document.title = `${state.group.name} | Novellow`;

        if (state.group.mine?.status === "joined") {

            [state.posts, state.waiting] =
                await Promise.all([
                    listPosts(groupId),
                    state.group.kind === "buddy" ? waitingComments(groupId) : []
                ]);

        }

        renderGroup(state);

    };

    await refresh();

    // Pick up new posts when the reader comes back to the tab.
    document.addEventListener("visibilitychange", () => {

        if (document.visibilityState === "visible" && !content.querySelector("textarea:focus")) {
            refresh().catch(() => {});
        }

    });

    on(content, "click", "[data-action]", async (event, target) => {

        const group =
            state.group;

        const action =
            target.dataset.action;

        try {

            if (action === "join") {
                await withBusy(target, "Joining…", () => joinGroup(group.id));
                showCommunityBadge();
            }

            if (action === "decline" || action === "leave") {

                if (action === "leave") {

                    const sure =
                        await confirmDialog({
                            title: `Leave ${group.name}?`,
                            message: "Your posts stay in the discussion. You can come back if someone invites you again.",
                            confirmLabel: "Leave"
                        });

                    if (!sure) {
                        return;
                    }

                }

                await removeMember(group.id, getProfile().id);

                window.location.href = "community.html";

                return;

            }

            if (action === "invite") {
                await inviteDialog(group);
            }

            if (action === "edit") {
                await groupDialog(group.kind, group);
            }

            if (action === "delete") {

                const sure =
                    await confirmDialog({
                        title: `Close ${group.name}?`,
                        message: "The group and every post in it will be deleted for everyone. This can't be undone.",
                        confirmLabel: "Close it for everyone",
                        tone: "danger"
                    });

                if (!sure) {
                    return;
                }

                await deleteGroup(group.id);

                window.location.href = "community.html";

                return;

            }

            if (action === "remove-member") {

                const sure =
                    await confirmDialog({
                        title: `Remove ${target.dataset.name}?`,
                        message: "They'll no longer see this group. Their posts stay.",
                        confirmLabel: "Remove"
                    });

                if (!sure) {
                    return;
                }

                await removeMember(group.id, target.dataset.id);

            }

            if (action === "delete-post") {

                const sure =
                    await confirmDialog({
                        title: "Delete this post?",
                        message: "It will be removed for everyone.",
                        confirmLabel: "Delete",
                        tone: "danger"
                    });

                if (!sure) {
                    return;
                }

                await deletePost(target.dataset.id);

            }

            if (action === "finished-chapter") {
                await withBusy(target, "Saving…", () => setMyChapter(group.id, Number(target.dataset.chapter)));
            }

            await refresh();

        }

        catch (error) {
            toastError(error);
        }

    });

    content.addEventListener("submit", async (event) => {

        const form =
            event.target.closest("form[data-form]");

        if (!form) {
            return;
        }

        event.preventDefault();

        const group =
            state.group;

        try {

            if (form.dataset.form === "post") {

                const body =
                    form.elements.body.value.trim();

                if (!body) {
                    form.elements.body.focus();
                    return;
                }

                const chapter =
                    form.dataset.chapter ? Number(form.dataset.chapter) : null;

                await withBusy(form.querySelector("[type=submit]"), "Posting…", () => addPost(group.id, body, chapter));

            }

            if (form.dataset.form === "chapter") {

                await withBusy(form.querySelector("[type=submit]"), "Saving…", () =>
                    setMyChapter(group.id, Number(form.elements.chapter.value))
                );

                toast("Your place is saved.", { tone: "success" });

            }

            await refresh();

        }

        catch (error) {
            toastError(error);
        }

    });

}


function renderGroup(state) {

    const group =
        state.group;

    const me =
        getProfile()?.id;

    const joined =
        group.mine?.status === "joined";

    const club =
        group.kind === "club";

    const members =
        group.members.filter((member) => member.status === "joined");

    const invited =
        group.members.filter((member) => member.status === "invited");

    render(content, html`

        <a class="back-link" href="community.html">${art("ui-chevron-left")} Community</a>

        <div class="page-heading">
            <div>
                <p class="eyebrow eyebrow--light">${club ? "Book club" : "Buddy read"}</p>
                <h1 class="page-heading__title">${group.name}</h1>
                <p class="page-heading__subtitle">${groupBook(group)}${club ? "" : ` · ${plural(group.chapter_count, "chapter")}`}</p>
            </div>
            ${joined ? html`
                <div class="page-heading__actions">
                    <button class="button button--brass" type="button" data-action="invite">${art("ui-add")} Invite friends</button>
                    ${group.isOwner ? html`
                        <button class="button button--ghost" type="button" data-action="edit">Edit</button>
                        <button class="button button--ghost" type="button" data-action="delete">Close group</button>
                    ` : html`
                        <button class="button button--ghost" type="button" data-action="leave">Leave</button>
                    `}
                </div>
            ` : ""}
        </div>

        ${!joined ? html`
            <section class="community-card paper group-invite">
                ${art(club ? "art-community" : "art-reading", "group-invite__art")}
                <div>
                    <h2>${group.invitedBy ? `${group.invitedBy.display_name} invited you` : "You're invited"}</h2>
                    <p>${club ? "Join the club to read and add to the discussion." : "Join to read along chapter by chapter. Comments on a chapter stay hidden until you reach it."}</p>
                    ${group.description ? html`<p class="muted">${group.description}</p>` : ""}
                    <div class="group-invite__actions">
                        <button class="button button--primary" type="button" data-action="join">Join</button>
                        <button class="button button--ghost" type="button" data-action="decline">No thanks</button>
                    </div>
                </div>
            </section>
        ` : html`

            <div class="community-layout community-layout--group">

                <div class="stack">
                    ${group.description ? html`<p class="group-description paper">${group.description}</p>` : ""}
                    ${club ? clubThread(state, me) : buddyChapters(state, me)}
                </div>

                <aside class="stack">

                    ${club ? "" : html`
                        <section class="community-card paper" aria-labelledby="placeTitle">
                            <h2 class="section-title" id="placeTitle">Your place</h2>
                            <form class="chapter-form" data-form="chapter">
                                <label class="field">
                                    <span class="field__label">I've finished</span>
                                    <select class="field__input" name="chapter">
                                        <option value="0" ${group.mine.current_chapter === 0 ? html`selected` : ""}>Not started yet</option>
                                        ${Array.from({ length: group.chapter_count }, (_, index) => index + 1).map((chapter) => html`
                                            <option value="${chapter}" ${chapter === group.mine.current_chapter ? html`selected` : ""}>Chapter ${chapter}${chapter === group.chapter_count ? " (the end!)" : ""}</option>
                                        `)}
                                    </select>
                                </label>
                                <button class="button button--primary button--small" type="submit">Save my place</button>
                            </form>
                        </section>
                    `}

                    <section class="community-card paper" aria-labelledby="membersTitle">
                        <h2 class="section-title" id="membersTitle">${club ? "Members" : "Reading along"}</h2>
                        <ul class="member-list">
                            ${members.map((member) => html`
                                <li class="member-row">
                                    ${avatar(member.person, "small")}
                                    <div class="member-row__text">
                                        <strong>${nameOf(member.person, me)}</strong>
                                        ${member.user_id === group.owner_id ? html`<span class="member-row__tag">started it</span>` : ""}
                                        ${club ? "" : html`
                                            <span class="progress-ribbon progress-ribbon--thin" aria-hidden="true"><span style="width: ${Math.round((member.current_chapter / group.chapter_count) * 100)}%"></span></span>
                                            <span class="muted">${member.current_chapter === 0 ? "Not started" : member.current_chapter >= group.chapter_count ? "Finished!" : `Chapter ${member.current_chapter} of ${group.chapter_count}`}</span>
                                        `}
                                    </div>
                                    ${group.isOwner && member.user_id !== me ? html`
                                        <button class="icon-button" type="button" data-action="remove-member" data-id="${member.user_id}" data-name="${member.person.display_name}" aria-label="Remove ${member.person.display_name}" title="Remove">${art("ui-close")}</button>
                                    ` : ""}
                                </li>
                            `)}
                        </ul>
                        ${invited.length ? html`
                            <p class="eyebrow member-list__label">Invited</p>
                            <ul class="member-list member-list--invited">
                                ${invited.map((member) => html`
                                    <li class="member-row">
                                        ${avatar(member.person, "small")}
                                        <div class="member-row__text"><strong>${member.person.display_name}</strong><span class="muted">hasn't joined yet</span></div>
                                        ${group.isOwner ? html`
                                            <button class="icon-button" type="button" data-action="remove-member" data-id="${member.user_id}" data-name="${member.person.display_name}" aria-label="Cancel the invitation for ${member.person.display_name}" title="Cancel invitation">${art("ui-close")}</button>
                                        ` : ""}
                                    </li>
                                `)}
                            </ul>
                        ` : ""}
                    </section>

                </aside>

            </div>

        `}

    `);

}


function postMarkup(post, group, me) {

    const author =
        group.members.find((member) => member.user_id === post.user_id)?.person
        || { id: post.user_id, display_name: "A former member" };

    const mine =
        post.user_id === me;

    return html`
        <li class="post ${mine ? "post--mine" : ""}">
            ${avatar(author, "small")}
            <div class="post__bubble">
                <div class="post__meta">
                    <strong>${nameOf(author, me)}</strong>
                    <time datetime="${post.created_at}">${formatDateTime(post.created_at)}</time>
                    ${mine || group.isOwner ? html`
                        <button class="text-button post__delete" type="button" data-action="delete-post" data-id="${post.id}">Delete</button>
                    ` : ""}
                </div>
                <div class="post__body">${paragraphs(post.body)}</div>
            </div>
        </li>
    `;

}


function composer({ chapter = null, placeholder }) {

    return html`
        <form class="composer" data-form="post" ${chapter ? html`data-chapter="${chapter}"` : ""}>
            <label class="visually-hidden" for="composer-${chapter || "club"}">Your post</label>
            <textarea class="field__input" id="composer-${chapter || "club"}" name="body" rows="2" maxlength="5000" placeholder="${placeholder}" required></textarea>
            <button class="button button--primary button--small" type="submit">Post</button>
        </form>
    `;

}


function clubThread(state, me) {

    const group =
        state.group;

    return html`
        <section class="community-card paper thread" aria-labelledby="threadTitle">
            <h2 class="section-title" id="threadTitle">Discussion</h2>
            ${state.posts.length ? html`
                <ol class="post-list">
                    ${state.posts.map((post) => postMarkup(post, group, me))}
                </ol>
            ` : html`<p class="muted community-card__hint">No posts yet. Say hello, or share your first impressions.</p>`}
            ${composer({ placeholder: "Share a thought with the club…" })}
        </section>
    `;

}


function buddyChapters(state, me) {

    const group =
        state.group;

    const reached =
        group.mine.current_chapter;

    const waitingAt =
        new Map(state.waiting.map((row) => [row.chapter, Number(row.comments)]));

    const aheadTotal =
        [...waitingAt.values()].reduce((sum, count) => sum + count, 0);

    const chapters =
        Array.from({ length: reached }, (_, index) => reached - index);

    return html`

        ${reached < group.chapter_count ? html`
            <section class="community-card paper next-chapter">
                <div>
                    <p class="eyebrow">Up next</p>
                    <h2>Chapter ${reached + 1}</h2>
                    <p class="muted">
                        ${aheadTotal
                            ? `${plural(aheadTotal, "comment")} from your friends ${aheadTotal === 1 ? "is" : "are"} waiting further along. ${waitingAt.get(reached + 1) ? `${plural(waitingAt.get(reached + 1), "comment")} on this chapter.` : ""}`
                            : "No spoilers here: comments appear once you've read that far."}
                    </p>
                </div>
                <button class="button button--primary" type="button" data-action="finished-chapter" data-chapter="${reached + 1}">I've finished chapter ${reached + 1}</button>
            </section>
        ` : html`
            <section class="community-card paper next-chapter next-chapter--done">
                <div>
                    <p class="eyebrow">The end</p>
                    <h2>You've finished the book!</h2>
                    <p class="muted">Every comment is open to you now.</p>
                </div>
            </section>
        `}

        ${chapters.length ? chapters.map((chapter, index) => {

            const posts =
                state.posts.filter((post) => post.chapter === chapter);

            return html`
                <details class="chapter-thread paper" ${index === 0 ? html`open` : ""}>
                    <summary>
                        <span class="chapter-thread__title">Chapter ${chapter}</span>
                        <span class="muted">${posts.length ? plural(posts.length, "comment") : "No comments yet"}</span>
                    </summary>
                    ${posts.length ? html`
                        <ol class="post-list">
                            ${posts.map((post) => postMarkup(post, group, me))}
                        </ol>
                    ` : ""}
                    ${composer({ chapter, placeholder: `Your thoughts on chapter ${chapter}…` })}
                </details>
            `;

        }) : html`
            <p class="muted community-card__hint community-card__hint--light">Finish the first chapter to start the conversation.</p>
        `}

    `;

}


start().catch((error) => console.error(error));
