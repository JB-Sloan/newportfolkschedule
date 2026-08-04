"use client";

import { useState, useTransition } from "react";
import { addSong } from "./actions";

/**
 * Inline setlist contributor: a signed-in user adds a song to this set. On
 * success the server action revalidates the page, so the new entry appears in
 * the list above without a manual refresh.
 */
export function AddSongForm({ setId, year, setSlug }: { setId: string; year: number; setSlug: string }) {
  const [title, setTitle] = useState("");
  const [isCover, setIsCover] = useState(false);
  const [isEncore, setIsEncore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const value = title.trim();
    if (!value) {
      setError("Enter a song title.");
      return;
    }
    startTransition(async () => {
      const res = await addSong({ setId, year, setSlug, title: value, isCover, isEncore });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setJustAdded(value);
      setTitle("");
      setIsCover(false);
      setIsEncore(false);
    });
  }

  return (
    <form onSubmit={submit} className="mt-3 rounded-2xl border border-black/10 p-3">
      <p className="text-xs font-bold uppercase tracking-wide opacity-50">Add a song</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setJustAdded(null);
          }}
          placeholder="Song title"
          className="min-w-0 flex-1 rounded-xl border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-black/40"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-black px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {pending ? "Adding…" : "Add"}
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={isCover} onChange={(e) => setIsCover(e.target.checked)} />
          Cover
        </label>
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={isEncore} onChange={(e) => setIsEncore(e.target.checked)} />
          Encore
        </label>
      </div>
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
      {justAdded ? <p className="mt-2 text-sm text-emerald-700">Added “{justAdded}.” Thanks!</p> : null}
    </form>
  );
}
