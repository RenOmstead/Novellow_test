# Novellow's sign-in emails

Out of the box, Supabase sends the "confirm your email" and "reset
your password" emails from its own address, with its own wording.
These steps make them come from Novellow, in Novellow's colours, with
links that go straight to renomstead.github.io/Novellow_test.

Do these **after** the app update with the new email links is live
(the app has to understand the new links before the emails send them).

## 1. Let Resend send from your domain

1. Sign in at resend.com (the same account as the notes inbox, if you
   set that up).
2. **Domains** → **Add domain** → enter your domain (for the real site,
   `novellow.com`).
3. Resend lists a few DNS records. In **Cloudflare** → your domain →
   **DNS** → **Records**, add each one exactly as shown (Resend may
   offer to add them to Cloudflare for you). Leave "Proxy" off (grey
   cloud) for these.
4. Wait until Resend shows the domain as **Verified** (usually a few
   minutes).
5. **API Keys** → **Create API key** → permission **Sending access** →
   copy the key (it starts with `re_`). You'll paste it once, below.

## 2. Point Supabase at Resend

In Supabase: **Authentication** → **Emails** → **SMTP Settings** →
turn on **Enable custom SMTP**:

| Setting | Value |
|---|---|
| Sender email | `hello@novellow.com` (any address at your domain) |
| Sender name | `Novellow` |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | the Resend API key |

Save. Then **Authentication** → **Rate Limits**: raise "Rate limit
for sending emails" (for example to 100 an hour). With your own email
service, Supabase starts it low.

## 3. Check the addresses

**Authentication** → **URL Configuration**:

- **Site URL**: `https://renomstead.github.io/Novellow_test/`
- **Redirect URLs**: `https://renomstead.github.io/Novellow_test/**`

## 4. Paste in the emails

**Authentication** → **Emails** → **Templates**. For each one below,
open it, set the **Subject**, and replace the whole **Message body**
with the contents of the file in `docs/email-templates/` (open the
file on GitHub, press **Raw**, select all, copy).

| Supabase template | Subject | File |
|---|---|---|
| Confirm signup | Confirm your email for Novellow | `confirm-signup.html` |
| Reset password | Reset your Novellow password | `reset-password.html` |
| Change email address | Confirm your new email for Novellow | `change-email.html` |
| Magic link | Your Novellow sign-in link | `magic-link.html` |

Novellow only sends the first two today; the other two keep any
future emails looking the same.

## 5. Try it

Sign up on renomstead.github.io/Novellow_test with a second email address you can check (or ask
for a password reset on your own account). The email should come from
**Novellow**, and its button should open renomstead.github.io/Novellow_test and sign you in.

If an email link says it has expired or was already used, the reader
just asks for a new one: each link works once, for a short while.
