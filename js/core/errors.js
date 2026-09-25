/* =========================================================
   NOVELLOW
   FRIENDLY ERRORS

   Turns Supabase / network errors into readable messages.
   Technical details still go to the console.
========================================================= */


const AUTH_MESSAGES = [
    [/invalid login credentials|invalid_credentials/i, "That email and password combination was not recognized."],
    [/email not confirmed|email_not_confirmed/i, "Confirm your email first, then sign in."],
    [/already registered|already been registered|user_already_exists|email_exists/i, "An account already exists for that email. Try signing in instead."],
    [/invalid format|validate email|email_address_invalid|invalid email/i, "Enter a valid email address."],
    [/password should be at least|weak_password|password is too short/i, "Choose a password with at least 8 characters."],
    [/same_password|should be different/i, "Choose a password different from your current one."],
    [/rate limit|over_email_send_rate_limit|too many requests|over_request_rate_limit/i, "Too many attempts for now. Wait a minute, then try again."],
    [/signups not allowed|signup_disabled/i, "New accounts are not being accepted right now."],
    [/otp_expired|token has expired|link is invalid|expired/i, "That link has expired. Request a new one and try again."]
];


const DATA_MESSAGES = [
    [/failed to fetch|networkerror|network request failed|load failed/i, "Novellow couldn't reach the library. Check your connection and try again."],
    [/jwt expired|invalid jwt|not authenticated|session/i, "Your session has ended. Please sign in again."],
    [/row-level security|violates row-level|permission denied/i, "That belongs to a different library, so it can't be changed here."],
    [/payload too large|exceeded the maximum allowed size|entity too large/i, "That image is too large. Choose one under 5 MB."],
    [/mime type|invalid_mime_type|not supported/i, "Covers can be JPEG, PNG or WebP images."]
];


function rawMessage(error) {

    if (!error) {
        return "";
    }

    if (typeof error === "string") {
        return error;
    }

    return [
        error.message,
        error.error_description,
        error.code,
        error.error,
        error.details
    ]
        .filter(Boolean)
        .join(" ");

}


export function friendlyAuthError(error) {

    const message =
        rawMessage(error);

    for (const [pattern, friendly] of [...AUTH_MESSAGES, ...DATA_MESSAGES]) {

        if (pattern.test(message)) {
            return friendly;
        }

    }

    return "Something went wrong while opening your library. Please try again.";

}


export function friendlyDataError(error, fallback = "That didn't save. Please try again.") {

    const message =
        rawMessage(error);

    // Deleting a shelf that still holds books.
    if (error?.code === "23503" && /shelves|shelf/i.test(message)) {
        return "This shelf still holds books. Move them to another shelf first.";
    }

    if (error?.code === "23514") {
        return "Some of those details aren't valid. Check the highlighted fields and try again.";
    }

    for (const [pattern, friendly] of DATA_MESSAGES) {

        if (pattern.test(message)) {
            return friendly;
        }

    }

    return error?.userMessage || fallback;

}


/*
    An error whose message is already written for readers.
*/

export class NovellowError extends Error {

    constructor(userMessage, cause) {

        super(userMessage);

        this.userMessage = userMessage;
        this.cause = cause;

    }

}
