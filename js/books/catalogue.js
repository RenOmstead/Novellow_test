/* =========================================================
   NOVELLOW
   FINDING A BOOK

   Searches two free public catalogues together and merges
   what they find: Open Library (the Internet Archive) and
   Google Books, which knows many newer, indie and
   self-published books that Open Library doesn't have yet.
   Used by Discover (by title or author, or by topic) and by
   the barcode scanner.

   A result:
     { key, source, title, author, year, pages, isbn, genre,
       cover (small, to show), coverLarge (to keep) }
========================================================= */

import { GOOGLE_BOOKS_KEY } from "../config.js?v=__VERSION__";


const OPEN_LIBRARY =
    "https://openlibrary.org/search.json";

const OPEN_LIBRARY_FIELDS =
    "key,title,subtitle,author_name,first_publish_year,number_of_pages_median,isbn,cover_i,subject";

const GOOGLE_BOOKS =
    "https://www.googleapis.com/books/v1/volumes";

// How many each catalogue is asked for.
const EACH = 20;


/* =========================================================
   EACH CATALOGUE
========================================================= */

function fromOpenLibrary(doc) {

    return {
        key: `ol:${doc.key}`,
        source: "Open Library",
        title: doc.title,
        author: doc.author_name?.[0] || null,
        year: doc.first_publish_year || null,
        pages: doc.number_of_pages_median || null,
        isbn: doc.isbn?.find((isbn) => isbn.length === 13) || doc.isbn?.[0] || null,
        genre: doc.subject?.find((subject) => subject.length < 24) || null,
        cover: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
        coverLarge: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : null
    };

}


function fromGoogle(item) {

    const info =
        item.volumeInfo || {};

    const ids =
        info.industryIdentifiers || [];

    const isbn =
        ids.find((id) => id.type === "ISBN_13")?.identifier
        || ids.find((id) => id.type === "ISBN_10")?.identifier
        || null;

    const thumbnail =
        (info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || "").replace(/^http:/, "https:");

    return {
        key: `gb:${item.id}`,
        source: "Google Books",
        title: info.title,
        author: info.authors?.[0] || null,
        year: Number.parseInt(String(info.publishedDate || "").slice(0, 4), 10) || null,
        pages: info.pageCount || null,
        isbn,
        genre: info.categories?.[0]?.split("/")[0].trim() || null,
        cover: thumbnail || null,
        // Kept covers come from Open Library by ISBN when it has
        // one (it lets the app copy the picture); otherwise from
        // Google's own, larger picture.
        coverLarge: isbn
            ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`
            : thumbnail ? thumbnail.replace("zoom=1", "zoom=2") : null
    };

}


async function askOpenLibrary(query) {

    const response =
        await fetch(`${OPEN_LIBRARY}?${query}&limit=${EACH}&fields=${OPEN_LIBRARY_FIELDS}`);

    if (!response.ok) {
        throw new Error(`Open Library ${response.status}`);
    }

    return ((await response.json()).docs || []).filter((doc) => doc.title).map(fromOpenLibrary);

}


async function askGoogle(q) {

    const key =
        GOOGLE_BOOKS_KEY ? `&key=${encodeURIComponent(GOOGLE_BOOKS_KEY)}` : "";

    const response =
        await fetch(`${GOOGLE_BOOKS}?q=${encodeURIComponent(q)}&maxResults=${EACH}&printType=books${key}`);

    if (!response.ok) {
        throw new Error(`Google Books ${response.status}`);
    }

    return ((await response.json()).items || []).filter((item) => item.volumeInfo?.title).map(fromGoogle);

}


/* =========================================================
   TOGETHER
========================================================= */

const simple = (text) =>
    String(text || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

// The same book from both catalogues: the same ISBN, or the
// same title and author.
function sameBook(a, b) {
    return (a.isbn && b.isbn && a.isbn === b.isbn)
        || (simple(a.title) === simple(b.title) && simple(a.author) === simple(b.author));
}


// Takes turns between the catalogues (each lists its best
// matches first), leaving out a book already found; a copy
// fills in what the first one was missing.
function merge(lists) {

    const merged = [];

    const longest =
        Math.max(0, ...lists.map((list) => list.length));

    for (let index = 0; index < longest; index += 1) {

        lists.forEach((list) => {

            const result =
                list[index];

            if (!result) {
                return;
            }

            const twin =
                merged.find((item) => sameBook(item, result));

            if (!twin) {
                merged.push(result);
                return;
            }

            ["author", "year", "pages", "isbn", "genre", "cover", "coverLarge"].forEach((field) => {
                twin[field] ??= result[field];
            });

        });

    }

    return merged;

}


async function together(asks) {

    const settled =
        await Promise.allSettled(asks);

    const found =
        settled.filter((item) => item.status === "fulfilled").map((item) => item.value);

    // Only an error if every catalogue failed.
    if (!found.length) {
        throw settled[0].reason;
    }

    return merge(found);

}


function digitsOf(term) {
    return String(term).toUpperCase().replace(/[^0-9X]/g, "");
}

const looksLikeIsbn = (term) =>
    /^(97[89]\d{10}|\d{9}[\dX])$/.test(digitsOf(term));


/*
    Finds books by title, author, or both (or an ISBN).
*/
export async function searchBooks(term) {

    const text =
        String(term || "").trim();

    if (!text) {
        return [];
    }

    if (looksLikeIsbn(text)) {
        const isbn = digitsOf(text);
        return together([askOpenLibrary(`isbn=${isbn}`), askGoogle(`isbn:${isbn}`)]);
    }

    return together([askOpenLibrary(`q=${encodeURIComponent(text)}`), askGoogle(text)]);

}


// Words that don't say what a book is about.
const LITTLE_WORDS =
    new Set(["a", "an", "the", "of", "on", "in", "with", "and", "or", "to", "about", "book", "books", "story", "stories", "set", "its", "it"]);

/*
    Finds books about something: a topic, a theme or a genre
    ("haunted house", "witches", "cozy mystery"). Asks Open
    Library for books with those subjects, and Google Books for
    books whose description or category mentions them, since a
    catalogue can't see what's on a cover, but a blurb often
    says it.
*/
export async function searchTopic(term) {

    const words =
        String(term || "").trim().split(/\s+/).filter(Boolean);

    if (!words.length) {
        return [];
    }

    // Each word that matters as a subject, allowing plurals
    // ("house" finds "Haunted houses").
    const subjects =
        words
            .map((word) => word.toLowerCase().replace(/[^\p{L}\p{N}'-]/gu, ""))
            .filter((word) => word && !LITTLE_WORDS.has(word))
            .map((word) => `subject:${word}*`)
            .join(" AND ") || `subject:${words[0].toLowerCase()}`;

    const phrase =
        words.join(" ");

    return together([
        askOpenLibrary(`q=${encodeURIComponent(subjects)}`),
        askGoogle(`subject:${phrase}`),
        askGoogle(phrase)
    ]);

}


/*
    The book with this ISBN, from whichever catalogue has it,
    or null.
*/
export async function findIsbn(isbn) {

    const found =
        await together([askOpenLibrary(`isbn=${isbn}`), askGoogle(`isbn:${isbn}`)]);

    return found[0] || null;

}
