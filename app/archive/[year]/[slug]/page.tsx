import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
  role: string;
  instruments: string[] | null;
  status: string;
  artists: { name: string; slug: string; artist_type: string } | null;
};
type SetRow = {
  billed_name: string;
  set_kind: string;
  is_surprise: boolean;
  scheduled_start: string | null;
  scheduled_end: string | null;
  description: string | null;
  stages: { name: string } | null;
  events: { kind: string; date: string; name: string | null } | null;
  performances: Performer[];
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
      "billed_name, set_kind, is_surprise, scheduled_start, scheduled_end, description, stages(name), events!inner(kind, date, name, edition_id), performances(role, instruments, status, artists(name, slug, artist_type))"
    )
    .eq("events.edition_id", edition.id)
    .eq("slug", params.slug)
    .limit(1)
    .maybeSingle<SetRow>();

  if (!set) notFound();

  const order = ["billed", "host", "curator", "band_member", "guest_vocal", "sit_in", "surprise_guest"];
  const performers = [...(set.performances ?? [])].sort(
    (a, b) => order.indexOf(a.role) - order.indexOf(b.role)
  );

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
    </main>
  );
}
