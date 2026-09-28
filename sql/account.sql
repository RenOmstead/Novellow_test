-- =========================================================
-- NOVELLOW
-- DELETING AN ACCOUNT
--
-- Run after community.sql (it's safe to run again).
--
-- A reader can delete their own account from Settings. The
-- app first removes their cover pictures through the Storage
-- API (Supabase doesn't allow deleting files with SQL), then
-- calls delete_my_account(), which deletes their sign-in.
--
-- Every table that holds a reader's things references
-- auth.users with ON DELETE CASCADE, so deleting the sign-in
-- deletes all of it with it: profile, settings, shelves,
-- books, journals, quotes, words, reviews, decorations,
-- friendships, book clubs they started (with their
-- discussions), their posts and memberships.
--
-- It runs with the owner's rights (SECURITY DEFINER), because
-- readers can't touch auth.users themselves, and only ever
-- deletes the account of whoever is calling it.
-- =========================================================


create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    me uuid := auth.uid();
begin

    if me is null then
        raise exception 'Sign in to delete your account.'
            using errcode = 'P0001';
    end if;

    delete from auth.users
    where id = me;

end;
$$;


revoke all on function public.delete_my_account() from public;
revoke all on function public.delete_my_account() from anon;
grant execute on function public.delete_my_account() to authenticated;
