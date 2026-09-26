-- =========================================================
-- NOVELLOW
-- COMMUNITY
--
-- Run after storage.sql. Safe to run again: every step
-- checks what is already there.
--
-- Friends, shared shelves, book clubs and buddy reads.
--
-- Privacy rules, all enforced here rather than in the app:
--   * A reader's shelves, books, ratings, reviews and covers
--     can be seen by their accepted friends, and only when
--     they have turned sharing on (library_visibility =
--     'friends'). Journals, notes, quotes, words, questions,
--     characters, themes and reading sessions are never shared.
--   * Profiles (name, username, bio) are visible to friends,
--     to people with a friend request between you, and to
--     people in the same club or buddy read. Finding someone
--     needs their exact username.
--   * Club and buddy-read posts are visible to that group's
--     members only. In a buddy read, a comment about a chapter
--     stays hidden until you have reached that chapter.
-- =========================================================


-- =========================================================
-- PROFILES: USERNAME, BIO, SHARING
-- =========================================================

alter table public.profiles
    add column if not exists username text,
    add column if not exists bio text;

alter table public.profiles
    drop constraint if exists profiles_username_check;

alter table public.profiles
    add constraint profiles_username_check
    check (username ~ '^[a-z0-9_]{3,24}$');

alter table public.profiles
    drop constraint if exists profiles_bio_check;

alter table public.profiles
    add constraint profiles_bio_check
    check (char_length(bio) <= 300);

create unique index if not exists profiles_username_idx
    on public.profiles (username);

-- Sharing is private or friends only. "public" was a
-- placeholder that nothing used.
update public.profiles
    set library_visibility = 'private'
    where library_visibility not in ('private', 'friends');

alter table public.profiles
    drop constraint if exists profiles_library_visibility_check;

alter table public.profiles
    add constraint profiles_library_visibility_check
    check (library_visibility in ('private', 'friends'));


-- =========================================================
-- FRIENDSHIPS
-- One row per pair of readers. Requests are sent and
-- accepted through the functions below; either reader can
-- delete the row (cancel, decline or unfriend).
-- =========================================================

create table if not exists public.friendships (
    id uuid primary key default gen_random_uuid(),

    requester_id uuid not null
        references auth.users (id) on delete cascade,

    addressee_id uuid not null
        references auth.users (id) on delete cascade,

    status text not null default 'pending'
        check (status in ('pending', 'accepted')),

    created_at timestamptz not null default now(),
    responded_at timestamptz,

    check (requester_id <> addressee_id)
);

create unique index if not exists friendships_pair_idx
    on public.friendships (
        least(requester_id, addressee_id),
        greatest(requester_id, addressee_id)
    );

create index if not exists friendships_addressee_idx
    on public.friendships (addressee_id, status);


-- =========================================================
-- READING GROUPS
-- A book club (kind 'club': one discussion thread) or a
-- buddy read (kind 'buddy': comments tied to chapters).
-- =========================================================

create table if not exists public.reading_groups (
    id uuid primary key default gen_random_uuid(),

    kind text not null
        check (kind in ('club', 'buddy')),

    name text not null
        check (char_length(trim(name)) between 1 and 80),

    description text
        check (char_length(description) <= 1000),

    book_title text not null
        check (char_length(trim(book_title)) between 1 and 300),

    book_author text
        check (char_length(book_author) <= 200),

    -- Buddy reads only: how many chapters the book has.
    chapter_count integer
        check (chapter_count between 1 and 500),

    owner_id uuid not null
        references auth.users (id) on delete cascade,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    check (kind = 'club' or chapter_count is not null)
);

create table if not exists public.group_members (
    group_id uuid not null
        references public.reading_groups (id) on delete cascade,

    user_id uuid not null
        references auth.users (id) on delete cascade,

    status text not null default 'invited'
        check (status in ('invited', 'joined')),

    invited_by uuid
        references auth.users (id) on delete set null,

    -- Buddy reads: the last chapter this reader has finished.
    current_chapter integer not null default 0
        check (current_chapter between 0 and 500),

    created_at timestamptz not null default now(),
    joined_at timestamptz,

    primary key (group_id, user_id)
);

create index if not exists group_members_user_idx
    on public.group_members (user_id, status);

create table if not exists public.group_posts (
    id uuid primary key default gen_random_uuid(),

    group_id uuid not null
        references public.reading_groups (id) on delete cascade,

    user_id uuid not null
        references auth.users (id) on delete cascade,

    -- Buddy reads: the chapter the comment is about.
    -- Book clubs: null.
    chapter integer
        check (chapter between 1 and 500),

    body text not null
        check (char_length(trim(body)) between 1 and 5000),

    created_at timestamptz not null default now()
);

create index if not exists group_posts_group_idx
    on public.group_posts (group_id, chapter, created_at);

drop trigger if exists set_updated_at on public.reading_groups;

create trigger set_updated_at before update on public.reading_groups
    for each row execute function public.set_updated_at();


-- =========================================================
-- HELPERS FOR THE RULES
-- Security definer so the rules can look across tables
-- without those lookups being filtered by the same rules.
-- Each only ever answers questions about the caller.
-- =========================================================

-- The caller's accepted friends.
create or replace function public.my_friend_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
    select case
        when f.requester_id = auth.uid() then f.addressee_id
        else f.requester_id
    end
    from public.friendships f
    where f.status = 'accepted'
      and auth.uid() in (f.requester_id, f.addressee_id);
$$;

-- Friends who share their shelves with friends.
create or replace function public.shared_library_owner_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
    select p.id
    from public.profiles p
    where p.library_visibility = 'friends'
      and p.id in (select public.my_friend_ids());
$$;

-- Everyone whose profile the caller may see: friends, anyone
-- with a request between you, and people in your groups.
create or replace function public.known_reader_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
    select case
        when f.requester_id = auth.uid() then f.addressee_id
        else f.requester_id
    end
    from public.friendships f
    where auth.uid() in (f.requester_id, f.addressee_id)

    union

    select other.user_id
    from public.group_members mine
    join public.group_members other
        on other.group_id = mine.group_id
    where mine.user_id = auth.uid();
$$;

-- Groups the caller belongs to or has been invited to.
create or replace function public.my_group_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
    select m.group_id
    from public.group_members m
    where m.user_id = auth.uid();
$$;

-- Groups the caller has joined (not only been invited to).
create or replace function public.my_joined_group_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
    select m.group_id
    from public.group_members m
    where m.user_id = auth.uid()
      and m.status = 'joined';
$$;

-- Groups the caller owns.
create or replace function public.my_owned_group_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
    select g.id
    from public.reading_groups g
    where g.owner_id = auth.uid();
$$;

-- The caller's chapter in a buddy read (0 if not a member).
create or replace function public.my_chapter(p_group uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
    select coalesce(
        (
            select m.current_chapter
            from public.group_members m
            where m.group_id = p_group
              and m.user_id = auth.uid()
              and m.status = 'joined'
        ),
        0
    );
$$;

-- What kind of group this is ('club' or 'buddy').
create or replace function public.group_kind(p_group uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
    select g.kind
    from public.reading_groups g
    where g.id = p_group;
$$;


-- =========================================================
-- ACTIONS
-- Requests, invitations and progress go through these, so
-- nobody can accept on someone else's behalf or join a
-- group they weren't invited to.
-- =========================================================

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


create or replace function public.accept_friend_request(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
    update public.friendships
        set status = 'accepted', responded_at = now()
        where id = p_id
          and addressee_id = auth.uid()
          and status = 'pending';

    if not found then
        raise exception 'That request is no longer waiting.' using errcode = 'P0001';
    end if;
end;
$$;


-- Starts a club or buddy read, with the caller as its first
-- member, and invites the chosen friends.
create or replace function public.create_reading_group(
    p_kind text,
    p_name text,
    p_book_title text,
    p_book_author text default null,
    p_description text default null,
    p_chapter_count integer default null,
    p_invite uuid[] default '{}'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
    me uuid := auth.uid();
    new_id uuid;
begin
    if me is null then
        raise exception 'Not signed in';
    end if;

    if coalesce(array_length(p_invite, 1), 0) > 30 then
        raise exception 'Invite up to 30 friends at a time.' using errcode = 'P0001';
    end if;

    insert into public.reading_groups (
        kind, name, description, book_title, book_author, chapter_count, owner_id
    )
    values (
        p_kind,
        trim(p_name),
        nullif(trim(p_description), ''),
        trim(p_book_title),
        nullif(trim(p_book_author), ''),
        case when p_kind = 'buddy' then p_chapter_count end,
        me
    )
    returning id into new_id;

    insert into public.group_members (group_id, user_id, status, joined_at)
    values (new_id, me, 'joined', now());

    -- Only friends can be invited.
    insert into public.group_members (group_id, user_id, status, invited_by)
    select new_id, friend, 'invited', me
    from unnest(p_invite) as friend
    where friend in (select public.my_friend_ids())
    on conflict do nothing;

    return new_id;
end;
$$;


-- Any member who has joined can invite their own friends.
create or replace function public.invite_to_group(p_group uuid, p_friend uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
    if p_group not in (select public.my_joined_group_ids()) then
        raise exception 'Only members can invite people.' using errcode = 'P0001';
    end if;

    if p_friend not in (select public.my_friend_ids()) then
        raise exception 'You can only invite your friends.' using errcode = 'P0001';
    end if;

    if (select count(*) from public.group_members where group_id = p_group) >= 50 then
        raise exception 'This group is full.' using errcode = 'P0001';
    end if;

    insert into public.group_members (group_id, user_id, status, invited_by)
    values (p_group, p_friend, 'invited', auth.uid())
    on conflict do nothing;
end;
$$;


create or replace function public.join_group(p_group uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
    update public.group_members
        set status = 'joined', joined_at = now()
        where group_id = p_group
          and user_id = auth.uid()
          and status = 'invited';

    if not found then
        raise exception 'That invitation is no longer open.' using errcode = 'P0001';
    end if;
end;
$$;


-- Buddy reads: "I've finished chapter N".
create or replace function public.set_my_chapter(p_group uuid, p_chapter integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    chapters integer;
begin
    select g.chapter_count into chapters
    from public.reading_groups g
    where g.id = p_group
      and g.id in (select public.my_joined_group_ids());

    if chapters is null then
        raise exception 'You''re not reading along in that group.' using errcode = 'P0001';
    end if;

    update public.group_members
        set current_chapter = greatest(0, least(p_chapter, chapters))
        where group_id = p_group
          and user_id = auth.uid();
end;
$$;


-- Buddy reads: how many comments from others are waiting in
-- chapters the caller hasn't reached yet (counts only, never
-- the words).
create or replace function public.waiting_comments(p_group uuid)
returns table (chapter integer, comments bigint)
language sql
stable
security definer
set search_path = ''
as $$
    select p.chapter, count(*)
    from public.group_posts p
    where p.group_id = p_group
      and p.group_id in (select public.my_joined_group_ids())
      and p.user_id <> auth.uid()
      and p.chapter > public.my_chapter(p_group)
    group by p.chapter
    order by p.chapter;
$$;


-- =========================================================
-- PERMISSIONS FOR THE FUNCTIONS
-- =========================================================

revoke execute on function public.my_friend_ids() from public, anon;
revoke execute on function public.shared_library_owner_ids() from public, anon;
revoke execute on function public.known_reader_ids() from public, anon;
revoke execute on function public.my_group_ids() from public, anon;
revoke execute on function public.my_joined_group_ids() from public, anon;
revoke execute on function public.my_owned_group_ids() from public, anon;
revoke execute on function public.my_chapter(uuid) from public, anon;
revoke execute on function public.group_kind(uuid) from public, anon;
revoke execute on function public.send_friend_request(text) from public, anon;
revoke execute on function public.accept_friend_request(uuid) from public, anon;
revoke execute on function public.create_reading_group(text, text, text, text, text, integer, uuid[]) from public, anon;
revoke execute on function public.invite_to_group(uuid, uuid) from public, anon;
revoke execute on function public.join_group(uuid) from public, anon;
revoke execute on function public.set_my_chapter(uuid, integer) from public, anon;
revoke execute on function public.waiting_comments(uuid) from public, anon;

grant execute on function public.my_friend_ids() to authenticated;
grant execute on function public.shared_library_owner_ids() to authenticated;
grant execute on function public.known_reader_ids() to authenticated;
grant execute on function public.my_group_ids() to authenticated;
grant execute on function public.my_joined_group_ids() to authenticated;
grant execute on function public.my_owned_group_ids() to authenticated;
grant execute on function public.my_chapter(uuid) to authenticated;
grant execute on function public.group_kind(uuid) to authenticated;
grant execute on function public.send_friend_request(text) to authenticated;
grant execute on function public.accept_friend_request(uuid) to authenticated;
grant execute on function public.create_reading_group(text, text, text, text, text, integer, uuid[]) to authenticated;
grant execute on function public.invite_to_group(uuid, uuid) to authenticated;
grant execute on function public.join_group(uuid) to authenticated;
grant execute on function public.set_my_chapter(uuid, integer) to authenticated;
grant execute on function public.waiting_comments(uuid) to authenticated;

revoke all on public.friendships, public.reading_groups, public.group_members, public.group_posts from anon;

grant select, insert, update, delete
    on public.friendships, public.reading_groups, public.group_members, public.group_posts
    to authenticated;


-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

-- Profiles of people you know.
drop policy if exists "Profiles: read people you know" on public.profiles;

create policy "Profiles: read people you know"
    on public.profiles
    for select
    to authenticated
    using (id in (select public.known_reader_ids()));


-- Friendships: both readers can see and delete theirs.
alter table public.friendships enable row level security;

drop policy if exists "Friendships: read own" on public.friendships;

create policy "Friendships: read own"
    on public.friendships
    for select
    to authenticated
    using ((select auth.uid()) in (requester_id, addressee_id));

drop policy if exists "Friendships: remove own" on public.friendships;

create policy "Friendships: remove own"
    on public.friendships
    for delete
    to authenticated
    using ((select auth.uid()) in (requester_id, addressee_id));


-- Shared shelves: friends who turned sharing on.
-- Journals and the rest stay owner-only (policies.sql).
drop policy if exists "Friends can read shared" on public.shelves;

create policy "Friends can read shared"
    on public.shelves
    for select
    to authenticated
    using (user_id in (select public.shared_library_owner_ids()));

drop policy if exists "Friends can read shared" on public.books;

create policy "Friends can read shared"
    on public.books
    for select
    to authenticated
    using (user_id in (select public.shared_library_owner_ids()));

drop policy if exists "Friends can read shared" on public.reviews;

create policy "Friends can read shared"
    on public.reviews
    for select
    to authenticated
    using (user_id in (select public.shared_library_owner_ids()));

drop policy if exists "Covers: friends read shared" on storage.objects;

create policy "Covers: friends read shared"
    on storage.objects
    for select
    to authenticated
    using (
        bucket_id = 'book-covers'
        and (storage.foldername(name))[1] in (
            select owner_id::text from public.shared_library_owner_ids() as owner_id
        )
    );


-- Groups: members and invitees can see the group; the owner
-- can rename or delete it. New groups come from
-- create_reading_group().
alter table public.reading_groups enable row level security;

drop policy if exists "Groups: members read" on public.reading_groups;

create policy "Groups: members read"
    on public.reading_groups
    for select
    to authenticated
    using (id in (select public.my_group_ids()));

drop policy if exists "Groups: owner updates" on public.reading_groups;

create policy "Groups: owner updates"
    on public.reading_groups
    for update
    to authenticated
    using (owner_id = (select auth.uid()))
    with check (owner_id = (select auth.uid()));

drop policy if exists "Groups: owner deletes" on public.reading_groups;

create policy "Groups: owner deletes"
    on public.reading_groups
    for delete
    to authenticated
    using (owner_id = (select auth.uid()));


-- Members: everyone in a group sees who else is in it.
-- You can leave (or decline) yourself, except the owner, who
-- deletes the group instead; the owner can remove others.
alter table public.group_members enable row level security;

drop policy if exists "Members: read own groups" on public.group_members;

create policy "Members: read own groups"
    on public.group_members
    for select
    to authenticated
    using (group_id in (select public.my_group_ids()));

drop policy if exists "Members: leave or remove" on public.group_members;

create policy "Members: leave or remove"
    on public.group_members
    for delete
    to authenticated
    using (
        (
            user_id = (select auth.uid())
            and group_id not in (select public.my_owned_group_ids())
        )
        or (
            group_id in (select public.my_owned_group_ids())
            and user_id <> (select auth.uid())
        )
    );


-- Posts: members who have joined read and write them. In a
-- buddy read a comment stays hidden until you reach its
-- chapter, and you can only comment on chapters you've read.
alter table public.group_posts enable row level security;

drop policy if exists "Posts: members read" on public.group_posts;

create policy "Posts: members read"
    on public.group_posts
    for select
    to authenticated
    using (
        group_id in (select public.my_joined_group_ids())
        and (
            chapter is null
            or user_id = (select auth.uid())
            or chapter <= public.my_chapter(group_id)
        )
    );

drop policy if exists "Posts: members write" on public.group_posts;

create policy "Posts: members write"
    on public.group_posts
    for insert
    to authenticated
    with check (
        user_id = (select auth.uid())
        and group_id in (select public.my_joined_group_ids())
        and (
            (public.group_kind(group_id) = 'club' and chapter is null)
            or (
                public.group_kind(group_id) = 'buddy'
                and chapter between 1 and public.my_chapter(group_id)
            )
        )
    );

drop policy if exists "Posts: author or owner deletes" on public.group_posts;

create policy "Posts: author or owner deletes"
    on public.group_posts
    for delete
    to authenticated
    using (
        user_id = (select auth.uid())
        or group_id in (select public.my_owned_group_ids())
    );


-- =========================================================
-- CHECK
-- Every row should say true.
-- =========================================================

select
    tablename,
    rowsecurity as rls_enabled
from pg_tables
where schemaname = 'public'
  and tablename in ('friendships', 'reading_groups', 'group_members', 'group_posts', 'profiles')
order by tablename;
