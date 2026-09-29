/* =========================================================
   NOVELLOW
   YOUR DATA AND YOUR ACCOUNT

   Download everything Novellow keeps about you (your right to
   see your data), or delete your account and all of it for
   good. Both only ever reach the signed-in reader's own rows:
   Row Level Security in the database makes sure of that.
========================================================= */

import { supabase } from "../core/supabase.js?v=__VERSION__";
import { signOutAfterDeleting } from "../core/auth.js?v=__VERSION__";
import { NovellowError } from "../core/errors.js?v=__VERSION__";
import { todayIso } from "../core/helpers.js?v=__VERSION__";


// Tables holding a reader's own rows, by the column naming them.
const OWN_TABLES = [
    ["user_settings", "user_id"],
    ["sign_in_events", "user_id"],
    ["shelves", "user_id"],
    ["books", "user_id"],
    ["book_sections", "user_id"],
    ["journal_entries", "user_id"],
    ["quotes", "user_id"],
    ["vocabulary", "user_id"],
    ["questions", "user_id"],
    ["characters", "user_id"],
    ["book_themes", "user_id"],
    ["reviews", "user_id"],
    ["reading_sessions", "user_id"],
    ["reading_challenges", "user_id"],
    ["decorations", "user_id"],
    ["reading_groups", "owner_id"],
    ["group_members", "user_id"],
    ["group_posts", "user_id"],
    ["reader_notes", "user_id"],
    ["reader_blocks", "blocker_id"]
];

const COVERS = "book-covers";


async function signedInUser() {

    const { data, error } =
        await supabase.auth.getUser();

    if (error || !data.user) {
        throw new NovellowError("Please sign in again first.", error);
    }

    return data.user;

}


async function rows(table, column, id) {

    const all = [];

    // In pages of 1,000, the most the database hands over at once.
    for (let from = 0; ; from += 1000) {

        const { data, error } =
            await supabase.from(table).select("*").eq(column, id).range(from, from + 999);

        if (error) {

            // A table that isn't set up yet (Community before
            // community.sql) simply has nothing to export.
            if (error.code === "42P01" || error.code === "PGRST205") {
                return all;
            }

            throw new NovellowError("Your data couldn't be gathered just now.", error);

        }

        all.push(...data);

        if (data.length < 1000) {
            return all;
        }

    }

}


// Every cover picture's path in the reader's folder.
async function coverFiles(userId) {

    const paths = [];

    const { data: folders, error } =
        await supabase.storage.from(COVERS).list(userId, { limit: 1000 });

    if (error || !folders) {
        return paths;
    }

    for (const folder of folders) {

        // A folder per book; a file directly in the folder has an id.
        if (folder.id) {
            paths.push(`${userId}/${folder.name}`);
            continue;
        }

        const { data: files } =
            await supabase.storage.from(COVERS).list(`${userId}/${folder.name}`, { limit: 1000 });

        (files || []).forEach((file) => paths.push(`${userId}/${folder.name}/${file.name}`));

    }

    return paths;

}


/*
    Everything Novellow keeps about the reader, as one JSON file.
*/

export async function exportPersonalData() {

    const user =
        await signedInUser();

    const { data: profile } =
        await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

    const { data: friendships } =
        await supabase.from("friendships").select("*").or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

    const tables = {};

    for (const [table, column] of OWN_TABLES) {
        tables[table] = await rows(table, column, user.id);
    }

    const payload = {
        about: "Everything Novellow keeps about you, as of the date below. See the Privacy Policy for what each part is for.",
        exported_at: new Date().toISOString(),
        account: {
            id: user.id,
            email: user.email,
            created_at: user.created_at,
            last_sign_in_at: user.last_sign_in_at,
            email_confirmed_at: user.email_confirmed_at || null,
            details: user.user_metadata || {}
        },
        profile: profile || null,
        friendships: friendships || [],
        ...tables,
        cover_pictures: await coverFiles(user.id),
        this_device: {
            note: "Saved in this browser only, never sent to Novellow: display and sound preferences, and a copy of your room's layout for quick loading.",
            items: Object.fromEntries(
                Object.keys(localStorage)
                    .filter((key) => key.startsWith("novellow"))
                    .map((key) => [key, localStorage.getItem(key)])
            )
        }
    };

    const blob =
        new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });

    const link =
        document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = `novellow-my-data-${todayIso()}.json`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => URL.revokeObjectURL(link.href), 2000);

}


/*
    Deletes the reader's account and everything in it. The
    password is checked first, so a borrowed, signed-in device
    can't be used to delete someone's library.
*/

export async function deleteAccount(password) {

    const user =
        await signedInUser();

    const { error: passwordError } =
        await supabase.auth.signInWithPassword({ email: user.email, password });

    if (passwordError) {
        throw new NovellowError("That password isn't right.", passwordError);
    }

    // Cover pictures first: files can only be deleted through
    // Storage, and the database takes care of everything else.
    const files =
        await coverFiles(user.id);

    for (let index = 0; index < files.length; index += 100) {

        const { error } =
            await supabase.storage.from(COVERS).remove(files.slice(index, index + 100));

        if (error) {
            throw new NovellowError("Your cover pictures couldn't be deleted just now, so nothing was deleted. Please try again.", error);
        }

    }

    const { error } =
        await supabase.rpc("delete_my_account");

    if (error) {

        if (error.code === "PGRST202" || error.code === "42883") {
            throw new NovellowError("Deleting accounts isn't set up on this site yet. Please ask the site's owner to run sql/account.sql.", error);
        }

        throw new NovellowError("Your account couldn't be deleted just now. Please try again.", error);

    }

    // Forget everything this device kept, then leave.
    Object.keys(localStorage)
        .filter((key) => key.startsWith("novellow"))
        .forEach((key) => localStorage.removeItem(key));

    await signOutAfterDeleting();

}
