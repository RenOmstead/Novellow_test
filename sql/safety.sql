-- =========================================================
-- NOVELLOW
-- KEEPING THE COMMUNITY KIND
--
-- Run after wall.sql (it's safe to run again).
--
-- A short list of words that are never allowed in anything
-- other readers see: book club and buddy read posts, club
-- names and descriptions, and display names, usernames and
-- bios. Anything containing one is turned away, and the
-- reader is asked to reword it. Private journals, notes,
-- quotes and reviews aren't checked: what you keep for
-- yourself is yours.
--
-- The list lives in public.moderation_words. To add to it,
-- open Table Editor → moderation_words and insert a row (one
-- lowercase word or phrase); it applies straight away. Only
-- whole words match, so a word hidden inside a longer,
-- innocent word isn't caught.
--
-- This works alongside Report and Block (sql/public.sql, the
-- app's Report buttons) and the zero tolerance rule in the
-- Terms of Use. App stores ask for all of them.
-- =========================================================


create table if not exists public.moderation_words (
    word text primary key
        check (word = lower(trim(word)) and char_length(word) between 2 and 60),
    created_at timestamptz not null default now()
);

alter table public.moderation_words enable row level security;

-- No rules: readers can't read or change the list. Only the
-- database itself (below) and the Table Editor can.
revoke all on public.moderation_words from anon, authenticated;


-- Slurs and threats with no innocent meaning.
insert into public.moderation_words (word) values
    ('nigger'), ('niggers'), ('nigga'), ('niggas'), ('niggaz'),
    ('sandnigger'), ('kike'), ('kikes'), ('wetback'), ('wetbacks'),
    ('raghead'), ('ragheads'), ('towelhead'), ('towelheads'),
    ('gook'), ('gooks'), ('beaner'), ('beaners'), ('spics'),
    ('faggot'), ('faggots'), ('tranny'), ('trannies'),
    ('kys'), ('kill yourself'), ('kill urself'), ('go die')
on conflict (word) do nothing;


-- True when the text contains a listed word. Also checks the
-- text with common look-alike characters swapped back
-- (0 → o, 1 → i, 3 → e, 4 and @ → a, 5 and $ → s, ! → i).
create or replace function public.is_objectionable(p_text text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select coalesce(p_text, '') <> '' and exists (
        select 1
        from public.moderation_words w,
             lateral (select '\m' || regexp_replace(w.word, '([^a-z0-9 ])', '\\\1', 'g') || '\M' as pattern) p
        where lower(p_text) ~ p.pattern
           or translate(lower(p_text), '0134@5$!', 'oieaassi') ~ p.pattern
    );
$$;

revoke all on function public.is_objectionable(text) from public, anon, authenticated;


-- Checks the columns named in the trigger (TG_ARGV).
create or replace function public.keep_it_kind()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    field text;
begin
    foreach field in array tg_argv loop
        if public.is_objectionable(to_jsonb(new) ->> field) then
            raise exception using
                errcode = 'P0001',
                message = 'That includes words Novellow doesn''t allow. Please reword it and try again.';
        end if;
    end loop;

    return new;
end;
$$;

revoke all on function public.keep_it_kind() from public, anon, authenticated;


drop trigger if exists keep_it_kind on public.group_posts;
create trigger keep_it_kind
    before insert or update on public.group_posts
    for each row execute function public.keep_it_kind('body');

drop trigger if exists keep_it_kind on public.reading_groups;
create trigger keep_it_kind
    before insert or update on public.reading_groups
    for each row execute function public.keep_it_kind('name', 'description');

drop trigger if exists keep_it_kind on public.profiles;
create trigger keep_it_kind
    before insert or update of display_name, username, bio on public.profiles
    for each row execute function public.keep_it_kind('display_name', 'username', 'bio');


-- =========================================================
-- CHECK
-- Every row should say true.
-- =========================================================

select 'a slur is caught' as check, public.is_objectionable('you are a K1ke') as ok
union all
select 'a threat is caught', public.is_objectionable('just kill yourself')
union all
select 'ordinary words pass', not public.is_objectionable('Loved the chink of teacups in chapter two, spick and span!')
union all
select 'a word inside another word passes', not public.is_objectionable('Scunthorpe skyscraper')
union all
select 'readers cannot read the list', not has_table_privilege('authenticated', 'public.moderation_words', 'select');
