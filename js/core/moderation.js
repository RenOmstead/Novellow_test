/* =========================================================
   NOVELLOW
   REPORTING AND BLOCKING

   Shared by every place another reader's words can appear:
   a visited room, book club and buddy read posts, and the
   friends list.

     reportReader(person, { what, quote })
         Asks what's wrong and sends it to the Novellow team's
         Notes inbox (reader_notes, kind 'report'). The reader
         who's reported isn't told who sent it.

     blockReader(person)
         Asks first, then blocks them (reader_blocks). The
         database ends any friendship, stops friend requests
         and visits between you (sql/public.sql).

     loadBlockedIds()
         The readers you've blocked, as a Set of ids, so a page
         can leave their posts out of what it shows you.

   person is { id, display_name, username? }.
========================================================= */

import { supabase } from "./supabase.js?v=__VERSION__";
import { NovellowError } from "./errors.js?v=__VERSION__";
import { html } from "./helpers.js?v=__VERSION__";
import { toast, toastError, confirmDialog, formDialog } from "./ui.js?v=__VERSION__";


// The longest a report's text can be (reader_notes allows 4000).
const MESSAGE_LIMIT = 4000;

const QUOTE_LIMIT = 1200;


// what: what's being reported, for the dialog and the team,
//       e.g. "their library" or "a post in Cosy Mysteries".
// quote: the words being reported, sent along so the team
//        can find them.
// Resolves true when a report was sent.
export async function reportReader(person, { what = "", quote = "" } = {}) {

    const name =
        person.display_name || "this reader";

    const sent =
        await formDialog({
            eyebrow: person.username ? `@${person.username}` : "",
            title: what ? `Report ${what}` : `Report ${name}`,
            submitLabel: "Send report",
            body: html`
                <p>Tell Novellow what's wrong: something unkind, unsafe, or not suitable for everyone. Only Novellow sees reports, and ${name} won't know who sent it. Reports are read within a day.</p>
                ${quote ? html`<blockquote class="report-quote">${clip(quote, 280)}</blockquote>` : ""}
                <label class="field">
                    <span class="field__label">What's the problem?</span>
                    <textarea class="field__input" name="message" rows="5" maxlength="2000" required></textarea>
                </label>
            `,
            onSubmit: async (values) => {

                const words =
                    String(values.get("message") || "").trim();

                if (!words) {
                    throw Object.assign(new Error("empty"), { userMessage: "Write a few words about the problem." });
                }

                const context = [
                    what ? `Reported: ${what}` : "",
                    quote ? `Their words: “${clip(quote, QUOTE_LIMIT)}”` : ""
                ].filter(Boolean).join("\n");

                const message =
                    (context ? `${words}\n\n${context}` : words).slice(0, MESSAGE_LIMIT);

                const { error } =
                    await supabase
                        .from("reader_notes")
                        .insert({ kind: "report", message, reported_user_id: person.id });

                if (error) {
                    throw new NovellowError(error.code === "P0001" ? error.message : "The report couldn't be sent just now.", error);
                }

                return true;

            }
        });

    if (sent) {
        toast("Thank you. Novellow will look at it.", { tone: "success" });
    }

    return Boolean(sent);

}


// Resolves true when they're blocked.
export async function blockReader(person) {

    const name =
        person.display_name || "this reader";

    const sure =
        await confirmDialog({
            title: `Block ${name}?`,
            message: "You won't see their posts, they won't be able to visit your library or send you friend requests, and if you're friends, that ends. They aren't told. You can unblock them in Settings.",
            confirmLabel: "Block",
            tone: "danger"
        });

    if (!sure) {
        return false;
    }

    try {

        const { error } =
            await supabase
                .from("reader_blocks")
                .insert({ blocked_id: person.id });

        // 23505: they were already blocked.
        if (error && error.code !== "23505") {
            throw new NovellowError("They couldn't be blocked just now.", error);
        }

        toast(`${name} is blocked.`, { tone: "success" });

        return true;

    }

    catch (error) {
        toastError(error);
        return false;
    }

}


export async function loadBlockedIds() {

    const { data, error } =
        await supabase
            .from("reader_blocks")
            .select("blocked_id");

    // Not being able to check shouldn't stop the page loading.
    if (error) {
        return new Set();
    }

    return new Set((data || []).map((row) => row.blocked_id));

}


function clip(text, limit) {

    const clean =
        String(text || "").replace(/\s+/g, " ").trim();

    return clean.length > limit ? `${clean.slice(0, limit - 1)}…` : clean;

}
