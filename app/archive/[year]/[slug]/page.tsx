import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddSongForm } from "./AddSongForm";

/**
 * Set page (E2-09): one billed set — its performers (billed, band members,
 * sit-ins), stage/time, and kind. Setlist, media, and reviews attach here next.
 */
export const dynamic = "force-dynamic";

const TIME = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/New_York"
});
const DAY = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  timeZone: "America/New_York"
});

const ROLE_LABEL: Record<string, string> = {
  billed: "Billed",
  band_member: "Band",
  sit_in: "Sit-in",
  guest_vocal: "Guest vocal",
  host: "Host",
  curator: "Curator",
  surprise_guest: "Surprise guest"
};

type Performer = {
  id: string;
  role: string;
  instruments: string[] | null;
  status: string;
  artists: { name: string; slug: string; artist_type: string } | null;
};
type SetlistEntry = {
  id: string;
  position: number;
  raw_title: string;
  is_cover: boolean;
  is_encore: boolean;
  songs: { title: string; slug: string } | null;
};
type SourceRow = { kind: string; url: string | null; author_handle: string | null };

const SOURCE_LABEL: Record<string, string> = {
  inforoo: "Inforoo",
  reddit: "Reddit",
  setlistfm: "setlist.fm",
  press: "Press",
  youtube: "YouTube",
  instagram: "Instagram"
};
type SetRow = {
  id: string;
  billed_name: string;
  set_kind: string;
  is_surprise: boolean;
  scheduled_start: string | null;
  scheduled_end: string | null;
  description: string | null;
  stages: { name: string } | null;
  events: { kind: string; date: string; name: string | null } | null;
  performances: Performer[];
  setlist_entries: SetlistEntry[];
};

export default async function SetPage({ params }: { params: { year: string; slug: string } }) {
  const year = Number(params.year);
  if (!Number.isInteger(year)) notFound();

  const supabase = createClient();
  const { data: edition } = await supabase.from("editions").select("id, year").eq("year", year).maybeSingle();
  if (!edition) notFound();

  const { data: set } = await supabase
    .from("sets")
    .select(
      "id, billed_name, set_kind, is_surprise, scheduled_start, scheduled_end, description, stages(name), events!inner(kind, date, name, edition_id), performances(id, role, instruments, status, artists(name, slug, artist_type)), setlist_entries(id, position, raw_title, is_cover, is_encore, songs(title, slug))"
    )
    .eq("events.edition_id", edition.id)
    .eq("slug", params.slug)
    .limit(1)
    .maybeSingle<SetRow>();

  if (!set) notFound();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const order = ["billed", "host", "curator", "band_member", "guest_vocal", "sit_in", "surprise_guest"];
  const performers = [...(set.performances ?? [])].sort(
    (a, b) => order.indexOf(a.role) - order.indexOf(b.role)
  );
  const setlist = [...(set.setlist_entries ?? [])].sort((a, b) => a.position - b.position);

  // Sources cited for this set's guest performances + setlist (community provenance).
  const entityIds = [...performers.map((p) => p.id), ...setlist.map((e) => e.id)];
  let sources: SourceRow[] = [];
  if (entityIds.length) {
    const { data: cites } = await supabase
      .from("citations")
      .select("sources(kind, url, author_handle)")
      .in("entity_id", entityIds)
      .returns<{ sources: SourceRow | null }[]>();
    const byUrl = new Map<string, SourceRow>();
    for (const c of cites ?? []) if (c.sources?.url && !byUrl.has(c.sources.url)) byUrl.set(c.sources.url, c.sources);
    sources = [...byUrl.values()];
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Link href={`/archive/${year}`} className="text-xs font-bold uppercase tracking-widest opacity-50 hover:opacity-80">
        ← Newport Folk {year}
      </Link>
      <div className="mt-1 flex flex-wrap items-baseline gap-2">
        <h1 className="text-3xl font-black">{set.billed_name}</h1>
        {set.set_kind !== "standard" ? (
          <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs font-bold">{set.set_kind}</span>
        ) : null}
        {set.events?.kind === "aftershow" ? (
          <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs font-bold">aftershow</span>
        ) : null}
      </div>
      <p className="mt-1 text-sm opacity-70">
        {set.events?.date ? DAY.format(new Date(`${set.events.date}T12:00:00-04:00`)) : year}
        {set.scheduled_start ? ` · ${TIME.format(new Date(set.scheduled_start))}` : ""}
        {set.scheduled_end ? `–${TIME.format(new Date(set.scheduled_end))}` : ""}
        {set.stages?.name ? ` · ${set.stages.name}` : ""}
      </p>
      {set.description ? <p className="mt-3 max-w-prose text-sm opacity-80">{set.description}</p> : null}

      <section className="mt-6">
        <h2 className="text-sm font-black uppercase tracking-widest opacity-50">Who played</h2>
        {performers.length ? (
          <ul className="mt-2 divide-y divide-black/10">
            {performers.map((p, i) => (
              <li key={i} className="flex flex-wrap items-baseline gap-x-3 py-2">
                <span className="w-24 shrink-0 text-xs font-bold uppercase tracking-wide opacity-55">
                  {ROLE_LABEL[p.role] ?? p.role}
                </span>
                {p.artists?.slug ? (
                  <Link href={`/artist/${p.artists.slug}`} className="font-bold underline decoration-black/20 hover:decoration-black">
                    {p.artists.name}
                  </Link>
                ) : (
                  <span className="font-bold">{set.billed_name}</span>
                )}
                {p.instruments?.length ? (
                  <span className="text-sm opacity-55">{p.instruments.join(", ")}</span>
                ) : null}
                {p.status && p.status !== "confirmed" ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">{p.status}</span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm opacity-60">
            No performers resolved yet — this set is recorded from the billing. Sit-ins and setlist coming from community submissions.
          </p>
        )}
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-black uppercase tracking-widest opacity-50">Setlist</h2>
        {setlist.length ? (
          <>
            <ol className="mt-2 space-y-1">
              {setlist.map((e, i) => (
                <li key={i} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                  <span className="w-6 shrink-0 text-right tabular-nums opacity-40">{i + 1}.</span>
                  <span>{e.songs?.title ?? e.raw_title}</span>
                  {e.is_cover ? <span className="text-xs opacity-45">(cover)</span> : null}
                  {e.is_encore ? <span className="rounded bg-black/10 px-1.5 text-xs font-bold">encore</span> : null}
                </li>
              ))}
            </ol>
            <p className="mt-2 text-xs opacity-45">Community-sourced; order approximate.</p>
          </>
        ) : (
          <p className="mt-2 text-sm opacity-60">No setlist documented yet — know what they played?</p>
        )}
        {user ? (
          <AddSongForm setId={set.id} year={year} setSlug={params.slug} />
        ) : (
          <p className="mt-3 text-sm opacity-60">
            <Link href="/login" className="font-bold underline decoration-black/30 hover:decoration-black">
              Sign in
            </Link>{" "}
            to add songs to this setlist.
          </p>
        )}
      </section>

      {sources.length ? (
        <section className="mt-6">
          <h2 className="text-sm font-black uppercase tracking-widest opacity-50">Sources</h2>
          <ul className="mt-2 space-y-1">
            {sources.map((s, i) => (
              <li key={i} className="text-sm">
                <a href={s.url ?? "#"} target="_blank" rel="noreferrer" className="text-blue-700 underline">
                  {SOURCE_LABEL[s.kind] ?? s.kind}
                  {s.author_handle ? ` — ${s.author_handle}` : ""}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs opacity-45">
            Guest and setlist details reported by fans; not affiliated with the festival or artists.
          </p>
        </section>
      ) : null}
    </main>
  );
}
