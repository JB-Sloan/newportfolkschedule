"use client";

import { useState, useTransition } from "react";
import { resolveReport } from "./actions";

/** Actioned / Dismiss buttons for one open report. */
export function ReportActions({ reportId }: { reportId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<"actioned" | "dismissed" | null>(null);

  function resolve(status: "actioned" | "dismissed") {
    setError(null);
    startTransition(async () => {
      const res = await resolveReport({ reportId, status });
      if (!res.ok) setError(res.error);
      else setDone(status);
    });
  }

  if (done) return <span className="text-xs font-bold opacity-60">{done === "actioned" ? "Actioned ✓" : "Dismissed"}</span>;

  return (
    <span className="inline-flex items-center gap-2">
      <button
        onClick={() => resolve("actioned")}
        disabled={pending}
        className="rounded-full bg-black/80 px-3 py-1 text-xs font-bold text-white disabled:opacity-50"
      >
        Actioned
      </button>
      <button
        onClick={() => resolve("dismissed")}
        disabled={pending}
        className="rounded-full bg-black/5 px-3 py-1 text-xs font-bold hover:bg-black/10 disabled:opacity-50"
      >
        Dismiss
      </button>
      {error ? <span className="text-xs text-red-700">{error}</span> : null}
    </span>
  );
}
