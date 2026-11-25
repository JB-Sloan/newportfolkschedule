"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  addArtists,
  deleteWave,
  previewLineup,
  recordWave,
  removeAnnouncement,
  updateWave,
  type PreviewRow,
  type WaveDetails
} from "./actions";

const FIELD = "mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-black/40";
const PRIMARY = "rounded-xl bg-black px-4 py-2 text-sm font-bold text-white disabled:opacity-40";
const QUIET = "rounded-xl bg-black/5 px-3 py-2 text-sm font-bold hover:bg-black/10 disabled:opacity-40";

export type Wave = {
  id: string;
  wave_number: number;
  announced_at: string;
  source_url: string | null;
  notes: string | null;
  artists: { id: string; name: string; billedName: string | null }[];
};

/** ISO instant -> value for <input type="datetime-local"> in the viewer's zone. */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function ErrorNote({ text }: { text: string | null }) {
  return text ? (
    <p role="alert" className="rounded-lg bg-red-100 p-2 text-sm text-red-800">
      {text}
    </p>
  ) : null;
}

function DetailsForm({
  initial,
  submitLabel,
  busyLabel,
  note,
  onSubmit,
  onCancel
}: {
  initial: { announcedAt: string | null; sourceUrl: string; notes: string };
  submitLabel: string;
  busyLabel: string;
  note?: string;
  onSubmit: (d: WaveDetails) => Promise<{ ok: true } | { ok: false; error: string }>;
  onCancel: () => void;
}) {
  const [when, setWhen] = useState("");
  const [sourceUrl, setSourceUrl] = useState(initial.sourceUrl);
  const [notes, setNotes] = useState(initial.notes);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Local time is only known in the browser, so fill it after mount.
  useEffect(() => {
    setWhen(toLocalInput(initial.announcedAt ?? new Date().toISOString()));
  }, [initial.announcedAt]);

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        // Untouched minutes-precision input shouldn't shift the stored instant.
        const unchanged = initial.announcedAt && when === toLocalInput(initial.announcedAt);
        const announcedAt = unchanged ? (initial.announcedAt as string) : when ? new Date(when).toISOString() : "";
        startTransition(async () => {
          const res = await onSubmit({ announcedAt, sourceUrl, notes });
          if (!res.ok) setError(res.error);
        });
      }}
    >
      <label className="block text-sm font-bold">
        When it was announced (your local time)
        <input type="datetime-local" required value={when} onChange={(e) => setWhen(e.target.value)} className={FIELD} />
      </label>
      <label className="block text-sm font-bold">
        Source link
        <input
          type="url"
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          placeholder="https://…"
          className={FIELD}
        />
      </label>
      <label className="block text-sm font-bold">
        Notes
        <textarea value={notes} maxLength={1000} rows={2} onChange={(e) => setNotes(e.target.value)} className={FIELD} />
      </label>
      {note ? <p className="rounded-lg bg-sunset/10 p-2 text-sm">{note}</p> : null}
      <ErrorNote text={error} />
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={PRIMARY}>
          {pending ? busyLabel : submitLabel}
        </button>
        <button type="button" disabled={pending} onClick={onCancel} className={QUIET}>
          Cancel
        </button>
      </div>
    </form>
  );
}

/** Start a new wave. Opens into a confirmable form because wave 1 ends bingo. */
export function NewWave({ editionId, year, isFirst }: { editionId: string; year: number; isFirst: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={PRIMARY}>
        Record {isFirst ? "the first" : "another"} wave
      </button>
    );
  }
  return (
    <section aria-label="New wave" className="rounded-2xl border border-black/15 p-4">
      <h2 className="mb-3 text-lg font-black">New wave</h2>
      <DetailsForm
        initial={{ announcedAt: null, sourceUrl: "", notes: "" }}
        submitLabel={isFirst ? "Record wave and close bingo" : "Record wave"}
        busyLabel="Recording…"
        note={isFirst ? `This closes ${year} bingo right away. You can add the artists next.` : undefined}
        onCancel={() => setOpen(false)}
        onSubmit={async (d) => {
          const res = await recordWave({ editionId, ...d });
          if (res.ok) {
            setOpen(false);
            router.refresh();
          }
          return res;
        }}
      />
    </section>
  );
}

export function WaveCard({ wave, onlyWave, year }: { wave: Wave; onlyWave: boolean; year: number }) {
  const router = useRouter();
  const [mode, setMode] = useState<"view" | "edit" | "delete">("view");
  const [error, setError] = useState<string | null>(null);
  const [announced, setAnnounced] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setAnnounced(new Date(wave.announced_at).toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" }));
  }, [wave.announced_at]);

  function run(action: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <li className="rounded-2xl border border-black/10 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-black">Wave {wave.wave_number}</h2>
        {mode === "view" ? (
          <span className="flex gap-3 text-xs font-bold">
            <button type="button" onClick={() => setMode("edit")} className="underline opacity-60 hover:opacity-100">
              Edit details
            </button>
            <button type="button" onClick={() => setMode("delete")} className="underline opacity-60 hover:opacity-100">
              Delete wave
            </button>
          </span>
        ) : null}
      </div>

      {mode === "edit" ? (
        <div className="mt-3">
          <DetailsForm
            initial={{ announcedAt: wave.announced_at, sourceUrl: wave.source_url ?? "", notes: wave.notes ?? "" }}
            submitLabel="Save details"
            busyLabel="Saving…"
            onCancel={() => setMode("view")}
            onSubmit={async (d) => {
              const res = await updateWave({ waveId: wave.id, ...d });
              if (res.ok) {
                setMode("view");
                router.refresh();
              }
              return res;
            }}
          />
        </div>
      ) : (
        <div className="mt-1 text-sm opacity-75">
          <p>
            <time dateTime={wave.announced_at}>{announced}</time>
            {wave.source_url ? (
              <>
                {" · "}
                <a href={wave.source_url} target="_blank" rel="noreferrer" className="underline">
                  Source
                </a>
              </>
            ) : null}
          </p>
          {wave.notes ? <p className="mt-1 whitespace-pre-line">{wave.notes}</p> : null}
        </div>
      )}

      {mode === "delete" ? (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          <p className="font-bold">Delete wave {wave.wave_number}?</p>
          <p className="mt-1">
            {wave.artists.length
              ? `This also removes its ${wave.artists.length} announced ${wave.artists.length === 1 ? "artist" : "artists"}. `
              : ""}
            {onlyWave ? `It's the only wave, so ${year} bingo will reopen.` : "Bingo stays closed."}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => deleteWave({ waveId: wave.id }))}
              className="rounded-xl bg-red-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
            >
              {pending ? "Deleting…" : "Delete wave"}
            </button>
            <button type="button" disabled={pending} onClick={() => setMode("view")} className={QUIET}>
              Keep it
            </button>
          </div>
        </div>
      ) : null}

      <p className="mt-4 text-sm font-bold">
        {wave.artists.length} announced {wave.artists.length === 1 ? "artist" : "artists"}
      </p>
      {wave.artists.length ? (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {wave.artists.map((a) => (
            <li key={a.id} className="inline-flex items-center gap-1 rounded-full bg-black/5 py-1 pl-2.5 pr-1 text-xs font-bold">
              <span title={a.billedName && a.billedName !== a.name ? `Billed as ${a.billedName}` : undefined}>{a.name}</span>
              <button
                type="button"
                disabled={pending}
                aria-label={`Remove ${a.name}`}
                onClick={() => run(() => removeAnnouncement({ announcementId: a.id }))}
                className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-black/10 disabled:opacity-40"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-2">
        <ErrorNote text={error} />
      </div>
      <AddArtists waveId={wave.id} />
    </li>
  );
}

const NEW = "new";
const SKIP = "skip";
const UNSET = "";

function AddArtists({ waveId }: { waveId: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [rows, setRows] = useState<PreviewRow[] | null>(null);
  const [choices, setChoices] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function check() {
    setError(null);
    setStatus(null);
    startTransition(async () => {
      const res = await previewLineup({ waveId, text });
      if (!res.ok) return setError(res.error);
      setRows(res.rows);
      // Anything with a near match needs a person to decide.
      setChoices(res.rows.map((r) => (r.alreadyAnnounced ? SKIP : r.match ? r.match.id : r.suggestions.length ? UNSET : NEW)));
    });
  }

  function add() {
    if (!rows) return;
    setError(null);
    const entries = rows.flatMap((r, i) =>
      choices[i] === SKIP ? [] : [{ name: r.name, artistId: choices[i] === NEW ? null : choices[i] }]
    );
    startTransition(async () => {
      const res = await addArtists({ waveId, entries });
      if (!res.ok) return setError(res.error);
      setRows(null);
      setText("");
      setStatus(
        `Added ${res.added} ${res.added === 1 ? "artist" : "artists"}.` +
          (res.skipped ? ` Skipped ${res.skipped} already announced.` : "")
      );
      router.refresh();
    });
  }

  if (!rows) {
    return (
      <div className="mt-3 space-y-2">
        <label className="block text-sm font-bold">
          Add artists, one per line
          <textarea value={text} rows={4} disabled={pending} onChange={(e) => setText(e.target.value)} className={FIELD} />
        </label>
        <ErrorNote text={error} />
        {status ? (
          <p role="status" className="rounded-lg bg-emerald-50 p-2 text-sm text-emerald-900">
            {status}
          </p>
        ) : null}
        <button type="button" disabled={pending || !text.trim()} onClick={check} className={QUIET}>
          {pending ? "Checking…" : "Check names"}
        </button>
      </div>
    );
  }

  const undecided = choices.filter((c) => c === UNSET).length;
  const adding = choices.filter((c) => c !== SKIP && c !== UNSET).length;
  const created = choices.filter((c) => c === NEW).length;

  return (
    <div className="mt-3 space-y-3">
      <ul className="divide-y divide-black/10 rounded-xl border border-black/10">
        {rows.map((r, i) => (
          <li key={r.name} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
            <span className="min-w-0 font-bold [overflow-wrap:anywhere]">{r.name}</span>
            {r.alreadyAnnounced ? (
              <span className="text-xs opacity-60">Already announced</span>
            ) : (
              <select
                aria-label={`Match for ${r.name}`}
                value={choices[i]}
                disabled={pending}
                onChange={(e) => setChoices(choices.map((c, j) => (j === i ? e.target.value : c)))}
                className={`max-w-full rounded-lg border bg-white px-2 py-1 text-xs ${choices[i] === UNSET ? "border-sunset" : "border-black/15"}`}
              >
                {choices[i] === UNSET ? <option value={UNSET}>Choose a match…</option> : null}
                {r.match ? <option value={r.match.id}>In the archive: {r.match.name}</option> : null}
                {r.suggestions.map((s) => (
                  <option key={s.id} value={s.id}>
                    Same as {s.name}
                  </option>
                ))}
                {r.match ? null : <option value={NEW}>New artist</option>}
                <option value={SKIP}>Leave out</option>
              </select>
            )}
          </li>
        ))}
      </ul>
      <p className="text-sm opacity-75">
        {undecided
          ? `${undecided} ${undecided === 1 ? "name needs" : "names need"} a decision: close to an artist already in the archive.`
          : created
            ? `${created} new ${created === 1 ? "artist" : "artists"} will be created in the archive.`
            : "Every name is already in the archive."}
      </p>
      <ErrorNote text={error} />
      <div className="flex gap-2">
        <button type="button" disabled={pending || undecided > 0 || adding === 0} onClick={add} className={PRIMARY}>
          {pending ? "Adding…" : `Add ${adding} ${adding === 1 ? "artist" : "artists"}`}
        </button>
        <button type="button" disabled={pending} onClick={() => setRows(null)} className={QUIET}>
          Back
        </button>
      </div>
    </div>
  );
}
