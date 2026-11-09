# Putting Novellow in the App Store and Google Play

Novellow is a website, so both store apps are a thin app "frame" around
novellow.com: the app opens the site full screen, with no browser bars.
Everything you change on the site shows up in the apps straight away,
with no new app version needed.

- **Google Play** uses a *Trusted Web Activity*: Chrome shows
  novellow.com inside the app. Google supports this officially.
- **Apple** uses a small iPhone/iPad app with a built-in web view.

[PWABuilder](https://www.pwabuilder.com) (free, from Microsoft) makes
both packages from the site.

---

## What's already done

These are what store reviewers check most often, and what gets apps
turned down. Novellow now has all of them:

| What the stores ask | Where it is in Novellow |
| --- | --- |
| Report anything other readers post | **Report** on every club and buddy-read post, on each friend, on a friend's shelves and on every visited library. Reports arrive in the Notes inbox on About Novellow. |
| Block abusive readers | **Block** in the same places. Blocking hides their posts, stops visits and friend requests, and ends the friendship. Unblock in Settings. |
| Filter objectionable words before they're posted | `sql/safety.sql`: slurs and threats are turned away from posts, club names, display names, usernames and bios. |
| Terms with zero tolerance for abuse, and action on reports within 24 hours | Terms of Use, section 4. Section 11 has the terms Apple requires apps to include. |
| Delete your account inside the app | Settings → Delete my account. |
| A web page explaining how to delete your account (Google Play) | `https://novellow.com/delete-account.html` |
| Privacy policy | `https://novellow.com/privacy.html` (now covers the store apps) |
| Support page with contact details (Apple) | `https://novellow.com/support.html` |
| Works when the connection drops | A friendly "You're offline" page instead of an error (`sw.js`, `offline.html`). |
| Complete app details for the packaging tools | `manifest.webmanifest`: name, description, icons, screenshots, shortcuts. |
| No ads, tracking, payments or third-party sign-in | None of these exist, so there's no tracking prompt, no in-app purchases, and no "Sign in with Apple" requirement. |

---

## Before you start

1. **This update is live on novellow.com**, and `sql/safety.sql` has
   been run in Supabase (SQL Editor, paste, Run; every row in the check
   should say true).
2. **Sign-in emails come from Novellow** (docs/EMAIL.md). Reviewers make
   accounts; if the email doesn't arrive, they can't get in, and the app
   is rejected.
3. **Turn on email alerts for notes** (top of `sql/notes-inbox.sql`), so
   every report reaches your inbox. You've promised to act within 24
   hours.
4. **Make a reviewer account.** Sign up on novellow.com with an address
   you control (for example novellow.review@gmail.com). Add a few books
   with notes and quotes, decorate the room, make it friends with your
   own account, and start a book club with a couple of posts, so
   reviewers can try Report and Block. Keep the password for the forms
   below.
5. **Developer accounts**
   - **Google Play Console**: US$25, once.
     [play.google.com/console](https://play.google.com/console). As a
     personal account you'll verify your identity. **New personal
     accounts must run a closed test with at least 12 testers for 14 days
     in a row** before the app can go public, so line up 12 friends with
     Android phones early.
   - **Apple Developer Program**: US$99 a year.
     [developer.apple.com/programs](https://developer.apple.com/programs).
     As an individual, your legal name is shown as the seller. To show
     "Novellow" instead you'd enroll as an organization, which needs a
     registered business and a free D-U-N-S number.
   - Building the iPhone app needs **a Mac with Xcode** (free from the
     Mac App Store). If you don't have one, a rented cloud Mac works.

---

## Google Play

### 1. Make the app package

1. Go to [pwabuilder.com](https://www.pwabuilder.com), enter
   `https://novellow.com/` and choose **Start**. It should find the
   manifest and the service worker with no red warnings.
2. Choose **Package for stores** → **Android** → **Generate package**
   and fill in:
   - **Package ID**: `com.novellow.app` (it can never change later)
   - **App name**: `Novellow`; **Launcher name**: `Novellow`
   - **Start URL**: `/dashboard.html?app=android`
   - **Display mode**: Standalone. Leave the colours as found.
   - **Signing key**: *Create new*. Fill in your name and a strong
     password.
3. Download the zip. Inside are:
   - `app-release-bundle.aab`: what you upload to Google Play;
   - `signing.keystore` and `signing-key-info.txt`: **back these up
     somewhere safe** (a password manager or a private drive). Without
     them you can never update the app;
   - `assetlinks.json`: proves the app and novellow.com belong together.

### 2. Link the app to the site

Without this, the app shows a browser address bar across the top.

1. Send me `assetlinks.json` (or paste its contents) and I'll add it to
   the site as `.well-known/assetlinks.json`. `build.sh` already
   publishes that folder. Check it's live at
   `https://novellow.com/.well-known/assetlinks.json`.
2. After the first upload (step 4), Google re-signs the app with its own
   key. In Play Console → **Test and release** → **Setup** → **App
   signing**, copy the **SHA-256 certificate fingerprint** under *App
   signing key certificate* and send it to me. It has to be added to the
   same file, next to the first one.

### 3. Create the app in Play Console

**Create app**: name `Novellow`, default language English (United
States), **App**, **Free**. Then work through **Set up your app**:

- **Privacy policy**: `https://novellow.com/privacy.html`
- **App access**: *All or some functionality is restricted*. Add the
  reviewer account's email and password, with: "Sign in on the first
  screen. Community → Cosy Mysteries is a book club with posts to
  report or block."
- **Ads**: No.
- **Content rating**: fill in the questionnaire honestly. Category:
  *Social or communication*. Users can interact and share content:
  **yes**. No violence, sexual content, gambling, drugs or bad language
  in the app itself. Expect a Teen-type rating.
- **Target audience**: 13–15, 16–17 and 18+. **Don't tick anything
  under 13**: that brings in the stricter Families rules, and Novellow
  is for 13 and over.
- **News app**: No. **Government app**: No. **Financial features**:
  None. **Health**: None.
- **Data safety**: see *Privacy answers* below.
- **Delete account URL**: `https://novellow.com/delete-account.html`.
  Also answer that readers can delete their account in the app.

### 4. Store listing

Under **Grow users** → **Store presence** → **Main store listing**:

- **App name**: Novellow
- **Short description**: see *Listing text*
- **Full description**: see *Listing text*
- **App icon**: `assets/app/icon-512.png` (512 × 512)
- **Feature graphic**: `docs/store/feature-graphic-1024x500.png`
- **Phone screenshots**: the six `play-phone-*.png` (1920 × 1080)
- **Tablet screenshots** (7-inch and 10-inch): the six `ipad-13-*.png`
- **Category**: Books & Reference. **Tags**: reading, books, journal.
- **Contact email**: novellow.contact@gmail.com. **Website**:
  `https://novellow.com/support.html`

### 5. Closed test, then release

1. **Test and release** → **Testing** → **Closed testing** → create a
   track, upload `app-release-bundle.aab`, and add your testers' Google
   account emails (at least 12).
2. Send them the opt-in link. They must opt in, install the app, and
   keep it installed for **14 days**. Ask them to actually use it; Google
   asks you about their feedback afterwards.
3. Then **Apply for production access** on the Dashboard, and once
   approved, release to **Production**.

Google requires apps to target a recent Android version. Once a year,
make a fresh package on PWABuilder with the **same signing key** and
upload it as an update.

---

## Apple App Store

### 1. Make the app

1. On [pwabuilder.com](https://www.pwabuilder.com), enter
   `https://novellow.com/` → **Package for stores** → **iOS**:
   - **Bundle ID**: `com.novellow.app`
   - **App name**: `Novellow`
   - **URL**: `https://novellow.com/dashboard.html?app=ios`
   - **Permitted URLs**: leave as is.
2. Download the zip and, on a Mac, follow PWABuilder's included
   instructions (install CocoaPods, run `pod install` in the `src`
   folder, open the `.xcworkspace` in Xcode).
3. In Xcode, select the project, then **Signing & Capabilities** →
   **Team**: your Apple Developer account.
4. Still in Xcode, open **Info** and add **Privacy - Camera Usage
   Description** with: *Novellow uses the camera only to scan a book's
   barcode. The picture never leaves your device.* Without it the app
   crashes when someone taps Scan barcode, and Apple rejects it.
5. Under **General** → **Deployment Info**, tick iPhone and iPad, and on
   iPad allow all four orientations (Apple expects this on iPad).
6. Test on your own iPhone (plug it in, pick it at the top, ▶). Then
   **Product** → **Archive** → **Distribute App** → **App Store
   Connect** → **Upload**.

### 2. Create the app in App Store Connect

[appstoreconnect.apple.com](https://appstoreconnect.apple.com) → **Apps**
→ **+** → **New App**: iOS, name `Novellow` (if that's taken, `Novellow:
Reading Journal`), English (U.S.), bundle ID `com.novellow.app`, SKU
`novellow`.

- **Category**: Books (primary), Lifestyle (secondary)
- **Price**: Free
- **Privacy Policy URL**: `https://novellow.com/privacy.html`
- **Support URL**: `https://novellow.com/support.html`
- **App Privacy**: see *Privacy answers* below. Tracking: **No**.
- **Age rating**: answer the questionnaire honestly. User-generated
  content and messaging between users: **Yes** (book clubs). No
  unrestricted web access, no gambling, no mature themes in the app
  itself. Expect 13+. Novellow is not "Made for Kids".
- **Screenshots**: iPhone 6.9-inch: the six `iphone-6.9-*.png`
  (2796 × 1290). iPad 13-inch: the six `ipad-13-*.png` (2752 × 2064).
- **App icon**: comes from Xcode; `docs/store/icon-1024.png` is the
  1024 × 1024 version if asked. (If you have the original logo artwork
  at a higher size, make the icon from that instead: this one is
  enlarged from the 512 × 512 icon and is a little soft.)
- **Copyright**: `2026 Novellow`

### 3. App Review notes

Under **App Review Information**, add the reviewer account's email and
password, your phone number, and these notes:

> Novellow is an illustrated library and reading journal: readers build
> a bookcase, keep notes, quotes and new words for each book, set reading
> challenges, decorate a reading room with ambient sounds, scan a book's
> barcode to add it, and read along with friends in book clubs.
>
> Community safety (Guideline 1.2): every post in a book club or buddy
> read, every friend and every visited library has Report and Block.
> Reports reach us and are acted on within 24 hours. Objectionable words
> are filtered before they're posted. The Terms of Use (section 4) have
> a zero-tolerance policy for objectionable content and abusive users.
> The demo account is in a book club called Cosy Mysteries with posts
> you can report or block.
>
> Account deletion: Settings → Delete my account.

### 4. TestFlight, then submit

Once the upload finishes processing, try it through **TestFlight** on
your own phone (internal testing needs no review). Then **Add for
Review** → **Submit**.

**If Apple says the app is "just a website" (Guideline 4.2):** reply
pointing out what makes Novellow an app: the illustrated room, ambient
sounds, barcode scanning, offline page, and that everything is built for
touch. If they still refuse, the next step is adding things only an app
can do, such as reading reminders as notifications. Tell me and we'll
build them.

---

## Listing text

Use the same words in both stores. Don't mention the other store, other
platforms, or "web app" in either listing.

**Subtitle** (Apple, 30 characters)
> Cozy library & reading journal

**Short description** (Google Play, 80 characters)
> A cozy illustrated library and reading journal for your books, notes and quotes.

**Promotional text** (Apple, 170 characters)
> Build a bookcase that feels like home. Track what you read, keep notes, quotes and new words in every book, decorate your reading room and read along with friends.

**Keywords** (Apple, 100 characters)
> reading journal,book tracker,bookshelf,reading log,tbr,book club,quotes,reading goals,library,cozy

**Description**
> Novellow is a cozy, hand-illustrated library for everything you read.
>
> YOUR BOOKCASE
> Every book you add takes its place on a wooden bookcase in your own reading room, with a painted spine you can choose and decorate. Sort them onto shelves you name yourself.
>
> A JOURNAL INSIDE EVERY BOOK
> Open any book to keep notes from the margins, favourite quotes, new words and their meanings, characters, themes, questions and your review. Track your page and your progress as you go.
>
> A ROOM THAT'S YOURS
> Choose a theme, then decorate: lamps, plants, a sleepy cat, rain on the window. Turn on soft ambient sounds like rain, a crackling fire or a ticking clock while you read.
>
> READING GOALS AND CHALLENGES
> Set a yearly goal and make little challenges of your own, then watch your reading stats grow.
>
> READ TOGETHER
> Add friends, visit each other's rooms, start a book club, or try a buddy read where comments stay hidden until you've reached that chapter.
>
> PRIVATE BY DEFAULT
> Your library is yours. It's private unless you choose to share it. No ads, no tracking, and your writing is never sold or used to train AI.
>
> Add books by searching or by scanning the barcode on the back.

---

## Privacy answers

Novellow collects only what readers type in or upload, uses it only to
run the app, shares it with nobody, never tracks anyone, and deletes it
when the account is deleted. The services it runs on (Supabase, Resend,
Cloudflare) process data on Novellow's behalf, which both stores say
doesn't count as "sharing".

### Google Play: Data safety

- Does your app collect or share any of the required user data types?
  **Yes**.
- Is all of the user data collected by your app encrypted in transit?
  **Yes**.
- Do you provide a way for users to request that their data is deleted?
  **Yes**: in the app, and at the delete-account page.

Data collected (none of it shared; none of it optional unless noted):

| Data type | Why | Notes |
| --- | --- | --- |
| Personal info → **Email address** | App functionality, Account management | Required |
| Personal info → **Name** | App functionality | The display name readers choose |
| Personal info → **User IDs** | App functionality, Account management | |
| Photos and videos → **Photos** | App functionality | Optional: cover pictures readers upload |
| Messages → **Other in-app messages** | App functionality | Optional: book club and buddy read posts |
| App activity → **Other user-generated content** | App functionality | Notes, quotes, reviews and the rest of the journal |
| App info and performance → **Diagnostics** | App functionality | Optional: browser and screen size, if left ticked when sending a note |

Not collected: location, contacts, financial info, health, calendar,
audio, files, web browsing, device IDs, or app interactions/analytics.
The barcode camera picture is read on the device and never sent.

### Apple: App Privacy

- **Data used to track you**: none.
- **Data linked to you** (all for **App Functionality** only):
  - Contact Info → **Email Address**, **Name**
  - User Content → **Photos or Videos** (cover pictures), **Other User
    Content** (journal, reviews, posts), **Customer Support** (notes sent
    to Novellow)
  - Identifiers → **User ID**
  - Diagnostics → **Other Diagnostic Data** (the optional device line on
    notes)
- **Data not linked to you**: none.

---

## Acting on reports within 24 hours

The Terms promise this, and Apple checks that it happens. Once a day:

1. Sign in as the Novellow account and open **About Novellow** → the
   Notes inbox. Reports say what was reported, include the reported
   words, and name the reader they're about.
2. **To remove a post:** in Supabase → **Table Editor** → `group_posts`,
   search for the words and delete the row.
3. **To hide a public library:** choose **Hide this page** on the report
   in the inbox (or set `public_hidden` to true for them in `profiles`).
4. **To remove a reader** who broke the rules: Supabase →
   **Authentication** → **Users**, find them by email or by the ID in the
   report, then **Delete user**. Their account and everything in it is
   deleted.
5. Reply to the reader who reported it, from the inbox, to let them know
   it's been dealt with.

To stop a word from being posted again, add it in **Table Editor** →
`moderation_words`.

---

## Files

- `docs/store/icon-1024.png`: App Store icon (1024 × 1024).
- `docs/store/feature-graphic-1024x500.png`: Google Play feature graphic.
- `assets/app/icon-512.png`: Google Play icon (512 × 512).
- Screenshots (`iphone-6.9-*`, `ipad-13-*`, `play-phone-*`): sent
  separately as a zip, because they're too large to keep in the
  repository. Ask me for a fresh set any time the app's look changes.
