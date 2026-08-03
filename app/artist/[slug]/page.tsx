import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Artist page: identity + full Newport appearance history from
 * v_artist_appearances (every set they're credited on, across all editions).
 */
export const dynamic = "force-dynamic";

type Appearance = {
  role: string;
  billed_name: string;
  set_kind: string;
  event_kind: string;
  edition_year: number;
  stage_name: string | null;
};

export default async function ArtistPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();

  const { data: artist } = await supabase
    .from("artists")
    .select("id, name, artist_type, bio, official_url, is_newport_alum")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!artist) notFound();

  const { data: rows } = await supabase
    .from("v_artist_appearances")
    .select("role, billed_name, set_kind, event_kind, edition_year, stage_name")
    .eq("artist_id", artist.id)
    .order("edition_year", { ascending: false })
    .returns<Appearance[]>();

  const appearances = rows ?? [];
  const years = [...new Set(appearances.map((a) => a.edition_year))];

  const { data: reqRows } = await supabase
    .from("artist_requests")
    .select("festival_year")
    .eq("artist_id", artist.id)
    .returns<{ festival_year: number }[]>();
  const requestYears = [...new Set((reqRows ?? []).map((r) => r.festival_year))].sort((a, b) => b - a);

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link href="/archive" className="text-xs font-bold uppercase tracking-widest opacity-50 hover:opacity-80">
        ← The Archive
      </Link>
      <div className="mt-1 flex flex-wrap items-baseline gap-3">
        <h1 className="text-3xl font-black">{artist.name}</h1>
        <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs font-bold capitalize">{artist.artist_type}</span>
      </div>
      <p className="mt-2 text-sm opacity-70">
        {appearances.length} Newport {appearances.length === 1 ? "appearance" : "appearances"}
        {years.length ? ` across ${years.length} ${years.length === 1 ? "edition" : "editions"} (${years[years.length - 1]}–${years[0]})` : ""}
      </p>
      {artist.bio ? <p className="mt-3 max-w-prose text-sm opacity-80">{artist.bio}</p> : null}

      {(reqRows ?? []).length ? (
        <p className="mt-3 inline-block rounded-lg bg-black/5 px-3 py-2 text-sm">
          🎟️ Wished for by fans on the Inforoo boards{" "}
          {requestYears.length ? `(${requestYears.join(", ")})` : ""} — {(reqRows ?? []).length} request
          {(reqRows ?? []).length === 1 ? "" : "s"}.
        </p>
      ) : null}

      <ul className="mt-6 divide-y divide-black/10">
        {appearances.map((a, i) => (
          <li key={i} className="flex flex-wrap items-baseline gap-x-3 py-2">
            <Link href={`/archive/${a.edition_year}`} className="w-14 shrink-0 text-lg font-black tabular-nums underline decoration-black/20 hover:decoration-black">
              {a.edition_year}
            </Link>
            <span className="opacity-80">{a.billed_name}</span>
            {a.stage_name ? <span className="text-sm opacity-55">{a.stage_name}</span> : null}
            {a.event_kind === "aftershow" ? (
              <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs font-bold">aftershow</span>
            ) : null}
            {a.set_kind !== "standard" ? (
              <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs font-bold">{a.set_kind}</span>
            ) : null}
          </li>
        ))}
      </ul>

      {artist.official_url ? (
        <a className="mt-6 inline-block text-sm font-bold text-blue-700 underline" href={artist.official_url} target="_blank" rel="noreferrer">
          Official / reference link
        </a>
      ) : null}
    </main>
  );
}
