import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SearchBox } from "@/components/SearchBox";
import { escapeLike, rankByName } from "@/lib/artist-search";

/**
 * Artist search. Substring match on artist name (case-insensitive), re-ranked
 * so exact and prefix matches lead. Covers the 1,000+ artists in the graph.
 */
export const dynamic = "force-dynamic";

type Artist = { slug: string; name: string; artist_type: string; is_newport_alum: boolean };

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams.q ?? "").trim();
  const supabase = createClient();

  let results: Artist[] = [];
  if (q) {
    const { data } = await supabase
      .from("artists")
      .select("slug, name, artist_type, is_newport_alum")
      .ilike("name", `%${escapeLike(q)}%`)
      .limit(60)
      .returns<Artist[]>();
    results = rankByName(data ?? [], q);
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Link href="/archive" className="text-xs font-bold uppercase tracking-widest opacity-50 hover:opacity-80">
        ← The Archive
      </Link>
      <h1 className="mt-1 text-3xl font-black">Search artists</h1>
      <div className="mt-3">
        <SearchBox initial={q} autoFocus={!q} />
      </div>

      {q ? (
        results.length ? (
          <>
            <p className="mt-5 text-sm opacity-70">
              {results.length}
              {results.length === 60 ? "+" : ""} {results.length === 1 ? "result" : "results"} for “{q}”
            </p>
            <ul className="mt-2 divide-y divide-black/10">
              {results.map((a) => (
                <li key={a.slug} className="flex flex-wrap items-baseline gap-x-3 py-2">
                  <Link href={`/artist/${a.slug}`} className="font-bold underline decoration-black/20 hover:decoration-black">
                    {a.name}
                  </Link>
                  <span className="rounded-full bg-black/8 px-2 py-0.5 text-xs font-bold capitalize opacity-70">{a.artist_type}</span>
                  {a.is_newport_alum ? <span className="text-xs opacity-45">Newport alum</span> : null}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-5 text-sm opacity-60">No artists match “{q}”.</p>
        )
      ) : (
        <p className="mt-5 text-sm opacity-55">Type a name to search every artist in the archive.</p>
      )}
    </main>
  );
}
