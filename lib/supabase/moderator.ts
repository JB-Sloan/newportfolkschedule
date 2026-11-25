import type { createClient } from "./server";

type Client = ReturnType<typeof createClient>;

/** Resolve the caller and ensure they are a moderator/admin. */
export async function requireModerator(supabase: Client): Promise<{ userId: string } | { error: string }> {
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
