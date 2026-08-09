"use client";

import { useState, useTransition } from "react";
import { reportContent, type ReportReason } from "./actions";

const REASONS: { value: ReportReason; label: string }[] = [
  { value: "misinformation", label: "Incorrect / didn't happen" },
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "off_topic", label: "Off-topic" },
  { value: "other", label: "Other" }
];

/** Small "Report" affordance on a guest performance; expands to a compact form. */
export function ReportButton({ performanceId, year, setSlug }: { performanceId: string; year: number; setSlug: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("misinformation");
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  if (done) return <span className="text-xs opacity-45">Reported — thanks</span>;

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs underline opacity-40 hover:opacity-70">
        Report
      </button>
    );
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await reportContent({ entityTable: "performances", entityId: performanceId, reason, details, year, setSlug });
      if (!res.ok) setError(res.error);
      else setDone(true);
    });
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value as ReportReason)}
        className="rounded-lg border border-black/15 bg-white px-2 py-1 text-xs outline-none focus:border-black/40"
      >
        {REASONS.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
      <input
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        placeholder="Details (optional)"
        className="w-40 rounded-lg border border-black/15 bg-white px-2 py-1 text-xs outline-none focus:border-black/40"
      />
      <button onClick={submit} disabled={pending} className="rounded-full bg-black/80 px-2 py-1 text-xs font-bold text-white disabled:opacity-50">
        {pending ? "…" : "Send"}
      </button>
      <button onClick={() => setOpen(false)} className="text-xs opacity-45 hover:opacity-70">
        Cancel
      </button>
      {error ? <span className="text-xs text-red-700">{error}</span> : null}
    </span>
  );
}
