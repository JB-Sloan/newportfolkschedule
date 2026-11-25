"use server";

import { revalidatePath } from "next/cache";
import { isUuid } from "@/lib/bingo";
import { indexArtists, MAX_BILLED_NAME, MAX_LINEUP_LINES, parseLineup, suggestArtists } from "@/lib/lineup";
import { slugify } from "@/lib/slug";
import { loadArtists } from "@/lib/supabase/artists";
import { requireModerator } from "@/lib/supabase/moderator";
import { createClient } from "@/lib/supabase/server";

type Fail = { ok: false; error: string };
export type WaveResult = { ok: true } | Fail;
export type PreviewRow = {
  name: string;
  match: { id: string; name: string } | null;
  suggestions: { id: string; name: string }[];
  alreadyAnnounced: boolean;
};
export type WaveDetails = { announcedAt: string; sourceUrl: string; notes: string };

const fail = (error: string): Fail => ({ ok: false, error });

/** Moderator-gated client. RLS enforces the same rule on every write (0023). */
async function moderatorClient(): Promise<{ supabase: ReturnType<typeof createClient> } | { error: string }> {
  const supabase = createClient();
  const gate = await requireModerator(supabase);
  return "error" in gate ? { error: gate.error } : { supabase };
}

type DetailsRow = { announced_at: string; source_url: string | null; notes: string | null };

function checkDetails(d: WaveDetails, editionYear: number): { row: DetailsRow } | { error: string } {
  const at = new Date(d.announcedAt);
  if (Number.isNaN(at.getTime())) return { error: "Enter the date and time of the announcement." };
  if (at.getTime() > Date.now() + 60_000) return { error: "The announcement time can't be in the future." };
  if (at.getUTCFullYear() < editionYear - 1) return { error: `That date is too early for the ${editionYear} festival.` };
  const url = String(d.sourceUrl ?? "").trim();
  if (url && (url.length > 500 || !/^https?:\/\/\S+\.\S+$/i.test(url))) return { error: "That source link isn't a valid URL." };
  return {
    row: {
      announced_at: at.toISOString(),
      source_url: url || null,
      notes: String(d.notes ?? "").trim().slice(0, 1000) || null
    }
  };
}

function done(): WaveResult {
  revalidatePath("/moderate/waves");
  revalidatePath("/bingo");
  return { ok: true };
}

/** Record a wave. The first one closes bingo, so artists can follow later. */
export async function recordWave(input: { editionId: string } & WaveDetails): Promise<WaveResult> {
  const mod = await moderatorClient();
  if ("error" in mod) return fail(mod.error);
  const { supabase } = mod;
  if (!isUuid(input.editionId)) return fail("Unknown edition.");

  const { data: edition } = await supabase.from("editions").select("id, year").eq("id", input.editionId).maybeSingle();
  if (!edition) return fail("Unknown edition.");
  const checked = checkDetails(input, edition.year);
  if ("error" in checked) return fail(checked.error);

  const { data: last, error: lastError } = await supabase
    .from("announcement_waves")
    .select("wave_number")
    .eq("edition_id", edition.id)
    .order("wave_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lastError) return fail(lastError.message);

  const { error } = await supabase
    .from("announcement_waves")
    .insert({ edition_id: edition.id, wave_number: (last?.wave_number ?? 0) + 1, ...checked.row });
  if (error) return fail(error.message);
  return done();
}

export async function updateWave(input: { waveId: string } & WaveDetails): Promise<WaveResult> {
  const mod = await moderatorClient();
  if ("error" in mod) return fail(mod.error);
  const { supabase } = mod;
  if (!isUuid(input.waveId)) return fail("Unknown wave.");

  const { data: wave } = await supabase
    .from("announcement_waves")
    .select("id, editions(year)")
    .eq("id", input.waveId)
    .maybeSingle()
    .returns<{ id: string; editions: { year: number } | null } | null>();
  if (!wave?.editions) return fail("That wave no longer exists.");
  const checked = checkDetails(input, wave.editions.year);
  if ("error" in checked) return fail(checked.error);

  const { error } = await supabase.from("announcement_waves").update(checked.row).eq("id", wave.id);
  if (error) return fail(error.message);
  const { error: annError } = await supabase
    .from("lineup_announcements")
    .update({ announced_at: checked.row.announced_at })
    .eq("wave_id", wave.id);
  if (annError) return fail(annError.message);
  return done();
}

/** Remove a wave and its artists. Deleting the only wave reopens bingo. */
export async function deleteWave(input: { waveId: string }): Promise<WaveResult> {
  const mod = await moderatorClient();
  if ("error" in mod) return fail(mod.error);
  const { supabase } = mod;
  if (!isUuid(input.waveId)) return fail("Unknown wave.");

  // The foreign key only nulls wave_id, so clear the wave's artists first.
  const { error: annError } = await supabase.from("lineup_announcements").delete().eq("wave_id", input.waveId);
  if (annError) return fail(annError.message);
  const { error } = await supabase.from("announcement_waves").delete().eq("id", input.waveId);
  if (error) return fail(error.message);
  return done();
}

/** Match pasted names to the archive without writing anything. */
export async function previewLineup(input: {
  waveId: string;
  text: string;
}): Promise<{ ok: true; rows: PreviewRow[] } | Fail> {
  const mod = await moderatorClient();
  if ("error" in mod) return fail(mod.error);
  const { supabase } = mod;
  if (!isUuid(input.waveId)) return fail("Unknown wave.");

  const names = parseLineup(String(input.text ?? ""));
  if (!names.length) return fail("Paste at least one artist, one per line.");
  if (names.length > MAX_LINEUP_LINES) return fail(`Add up to ${MAX_LINEUP_LINES} artists at a time.`);

  const { data: wave } = await supabase.from("announcement_waves").select("edition_id").eq("id", input.waveId).maybeSingle();
  if (!wave) return fail("That wave no longer exists.");
  const [loaded, { data: announced, error }] = await Promise.all([
    loadArtists(supabase),
    supabase.from("lineup_announcements").select("artist_id").eq("edition_id", wave.edition_id)
  ]);
  if ("error" in loaded) return fail(loaded.error);
  if (error) return fail(error.message);

  const index = indexArtists(loaded.artists);
  const have = new Set((announced ?? []).map((a) => a.artist_id));
  const ref = (a: { id: string; name: string }) => ({ id: a.id, name: a.name });
  return {
    ok: true,
    rows: names.map((name) => {
      const match = index.get(slugify(name));
      return {
        name,
        match: match ? ref(match) : null,
        suggestions: match ? [] : suggestArtists(name, loaded.artists).map(ref),
        alreadyAnnounced: Boolean(match && have.has(match.id))
      };
    })
  };
}

/** Add reviewed names to a wave. `artistId: null` means create a new artist. */
export async function addArtists(input: {
  waveId: string;
  entries: { name: string; artistId: string | null }[];
}): Promise<{ ok: true; added: number; skipped: number } | Fail> {
  const mod = await moderatorClient();
  if ("error" in mod) return fail(mod.error);
  const { supabase } = mod;
  if (!isUuid(input.waveId)) return fail("Unknown wave.");
  if (!Array.isArray(input.entries) || !input.entries.length) return fail("There's nothing to add.");
  if (input.entries.length > MAX_LINEUP_LINES) return fail(`Add up to ${MAX_LINEUP_LINES} artists at a time.`);

  const { data: wave } = await supabase
    .from("announcement_waves")
    .select("id, edition_id, announced_at")
    .eq("id", input.waveId)
    .maybeSingle();
  if (!wave) return fail("That wave no longer exists.");

  const loaded = await loadArtists(supabase);
  if ("error" in loaded) return fail(loaded.error);
  const index = indexArtists(loaded.artists);
  const known = new Set(loaded.artists.map((a) => a.id));

  const billed = new Map<string, string>(); // artist id -> name as billed
  const create = new Map<string, string>(); // slug -> name
  for (const e of input.entries) {
    const name = String(e.name ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_BILLED_NAME).trim();
    const slug = slugify(name);
    if (!slug) return fail(`“${name}” isn't a usable artist name.`);
    const id = e.artistId ?? index.get(slug)?.id;
    if (!id) {
      create.set(slug, create.get(slug) ?? name);
      continue;
    }
    if (!known.has(id)) return fail(`The artist matched to “${name}” no longer exists. Check the names again.`);
    if (!billed.has(id)) billed.set(id, name);
  }

  if (create.size) {
    const { data: created, error } = await supabase
      .from("artists")
      .insert([...create].map(([slug, name]) => ({ slug, name, artist_type: "group" as const })))
      .select("id, name");
    if (error) return fail(error.message);
    for (const a of created ?? []) billed.set(a.id, a.name);
  }

  // An artist is announced once per edition; repeats from an earlier wave are skipped.
  const { data: inserted, error } = await supabase
    .from("lineup_announcements")
    .upsert(
      [...billed].map(([artist_id, billed_name]) => ({
        edition_id: wave.edition_id,
        wave_id: wave.id,
        artist_id,
        billed_name,
        announced_at: wave.announced_at
      })),
      { onConflict: "edition_id,artist_id", ignoreDuplicates: true }
    )
    .select("id");
  if (error) return fail(error.message);

  done();
  const added = inserted?.length ?? 0;
  return { ok: true, added, skipped: input.entries.length - added };
}

export async function removeAnnouncement(input: { announcementId: string }): Promise<WaveResult> {
  const mod = await moderatorClient();
  if ("error" in mod) return fail(mod.error);
  if (!isUuid(input.announcementId)) return fail("Unknown artist.");
  const { error } = await mod.supabase.from("lineup_announcements").delete().eq("id", input.announcementId);
  if (error) return fail(error.message);
  return done();
}
