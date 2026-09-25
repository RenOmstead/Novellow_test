/* =========================================================
   NOVELLOW
   AUTHENTICATION

   Sign up, sign in, sign out, password reset, the session
   guard for app pages, and the sign-in log.
========================================================= */

import { supabase, isConfigured } from "./supabase.js?v=__VERSION__";
import { friendlyAuthError, NovellowError } from "./errors.js?v=__VERSION__";


let signingOut = false;
let watching = false;


/* =========================================================
   URLS
   Built relative to the current page, so the app works at
   renomstead.github.io/Novellow/ or any other folder.
========================================================= */

export function appUrl(path) {
    return new URL(path, window.location.href).href;
}


/*
    Only same-folder page names are allowed as a return
    address, so a crafted ?next= can't send readers elsewhere.
*/

function safeNext(next) {

    return /^[a-z-]+\.html(\?[\w=&%.-]*)?$/i.test(next || "")
        ? next
        : "dashboard.html";

}


/* =========================================================
   SESSION
========================================================= */

export async function getSession() {

    const { data, error } =
        await supabase.auth.getSession();

    if (error) {
        throw error;
    }

    return data.session;

}


/*
    Used by every app page. Sends signed-out visitors to the
    entrance and returns the session otherwise.
*/

export async function requireSession() {

    if (!isConfigured) {
        throw new NovellowError("Novellow isn't connected to its library yet. Add the Supabase details to js/config.js.");
    }

    const session =
        await getSession();

    if (!session) {

        const here =
            window.location.pathname.split("/").pop() + window.location.search;

        window.location.replace(`index.html?next=${encodeURIComponent(here)}`);

        // Never resolve: the page is leaving.
        return new Promise(() => {});

    }

    watchAuthChanges();

    return session;

}


function watchAuthChanges() {

    if (watching) {
        return;
    }

    watching = true;

    supabase.auth.onAuthStateChange((event) => {

        if (event === "SIGNED_OUT") {

            window.location.replace(
                signingOut ? "index.html" : "index.html?expired=1"
            );

        }

        if (event === "USER_UPDATED") {
            document.dispatchEvent(new CustomEvent("novellow:user-updated"));
        }

        // TOKEN_REFRESHED and SIGNED_IN need no action: the client
        // keeps using the fresh session automatically.

    });

}


/* =========================================================
   SIGN UP
========================================================= */

export async function signUp({ displayName, email, password }) {

    const { data, error } =
        await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    display_name: displayName
                },
                emailRedirectTo: appUrl("index.html?confirmed=1")
            }
        });

    if (error) {
        throw new NovellowError(friendlyAuthError(error), error);
    }

    // With email confirmation on, Supabase doesn't reveal whether
    // an address is taken; it returns a user with no identities.
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        throw new NovellowError("An account already exists for that email. Try signing in instead.");
    }

    if (data.session) {

        await recordSignIn("sign_up");

        return { status: "signed_in" };

    }

    return { status: "confirm_email" };

}


/* =========================================================
   SIGN IN
========================================================= */

export async function signIn({ email, password }) {

    const { error } =
        await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        throw new NovellowError(friendlyAuthError(error), error);
    }

    await recordSignIn("password");

}


export function afterSignInUrl() {

    const next =
        new URLSearchParams(window.location.search).get("next");

    return safeNext(next);

}


/* =========================================================
   PASSWORD
========================================================= */

export async function sendPasswordReset(email) {

    const { error } =
        await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: appUrl("index.html?reset=1")
        });

    if (error) {
        throw new NovellowError(friendlyAuthError(error), error);
    }

}


export async function updatePassword(password) {

    const { error } =
        await supabase.auth.updateUser({ password });

    if (error) {
        throw new NovellowError(friendlyAuthError(error), error);
    }

}


export function onPasswordRecovery(callback) {

    supabase.auth.onAuthStateChange((event) => {

        if (event === "PASSWORD_RECOVERY") {
            callback();
        }

    });

}


/* =========================================================
   SIGN OUT
========================================================= */

export async function signOut() {

    signingOut = true;

    const { error } =
        await supabase.auth.signOut();

    if (error) {
        console.error(error);
    }

    window.location.replace("index.html");

}


/* =========================================================
   SIGN-IN LOG
   One row per successful sign-in. A failure here never
   blocks entering the library.
========================================================= */

/*
    Arriving through a confirmation or reset email signs the
    reader in without the form, so it is logged separately.
*/

export function recordEmailLinkSignIn() {
    return recordSignIn("email_link");
}


async function recordSignIn(method) {

    try {

        const { data } =
            await supabase.auth.getUser();

        if (!data?.user) {
            return;
        }

        const { error } =
            await supabase
                .from("sign_in_events")
                .insert({
                    user_id: data.user.id,
                    method,
                    user_agent: navigator.userAgent.slice(0, 400)
                });

        if (error) {
            throw error;
        }

    }

    catch (error) {
        console.error("Could not record this sign-in.", error);
    }

}
