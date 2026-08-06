// Client-side calls to Supabase (auth, votes, submissions) must be allowed
// through the CSP's connect-src, or the browser blocks them with "Failed to
// fetch". Server-side reads aren't subject to CSP, which is why they worked.
const supabaseOrigin = (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://uczitvfcazcujzbhjetj.supabase.co").replace(/\/+$/, "");
const supabaseWss = supabaseOrigin.replace(/^https/, "wss");

const securityHeaders = [
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin"
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff"
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()"
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self'",
      `connect-src 'self' ${supabaseOrigin} ${supabaseWss}`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join("; ")
  }
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders
      }
    ];
  }
};

export default nextConfig;