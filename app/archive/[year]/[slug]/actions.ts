"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";

export type AddSongResult = { ok: true } | { ok: false; error: string };

/**
 * Add one song to a set's setlist. Resolves the song by slug (creating it if
 * new), appends the entry at the next position, and attributes it to the
 * signed-in user. RLS requires an active user for both inserts; reads are
 * public, so the entry is visible immediately (moderation is post-hoc via
 * revisions/reports).
 */
export async function addSong(input: {
  setId: string;
  year: number;
  setSlug: string;
  title: string;
  isCover: boolean;
  isEncore: boolean;
}): Promise<AddSongResult> {
  const title = input.title.trim();
  if (!title) return { ok: false, error: "Enter a song title." };
  if (title.length > 200) return { ok: false, error: "That title is too long." };

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in first." };

  // Resolve or create the song row.
  const slug = slugify(title);
  let songId: string | null = null;
  if (slug) {
    const { data: existing } = await supabase.from("songs").select("id").eq("slug", slug).maybeSingle();
    if (existing) {
      songId = existing.id;
    } else {
      const { data: created, error: songErr } = await supabase
        .from("songs")
        .insert({ title, slug })
        .select("id")
        .single();
      if (songErr) return { ok: false, error: songErr.message };
      songId = created.id;
    }
  }

  // Append after the current last position (positions are unique per set).
  const { data: last } = await supabase
    .from("setlist_entries")
    .select("position")
    .eq("set_id", input.setId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const position = (last?.position ?? 0) + 1;

  const { error } = await supabase.from("setlist_entries").insert({
    set_id: input.setId,
    position,
    song_id: songId,
    raw_title: title,
    is_cover: input.isCover,
    is_encore: input.isEncore,
    submitted_by: user.id
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/archive/${input.year}/${input.setSlug}`);
  return { ok: true };
}

const GUEST_ROLES = ["sit_in", "guest_vocal", "surprise_guest"] as const;
export type GuestRole = (typeof GUEST_ROLES)[number];

/**
 * Submit a sit-in / guest appearance on a set. Resolves the guest by slug
 * (creating a `person` artist if new), then inserts a `performance` with the
 * chosen guest role. Submissions land as status 'pending' — v_sit_in_graph
 * only shows 'confirmed' edges, so the graph stays clean until a moderator
 * confirms (E2-12). RLS requires submitted_by = auth.uid().
 */
export async function addSitIn(input: {
  setId: string;
  year: number;
  setSlug: string;
  guestName: string;
  role: GuestRole;
  instruments: string;
}): Promise<AddSongResult> {
  const name = input.guestName.trim();
  if (!name) return { ok: false, error: "Enter the guest's name." };
  if (name.length > 120) return { ok: false, error: "That name is too long." };
  if (!GUEST_ROLES.includes(input.role)) return { ok: false, error: "Pick a valid role." };

  const slug = slugify(name);
  if (!slug) return { ok: false, error: "Enter a valid name." };

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in first." };

  // Resolve or create the guest artist.
  let artistId: string;
  const { data: existing } = await supabase.from("artists").select("id").eq("slug", slug).maybeSingle();
  if (existing) {
    artistId = existing.id;
  } else {
    const { data: created, error: artistErr } = await supabase
      .from("artists")
      .insert({ name, slug, artist_type: "person" })
      .select("id")
      .single();
    if (artistErr) return { ok: false, error: artistErr.message };
    artistId = created.id;
  }

  // Don't duplicate an identical guest+role already on this set.
  const { data: dup } = await supabase
    .from("performances")
    .select("id")
    .eq("set_id", input.setId)
    .eq("artist_id", artistId)
    .eq("role", input.role)
    .maybeSingle();
  if (dup) return { ok: false, error: "That guest is already listed in this role." };

  const instruments = input.instruments
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8);

  const { error } = await supabase.from("performances").insert({
    set_id: input.setId,
    artist_id: artistId,
    role: input.role,
    instruments,
    status: "pending",
    submitted_by: user.id
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/archive/${input.year}/${input.setSlug}`);
  return { ok: true };
}
