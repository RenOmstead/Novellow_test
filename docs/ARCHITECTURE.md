# Novellow — Architecture

How Novellow is built. It started as the audit and plan below; the app
has since been built to it. To connect Supabase and publish, see
[SETUP.md](SETUP.md).

---

## 1. Audit of the current repository

Everything ever committed to this repository, on every branch:

| File | What it is |
| --- | --- |
| `dashboard.html` | The illustrated library room: sidebar, bookcase, window, lamp, open journal, reading widgets, armchair corner. |
| `dashboard.css` | Styles for that room (about 3,700 lines, one file). |
| `dashboard.js` | Sidebar collapse, sample shelf data, spine rendering, ivy growth, book selection, search, Add Book modal. |
| `LICENSE` | License. |
| `CNAME` | `novellow.com` / `www.novellow.com` — added and then deleted twice. |

There is **no** Supabase configuration, no login page, no data model, no
saved books, no settings code and no other pages anywhere in the history.
The "existing" fields and settings in the brief (statuses, `candleGlow`,
`decorationDensity`, reading goal 20, and so on) come from earlier notes, not
from this code. They are carried into the design below, but nothing needs to
be migrated from a database because none exists yet.

### What is reusable

- **The whole illustration system.** Nine illustrated navigation icons, the
  sleeping cat, candles, lantern, potion, skull, crow, bust, bell jar,
  teacup, plant, ghost, pumpkin, book stack, the illustrated cover, the
  window, the Tiffany lamp, the armchair and side table, the rug and 19 spine
  motifs. These move into `assets/illustrations/` and become a shared sprite.
- **The room layout and styling** (sidebar panel, crown, shelves, journal
  book, bookmark ribbons, paper widgets). It gets split into focused
  stylesheets instead of one file.
- **The spine renderer** (`createSpine`). It becomes `js/books/spine.js`,
  driven by each book's saved design instead of sample data. It is extended
  so **every spine shows its title** in the book's own font. Today the spines
  are motif-only, which the brief rules out.
- **The ivy generator, pull-out selection, journal arrows/tabs, sidebar
  collapse** (collapse state stays in `localStorage`, which is an allowed
  UI preference).

### What gets replaced

- The hardcoded `LIBRARY_SHELVES` sample data. Shelves and books come from
  Supabase, and a new account starts with an empty bookcase.
- The hardcoded journal text (the quote and the October 14 entry show
  for every book today).
- The `Date.now()` script/style injection used for cache busting (see
  section 4).
- The single-page structure. Each sidebar destination becomes a real page.

### Broken connections found

1. **`main` has no working JavaScript.** On `main`, `dashboard.js` contains
   a copy of the stylesheet (it begins with `@import url(...)`), so the
   browser throws a syntax error and nothing runs. The branch
   `claude/chatgpt-conversation-akghvr` has the working version.
2. **Startup never ran (fixed on the branch).** The `Date.now()` loader
   injects `dashboard.js` after the page has finished parsing, so the
   `DOMContentLoaded` listener never fired. That is why the sidebar collapse
   and other controls did nothing before the last update.
3. **Every navigation link 404s.** `library.html`, `currently-reading.html`,
   `to-read.html`, `community.html`, `challenges.html`, `journal.html`,
   `discover.html` and `settings.html` do not exist.
4. **The site root 404s.** There is no `index.html`, so visiting the domain
   shows GitHub's 404 page.
5. **Controls without behaviour:** theme button, profile button, Create
   another shelf, journal close button, status pill, three of the four
   bookmark ribbons, the Reading/Journal/Notes tabs (visual only), the
   snippets arrow.
6. **The custom domain is not configured.** The `CNAME` was deleted, so the
   site is only at the `github.io` address. This matters for Supabase's
   auth redirect settings (question 2 at the end).

---

## 2. File architecture

A static site with no build step to run locally. It is plain HTML, CSS and
JavaScript modules, and GitHub Pages serves it as-is.

```
/
├── index.html              Entrance: sign in / create account / reset password
├── dashboard.html          Home: the bookcase + open journal (main experience)
├── library.html            My Books: full library, search, filter, sort
│                           (To Be Read = library.html?status=want_to_read)
├── reading.html            Reading Now
├── journal.html            Journal hub; journal.html?book=<id> opens one journal
├── quotes.html             All saved quotes across the library
├── vocabulary.html         The wordbook across the library
├── stats.html              Reading statistics and goal
├── challenges.html         Annual goal + reader-made challenges
├── discover.html           Open Library search, TBR pick, prompts
├── community.html          Foundation: future public libraries / clubs
├── settings.html           Account, sign-ins, reading, appearance, data
├── 404.html                "This page wandered off" (self-contained)
│
├── assets/illustrations/
│   ├── sprite.svg          Every drawing as a <symbol> (icons, decor, scenes)
│   └── favicon.svg
│
├── css/
│   ├── tokens.css          Colours, fonts, spacing — Novellow Original
│   ├── base.css            Reset, buttons, fields, dialogs, toasts, loaders
│   ├── auth.css            Entrance page
│   ├── app-shell.css       Sidebar, header, search, popovers
│   ├── room.css            Wall, window, lamp, desk notes, cozy corner
│   ├── bookcase.css        Crown, shelf rows, plaques, empty shelves
│   ├── books.css           Spines, covers, pull-out and opening animation
│   ├── journal.css         The open journal and its sections
│   ├── forms.css           Book editor drawer
│   ├── pages.css           Library, reading, quotes, words, stats, settings…
│   ├── ambience.css        Candle glow, dust, fog, fireflies, rain, oddities
│   ├── decorations.css     Placed decorations and the "Arrange the room" bar
│   └── themes.css          The five other rooms ([data-theme="…"])
│
├── js/
│   ├── config.js           THE one place for Supabase URL/key and constants
│   ├── core/
│   │   ├── supabase.js     Creates the single Supabase client
│   │   ├── auth.js         Sign up/in/out, session guard, sign-in log
│   │   ├── store.js        Every database query (single source of truth)
│   │   ├── covers.js       Cover resize/upload, signed URLs
│   │   ├── errors.js       Friendly messages for auth and data errors
│   │   ├── rating.js       Half-star rating widget
│   │   ├── art.js          Loads the illustration sprite
│   │   ├── ui.js           Toasts, dialogs, loading and empty states
│   │   └── helpers.js      Safe HTML templates, dates, formatting
│   ├── shell/
│   │   ├── app-shell.js    Guards pages, builds sidebar and header
│   │   └── themes.js       Theme registry + applying appearance settings
│   ├── books/
│   │   ├── spine-options.js Fonts, styles, sizes and palettes for spines
│   │   ├── spine.js        Spine renderer + title fitting
│   │   ├── cover.js        Uploaded or illustrated covers
│   │   ├── bookcase.js     Shelves → rows of ≈10 → spines; drag to reorder
│   │   ├── book-reveal.js  Pull-out, turn and open animation
│   │   ├── book-editor.js  Add/Edit Book drawer with live spine preview
│   │   └── shelf-editor.js Add/rename/reorder/delete shelves
│   ├── journal/
│   │   ├── sections.js     The nine journal sections and their fields
│   │   └── journal.js      The open-book component (dashboard + journal page)
│   ├── room/
│   │   ├── ivy.js          Ivy growth (recoloured per theme)
│   │   ├── crown.js        Themed decor on top of the bookcase
│   │   ├── ambience.js     Dust, fog, fireflies, rain, oddities
│   │   └── decorations.js  Draggable decorations saved per theme
│   ├── data/transfer.js    Export / import the whole library as JSON
│   └── pages/              One entry file per HTML page (entrance.js = index)
│
├── sql/
│   ├── schema.sql          Tables, relationships, triggers, indexes
│   ├── policies.sql        Row Level Security
│   ├── storage.sql         Cover bucket and its policies
│   └── tests/              RLS isolation test (for a local Postgres)
│
├── docs/ARCHITECTURE.md    This document
├── docs/SETUP.md           Connecting Supabase and publishing
└── .github/workflows/pages.yml   Deploy + automatic cache busting
```

The sidebar and header are **built once in `app-shell.js`**, so the
navigation is not copied into twelve HTML files. Each page is a short
HTML file with a `<main>` and one `<script type="module">`.

### Navigation map

| Sidebar | Page |
| --- | --- |
| Home | `dashboard.html` |
| My Books | `library.html` |
| Reading Now | `reading.html` |
| To Be Read | `library.html?status=want_to_read` |
| Community | `community.html` |
| Challenges | `challenges.html` (links to `stats.html`) |
| Journal | `journal.html` (tabs to `quotes.html` and `vocabulary.html`) |
| Discover | `discover.html` |
| Settings | `settings.html` |

---

## 3. Supabase database

All tables live in `public`. Every user-owned table has
`user_id uuid references auth.users(id) on delete cascade`.

```
auth.users
  ├── profiles            1:1   display name, avatar, library visibility
  ├── user_settings       1:1   theme, ambience, goal, default sort
  ├── sign_in_events      1:many   every successful sign-in
  ├── shelves             1:many
  │     └── books         1:many   (a shelf with books cannot be deleted)
  │           ├── book_sections      Book / Part / Section / Chapter tree
  │           ├── journal_entries    notes and thoughts   (→ section optional)
  │           ├── quotes                                  (→ section optional)
  │           ├── vocabulary                              (→ section optional)
  │           ├── questions          with answered state  (→ section optional)
  │           ├── characters
  │           ├── book_themes
  │           ├── reviews            1:1 with the book
  │           └── reading_sessions   progress log for stats
  ├── reading_challenges
  └── decorations                    draggable decor positions
```

### Key decisions

- **One rating, one favourite flag and one finish date per book, stored on
  `books`.** The review page edits those same columns instead of keeping a
  second copy, so the shelf, Reading Now, stats and review can never disagree.
- **Notes and thoughts share `journal_entries`** with `kind = 'note' | 'thought'`.
  They have identical fields, so one table keeps the queries simple. Quotes,
  words, questions, characters and themes each get their own table because
  their fields differ.
- **Chapters are a tree** (`book_sections.parent_id`). Any entry, quote, word
  or question can point at a section, or at nothing, which means the whole
  book. Deleting a chapter keeps its notes and moves them to "whole book".
- **Spine design is one `jsonb` column** (`books.spine`): style, colours,
  font, size, weight, spacing, case, alignment, title panel, ornament, height,
  thickness. New design options will not need database changes.
- **Covers are stored as a Storage path** (`books.cover_path`), never as
  Base64 in a row.
- **Deleting a book cascades** to everything that belongs to it.
  **Deleting a shelf that still has books is refused by the database.**
  The app then offers to move the books to another shelf first.
- **Library visibility** (`profiles.library_visibility`, default `private`)
  exists now so public libraries can be added later. No public policies
  exist yet, so nothing is readable by anyone else.

The exact columns are in `sql/schema.sql`.

---

## 4. Cache busting

Nothing needs a hand-edited `?v=` again:

- Every HTML page references its CSS and JS with `?v=__VERSION__`, and
  modules import each other with the same stamp.
- A GitHub Actions workflow (`.github/workflows/pages.yml`) replaces
  `__VERSION__` with the commit ID on every push and publishes the site.
  Each deploy gets fresh URLs automatically and browsers can still cache
  between deploys.
- One-time step: in the repository's **Settings → Pages**, set **Source** to
  **GitHub Actions**.
- Opened locally, `?v=__VERSION__` is just a harmless query string.

---

## 5. Security plan (Row Level Security)

- **RLS is enabled on every table.** With RLS on and no matching policy,
  Postgres returns nothing, so the default is "no access".
- **Every owned table gets four policies** for the `authenticated` role only:
  select, insert, update and delete are allowed only where
  `user_id = auth.uid()` (`id = auth.uid()` for `profiles`). Inserts and
  updates also check it, so nobody can create or move a row into someone
  else's library.
- **Cross-account links are impossible even with forged IDs.** Child rows use
  composite foreign keys: `(book_id, user_id) → books(id, user_id)` and
  `(shelf_id, user_id) → shelves(id, user_id)`. A user who guesses another
  person's book ID still cannot attach a quote to it, because the database
  rejects the pair.
- **The sign-in log is append-only.** Users can read and add their own
  events, but cannot edit or delete them.
- **The `anon` role gets no table access at all**, so a signed-out visitor
  can read nothing.
- **Only the publishable key (or legacy anon key) goes in the browser.** It
  identifies the project; RLS is what actually protects the data. The
  service-role key is never used in this app.
- **New accounts are set up by a database trigger.** When someone signs up,
  a `security definer` function creates their `profiles` and
  `user_settings` rows, using the display name from the sign-up form.

### Tested

The three SQL files were run on a local PostgreSQL 16 with stand-ins for
Supabase's `auth` and `storage` schemas (`sql/tests/`). Two test accounts
were created, and every check passed:

- Signing up creates the profile (with the chosen display name) and the
  settings row (goal 20).
- A second account sees none of the first account's books, notes, quotes,
  sign-ins or covers.
- It cannot update, delete or rename anything that isn't its own.
- It cannot attach a quote to the other account's book, even using that
  book's real ID.
- It cannot write rows as the other account, and cannot upload into the
  other account's cover folder.
- The sign-in log cannot be edited or deleted.
- A shelf with books cannot be deleted; an empty one can.
- Deleting a chapter keeps its notes and moves them to the whole book.
- Deleting a book removes its notes, quotes, words and review.
- Deleting an account removes everything it owns.
- Signed-out visitors cannot read any table.

This is not a substitute for running the files on the real Supabase
project, which is the first step once it exists.

---

## 6. Cover storage

- **Private bucket `book-covers`.** It allows JPEG, PNG and WebP up to 5 MB.
- **One folder per user.** Each file is stored at
  `{user_id}/{book_id}/{random-id}.webp`. Storage policies only allow
  reading, uploading, replacing or deleting inside the folder whose first
  segment equals the signed-in user's ID.
- **Covers are shrunk before upload.** The browser resizes the image to at
  most 900 px tall and saves it as WebP, so uploads are fast and shelves load
  quickly.
- **Covers are shown through signed URLs.** Because the bucket is private,
  the app asks for signed URLs (valid one hour) in one batch for all visible
  covers and reuses them while the page is open.
- **Old files are cleaned up.** Replacing a cover deletes the old file, and
  deleting a book removes its cover folder.

---

## 7. Data flow: shelf → selected book → journal

1. **Load.** `dashboard.html` loads the profile, settings, shelves and books
   in parallel through `store.js` (four queries, all filtered by RLS). The
   store keeps one in-memory map of `book.id → book`. The shelf, the journal,
   Reading Now and search all read from that map; no page keeps its own copy.
2. **Render.** `bookcase.js` places each shelf's books into rows of about
   10. When a row fills, a new wooden row appears underneath, so the bookcase
   grows downward. Each spine carries only `data-book-id`, the UUID.
3. **Pull out.** Clicking a spine looks the book up by ID. The spine slides
   forward out of the shelf and turns to show its front cover (the uploaded
   cover, or the illustrated cover tinted with the spine colour).
4. **Open.** The book opens into the journal. The first page shows the cover,
   title, author, **star rating**, status and progress. The address becomes
   `?book=<uuid>`, so a refresh or shared link reopens the same book.
5. **Load the journal.** The journal loads that book's sections, entries,
   quotes, words, questions, characters, themes and review in parallel, each
   query filtered by `book_id`.
6. **Save.** Every change is written to Supabase first, then the in-memory
   store updates and the view redraws. If a save fails, the change is rolled
   back and a readable message appears.
7. **On phones,** tapping a spine plays the same pull-out, then the journal
   opens as a full-screen book with pages you swipe between.

A book's UUID is created by the database, and everything that belongs to it
references that ID with a foreign key. Nothing is matched by title.

---

## 8. How accounts stay separate

- **Every request is tied to an account.** The session token identifies the
  user, and Postgres reads it as `auth.uid()`.
- **Every row carries `user_id`.** RLS compares it with `auth.uid()` on every
  read and write. Filtering in the browser is only for display; privacy is
  enforced by the database.
- **Composite foreign keys stop cross-account links,** even with guessed IDs.
- **Storage paths start with the user's ID,** and storage policies check it.
- **Signed-out visitors see nothing:** `anon` has no table access, and every
  app page redirects them to the entrance.

---

## 9. Sign-in tracking

Every successful sign-in and sign-up adds a row to `sign_in_events` (time and
browser). Each person sees their own history under **Settings → Account**.
The site owner can see every account's sign-ins in the Supabase dashboard,
both in the Table Editor (`sign_in_events`) and under
**Authentication → Logs**, which also records failed attempts.

---

## 10. Build phases

1. **Foundation:** file structure, design tokens, sprite, config, SQL.
2. **Auth:** entrance page, sign up, sign in, session restore, sign out,
   profiles, sign-in log.
3. **Library core:** shelves, books, cover uploads, book editor with live
   spine preview, rows of about 10, edit/move/delete.
4. **Book interaction:** hover, pull out, cover reveal, opening animation.
5. **Journals:** overview, notes, quotes, words, thoughts, characters,
   themes, questions, review, chapters.
6. **Reading:** Reading Now, progress, dates, finishing a book, ratings.
7. **Stats:** goal, totals, visual charts, derived stats.
8. **Personalisation:** themes, ambience, draggable decorations.
9. **Secondary areas:** Discover, Challenges, Community foundations.
10. **Mobile and polish:** responsive passes, accessibility, loading and
    error states.

Each phase is tested in a real browser against the Supabase project before
the next one starts.
