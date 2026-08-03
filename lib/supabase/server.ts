import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

/**
 * Server-side Supabase client for Server Components, Route Handlers, and Server
 * Actions. Reads/writes the auth session through Next's cookie store so RLS sees
 * the signed-in user. On Next 14 `cookies()` is synchronous.
 *
 * Writing cookies from a Server Component throws; that path is swallowed because
 * session refresh is handled in middleware/route handlers where writes are allowed.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component — safe to ignore.
          }
        }
      }
    }
  );
}
