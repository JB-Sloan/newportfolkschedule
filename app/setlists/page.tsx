import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

/**
 * Documented setlists: every set we hold community-sourced songs for, newest
 * first, with song and cover counts. Setlists are sparse (fragments reported
 * on the Inforoo boards), so this makes the whole corpus discoverable in one
 * place rather than only via the individual set page.
 */
export const dynamic = "force-dynamic";

type Row = {
  slug: string;
  billed_name: string;
  setlist_entries: { is_cover: boolean }[];
  events: { date: string; editions: { year: number } | null } | null;
};

export default async function SetlistsIndexPage() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("sets")
    .select("slug, billed_name, setlist_entries!inner(is_cover), events!inner(date, editions!inner(year))")
    .returns<Row[]>();

  const rows = (data ?? [])
    .map((r) => ({
      slug: r.slug,
      name: r.billed_name,
      year: r.events?.editions?.year ?? 0,
      songs: r.setlist_entries.length,
      covers: r.setlist_entries.filter((e) => e.is_cover).length
    }))
    .sort((a, b) => b.year - a.year || b.songs - a.songs || a.name.localeCompare(b.name));

  const totalSongs = rows.reduce((n, r) => n + r.songs, 0);
  const totalCovers = rows.reduce((n, r) => n + r.covers, 0);

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Link href="/archive" className="text-xs font-bold uppercase tracking-widest opacity-50 hover:opacity-80">
        ← The Archive
      </Link>
      <p className="mt-2 text-xs font-bold uppercase tracking-widest opacity-50">The Archive · Setlists</p>
      <h1 className="mt-1 text-3xl font-black">What got played</h1>
      <p className="mt-1 text-sm opacity-70">
        {rows.length} documented setlists · {totalSongs} songs · {totalCovers} covers, reported by fans.
      </p>

      {error ? <p className="mt-4 rounded-lg bg-red-100 p-3 text-sm text-red-800">{error.message}</p> : null}

      <ul className="mt-6 divide-y divide-black/10">
        {rows.map((r) => (
          <li key={`${r.year}-${r.slug}`} className="flex items-baseline gap-3 py-2">
            <Link href={`/archive/${r.year}`} className="w-12 shrink-0 text-lg font-black tabular-nums underline decoration-black/20 hover:decoration-black">
              {r.year}
            </Link>
            <Link href={`/archive/${r.year}/${r.slug}`} className="font-bold underline decoration-black/20 hover:decoration-black">
              {r.name}
            </Link>
            <span className="ml-auto shrink-0 text-sm tabular-nums opacity-60">
              {r.songs} {r.songs === 1 ? "song" : "songs"}
              {r.covers ? <span className="opacity-60"> · {r.covers} {r.covers === 1 ? "cover" : "covers"}</span> : null}
            </span>
          </li>
        ))}
      </ul>

      {rows.length === 0 && !error ? (
        <p className="mt-6 text-sm opacity-60">No setlists documented yet.</p>
      ) : null}

      <p className="mt-6 text-xs opacity-45">
        Setlists are community-sourced from the Inforoo forums and often partial; order is approximate.
      </p>
    </main>
  );
}
