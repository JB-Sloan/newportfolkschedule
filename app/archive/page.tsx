import { createClient } from "@/lib/supabase/server";

/**
 * Community-archive index for the 2026 edition. This is the first screen wired to
 * Supabase (E0-12) — it reads the seeded editions/events/sets through the server
 * client, confirming the whole path (env, client, RLS, data) works end to end.
 * The richer per-set page is E2-09.
 */
export const dynamic = "force-dynamic";

const DAY_LABEL = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  timeZone: "America/New_York"
});

const TIME_LABEL = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/New_York"
});

type SetRow = {
  billed_name: string;
  set_kind: string;
  scheduled_start: string | null;
  stages: { name: string; sort_order: number } | null;
  events: { kind: string; date: string; name: string | null } | null;
};

export default async function ArchivePage() {
  const supabase = createClient();

  const { data: edition, error: editionError } = await supabase
    .from("editions")
    .select("id, year, name, start_date, end_date, notes")
    .eq("year", 2026)
    .maybeSingle();

  if (editionError || !edition) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-black">Archive unavailable</h1>
        <p className="mt-2 text-sm opacity-70">
          {editionError?.message ?? "No 2026 edition found in the archive yet."}
        </p>
      </main>
    );
  }

  const { data: rows, error: setsError } = await supabase
    .from("sets")
    .select(
      "billed_name, set_kind, scheduled_start, stages(name, sort_order), events!inner(kind, date, name, edition_id)"
    )
    .eq("events.edition_id", edition.id)
    .order("scheduled_start", { ascending: true, nullsFirst: false })
    .returns<SetRow[]>();

  const sets = rows ?? [];
  const mainSets = sets.filter((s) => s.events?.kind === "main_stage_day");
  const aftershowSets = sets.filter((s) => s.events?.kind === "aftershow");

  const byDay = new Map<string, SetRow[]>();
  for (const s of mainSets) {
    const date = s.events!.date;
    if (!byDay.has(date)) byDay.set(date, []);
    byDay.get(date)!.push(s);
  }
  const days = [...byDay.keys()].sort();

  return (
    <main className="mx-auto max-w-4xl p-6">
      <p className="text-xs font-bold uppercase tracking-widest opacity-50">The Archive</p>
      <h1 className="mt-1 text-3xl font-black">{edition.name}</h1>
      <p className="mt-1 text-sm opacity-70">
        {edition.start_date} – {edition.end_date} · {mainSets.length} sets · {aftershowSets.length} aftershows
      </p>

      {setsError ? (
        <p className="mt-4 rounded-lg bg-red-100 p-3 text-sm text-red-800">{setsError.message}</p>
      ) : null}

      {days.map((date) => {
        const daySets = byDay.get(date)!.sort((a, b) => {
          const so = (a.stages?.sort_order ?? 99) - (b.stages?.sort_order ?? 99);
          if (so !== 0) return so;
          return (a.scheduled_start ?? "").localeCompare(b.scheduled_start ?? "");
        });
        return (
          <section key={date} className="mt-8">
            <h2 className="text-xl font-black">{DAY_LABEL.format(new Date(`${date}T12:00:00-04:00`))}</h2>
            <ul className="mt-3 divide-y divide-black/10">
              {daySets.map((s, i) => (
                <li key={i} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2">
                  <span className="w-16 shrink-0 text-sm tabular-nums opacity-60">
                    {s.scheduled_start ? TIME_LABEL.format(new Date(s.scheduled_start)) : "—"}
                  </span>
                  <span className="font-bold">{s.billed_name}</span>
                  <span className="text-sm opacity-60">{s.stages?.name ?? "TBA"}</span>
                  {s.set_kind !== "standard" ? (
                    <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs font-bold">{s.set_kind}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {aftershowSets.length ? (
        <section className="mt-8">
          <h2 className="text-xl font-black">Aftershows</h2>
          <ul className="mt-3 divide-y divide-black/10">
            {aftershowSets.map((s, i) => (
              <li key={i} className="flex flex-wrap items-baseline gap-x-3 py-2">
                <span className="font-bold">{s.billed_name}</span>
                <span className="text-sm opacity-60">
                  {s.events?.date} · {s.events?.name?.replace(/^Newport Folk Aftershow:\s*/, "")}
                </span>
                {s.set_kind !== "standard" ? (
                  <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs font-bold">{s.set_kind}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
