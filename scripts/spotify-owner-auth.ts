/**
 * One-time helper: obtain the SPOTIFY_REFRESH_TOKEN for the site owner's
 * Spotify account, used by /api/spotify-playlist to create playlists.
 *
 * Prerequisites (Spotify developer dashboard -> your app -> Settings):
 * - Redirect URIs must include exactly: http://127.0.0.1:8888/callback
 * - Have the Client ID and Client Secret handy.
 *
 * Usage (PowerShell):
 *   $env:SPOTIFY_CLIENT_ID = "..."; $env:SPOTIFY_CLIENT_SECRET = "..."
 *   npx tsx scripts/spotify-owner-auth.ts
 *
 * A browser URL is printed; open it, approve with the OWNER Spotify account,
 * and the refresh token is printed here. Put it in Vercel env as
 * SPOTIFY_REFRESH_TOKEN (plus SPOTIFY_CLIENT_SECRET) and redeploy.
 */

import http from "node:http";

const clientId =
  process.env.SPOTIFY_CLIENT_ID ??
  process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ??
  "63c607d96de647b4a5ed35f76f085200";
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const redirectUri = "http://127.0.0.1:8888/callback";
const scopes = "playlist-modify-public playlist-modify-private";

if (!clientSecret) {
  console.error("Set the SPOTIFY_CLIENT_SECRET env var first (from the app's dashboard settings).");
  process.exit(1);
}

const state = Math.random().toString(36).slice(2);
const authUrl = new URL("https://accounts.spotify.com/authorize");
authUrl.searchParams.set("client_id", clientId);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("redirect_uri", redirectUri);
authUrl.searchParams.set("scope", scopes);
authUrl.searchParams.set("state", state);

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", "http://127.0.0.1:8888");
  if (url.pathname !== "/callback") {
    response.writeHead(404).end();
    return;
  }
  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  if (!code || returnedState !== state) {
    response.writeHead(400, { "Content-Type": "text/plain" }).end("Missing code or bad state.");
    return;
  }

  const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri
    })
  });

  const json = (await tokenResponse.json()) as { refresh_token?: string; error_description?: string };
  if (!tokenResponse.ok || !json.refresh_token) {
    response.writeHead(500, { "Content-Type": "text/plain" }).end("Token exchange failed; see terminal.");
    console.error("Token exchange failed:", json.error_description ?? tokenResponse.status);
    process.exit(1);
  }

  response
    .writeHead(200, { "Content-Type": "text/plain" })
    .end("Done. The refresh token is printed in your terminal — you can close this tab.");
  console.log("\nSPOTIFY_REFRESH_TOKEN:\n");
  console.log(json.refresh_token);
  console.log("\nAdd this (and SPOTIFY_CLIENT_SECRET) to Vercel env vars, then redeploy.");
  server.close();
  process.exit(0);
});

server.listen(8888, "127.0.0.1", () => {
  console.log("1. Make sure http://127.0.0.1:8888/callback is a registered redirect URI for the app.");
  console.log("2. Open this URL and approve with the site owner's Spotify account:\n");
  console.log(authUrl.toString());
  console.log("\nWaiting for the redirect…");
});
