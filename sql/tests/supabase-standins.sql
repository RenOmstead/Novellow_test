-- =========================================================
-- LOCAL TESTING ONLY — never run this in Supabase.
--
-- Minimal stand-ins for the parts of Supabase that the
-- Novellow SQL depends on (auth.users, auth.uid(), the API
-- roles and storage), so schema.sql, policies.sql and
-- storage.sql can be tested on a plain local Postgres 15+.
--
--   createdb novellow_test
--   psql -d novellow_test -f sql/tests/supabase-standins.sql
--   psql -d novellow_test -f sql/schema.sql
--   psql -d novellow_test -f sql/policies.sql
--   psql -d novellow_test -f sql/storage.sql
--   psql -d novellow_test -f sql/tests/rls-test.sql
-- =========================================================

create role anon nologin;
create role authenticated nologin;

create schema auth;
create schema storage;

grant usage on schema public, auth, storage to anon, authenticated;

create table auth.users (
    id uuid primary key default gen_random_uuid(),
    email text,
    raw_user_meta_data jsonb default '{}'
);

create function auth.uid()
returns uuid
language sql
stable
as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

grant execute on function auth.uid() to anon, authenticated;

create table storage.buckets (
    id text primary key,
    name text,
    public boolean,
    file_size_limit bigint,
    allowed_mime_types text[]
);

create table storage.objects (
    id uuid primary key default gen_random_uuid(),
    bucket_id text references storage.buckets (id),
    name text,
    owner uuid
);

alter table storage.objects enable row level security;

grant all on storage.objects to authenticated;

create function storage.foldername(name text)
returns text[]
language sql
immutable
as $$
    select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1]
$$;

grant execute on function storage.foldername(text) to authenticated;

-- Supabase grants the API roles table access by default;
-- Row Level Security is what actually protects the rows.
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;
