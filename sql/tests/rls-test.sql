-- =========================================================
-- LOCAL TESTING ONLY. Cross-account security and cascade checks.
-- Every "pass" column must read t, and every NOTICE must say PASS.
-- See supabase-standins.sql for how to run it.
-- =========================================================

\set ON_ERROR_STOP 1
insert into auth.users (id, email, raw_user_meta_data) values
 ('aaaaaaaa-0000-0000-0000-000000000001', 'ada@example.com', '{"display_name":"Ada"}'),
 ('bbbbbbbb-0000-0000-0000-000000000002', 'ben@example.com', '{}');

-- sign-up trigger
select 'profiles created' as check, count(*) = 2 as pass from public.profiles;
select 'display names' as check, string_agg(display_name, ',' order by display_name) = 'Ada,ben' as pass from public.profiles;
select 'settings created (goal 20)' as check, count(*) = 2 and bool_and(annual_goal = 20) as pass from public.user_settings;

-- ===== As Ada =====
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001';
insert into public.shelves (id, user_id, name) values ('11111111-0000-0000-0000-000000000001', auth.uid(), 'Fantasy');
insert into public.books (id, user_id, shelf_id, title, author, rating, spine)
  values ('22222222-0000-0000-0000-000000000001', auth.uid(), '11111111-0000-0000-0000-000000000001', 'A Willow of Stars', 'Elara Finch', 4.5, '{"color":"#74444f"}');
insert into public.book_sections (id, user_id, book_id, kind, title) values ('33333333-0000-0000-0000-000000000001', auth.uid(), '22222222-0000-0000-0000-000000000001', 'chapter', 'Chapter 1');
insert into public.journal_entries (user_id, book_id, section_id, kind, body) values (auth.uid(), '22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 'note', 'Lovely opening.');
insert into public.quotes (user_id, book_id, text, page) values (auth.uid(), '22222222-0000-0000-0000-000000000001', 'Somewhere between the pages...', 12);
insert into public.vocabulary (user_id, book_id, word, definition) values (auth.uid(), '22222222-0000-0000-0000-000000000001', 'susurrus', 'a whispering sound');
insert into public.reviews (user_id, book_id, body) values (auth.uid(), '22222222-0000-0000-0000-000000000001', 'Wonderful.');
insert into public.sign_in_events (user_id, user_agent) values (auth.uid(), 'test');
insert into storage.objects (bucket_id, name) values ('book-covers', 'aaaaaaaa-0000-0000-0000-000000000001/22222222-0000-0000-0000-000000000001/cover.webp');
select 'Ada sees her book' as check, count(*) = 1 as pass from public.books;
commit;

-- ===== As Ben =====
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'bbbbbbbb-0000-0000-0000-000000000002';
select 'Ben sees no books' as check, count(*) = 0 as pass from public.books;
select 'Ben sees no quotes' as check, count(*) = 0 as pass from public.quotes;
select 'Ben sees no notes' as check, count(*) = 0 as pass from public.journal_entries;
select 'Ben sees only his profile' as check, count(*) = 1 as pass from public.profiles;
select 'Ben sees no sign-ins of Ada' as check, count(*) = 0 as pass from public.sign_in_events;
select 'Ben sees no covers of Ada' as check, count(*) = 0 as pass from storage.objects;
with u as (update public.books set title = 'hacked' where id = '22222222-0000-0000-0000-000000000001' returning 1) select 'Ben cannot update Ada''s book' as check, count(*) = 0 as pass from u;
with d as (delete from public.quotes returning 1) select 'Ben cannot delete Ada''s quotes' as check, count(*) = 0 as pass from d;
with u as (update public.profiles set display_name = 'x' where id = 'aaaaaaaa-0000-0000-0000-000000000001' returning 1) select 'Ben cannot rename Ada' as check, count(*) = 0 as pass from u;
savepoint s1;
do $$ begin
  insert into public.quotes (user_id, book_id, text) values (auth.uid(), '22222222-0000-0000-0000-000000000001', 'sneaky');
  raise exception 'FAIL: linked quote into Ada''s book';
exception when foreign_key_violation then raise notice 'PASS: Ben cannot attach a quote to Ada''s book (foreign key)';
end $$;
do $$ begin
  insert into public.quotes (user_id, book_id, text) values ('aaaaaaaa-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'sneaky');
  raise exception 'FAIL: wrote as Ada';
exception when insufficient_privilege then raise notice 'PASS: Ben cannot write rows as Ada (RLS)';
end $$;
do $$ begin
  insert into storage.objects (bucket_id, name) values ('book-covers', 'aaaaaaaa-0000-0000-0000-000000000001/x/evil.webp');
  raise exception 'FAIL: uploaded into Ada''s folder';
exception when insufficient_privilege then raise notice 'PASS: Ben cannot upload into Ada''s cover folder';
end $$;
commit;

-- ===== Ada: sign-in log is append-only, shelf delete rules, cascades =====
begin;
set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-0000-0000-0000-000000000001';
with u as (update public.sign_in_events set user_agent = 'edited' returning 1) select 'Sign-in log cannot be edited' as check, count(*) = 0 as pass from u;
with d as (delete from public.sign_in_events returning 1) select 'Sign-in log cannot be deleted' as check, count(*) = 0 as pass from d;
do $$ begin
  delete from public.shelves where id = '11111111-0000-0000-0000-000000000001';
  raise exception 'FAIL: deleted a shelf with books';
exception when foreign_key_violation then raise notice 'PASS: a shelf with books cannot be deleted';
end $$;
delete from public.book_sections where id = '33333333-0000-0000-0000-000000000001';
select 'Deleting a chapter keeps its note (moved to whole book)' as check, count(*) = 1 and bool_and(section_id is null) as pass from public.journal_entries;
delete from public.books where id = '22222222-0000-0000-0000-000000000001';
select 'Deleting a book removes its quotes, words, notes, review' as check,
  (select count(*) from public.quotes) + (select count(*) from public.vocabulary) + (select count(*) from public.journal_entries) + (select count(*) from public.reviews) = 0 as pass;
delete from public.shelves where id = '11111111-0000-0000-0000-000000000001';
select 'Empty shelf can be deleted' as check, count(*) = 0 as pass from public.shelves;
select public.clear_my_library();
commit;

-- ===== Signed-out visitor =====
begin;
set local role anon;
do $$ begin
  perform 1 from public.books;
  raise exception 'FAIL: anon can read books';
exception when insufficient_privilege then raise notice 'PASS: signed-out visitors cannot read any table';
end $$;
commit;

-- ===== Deleting an account removes everything =====
delete from auth.users where id = 'aaaaaaaa-0000-0000-0000-000000000001';
select 'Account deletion cascades' as check, (select count(*) from public.profiles where id = 'aaaaaaaa-0000-0000-0000-000000000001') + (select count(*) from public.sign_in_events) = 0 as pass;
