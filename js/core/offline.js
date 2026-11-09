/* =========================================================
   NOVELLOW
   TURNING ON THE OFFLINE HELPER

   Imported once by every page's script. Registers sw.js,
   which shows a friendly page instead of the browser's error
   when there's no internet, and keeps Novellow's own files so
   it opens quickly. See sw.js for exactly what it does.

   Also remembers when Novellow was opened by the app from the
   App Store or Google Play: those apps open it with ?app=ios
   or ?app=android (docs/APP-STORES.md). It's kept for this
   visit only, so the same browser opening the website later
   isn't mistaken for the app.
========================================================= */

const APP_KEY =
    "novellow-app";


export function storeApp() {

    try {

        const fromLink =
            new URLSearchParams(window.location.search).get("app");

        if (fromLink === "ios" || fromLink === "android") {
            sessionStorage.setItem(APP_KEY, fromLink);
        }

        return sessionStorage.getItem(APP_KEY);

    }

    catch {
        return null;
    }

}


// Opened as an app: from the home screen, or the store app.
export function openedAsApp() {

    return Boolean(storeApp())
        || window.matchMedia?.("(display-mode: standalone)").matches
        || navigator.standalone === true;

}


function register() {

    if (!("serviceWorker" in navigator) || !window.isSecureContext) {
        return;
    }

    // After the page has loaded, so it never slows the room down.
    const start = () => {
        navigator.serviceWorker
            .register("sw.js", { scope: "./" })
            .catch(() => {});
    };

    if (document.readyState === "complete") {
        start();
    }

    else {
        window.addEventListener("load", start, { once: true });
    }

}


storeApp();
register();
