import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

/**
 * Compact sign-in indicator for the community pages. Shows the signed-in
 * email with a sign-out button, or a link to /login. Server Component — reads
 * the session the middleware keeps fresh.
 */
export async function AuthStatus() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Link href="/login" className="rounded-full bg-black/5 px-3 py-1 text-sm font-bold hover:bg-black/10">
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="opacity-60">{user.email}</span>
      <form action="/auth/signout" method="post">
        <button type="submit" className="rounded-full bg-black/5 px-3 py-1 font-bold hover:bg-black/10">
          Sign out
        </button>
      </form>
    </div>
  );
}
