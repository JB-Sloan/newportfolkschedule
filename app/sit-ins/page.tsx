import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

/**
 * The Sit-In Graph: Newport's most-connected artists, ranked by how many
 * distinct stage-mates they've shared a set with (as guest or host), from
 * v_sit_in_graph. Each row links into that artist's page, where the full
 * "Shared a stage with" list lives.
 */
export const dynamic = "force-dynamic";

type Edge = {
  guest_artist_id: string;
  host_artist_id: string;
  times: number;
};

export default async function SitInsIndexPage() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("v_sit_in_graph")
    .select("guest_artist_id, host_artist_id, times")
    .returns<Edge[]>();

  const edges = data ?? [];

  // Count distinct partners + total shared sets per artist, both directions.
  const agg = new Map<string, { partners: Set<string>; times: number }>();
  const bump = (a: string, b: string, times: number) => {
    const e = agg.get(a);
    if (e) {
      e.partners.add(b);
      e.times += times;
    } else {
      agg.set(a, { partners: new Set([b]), times });
    }
  };
  for (const e of edges) {
    bump(e.guest_artist_id, e.host_artist_id, e.times);
    bump(e.host_artist_id, e.guest_artist_id, e.times);
  }

  // Names + slugs live on the artists table, not the view.
  const ids = [...agg.keys()];
  const artistById = new Map<string, { name: string; slug: string }>();
  if (ids.length) {
    const { data: artists } = await supabase
      .from("artists")
      .select("id, name, slug")
      .in("id", ids)
      .returns<{ id: string; name: string; slug: string }[]>();
    for (const a of artists ?? []) artistById.set(a.id, { name: a.name, slug: a.slug });
  }

  const ranked = [...agg.entries()]
    .map(([id, v]) => ({ id, ...artistById.get(id), partners: v.partners.size, times: v.times }))
    .filter((r): r is { id: string; name: string; slug: string; partners: number; times: number } => Boolean(r.slug))
    .sort((a, b) => b.partners - a.partners || b.times - a.times || a.name.localeCompare(b.name));

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Link href="/" className="text-xs font-bold uppercase tracking-widest opacity-50 hover:opacity-80">
        ← Folk Planner
      </Link>
      <p className="mt-2 text-xs font-bold uppercase tracking-widest opacity-50">The Sit-In Graph</p>
      <h1 className="mt-1 text-3xl font-black">Who joins whom on stage</h1>
      <p className="mt-1 text-sm opacity-70">
        {ranked.length} artists ranked by documented stage-mates — the guest appearances that make Newport legendary.
      </p>

      {error ? <p className="mt-4 rounded-lg bg-red-100 p-3 text-sm text-red-800">{error.message}</p> : null}

      <ol className="mt-6 divide-y divide-black/10">
        {ranked.map((r, i) => (
          <li key={r.id} className="flex items-baseline gap-3 py-2">
            <span className="w-6 shrink-0 text-right text-sm font-black tabular-nums opacity-40">{i + 1}</span>
            <Link href={`/artist/${r.slug}`} className="font-bold underline decoration-black/20 hover:decoration-black">
              {r.name}
            </Link>
            <span className="ml-auto shrink-0 text-sm tabular-nums opacity-60">
              {r.partners} {r.partners === 1 ? "stage-mate" : "stage-mates"}
            </span>
          </li>
        ))}
      </ol>

      {ranked.length === 0 && !error ? (
        <p className="mt-6 text-sm opacity-60">No sit-ins recorded yet.</p>
      ) : null}

      <p className="mt-6 text-xs opacity-45">
        Guest appearances are community-sourced from the Inforoo forums; not affiliated with the festival or artists.
      </p>
    </main>
  );
}
