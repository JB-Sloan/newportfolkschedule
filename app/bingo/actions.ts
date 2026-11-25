"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { countPicks, isUuid, MAX_TITLE, PICKS_NEEDED, sanitizeSlots, type Slots } from "@/lib/bingo";
import { slugify } from "@/lib/slug";

export type BingoInput = { editionId: string; title: string; isPublic: boolean; slots: Slots };
export type BingoResult = { ok: true; cardId: string } | { ok: false; error: string };

function clean(input: BingoInput) {
  return {
    p_edition_id: String(input.editionId),
    p_title: String(input.title ?? "").trim().slice(0, MAX_TITLE),
    p_is_public: input.isPublic !== false
  };
}

/** Save work in progress. Write-ins stay as plain names until the card is locked. */
export async function saveBingoDraft(input: BingoInput): Promise<BingoResult> {
  const args = clean(input);
  if (!isUuid(args.p_edition_id)) return { ok: false, error: "Unknown edition." };

  const supabase = createClient();
  const { data, error } = await supabase.rpc("save_bingo_draft", { ...args, p_draft: sanitizeSlots(input.slots) });
  if (error) return { ok: false, error: error.message };
  return { ok: true, cardId: data };
}

/**
 * Lock the card for good. Write-ins are resolved to an existing artist by slug
 * or created here, not while drafting, so half-typed names never reach the
 * archive. lock_bingo_card() enforces the rules; the checks before artist
 * creation only stop a doomed lock from leaving new artists behind.
 */
export async function lockBingoCard(input: BingoInput): Promise<BingoResult> {
  const args = clean(input);
  if (!isUuid(args.p_edition_id)) return { ok: false, error: "Unknown edition." };
  const slots = sanitizeSlots(input.slots);
  if (countPicks(slots) !== PICKS_NEEDED) return { ok: false, error: "A card needs 24 different artists before you can lock it." };

  const supabase = createClient();

  // Saving first runs the sign-in, open and not-yet-locked checks.
  const saved = await supabase.rpc("save_bingo_draft", { ...args, p_draft: slots });
  if (saved.error) return { ok: false, error: saved.error.message };

  const picks = slots.filter((s): s is NonNullable<typeof s> => s !== null);
  const writeIns = new Map<string, string>(); // slug -> name
  for (const p of picks) {
    if (p.id) continue;
    const slug = slugify(p.name);
    if (!slug) return { ok: false, error: `“${p.name}” isn't a usable artist name.` };
    const clash = writeIns.get(slug);
    if (clash) return { ok: false, error: `“${clash}” and “${p.name}” look like the same artist.` };
    writeIns.set(slug, p.name);
  }

  const idBySlug = new Map<string, string>();
  if (writeIns.size) {
    const { data: existing, error } = await supabase.from("artists").select("id, slug").in("slug", [...writeIns.keys()]);
    if (error) return { ok: false, error: error.message };
    for (const a of existing ?? []) idBySlug.set(String(a.slug).toLowerCase(), a.id);
  }

  // A write-in can turn out to be an artist already picked from search.
  const pickedIds = new Map(picks.filter((p) => p.id).map((p) => [p.id as string, p.name]));
  for (const [slug, name] of writeIns) {
    const other = pickedIds.get(idBySlug.get(slug) ?? "");
    if (other) return { ok: false, error: `“${name}” and “${other}” are the same artist. Swap one out.` };
  }

  const toCreate = [...writeIns].filter(([slug]) => !idBySlug.has(slug));
  if (toCreate.length) {
    const { data: created, error } = await supabase
      .from("artists")
      .insert(toCreate.map(([slug, name]) => ({ slug, name, artist_type: "group" as const })))
      .select("id, slug");
    if (error) return { ok: false, error: error.message };
    for (const a of created ?? []) idBySlug.set(String(a.slug).toLowerCase(), a.id);
  }

  const ids = picks.map((p) => p.id ?? idBySlug.get(slugify(p.name)));
  if (ids.some((id) => !id)) return { ok: false, error: "Couldn't match one of your artists. Please try again." };

  const { data, error } = await supabase.rpc("lock_bingo_card", { ...args, p_artist_ids: ids as string[] });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/bingo");
  return { ok: true, cardId: data };
}
