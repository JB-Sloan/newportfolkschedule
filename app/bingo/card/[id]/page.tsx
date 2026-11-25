import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthStatus } from "@/components/AuthStatus";
import { CARD_SIZE, FREE_POSITION, isUuid } from "@/lib/bingo";
import { createClient } from "@/lib/supabase/server";

/** A locked bingo card. RLS limits private cards to their owner and moderators. */
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Newport Bingo card", robots: { index: false } };

type Square = {
  position: number;
  is_free: boolean;
  is_hit: boolean;
  artists: { name: string; slug: string } | null;
};
type Card = {
  id: string;
  user_id: string;
  title: string | null;
  is_public: boolean;
  locked_at: string | null;
  editions: { year: number } | null;
  bingo_squares: Square[];
};

export default async function BingoCardPage({ params }: { params: { id: string } }) {
  if (!isUuid(params.id)) notFound();
  const supabase = createClient();

  const [{ data: card, error }, { data: auth }] = await Promise.all([
    supabase
      .from("bingo_cards")
      .select(
        "id, user_id, title, is_public, locked_at, editions!bingo_cards_edition_id_fkey(year), bingo_squares(position, is_free, is_hit, artists(name, slug))"
      )
      .eq("id", params.id)
      .maybeSingle()
      .returns<Card | null>(),
    supabase.auth.getUser()
  ]);
  if (error) throw new Error(error.message);
  if (!card || !card.locked_at) notFound();

  const mine = auth.user?.id === card.user_id;
  const year = card.editions?.year;
  const squares: (Square | undefined)[] = Array.from({ length: CARD_SIZE }, (_, i) =>
    card.bingo_squares.find((s) => s.position === i)
  );
  const lockedOn = new Date(card.locked_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York"
  });

  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <Link href="/bingo" className="text-xs font-bold uppercase tracking-widest opacity-50 hover:opacity-80">
          Newport Bingo
        </Link>
        <AuthStatus />
      </div>
      <h1 className="mt-2 text-3xl font-black [overflow-wrap:anywhere]">{card.title ?? `A ${year ?? ""} bingo card`}</h1>
      <p className="mt-1 text-sm opacity-70">
        {year ? `Newport Folk ${year} · ` : ""}Locked {lockedOn}
      </p>
      {mine ? (
        <p className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          Your card is locked in.{" "}
          {card.is_public ? "Copy this page's link to share it." : "It's private, so only you and moderators can see it."}
        </p>
      ) : null}

      <ol aria-label="Bingo card" className="mt-5 grid grid-cols-5 gap-1 sm:gap-2">
        {squares.map((s, i) => (
          <li
            key={i}
            className={`flex aspect-square min-w-0 items-center justify-center overflow-hidden rounded-lg border p-0.5 text-center text-[10px] font-bold leading-tight [overflow-wrap:anywhere] sm:rounded-xl sm:p-1.5 sm:text-xs ${
              i === FREE_POSITION
                ? "border-transparent bg-sunset/15 uppercase tracking-wide text-quad"
                : s?.is_hit
                  ? "border-emerald-600 bg-emerald-100 text-emerald-950"
                  : "border-black/15 bg-white"
            }`}
          >
            {i === FREE_POSITION ? (
              "Free"
            ) : s?.artists ? (
              <Link href={`/artist/${s.artists.slug}`} title={s.artists.name} className="line-clamp-4 hover:underline">
                {s.artists.name}
                {s.is_hit ? <span className="sr-only"> (announced)</span> : null}
              </Link>
            ) : null}
          </li>
        ))}
      </ol>

      {!mine ? (
        <p className="mt-5 text-sm">
          <Link href="/bingo" className="font-bold underline">
            Make your own card
          </Link>
        </p>
      ) : null}
    </main>
  );
}
