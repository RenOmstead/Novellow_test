-- =========================================================
-- NOVELLOW
-- THE WORKSHOP: FURNITURE AND DECOR MADE BY READERS
--
-- Run after public.sql (it's safe to run again).
--
-- Readers share two kinds of piece:
--   'upload'    a drawing they made. It waits, unseen by anyone
--               else, until the Novellow account approves it.
--   'recolour'  one of Novellow's own pieces in a fabric they
--               chose. Nothing new is drawn, so it's shared
--               straight away (it can still be reported).
-- Anyone can browse approved pieces and add them to their room.
--
-- Uploaded pictures live in the private 'workshop' bucket, in
-- a folder named after the reader. Before approval only its
-- maker and the Novellow account can see one; after, anyone.
-- The app redraws every upload into a new WebP picture before
-- sending it, so the original file never reaches Novellow.
-- =========================================================


-- The Workshop's rules ask this for signed-out visitors too
-- (always "no" for them).
grant execute on function public.is_novellow_team() to anon, authenticated;


create table if not exists public.workshop_items (
    id uuid primary key default gen_random_uuid(),

    maker_id uuid not null default auth.uid()
        references auth.users (id) on delete cascade,

    kind text not null
        check (kind in ('upload', 'recolour')),

    name text not null
        check (char_length(trim(name)) between 1 and 60),

    description text
        check (description is null or char_length(description) <= 300),

    category text not null default 'cozy'
        check (category in ('furniture', 'lighting', 'wall', 'tabletop', 'plants', 'cozy', 'witchy', 'other')),

    -- Where it goes in a room.
    room_area text not null default 'floor'
        check (room_area in ('wall', 'floor', 'bookcase_top', 'window')),

    -- Uploads: the picture, and how wide it's drawn in a room.
    image_path text
        check (image_path is null or char_length(image_path) <= 200),

    width integer
        check (width is null or width between 40 and 420),

    -- Recolours: which of Novellow's pieces, in which fabric.
    base_asset text
        check (base_asset is null or char_length(base_asset) <= 80),

    fabric text
        check (fabric is null or char_length(fabric) <= 40),

    status text not null default 'pending'
        check (status in ('pending', 'approved', 'declined')),

    review_note text
        check (review_note is null or char_length(review_note) <= 500),

    reviewed_at timestamptz,

    added_count integer not null default 0,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    check ((kind = 'upload') = (image_path is not null and width is not null)),
    check ((kind = 'recolour') = (base_asset is not null and fabric is not null))
);

create index if not exists workshop_items_gallery_idx
    on public.workshop_items (status, created_at desc);

create index if not exists workshop_items_maker_idx
    on public.workshop_items (maker_id, created_at desc);


-- A new piece: uploads wait for approval, recolours are shared
-- straight away; a picture must be in its maker's own folder;
-- and no more than 10 new pieces a day from one reader.
create or replace function public.workshop_items_new()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin

    new.maker_id := auth.uid();
    new.status := case when new.kind = 'recolour' then 'approved' else 'pending' end;
    new.review_note := null;
    new.reviewed_at := null;
    new.added_count := 0;

    if new.kind = 'upload' and split_part(new.image_path, '/', 1) <> new.maker_id::text then
        raise exception 'That picture isn''t in your folder.' using errcode = 'P0001';
    end if;

    if (
        select count(*)
        from public.workshop_items w
        where w.maker_id = new.maker_id
          and w.created_at > now() - interval '1 day'
    ) >= 10 then
        raise exception 'That''s ten pieces today already. Please share more tomorrow.' using errcode = 'P0001';
    end if;

    return new;

end;
$$;

revoke all on function public.workshop_items_new() from public, anon, authenticated;

drop trigger if exists workshop_items_new on public.workshop_items;
create trigger workshop_items_new
    before insert on public.workshop_items
    for each row execute function public.workshop_items_new();

drop trigger if exists set_updated_at on public.workshop_items;
create trigger set_updated_at
    before update on public.workshop_items
    for each row execute function public.set_updated_at();


alter table public.workshop_items enable row level security;

drop policy if exists "Workshop: read approved, own, or all for the team" on public.workshop_items;
create policy "Workshop: read approved, own, or all for the team"
    on public.workshop_items
    for select
    to anon, authenticated
    using (
        status = 'approved'
        or maker_id = (select auth.uid())
        or (select public.is_novellow_team())
    );

drop policy if exists "Workshop: share your own" on public.workshop_items;
create policy "Workshop: share your own"
    on public.workshop_items
    for insert
    to authenticated
    with check (maker_id = (select auth.uid()));

drop policy if exists "Workshop: remove your own, or any for the team" on public.workshop_items;
create policy "Workshop: remove your own, or any for the team"
    on public.workshop_items
    for delete
    to authenticated
    using (maker_id = (select auth.uid()) or (select public.is_novellow_team()));

revoke all on public.workshop_items from anon, authenticated;
grant select on public.workshop_items to anon, authenticated;
grant delete on public.workshop_items to authenticated;
grant insert (kind, name, description, category, room_area, image_path, width, base_asset, fabric)
    on public.workshop_items to authenticated;


-- ---------------------------------------------------------
-- THE GALLERY, WITH WHO MADE EACH PIECE
-- ---------------------------------------------------------

create or replace function public.workshop_gallery(p_category text default null, p_search text default null)
returns table (
    id uuid,
    kind text,
    name text,
    description text,
    category text,
    room_area text,
    image_path text,
    width integer,
    base_asset text,
    fabric text,
    added_count integer,
    created_at timestamptz,
    maker_id uuid,
    maker_name text,
    maker_username text
)
language sql
stable
security definer
set search_path = ''
as $$
    select
        w.id, w.kind, w.name, w.description, w.category, w.room_area,
        w.image_path, w.width, w.base_asset, w.fabric, w.added_count, w.created_at,
        w.maker_id,
        coalesce(nullif(p.display_name, ''), 'A reader'),
        p.username
    from public.workshop_items w
    left join public.profiles p on p.id = w.maker_id
    where w.status = 'approved'
      and (p_category is null or w.category = p_category)
      and (p_search is null or w.name ilike '%' || p_search || '%')
      and (
            auth.uid() is null
            or not public.blocked_between(auth.uid(), w.maker_id)
          )
    order by w.created_at desc
    limit 200;
$$;

revoke all on function public.workshop_gallery(text, text) from public;
grant execute on function public.workshop_gallery(text, text) to anon, authenticated;


-- A reader added a piece to their room (for "most loved").
create or replace function public.workshop_added(p_item uuid)
returns void
language sql
security definer
set search_path = ''
as $$
    update public.workshop_items
        set added_count = added_count + 1
        where id = p_item
          and status = 'approved'
          and auth.uid() is not null;
$$;

revoke all on function public.workshop_added(uuid) from public, anon;
grant execute on function public.workshop_added(uuid) to authenticated;


-- ---------------------------------------------------------
-- THE NOVELLOW ACCOUNT'S REVIEW QUEUE
-- ---------------------------------------------------------

create or replace function public.workshop_queue()
returns table (
    id uuid,
    name text,
    description text,
    category text,
    room_area text,
    image_path text,
    width integer,
    created_at timestamptz,
    maker_name text,
    maker_username text,
    maker_email text
)
language sql
stable
security definer
set search_path = ''
as $$
    select
        w.id, w.name, w.description, w.category, w.room_area, w.image_path, w.width, w.created_at,
        coalesce(nullif(p.display_name, ''), 'A reader'),
        p.username,
        u.email
    from public.workshop_items w
    join auth.users u on u.id = w.maker_id
    left join public.profiles p on p.id = w.maker_id
    where (select public.is_novellow_team())
      and w.status = 'pending'
    order by w.created_at;
$$;

revoke all on function public.workshop_queue() from public, anon;
grant execute on function public.workshop_queue() to authenticated;


create or replace function public.review_workshop_item(p_item uuid, p_approve boolean, p_note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin

    if not public.is_novellow_team() then
        raise exception 'Only the Novellow account can do that.' using errcode = 'P0001';
    end if;

    update public.workshop_items
        set status = case when p_approve then 'approved' else 'declined' end,
            review_note = nullif(trim(coalesce(p_note, '')), ''),
            reviewed_at = now()
        where id = p_item;

end;
$$;

revoke all on function public.review_workshop_item(uuid, boolean, text) from public, anon;
grant execute on function public.review_workshop_item(uuid, boolean, text) to authenticated;


-- ---------------------------------------------------------
-- THE PICTURES
-- ---------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('workshop', 'workshop', false, 2097152, array['image/webp', 'image/png'])
on conflict (id) do update
    set public = false,
        file_size_limit = 2097152,
        allowed_mime_types = array['image/webp', 'image/png'];

drop policy if exists "Workshop pictures: upload to your folder" on storage.objects;
create policy "Workshop pictures: upload to your folder"
    on storage.objects
    for insert
    to authenticated
    with check (
        bucket_id = 'workshop'
        and (storage.foldername(name))[1] = (select auth.uid())::text
    );

drop policy if exists "Workshop pictures: see approved, your own, or all for the team" on storage.objects;
create policy "Workshop pictures: see approved, your own, or all for the team"
    on storage.objects
    for select
    to anon, authenticated
    using (
        bucket_id = 'workshop'
        and (
            (storage.foldername(name))[1] = (select auth.uid())::text
            or (select public.is_novellow_team())
            or exists (
                select 1
                from public.workshop_items w
                where w.image_path = storage.objects.name
                  and w.status = 'approved'
            )
        )
    );

drop policy if exists "Workshop pictures: remove your own, or any for the team" on storage.objects;
create policy "Workshop pictures: remove your own, or any for the team"
    on storage.objects
    for delete
    to authenticated
    using (
        bucket_id = 'workshop'
        and (
            (storage.foldername(name))[1] = (select auth.uid())::text
            or (select public.is_novellow_team())
        )
    );


-- Reports about a piece go to the Notes inbox like any report,
-- naming its maker; the kind is already allowed (public.sql).
