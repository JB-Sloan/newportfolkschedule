import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

/**
 * Browser-side Supabase client for Client Components. Uses the publishable key,
 * which is safe to expose; all access is gated by Row Level Security.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
