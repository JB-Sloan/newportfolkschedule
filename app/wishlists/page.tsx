import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

/**
 * The Oracle: who the Inforoo boards begged for. Ranks artists by total
 * fan demand (wishes + requests) aggregated across festival years, from
 * v_artist_demand. Each row links to that artist's page.
 */
export const dynamic = "force-dynamic";

type DemandRow = {
  artist_id: string;
  artist_name: string;
  festival_year: number;
  demand_count: number;
};

export default async function WishlistsIndexPage() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("v_artist_demand")
    .select("artist_id, artist_name, festival_year, demand_count")
    .returns<DemandRow[]>();

  const rows = data ?? [];

  // Aggregate demand per artist across all years.
  const agg = new Map<string, { name: string; total: number; years: Set<number> }>();
  for (const r of rows) {
    const e = agg.get(r.artist_id);
    if (e) {
      e.total += r.demand_count;
      e.years.add(r.festival_year);
    } else {
      agg.set(r.artist_id, { name: r.artist_name, total: r.demand_count, years: new Set([r.festival_year]) });
    }
  }

  // Slugs live on the artists table, not the view — resolve them for linking.
  const ids = [...agg.keys()];
  const slugById = new Map<string, string>();
  if (ids.length) {
    const { data: artists } = await supabase
      .from("artists")
      .select("id, slug")
      .in("id", ids)
      .returns<{ id: string; slug: string }[]>();
    for (const a of artists ?? []) slugById.set(a.id, a.slug);
  }

  const ranked = [...agg.entries()]
    .map(([id, v]) => ({ id, slug: slugById.get(id), ...v }))
    .filter((r) => r.slug)
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));

  const totalRequests = rows.reduce((n, r) => n + r.demand_count, 0);

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Link href="/" className="text-xs font-bold uppercase tracking-widest opacity-50 hover:opacity-80">
        ← Folk Planner
      </Link>
      <p className="mt-2 text-xs font-bold uppercase tracking-widest opacity-50">The Oracle</p>
      <h1 className="mt-1 text-3xl font-black">Who the boards begged for</h1>
      <p className="mt-1 text-sm opacity-70">
        {ranked.length} artists · {totalRequests.toLocaleString()} requests from the Inforoo boards, ranked by fan demand.
      </p>

      {error ? <p className="mt-4 rounded-lg bg-red-100 p-3 text-sm text-red-800">{error.message}</p> : null}

      <ol className="mt-6 divide-y divide-black/10">
        {ranked.map((r, i) => {
          const years = [...r.years].sort((a, b) => b - a);
          return (
            <li key={r.id} className="flex items-baseline gap-3 py-2">
              <span className="w-6 shrink-0 text-right text-sm font-black tabular-nums opacity-40">{i + 1}</span>
              <Link href={`/artist/${r.slug}`} className="font-bold underline decoration-black/20 hover:decoration-black">
                {r.name}
              </Link>
              <span className="ml-auto shrink-0 text-sm tabular-nums opacity-60">
                {r.total} {r.total === 1 ? "request" : "requests"}
                <span className="opacity-60"> · {years.length === 1 ? years[0] : `${years[years.length - 1]}–${years[0]}`}</span>
              </span>
            </li>
          );
        })}
      </ol>

      {ranked.length === 0 && !error ? (
        <p className="mt-6 text-sm opacity-60">No fan requests recorded yet.</p>
      ) : null}

      <p className="mt-6 text-xs opacity-45">
        Demand is community-sourced from Newport Folk threads on the Inforoo forums; not affiliated with the festival or artists.
      </p>
    </main>
  );
}
