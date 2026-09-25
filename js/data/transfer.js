/* =========================================================
   NOVELLOW
   EXPORT AND IMPORT

   Export: the reader's whole library as one JSON file.
   Import: checks a file first, then ADDS its contents to the
   signed-in reader's library with fresh ids (nothing is
   overwritten). Books already present (same title and
   author) can be skipped.
========================================================= */

import {
    readEverything,
    insertRows,
    getProfile,
    getSettings,
    updateSettings,
    loadLibrary,
    getShelves,
    getBooks,
    currentUserId
} from "../core/store.js?v=__VERSION__";

import { NovellowError } from "../core/errors.js?v=__VERSION__";
import { todayIso } from "../core/helpers.js?v=__VERSION__";
import { EXPORT_FORMAT, EXPORT_FORMAT_VERSION, DEFAULT_SETTINGS } from "../config.js?v=__VERSION__";


/*
    The columns each table accepts on import. Anything else in
    a file (ids, user ids, generated columns) is ignored.
*/

const COLUMNS = {
    shelves: ["name", "description", "sort_order", "style", "color"],
    books: [
        "title", "author", "genre", "publication_year", "page_count", "isbn",
        "series", "series_number", "status", "rating", "date_started",
        "date_finished", "current_page", "times_read", "is_favorite", "spine",
        "shelf_position", "created_at"
    ],
    book_sections: ["kind", "title", "sort_order"],
    journal_entries: ["kind", "title", "body", "page", "location", "created_at"],
    quotes: ["text", "page", "location", "comment", "created_at"],
    vocabulary: ["word", "part_of_speech", "definition", "page", "context", "created_at"],
    questions: ["question", "answer", "resolved", "page", "created_at"],
    characters: ["name", "description", "relationship", "notes", "sort_order"],
    book_themes: ["name", "explanation", "examples"],
    reviews: ["body", "final_thoughts", "would_reread"],
    reading_sessions: ["logged_on", "start_page", "end_page", "minutes"],
    reading_challenges: ["title", "description", "target", "criteria", "starts_on", "ends_on"],
    decorations: ["asset_id", "decoration_type", "room_area", "theme", "position_x", "position_y", "scale", "rotation", "z_index"]
};

const SETTINGS_COLUMNS =
    Object.keys(DEFAULT_SETTINGS);


function pick(row, columns) {

    const out = {};

    columns.forEach((column) => {

        if (row[column] !== undefined) {
            out[column] = row[column];
        }

    });

    return out;

}


/* =========================================================
   EXPORT
========================================================= */

export async function exportLibrary() {

    const everything =
        await readEverything();

    const strip = (rows) =>
        rows.map(({ user_id: userId, ...rest }) => rest);

    const payload = {
        format: EXPORT_FORMAT,
        version: EXPORT_FORMAT_VERSION,
        exported_at: new Date().toISOString(),
        note: "Book cover images are not included; re-upload them after importing.",
        profile: {
            display_name: getProfile()?.display_name || null
        },
        settings: pick(getSettings(), SETTINGS_COLUMNS),
        ...Object.fromEntries(
            Object.entries(everything).map(([table, rows]) => [table, strip(rows)])
        )
    };

    const blob =
        new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });

    const link =
        document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = `novellow-library-${todayIso()}.json`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => URL.revokeObjectURL(link.href), 2000);

    return {
        shelves: everything.shelves.length,
        books: everything.books.length
    };

}


/* =========================================================
   IMPORT: CHECK
========================================================= */

function isObject(value) {
    return value && typeof value === "object" && !Array.isArray(value);
}


/*
    Reads and checks an export file. Returns the cleaned data
    and a summary, or throws a readable error.
*/

export function checkImport(text) {

    let data;

    try {
        data = JSON.parse(text);
    }

    catch {
        throw new NovellowError("That file isn't a Novellow library export (it isn't valid JSON).");
    }

    if (!isObject(data) || data.format !== EXPORT_FORMAT) {
        throw new NovellowError("That file isn't a Novellow library export.");
    }

    if (typeof data.version !== "number" || data.version > EXPORT_FORMAT_VERSION) {
        throw new NovellowError("That export was made by a newer Novellow. Refresh the page and try again.");
    }

    const clean = {};
    let skipped = 0;

    Object.keys(COLUMNS).forEach((table) => {

        const rows =
            Array.isArray(data[table]) ? data[table] : [];

        clean[table] = rows.filter((row) => {

            const ok =
                isObject(row) && typeof row.id === "string";

            if (!ok) {
                skipped += 1;
            }

            return ok;

        });

    });

    const shelfIds =
        new Set(clean.shelves.filter((shelf) => typeof shelf.name === "string" && shelf.name.trim()).map((shelf) => shelf.id));

    clean.shelves = clean.shelves.filter((shelf) => shelfIds.has(shelf.id));

    const bookIds = new Set();

    clean.books = clean.books.filter((book) => {

        const ok =
            typeof book.title === "string" && book.title.trim() && shelfIds.has(book.shelf_id);

        if (ok) {
            bookIds.add(book.id);
        }

        else {
            skipped += 1;
        }

        return ok;

    });

    ["book_sections", "journal_entries", "quotes", "vocabulary", "questions", "characters", "book_themes", "reviews", "reading_sessions"]
        .forEach((table) => {

            const before =
                clean[table].length;

            clean[table] = clean[table].filter((row) => bookIds.has(row.book_id));

            skipped += before - clean[table].length;

        });

    return {
        data: clean,
        settings: isObject(data.settings) ? pick(data.settings, SETTINGS_COLUMNS) : null,
        summary: {
            shelves: clean.shelves.length,
            books: clean.books.length,
            entries: clean.journal_entries.length,
            quotes: clean.quotes.length,
            words: clean.vocabulary.length,
            skipped
        }
    };

}


/* =========================================================
   IMPORT: WRITE
========================================================= */

export async function importLibrary(checked, { skipDuplicates = true, useSettings = false } = {}) {

    await loadLibrary({ force: true });

    const me =
        currentUserId();

    const { data } =
        checked;

    const ids =
        new Map();

    const newId = (oldId) => {

        if (!ids.has(oldId)) {
            ids.set(oldId, crypto.randomUUID());
        }

        return ids.get(oldId);

    };

    // Shelves: reuse one of the reader's shelves with the same
    // name instead of making a duplicate.
    const existingShelves =
        new Map(getShelves().map((shelf) => [shelf.name.trim().toLowerCase(), shelf.id]));

    let nextOrder =
        getShelves().length;

    const shelves = [];

    data.shelves.forEach((shelf) => {

        const match =
            existingShelves.get(shelf.name.trim().toLowerCase());

        if (match) {
            ids.set(shelf.id, match);
            return;
        }

        shelves.push({
            ...pick(shelf, COLUMNS.shelves),
            id: newId(shelf.id),
            user_id: me,
            sort_order: nextOrder++
        });

    });

    // Books.
    const existingBooks =
        new Set(getBooks().map((book) => `${book.title.trim().toLowerCase()}|${(book.author || "").trim().toLowerCase()}`));

    const keptBooks =
        new Set();

    let duplicates = 0;

    const books =
        data.books
            .filter((book) => {

                const key =
                    `${book.title.trim().toLowerCase()}|${(book.author || "").trim().toLowerCase()}`;

                if (skipDuplicates && existingBooks.has(key)) {
                    duplicates += 1;
                    return false;
                }

                keptBooks.add(book.id);

                return true;

            })
            .map((book) => ({
                ...pick(book, COLUMNS.books),
                id: newId(book.id),
                user_id: me,
                shelf_id: ids.get(book.shelf_id),
                cover_path: null
            }));

    const forKeptBook = (table, extra = () => ({})) =>
        data[table]
            .filter((row) => keptBooks.has(row.book_id))
            .map((row) => ({
                ...pick(row, COLUMNS[table]),
                ...extra(row),
                user_id: me,
                book_id: ids.get(row.book_id)
            }));

    // Sections: parents must be inserted before their children.
    const sections =
        forKeptBook("book_sections", (row) => ({
            id: newId(row.id),
            parent_id: row.parent_id ? newId(row.parent_id) : null
        }));

    const ordered = [];
    const placed = new Set();

    while (ordered.length < sections.length) {

        const before =
            ordered.length;

        sections.forEach((section) => {

            if (!placed.has(section.id) && (!section.parent_id || placed.has(section.parent_id))) {
                ordered.push(section);
                placed.add(section.id);
            }

        });

        // A broken parent link: attach the rest to the whole book.
        if (ordered.length === before) {

            sections
                .filter((section) => !placed.has(section.id))
                .forEach((section) => {
                    ordered.push({ ...section, parent_id: null });
                    placed.add(section.id);
                });

        }

    }

    const sectionOf = (row) => ({
        section_id: row.section_id && ids.has(row.section_id) ? ids.get(row.section_id) : null
    });

    await insertRows("shelves", shelves);
    await insertRows("books", books);
    await insertRows("book_sections", ordered);
    await insertRows("journal_entries", forKeptBook("journal_entries", sectionOf));
    await insertRows("quotes", forKeptBook("quotes", sectionOf));
    await insertRows("vocabulary", forKeptBook("vocabulary", sectionOf));
    await insertRows("questions", forKeptBook("questions", sectionOf));
    await insertRows("characters", forKeptBook("characters"));
    await insertRows("book_themes", forKeptBook("book_themes"));
    await insertRows("reviews", forKeptBook("reviews"));
    await insertRows("reading_sessions", forKeptBook("reading_sessions"));

    await insertRows("reading_challenges", data.reading_challenges.map((row) => {

        const criteria =
            isObject(row.criteria) ? { ...row.criteria } : {};

        if (criteria.shelf_id) {
            criteria.shelf_id = ids.get(criteria.shelf_id) || undefined;
        }

        return { ...pick(row, COLUMNS.reading_challenges), criteria, user_id: me };

    }));

    await insertRows("decorations", data.decorations.map((row) => ({
        ...pick(row, COLUMNS.decorations),
        user_id: me
    })));

    if (useSettings && checked.settings) {
        await updateSettings(checked.settings);
    }

    await loadLibrary({ force: true });

    return {
        shelves: shelves.length,
        books: books.length,
        duplicates
    };

}
