"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ModResult = { ok: true } | { ok: false; error: string };

type Client = ReturnType<typeof createClient>;

/** Resolve the caller and ensure they are a moderator/admin. */
async function requireModerator(supabase: Client): Promise<{ userId: string } | { error: string }> {
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || (profile.role !== "moderator" && profile.role !== "admin")) {
    return { error: "You don't have moderator access." };
  }
  return { userId: user.id };
}

/**
 * Confirm or reject a pending/disputed guest performance.
 *
 * - confirm: casts the moderator's own confirm vote. The
 *   recompute_performance_status trigger sees a trusted/moderator confirm and
 *   promotes to 'confirmed' — and because the vote persists, it stays that way.
 * - reject: sets status='rejected' directly (now moderator-only via RLS). The
 *   trigger preserves 'rejected', and it drops out of public reads.
 */
export async function moderatePerformance(input: {
  performanceId: string;
  action: "confirm" | "reject";
}): Promise<ModResult> {
  const supabase = createClient();
  const gate = await requireModerator(supabase);
  if ("error" in gate) return { ok: false, error: gate.error };

  if (input.action === "confirm") {
    const { error } = await supabase
      .from("performance_votes")
      .upsert(
        { performance_id: input.performanceId, user_id: gate.userId, vote: 1 },
        { onConflict: "performance_id,user_id" }
      );
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from("performances").update({ status: "rejected" }).eq("id", input.performanceId);
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/moderate");
  return { ok: true };
}
