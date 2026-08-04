"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Sign-in for the community platform: passwordless magic link over Resend
 * SMTP (E0-04). The link lands on /auth/callback to exchange the code for a
 * session. Reading the archive stays open to everyone.
 */
export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
    setBusy(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <main className="mx-auto max-w-sm p-6">
      <Link href="/" className="text-xs font-bold uppercase tracking-widest opacity-50 hover:opacity-80">
        ← Newport Folk
      </Link>
      <h1 className="mt-2 text-3xl font-black">Sign in</h1>
      <p className="mt-1 text-sm opacity-70">
        To submit setlists, sit-ins, and corrections to the archive. Reading stays open to everyone.
      </p>

      {sent ? (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          Check <strong>{email}</strong> for a magic link. Open it on this device to finish signing in.
          <button onClick={() => setSent(false)} className="mt-2 block text-xs font-bold underline">
            Use a different email
          </button>
        </div>
      ) : (
        <form onSubmit={sendMagicLink} className="mt-6 space-y-3">
          <label className="block">
            <span className="text-sm font-bold">Email</span>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-2 outline-none focus:border-black/40"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-black px-4 py-2.5 font-bold text-white disabled:opacity-50"
          >
            {busy ? "Sending…" : "Email me a magic link"}
          </button>
        </form>
      )}

      {error ? <p className="mt-4 rounded-lg bg-red-100 p-3 text-sm text-red-800">{error}</p> : null}

      <p className="mt-6 text-xs opacity-45">
        We use your email only to sign you in and attribute your contributions. No spam.
      </p>
    </main>
  );
}
