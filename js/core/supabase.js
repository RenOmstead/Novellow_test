/* =========================================================
   NOVELLOW
   SUPABASE CLIENT

   Creates the single Supabase client every module shares.
========================================================= */

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.1/+esm";

import {
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    SITE_LABEL
} from "../config.js?v=__VERSION__";


// A test copy wears a ribbon (css/base.css) so it is never
// mistaken for the real library.
if (SITE_LABEL) {
    document.documentElement.dataset.siteLabel = SITE_LABEL;
}


/*
    Each Supabase project keeps its sign-in under its own name,
    so the real site and a test copy on the same address never
    overwrite each other's session.
*/

const projectRef =
    (SUPABASE_URL.match(/^https:\/\/([a-z0-9]+)\./) || [])[1] || "local";


export const isConfigured =
    /^https:\/\/|^http:\/\/localhost/.test(SUPABASE_URL) &&
    SUPABASE_PUBLISHABLE_KEY.length > 40;


export const supabase =
    createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,

                // Implicit flow lets a confirmation link work even
                // when it is opened on a different device.
                flowType: "implicit",

                storageKey: `novellow-auth-${projectRef}`
            }
        }
    );
