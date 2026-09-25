/* =========================================================
   NOVELLOW
   STORE

   Every database query lives here, and the in-memory library
   (profile, settings, shelves, books) is kept here once.
   Pages read from the store instead of keeping their own
   copies, so a book can never "disappear" between pages.

   Supabase is the source of truth: every change is written
   there first, then the store updates and announces it.
========================================================= */

import { supabase } from "./supabase.js?v=__VERSION__";
import { NovellowError } from "./errors.js?v=__VERSION__";
import { DEFAULT_SETTINGS } from "../config.js?v=__VERSION__";
import { removeCoverFolder } from "./covers.js?v=__VERSION__";


let userId = null;

const state = {
    profile: null,
    settings: null,
    shelves: [],
    books: new Map(),
    libraryLoaded: false
};


/* =========================================================
   EVENTS
   "library-changed" fires after any shelf/book change,
   "settings-changed" and "profile-changed" after those.
========================================================= */

export const events =
    new EventTarget();


function announce(type, detail = {}) {
    events.dispatchEvent(new CustomEvent(type, { detail }));
}


/* =========================================================
   HELPERS
========================================================= */

function unwrap({ data, error }) {

    if (error) {
        throw error;
    }

    return data;

}


function mine() {

    if (!userId) {
        throw new NovellowError("Your session has ended. Please sign in again.");
    }

    return userId;

}


export function setUser(id) {
    userId = id;
}


export function currentUserId() {
    return userId;
}


/* =========================================================
   PROFILE
========================================================= */

export async function loadProfile() {

    state.profile =
        unwrap(
            await supabase
                .from("profiles")
                .select("*")
                .eq("id", mine())
                .maybeSingle()
        ) || { id: userId, display_name: "Reader" };

    return state.profile;

}


export function getProfile() {
    return state.profile;
}


export async function updateProfile(patch) {

    state.profile =
        unwrap(
            await supabase
                .from("profiles")
                .update(patch)
                .eq("id", mine())
                .select()
                .single()
        );

    announce("profile-changed", { profile: state.profile });

    return state.profile;

}


/* =========================================================
   SETTINGS
========================================================= */

export async function loadSettings() {

    let settings =
        unwrap(
            await supabase
                .from("user_settings")
                .select("*")
                .eq("user_id", mine())
                .maybeSingle()
        );

    // Recreate the row if it is ever missing.
    if (!settings) {

        settings =
            unwrap(
                await supabase
                    .from("user_settings")
                    .insert({ user_id: mine() })
                    .select()
                    .single()
            );

    }

    state.settings = { ...DEFAULT_SETTINGS, ...settings };

    return state.settings;

}


export function getSettings() {
    return state.settings || { ...DEFAULT_SETTINGS };
}


export async function updateSettings(patch) {

    const saved =
        unwrap(
            await supabase
                .from("user_settings")
                .update(patch)
                .eq("user_id", mine())
                .select()
                .single()
        );

    state.settings = { ...DEFAULT_SETTINGS, ...saved };

    announce("settings-changed", { settings: state.settings });

    return state.settings;

}


/* =========================================================
   SIGN-IN HISTORY
========================================================= */

export async function listSignIns(limit = 15) {

    return unwrap(
        await supabase
            .from("sign_in_events")
            .select("signed_in_at, method, user_agent")
            .eq("user_id", mine())
            .order("signed_in_at", { ascending: false })
            .limit(limit)
    );

}


/* =========================================================
   LIBRARY: SHELVES AND BOOKS
========================================================= */

export async function loadLibrary({ force = false } = {}) {

    if (state.libraryLoaded && !force) {
        return;
    }

    const [shelves, books] =
        await Promise.all([

            supabase
                .from("shelves")
                .select("*")
                .eq("user_id", mine())
                .order("sort_order")
                .order("created_at")
                .then(unwrap),

            supabase
                .from("books")
                .select("*")
                .eq("user_id", mine())
                .order("shelf_position")
                .order("created_at")
                .then(unwrap)

        ]);

    state.shelves = shelves;
    state.books = new Map(books.map((book) => [book.id, book]));
    state.libraryLoaded = true;

    announce("library-changed", { reason: "loaded" });

}


export function getShelves() {
    return [...state.shelves];
}


export function getShelf(id) {
    return state.shelves.find((shelf) => shelf.id === id) || null;
}


export function getBooks() {
    return [...state.books.values()];
}


export function getBook(id) {
    return state.books.get(id) || null;
}


/*
    For pages opened directly with ?book=<id>.
*/

export async function fetchBook(id) {

    const cached =
        getBook(id);

    if (cached) {
        return cached;
    }

    const book =
        unwrap(
            await supabase
                .from("books")
                .select("*")
                .eq("id", id)
                .maybeSingle()
        );

    if (book) {
        state.books.set(book.id, book);
    }

    return book;

}


const SORTERS = {

    manual: (a, b) => a.shelf_position - b.shelf_position,

    title: (a, b) => a.title.localeCompare(b.title),

    author: (a, b) => (a.author || "").localeCompare(b.author || "") || a.title.localeCompare(b.title),

    rating: (a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0),

    date_added: (a, b) => b.created_at.localeCompare(a.created_at),

    date_finished: (a, b) => (b.date_finished || "").localeCompare(a.date_finished || "")

};


export function sortBooks(books, sort = "manual") {
    return [...books].sort(SORTERS[sort] || SORTERS.manual);
}


export function booksOnShelf(shelfId, sort = "manual") {

    return sortBooks(
        getBooks().filter((book) => book.shelf_id === shelfId),
        sort
    );

}


/* ---------------------------------------------------------
   SHELVES
--------------------------------------------------------- */

export async function createShelf({ name, description = null, style = "classic_wood", color = null }) {

    const sortOrder =
        state.shelves.reduce((max, shelf) => Math.max(max, shelf.sort_order), -1) + 1;

    const shelf =
        unwrap(
            await supabase
                .from("shelves")
                .insert({
                    user_id: mine(),
                    name,
                    description,
                    style,
                    color,
                    sort_order: sortOrder
                })
                .select()
                .single()
        );

    state.shelves.push(shelf);

    announce("library-changed", { reason: "shelf-created", shelfId: shelf.id });

    return shelf;

}


export async function updateShelf(id, patch) {

    const shelf =
        unwrap(
            await supabase
                .from("shelves")
                .update(patch)
                .eq("id", id)
                .select()
                .single()
        );

    state.shelves =
        state.shelves.map((item) => (item.id === id ? shelf : item));

    announce("library-changed", { reason: "shelf-updated", shelfId: id });

    return shelf;

}


export async function deleteShelf(id) {

    if (booksOnShelf(id).length) {
        throw new NovellowError("This shelf still holds books. Move them to another shelf first.");
    }

    unwrap(
        await supabase
            .from("shelves")
            .delete()
            .eq("id", id)
    );

    state.shelves =
        state.shelves.filter((shelf) => shelf.id !== id);

    announce("library-changed", { reason: "shelf-deleted", shelfId: id });

}


export async function reorderShelves(orderedIds) {

    const changes =
        orderedIds
            .map((id, index) => ({ id, index }))
            .filter(({ id, index }) => getShelf(id)?.sort_order !== index);

    await Promise.all(
        changes.map(({ id, index }) =>
            supabase
                .from("shelves")
                .update({ sort_order: index })
                .eq("id", id)
                .then(unwrap)
        )
    );

    state.shelves =
        orderedIds
            .map((id, index) => ({ ...getShelf(id), sort_order: index }));

    announce("library-changed", { reason: "shelves-reordered" });

}


/*
    Moves every book from one shelf onto another, keeping
    their order, so the first shelf can be deleted.
*/

export async function moveAllBooks(fromShelfId, toShelfId) {

    const moving =
        booksOnShelf(fromShelfId);

    let position =
        booksOnShelf(toShelfId).length;

    for (const book of moving) {

        await updateBook(book.id, {
            shelf_id: toShelfId,
            shelf_position: position
        }, { quiet: true });

        position += 1;

    }

    announce("library-changed", { reason: "books-moved" });

}


/* ---------------------------------------------------------
   BOOKS
--------------------------------------------------------- */

export async function createBook(values) {

    const position =
        booksOnShelf(values.shelf_id).length;

    const book =
        unwrap(
            await supabase
                .from("books")
                .insert({
                    ...values,
                    user_id: mine(),
                    shelf_position: position
                })
                .select()
                .single()
        );

    state.books.set(book.id, book);

    announce("library-changed", { reason: "book-created", bookId: book.id });

    return book;

}


export async function updateBook(id, patch, { quiet = false } = {}) {

    const book =
        unwrap(
            await supabase
                .from("books")
                .update(patch)
                .eq("id", id)
                .select()
                .single()
        );

    state.books.set(book.id, book);

    if (!quiet) {
        announce("library-changed", { reason: "book-updated", bookId: id });
    }

    return book;

}


/*
    Places a book at a position on a shelf (moving it between
    shelves if needed) and renumbers the neighbours.
*/

export async function placeBook(bookId, shelfId, index) {

    const book =
        getBook(bookId);

    if (!book) {
        return;
    }

    const target =
        booksOnShelf(shelfId).filter((item) => item.id !== bookId);

    const clamped =
        Math.max(0, Math.min(index, target.length));

    target.splice(clamped, 0, book);

    const updates = [];

    target.forEach((item, position) => {

        if (item.shelf_position !== position || item.shelf_id !== shelfId) {

            updates.push(
                updateBook(item.id, {
                    shelf_id: shelfId,
                    shelf_position: position
                }, { quiet: true })
            );

        }

    });

    // Close the gap on the shelf the book came from.
    if (book.shelf_id !== shelfId) {

        booksOnShelf(book.shelf_id)
            .filter((item) => item.id !== bookId)
            .forEach((item, position) => {

                if (item.shelf_position !== position) {
                    updates.push(
                        updateBook(item.id, { shelf_position: position }, { quiet: true })
                    );
                }

            });

    }

    await Promise.all(updates);

    announce("library-changed", { reason: "book-moved", bookId });

}


export async function deleteBook(id) {

    const book =
        getBook(id);

    unwrap(
        await supabase
            .from("books")
            .delete()
            .eq("id", id)
    );

    state.books.delete(id);

    announce("library-changed", { reason: "book-deleted", bookId: id });

    // Cover files are not linked by a foreign key, so tidy them up.
    if (book) {
        removeCoverFolder(mine(), id).catch((error) => console.error(error));
    }

}


/* =========================================================
   READING PROGRESS
========================================================= */

export async function logProgress(book, currentPage) {

    const previous =
        book.current_page || 0;

    if (currentPage !== previous) {

        unwrap(
            await supabase
                .from("reading_sessions")
                .insert({
                    user_id: mine(),
                    book_id: book.id,
                    start_page: previous,
                    end_page: currentPage
                })
        );

    }

    return updateBook(book.id, { current_page: currentPage });

}


export async function listReadingSessions() {

    return unwrap(
        await supabase
            .from("reading_sessions")
            .select("*")
            .eq("user_id", mine())
            .order("logged_on")
    );

}


/* =========================================================
   JOURNAL COLLECTIONS
   Sections, notes/thoughts, quotes, words, questions,
   characters and themes all share these calls.
========================================================= */

const JOURNAL_ORDER = {
    book_sections: [["sort_order"], ["created_at"]],
    journal_entries: [["created_at", { ascending: false }]],
    quotes: [["created_at", { ascending: false }]],
    vocabulary: [["word"]],
    questions: [["resolved"], ["created_at", { ascending: false }]],
    characters: [["sort_order"], ["name"]],
    book_themes: [["created_at"]]
};


export async function listForBook(table, bookId) {

    let query =
        supabase
            .from(table)
            .select("*")
            .eq("book_id", bookId);

    (JOURNAL_ORDER[table] || [["created_at"]])
        .forEach(([column, options]) => {
            query = query.order(column, options);
        });

    return unwrap(await query);

}


export async function createRow(table, values) {

    return unwrap(
        await supabase
            .from(table)
            .insert({ ...values, user_id: mine() })
            .select()
            .single()
    );

}


export async function updateRow(table, id, patch) {

    return unwrap(
        await supabase
            .from(table)
            .update(patch)
            .eq("id", id)
            .select()
            .single()
    );

}


export async function deleteRow(table, id) {

    unwrap(
        await supabase
            .from(table)
            .delete()
            .eq("id", id)
    );

}


export async function getReview(bookId) {

    return unwrap(
        await supabase
            .from("reviews")
            .select("*")
            .eq("book_id", bookId)
            .maybeSingle()
    );

}


export async function saveReview(bookId, values) {

    return unwrap(
        await supabase
            .from("reviews")
            .upsert({
                ...values,
                book_id: bookId,
                user_id: mine()
            })
            .select()
            .single()
    );

}


export async function countsForBook(bookId) {

    const tables = [
        "journal_entries",
        "quotes",
        "vocabulary",
        "questions",
        "characters",
        "book_themes"
    ];

    const results =
        await Promise.all(
            tables.map((table) =>
                supabase
                    .from(table)
                    .select("id", { count: "exact", head: true })
                    .eq("book_id", bookId)
            )
        );

    return Object.fromEntries(
        tables.map((table, index) => {

            if (results[index].error) {
                throw results[index].error;
            }

            return [table, results[index].count || 0];

        })
    );

}


/* =========================================================
   ACROSS THE WHOLE LIBRARY
========================================================= */

const BOOK_SUMMARY =
    "book:books(id, title, author, spine, cover_path)";


export async function listQuotes() {

    return unwrap(
        await supabase
            .from("quotes")
            .select(`*, ${BOOK_SUMMARY}`)
            .eq("user_id", mine())
            .order("created_at", { ascending: false })
    );

}


export async function listVocabulary() {

    return unwrap(
        await supabase
            .from("vocabulary")
            .select(`*, ${BOOK_SUMMARY}`)
            .eq("user_id", mine())
            .order("word")
    );

}


export async function listRecentEntries(limit = 12) {

    return unwrap(
        await supabase
            .from("journal_entries")
            .select(`*, ${BOOK_SUMMARY}`)
            .eq("user_id", mine())
            .order("updated_at", { ascending: false })
            .limit(limit)
    );

}


export async function libraryCounts() {

    const tables = [
        "journal_entries",
        "quotes",
        "vocabulary",
        "questions",
        "characters",
        "book_themes",
        "reviews"
    ];

    const results =
        await Promise.all(
            tables.map((table) =>
                supabase
                    .from(table)
                    .select("user_id", { count: "exact", head: true })
                    .eq("user_id", mine())
            )
        );

    return Object.fromEntries(
        tables.map((table, index) => {

            if (results[index].error) {
                throw results[index].error;
            }

            return [table, results[index].count || 0];

        })
    );

}


/*
    Per-book journal counts for the whole library in one go.
*/

export async function journalCountsByBook() {

    const tables = ["journal_entries", "quotes", "vocabulary"];

    const rows =
        await Promise.all(
            tables.map((table) =>
                supabase
                    .from(table)
                    .select("book_id")
                    .eq("user_id", mine())
                    .then(unwrap)
            )
        );

    const counts = {};

    rows.forEach((list, index) => {

        list.forEach(({ book_id: bookId }) => {

            counts[bookId] ||= { journal_entries: 0, quotes: 0, vocabulary: 0 };

            counts[bookId][tables[index]] += 1;

        });

    });

    return counts;

}


/*
    Searches notes, quotes and words. Book titles, authors,
    genres and shelves are searched in memory by the caller.
*/

export async function searchJournal(term, limit = 5) {

    const pattern =
        `%${term.replace(/[%_,()]/g, " ").trim()}%`;

    const [quotes, words, entries] =
        await Promise.all([

            supabase
                .from("quotes")
                .select(`id, text, page, ${BOOK_SUMMARY}`)
                .eq("user_id", mine())
                .ilike("text", pattern)
                .limit(limit)
                .then(unwrap),

            supabase
                .from("vocabulary")
                .select(`id, word, definition, ${BOOK_SUMMARY}`)
                .eq("user_id", mine())
                .or(`word.ilike.${pattern},definition.ilike.${pattern}`)
                .limit(limit)
                .then(unwrap),

            supabase
                .from("journal_entries")
                .select(`id, kind, title, body, ${BOOK_SUMMARY}`)
                .eq("user_id", mine())
                .or(`title.ilike.${pattern},body.ilike.${pattern}`)
                .limit(limit)
                .then(unwrap)

        ]);

    return { quotes, words, entries };

}


/* =========================================================
   CHALLENGES
========================================================= */

export async function listChallenges() {

    return unwrap(
        await supabase
            .from("reading_challenges")
            .select("*")
            .eq("user_id", mine())
            .order("created_at")
    );

}


/* =========================================================
   DECORATIONS
========================================================= */

export async function listDecorations(theme) {

    return unwrap(
        await supabase
            .from("decorations")
            .select("*")
            .eq("user_id", mine())
            .eq("theme", theme)
            .order("z_index")
    );

}


/* =========================================================
   WHOLE-LIBRARY OPERATIONS
========================================================= */

export const EXPORT_TABLES = [
    "shelves",
    "books",
    "book_sections",
    "journal_entries",
    "quotes",
    "vocabulary",
    "questions",
    "characters",
    "book_themes",
    "reviews",
    "reading_sessions",
    "reading_challenges",
    "decorations"
];


export async function readEverything() {

    const results =
        await Promise.all(
            EXPORT_TABLES.map((table) =>
                supabase
                    .from(table)
                    .select("*")
                    .eq("user_id", mine())
                    .then(unwrap)
            )
        );

    return Object.fromEntries(
        EXPORT_TABLES.map((table, index) => [table, results[index]])
    );

}


export async function insertRows(table, rows) {

    if (!rows.length) {
        return;
    }

    // Insert in batches to stay well under request limits.
    for (let start = 0; start < rows.length; start += 200) {

        unwrap(
            await supabase
                .from(table)
                .insert(rows.slice(start, start + 200))
        );

    }

}


export async function clearLibrary() {

    const bookIds =
        getBooks().map((book) => book.id);

    unwrap(await supabase.rpc("clear_my_library"));

    state.shelves = [];
    state.books = new Map();

    announce("library-changed", { reason: "cleared" });

    await Promise.all(
        bookIds.map((id) => removeCoverFolder(mine(), id).catch(() => {}))
    );

}
