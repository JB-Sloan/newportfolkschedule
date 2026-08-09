"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";
import { notifyAdmin, setUrl, MODERATE_URL } from "@/lib/notify";
import type { Database } from "@/lib/supabase/database.types";

type SourceKind = Database["public"]["Enums"]["source_kind"];

/**
 * Simple per-user rate limit: how many rows the user has created in `table`
 * in the last minute. Cheap COUNT; the abuse surface is row/artist creation,
 * so votes (PK-limited to one per performance) aren't gated here.
 */
async function submittingTooFast(
  supabase: Client,
  table: "setlist_entries" | "performances",
  userId: string,
  maxPerMinute: number
): Promise<boolean> {
  const since = new Date(Date.now() - 60_000).toISOString();
  const { count } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq("submitted_by", userId)
    .gte("created_at", since);
  return (count ?? 0) >= maxPerMinute;
}

export type AddSongResult = { ok: true } | { ok: false; error: string };

type Client = ReturnType<typeof createClient>;

/** Basic http(s) URL check for user-supplied source links. */
function isSourceUrl(url: string): boolean {
  return /^https?:\/\/.+\..+/i.test(url.trim()) && url.trim().length <= 500;
}

/** Classify a source URL into a source_kind for the sources table. */
function sourceKindFromUrl(url: string): SourceKind {
  const u = url.toLowerCase();
  if (u.includes("inforoo.com")) return "inforoo";
  if (u.includes("setlist.fm")) return "setlistfm";
  if (u.includes("reddit.com")) return "reddit";
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.includes("instagram.com")) return "instagram";
  if (u.includes("tiktok.com")) return "tiktok";
  if (u.includes("wikipedia.org")) return "wikipedia";
  if (u.includes("archive.org")) return "archive_org";
  if (u.includes("nugs.net")) return "nugs";
  return "other";
}

/**
 * Best-effort: attach a source URL as a citation on an entity. Resolves or
 * creates the source, then inserts a citation at the default 'medium'
 * confidence — deliberately NOT 'high', so a user-supplied link can't trigger
 * the has_hard_evidence auto-confirm. The primary submission has already
 * succeeded by the time this runs, so failures here are non-fatal.
 */
async function attachCitation(
  supabase: Client,
  opts: { url: string; entityTable: string; entityId: string; userId: string }
): Promise<void> {
  const url = opts.url.trim();
  if (!isSourceUrl(url)) return;

  let sourceId: string | undefined;
  const { data: existing } = await supabase.from("sources").select("id").eq("url", url).maybeSingle();
  if (existing) {
    sourceId = existing.id;
  } else {
    const { data: created } = await supabase
      .from("sources")
      .insert({ kind: sourceKindFromUrl(url), url, added_by: opts.userId })
      .select("id")
      .single();
    sourceId = created?.id;
  }
  if (!sourceId) return;

  await supabase.from("citations").insert({
    source_id: sourceId,
    entity_table: opts.entityTable,
    entity_id: opts.entityId,
    added_by: opts.userId
    // confidence defaults to 'medium'
  });
}

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
  sourceUrl?: string;
}): Promise<AddSongResult> {
  const title = input.title.trim();
  if (!title) return { ok: false, error: "Enter a song title." };
  if (title.length > 200) return { ok: false, error: "That title is too long." };
  const sourceUrl = (input.sourceUrl ?? "").trim();
  if (sourceUrl && !isSourceUrl(sourceUrl)) return { ok: false, error: "That source link isn't a valid URL." };

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in first." };

  if (await submittingTooFast(supabase, "setlist_entries", user.id, 30)) {
    return { ok: false, error: "You're adding songs very quickly — take a breather and try again in a minute." };
  }

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

  const { data: entry, error } = await supabase
    .from("setlist_entries")
    .insert({
      set_id: input.setId,
      position,
      song_id: songId,
      raw_title: title,
      is_cover: input.isCover,
      is_encore: input.isEncore,
      submitted_by: user.id
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  if (sourceUrl) {
    await attachCitation(supabase, { url: sourceUrl, entityTable: "setlist_entries", entityId: entry.id, userId: user.id });
  }

  await notifyAdmin(`Setlist: “${title}” added`, [
    `${user.email ?? "A signed-in user"} added a song to a setlist.`,
    ``,
    `Song: ${title}${input.isCover ? " (cover)" : ""}`,
    `Set: ${setUrl(input.year, input.setSlug)}`,
    sourceUrl ? `Source: ${sourceUrl}` : ``
  ]);

  revalidatePath(`/archive/${input.year}/${input.setSlug}`);
  return { ok: true };
}

/**
 * Confirm (+1), dispute (-1), or retract (0) a vote on a guest performance.
 * A DB trigger (recompute_performance_status) recounts confirm/dispute and
 * auto-promotes status: a trusted/moderator/admin confirm, a high-confidence
 * citation, or net +3 community confirms flips it to 'confirmed'; net negative
 * → 'disputed'. RLS lets a user write only their own vote row.
 */
export async function voteOnPerformance(input: {
  performanceId: string;
  vote: 1 | -1 | 0;
  year: number;
  setSlug: string;
}): Promise<AddSongResult> {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in first." };

  if (input.vote === 0) {
    const { error } = await supabase
      .from("performance_votes")
      .delete()
      .eq("performance_id", input.performanceId)
      .eq("user_id", user.id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase
      .from("performance_votes")
      .upsert(
        { performance_id: input.performanceId, user_id: user.id, vote: input.vote },
        { onConflict: "performance_id,user_id" }
      );
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath(`/archive/${input.year}/${input.setSlug}`);
  return { ok: true };
}

const REPORT_REASONS = ["spam", "harassment", "misinformation", "copyright", "off_topic", "scam", "other"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

/**
 * File a report on a piece of content (currently a guest performance). Lands
 * as status 'open' in the moderator queue. RLS requires reporter_id =
 * auth.uid(); one open report per user per entity (dupes are folded).
 */
export async function reportContent(input: {
  entityTable: "performances";
  entityId: string;
  reason: ReportReason;
  details: string;
  year: number;
  setSlug: string;
}): Promise<AddSongResult> {
  if (!REPORT_REASONS.includes(input.reason)) return { ok: false, error: "Pick a reason." };
  const details = input.details.trim().slice(0, 1000);

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in first." };

  // Fold duplicate open reports from the same user on the same entity.
  const { data: existing } = await supabase
    .from("reports")
    .select("id")
    .eq("entity_table", input.entityTable)
    .eq("entity_id", input.entityId)
    .eq("reporter_id", user.id)
    .eq("status", "open")
    .maybeSingle();
  if (existing) return { ok: true };

  const { error } = await supabase.from("reports").insert({
    entity_table: input.entityTable,
    entity_id: input.entityId,
    reason: input.reason,
    details: details || null,
    reporter_id: user.id
  });
  if (error) return { ok: false, error: error.message };

  await notifyAdmin(`Report: ${input.reason.replace("_", " ")}`, [
    `${user.email ?? "A signed-in user"} reported a ${input.entityTable.replace(/s$/, "")}.`,
    details ? `Details: ${details}` : ``,
    ``,
    `Set: ${setUrl(input.year, input.setSlug)}`,
    `Review: ${MODERATE_URL}`
  ]);

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
  sourceUrl?: string;
}): Promise<AddSongResult> {
  const name = input.guestName.trim();
  if (!name) return { ok: false, error: "Enter the guest's name." };
  if (name.length > 120) return { ok: false, error: "That name is too long." };
  if (!GUEST_ROLES.includes(input.role)) return { ok: false, error: "Pick a valid role." };
  const sourceUrl = (input.sourceUrl ?? "").trim();
  if (sourceUrl && !isSourceUrl(sourceUrl)) return { ok: false, error: "That source link isn't a valid URL." };

  const slug = slugify(name);
  if (!slug) return { ok: false, error: "Enter a valid name." };

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in first." };

  if (await submittingTooFast(supabase, "performances", user.id, 15)) {
    return { ok: false, error: "You're submitting sit-ins very quickly — take a breather and try again in a minute." };
  }

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

  const { data: perf, error } = await supabase
    .from("performances")
    .insert({
      set_id: input.setId,
      artist_id: artistId,
      role: input.role,
      instruments,
      status: "pending",
      submitted_by: user.id
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  if (sourceUrl) {
    await attachCitation(supabase, { url: sourceUrl, entityTable: "performances", entityId: perf.id, userId: user.id });
  }

  await notifyAdmin(`Sit-in submitted: ${name}`, [
    `${user.email ?? "A signed-in user"} submitted a guest appearance (pending review).`,
    ``,
    `Guest: ${name} — ${input.role.replace("_", " ")}${instruments.length ? ` (${instruments.join(", ")})` : ""}`,
    `Set: ${setUrl(input.year, input.setSlug)}`,
    sourceUrl ? `Source: ${sourceUrl}` : ``,
    ``,
    `Review the queue: ${MODERATE_URL}`
  ]);

  revalidatePath(`/archive/${input.year}/${input.setSlug}`);
  return { ok: true };
}
