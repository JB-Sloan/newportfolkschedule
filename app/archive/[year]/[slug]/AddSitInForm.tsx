"use client";

import { useState, useTransition } from "react";
import { addSitIn, type GuestRole } from "./actions";

const ROLE_OPTIONS: { value: GuestRole; label: string }[] = [
  { value: "sit_in", label: "Sit-in (played an instrument)" },
  { value: "guest_vocal", label: "Guest vocal" },
  { value: "surprise_guest", label: "Surprise guest" }
];

/**
 * Submit a guest/sit-in on a set. New submissions are pending review, so the
 * page revalidates and shows them with a "pending" badge; they only join the
 * public sit-in graph once a moderator confirms.
 */
export function AddSitInForm({ setId, year, setSlug }: { setId: string; year: number; setSlug: string }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState<GuestRole>("sit_in");
  const [instruments, setInstruments] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const value = name.trim();
    if (!value) {
      setError("Enter the guest's name.");
      return;
    }
    startTransition(async () => {
      const res = await addSitIn({ setId, year, setSlug, guestName: value, role, instruments, sourceUrl });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setJustAdded(value);
      setName("");
      setInstruments("");
      setRole("sit_in");
      setSourceUrl("");
    });
  }

  return (
    <form onSubmit={submit} className="mt-3 rounded-2xl border border-black/10 p-3">
      <p className="text-xs font-bold uppercase tracking-wide opacity-50">Add a guest / sit-in</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setJustAdded(null);
          }}
          placeholder="Guest artist name"
          className="min-w-0 flex-1 rounded-xl border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-black/40"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as GuestRole)}
          className="rounded-xl border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-black/40"
        >
          {ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <input
        value={instruments}
        onChange={(e) => setInstruments(e.target.value)}
        placeholder="Instruments (optional, comma-separated)"
        className="mt-2 w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-black/40"
      />
      <input
        type="url"
        value={sourceUrl}
        onChange={(e) => setSourceUrl(e.target.value)}
        placeholder="Source link (optional) — where did you see this?"
        className="mt-2 w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-black/40"
      />
      <div className="mt-2 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-black px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {pending ? "Submitting…" : "Submit sit-in"}
        </button>
        <span className="text-xs opacity-45">Pending review before it joins the sit-in graph.</span>
      </div>
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
      {justAdded ? <p className="mt-2 text-sm text-emerald-700">Submitted “{justAdded}.” Thanks — it’s pending review.</p> : null}
    </form>
  );
}
