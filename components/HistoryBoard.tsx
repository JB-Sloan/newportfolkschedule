"use client";

import { useMemo, useState } from "react";
import type { HistoricalYear } from "@/lib/schemas";
import type { ArtistHistorySummary } from "@/lib/history";

function classNames(...values: Array<string | false | undefined>) {
  return values.filter(Boolean).join(" ");
}

function RankBadge({ rank }: { rank: number }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink/8 font-black tabular-nums">
      {rank}
    </span>
  );
}

function YearChips({ years, cancelledYear }: { years: number[]; cancelledYear?: number }) {
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {years.map((year) => (
        <span key={year} className="rounded-full bg-paper px-2 py-0.5 text-xs font-bold tabular-nums text-ink/70">
          {year}
        </span>
      ))}
      {cancelledYear ? (
        <span className="rounded-full bg-ink/5 px-2 py-0.5 text-xs font-bold text-ink/40 line-through" title="Festival cancelled">
          {cancelledYear}
        </span>
      ) : null}
    </div>
  );
}

function ArtistHistoryRow({
  rank,
  summary,
  expanded,
  onToggle,
  onOpenArtist
}: {
  rank: number;
  summary: ArtistHistorySummary;
  expanded: boolean;
  onToggle: () => void;
  onOpenArtist: (artistId: string) => void;
}) {
  return (
    <div className="rounded-2xl bg-paper p-3">
      <button className="flex w-full items-start gap-3 text-left" onClick={onToggle}>
        <RankBadge rank={rank} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-black">{summary.name}</span>
            {summary.artistId ? (
              <span className="rounded-full bg-bay/15 px-2 py-0.5 text-xs font-bold text-bay">2026 lineup</span>
            ) : null}
          </div>
          <p className="mt-0.5 text-sm text-ink/60">
            {summary.totalAppearances} {summary.totalAppearances === 1 ? "appearance" : "appearances"} across{" "}
            {summary.years.length} {summary.years.length === 1 ? "year" : "years"}
            {summary.billedCount ? ` · ${summary.billedCount} billed` : ""}
            {summary.guestCount ? ` · ${summary.guestCount} guest sit-in${summary.guestCount === 1 ? "" : "s"}` : ""}
          </p>
          <YearChips years={summary.years} />
        </div>
        <span className="mt-1 shrink-0 text-ink/40">{expanded ? "−" : "+"}</span>
      </button>
      {expanded ? (
        <div className="mt-3 space-y-1.5 border-t border-ink/10 pt-3">
          {summary.records.map((record, index) => (
            <div key={`${record.year}-${index}`} className="flex items-start gap-2 text-sm">
              <span className="w-12 shrink-0 font-mono font-bold text-ink/50 tabular-nums">{record.year}</span>
              <span className="flex-1">
                <span
                  className={classNames(
                    "mr-1.5 rounded-full px-2 py-0.5 text-xs font-bold",
                    record.role === "billed" ? "bg-bay/15 text-bay" : "bg-quad/15 text-quad"
                  )}
                >
                  {record.role === "billed" ? "Billed" : "Guest"}
                </span>
                {record.notes ? <span className="text-ink/70">{record.notes}</span> : null}
              </span>
            </div>
          ))}
          {summary.artistId ? (
            <button
              className="mt-2 rounded-full bg-ink/8 px-3 py-1.5 text-xs font-bold hover:bg-ink/15"
              onClick={() => onOpenArtist(summary.artistId!)}
            >
              View 2026 set →
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function HistoryBoard({
  historicalYears,
  historySummaries,
  onOpenArtist
}: {
  historicalYears: HistoricalYear[];
  historySummaries: ArtistHistorySummary[];
  onOpenArtist: (artistId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [expandedKey, setExpandedKey] = useState<string | undefined>();
  const [onlyReturning, setOnlyReturning] = useState(false);
  const [onlyLineup, setOnlyLineup] = useState(false);

  const years = historicalYears.filter((year) => !year.cancelled).map((year) => year.year);
  const cancelledYear = historicalYears.find((year) => year.cancelled)?.year;
  const span = years.length ? `${Math.min(...years)}–${Math.max(...years)}` : "";

  const ranked = useMemo(
    () => historySummaries.map((summary, index) => ({ summary, rank: index + 1 })),
    [historySummaries]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return ranked
      .filter(({ summary }) => !onlyReturning || summary.years.length > 1)
      .filter(({ summary }) => !onlyLineup || summary.artistId)
      .filter(({ summary }) => !query || summary.name.toLowerCase().includes(query));
  }, [ranked, search, onlyReturning, onlyLineup]);

  const returningCount = historySummaries.filter((summary) => summary.years.length > 1).length;
  const lineupOverlapCount = historySummaries.filter((summary) => summary.artistId).length;

  return (
    <section className="space-y-4">
      <div className="rounded-3xl bg-white p-5 shadow-soft">
        <h2 className="text-2xl font-black">Newport Folk history, {span}</h2>
        <p className="mt-1 text-ink/60">
          Every billed act and known guest sit-in from the last ten festivals, counted up so you can see who keeps
          coming back to Fort Adams.
          {cancelledYear ? ` ${cancelledYear} is excluded — the festival was cancelled that year.` : ""}
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-paper p-3">
            <strong className="block text-2xl tabular-nums">{historySummaries.length}</strong>
            <span className="text-xs">distinct acts</span>
          </div>
          <div className="rounded-2xl bg-paper p-3">
            <strong className="block text-2xl tabular-nums">{returningCount}</strong>
            <span className="text-xs">played more than once</span>
          </div>
          <div className="rounded-2xl bg-paper p-3">
            <strong className="block text-2xl tabular-nums">{lineupOverlapCount}</strong>
            <span className="text-xs">also on 2026 bill</span>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-4 shadow-soft">
        <label className="block">
          <span className="sr-only">Search history</span>
          <input
            className="min-h-12 w-full rounded-2xl border border-ink/15 bg-paper px-4 outline-none focus:border-bay"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search an artist's Newport history…"
          />
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className={classNames("rounded-full px-4 py-2 font-bold", onlyReturning ? "bg-ink text-paper" : "bg-ink/6")}
            onClick={() => setOnlyReturning((value) => !value)}
          >
            Returning acts only
          </button>
          <button
            className={classNames("rounded-full px-4 py-2 font-bold", onlyLineup ? "bg-ink text-paper" : "bg-ink/6")}
            onClick={() => setOnlyLineup((value) => !value)}
          >
            On 2026 bill
          </button>
        </div>
      </div>

      <div className="space-y-2 rounded-3xl bg-white p-4 shadow-soft">
        {filtered.length === 0 ? (
          <p className="p-4 text-center text-ink/60">No history matches those filters.</p>
        ) : (
          filtered.map(({ summary, rank }) => (
            <ArtistHistoryRow
              key={summary.key}
              rank={rank}
              summary={summary}
              expanded={expandedKey === summary.key}
              onToggle={() => setExpandedKey((current) => (current === summary.key ? undefined : summary.key))}
              onOpenArtist={onOpenArtist}
            />
          ))
        )}
      </div>

      <p className="px-1 text-xs text-ink/50">
        Compiled from the festival&rsquo;s official year-by-year lineups and press coverage of surprise sit-ins.
        &ldquo;Guest&rdquo; means the act joined someone else&rsquo;s set rather than playing its own; it is not a
        comprehensive record of every unannounced walk-on.
      </p>
    </section>
  );
}
