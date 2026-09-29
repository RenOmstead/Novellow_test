-- =========================================================
-- NOVELLOW
-- WHAT'S NEW, AND NOTES FROM READERS
--
-- Run after account.sql (it's safe to run again).
--
-- site_updates: the "What's new" list on the About Novellow
--   page. Every signed-in reader can read it; nobody can change
--   it from the app. Add or edit updates in Supabase →
--   Table Editor → site_updates.
--
-- reader_notes: problems and ideas readers send from the About
--   Novellow page. A reader can send notes and read (or take
--   back) their own, and never anyone else's. You read them all
--   in Table Editor → reader_notes, and can set a status and a
--   reply there, which the reader then sees under "Your notes".
-- =========================================================


-- ---------------------------------------------------------
-- WHAT'S NEW
-- ---------------------------------------------------------

create table if not exists public.site_updates (
    id uuid primary key default gen_random_uuid(),
    posted_on date not null default current_date,
    kind text not null default 'new'
        check (kind in ('new', 'improved', 'fixed', 'news')),
    title text not null
        check (char_length(title) between 1 and 120),
    body text not null
        check (char_length(body) between 1 and 2000),
    created_at timestamptz not null default now()
);

create index if not exists site_updates_posted_on_idx
    on public.site_updates (posted_on desc);

alter table public.site_updates enable row level security;

drop policy if exists "Readers can read updates" on public.site_updates;
create policy "Readers can read updates"
    on public.site_updates
    for select
    to authenticated
    using (true);

revoke all on public.site_updates from anon, authenticated;
grant select on public.site_updates to authenticated;


-- The first few updates. Fixed ids, so running this again
-- doesn't add them twice.
insert into public.site_updates (id, posted_on, kind, title, body) values
    ('6f1d7c1e-0b1a-4c55-9d5e-000000000001', '2026-09-29', 'news',
     'Novellow has a home: novellow.com',
     'Novellow now lives at novellow.com. Old links still find their way here.'),
    ('6f1d7c1e-0b1a-4c55-9d5e-000000000002', '2026-09-28', 'new',
     'A new look for the front door',
     'The sign-in room has the autumn oak at dusk in the window, a cat asleep in the armchair, and our new logo.'),
    ('6f1d7c1e-0b1a-4c55-9d5e-000000000003', '2026-09-28', 'improved',
     'A tall bookcase scrolls',
     'On a computer, the reading room now always fits on one screen. When you have more shelves than fit, the bookcase scrolls on its own.'),
    ('6f1d7c1e-0b1a-4c55-9d5e-000000000004', '2026-09-28', 'new',
     'Your data, your choice',
     'Settings → Privacy and your account lets you download everything Novellow keeps about you, or delete your account for good.'),
    ('6f1d7c1e-0b1a-4c55-9d5e-000000000005', '2026-09-27', 'improved',
     'Sounds that keep playing',
     'The room''s sounds start on phones, and keep going with the screen off.')
on conflict (id) do nothing;


-- ---------------------------------------------------------
-- NOTES FROM READERS
-- ---------------------------------------------------------

create table if not exists public.reader_notes (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null default auth.uid()
        references auth.users (id) on delete cascade,
    kind text not null
        check (kind in ('problem', 'idea', 'other')),
    message text not null
        check (char_length(message) between 1 and 4000),
    -- Browser and screen size, to help reproduce a problem.
    device text
        check (device is null or char_length(device) <= 300),
    -- Set by you in the Table Editor.
    status text not null default 'new'
        check (status in ('new', 'seen', 'planned', 'done', 'not_planned')),
    reply text
        check (reply is null or char_length(reply) <= 4000),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists reader_notes_user_idx
    on public.reader_notes (user_id, created_at desc);

create index if not exists reader_notes_status_idx
    on public.reader_notes (status, created_at desc);

alter table public.reader_notes enable row level security;

drop policy if exists "Readers read their own notes" on public.reader_notes;
create policy "Readers read their own notes"
    on public.reader_notes
    for select
    to authenticated
    using (user_id = (select auth.uid()));

-- A new note is always the sender's own, new, and unanswered.
drop policy if exists "Readers send their own notes" on public.reader_notes;
create policy "Readers send their own notes"
    on public.reader_notes
    for insert
    to authenticated
    with check (
        user_id = (select auth.uid())
        and status = 'new'
        and reply is null
    );

drop policy if exists "Readers take back their own notes" on public.reader_notes;
create policy "Readers take back their own notes"
    on public.reader_notes
    for delete
    to authenticated
    using (user_id = (select auth.uid()));

-- Readers can't edit a note once it's sent (so they can't set
-- its status or reply either).
revoke all on public.reader_notes from anon, authenticated;
grant select, delete on public.reader_notes to authenticated;
grant insert (kind, message, device) on public.reader_notes to authenticated;


-- At most 10 notes a day from one reader, so a stuck button or
-- a mischief-maker can't flood the table.
create or replace function public.reader_notes_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin

    if (
        select count(*)
        from public.reader_notes
        where user_id = new.user_id
          and created_at > now() - interval '1 day'
    ) >= 10 then
        raise exception 'That''s a lot of notes for one day. Please try again tomorrow.'
            using errcode = 'P0001';
    end if;

    return new;

end;
$$;

revoke all on function public.reader_notes_limit() from public, anon, authenticated;

drop trigger if exists reader_notes_limit on public.reader_notes;
create trigger reader_notes_limit
    before insert on public.reader_notes
    for each row execute function public.reader_notes_limit();


-- Keep updated_at current when you set a status or reply.
create or replace function public.reader_notes_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at := now();
    return new;
end;
$$;

drop trigger if exists reader_notes_touch on public.reader_notes;
create trigger reader_notes_touch
    before update on public.reader_notes
    for each row execute function public.reader_notes_touch();
