/* =========================================================
   NOVELLOW
   JOURNAL SECTIONS

   The nine parts of every book's journal. List sections
   (notes, quotes, words, thoughts, characters, themes,
   questions) share one engine in journal.js; each is
   described here: its table, its fields, and how an entry
   looks on the page.
========================================================= */

import { html, formatDate, truncate } from "../core/helpers.js?v=__VERSION__";


export const SECTIONS = [
    { id: "overview", label: "Overview", heading: "A little about this book", art: "tab-overview", color: "rose" },
    { id: "notes", label: "Notes", heading: "Notes from the margins", art: "tab-notes", color: "blush" },
    { id: "quotes", label: "Quotes", heading: "Lines I want to remember", art: "tab-quotes", color: "plum" },
    { id: "words", label: "Words", heading: "Little words worth keeping", art: "tab-words", color: "sage" },
    { id: "thoughts", label: "Thoughts", heading: "Things I'm thinking about", art: "tab-thoughts", color: "lavender" },
    { id: "characters", label: "Characters", heading: "People inside the pages", art: "tab-characters", color: "peach" },
    { id: "themes", label: "Themes", heading: "Ideas running underneath", art: "tab-themes", color: "moss" },
    { id: "questions", label: "Questions", heading: "Things I'm still wondering", art: "tab-questions", color: "berry" },
    { id: "review", label: "Review", heading: "What I thought in the end", art: "tab-review", color: "gold" }
];


export function sectionById(id) {
    return SECTIONS.find((section) => section.id === id) || SECTIONS[0];
}


const PARTS_OF_SPEECH = [
    "noun", "verb", "adjective", "adverb", "phrase", "idiom", "other"
];


/* =========================================================
   LIST SECTIONS
   fields: what the add/edit form asks for
     type: text | textarea | number | chapter | select | checkbox
   item(row, chapterLabel): how a saved entry is drawn
========================================================= */

export const LIST_SECTIONS = {

    notes: {
        table: "journal_entries",
        match: { kind: "note" },
        chapters: true,
        addLabel: "Add a note",
        noun: "note",
        empty: "No notes yet. Jot down whatever catches your eye in the margins.",
        fields: [
            { name: "title", label: "Title", type: "text", optional: true, max: 200 },
            { name: "body", label: "Note", type: "textarea", required: true, hand: true, max: 50000 },
            { name: "section_id", label: "Chapter", type: "chapter" },
            { name: "page", label: "Page", type: "number" },
            { name: "location", label: "Where", type: "text", optional: true, max: 120, placeholder: "the storm scene" }
        ],
        item: (row, chapter) => html`
            ${row.title ? html`<h4 class="entry__title">${row.title}</h4>` : ""}
            <p class="entry__body handwritten">${row.body}</p>
            ${entryMeta(row, chapter)}
        `
    },

    thoughts: {
        table: "journal_entries",
        match: { kind: "thought" },
        chapters: true,
        addLabel: "Add a thought",
        noun: "thought",
        empty: "Reflections, reactions, theories — they all belong here.",
        fields: [
            { name: "title", label: "Title", type: "text", optional: true, max: 200 },
            { name: "body", label: "Thought", type: "textarea", required: true, hand: true, max: 50000 },
            { name: "section_id", label: "Chapter", type: "chapter" },
            { name: "page", label: "Page", type: "number" }
        ],
        item: (row, chapter) => html`
            ${row.title ? html`<h4 class="entry__title">${row.title}</h4>` : ""}
            <p class="entry__body handwritten">${row.body}</p>
            ${entryMeta(row, chapter)}
        `
    },

    quotes: {
        table: "quotes",
        chapters: true,
        addLabel: "Save a quote",
        noun: "quote",
        empty: "No lines saved yet. When a sentence stops you, keep it here.",
        fields: [
            { name: "text", label: "The passage", type: "textarea", required: true, max: 5000 },
            { name: "section_id", label: "Chapter", type: "chapter" },
            { name: "page", label: "Page", type: "number" },
            { name: "location", label: "Where", type: "text", optional: true, max: 120 },
            { name: "comment", label: "Why it matters", type: "textarea", optional: true, hand: true, max: 5000 }
        ],
        item: (row, chapter) => html`
            <blockquote class="entry__quote">“${row.text}”</blockquote>
            ${row.comment ? html`<p class="entry__comment handwritten">${row.comment}</p>` : ""}
            ${entryMeta(row, chapter)}
        `
    },

    words: {
        table: "vocabulary",
        chapters: true,
        addLabel: "Keep a word",
        noun: "word",
        empty: "No words yet. Found one you don't know? Keep it here with its meaning.",
        fields: [
            { name: "word", label: "Word", type: "text", required: true, max: 120 },
            { name: "part_of_speech", label: "Part of speech", type: "select", options: PARTS_OF_SPEECH, optional: true },
            { name: "definition", label: "Definition", type: "textarea", optional: true, max: 2000 },
            { name: "context", label: "How it was used", type: "textarea", optional: true, hand: true, max: 2000 },
            { name: "section_id", label: "Chapter", type: "chapter" },
            { name: "page", label: "Page", type: "number" }
        ],
        item: (row, chapter) => html`
            <h4 class="entry__word">
                ${row.word}
                ${row.part_of_speech ? html`<em>${row.part_of_speech}</em>` : ""}
            </h4>
            ${row.definition ? html`<p class="entry__definition">${row.definition}</p>` : ""}
            ${row.context ? html`<p class="entry__comment handwritten">“${row.context}”</p>` : ""}
            ${entryMeta(row, chapter)}
        `
    },

    characters: {
        table: "characters",
        chapters: false,
        addLabel: "Add a character",
        noun: "character",
        empty: "Who lives inside these pages? Keep track of them here.",
        fields: [
            { name: "name", label: "Name", type: "text", required: true, max: 120 },
            { name: "relationship", label: "Relationship", type: "text", optional: true, max: 200, placeholder: "the heroine's sister" },
            { name: "description", label: "Description", type: "textarea", optional: true, max: 2000 },
            { name: "notes", label: "Important details", type: "textarea", optional: true, hand: true, max: 5000 }
        ],
        item: (row) => html`
            <h4 class="entry__title">${row.name}</h4>
            ${row.relationship ? html`<p class="entry__tag">${row.relationship}</p>` : ""}
            ${row.description ? html`<p class="entry__definition">${row.description}</p>` : ""}
            ${row.notes ? html`<p class="entry__comment handwritten">${row.notes}</p>` : ""}
        `
    },

    themes: {
        table: "book_themes",
        chapters: false,
        addLabel: "Add a theme",
        noun: "theme",
        empty: "What ideas keep surfacing? Grief, courage, home… note them here.",
        fields: [
            { name: "name", label: "Theme", type: "text", required: true, max: 120 },
            { name: "explanation", label: "What it's about", type: "textarea", optional: true, max: 2000 },
            { name: "examples", label: "Examples", type: "textarea", optional: true, hand: true, max: 5000 }
        ],
        item: (row) => html`
            <h4 class="entry__title">${row.name}</h4>
            ${row.explanation ? html`<p class="entry__definition">${row.explanation}</p>` : ""}
            ${row.examples ? html`<p class="entry__comment handwritten">${row.examples}</p>` : ""}
        `
    },

    questions: {
        table: "questions",
        chapters: true,
        addLabel: "Ask a question",
        noun: "question",
        empty: "Wondering about something? Write the question down and come back to it.",
        fields: [
            { name: "question", label: "Question", type: "textarea", required: true, hand: true, max: 2000 },
            { name: "section_id", label: "Chapter", type: "chapter" },
            { name: "page", label: "Page", type: "number" },
            { name: "answer", label: "Answer (if you've found one)", type: "textarea", optional: true, max: 5000 },
            { name: "resolved", label: "Answered", type: "checkbox" }
        ],
        item: (row, chapter) => html`
            <div class="entry__question ${row.resolved ? "is-resolved" : ""}">
                <label class="check entry__resolve">
                    <input type="checkbox" data-action="toggle-resolved" data-id="${row.id}" ${row.resolved ? html`checked` : ""}>
                    <span class="visually-hidden">Answered</span>
                </label>
                <p class="handwritten">${row.question}</p>
            </div>
            ${row.answer ? html`<p class="entry__definition">${row.answer}</p>` : ""}
            ${entryMeta(row, chapter)}
        `
    }

};


function entryMeta(row, chapter) {

    const bits = [
        chapter,
        row.page ? `p. ${row.page}` : "",
        row.location,
        formatDate(row.created_at)
    ].filter(Boolean);

    return bits.length
        ? html`<p class="entry__meta">${bits.join(" · ")}</p>`
        : "";

}


/* =========================================================
   CHAPTERS
   book_sections form a tree: Book › Part › Section › Chapter.
========================================================= */

export const SECTION_KINDS = [
    { id: "book", label: "Book" },
    { id: "part", label: "Part" },
    { id: "section", label: "Section" },
    { id: "chapter", label: "Chapter" }
];


/*
    Flattens the tree in reading order with a depth and a
    readable path for each section.
*/

export function flattenSections(sections) {

    const children = new Map();

    sections.forEach((section) => {

        const key = section.parent_id || "root";

        if (!children.has(key)) {
            children.set(key, []);
        }

        children.get(key).push(section);

    });

    children.forEach((list) =>
        list.sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at))
    );

    const flat = [];

    const walk = (parentKey, depth, path) => {

        (children.get(parentKey) || []).forEach((section) => {

            const label =
                [...path, section.title];

            flat.push({ ...section, depth, path: label.join(" › ") });

            walk(section.id, depth + 1, label);

        });

    };

    walk("root", 0, []);

    return flat;

}


export function chapterOptions(flat, selected, { includeAll = false } = {}) {

    return html`
        ${includeAll ? html`<option value="all" ${selected === "all" ? html`selected` : ""}>All chapters</option>` : ""}
        <option value="" ${!selected ? html`selected` : ""}>Whole book</option>
        ${flat.map((section) => html`
            <option value="${section.id}" ${section.id === selected ? html`selected` : ""}>${" ".repeat(section.depth)}${section.title}</option>
        `)}
    `;

}


export function summarize(row) {
    return truncate(row.body || row.text || row.word || row.question || row.name || "", 60);
}
