import type { Metadata } from "next";
import Link from "next/link";
import { isBingoOpen } from "@/lib/bingo";
import { requireModerator } from "@/lib/supabase/moderator";
import { createClient } from "@/lib/supabase/server";
import { NewWave, WaveCard, type Wave } from "./WaveTool";

/**
 * Announcement waves (E10-02). Moderators record each lineup wave and the
 * artists in it. The first wave closes bingo for the edition.
 */
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Announcement waves", robots: { index: false } };

type WaveRow = {
  id: string;
  wave_number: number;
  announced_at: string;
  source_url: string | null;
  notes: string | null;
  lineup_announcements: { id: string; billed_name: string | null; artists: { name: string } | null }[];
};

export default async function WavesPage() {
  const supabase = createClient();
  const gate = await requireModerator(supabase);
  if ("error" in gate) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <h1 className="text-2xl font-black">Announcement waves</h1>
        <p className="mt-2 text-sm opacity-70">{gate.error}</p>
        {gate.error === "Please sign in." ? (
          <Link href="/login?next=/moderate/waves" className="mt-3 inline-block text-sm font-bold underline">
            Sign in
          </Link>
        ) : null}
      </main>
    );
  }

  const { data: edition } = await supabase
    .from("editions")
    .select("id, year, start_date, is_cancelled")
    .eq("is_cancelled", false)
    .order("year", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!edition) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <h1 className="text-2xl font-black">Announcement waves</h1>
        <p className="mt-2 text-sm opacity-70">The current edition couldn&apos;t be loaded. Please try again.</p>
      </main>
    );
  }

  const [{ data: waveRows, error }, { count: locked }] = await Promise.all([
    supabase
      .from("announcement_waves")
      .select("id, wave_number, announced_at, source_url, notes, lineup_announcements(id, billed_name, artists(name))")
      .eq("edition_id", edition.id)
      .order("wave_number", { ascending: false })
      .returns<WaveRow[]>(),
    supabase
      .from("bingo_cards")
      .select("*", { count: "exact", head: true })
      .eq("edition_id", edition.id)
      .not("locked_at", "is", null)
  ]);

  const waves: Wave[] = (waveRows ?? []).map(({ lineup_announcements, ...w }) => ({
    ...w,
    artists: lineup_announcements
      .map((a) => ({ id: a.id, name: a.artists?.name ?? a.billed_name ?? "Unknown", billedName: a.billed_name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }));

  // Cards locked between the real announcement and this being recorded.
  const firstAt = waves.length ? waves.map((w) => w.announced_at).sort((a, b) => Date.parse(a) - Date.parse(b))[0] : null;
  let late = 0;
  if (firstAt) {
    const { count } = await supabase
      .from("bingo_cards")
      .select("*", { count: "exact", head: true })
      .eq("edition_id", edition.id)
      .gte("locked_at", firstAt);
    late = count ?? 0;
  }
  const open = isBingoOpen(edition, waves.length > 0);
  const cards = locked ?? 0;

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6">
      <Link href="/moderate" className="text-xs font-bold uppercase tracking-widest opacity-50 hover:opacity-80">
        ← Moderation
      </Link>
      <h1 className="mt-1 text-3xl font-black">{edition.year} announcement waves</h1>
      <p className="mt-1 text-sm opacity-75">
        Bingo is <strong>{open ? "open" : "closed"}</strong> with {cards} locked {cards === 1 ? "card" : "cards"}.
        {late ? ` ${late} ${late === 1 ? "was" : "were"} locked after the first announcement.` : ""}
      </p>

      {error ? (
        <p className="mt-4 rounded-lg bg-red-100 p-3 text-sm text-red-800">{error.message}</p>
      ) : (
        <>
          <div className="mt-5">
            <NewWave editionId={edition.id} year={edition.year} isFirst={waves.length === 0} />
          </div>
          <ul className="mt-5 space-y-4">
            {waves.map((w) => (
              <WaveCard key={w.id} wave={w} onlyWave={waves.length === 1} year={edition.year} />
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
