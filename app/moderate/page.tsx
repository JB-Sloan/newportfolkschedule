import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ModerateActions } from "./ModerateActions";
import { ReportActions } from "./ReportActions";

/**
 * Moderation queue: pending and disputed guest performances awaiting review.
 * Gated to moderators/admins. Confirming casts the moderator's confirm vote
 * (auto-promotes via the recompute trigger); rejecting hides the claim.
 */
export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  sit_in: "Sit-in",
  guest_vocal: "Guest vocal",
  surprise_guest: "Surprise guest",
  host: "Host",
  curator: "Curator"
};

type Row = {
  id: string;
  role: string;
  instruments: string[] | null;
  status: string;
  confirm_count: number;
  dispute_count: number;
  artists: { name: string; slug: string } | null;
  sets: { billed_name: string; slug: string; events: { date: string; editions: { year: number } | null } | null } | null;
};
type ReportRow = {
  id: string;
  entity_table: string;
  entity_id: string;
  reason: string;
  details: string | null;
  created_at: string;
};
type PerfMeta = {
  id: string;
  artists: { name: string } | null;
  sets: { slug: string; events: { editions: { year: number } | null } | null } | null;
};

export default async function ModeratePage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <h1 className="text-2xl font-black">Moderation</h1>
        <p className="mt-2 text-sm opacity-70">
          <Link href="/login" className="font-bold underline decoration-black/30 hover:decoration-black">
            Sign in
          </Link>{" "}
          with a moderator account to review submissions.
        </p>
      </main>
    );
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const isMod = profile?.role === "moderator" || profile?.role === "admin";
  if (!isMod) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <h1 className="text-2xl font-black">Moderation</h1>
        <p className="mt-2 text-sm opacity-70">This area is for moderators. Your account doesn’t have access.</p>
      </main>
    );
  }

  const { data } = await supabase
    .from("performances")
    .select(
      "id, role, instruments, status, confirm_count, dispute_count, artists(name, slug), sets(billed_name, slug, events(date, editions(year)))"
    )
    .in("status", ["pending", "disputed"])
    .order("created_at", { ascending: false })
    .returns<Row[]>();

  const rows = data ?? [];

  // Mark which claims carry a source citation (helps the reviewer).
  const cited = new Set<string>();
  if (rows.length) {
    const { data: cites } = await supabase
      .from("citations")
      .select("entity_id")
      .eq("entity_table", "performances")
      .in("entity_id", rows.map((r) => r.id))
      .returns<{ entity_id: string }[]>();
    for (const c of cites ?? []) cited.add(c.entity_id);
  }

  // Open reports (any entity). For performance reports, resolve the guest+set.
  const { data: reportData } = await supabase
    .from("reports")
    .select("id, entity_table, entity_id, reason, details, created_at")
    .eq("status", "open")
    .order("created_at", { ascending: true })
    .returns<ReportRow[]>();
  const reports = reportData ?? [];

  const perfMeta = new Map<string, { name: string; year?: number; slug?: string }>();
  const perfReportIds = reports.filter((r) => r.entity_table === "performances").map((r) => r.entity_id);
  if (perfReportIds.length) {
    const { data: perfs } = await supabase
      .from("performances")
      .select("id, artists(name), sets(slug, events(editions(year)))")
      .in("id", perfReportIds)
      .returns<PerfMeta[]>();
    for (const p of perfs ?? []) {
      perfMeta.set(p.id, {
        name: p.artists?.name ?? "Unknown",
        year: p.sets?.events?.editions?.year,
        slug: p.sets?.slug
      });
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link href="/archive" className="text-xs font-bold uppercase tracking-widest opacity-50 hover:opacity-80">
        ← The Archive
      </Link>
      <h1 className="mt-1 text-3xl font-black">Moderation queue</h1>
      <p className="mt-1 text-sm opacity-70">
        {rows.length} {rows.length === 1 ? "claim" : "claims"} awaiting review (pending or disputed guest performances).
      </p>

      {rows.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-black/10 p-4 text-sm opacity-70">
          Nothing to review right now. New sit-in submissions land here until confirmed.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((r) => {
            const year = r.sets?.events?.editions?.year;
            return (
              <li key={r.id} className="rounded-2xl border border-black/10 p-3">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-xs font-bold uppercase tracking-wide opacity-55">{ROLE_LABEL[r.role] ?? r.role}</span>
                  {r.artists?.slug ? (
                    <Link href={`/artist/${r.artists.slug}`} className="font-black underline decoration-black/20 hover:decoration-black">
                      {r.artists.name}
                    </Link>
                  ) : (
                    <span className="font-black">{r.artists?.name ?? "Unknown"}</span>
                  )}
                  {r.instruments?.length ? <span className="text-sm opacity-55">{r.instruments.join(", ")}</span> : null}
                  <span
                    className={
                      "rounded-full px-2 py-0.5 text-xs font-bold " +
                      (r.status === "disputed" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800")
                    }
                  >
                    {r.status}
                  </span>
                  {cited.has(r.id) ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">source</span>
                  ) : null}
                </div>
                <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm opacity-70">
                    with{" "}
                    {year && r.sets?.slug ? (
                      <Link href={`/archive/${year}/${r.sets.slug}`} className="font-bold underline decoration-black/20 hover:decoration-black">
                        {r.sets?.billed_name}
                      </Link>
                    ) : (
                      <span className="font-bold">{r.sets?.billed_name}</span>
                    )}{" "}
                    {year ? <span className="opacity-60">· {year}</span> : null}
                    <span className="opacity-60"> · ✓ {r.confirm_count} ✗ {r.dispute_count}</span>
                  </p>
                  <ModerateActions performanceId={r.id} />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <h2 className="mt-10 text-2xl font-black">Reports</h2>
      <p className="mt-1 text-sm opacity-70">
        {reports.length} open {reports.length === 1 ? "report" : "reports"} from the community.
      </p>
      {reports.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-black/10 p-4 text-sm opacity-70">No open reports.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {reports.map((rep) => {
            const meta = rep.entity_table === "performances" ? perfMeta.get(rep.entity_id) : undefined;
            return (
              <li key={rep.id} className="rounded-2xl border border-black/10 p-3">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold capitalize text-red-800">
                    {rep.reason.replace("_", " ")}
                  </span>
                  {meta ? (
                    meta.year && meta.slug ? (
                      <Link href={`/archive/${meta.year}/${meta.slug}`} className="font-bold underline decoration-black/20 hover:decoration-black">
                        {meta.name}
                      </Link>
                    ) : (
                      <span className="font-bold">{meta.name}</span>
                    )
                  ) : (
                    <span className="text-sm opacity-60">
                      {rep.entity_table} · {rep.entity_id.slice(0, 8)}
                    </span>
                  )}
                  {meta?.year ? <span className="text-sm opacity-55">{meta.year}</span> : null}
                </div>
                {rep.details ? <p className="mt-1 text-sm opacity-75">“{rep.details}”</p> : null}
                <div className="mt-2">
                  <ReportActions reportId={rep.id} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
