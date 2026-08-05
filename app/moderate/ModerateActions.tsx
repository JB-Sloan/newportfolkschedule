"use client";

import { useState, useTransition } from "react";
import { moderatePerformance } from "./actions";

/** Confirm / reject buttons for one pending performance in the queue. */
export function ModerateActions({ performanceId }: { performanceId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<"confirm" | "reject" | null>(null);

  function act(action: "confirm" | "reject") {
    setError(null);
    startTransition(async () => {
      const res = await moderatePerformance({ performanceId, action });
      if (!res.ok) setError(res.error);
      else setDone(action);
    });
  }

  if (done) {
    return <span className="text-xs font-bold opacity-60">{done === "confirm" ? "Confirmed ✓" : "Rejected ✗"}</span>;
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        onClick={() => act("confirm")}
        disabled={pending}
        className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white disabled:opacity-50"
      >
        Confirm
      </button>
      <button
        onClick={() => act("reject")}
        disabled={pending}
        className="rounded-full bg-black/5 px-3 py-1 text-xs font-bold hover:bg-red-100 hover:text-red-800 disabled:opacity-50"
      >
        Reject
      </button>
      {error ? <span className="text-xs text-red-700">{error}</span> : null}
    </span>
  );
}
