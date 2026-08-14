import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** A single edition's lineup. Years with stages/times (2026+) render as a
 *  schedule timeline like the planner; historical years fall back to a flat
 *  list of billings. */
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

type SetRow = {
  slug: string;
  billed_name: string;
  set_kind: string;
  is_surprise: boolean;
  scheduled_start: string | null;
  scheduled_end: string | null;
  billed_artist_id: string | null;
  stages: { name: string; sort_order: number } | null;
  events: { kind: string; date: string } | null;
  setlist_entries: { count: number }[];
};

const songCount = (s: SetRow) => s.setlist_entries?.[0]?.count ?? 0;

function SetlistBadge({ n }: { n: number }) {
  if (!n) return null;
  return (
    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
      ♪ {n}
    </span>
  );
}

// Minute-of-day in festival time (America/New_York), matching the planner grid.
function minuteOfDay(iso: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    timeZone: "America/New_York"
  }).formatToParts(new Date(iso));
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return h * 60 + m;
}

function railLabel(min: number) {
  const h24 = Math.floor(min / 60) % 24;
  const m = min % 60;
  const h12 = h24 % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${h24 >= 12 ? "PM" : "AM"}`;
}

const PX_PER_MIN = 2.2;
const SLOT = 30;
const RAIL = 56;
const COL_MIN = 150;

function DayTimeline({ year, date, sets }: { year: number; date: string; sets: SetRow[] }) {
  const stages = [...new Map(sets.map((s) => [s.stages!.name, s.stages!.sort_order])).entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([name]) => name);

  const starts = sets.map((s) => minuteOfDay(s.scheduled_start!));
  const ends = sets.map((s) =>
    s.scheduled_end ? minuteOfDay(s.scheduled_end) : minuteOfDay(s.scheduled_start!) + 60
  );
  const startMin = Math.floor(Math.min(...starts) / SLOT) * SLOT;
  const endMin = Math.ceil(Math.max(...ends) / SLOT) * SLOT;
  const height = Math.max(240, (endMin - startMin) * PX_PER_MIN);

  const ticks: number[] = [];
  for (let m = startMin; m <= endMin; m += 60) ticks.push(m);

  const gridCols = `${RAIL}px repeat(${stages.length}, minmax(${COL_MIN}px, 1fr))`;
  const minWidth = RAIL + stages.length * COL_MIN;

  return (
    <section className="mt-6">
      <h2 className="text-lg font-black">{DAY.format(new Date(`${date}T12:00:00-04:00`))}</h2>
      <p className="text-xs font-bold opacity-55">
        {stages.length} {stages.length === 1 ? "stage" : "stages"} · {sets.length} sets
      </p>
      <div className="mt-3 overflow-x-auto rounded-2xl border border-black/10">
        <div style={{ minWidth }}>
          {/* stage header row */}
          <div className="sticky top-0 z-10 grid border-b border-black/10 bg-white" style={{ gridTemplateColumns: gridCols }}>
            <div className="border-r border-black/10 px-2 py-2 text-[10px] font-black uppercase tracking-wide opacity-45">Time</div>
            {stages.map((name) => (
              <div key={name} className="border-r border-black/10 px-3 py-2 text-sm font-black leading-tight last:border-r-0">
                {name}
              </div>
            ))}
          </div>
          {/* timeline body */}
          <div className="grid" style={{ gridTemplateColumns: gridCols, height }}>
            <div className="relative border-r border-black/10" style={{ height }}>
              {ticks.map((t) => (
                <div key={t} className="absolute left-0 right-0 border-t border-black/10" style={{ top: (t - startMin) * PX_PER_MIN }}>
                  <span className="absolute right-1 top-[-0.6rem] bg-white px-1 text-[10px] font-bold tabular-nums opacity-55">
                    {railLabel(t)}
                  </span>
                </div>
              ))}
            </div>
            {stages.map((name) => (
              <div key={name} className="relative border-r border-black/10 bg-black/[0.015] last:border-r-0" style={{ height }}>
                {ticks.map((t) => (
                  <div key={t} className="pointer-events-none absolute left-0 right-0 border-t border-black/10" style={{ top: (t - startMin) * PX_PER_MIN }} />
                ))}
                {sets
                  .filter((s) => s.stages!.name === name)
                  .map((s) => {
                    const start = minuteOfDay(s.scheduled_start!);
                    const end = s.scheduled_end ? minuteOfDay(s.scheduled_end) : start + 60;
                    const dur = Math.max(20, end - start);
                    return (
                      <Link
                        key={s.slug}
                        href={`/archive/${year}/${s.slug}`}
                        className="absolute left-1 right-1 overflow-hidden rounded-lg border border-black/12 bg-white p-1.5 shadow-sm transition hover:border-black/40 hover:shadow"
                        style={{ top: (start - startMin) * PX_PER_MIN, height: dur * PX_PER_MIN }}
                      >
                        <span className="block whitespace-nowrap text-[10px] font-bold tabular-nums opacity-55">
                          {TIME.format(new Date(s.scheduled_start!))}
                        </span>
                        <span className="mt-0.5 block text-sm font-black leading-tight line-clamp-2">{s.billed_name}</span>
                        <span className="mt-1 flex flex-wrap gap-1">
                          {s.set_kind !== "standard" ? (
                            <span className="inline-block rounded-full bg-black/10 px-1.5 text-[10px] font-bold">{s.set_kind}</span>
                          ) : null}
                          {songCount(s) ? (
                            <span className="inline-block rounded-full bg-emerald-100 px-1.5 text-[10px] font-bold text-emerald-800">♪ {songCount(s)}</span>
                          ) : null}
                        </span>
                      </Link>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

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
      "slug, billed_name, set_kind, is_surprise, scheduled_start, scheduled_end, billed_artist_id, stages(name, sort_order), events!inner(kind, date, edition_id), setlist_entries(count)"
    )
    .eq("events.edition_id", edition.id)
    .order("scheduled_start", { ascending: true, nullsFirst: false })
    .returns<SetRow[]>();

  const sets = rows ?? [];
  const billed = sets.filter((s) => !s.is_surprise);
  const guests = sets.filter((s) => s.is_surprise);

  // Sets we can place on a timeline (have a start time and a stage).
  const scheduled = billed.filter((s) => s.scheduled_start && s.stages);
  const unscheduled = billed.filter((s) => !s.scheduled_start || !s.stages);

  // Group timeline-eligible sets by festival day.
  const days = [...new Set(scheduled.map((s) => s.events!.date))].sort();

  // Completeness: how many sets carry a setlist or a guest (recruits contributors).
  const { data: comp } = await supabase
    .from("v_edition_completeness")
    .select("total_sets, enriched_sets")
    .eq("year", year)
    .maybeSingle<{ total_sets: number; enriched_sets: number }>();
  const pct = comp && comp.total_sets > 0 ? Math.round((comp.enriched_sets / comp.total_sets) * 100) : 0;

  return (
    <main className="mx-auto max-w-5xl p-6">
      <Link href="/archive" className="text-xs font-bold uppercase tracking-widest opacity-50 hover:opacity-80">
        ← The Archive
      </Link>
      <h1 className="mt-1 text-3xl font-black">{edition.name ?? `Newport Folk ${year}`}</h1>
      <p className="mt-1 text-sm opacity-70">
        {edition.is_cancelled
          ? "Cancelled"
          : sets.length === 0
            ? "Upcoming · lineup to be announced"
            : `${billed.length} sets`}
        {guests.length ? ` · ${guests.length} guests/surprises` : ""}
      </p>

      {!edition.is_cancelled && sets.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-black/10 p-4 text-sm opacity-75">
          The {year} lineup hasn&apos;t been announced yet. Until it is, this edition is where
          the Oracle&apos;s predictions live — check back as waves drop.
        </div>
      ) : null}

      {!edition.is_cancelled && comp ? (
        <div className="mt-4 rounded-2xl border border-black/10 p-3">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-wide opacity-55">Documented</span>
            <span className="text-xs font-bold tabular-nums opacity-55">
              {comp.enriched_sets} / {comp.total_sets} sets · {pct}%
            </span>
          </div>
          <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-black/10">
            <span className="block h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
          </span>
          <p className="mt-2 text-xs opacity-55">
            Know a setlist or a sit-in from this year? Open a set and add what you saw — every detail helps fill the archive.
          </p>
        </div>
      ) : null}

      {days.map((date) => (
        <DayTimeline key={date} year={year} date={date} sets={scheduled.filter((s) => s.events!.date === date)} />
      ))}

      {unscheduled.length ? (
        <section className="mt-8">
          {scheduled.length ? <h2 className="text-lg font-black">Also on the bill</h2> : null}
          <ul className="mt-2 divide-y divide-black/10">
            {unscheduled.map((s, i) => (
              <li key={i} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2">
                <Link href={`/archive/${year}/${s.slug}`} className="font-bold underline decoration-black/20 hover:decoration-black">
                  {s.billed_name}
                </Link>
                {s.stages?.name ? <span className="text-sm opacity-60">{s.stages.name}</span> : null}
                {s.set_kind !== "standard" ? (
                  <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs font-bold">{s.set_kind}</span>
                ) : null}
                <SetlistBadge n={songCount(s)} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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
