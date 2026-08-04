"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Provider = "google" | "apple";

/**
 * Sign-in for the community platform. Magic link uses Supabase's email sender
 * (swap to Resend SMTP via E0-04 to lift the rate limit); the OAuth buttons
 * light up once Google/Apple are enabled in the Supabase dashboard (E0-05).
 */
export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState<"magic" | Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy("magic");
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
    setBusy(null);
    if (error) setError(error.message);
    else setSent(true);
  }

  async function signInWith(provider: Provider) {
    setError(null);
    setBusy(provider);
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
    if (error) {
      setBusy(null);
      setError(error.message);
    }
    // On success the browser is redirected to the provider.
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
        </div>
      ) : (
        <form onSubmit={sendMagicLink} className="mt-6 space-y-3">
          <label className="block">
            <span className="text-sm font-bold">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-2 outline-none focus:border-black/40"
            />
          </label>
          <button
            type="submit"
            disabled={busy !== null}
            className="w-full rounded-xl bg-black px-4 py-2.5 font-bold text-white disabled:opacity-50"
          >
            {busy === "magic" ? "Sending…" : "Email me a magic link"}
          </button>
        </form>
      )}

      <div className="my-5 flex items-center gap-3 text-xs font-bold uppercase tracking-widest opacity-40">
        <span className="h-px flex-1 bg-black/15" /> or <span className="h-px flex-1 bg-black/15" />
      </div>

      <div className="space-y-2">
        <button
          onClick={() => signInWith("google")}
          disabled={busy !== null}
          className="w-full rounded-xl border border-black/15 bg-white px-4 py-2.5 font-bold hover:bg-black/5 disabled:opacity-50"
        >
          {busy === "google" ? "Redirecting…" : "Continue with Google"}
        </button>
        <button
          onClick={() => signInWith("apple")}
          disabled={busy !== null}
          className="w-full rounded-xl border border-black/15 bg-white px-4 py-2.5 font-bold hover:bg-black/5 disabled:opacity-50"
        >
          {busy === "apple" ? "Redirecting…" : "Continue with Apple"}
        </button>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg bg-red-100 p-3 text-sm text-red-800">{error}</p>
      ) : null}

      <p className="mt-6 text-xs opacity-45">
        We use your email only to sign you in and attribute your contributions. No spam.
      </p>
    </main>
  );
}
