const SITE_URL = "https://www.newportfolkschedule.com";

/**
 * Best-effort admin notification via the Resend HTTP API. No-ops unless
 * RESEND_API_KEY, NOTIFY_FROM, and NOTIFY_TO are set, and never throws — a mail
 * hiccup must not break a user's submission. Server-only (reads secrets).
 *
 * Env:
 *   RESEND_API_KEY  — Resend API key (same account as the auth SMTP)
 *   NOTIFY_FROM     — a from address on your Resend-verified domain
 *                     e.g. "Newport Folk <notifications@yourdomain.com>"
 *   NOTIFY_TO       — where alerts go (your inbox)
 */
export async function notifyAdmin(subject: string, lines: string[]): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFY_FROM;
  const to = process.env.NOTIFY_TO;
  if (!key || !from || !to) return;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, text: lines.join("\n") }),
      signal: AbortSignal.timeout(8000)
    });
  } catch {
    // best-effort; swallow so submissions never fail on a mail error
  }
}

export function setUrl(year: number, slug: string): string {
  return `${SITE_URL}/archive/${year}/${slug}`;
}

export const MODERATE_URL = `${SITE_URL}/moderate`;
