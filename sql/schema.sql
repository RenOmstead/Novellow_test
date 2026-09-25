-- =========================================================
-- NOVELLOW
-- DATABASE SCHEMA
--
-- Run in the Supabase SQL Editor, in this order:
--   1. schema.sql    (this file)
--   2. policies.sql
--   3. storage.sql
--
-- Every user-owned table carries user_id and is protected by
-- Row Level Security in policies.sql.
-- =========================================================


-- =========================================================
-- SHARED HELPERS
-- =========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;


-- =========================================================
-- PROFILES
-- One row per account, created automatically on sign-up.
-- =========================================================

create table public.profiles (
    id uuid primary key
        references auth.users (id) on delete cascade,

    display_name text not null default 'Reader'
        check (char_length(trim(display_name)) between 1 and 60),

    avatar_path text,

    -- Private by default. Public libraries are a future feature;
    -- no policy exposes anything yet.
    library_visibility text not null default 'private'
        check (library_visibility in ('private', 'public')),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- =========================================================
-- USER SETTINGS
-- =========================================================

create table public.user_settings (
    user_id uuid primary key
        references auth.users (id) on delete cascade,

    theme text not null default 'original',

    candle_glow boolean not null default true,
    dust boolean not null default true,

    -- null means "follow the theme's default"
    rain boolean,

    oddities boolean not null default true,
    reduced_motion boolean not null default false,

    decoration_density text not null default 'cozy'
        check (decoration_density in ('sparse', 'cozy', 'abundant')),

    default_shelf_sort text not null default 'manual'
        check (default_shelf_sort in (
            'manual', 'title', 'author', 'rating',
            'date_added', 'date_finished'
        )),

    annual_goal integer not null default 20
        check (annual_goal between 0 and 1000),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- =========================================================
-- SIGN-IN LOG
-- One row per successful sign-in or sign-up.
-- =========================================================

create table public.sign_in_events (
    id bigint generated always as identity primary key,

    user_id uuid not null
        references auth.users (id) on delete cascade,

    signed_in_at timestamptz not null default now(),

    -- password: the sign-in form
    -- sign_up: signed straight in when creating an account
    -- email_link: arrived through a confirmation or reset email
    method text not null default 'password'
        check (method in ('password', 'sign_up', 'email_link')),

    user_agent text
        check (char_length(user_agent) <= 400)
);


-- =========================================================
-- NEW ACCOUNT SETUP
-- Creates the profile and settings rows when someone signs up.
-- =========================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.profiles (id, display_name)
    values (
        new.id,
        left(
            coalesce(
                nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
                nullif(split_part(new.email, '@', 1), ''),
                'Reader'
            ),
            60
        )
    );

    insert into public.user_settings (user_id)
    values (new.id);

    return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute function public.handle_new_user();


-- =========================================================
-- SHELVES
-- =========================================================

create table public.shelves (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references auth.users (id) on delete cascade,

    name text not null
        check (char_length(trim(name)) between 1 and 60),

    description text
        check (char_length(description) <= 300),

    sort_order integer not null default 0,

    style text not null default 'classic_wood'
        check (style in (
            'classic_wood', 'dark_oak', 'walnut', 'painted', 'floating'
        )),

    color text
        check (color ~ '^#[0-9a-fA-F]{6}$'),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    -- Lets books reference (shelf, owner) together.
    unique (id, user_id)
);


-- =========================================================
-- BOOKS
-- =========================================================

create table public.books (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references auth.users (id) on delete cascade,

    shelf_id uuid not null,

    title text not null
        check (char_length(trim(title)) between 1 and 300),

    author text
        check (char_length(author) <= 200),

    genre text
        check (char_length(genre) <= 80),

    publication_year integer
        check (publication_year between -3000 and 3000),

    page_count integer
        check (page_count > 0),

    isbn text
        check (char_length(isbn) <= 20),

    series text
        check (char_length(series) <= 200),

    series_number numeric(6, 1),

    status text not null default 'want_to_read'
        check (status in (
            'want_to_read', 'reading', 'paused',
            'finished', 'dnf', 'reference'
        )),

    -- Half stars allowed: 0, 0.5, 1 … 5
    rating numeric(2, 1)
        check (rating between 0 and 5 and rating * 2 = floor(rating * 2)),

    date_started date,
    date_finished date,

    current_page integer not null default 0
        check (current_page >= 0),

    times_read integer not null default 0
        check (times_read >= 0),

    is_favorite boolean not null default false,

    -- Path inside the book-covers bucket: {user_id}/{book_id}/{file}
    cover_path text,

    -- Spine design: style, colours, font, size, weight, spacing,
    -- case, alignment, title panel, ornament, height, thickness.
    spine jsonb not null default '{}'::jsonb
        check (jsonb_typeof(spine) = 'object'),

    -- Order within the shelf when sorting is manual.
    shelf_position integer not null default 0,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    unique (id, user_id),

    -- A book can only sit on a shelf owned by the same person.
    -- NO ACTION: deleting a shelf that still holds books fails,
    -- so the app can offer to move them first.
    foreign key (shelf_id, user_id)
        references public.shelves (id, user_id)
        on delete no action,

    check (
        date_finished is null
        or date_started is null
        or date_finished >= date_started
    )
);


-- =========================================================
-- BOOK SECTIONS
-- Book / Part / Section / Chapter tree for chapter-by-chapter notes.
-- =========================================================

create table public.book_sections (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references auth.users (id) on delete cascade,

    book_id uuid not null,

    parent_id uuid,

    kind text not null default 'chapter'
        check (kind in ('book', 'part', 'section', 'chapter')),

    title text not null
        check (char_length(trim(title)) between 1 and 120),

    sort_order integer not null default 0,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    unique (id, book_id),

    foreign key (book_id, user_id)
        references public.books (id, user_id)
        on delete cascade,

    -- A parent section must belong to the same book.
    foreign key (parent_id, book_id)
        references public.book_sections (id, book_id)
        on delete cascade
);


-- =========================================================
-- JOURNAL ENTRIES
-- Notes ("Notes from the margins") and thoughts
-- ("Things I'm thinking about") share one shape.
-- =========================================================

create table public.journal_entries (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references auth.users (id) on delete cascade,

    book_id uuid not null,

    -- null = the whole book
    section_id uuid,

    kind text not null default 'note'
        check (kind in ('note', 'thought')),

    title text
        check (char_length(title) <= 200),

    body text not null default ''
        check (char_length(body) <= 50000),

    page integer
        check (page >= 0),

    location text
        check (char_length(location) <= 120),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    foreign key (book_id, user_id)
        references public.books (id, user_id)
        on delete cascade,

    -- Deleting a chapter keeps the entry, attached to the whole book.
    foreign key (section_id, book_id)
        references public.book_sections (id, book_id)
        on delete set null (section_id)
);


-- =========================================================
-- QUOTES
-- =========================================================

create table public.quotes (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references auth.users (id) on delete cascade,

    book_id uuid not null,

    section_id uuid,

    text text not null
        check (char_length(trim(text)) between 1 and 5000),

    page integer
        check (page >= 0),

    location text
        check (char_length(location) <= 120),

    comment text
        check (char_length(comment) <= 5000),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    foreign key (book_id, user_id)
        references public.books (id, user_id)
        on delete cascade,

    foreign key (section_id, book_id)
        references public.book_sections (id, book_id)
        on delete set null (section_id)
);


-- =========================================================
-- VOCABULARY
-- =========================================================

create table public.vocabulary (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references auth.users (id) on delete cascade,

    book_id uuid not null,

    section_id uuid,

    word text not null
        check (char_length(trim(word)) between 1 and 120),

    part_of_speech text
        check (char_length(part_of_speech) <= 40),

    definition text
        check (char_length(definition) <= 2000),

    page integer
        check (page >= 0),

    context text
        check (char_length(context) <= 2000),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    foreign key (book_id, user_id)
        references public.books (id, user_id)
        on delete cascade,

    foreign key (section_id, book_id)
        references public.book_sections (id, book_id)
        on delete set null (section_id)
);


-- =========================================================
-- QUESTIONS
-- =========================================================

create table public.questions (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references auth.users (id) on delete cascade,

    book_id uuid not null,

    section_id uuid,

    question text not null
        check (char_length(trim(question)) between 1 and 2000),

    answer text
        check (char_length(answer) <= 5000),

    resolved boolean not null default false,

    page integer
        check (page >= 0),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    foreign key (book_id, user_id)
        references public.books (id, user_id)
        on delete cascade,

    foreign key (section_id, book_id)
        references public.book_sections (id, book_id)
        on delete set null (section_id)
);


-- =========================================================
-- CHARACTERS
-- =========================================================

create table public.characters (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references auth.users (id) on delete cascade,

    book_id uuid not null,

    name text not null
        check (char_length(trim(name)) between 1 and 120),

    description text
        check (char_length(description) <= 2000),

    relationship text
        check (char_length(relationship) <= 200),

    notes text
        check (char_length(notes) <= 5000),

    sort_order integer not null default 0,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    foreign key (book_id, user_id)
        references public.books (id, user_id)
        on delete cascade
);


-- =========================================================
-- THEMES / IDEAS
-- (Named book_themes to avoid confusion with visual themes.)
-- =========================================================

create table public.book_themes (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references auth.users (id) on delete cascade,

    book_id uuid not null,

    name text not null
        check (char_length(trim(name)) between 1 and 120),

    explanation text
        check (char_length(explanation) <= 2000),

    examples text
        check (char_length(examples) <= 5000),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    foreign key (book_id, user_id)
        references public.books (id, user_id)
        on delete cascade
);


-- =========================================================
-- REVIEWS
-- One per book. The rating, favourite flag and finish date
-- live on books so every page reads the same values.
-- =========================================================

create table public.reviews (
    book_id uuid primary key,

    user_id uuid not null
        references auth.users (id) on delete cascade,

    body text
        check (char_length(body) <= 50000),

    final_thoughts text
        check (char_length(final_thoughts) <= 5000),

    would_reread boolean,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    foreign key (book_id, user_id)
        references public.books (id, user_id)
        on delete cascade
);


-- =========================================================
-- READING SESSIONS
-- A log of progress updates, used for stats over time.
-- =========================================================

create table public.reading_sessions (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references auth.users (id) on delete cascade,

    book_id uuid not null,

    logged_on date not null default current_date,

    start_page integer
        check (start_page >= 0),

    end_page integer
        check (end_page >= 0),

    pages_read integer generated always as (
        greatest(coalesce(end_page, 0) - coalesce(start_page, 0), 0)
    ) stored,

    minutes integer
        check (minutes >= 0),

    created_at timestamptz not null default now(),

    foreign key (book_id, user_id)
        references public.books (id, user_id)
        on delete cascade
);


-- =========================================================
-- READING CHALLENGES
-- The annual goal lives in user_settings; these are extra,
-- user-created challenges.
-- =========================================================

create table public.reading_challenges (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references auth.users (id) on delete cascade,

    title text not null
        check (char_length(trim(title)) between 1 and 120),

    description text
        check (char_length(description) <= 1000),

    target integer not null
        check (target > 0),

    -- What counts toward the challenge, e.g. {"genre": "Fantasy"}
    criteria jsonb not null default '{}'::jsonb
        check (jsonb_typeof(criteria) = 'object'),

    starts_on date,
    ends_on date,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    check (ends_on is null or starts_on is null or ends_on >= starts_on)
);


-- =========================================================
-- DECORATIONS
-- Positions are percentages of their room area so they
-- stay in place across screen sizes.
-- =========================================================

create table public.decorations (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references auth.users (id) on delete cascade,

    asset_id text not null
        check (char_length(asset_id) <= 80),

    decoration_type text not null
        check (char_length(decoration_type) <= 40),

    room_area text not null default 'wall'
        check (room_area in (
            'bookcase_top', 'wall', 'window', 'floor', 'shelf', 'desk'
        )),

    theme text not null default 'original',

    position_x numeric(5, 2) not null default 50
        check (position_x between 0 and 100),

    position_y numeric(5, 2) not null default 50
        check (position_y between 0 and 100),

    scale numeric(4, 2) not null default 1
        check (scale between 0.25 and 3),

    rotation numeric(5, 1) not null default 0
        check (rotation between -180 and 180),

    z_index integer not null default 1
        check (z_index between 0 and 50),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- =========================================================
-- UPDATED_AT TRIGGERS
-- =========================================================

create trigger set_updated_at before update on public.profiles
    for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.user_settings
    for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.shelves
    for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.books
    for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.book_sections
    for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.journal_entries
    for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.quotes
    for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.vocabulary
    for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.questions
    for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.characters
    for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.book_themes
    for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.reviews
    for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.reading_challenges
    for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.decorations
    for each row execute function public.set_updated_at();


-- =========================================================
-- INDEXES
-- =========================================================

create index shelves_user_order_idx
    on public.shelves (user_id, sort_order);

create index books_user_shelf_idx
    on public.books (user_id, shelf_id, shelf_position);

create index books_user_status_idx
    on public.books (user_id, status);

create index book_sections_book_idx
    on public.book_sections (book_id, sort_order);

create index journal_entries_book_idx
    on public.journal_entries (book_id, created_at);

create index journal_entries_user_idx
    on public.journal_entries (user_id, created_at desc);

create index quotes_book_idx
    on public.quotes (book_id, created_at);

create index quotes_user_idx
    on public.quotes (user_id, created_at desc);

create index vocabulary_book_idx
    on public.vocabulary (book_id, created_at);

create index vocabulary_user_word_idx
    on public.vocabulary (user_id, lower(word));

create index questions_book_idx
    on public.questions (book_id, created_at);

create index characters_book_idx
    on public.characters (book_id, sort_order);

create index book_themes_book_idx
    on public.book_themes (book_id, created_at);

create index reading_sessions_user_idx
    on public.reading_sessions (user_id, logged_on);

create index reading_sessions_book_idx
    on public.reading_sessions (book_id, logged_on);

create index reading_challenges_user_idx
    on public.reading_challenges (user_id, created_at);

create index decorations_user_idx
    on public.decorations (user_id, theme);

create index sign_in_events_user_idx
    on public.sign_in_events (user_id, signed_in_at desc);


-- =========================================================
-- CLEAR MY LIBRARY
-- Deletes the signed-in user's library content (not the account).
-- Runs with the caller's permissions, so RLS still applies.
-- Cover files are removed from Storage by the app.
-- =========================================================

create or replace function public.clear_my_library()
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
    me uuid := auth.uid();
begin
    if me is null then
        raise exception 'Not signed in';
    end if;

    delete from public.books where user_id = me;
    delete from public.shelves where user_id = me;
    delete from public.reading_challenges where user_id = me;
    delete from public.decorations where user_id = me;
end;
$$;
