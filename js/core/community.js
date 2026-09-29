/* =========================================================
   NOVELLOW
   COMMUNITY DATA

   Every query for friends, shared shelves, book clubs and
   buddy reads. What each reader may see is decided by the
   rules in sql/community.sql, not here: a friend's journals
   can't be fetched at all, and a buddy-read comment about a
   chapter you haven't reached never leaves the database.
========================================================= */

import { supabase } from "./supabase.js?v=__VERSION__";
import { currentUserId } from "./store.js?v=__VERSION__";


const PROFILE_FIELDS =
    "id, display_name, username, bio, library_visibility";


// Friends can visit a library shared with friends or with
// everyone.
export function sharesLibrary(person) {
    return ["friends", "public"].includes(person?.library_visibility);
}


// Open libraries anyone can visit (sql/public.sql).
export async function loadPublicLibraries(search = null) {

    const { data, error } =
        await supabase.rpc("public_libraries", { p_search: search || null });

    // Before public.sql has been run there are none.
    if (error) {
        return [];
    }

    return data;

}


function unwrap({ data, error }) {

    if (error) {
        throw error;
    }

    return data;

}


async function profilesById(ids) {

    const unique =
        [...new Set(ids)].filter(Boolean);

    if (!unique.length) {
        return new Map();
    }

    const rows =
        unwrap(
            await supabase
                .from("profiles")
                .select(PROFILE_FIELDS)
                .in("id", unique)
        );

    return new Map(rows.map((row) => [row.id, row]));

}


/* =========================================================
   FRIENDS
========================================================= */

/*
    { friends, incoming, outgoing }, each a list of
    { id (friendship), since, person }.
    Friends who share their shelves come with what they're
    reading right now.
*/

export async function loadFriends() {

    const me =
        currentUserId();

    const rows =
        unwrap(
            await supabase
                .from("friendships")
                .select("*")
                .order("created_at", { ascending: false })
        );

    const people =
        await profilesById(rows.map((row) => row.requester_id === me ? row.addressee_id : row.requester_id));

    const entries =
        rows.map((row) => {

            const otherId =
                row.requester_id === me ? row.addressee_id : row.requester_id;

            return {
                id: row.id,
                status: row.status,
                sentByMe: row.requester_id === me,
                since: row.responded_at || row.created_at,
                person: people.get(otherId) || { id: otherId, display_name: "A reader" }
            };

        });

    const friends =
        entries
            .filter((entry) => entry.status === "accepted")
            .sort((a, b) => a.person.display_name.localeCompare(b.person.display_name));

    const sharing =
        friends
            .filter((entry) => sharesLibrary(entry.person))
            .map((entry) => entry.person.id);

    if (sharing.length) {

        const reading =
            unwrap(
                await supabase
                    .from("books")
                    .select("id, user_id, title, author, spine, current_page, page_count, cover_path")
                    .in("user_id", sharing)
                    .eq("status", "reading")
                    .order("updated_at", { ascending: false })
            );

        friends.forEach((entry) => {
            entry.reading = reading.filter((book) => book.user_id === entry.person.id);
        });

    }

    return {
        friends,
        incoming: entries.filter((entry) => entry.status === "pending" && !entry.sentByMe),
        outgoing: entries.filter((entry) => entry.status === "pending" && entry.sentByMe)
    };

}


export async function sendFriendRequest(username) {
    return unwrap(await supabase.rpc("send_friend_request", { p_username: username }));
}


export async function acceptFriendRequest(id) {
    unwrap(await supabase.rpc("accept_friend_request", { p_id: id }));
}


// Cancel, decline or unfriend.
export async function removeFriendship(id) {
    unwrap(await supabase.from("friendships").delete().eq("id", id));
}


/* =========================================================
   A FRIEND'S SHELVES
========================================================= */

/*
    { person, shelves, books } for a friend, or { person }
    alone when they keep their shelves private (the database
    returns nothing else).
*/

export async function loadFriendLibrary(friendId) {

    const person =
        (await profilesById([friendId])).get(friendId) || null;

    if (!person || !sharesLibrary(person)) {
        return { person, shelves: [], books: [] };
    }

    const [shelves, books] =
        await Promise.all([
            supabase
                .from("shelves")
                .select("*")
                .eq("user_id", friendId)
                .order("sort_order")
                .then(unwrap),
            supabase
                .from("books")
                .select("*")
                .eq("user_id", friendId)
                .order("shelf_position")
                .then(unwrap)
        ]);

    return { person, shelves, books };

}


export async function loadFriendReview(bookId) {

    return unwrap(
        await supabase
            .from("reviews")
            .select("body, final_thoughts, would_reread, updated_at")
            .eq("book_id", bookId)
            .maybeSingle()
    );

}


/* =========================================================
   BOOK CLUBS AND BUDDY READS
========================================================= */

/*
    Every group the reader is in or invited to, each with its
    members (and their profiles).
*/

export async function loadGroups() {

    const groups =
        unwrap(
            await supabase
                .from("reading_groups")
                .select("*, group_members(*)")
                .order("updated_at", { ascending: false })
        );

    const people =
        await profilesById(groups.flatMap((group) => group.group_members.map((member) => member.user_id)));

    return groups.map((group) => decorateGroup(group, people));

}


export async function loadGroup(id) {

    const group =
        unwrap(
            await supabase
                .from("reading_groups")
                .select("*, group_members(*)")
                .eq("id", id)
                .maybeSingle()
        );

    if (!group) {
        return null;
    }

    const people =
        await profilesById(group.group_members.map((member) => member.user_id));

    return decorateGroup(group, people);

}


function decorateGroup(group, people) {

    const me =
        currentUserId();

    const members =
        group.group_members
            .map((member) => ({
                ...member,
                person: people.get(member.user_id) || { id: member.user_id, display_name: "A reader" }
            }))
            .sort((a, b) =>
                (a.user_id === group.owner_id ? -1 : b.user_id === group.owner_id ? 1 : 0)
                || (a.status === b.status ? 0 : a.status === "joined" ? -1 : 1)
                || a.person.display_name.localeCompare(b.person.display_name)
            );

    const mine =
        members.find((member) => member.user_id === me) || null;

    delete group.group_members;

    return {
        ...group,
        members,
        mine,
        isOwner: group.owner_id === me,
        invitedBy: mine?.invited_by ? people.get(mine.invited_by) || null : null
    };

}


export async function createGroup({ kind, name, bookTitle, bookAuthor, description, chapterCount, invite }) {

    return unwrap(
        await supabase.rpc("create_reading_group", {
            p_kind: kind,
            p_name: name,
            p_book_title: bookTitle,
            p_book_author: bookAuthor || null,
            p_description: description || null,
            p_chapter_count: kind === "buddy" ? chapterCount : null,
            p_invite: invite
        })
    );

}


export async function updateGroup(id, patch) {
    unwrap(await supabase.from("reading_groups").update(patch).eq("id", id));
}


export async function deleteGroup(id) {
    unwrap(await supabase.from("reading_groups").delete().eq("id", id));
}


export async function inviteToGroup(groupId, friendId) {
    unwrap(await supabase.rpc("invite_to_group", { p_group: groupId, p_friend: friendId }));
}


export async function joinGroup(groupId) {
    unwrap(await supabase.rpc("join_group", { p_group: groupId }));
}


// Leave, decline an invitation, or (owner) remove someone.
export async function removeMember(groupId, userId) {

    unwrap(
        await supabase
            .from("group_members")
            .delete()
            .eq("group_id", groupId)
            .eq("user_id", userId)
    );

}


export async function setMyChapter(groupId, chapter) {
    unwrap(await supabase.rpc("set_my_chapter", { p_group: groupId, p_chapter: chapter }));
}


/*
    The posts this reader may see, oldest first. In a buddy
    read, comments on chapters ahead of the reader are left
    out by the database.
*/

export async function listPosts(groupId) {

    return unwrap(
        await supabase
            .from("group_posts")
            .select("*")
            .eq("group_id", groupId)
            .order("created_at")
    );

}


// Buddy reads: [{ chapter, comments }] still ahead of the reader.
export async function waitingComments(groupId) {
    return unwrap(await supabase.rpc("waiting_comments", { p_group: groupId }));
}


export async function addPost(groupId, body, chapter = null) {

    unwrap(
        await supabase
            .from("group_posts")
            .insert({
                group_id: groupId,
                user_id: currentUserId(),
                chapter,
                body
            })
    );

}


export async function deletePost(id) {
    unwrap(await supabase.from("group_posts").delete().eq("id", id));
}


/*
    How many things are waiting for the reader: friend
    requests and group invitations. Shown on the menu.
*/

export async function countWaiting() {

    const me =
        currentUserId();

    const [requests, invitations] =
        await Promise.all([
            supabase
                .from("friendships")
                .select("id", { count: "exact", head: true })
                .eq("addressee_id", me)
                .eq("status", "pending"),
            supabase
                .from("group_members")
                .select("group_id", { count: "exact", head: true })
                .eq("user_id", me)
                .eq("status", "invited")
        ]);

    return (requests.count || 0) + (invitations.count || 0);

}
