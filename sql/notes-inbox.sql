-- =========================================================
-- NOVELLOW
-- THE NOVELLOW ACCOUNT'S NOTES INBOX
--
-- Run after notes.sql (it's safe to run again).
--
-- Readers' notes go to the Novellow account: signed in as
-- novellow.contact@gmail.com, About Novellow shows a Notes inbox
-- with every reader's note, where you set a status and write a
-- reply that the reader then sees in the app. Nobody else can
-- see the inbox or anyone else's notes.
--
-- ONE-TIME SETUP
-- a. On the site, create an account with
--    novellow.contact@gmail.com and confirm it.
-- b. Run this file. It makes that account the Novellow account.
--
-- OPTIONAL: an email for each new note
--    If you'd also like each note emailed to that Gmail (with a
--    link to the inbox), sign up at resend.com with
--    novellow.contact@gmail.com, open API Keys → Create API Key
--    (Sending access), copy the key (it starts with re_), and run
--    this line on its own with your key in its place. It's kept
--    encrypted in Supabase's Vault, never in the website's code:
--
--      select vault.create_secret('re_your_key_here', 'resend_api_key', 'Emails readers'' notes to Novellow');
--
--    To stop the emails, delete the secret:
--      delete from vault.secrets where name = 'resend_api_key';
-- =========================================================


-- ---------------------------------------------------------
-- THE NOVELLOW ACCOUNT
-- ---------------------------------------------------------

-- Who answers notes. Only changed here, in the SQL Editor; the
-- app can't add anyone.
create table if not exists public.novellow_team (
    user_id uuid primary key
        references auth.users (id) on delete cascade,
    added_at timestamptz not null default now()
);

alter table public.novellow_team enable row level security;

revoke all on public.novellow_team from anon, authenticated;

-- The Novellow account, once it exists. (Run this file again
-- after creating it, if it didn't exist the first time.)
insert into public.novellow_team (user_id)
select id
from auth.users
where lower(email) = 'novellow.contact@gmail.com'
on conflict do nothing;


create or replace function public.is_novellow_team()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.novellow_team
        where user_id = (select auth.uid())
    );
$$;

revoke all on function public.is_novellow_team() from public;
-- Signed-out visitors ask too (the Workshop's rules); it's
-- always "no" for them.
grant execute on function public.is_novellow_team() to anon, authenticated;


-- ---------------------------------------------------------
-- THE INBOX
-- ---------------------------------------------------------

-- The Novellow account can read any note…
drop policy if exists "The team reads every note" on public.reader_notes;
create policy "The team reads every note"
    on public.reader_notes
    for select
    to authenticated
    using ((select public.is_novellow_team()));

-- …and answer it: only its status and reply can change.
drop policy if exists "The team answers notes" on public.reader_notes;
create policy "The team answers notes"
    on public.reader_notes
    for update
    to authenticated
    using ((select public.is_novellow_team()))
    with check ((select public.is_novellow_team()));

grant update (status, reply) on public.reader_notes to authenticated;


-- Reports about a reader's library (sql/public.sql) name it.
alter table public.reader_notes
    add column if not exists reported_user_id uuid
        references auth.users (id) on delete cascade;

-- Whether the Novellow account has hidden that library.
alter table public.profiles
    add column if not exists public_hidden boolean not null default false;

-- Every note with who sent it, for the inbox. Returns nothing to
-- any other account.
drop function if exists public.team_notes(boolean);

create function public.team_notes(only_open boolean default true)
returns table (
    id uuid,
    kind text,
    message text,
    device text,
    status text,
    reply text,
    created_at timestamptz,
    updated_at timestamptz,
    reader_name text,
    reader_email text,
    reported_id uuid,
    reported_username text,
    reported_hidden boolean
)
language sql
stable
security definer
set search_path = ''
as $$
    select
        n.id, n.kind, n.message, n.device, n.status, n.reply,
        n.created_at, n.updated_at,
        coalesce(nullif(p.display_name, ''), 'A reader'),
        u.email,
        r.id, r.username, r.public_hidden
    from public.reader_notes n
    join auth.users u on u.id = n.user_id
    left join public.profiles p on p.id = n.user_id
    left join public.profiles r on r.id = n.reported_user_id
    where (select public.is_novellow_team())
      and (not only_open or n.status in ('new', 'seen', 'planned'))
    order by
        (n.status = 'new') desc,
        (n.kind = 'report') desc,
        n.created_at desc
    limit 300;
$$;

revoke all on function public.team_notes(boolean) from public, anon;
grant execute on function public.team_notes(boolean) to authenticated;



-- ---------------------------------------------------------
-- OPTIONAL: AN EMAIL FOR EACH NEW NOTE
-- ---------------------------------------------------------

-- Sends web requests from the database (the email to Resend).
create extension if not exists pg_net;


create or replace function public.reader_notes_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    -- Where the emails go. Resend's free plan can only send to
    -- the address the Resend account was made with.
    inbox constant text := 'novellow.contact@gmail.com';

    -- Where the note is answered.
    inbox_page constant text := 'https://novellow.com/about.html#inbox';

    api_key text;
    reader_name text;
    kind_label text;
begin

    select decrypted_secret
    into api_key
    from vault.decrypted_secrets
    where name = 'resend_api_key';

    -- No Resend key: the note is in the inbox, and that's all.
    if api_key is null or api_key = '' then
        return new;
    end if;

    select p.display_name
    into reader_name
    from public.profiles p
    where p.id = new.user_id;

    kind_label :=
        case new.kind
            when 'problem' then 'Something''s not working'
            when 'idea' then 'An idea or wish'
            when 'report' then 'A report about a library'
            else 'Something else'
        end;

    perform net.http_post(
        url := 'https://api.resend.com/emails',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || api_key,
            'Content-Type', 'application/json'
        ),
        body := jsonb_build_object(
            'from', 'Novellow notes <onboarding@resend.dev>',
            'to', jsonb_build_array(inbox),
            'subject', 'Novellow note: ' || kind_label || ' from ' || coalesce(nullif(reader_name, ''), 'a reader'),
            'text',
                kind_label || E'\n\n'
                || new.message || E'\n\n'
                || '— ' || coalesce(nullif(reader_name, ''), 'A reader') || E'\n'
                || coalesce('Device: ' || new.device || E'\n', '')
                || E'\n'
                || 'Answer it in the Notes inbox (signed in as the Novellow account), and the reader will see your reply in Novellow:' || E'\n'
                || inbox_page
        )
    );

    return new;

-- An email problem must never stop the note being saved.
exception when others then
    raise warning 'The note was saved, but its email could not be sent: %', sqlerrm;
    return new;

end;
$$;

revoke all on function public.reader_notes_email() from public, anon, authenticated;

drop trigger if exists reader_notes_email on public.reader_notes;
create trigger reader_notes_email
    after insert on public.reader_notes
    for each row execute function public.reader_notes_email();
