"use client";

import { useEffect, useMemo, useState } from "react";
import { findConflicts, getConflictTypeForSet, priorityLabel } from "@/lib/conflicts";
import { FESTIVAL_DAYS, compareSets, formatTime } from "@/lib/time";
import type { Artist, Manifest, ScheduleItem, SelectionMap, Stage } from "@/lib/schemas";

type PrintPlanState = {
  selections: SelectionMap;
  transitionBufferMinutes: number;
};

const STORAGE_KEY = "newport-folk-planner:v1";

export function PrintPlan({
  manifest,
  scheduleItems,
  artists,
  stages
}: {
  manifest: Manifest;
  scheduleItems: ScheduleItem[];
  artists: Artist[];
  stages: Stage[];
}) {
  const [plan, setPlan] = useState<PrintPlanState>({
    selections: {},
    transitionBufferMinutes: 10
  });

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PrintPlanState;
        setPlan({
          selections: parsed.selections ?? {},
          transitionBufferMinutes: parsed.transitionBufferMinutes ?? 10
        });
      }
    } catch {
      setPlan({ selections: {}, transitionBufferMinutes: 10 });
    }
  }, []);

  const artistsById = useMemo(
    () => Object.fromEntries(artists.map((artist) => [artist.id, artist])),
    [artists]
  );
  const stagesById = useMemo(
    () => Object.fromEntries(stages.map((stage) => [stage.id, stage])),
    [stages]
  );
  const selectedItems = useMemo(
    () => scheduleItems.filter((item) => plan.selections[item.id]).sort(compareSets),
    [scheduleItems, plan.selections]
  );
  const conflicts = useMemo(
    () => findConflicts(scheduleItems, plan.selections, plan.transitionBufferMinutes, stages),
    [scheduleItems, plan.selections, plan.transitionBufferMinutes, stages]
  );

  return (
    <main className="min-h-screen bg-white p-4 text-black md:p-8">
      <div className="no-print mx-auto mb-6 flex max-w-4xl flex-wrap gap-2">
        <button className="rounded-full bg-ink px-5 py-3 font-bold text-paper" onClick={() => window.print()}>
          Print / Save as PDF
        </button>
        <a className="rounded-full bg-ink/8 px-5 py-3 font-bold text-ink" href="/">
          Back to planner
        </a>
      </div>

      <section className="mx-auto max-w-4xl">
        <header className="border-b-2 border-black pb-4">
          <p className="text-sm uppercase tracking-[0.24em]">Unofficial Newport Folk plan</p>
          <h1 className="mt-2 text-4xl font-black">Pocket Plan</h1>
          <p className="mt-2 text-sm">
            Generated {new Date().toLocaleString()} · Schedule version {manifest.scheduleVersion} · Transition buffer {plan.transitionBufferMinutes} min
          </p>
          <p className="mt-2 text-sm">
            Times subject to change. Confirm critical details at {manifest.officialScheduleUrl}.
          </p>
        </header>

        {selectedItems.length === 0 ? (
          <div className="mt-8 rounded-2xl border-2 border-black p-6">
            <h2 className="text-2xl font-black">No selected acts yet.</h2>
            <p className="mt-2">Return to the planner and mark sets as Interested or Must See.</p>
          </div>
        ) : (
          FESTIVAL_DAYS.map((day) => {
            const items = selectedItems.filter((item) => item.date === day.date);
            if (!items.length) return null;
            return (
              <section key={day.date} className="break-inside-avoid border-b border-black/30 py-6">
                <h2 className="text-2xl font-black">{day.long}</h2>
                <div className="mt-3 space-y-3">
                  {items.map((item) => {
                    const artist = artistsById[item.artistId];
                    const stage = stagesById[item.stageId];
                    const conflictType = getConflictTypeForSet(item.id, conflicts);
                    return (
                      <article key={item.id} className="break-inside-avoid rounded-xl border border-black p-3">
                        <div className="grid gap-2 sm:grid-cols-[150px_1fr]">
                          <strong>{formatTime(item.start)}–{formatTime(item.end)}</strong>
                          <div>
                            <h3 className="text-xl font-black">{item.titleOverride ?? artist.name}</h3>
                            <p>{stage.name} · {priorityLabel(plan.selections[item.id])}</p>
                            {conflictType !== "none" ? (
                              <p className="font-bold">
                                Warning: {conflictType === "overlap" ? "selected overlap conflict" : "tight stage transition"}
                              </p>
                            ) : null}
                            <p className="mt-1 text-sm">{artist.shortBio}</p>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}

        <footer className="mt-6 text-sm">
          Unofficial fan-made planning tool. Not affiliated with or endorsed by Newport Festivals Foundation.
          Calendar and PDF exports are snapshots and do not automatically update.
        </footer>
      </section>
    </main>
  );
}
