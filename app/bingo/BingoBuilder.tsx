"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { escapeLike, rankByName } from "@/lib/artist-search";
import {
  countPicks,
  emptySlots,
  FREE_POSITION,
  MAX_NAME,
  MAX_TITLE,
  nextEmpty,
  PICKS_NEEDED,
  samePick,
  sanitizeSlots,
  shuffleSlots,
  type Pick,
  type Slots
} from "@/lib/bingo";
import { createClient } from "@/lib/supabase/client";
import { lockBingoCard, saveBingoDraft } from "./actions";

type Draft = { title: string; isPublic: boolean; slots: Slots };
type Hit = { id: string; name: string; is_newport_alum: boolean };

/**
 * Pick 24 artists for the upcoming lineup. Anyone can build: the draft lives in
 * localStorage until they sign in, then it can be saved to their account and
 * locked. Once there's a saved draft, it's what later visits start from unless
 * this browser holds unsaved changes.
 */
export function BingoBuilder({
  editionId,
  year,
  signedIn,
  savedDraft,
  suggestions
}: {
  editionId: string;
  year: number;
  signedIn: boolean;
  savedDraft: Draft | null;
  suggestions: { id: string; name: string }[];
}) {
  const router = useRouter();
  const storageKey = `bingo-draft-${year}`;
  const [draft, setDraft] = useState<Draft>(savedDraft ?? { title: "", isPublic: true, slots: emptySlots() });
  const [loaded, setLoaded] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [selected, setSelected] = useState(0);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [searchedFor, setSearchedFor] = useState("");
  const [active, setActive] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const { slots, title, isPublic } = draft;
  const filled = countPicks(slots);
  const full = filled === PICKS_NEEDED;

  // Restore unsaved work from this browser, if any.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const stored = JSON.parse(raw) as Partial<Draft>;
        const restored: Draft = {
          title: String(stored.title ?? "").slice(0, MAX_TITLE),
          isPublic: stored.isPublic !== false,
          slots: sanitizeSlots(stored.slots)
        };
        if (countPicks(restored.slots) || !savedDraft) {
          setDraft(restored);
          setSelected(Math.max(0, nextEmpty(restored.slots)));
          setDirty(true);
          setLoaded(true);
          return;
        }
      }
    } catch {
      // Storage blocked or corrupt: start from the saved draft.
    }
    if (savedDraft) setSelected(Math.max(0, nextEmpty(savedDraft.slots)));
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restore once on mount
  }, []);

  function forgetLocal() {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  }

  function change(next: Partial<Draft>) {
    const merged = { ...draft, ...next };
    setDraft(merged);
    setDirty(true);
    setConfirming(false);
    setMessage(null);
    try {
      localStorage.setItem(storageKey, JSON.stringify(merged));
    } catch {
      // ignore
    }
  }

  // Debounced autocomplete over the public artists table.
  const term = q.trim();
  useEffect(() => {
    if (term.length < 2) {
      setHits([]);
      setSearchedFor("");
      return;
    }
    let stale = false;
    const timer = setTimeout(async () => {
      const { data } = await createClient()
        .from("artists")
        .select("id, name, is_newport_alum")
        .eq("status", "visible")
        .ilike("name", `%${escapeLike(term)}%`)
        .limit(40)
        .returns<Hit[]>();
      if (stale) return;
      setHits(rankByName(data ?? [], term).slice(0, 8));
      setSearchedFor(term);
      setActive(0);
    }, 200);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [term]);

  const ready = term.length >= 2 && searchedFor === term;
  const exact = hits.some((h) => h.name.toLowerCase() === term.toLowerCase());
  const options: (Pick & { alum?: boolean })[] = ready
    ? [
        ...hits.map((h) => ({ id: h.id, name: h.name, alum: h.is_newport_alum })),
        ...(exact || term.length > MAX_NAME ? [] : [{ name: term.replace(/\s+/g, " ") }])
      ]
    : [];

  const onCard = (p: Pick) => slots.findIndex((s) => s !== null && samePick(s, p));

  function place(p: Pick) {
    const at = onCard(p);
    if (at >= 0 && at !== selected) {
      setMessage({ kind: "error", text: `${p.name} is already on your card.` });
      return;
    }
    const next = [...slots];
    next[selected] = p.id ? { id: p.id, name: p.name } : { name: p.name };
    change({ slots: next });
    const empty = nextEmpty(next, selected + 1);
    if (empty >= 0) setSelected(empty);
    setQ("");
    inputRef.current?.focus();
  }

  function clearSelected() {
    const next = [...slots];
    next[selected] = null;
    change({ slots: next });
  }

  function save() {
    setMessage(null);
    startTransition(async () => {
      const res = await saveBingoDraft({ editionId, ...draft });
      if (!res.ok) return setMessage({ kind: "error", text: res.error });
      forgetLocal();
      setDirty(false);
      setMessage({ kind: "ok", text: "Draft saved to your account." });
    });
  }

  function lock() {
    setMessage(null);
    startTransition(async () => {
      const res = await lockBingoCard({ editionId, ...draft });
      if (!res.ok) {
        setConfirming(false);
        return setMessage({ kind: "error", text: res.error });
      }
      forgetLocal();
      router.push(`/bingo/card/${res.cardId}`);
    });
  }

  const row = Math.floor(selected / 5) + 1;
  const col = (selected % 5) + 1;
  const current = slots[selected];
  const unusedSuggestions = suggestions.filter((s) => onCard(s) < 0).slice(0, 10);
  const busy = pending || !loaded;

  return (
    <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1fr)_18rem]">
      <section aria-label="Your card" className="min-w-0">
        <div className="grid grid-cols-5 gap-1 sm:gap-2">
          {slots.map((s, i) =>
            i === FREE_POSITION ? (
              <div
                key={i}
                className="flex aspect-square items-center justify-center rounded-lg bg-sunset/15 text-xs font-black uppercase tracking-wide text-quad sm:rounded-xl"
              >
                Free
              </div>
            ) : (
              <button
                key={i}
                type="button"
                disabled={busy}
                aria-pressed={i === selected}
                aria-label={`Row ${Math.floor(i / 5) + 1}, column ${(i % 5) + 1}: ${s ? s.name : "empty"}`}
                onClick={() => {
                  setSelected(i);
                  inputRef.current?.focus();
                }}
                className={`flex aspect-square min-w-0 items-center justify-center overflow-hidden rounded-lg border p-0.5 text-center text-[10px] font-bold leading-tight [overflow-wrap:anywhere] sm:rounded-xl sm:p-1.5 sm:text-xs ${
                  i === selected ? "border-bay bg-white ring-2 ring-bay" : "border-black/15 hover:border-black/40"
                } ${s ? "bg-white" : "border-dashed"}`}
              >
                <span className="line-clamp-4" title={s?.name}>
                  {s ? s.name : <span className="text-lg font-normal opacity-30">+</span>}
                </span>
              </button>
            )
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="font-bold tabular-nums">
            {filled} of {PICKS_NEEDED} picked
          </span>
          <button
            type="button"
            disabled={busy || filled < 2}
            onClick={() => change({ slots: shuffleSlots(slots) })}
            className="ml-auto rounded-full bg-black/5 px-3 py-1 font-bold hover:bg-black/10 disabled:opacity-40"
          >
            Shuffle squares
          </button>
        </div>
      </section>

      <section aria-label="Pick artists" className="min-w-0 space-y-5">
        <div>
          <label htmlFor="bingo-search" className="text-sm font-bold">
            {current ? `Replace ${current.name}` : "Add an artist"}
            <span className="ml-1 font-normal opacity-60">
              (row {row}, column {col})
            </span>
          </label>
          <input
            id="bingo-search"
            ref={inputRef}
            value={q}
            disabled={busy}
            autoComplete="off"
            role="combobox"
            aria-expanded={options.length > 0}
            aria-controls="bingo-options"
            aria-autocomplete="list"
            aria-activedescendant={options.length ? `bingo-option-${active}` : undefined}
            onChange={(e) => {
              setQ(e.target.value);
              setMessage(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") setQ("");
              if (!options.length) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((active + 1) % options.length);
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((active - 1 + options.length) % options.length);
              } else if (e.key === "Enter") {
                e.preventDefault();
                place(options[active]);
              }
            }}
            placeholder="Type an artist's name…"
            className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-2 outline-none focus:border-black/40"
          />
          {options.length ? (
            <ul id="bingo-options" role="listbox" aria-label="Matching artists" className="mt-1 overflow-hidden rounded-xl border border-black/15 bg-white">
              {options.map((o, i) => {
                const used = onCard(o) >= 0;
                return (
                  <li
                    key={o.id ?? "write-in"}
                    id={`bingo-option-${i}`}
                    role="option"
                    aria-selected={i === active}
                    aria-disabled={used}
                    onMouseEnter={() => setActive(i)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => place(o)}
                    className={`flex cursor-pointer items-baseline justify-between gap-2 px-3 py-2 text-sm ${i === active ? "bg-black/5" : ""} ${used ? "opacity-40" : ""}`}
                  >
                    <span className="min-w-0 font-bold [overflow-wrap:anywhere]">{o.id ? o.name : `Write in “${o.name}”`}</span>
                    <span className="shrink-0 text-xs opacity-60">
                      {used ? "On your card" : o.alum ? "Newport alum" : o.id ? "" : "Not in the archive"}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : null}
          {current ? (
            <button type="button" disabled={busy} onClick={clearSelected} className="mt-2 text-xs font-bold underline opacity-60 hover:opacity-100">
              Clear this square
            </button>
          ) : null}
        </div>

        {!full && unusedSuggestions.length ? (
          <div>
            <p className="text-xs font-bold uppercase tracking-wide opacity-55">Fans have asked for</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {unusedSuggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  disabled={busy}
                  onClick={() => place(s)}
                  className="rounded-full bg-black/5 px-2.5 py-1 text-xs font-bold hover:bg-black/10"
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="space-y-3 border-t border-black/10 pt-4">
          <label className="block">
            <span className="text-sm font-bold">Card name</span>
            <input
              value={title}
              disabled={busy}
              maxLength={MAX_TITLE}
              onChange={(e) => change({ title: e.target.value })}
              placeholder={`My ${year} card`}
              className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-2 outline-none focus:border-black/40"
            />
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={isPublic}
              disabled={busy}
              onChange={(e) => change({ isPublic: e.target.checked })}
              className="mt-1"
            />
            <span>Let anyone see my card once it&apos;s locked</span>
          </label>

          {message ? (
            <p
              role={message.kind === "error" ? "alert" : "status"}
              className={`rounded-lg p-2 text-sm ${message.kind === "error" ? "bg-red-100 text-red-800" : "bg-emerald-50 text-emerald-900"}`}
            >
              {message.text}
            </p>
          ) : null}

          {!signedIn ? (
            <div className="rounded-xl border border-black/10 p-3 text-sm">
              <p>Your picks are kept in this browser. Sign in to save and lock them.</p>
              <Link href="/login?next=/bingo" className="mt-2 block rounded-xl bg-black px-4 py-2.5 text-center font-bold text-white">
                Sign in
              </Link>
            </div>
          ) : confirming ? (
            <div className="rounded-xl border border-sunset/50 bg-sunset/10 p-3 text-sm">
              <p className="font-bold">Lock this card?</p>
              <p className="mt-1">You can&apos;t change your picks afterward.</p>
              <div className="mt-3 flex gap-2">
                <button type="button" disabled={busy} onClick={lock} className="flex-1 rounded-xl bg-black px-3 py-2 font-bold text-white disabled:opacity-50">
                  {pending ? "Locking…" : "Lock card"}
                </button>
                <button type="button" disabled={busy} onClick={() => setConfirming(false)} className="rounded-xl bg-black/5 px-3 py-2 font-bold hover:bg-black/10">
                  Keep editing
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy || !dirty}
                onClick={save}
                className="flex-1 rounded-xl bg-black/5 px-3 py-2.5 font-bold hover:bg-black/10 disabled:opacity-40"
              >
                {pending ? "Saving…" : "Save draft"}
              </button>
              <button
                type="button"
                disabled={busy || !full}
                onClick={() => setConfirming(true)}
                className="flex-1 rounded-xl bg-black px-3 py-2.5 font-bold text-white disabled:opacity-40"
              >
                Lock card
              </button>
            </div>
          )}
          {signedIn && !full ? <p className="text-xs opacity-60">Fill all {PICKS_NEEDED} squares to lock your card.</p> : null}
        </div>
      </section>
    </div>
  );
}
