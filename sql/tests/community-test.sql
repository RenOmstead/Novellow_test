-- =========================================================
-- LOCAL TESTING ONLY. Community privacy checks.
-- Runs in one transaction and rolls everything back.
-- Every "pass" column must read t, and every NOTICE must say PASS.
--
--   psql -d <db> -f sql/tests/community-test.sql
-- (after schema.sql, policies.sql, storage.sql, community.sql)
-- =========================================================

\set ON_ERROR_STOP 1
begin;

insert into auth.users (id, email, raw_user_meta_data) values
 ('a0000000-0000-0000-0000-00000000000a', 'c-ada@example.com', '{"display_name":"Ada"}'),
 ('b0000000-0000-0000-0000-00000000000b', 'c-ben@example.com', '{"display_name":"Ben"}'),
 ('c0000000-0000-0000-0000-00000000000c', 'c-cy@example.com', '{"display_name":"Cy"}');

update public.profiles set username = 'c_ada' where id = 'a0000000-0000-0000-0000-00000000000a';
update public.profiles set username = 'c_ben' where id = 'b0000000-0000-0000-0000-00000000000b';
update public.profiles set username = 'c_cy' where id = 'c0000000-0000-0000-0000-00000000000c';

insert into public.shelves (id, user_id, name) values ('a1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-00000000000a', 'Ada''s shelf');
insert into public.books (id, user_id, shelf_id, title, status, rating) values ('a2000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-00000000000a', 'a1000000-0000-0000-0000-000000000001', 'Secret Garden', 'reading', 4);
insert into public.reviews (book_id, user_id, body) values ('a2000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-00000000000a', 'Lovely.');
insert into public.journal_entries (user_id, book_id, body) values ('a0000000-0000-0000-0000-00000000000a', 'a2000000-0000-0000-0000-000000000001', 'private note');
insert into public.quotes (user_id, book_id, text) values ('a0000000-0000-0000-0000-00000000000a', 'a2000000-0000-0000-0000-000000000001', 'private quote');
insert into storage.objects (bucket_id, name) values ('book-covers', 'a0000000-0000-0000-0000-00000000000a/a2000000-0000-0000-0000-000000000001/cover.webp');

set local role authenticated;

-- ===== Strangers =====
set local request.jwt.claim.sub = 'b0000000-0000-0000-0000-00000000000b';
select 'stranger: no profile of Ada' as check, count(*) = 0 as pass from public.profiles where id = 'a0000000-0000-0000-0000-00000000000a';
select 'stranger: no books of Ada' as check, count(*) = 0 as pass from public.books where user_id = 'a0000000-0000-0000-0000-00000000000a';
do $$ begin
  perform public.send_friend_request('nobody_here');
  raise exception 'FAIL: unknown username accepted';
exception when raise_exception then raise notice 'PASS: unknown usernames are refused';
end $$;
do $$ begin
  perform public.send_friend_request('c_ben');
  raise exception 'FAIL: befriended self';
exception when raise_exception then raise notice 'PASS: cannot befriend yourself';
end $$;
do $$ begin
  insert into public.friendships (requester_id, addressee_id, status) values ('b0000000-0000-0000-0000-00000000000b', 'a0000000-0000-0000-0000-00000000000a', 'accepted');
  raise exception 'FAIL: wrote a friendship directly';
exception when insufficient_privilege then raise notice 'PASS: friendships cannot be written directly';
end $$;

-- ===== Ben asks Ada =====
select public.send_friend_request('@C_Ada') is not null as "request sent";
select 'pending: Ben sees Ada''s profile' as check, count(*) = 1 as pass from public.profiles where id = 'a0000000-0000-0000-0000-00000000000a';
select 'pending: still no books' as check, count(*) = 0 as pass from public.books where user_id = 'a0000000-0000-0000-0000-00000000000a';
do $$ begin
  perform public.accept_friend_request((select id from public.friendships limit 1));
  raise exception 'FAIL: Ben accepted his own request';
exception when raise_exception then raise notice 'PASS: the sender cannot accept their own request';
end $$;

set local request.jwt.claim.sub = 'c0000000-0000-0000-0000-00000000000c';
select 'Cy sees no friendships of others' as check, count(*) = 0 as pass from public.friendships;

-- ===== Ada accepts; sharing still off =====
set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-00000000000a';
select public.accept_friend_request((select id from public.friendships limit 1));
set local request.jwt.claim.sub = 'b0000000-0000-0000-0000-00000000000b';
select 'friends, sharing off: no books' as check, count(*) = 0 as pass from public.books where user_id = 'a0000000-0000-0000-0000-00000000000a';

-- ===== Ada shares with friends =====
set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-00000000000a';
update public.profiles set library_visibility = 'friends' where id = auth.uid();

set local request.jwt.claim.sub = 'b0000000-0000-0000-0000-00000000000b';
select 'friend sees shelf' as check, count(*) = 1 as pass from public.shelves where user_id = 'a0000000-0000-0000-0000-00000000000a';
select 'friend sees book' as check, count(*) = 1 as pass from public.books where user_id = 'a0000000-0000-0000-0000-00000000000a';
select 'friend sees review' as check, count(*) = 1 as pass from public.reviews where user_id = 'a0000000-0000-0000-0000-00000000000a';
select 'friend sees cover' as check, count(*) = 1 as pass from storage.objects where name like 'a0000000-0000-0000-0000-00000000000a/%';
select 'friend never sees notes' as check, count(*) = 0 as pass from public.journal_entries;
select 'friend never sees quotes' as check, count(*) = 0 as pass from public.quotes;
with u as (update public.books set title = 'hacked' where user_id = 'a0000000-0000-0000-0000-00000000000a' returning 1) select 'friend cannot edit books' as check, count(*) = 0 as pass from u;
with d as (delete from public.reviews where user_id = 'a0000000-0000-0000-0000-00000000000a' returning 1) select 'friend cannot delete reviews' as check, count(*) = 0 as pass from d;
with u as (update public.profiles set bio = 'x' where id = 'a0000000-0000-0000-0000-00000000000a' returning 1) select 'friend cannot edit profile' as check, count(*) = 0 as pass from u;

set local request.jwt.claim.sub = 'c0000000-0000-0000-0000-00000000000c';
select 'non-friend sees no books' as check, count(*) = 0 as pass from public.books where user_id = 'a0000000-0000-0000-0000-00000000000a';
select 'non-friend sees no covers' as check, count(*) = 0 as pass from storage.objects where name like 'a0000000-0000-0000-0000-00000000000a/%';

-- ===== Buddy read =====
set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-00000000000a';
create temp table ids (name text, id uuid) on commit drop;
grant all on ids to authenticated;
insert into ids select 'buddy', public.create_reading_group('buddy', 'Garden read', 'Secret Garden', null, null, 12,
  array['b0000000-0000-0000-0000-00000000000b', 'c0000000-0000-0000-0000-00000000000c']::uuid[]);
select 'only friends are invited' as check, count(*) = 2 as pass from public.group_members where group_id = (select id from ids where name = 'buddy');
select public.set_my_chapter((select id from ids where name = 'buddy'), 3);
insert into public.group_posts (group_id, user_id, chapter, body) values ((select id from ids where name = 'buddy'), auth.uid(), 3, 'The robin!');
do $$ begin
  insert into public.group_posts (group_id, user_id, chapter, body) values ((select id from ids where name = 'buddy'), auth.uid(), 5, 'ahead');
  raise exception 'FAIL: commented on an unread chapter';
exception when insufficient_privilege then raise notice 'PASS: cannot comment on a chapter you have not reached';
end $$;
with d as (delete from public.group_members where user_id = auth.uid() returning 1) select 'owner cannot leave (deletes instead)' as check, count(*) = 0 as pass from d;

set local request.jwt.claim.sub = 'c0000000-0000-0000-0000-00000000000c';
select 'outsider sees no group' as check, count(*) = 0 as pass from public.reading_groups;
select 'outsider sees no posts' as check, count(*) = 0 as pass from public.group_posts;
do $$ begin
  perform public.join_group((select id from ids where name = 'buddy'));
  raise exception 'FAIL: joined uninvited';
exception when raise_exception then raise notice 'PASS: cannot join without an invitation';
end $$;

set local request.jwt.claim.sub = 'b0000000-0000-0000-0000-00000000000b';
select 'invitee sees the group' as check, count(*) = 1 as pass from public.reading_groups;
select 'invitee (not joined) sees no posts' as check, count(*) = 0 as pass from public.group_posts;
do $$ begin
  update public.group_members set status = 'joined' where user_id = auth.uid();
  if found then raise exception 'FAIL: changed membership directly'; end if;
  raise notice 'PASS: membership cannot be edited directly';
end $$;
select public.join_group((select id from ids where name = 'buddy'));
select 'chapter 0: comment hidden' as check, count(*) = 0 as pass from public.group_posts;
select 'chapter 0: told one is waiting at 3' as check, count(*) = 1 and min(chapter) = 3 and sum(comments) = 1 as pass from public.waiting_comments((select id from ids where name = 'buddy'));
select public.set_my_chapter((select id from ids where name = 'buddy'), 3);
select 'chapter 3: comment shows' as check, count(*) = 1 as pass from public.group_posts;
with d as (delete from public.group_posts returning 1) select 'cannot delete others'' posts' as check, count(*) = 0 as pass from d;
with d as (delete from public.reading_groups returning 1) select 'cannot delete someone else''s group' as check, count(*) = 0 as pass from d;
with u as (update public.reading_groups set name = 'mine now' returning 1) select 'cannot rename someone else''s group' as check, count(*) = 0 as pass from u;
select 'group member profile visible' as check, count(*) = 1 as pass from public.profiles where id = 'a0000000-0000-0000-0000-00000000000a';

-- ===== Book club: one thread, no chapters =====
insert into ids select 'club', public.create_reading_group('club', 'Tea & Tomes', 'Rebecca', 'Daphne du Maurier', null, null, array['a0000000-0000-0000-0000-00000000000a']::uuid[]);
insert into public.group_posts (group_id, user_id, body) values ((select id from ids where name = 'club'), auth.uid(), 'Welcome!');
do $$ begin
  insert into public.group_posts (group_id, user_id, chapter, body) values ((select id from ids where name = 'club'), auth.uid(), 1, 'chaptered');
  raise exception 'FAIL: chapter on club post';
exception when insufficient_privilege then raise notice 'PASS: club posts have no chapter';
end $$;
set local request.jwt.claim.sub = 'a0000000-0000-0000-0000-00000000000a';
select 'invited to club: cannot read yet' as check, count(*) = 0 as pass from public.group_posts where group_id = (select id from ids where name = 'club');
select public.join_group((select id from ids where name = 'club'));
select 'joined club: reads thread' as check, count(*) = 1 as pass from public.group_posts where group_id = (select id from ids where name = 'club');
with d as (delete from public.group_members where group_id = (select id from ids where name = 'club') and user_id = auth.uid() returning 1) select 'member can leave' as check, count(*) = 1 as pass from d;

-- ===== Unfriending ends sharing =====
set local request.jwt.claim.sub = 'b0000000-0000-0000-0000-00000000000b';
with d as (delete from public.friendships returning 1) select 'either friend can unfriend' as check, count(*) = 1 as pass from d;
select 'after unfriending: no books' as check, count(*) = 0 as pass from public.books where user_id = 'a0000000-0000-0000-0000-00000000000a';

-- ===== Signed-out visitors =====
set local role anon;
do $$ begin
  perform 1 from public.friendships;
  raise exception 'FAIL: anon read friendships';
exception when insufficient_privilege then raise notice 'PASS: signed-out visitors cannot read community tables';
end $$;
do $$ begin
  perform public.send_friend_request('c_ada');
  raise exception 'FAIL: anon sent a request';
exception when insufficient_privilege then raise notice 'PASS: signed-out visitors cannot send requests';
end $$;

rollback;
