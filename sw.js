/* =========================================================
   NOVELLOW
   OFFLINE HELPER (service worker)

   Runs in the background once a page has registered it
   (js/core/offline.js). It does two small things:

     * Pages always come from the network, so they're never
       stale. If the network isn't there, offline.html is
       shown instead of the browser's error page.

     * Novellow's own CSS, JavaScript, pictures and sounds are
       kept after their first load. Each release stamps a new
       version into their addresses (?v=...), so a kept copy
       is always the right one, and a new release fetches
       fresh copies and clears out the old ones.

   It never touches requests to other sites: the database and
   sign-in (Supabase), book search, covers and fonts all go
   straight to the network as if it weren't here. A reader's
   library is never stored by it.
========================================================= */

const VERSION =
    "__VERSION__";

// Before the build stamps a version in (working on the site
// locally), keep nothing, so every edit shows straight away.
const STAMPED =
    !VERSION.includes("_" + "_VERSION");

const CACHE =
    `novellow-${VERSION}`;

const OFFLINE_PAGE =
    "offline.html";

// What offline.html needs, fetched when the helper installs.
const OFFLINE_FILES = [
    OFFLINE_PAGE,
    "css/tokens.css?v=__VERSION__",
    "css/base.css?v=__VERSION__",
    "css/legal.css?v=__VERSION__",
    "assets/brand/logo-light.png?v=__VERSION__",
    "assets/brand/favicon-48.png?v=__VERSION__"
];


self.addEventListener("install", (event) => {

    event.waitUntil(
        caches.open(CACHE)
            .then((cache) => Promise.all(OFFLINE_FILES.map((file) => keep(cache, file))))
            .then(() => self.skipWaiting())
    );

});


// Hosts like Cloudflare send offline.html on to /offline. A
// page that arrived through a redirect can't be shown in place
// of another page, so a clean copy is kept instead.
async function keep(cache, file) {

    const response =
        await fetch(file, { cache: "reload" });

    if (!response.ok) {
        throw new Error(`${file} couldn't be kept (${response.status})`);
    }

    const clean =
        response.redirected
            ? new Response(await response.blob(), { status: 200, headers: response.headers })
            : response;

    await cache.put(file, clean);

}


self.addEventListener("activate", (event) => {

    event.waitUntil(
        caches.keys()
            .then((names) => Promise.all(
                names
                    .filter((name) => name.startsWith("novellow-") && name !== CACHE)
                    .map((name) => caches.delete(name))
            ))
            .then(() => self.clients.claim())
    );

});


self.addEventListener("fetch", (event) => {

    const request =
        event.request;

    if (request.method !== "GET" || request.headers.has("range")) {
        return;
    }

    const url =
        new URL(request.url);

    // Other sites (Supabase, book search, fonts): not ours.
    if (url.origin !== self.location.origin) {
        return;
    }

    if (request.mode === "navigate") {
        event.respondWith(pageOrOffline(request));
        return;
    }

    if (STAMPED && url.searchParams.get("v") === VERSION) {
        event.respondWith(keptOrFetched(request));
    }

});


async function pageOrOffline(request) {

    try {
        return await fetch(request);
    }

    catch (error) {

        const offline =
            await caches.match(OFFLINE_PAGE);

        if (offline) {
            return offline;
        }

        throw error;

    }

}


async function keptOrFetched(request) {

    const cache =
        await caches.open(CACHE);

    const kept =
        await cache.match(request);

    if (kept) {
        return kept;
    }

    const response =
        await fetch(request);

    if (response.ok && response.type === "basic") {
        cache.put(request, response.clone()).catch(() => {});
    }

    return response;

}
