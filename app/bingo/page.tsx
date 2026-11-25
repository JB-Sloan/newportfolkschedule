import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthStatus } from "@/components/AuthStatus";
import { countPicks, isBingoOpen, sanitizeSlots } from "@/lib/bingo";
import { createClient } from "@/lib/supabase/server";
import { BingoBuilder } from "./BingoBuilder";

/**
 * Newport Bingo (E7-02): build a 24-artist card for the next edition. Sends
 * you to your card once it's locked; closes when the first wave is announced.
 */
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Newport Bingo",
  description: "Pick 24 artists you think will play the next Newport Folk and lock your card before the lineup drops."
};

export default async function BingoPage() {
  const supabase = createClient();

  const [{ data: edition }, { data: auth }] = await Promise.all([
    supabase
      .from("editions")
      .select("id, year, start_date, is_cancelled")
      .eq("is_cancelled", false)
      .order("year", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.auth.getUser()
  ]);
  const user = auth.user;

  if (!edition) {
    return (
      <Shell title="Newport Bingo">
        <p className="mt-4 text-sm opacity-70">Bingo isn&apos;t available right now. Please try again later.</p>
      </Shell>
    );
  }

  const [{ count: waves, error: wavesError }, { data: card }, { data: demand }] = await Promise.all([
    supabase
      .from("announcement_waves")
      .select("*", { count: "exact", head: true })
      .eq("edition_id", edition.id)
      .lte("announced_at", new Date().toISOString()),
    user
      ? supabase
          .from("bingo_cards")
          .select("id, title, is_public, locked_at, draft")
          .eq("edition_id", edition.id)
          .eq("user_id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("v_artist_demand")
      .select("artist_id, artist_name, demand_count")
      .returns<{ artist_id: string; artist_name: string; demand_count: number }[]>()
  ]);

  if (card?.locked_at) redirect(`/bingo/card/${card.id}`);

  const open = !wavesError && isBingoOpen(edition, (waves ?? 0) > 0);
  if (!open) {
    return (
      <Shell title={`${edition.year} Newport Bingo`}>
        <p className="mt-4 rounded-2xl border border-black/10 p-4 text-sm">
          Bingo is closed for {edition.year}. Cards had to be locked before the first lineup announcement.
        </p>
      </Shell>
    );
  }

  const totals = new Map<string, { id: string; name: string; n: number }>();
  for (const d of demand ?? []) {
    const t = totals.get(d.artist_id) ?? { id: d.artist_id, name: d.artist_name, n: 0 };
    t.n += d.demand_count;
    totals.set(d.artist_id, t);
  }
  const suggestions = [...totals.values()]
    .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name))
    .slice(0, 40)
    .map(({ id, name }) => ({ id, name }));

  const savedSlots = sanitizeSlots(card?.draft);
  const savedDraft =
    card && (countPicks(savedSlots) || card.title)
      ? { title: card.title ?? "", isPublic: card.is_public, slots: savedSlots }
      : null;

  return (
    <Shell title={`${edition.year} Newport Bingo`}>
      <p className="mt-1 max-w-2xl text-sm opacity-75">
        Pick 24 artists you think will play Newport Folk {edition.year}, then lock your card before the first lineup
        announcement. After that, no new cards and no changes.
      </p>
      <BingoBuilder
        editionId={edition.id}
        year={edition.year}
        signedIn={Boolean(user)}
        savedDraft={savedDraft}
        suggestions={suggestions}
      />
      <p className="mt-8 text-xs opacity-60">
        Free to play, one card per person, no prizes. This is a fan project and isn&apos;t affiliated with Newport Folk.
      </p>
    </Shell>
  );
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-4xl p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <Link href="/archive" className="text-xs font-bold uppercase tracking-widest opacity-50 hover:opacity-80">
          ← The Archive
        </Link>
        <AuthStatus />
      </div>
      <h1 className="mt-2 text-3xl font-black">{title}</h1>
      {children}
    </main>
  );
}
