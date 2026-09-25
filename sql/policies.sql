-- =========================================================
-- NOVELLOW
-- ROW LEVEL SECURITY
--
-- Run after schema.sql.
--
-- Rule for every table: a signed-in person can only see and
-- change rows whose user_id is their own auth.uid().
-- Signed-out visitors (the anon role) get no table access.
-- =========================================================


-- =========================================================
-- NO ACCESS FOR SIGNED-OUT VISITORS
-- =========================================================

revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke execute on all functions in schema public from anon;

-- Setup and trigger functions are never called directly by the app.
revoke execute on function public.handle_new_user() from public, authenticated;
revoke execute on function public.set_updated_at() from public, authenticated;


-- =========================================================
-- PROFILES
-- Keyed by id (= the auth user id). Created by the sign-up
-- trigger, so there is no insert or delete policy.
-- =========================================================

alter table public.profiles enable row level security;

drop policy if exists "Profiles: read own" on public.profiles;

create policy "Profiles: read own"
    on public.profiles
    for select
    to authenticated
    using (id = (select auth.uid()));

drop policy if exists "Profiles: update own" on public.profiles;

create policy "Profiles: update own"
    on public.profiles
    for update
    to authenticated
    using (id = (select auth.uid()))
    with check (id = (select auth.uid()));


-- =========================================================
-- USER SETTINGS
-- Created by the sign-up trigger. Insert is allowed too, so
-- the app can recreate a missing row.
-- =========================================================

alter table public.user_settings enable row level security;

drop policy if exists "Settings: read own" on public.user_settings;

create policy "Settings: read own"
    on public.user_settings
    for select
    to authenticated
    using (user_id = (select auth.uid()));

drop policy if exists "Settings: create own" on public.user_settings;

create policy "Settings: create own"
    on public.user_settings
    for insert
    to authenticated
    with check (user_id = (select auth.uid()));

drop policy if exists "Settings: update own" on public.user_settings;

create policy "Settings: update own"
    on public.user_settings
    for update
    to authenticated
    using (user_id = (select auth.uid()))
    with check (user_id = (select auth.uid()));


-- =========================================================
-- SIGN-IN LOG
-- Append-only: people can read and add their own events,
-- but never edit or delete them.
-- =========================================================

alter table public.sign_in_events enable row level security;

drop policy if exists "Sign-ins: read own" on public.sign_in_events;

create policy "Sign-ins: read own"
    on public.sign_in_events
    for select
    to authenticated
    using (user_id = (select auth.uid()));

drop policy if exists "Sign-ins: record own" on public.sign_in_events;

create policy "Sign-ins: record own"
    on public.sign_in_events
    for insert
    to authenticated
    with check (user_id = (select auth.uid()));


-- =========================================================
-- LIBRARY TABLES
-- The same four owner-only policies on every table.
-- =========================================================

do $$
declare
    library_table text;
begin
    foreach library_table in array array[
        'shelves',
        'books',
        'book_sections',
        'journal_entries',
        'quotes',
        'vocabulary',
        'questions',
        'characters',
        'book_themes',
        'reviews',
        'reading_sessions',
        'reading_challenges',
        'decorations'
    ]
    loop
        execute format(
            'alter table public.%I enable row level security',
            library_table
        );

        execute format(
            'drop policy if exists "Owner can read" on public.%I',
            library_table
        );

        execute format(
            'create policy "Owner can read" on public.%I
                for select to authenticated
                using (user_id = (select auth.uid()))',
            library_table
        );

        execute format(
            'drop policy if exists "Owner can create" on public.%I',
            library_table
        );

        execute format(
            'create policy "Owner can create" on public.%I
                for insert to authenticated
                with check (user_id = (select auth.uid()))',
            library_table
        );

        execute format(
            'drop policy if exists "Owner can update" on public.%I',
            library_table
        );

        execute format(
            'create policy "Owner can update" on public.%I
                for update to authenticated
                using (user_id = (select auth.uid()))
                with check (user_id = (select auth.uid()))',
            library_table
        );

        execute format(
            'drop policy if exists "Owner can delete" on public.%I',
            library_table
        );

        execute format(
            'create policy "Owner can delete" on public.%I
                for delete to authenticated
                using (user_id = (select auth.uid()))',
            library_table
        );
    end loop;
end;
$$;


-- =========================================================
-- CHECK
-- Lists every public table and whether RLS is on.
-- Every row should say true.
-- =========================================================

select
    tablename,
    rowsecurity as rls_enabled
from pg_tables
where schemaname = 'public'
order by tablename;
