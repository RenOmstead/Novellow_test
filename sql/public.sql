-- =========================================================
-- NOVELLOW
-- PUBLIC LIBRARIES, VISITING ROOMS, REPORTS AND BLOCKING
--
-- Run after notes-inbox.sql (it's safe to run again).
--
-- Each reader chooses who can visit their library:
--   'private'  only them (the default)
--   'friends'  their accepted friends
--   'public'   everyone with the link, signed in or not. Only
--              for readers who have confirmed they're 18 or
--              older, and who have a username (the link).
--
-- Visitors see the room (theme, furniture, decorations), the
-- shelves and books with their covers, and, only if the owner
-- turns each on: reviews and ratings' words, saved quotes,
-- and journal notes. Words, questions, characters, themes,
-- reading sessions, challenges and settings are never shared.
--
-- Everything is enforced here, in the database. The app can't
-- show a visitor anything these rules don't let it read.
--
-- Safety:
--   * Signed-in visitors can report a page; reports arrive in
--     the Novellow account's Notes inbox.
--   * The Novellow account can hide a public page.
--   * Anyone can block another reader: a blocked reader can't
--     visit their library or send them a friend request, and
--     any friendship between them ends.
-- =========================================================


-- ---------------------------------------------------------
-- WHAT EACH READER SHARES
-- ---------------------------------------------------------

alter table public.profiles
    add column if not exists share_reviews boolean not null default true,
    add column if not exists share_quotes boolean not null default false,
    add column if not exists share_journal boolean not null default false,
    add column if not exists adult_confirmed_at timestamptz,
    add column if not exists public_hidden boolean not null default false;

alter table public.profiles
    drop constraint if exists profiles_library_visibility_check;

alter table public.profiles
    add constraint profiles_library_visibility_check
    check (library_visibility in ('private', 'friends', 'public'));

-- Everyone-can-see needs a confirmed adult and a username.
alter table public.profiles
    drop constraint if exists profiles_public_rules_check;

alter table public.profiles
    add constraint profiles_public_rules_check
    check (
        library_visibility <> 'public'
        or (adult_confirmed_at is not null and username is not null)
    );


-- Only the Novellow account can hide or unhide a page.
create or replace function public.profiles_guard_hidden()
returns trigger
language plpgsql
set search_path = ''
as $$
begin

    if new.public_hidden is distinct from old.public_hidden
       and coalesce(auth.role(), '') in ('authenticated', 'anon')
       and not public.is_novellow_team() then
        new.public_hidden := old.public_hidden;
    end if;

    return new;

end;
$$;

drop trigger if exists profiles_guard_hidden on public.profiles;
create trigger profiles_guard_hidden
    before update on public.profiles
    for each row execute function public.profiles_guard_hidden();


-- ---------------------------------------------------------
-- BLOCKING
-- ---------------------------------------------------------

create table if not exists public.reader_blocks (
    blocker_id uuid not null default auth.uid()
        references auth.users (id) on delete cascade,
    blocked_id uuid not null
        references auth.users (id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (blocker_id, blocked_id),
    check (blocker_id <> blocked_id)
);

alter table public.reader_blocks enable row level security;

drop policy if exists "Blocks: own" on public.reader_blocks;
create policy "Blocks: own"
    on public.reader_blocks
    for all
    to authenticated
    using (blocker_id = (select auth.uid()))
    with check (blocker_id = (select auth.uid()));

revoke all on public.reader_blocks from anon, authenticated;
grant select, delete on public.reader_blocks to authenticated;
grant insert (blocked_id) on public.reader_blocks to authenticated;


-- Blocking someone ends any friendship or request between you.
create or replace function public.reader_blocks_unfriend()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin

    delete from public.friendships f
    where least(f.requester_id, f.addressee_id) = least(new.blocker_id, new.blocked_id)
      and greatest(f.requester_id, f.addressee_id) = greatest(new.blocker_id, new.blocked_id);

    return new;

end;
$$;

revoke all on function public.reader_blocks_unfriend() from public, anon, authenticated;

drop trigger if exists reader_blocks_unfriend on public.reader_blocks;
create trigger reader_blocks_unfriend
    after insert on public.reader_blocks
    for each row execute function public.reader_blocks_unfriend();


-- Either of you blocked the other.
create or replace function public.blocked_between(p_a uuid, p_b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.reader_blocks b
        where (b.blocker_id = p_a and b.blocked_id = p_b)
           or (b.blocker_id = p_b and b.blocked_id = p_a)
    );
$$;

revoke all on function public.blocked_between(uuid, uuid) from public, anon, authenticated;


-- Friend requests: not between readers who've blocked each
-- other. (The rest is the same as in community.sql.)
create or replace function public.send_friend_request(p_username text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
    me uuid := auth.uid();
    them uuid;
    existing public.friendships;
    new_id uuid;
begin
    if me is null then
        raise exception 'Not signed in';
    end if;

    select p.id into them
    from public.profiles p
    where p.username = lower(trim(leading '@' from trim(p_username)));

    if them is null then
        raise exception 'No reader has that username.' using errcode = 'P0001';
    end if;

    if them = me then
        raise exception 'That''s your own username.' using errcode = 'P0001';
    end if;

    if public.blocked_between(me, them) then
        raise exception 'You can''t send a friend request to this reader.' using errcode = 'P0001';
    end if;

    select * into existing
    from public.friendships f
    where least(f.requester_id, f.addressee_id) = least(me, them)
      and greatest(f.requester_id, f.addressee_id) = greatest(me, them);

    if found then

        if existing.status = 'accepted' then
            raise exception 'You''re already friends.' using errcode = 'P0001';
        end if;

        -- They already asked: sending one back accepts it.
        if existing.addressee_id = me then
            update public.friendships
                set status = 'accepted', responded_at = now()
                where id = existing.id;
            return existing.id;
        end if;

        raise exception 'Your request is already waiting for them.' using errcode = 'P0001';

    end if;

    insert into public.friendships (requester_id, addressee_id)
    values (me, them)
    returning id into new_id;

    return new_id;
end;
$$;

revoke execute on function public.send_friend_request(text) from public, anon;
grant execute on function public.send_friend_request(text) to authenticated;


-- ---------------------------------------------------------
-- WHOSE LIBRARY THE CALLER MAY VISIT
-- ---------------------------------------------------------

-- p_part: 'library' (room, shelves, books, covers), 'reviews',
-- 'quotes' or 'journal'. Works for signed-out visitors too.
create or replace function public.visitable_owner_ids(p_part text default 'library')
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
    select p.id
    from public.profiles p
    where (
            (p.library_visibility = 'public' and not p.public_hidden)
            or (
                p.library_visibility = 'friends'
                and auth.uid() is not null
                and p.id in (select public.my_friend_ids())
            )
          )
      and (
            auth.uid() is null
            or not exists (
                select 1
                from public.reader_blocks b
                where b.blocker_id = p.id
                  and b.blocked_id = auth.uid()
            )
          )
      and case p_part
            when 'library' then true
            when 'reviews' then p.share_reviews
            when 'quotes' then p.share_quotes
            when 'journal' then p.share_journal
            else false
          end;
$$;

revoke all on function public.visitable_owner_ids(text) from public;
grant execute on function public.visitable_owner_ids(text) to anon, authenticated;


-- What a visitor sees at the top of the page: who it is, what
-- they share, and how their room looks. Nothing if they can't
-- visit.
create or replace function public.reader_page(p_username text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
    select jsonb_build_object(
        'id', p.id,
        'display_name', coalesce(nullif(p.display_name, ''), 'A reader'),
        'username', p.username,
        'bio', p.bio,
        'visibility', p.library_visibility,
        'share_reviews', p.share_reviews,
        'share_quotes', p.share_quotes,
        'share_journal', p.share_journal,
        'is_me', p.id = auth.uid(),
        'room', jsonb_build_object(
            'theme', coalesce(s.theme, 'original'),
            'candle_glow', coalesce(s.candle_glow, true),
            'dust', coalesce(s.dust, true),
            'rain', s.rain,
            'oddities', coalesce(s.oddities, true),
            'decoration_density', coalesce(s.decoration_density, 'cozy'),
            'default_shelf_sort', coalesce(s.default_shelf_sort, 'manual')
        )
    )
    from public.profiles p
    left join public.user_settings s on s.user_id = p.id
    where p.username = lower(trim(leading '@' from trim(p_username)))
      and (p.id = auth.uid() or p.id in (select public.visitable_owner_ids('library')));
$$;

revoke all on function public.reader_page(text) from public;
grant execute on function public.reader_page(text) to anon, authenticated;


-- Public libraries to browse in Community (newest first).
-- Dropped first so it can be re-run over an older version.
drop function if exists public.public_libraries(text);

create or replace function public.public_libraries(p_search text default null)
returns table (
    username text,
    display_name text,
    bio text,
    book_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
    select
        p.username,
        coalesce(nullif(p.display_name, ''), 'A reader'),
        p.bio,
        (select count(*) from public.books b where b.user_id = p.id)
    from public.profiles p
    where p.library_visibility = 'public'
      and not p.public_hidden
      and p.id in (select public.visitable_owner_ids('library'))
      and (
            p_search is null
            or p.username ilike '%' || p_search || '%'
            or p.display_name ilike '%' || p_search || '%'
          )
    order by p.updated_at desc nulls last
    limit 60;
$$;

revoke all on function public.public_libraries(text) from public;
grant execute on function public.public_libraries(text) to anon, authenticated;


-- ---------------------------------------------------------
-- WHAT VISITORS CAN READ
-- ---------------------------------------------------------

grant select on public.shelves, public.books, public.decorations,
    public.reviews, public.quotes, public.journal_entries
    to anon;

drop policy if exists "Visitors read shelves" on public.shelves;
create policy "Visitors read shelves"
    on public.shelves for select to anon, authenticated
    using (user_id in (select public.visitable_owner_ids('library')));

drop policy if exists "Visitors read books" on public.books;
create policy "Visitors read books"
    on public.books for select to anon, authenticated
    using (user_id in (select public.visitable_owner_ids('library')));

drop policy if exists "Visitors read the room" on public.decorations;
create policy "Visitors read the room"
    on public.decorations for select to anon, authenticated
    using (user_id in (select public.visitable_owner_ids('library')));

drop policy if exists "Visitors read reviews" on public.reviews;
create policy "Visitors read reviews"
    on public.reviews for select to anon, authenticated
    using (user_id in (select public.visitable_owner_ids('reviews')));

drop policy if exists "Visitors read quotes" on public.quotes;
create policy "Visitors read quotes"
    on public.quotes for select to anon, authenticated
    using (user_id in (select public.visitable_owner_ids('quotes')));

drop policy if exists "Visitors read journal notes" on public.journal_entries;
create policy "Visitors read journal notes"
    on public.journal_entries for select to anon, authenticated
    using (user_id in (select public.visitable_owner_ids('journal')));

drop policy if exists "Covers: visitors read" on storage.objects;
create policy "Covers: visitors read"
    on storage.objects for select to anon, authenticated
    using (
        bucket_id = 'book-covers'
        and (storage.foldername(name))[1] in (
            select owner_id::text from public.visitable_owner_ids('library') as owner_id
        )
    );


-- ---------------------------------------------------------
-- REPORTS
-- ---------------------------------------------------------

alter table public.reader_notes
    add column if not exists reported_user_id uuid
        references auth.users (id) on delete cascade;

alter table public.reader_notes
    drop constraint if exists reader_notes_kind_check;

alter table public.reader_notes
    add constraint reader_notes_kind_check
    check (kind in ('problem', 'idea', 'other', 'report'));

alter table public.reader_notes
    drop constraint if exists reader_notes_report_check;

alter table public.reader_notes
    add constraint reader_notes_report_check
    check ((kind = 'report') = (reported_user_id is not null));

grant insert (kind, message, device, reported_user_id) on public.reader_notes to authenticated;


-- The Novellow account hides (or shows again) a public page.
create or replace function public.set_page_hidden(p_user uuid, p_hidden boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin

    if not public.is_novellow_team() then
        raise exception 'Only the Novellow account can do that.' using errcode = 'P0001';
    end if;

    update public.profiles
        set public_hidden = p_hidden
        where id = p_user;

end;
$$;

revoke all on function public.set_page_hidden(uuid, boolean) from public, anon;
grant execute on function public.set_page_hidden(uuid, boolean) to authenticated;


-- ---------------------------------------------------------
-- YOUR BLOCKED READERS (Settings)
-- ---------------------------------------------------------

create or replace function public.my_blocked_readers()
returns table (
    blocked_id uuid,
    display_name text,
    username text,
    created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
    select
        b.blocked_id,
        coalesce(nullif(p.display_name, ''), 'A reader'),
        p.username,
        b.created_at
    from public.reader_blocks b
    left join public.profiles p on p.id = b.blocked_id
    where b.blocker_id = (select auth.uid())
    order by b.created_at desc;
$$;

revoke all on function public.my_blocked_readers() from public, anon;
grant execute on function public.my_blocked_readers() to authenticated;
