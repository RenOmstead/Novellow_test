-- =========================================================
-- NOVELLOW
-- COVER STORAGE
--
-- Run after policies.sql.
--
-- Private bucket. Every file lives under the owner's folder:
--   {user_id}/{book_id}/{file}
-- People can only read or change files in their own folder.
-- The app shows covers through short-lived signed URLs.
-- =========================================================


insert into storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
values (
    'book-covers',
    'book-covers',
    false,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;


drop policy if exists "Covers: read own" on storage.objects;

create policy "Covers: read own"
    on storage.objects
    for select
    to authenticated
    using (
        bucket_id = 'book-covers'
        and (storage.foldername(name))[1] = (select auth.uid())::text
    );

drop policy if exists "Covers: upload own" on storage.objects;

create policy "Covers: upload own"
    on storage.objects
    for insert
    to authenticated
    with check (
        bucket_id = 'book-covers'
        and (storage.foldername(name))[1] = (select auth.uid())::text
    );

drop policy if exists "Covers: replace own" on storage.objects;

create policy "Covers: replace own"
    on storage.objects
    for update
    to authenticated
    using (
        bucket_id = 'book-covers'
        and (storage.foldername(name))[1] = (select auth.uid())::text
    )
    with check (
        bucket_id = 'book-covers'
        and (storage.foldername(name))[1] = (select auth.uid())::text
    );

drop policy if exists "Covers: delete own" on storage.objects;

create policy "Covers: delete own"
    on storage.objects
    for delete
    to authenticated
    using (
        bucket_id = 'book-covers'
        and (storage.foldername(name))[1] = (select auth.uid())::text
    );
