"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Navigates to /search?q=… on submit. Used on the archive hub and results page. */
export function SearchBox({ initial = "", autoFocus = false }: { initial?: string; autoFocus?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const v = q.trim();
        if (v) router.push(`/search?q=${encodeURIComponent(v)}`);
      }}
      className="flex gap-2"
      role="search"
    >
      <label className="sr-only" htmlFor="artist-search">
        Search artists
      </label>
      <input
        id="artist-search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus={autoFocus}
        placeholder="Search artists…"
        className="min-w-0 flex-1 rounded-full border border-black/15 bg-white px-4 py-2 text-sm outline-none focus:border-black/40"
      />
      <button type="submit" className="rounded-full bg-black px-4 py-2 text-sm font-bold text-white">
        Search
      </button>
    </form>
  );
}
