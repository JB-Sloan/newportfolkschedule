"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { voteOnPerformance } from "./actions";

/**
 * Confirm / dispute controls for one guest performance. Signed-in users toggle
 * their vote; the counts and status come from the server (a trigger recounts
 * and may auto-promote to confirmed/disputed), so we revalidate on each click.
 */
export function PerformanceVote({
  performanceId,
  year,
  setSlug,
  confirmCount,
  disputeCount,
  myVote,
  signedIn
}: {
  performanceId: string;
  year: number;
  setSlug: string;
  confirmCount: number;
  disputeCount: number;
  myVote: number;
  signedIn: boolean;
}) {
  const [vote, setVote] = useState(myVote);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!signedIn) {
    return (
      <span className="inline-flex items-center gap-2 text-xs opacity-55">
        <span>✓ {confirmCount}</span>
        {disputeCount > 0 ? <span>✗ {disputeCount}</span> : null}
        <Link href="/login" className="font-bold underline decoration-black/30 hover:decoration-black">
          confirm
        </Link>
      </span>
    );
  }

  function cast(next: 1 | -1) {
    setError(null);
    const value = vote === next ? 0 : next; // click your active vote again to retract
    setVote(value);
    startTransition(async () => {
      const res = await voteOnPerformance({ performanceId, vote: value, year, setSlug });
      if (!res.ok) {
        setVote(myVote);
        setError(res.error);
      }
    });
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <button
        onClick={() => cast(1)}
        disabled={pending}
        aria-pressed={vote === 1}
        className={
          "rounded-full px-2 py-0.5 font-bold disabled:opacity-50 " +
          (vote === 1 ? "bg-emerald-600 text-white" : "bg-black/5 hover:bg-black/10")
        }
      >
        ✓ {confirmCount}
      </button>
      <button
        onClick={() => cast(-1)}
        disabled={pending}
        aria-pressed={vote === -1}
        className={
          "rounded-full px-2 py-0.5 font-bold disabled:opacity-50 " +
          (vote === -1 ? "bg-red-600 text-white" : "bg-black/5 hover:bg-black/10")
        }
      >
        ✗ {disputeCount}
      </button>
      {error ? <span className="text-red-700">{error}</span> : null}
    </span>
  );
}
