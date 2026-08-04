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
