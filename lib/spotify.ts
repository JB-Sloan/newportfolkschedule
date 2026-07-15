import { z } from "zod";

/**
 * Spotify playlist integration.
 *
 * Auth uses the Authorization Code + PKCE flow entirely in the browser, so no
 * client secret is required. The only configuration is a Spotify app client id
 * exposed as NEXT_PUBLIC_SPOTIFY_CLIENT_ID whose redirect URI list includes
 * this site's origin + "/".
 */

const TOKEN_STORAGE_KEY = "newport-folk-planner:spotify-token:v1";
const AUTH_STATE_STORAGE_KEY = "newport-folk-planner:spotify-auth:v1";
const PENDING_STORAGE_KEY = "newport-folk-planner:spotify-pending:v1";

const SPOTIFY_ACCOUNTS = "https://accounts.spotify.com";
const SPOTIFY_API = "https://api.spotify.com/v1";
const SCOPES = "playlist-modify-private playlist-modify-public";

export const TRACKS_PER_ARTIST = 10;

export type SpotifyArtist = {
  id: string;
  name: string;
  popularity: number;
  url?: string;
};

export type SpotifyTrack = {
  uri: string;
  name: string;
  artistNames: string[];
};

export type ResolveTarget = {
  name: string;
  spotifyId?: string;
  query?: string;
};

export type ArtistMapEntry = {
  displayName: string;
  resolve: ResolveTarget[];
  skip: boolean;
  note?: string;
};

export type ArtistMap = Record<string, ArtistMapEntry>;

export type BuildArtistStatus = {
  artistId: string;
  displayName: string;
  state: "pending" | "resolving" | "resolved" | "skipped" | "not-found" | "error";
  resolvedNames: string[];
  trackCount: number;
  note?: string;
};

export type BuildResult = {
  playlistUrl?: string;
  playlistName: string;
  totalTracks: number;
  statuses: BuildArtistStatus[];
};

// ---------------------------------------------------------------------------
// Name normalization and matching (pure, unit-tested)
// ---------------------------------------------------------------------------

export function normalizeArtistName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/^(ms|mr|mrs|dr)\.?\s+/, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Strip billing noise ("... and Friends", parentheticals, "feat. ...") so a
 * schedule name that has no curated override still produces a sane search.
 */
export function cleanBillingName(name: string) {
  return name
    .replace(/\s*\(.*?\)\s*/g, " ")
    .replace(/\s+(?:feat\.?|featuring|with)\s+.+$/i, " ")
    .replace(/\s+and friends\b.*$/i, " ")
    .replace(/\s+plays?\s+.+$/i, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function pickBestArtistMatch(results: SpotifyArtist[], targetName: string) {
  if (!results.length) return undefined;
  const target = normalizeArtistName(targetName);
  const exact = results.find((artist) => normalizeArtistName(artist.name) === target);
  if (exact) return exact;
  const partial = results.find((artist) => {
    const candidate = normalizeArtistName(artist.name);
    return candidate.includes(target) || target.includes(candidate);
  });
  return partial ?? results[0];
}

/**
 * Split a per-schedule-artist budget of TRACKS_PER_ARTIST across multiple
 * resolved Spotify artists (collaboration billings blend a few tracks each).
 */
export function tracksPerResolvedArtist(resolvedCount: number) {
  if (resolvedCount <= 1) return TRACKS_PER_ARTIST;
  return Math.max(2, Math.ceil(TRACKS_PER_ARTIST / resolvedCount));
}

// ---------------------------------------------------------------------------
// PKCE auth
// ---------------------------------------------------------------------------

const TokenSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().optional(),
  expiresAt: z.number()
});

type StoredToken = z.infer<typeof TokenSchema>;

function base64UrlEncode(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function randomVerifier() {
  const bytes = new Uint8Array(48);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

async function codeChallenge(verifier: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64UrlEncode(new Uint8Array(digest));
}

// Spotify client ids are public identifiers (PKCE flow, no secret), so a
// committed default is safe; the env var still overrides it per deployment.
const DEFAULT_SPOTIFY_CLIENT_ID = "63c607d96de647b4a5ed35f76f085200";

export function getSpotifyClientId() {
  return process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ?? DEFAULT_SPOTIFY_CLIENT_ID;
}

export function getRedirectUri() {
  return `${window.location.origin}/`;
}

export function rememberPendingBuild(payload: { playlistName: string }) {
  window.sessionStorage.setItem(PENDING_STORAGE_KEY, JSON.stringify(payload));
}

export function takePendingBuild(): { playlistName: string } | undefined {
  const raw = window.sessionStorage.getItem(PENDING_STORAGE_KEY);
  if (!raw) return undefined;
  window.sessionStorage.removeItem(PENDING_STORAGE_KEY);
  try {
    return JSON.parse(raw) as { playlistName: string };
  } catch {
    return undefined;
  }
}

export async function beginSpotifyAuth() {
  const clientId = getSpotifyClientId();
  if (!clientId) throw new Error("Spotify is not configured.");
  const verifier = randomVerifier();
  const state = randomVerifier().slice(0, 16);
  window.sessionStorage.setItem(AUTH_STATE_STORAGE_KEY, JSON.stringify({ verifier, state }));

  const url = new URL(`${SPOTIFY_ACCOUNTS}/authorize`);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", getRedirectUri());
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("code_challenge", await codeChallenge(verifier));
  window.location.assign(url.toString());
}

function storeToken(token: StoredToken) {
  window.localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(token));
}

function readToken(): StoredToken | undefined {
  try {
    const raw = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!raw) return undefined;
    return TokenSchema.parse(JSON.parse(raw));
  } catch {
    return undefined;
  }
}

export function clearSpotifyToken() {
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}

async function tokenRequest(body: URLSearchParams): Promise<StoredToken> {
  const response = await fetch(`${SPOTIFY_ACCOUNTS}/api/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  if (!response.ok) {
    throw new Error(`Spotify token request failed (${response.status}).`);
  }
  const json = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: Date.now() + (json.expires_in - 60) * 1000
  };
}

/**
 * If the current URL is a Spotify auth redirect (?code=...&state=...),
 * exchange the code for a token, clean the URL, and return true.
 */
export async function completeSpotifyAuth(): Promise<boolean> {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");
  if (!code || !state) return false;

  const rawAuth = window.sessionStorage.getItem(AUTH_STATE_STORAGE_KEY);
  if (!rawAuth) return false;
  const auth = JSON.parse(rawAuth) as { verifier: string; state: string };
  if (auth.state !== state) return false;
  window.sessionStorage.removeItem(AUTH_STATE_STORAGE_KEY);

  const token = await tokenRequest(
    new URLSearchParams({
      client_id: getSpotifyClientId(),
      grant_type: "authorization_code",
      code,
      redirect_uri: getRedirectUri(),
      code_verifier: auth.verifier
    })
  );
  storeToken(token);

  const cleaned = new URL(window.location.href);
  cleaned.searchParams.delete("code");
  cleaned.searchParams.delete("state");
  window.history.replaceState(null, "", cleaned.toString());
  return true;
}

export async function getValidToken(): Promise<string | undefined> {
  const token = readToken();
  if (!token) return undefined;
  if (Date.now() < token.expiresAt) return token.accessToken;
  if (!token.refreshToken) {
    clearSpotifyToken();
    return undefined;
  }
  try {
    const refreshed = await tokenRequest(
      new URLSearchParams({
        client_id: getSpotifyClientId(),
        grant_type: "refresh_token",
        refresh_token: token.refreshToken
      })
    );
    storeToken({ ...refreshed, refreshToken: refreshed.refreshToken ?? token.refreshToken });
    return refreshed.accessToken;
  } catch {
    clearSpotifyToken();
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// Spotify Web API
// ---------------------------------------------------------------------------

class SpotifyAuthError extends Error {}

async function spotifyFetch<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(`${SPOTIFY_API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers
      }
    });
    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("Retry-After") ?? 1);
      await new Promise((resolve) => setTimeout(resolve, Math.min(retryAfter, 10) * 1000));
      continue;
    }
    if (response.status === 401) {
      clearSpotifyToken();
      throw new SpotifyAuthError("Spotify session expired. Reconnect and try again.");
    }
    if (!response.ok) {
      throw new Error(`Spotify request failed (${response.status}).`);
    }
    return (await response.json()) as T;
  }
  throw new Error("Spotify is rate limiting requests. Try again in a minute.");
}

type SearchResponse = {
  artists: { items: Array<{ id: string; name: string; popularity: number; external_urls?: { spotify?: string } }> };
};

async function searchArtists(token: string, query: string): Promise<SpotifyArtist[]> {
  const params = new URLSearchParams({ q: query, type: "artist", limit: "5" });
  const json = await spotifyFetch<SearchResponse>(token, `/search?${params}`);
  return json.artists.items.map((item) => ({
    id: item.id,
    name: item.name,
    popularity: item.popularity,
    url: item.external_urls?.spotify
  }));
}

type TopTracksResponse = {
  tracks: Array<{ uri: string; name: string; artists: Array<{ name: string }> }>;
};

async function getTopTracks(token: string, artistId: string): Promise<SpotifyTrack[]> {
  const json = await spotifyFetch<TopTracksResponse>(token, `/artists/${artistId}/top-tracks`);
  return json.tracks.map((track) => ({
    uri: track.uri,
    name: track.name,
    artistNames: track.artists.map((artist) => artist.name)
  }));
}

async function resolveTarget(token: string, target: ResolveTarget): Promise<SpotifyArtist | undefined> {
  if (target.spotifyId) {
    return { id: target.spotifyId, name: target.name, popularity: 0 };
  }
  const results = await searchArtists(token, target.query ?? target.name);
  return pickBestArtistMatch(results, target.name);
}

// ---------------------------------------------------------------------------
// Playlist builder
// ---------------------------------------------------------------------------

export type BuildInput = {
  token: string;
  artists: Array<{ id: string; name: string }>;
  artistMap: ArtistMap;
  playlistName: string;
  onProgress?: (statuses: BuildArtistStatus[]) => void;
};

export async function buildSpotifyPlaylist({
  token,
  artists,
  artistMap,
  playlistName,
  onProgress
}: BuildInput): Promise<BuildResult> {
  const statuses: BuildArtistStatus[] = artists.map((artist) => ({
    artistId: artist.id,
    displayName: artist.name,
    state: "pending",
    resolvedNames: [],
    trackCount: 0
  }));
  const report = () => onProgress?.(statuses.map((status) => ({ ...status })));

  const trackUris: string[] = [];
  const seenUris = new Set<string>();

  for (const [index, artist] of artists.entries()) {
    const status = statuses[index];
    const entry = artistMap[artist.id];

    if (entry?.skip) {
      status.state = "skipped";
      status.note = entry.note;
      report();
      continue;
    }

    status.state = "resolving";
    report();

    const targets: ResolveTarget[] = entry?.resolve.length
      ? entry.resolve
      : [{ name: cleanBillingName(artist.name) }];
    const budget = tracksPerResolvedArtist(targets.length);

    try {
      let added = 0;
      for (const target of targets) {
        if (added >= TRACKS_PER_ARTIST) break;
        const match = await resolveTarget(token, target);
        if (!match) continue;
        const tracks = await getTopTracks(token, match.id);
        status.resolvedNames.push(match.name);
        for (const track of tracks.slice(0, Math.min(budget, TRACKS_PER_ARTIST - added))) {
          if (seenUris.has(track.uri)) continue;
          seenUris.add(track.uri);
          trackUris.push(track.uri);
          added += 1;
        }
      }
      if (status.resolvedNames.length === 0) {
        status.state = "not-found";
        status.note = "No matching Spotify artist found.";
      } else {
        status.state = "resolved";
        status.trackCount = added;
        if (entry?.note) status.note = entry.note;
      }
    } catch (error) {
      if (error instanceof SpotifyAuthError) throw error;
      status.state = "error";
      status.note = error instanceof Error ? error.message : "Lookup failed.";
    }
    report();
  }

  if (!trackUris.length) {
    return { playlistName, totalTracks: 0, statuses };
  }

  const me = await spotifyFetch<{ id: string }>(token, "/me");
  const playlist = await spotifyFetch<{ id: string; external_urls?: { spotify?: string } }>(
    token,
    `/users/${encodeURIComponent(me.id)}/playlists`,
    {
      method: "POST",
      body: JSON.stringify({
        name: playlistName,
        description:
          "Top tracks for my Newport Folk 2026 picks. Made with Folk Planner (unofficial).",
        public: false
      })
    }
  );

  for (let start = 0; start < trackUris.length; start += 100) {
    await spotifyFetch(token, `/playlists/${playlist.id}/tracks`, {
      method: "POST",
      body: JSON.stringify({ uris: trackUris.slice(start, start + 100) })
    });
  }

  return {
    playlistUrl: playlist.external_urls?.spotify ?? `https://open.spotify.com/playlist/${playlist.id}`,
    playlistName,
    totalTracks: trackUris.length,
    statuses
  };
}
