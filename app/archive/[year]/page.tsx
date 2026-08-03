import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** A single edition's lineup. 2026 has stages/times; historical years are flat. */
export const dynamic = "force-dynamic";

const TIME = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/New_York"
});

type SetRow = {
  slug: string;
  billed_name: string;
  set_kind: string;
  is_surprise: boolean;
  scheduled_start: string | null;
  billed_artist_id: string | null;
  stages: { name: string; sort_order: number } | null;
  events: { kind: string; date: string } | null;
};

export default async function EditionPage({ params }: { params: { year: string } }) {
  const year = Number(params.year);
  if (!Number.isInteger(year)) notFound();

  const supabase = createClient();
  const { data: edition } = await supabase
    .from("editions")
    .select("id, year, name, is_cancelled")
    .eq("year", year)
    .maybeSingle();

  if (!edition) notFound();

  const { data: rows } = await supabase
    .from("sets")
    .select(
      "slug, billed_name, set_kind, is_surprise, scheduled_start, billed_artist_id, stages(name, sort_order), events!inner(kind, date, edition_id)"
    )
    .eq("events.edition_id", edition.id)
    .order("scheduled_start", { ascending: true, nullsFirst: false })
    .returns<SetRow[]>();

  const sets = rows ?? [];
  const billed = sets.filter((s) => !s.is_surprise);
  const guests = sets.filter((s) => s.is_surprise);

  const SetName = ({ s }: { s: SetRow }) => (
    <Link href={`/archive/${year}/${s.slug}`} className="font-bold underline decoration-black/20 hover:decoration-black">
      {s.billed_name}
    </Link>
  );

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link href="/archive" className="text-xs font-bold uppercase tracking-widest opacity-50 hover:opacity-80">
        ← The Archive
      </Link>
      <h1 className="mt-1 text-3xl font-black">{edition.name ?? `Newport Folk ${year}`}</h1>
      <p className="mt-1 text-sm opacity-70">
        {edition.is_cancelled ? "Cancelled" : `${billed.length} sets`}
        {guests.length ? ` · ${guests.length} guests/surprises` : ""}
      </p>

      <ul className="mt-5 divide-y divide-black/10">
        {billed.map((s, i) => (
          <li key={i} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2">
            {s.scheduled_start ? (
              <span className="w-16 shrink-0 text-sm tabular-nums opacity-60">{TIME.format(new Date(s.scheduled_start))}</span>
            ) : null}
            <SetName s={s} />
            {s.stages?.name ? <span className="text-sm opacity-60">{s.stages.name}</span> : null}
            {s.set_kind !== "standard" ? (
              <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs font-bold">{s.set_kind}</span>
            ) : null}
          </li>
        ))}
      </ul>

      {guests.length ? (
        <section className="mt-8">
          <h2 className="text-lg font-black">Guests &amp; surprises</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {guests.map((s, i) => (
              <li key={i} className="rounded-full bg-black/5 px-3 py-1 text-sm">
                <Link href={`/archive/${year}/${s.slug}`} className="underline decoration-black/20 hover:decoration-black">
                  {s.billed_name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
