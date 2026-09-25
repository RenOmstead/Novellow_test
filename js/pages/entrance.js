/* =========================================================
   NOVELLOW
   ENTRANCE PAGE (index.html)

   Sign in, create an account, reset a password, and follow
   email confirmation / reset links.
========================================================= */

import { isConfigured } from "../core/supabase.js?v=__VERSION__";

import {
    getSession,
    signIn,
    signUp,
    sendPasswordReset,
    updatePassword,
    onPasswordRecovery,
    afterSignInUrl,
    recordEmailLinkSignIn
} from "../core/auth.js?v=__VERSION__";

import { loadSprite } from "../core/art.js?v=__VERSION__";
import { $, $all, seededRandom, queryParam } from "../core/helpers.js?v=__VERSION__";
import { friendlyAuthError } from "../core/errors.js?v=__VERSION__";
import { withBusy } from "../core/ui.js?v=__VERSION__";
import { growIvy } from "../room/ivy.js?v=__VERSION__";


const note = $("#authNote");
const errorLine = $("#authError");
const title = $("#authTitle");
const subtitle = $("#authSubtitle");
const switcher = $("#authSwitch");

const forms = {
    "sign-in": $("#signInForm"),
    "sign-up": $("#signUpForm"),
    forgot: $("#forgotForm"),
    reset: $("#resetForm")
};

const COPY = {
    "sign-in": {
        title: "Welcome Back",
        subtitle: "Enter your library and pick up where you left off."
    },
    "sign-up": {
        title: "Begin Your Library",
        subtitle: "Create your Novellow account and make this library your own."
    },
    forgot: {
        title: "Lost Your Key?",
        subtitle: "Enter your email and we'll send a link to choose a new password."
    },
    reset: {
        title: "A New Key",
        subtitle: "Choose a new password for your library."
    }
};

let recovering = queryParam("reset") === "1";

// Read before Supabase tidies the address bar: did the reader
// arrive through a confirmation / reset email link?
const arrivedByEmailLink =
    /access_token=/.test(window.location.hash);


/* =========================================================
   MESSAGES
========================================================= */

function showNote(message) {

    note.textContent = message;
    note.hidden = !message;

}


function showError(message) {

    errorLine.textContent = message;
    errorLine.hidden = !message;

}


function clearMessages() {

    showNote("");
    showError("");

    $all("[aria-invalid]").forEach((field) => field.removeAttribute("aria-invalid"));

}


function markInvalid(input, message) {

    input.setAttribute("aria-invalid", "true");
    input.focus();

    showError(message);

    return false;

}


/* =========================================================
   MODES
========================================================= */

function setMode(mode, { keepMessages = false } = {}) {

    if (!keepMessages) {
        clearMessages();
    }

    Object.entries(forms).forEach(([name, form]) => {
        form.hidden = name !== mode;
    });

    title.textContent = COPY[mode].title;
    subtitle.textContent = COPY[mode].subtitle;

    // The switch only shows for sign in / create account.
    switcher.hidden = mode === "forgot" || mode === "reset";

    $all(".auth-switch__tab").forEach((tab) => {

        const active =
            tab.dataset.mode === mode;

        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-selected", String(active));
        tab.tabIndex = active ? 0 : -1;

    });

}


document.addEventListener("click", (event) => {

    const trigger =
        event.target.closest("[data-mode]");

    if (trigger) {

        setMode(trigger.dataset.mode);

        forms[trigger.dataset.mode]
            .querySelector("input")
            ?.focus();

    }

});


// Arrow keys move between the two tabs.
switcher.addEventListener("keydown", (event) => {

    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
        return;
    }

    const next =
        forms["sign-in"].hidden ? "sign-in" : "sign-up";

    setMode(next);

    $(`.auth-switch__tab[data-mode="${next}"]`).focus();

});


/* =========================================================
   VALIDATION
========================================================= */

const EMAIL_PATTERN =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


function checkEmail(input) {

    if (!EMAIL_PATTERN.test(input.value.trim())) {
        return markInvalid(input, "Enter a valid email address.");
    }

    return true;

}


function checkNewPassword(password, confirm) {

    if (password.value.length < 8) {
        return markInvalid(password, "Choose a password with at least 8 characters.");
    }

    if (confirm.value !== password.value) {
        return markInvalid(confirm, "Those passwords don't match.");
    }

    return true;

}


/* =========================================================
   SIGN IN
========================================================= */

forms["sign-in"].addEventListener("submit", async (event) => {

    event.preventDefault();

    clearMessages();

    const form = event.currentTarget;
    const { email, password } = form.elements;

    if (!checkEmail(email)) {
        return;
    }

    if (!password.value) {
        markInvalid(password, "Enter your password.");
        return;
    }

    await withBusy(form.querySelector("[type=submit]"), "Opening the library…", async () => {

        try {

            await signIn({
                email: email.value.trim(),
                password: password.value
            });

            window.location.replace(afterSignInUrl());

        }

        catch (error) {

            console.error(error);

            showError(error.userMessage || friendlyAuthError(error));

        }

    });

});


/* =========================================================
   CREATE ACCOUNT
========================================================= */

forms["sign-up"].addEventListener("submit", async (event) => {

    event.preventDefault();

    clearMessages();

    const form = event.currentTarget;

    const {
        displayName,
        email,
        password,
        confirmPassword
    } = form.elements;

    const name =
        displayName.value.trim();

    if (!name) {
        markInvalid(displayName, "Tell us what to call you.");
        return;
    }

    if (!checkEmail(email) || !checkNewPassword(password, confirmPassword)) {
        return;
    }

    await withBusy(form.querySelector("[type=submit]"), "Building your shelves…", async () => {

        try {

            const result =
                await signUp({
                    displayName: name,
                    email: email.value.trim(),
                    password: password.value
                });

            if (result.status === "signed_in") {

                window.location.replace("dashboard.html");

                return;

            }

            const address =
                email.value.trim();

            form.reset();

            setMode("sign-in", { keepMessages: true });

            forms["sign-in"].elements.email.value = address;

            forms["sign-in"].elements.password.focus();

            showNote("Your account was created. Check your email to confirm it, then sign in.");

        }

        catch (error) {

            console.error(error);

            showError(error.userMessage || friendlyAuthError(error));

        }

    });

});


/* =========================================================
   FORGOT PASSWORD
========================================================= */

forms.forgot.addEventListener("submit", async (event) => {

    event.preventDefault();

    clearMessages();

    const form = event.currentTarget;

    if (!checkEmail(form.elements.email)) {
        return;
    }

    await withBusy(form.querySelector("[type=submit]"), "Sending…", async () => {

        try {

            await sendPasswordReset(form.elements.email.value.trim());

            showNote("If an account exists for that email, a reset link is on its way.");

        }

        catch (error) {

            console.error(error);

            showError(error.userMessage || friendlyAuthError(error));

        }

    });

});


/* =========================================================
   CHOOSE A NEW PASSWORD
========================================================= */

forms.reset.addEventListener("submit", async (event) => {

    event.preventDefault();

    clearMessages();

    const form = event.currentTarget;

    const { password, confirmPassword } = form.elements;

    if (!checkNewPassword(password, confirmPassword)) {
        return;
    }

    await withBusy(form.querySelector("[type=submit]"), "Saving…", async () => {

        try {

            await updatePassword(password.value);

            recovering = false;

            showNote("Your password was changed. Opening your library…");

            window.setTimeout(() => window.location.replace("dashboard.html"), 900);

        }

        catch (error) {

            console.error(error);

            showError(error.userMessage || friendlyAuthError(error));

        }

    });

});


/* =========================================================
   DECORATION
========================================================= */

const SPINE_COLORS = [
    ["#6e4258", "#e2b76c"],
    ["#34503f", "#d8b27a"],
    ["#a1493f", "#f0cf8a"],
    ["#2f3552", "#e2b76c"],
    ["#c47f82", "#3b2a2e"],
    ["#5f7d45", "#f3ddb2"],
    ["#6a5486", "#f0cf8a"],
    ["#b0654e", "#f3ddb2"],
    ["#e6d2ac", "#6e4029"]
];


function fillShelves() {

    $all(".entrance-shelf").forEach((shelf) => {

        const random =
            seededRandom(shelf.dataset.seed);

        const count =
            6 + Math.floor(random() * 3);

        for (let index = 0; index < count; index += 1) {

            const spine =
                document.createElement("span");

            const [color, accent] =
                SPINE_COLORS[Math.floor(random() * SPINE_COLORS.length)];

            spine.className = "entrance-spine";

            spine.style.setProperty("--c", color);
            spine.style.setProperty("--a", accent);
            spine.style.setProperty("--w", `${14 + Math.round(random() * 10)}px`);
            spine.style.setProperty("--h", `${68 + Math.round(random() * 24)}%`);

            shelf.appendChild(spine);

        }

    });

}


/* =========================================================
   START
========================================================= */

async function start() {

    await loadSprite();

    fillShelves();
    growIvy();

    if (!isConfigured) {

        showError("Novellow isn't connected to its library yet. Add the Supabase details to js/config.js.");

        return;

    }

    // Errors sent back by Supabase in a link (for example an expired one).
    const hashParams =
        new URLSearchParams(window.location.hash.slice(1));

    const linkError =
        hashParams.get("error_description") || queryParam("error_description");

    if (linkError) {
        showError(friendlyAuthError(linkError));
    }

    if (queryParam("expired") === "1") {
        showNote("Your session ended. Sign in again to continue.");
    }

    onPasswordRecovery(() => {

        recovering = true;

        setMode("reset");

    });

    if (recovering) {
        setMode("reset");
    }

    try {

        const session =
            await getSession();

        if (session && arrivedByEmailLink) {
            await recordEmailLinkSignIn();
        }

        if (session && !recovering) {

            if (queryParam("confirmed") === "1") {
                showNote("Your email is confirmed. Opening your library…");
            }

            window.setTimeout(
                () => window.location.replace(afterSignInUrl()),
                queryParam("confirmed") === "1" ? 900 : 0
            );

        }

        else if (!session && recovering) {

            setMode("forgot");

            showError("That reset link has expired. Request a new one below.");

        }

    }

    catch (error) {

        console.error(error);

        showError(friendlyAuthError(error));

    }

}


start();
