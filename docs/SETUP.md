# Connecting Novellow to Supabase

Novellow's code already points at your Supabase project
(`js/config.js`). This guide sets up the project itself so
sign-ups, books, journals and covers are saved. It takes about
ten minutes and is done once.

You'll need the Supabase dashboard for your project
(`idqlbfckdggsvmiktwuq`) and the GitHub repository settings.

---

## 1. Create the tables, security rules and cover storage

In Supabase, open **SQL Editor** → **New query**. Run these three
files from the `sql/` folder, **in this order**. For each one, paste the
whole file into the editor and select **Run**:

1. `sql/schema.sql`: the tables (profiles, settings, shelves, books,
   journal sections, quotes, words, reviews, challenges, decorations,
   the sign-in log), plus the trigger that creates a profile for every
   new account.
2. `sql/policies.sql`: Row Level Security. Every table only lets a
   signed-in reader see and change their own rows.
3. `sql/storage.sql`: the private `book-covers` bucket and its rules.
   Each reader can only reach the covers in their own folder.

Each should finish with "Success. No rows returned". If one shows an
error, stop there and send me the message.

**Check:** in **Table Editor**, every table should show a green
"RLS enabled" label. In **Storage**, you should see a `book-covers`
bucket marked Private.

## 2. Turn on email confirmation and set the addresses

In **Authentication** → **Sign In / Providers** → **Email**:

- **Enable Email provider**: on
- **Confirm email**: on

In **Authentication** → **URL Configuration**:

- **Site URL**: `https://renomstead.github.io/Novellow_test/`
- **Redirect URLs**: add `https://renomstead.github.io/Novellow_test/**`

These addresses are where the confirmation and password-reset emails
send people back to. If they're wrong, the email links won't work.

Optional: under **Authentication** → **Email Templates** you can reword
the "Confirm signup" and "Reset password" emails. Keep the
`{{ .ConfirmationURL }}` link in each one.

> Supabase's built-in email service only sends a few emails an hour.
> That's fine for you and a few friends. For more readers, add your own
> email service under **Authentication** → **Emails** → **SMTP Settings**.

## 3. Publish with GitHub Pages

1. In GitHub, open the repository → **Settings** → **Pages**.
2. Under **Build and deployment** → **Source**, choose **GitHub Actions**.
3. Merge this branch into `main`. The **Publish to GitHub Pages**
   workflow runs on every push to `main`. It stamps each file with the
   commit ID so browsers always load the newest version, then
   publishes the site.

The site will be at <https://renomstead.github.io/Novellow_test/>.

## 4. Try it

1. Open the site and choose **Create an account**.
2. Confirm the email, then sign in. You'll arrive at an empty bookcase.
3. Add a book with a cover picture, open it, and write a note.
4. In Supabase → **Table Editor** → `sign_in_events`, each sign-in
   appears with its time and browser. That's the sign-in history. Each
   reader also sees their own under **Settings** → **Recent sign-ins**.

## Keys: what's safe where

- `js/config.js` holds the project URL and the **anon (public) key**.
  That key is meant to be in the browser. It can only do what the Row
  Level Security rules allow, which is a signed-in reader working with
  their own rows.
- The **service_role** key must **never** go in this repository or any
  browser code. Novellow doesn't use it.

## Moving to a different Supabase project later

Change the two values in `js/config.js` (`SUPABASE_URL` and
`SUPABASE_PUBLISHABLE_KEY`) and run steps 1–2 on the new project. Nothing
else in the code mentions the project.
