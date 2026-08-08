import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AuthStatus } from "@/components/AuthStatus";
import { SearchBox } from "@/components/SearchBox";

/**
 * The Archive index: every edition we hold, newest first, with set counts.
 * Reads the seeded editions/sets from Supabase (1959–2026).
 */
export const dynamic = "force-dynamic";

type EditionRow = {
  year: number;
  name: string | null;
  is_cancelled: boolean;
  events: { sets: { count: number }[] }[];
};
type CompRow = { year: number; total_sets: number; enriched_sets: number };

export default async function ArchiveIndexPage() {
  const supabase = createClient();

  const [{ data, error }, { data: comp }] = await Promise.all([
    supabase
      .from("editions")
      .select("year, name, is_cancelled, events(sets(count))")
      .order("year", { ascending: false })
      .returns<EditionRow[]>(),
    supabase.from("v_edition_completeness").select("year, total_sets, enriched_sets").returns<CompRow[]>()
  ]);

  const editions = data ?? [];
  const setCount = (e: EditionRow) =>
    (e.events ?? []).reduce((n, ev) => n + (ev.sets?.[0]?.count ?? 0), 0);
  const totalSets = editions.reduce((n, e) => n + setCount(e), 0);

  const compByYear = new Map<number, { total: number; enriched: number }>();
  for (const c of comp ?? []) compByYear.set(c.year, { total: c.total_sets, enriched: c.enriched_sets });
  const totalEnriched = (comp ?? []).reduce((n, c) => n + c.enriched_sets, 0);

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-widest opacity-50">The Archive</p>
        <AuthStatus />
      </div>
      <h1 className="mt-1 text-3xl font-black">Newport Folk, year by year</h1>
      <p className="mt-1 text-sm opacity-70">
        {editions.length} editions · {totalSets.toLocaleString()} sets · 1959–2026 ·{" "}
        {totalEnriched.toLocaleString()} with community detail
      </p>
      <div className="mt-4">
        <SearchBox />
      </div>
      <nav className="mt-3 flex flex-wrap gap-2 text-sm font-bold">
        <Link href="/setlists" className="rounded-full bg-black/5 px-3 py-1 hover:bg-black/10">♪ Setlists</Link>
        <Link href="/sit-ins" className="rounded-full bg-black/5 px-3 py-1 hover:bg-black/10">Sit-in graph</Link>
        <Link href="/wishlists" className="rounded-full bg-black/5 px-3 py-1 hover:bg-black/10">Fan wishlists</Link>
      </nav>

      {error ? <p className="mt-4 rounded-lg bg-red-100 p-3 text-sm text-red-800">{error.message}</p> : null}

      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {editions.map((e) => {
          const c = compByYear.get(e.year);
          const pct = c && c.total > 0 ? Math.round((c.enriched / c.total) * 100) : 0;
          return (
            <li key={e.year}>
              <Link
                href={`/archive/${e.year}`}
                className="flex flex-col rounded-2xl border border-black/10 p-3 transition hover:border-black/30 hover:bg-black/5"
              >
                <span className="text-2xl font-black tabular-nums">{e.year}</span>
                <span className="text-xs opacity-60">
                  {e.is_cancelled ? "Cancelled" : `${setCount(e)} sets`}
                </span>
                {!e.is_cancelled && c ? (
                  <span className="mt-2" title={`${c.enriched} of ${c.total} sets have a setlist or guest`}>
                    <span className="block h-1 overflow-hidden rounded-full bg-black/10">
                      <span className="block h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                    </span>
                    <span className="mt-1 block text-[10px] font-bold uppercase tracking-wide opacity-45">
                      {pct}% documented
                    </span>
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
