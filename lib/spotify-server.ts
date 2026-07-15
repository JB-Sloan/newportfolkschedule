import {
  cleanBillingName,
  normalizeArtistName,
  pickBestArtistMatch,
  tracksPerResolvedArtist,
  TRACKS_PER_ARTIST,
  type ArtistMap,
  type BuildArtistStatus,
  type BuildResult,
  type ResolveTarget,
  type SpotifyArtist,
  type SpotifyTrack
} from "@/lib/spotify";

/**
 * Server-side Spotify playlist creation.
 *
 * Playlists are created in the site owner's Spotify account (the account that
 * owns the developer app) and shared with visitors by URL. Visitors never
 * authenticate: Spotify Development Mode only allows allowlisted users to call
 * the API, so per-visitor OAuth cannot work for the public. The owner account
 * is inherently allowed.
 *
 * Required env (server only):
 * - SPOTIFY_CLIENT_ID (falls back to NEXT_PUBLIC_SPOTIFY_CLIENT_ID)
 * - SPOTIFY_CLIENT_SECRET
 * - SPOTIFY_REFRESH_TOKEN (obtain once via scripts/spotify-owner-auth.ts)
 */

const SPOTIFY_ACCOUNTS = "https://accounts.spotify.com";
const SPOTIFY_API = "https://api.spotify.com/v1";

export type ServerSpotifyConfig = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
};

// Spotify client ids are public identifiers, so a committed default is safe;
// env vars override it per deployment.
const DEFAULT_SPOTIFY_CLIENT_ID = "63c607d96de647b4a5ed35f76f085200";

export function getServerSpotifyConfig(): ServerSpotifyConfig | undefined {
  const clientId =
    process.env.SPOTIFY_CLIENT_ID ??
    process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ??
    DEFAULT_SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return undefined;
  return { clientId, clientSecret, refreshToken };
}

type FetchLike = typeof fetch;

export class SpotifyServerError extends Error {
  constructor(message: string, readonly status = 502) {
    super(message);
  }
}

async function readErrorMessage(response: Response) {
  try {
    const body = (await response.json()) as { error?: { message?: string } | string };
    if (typeof body.error === "string") return body.error;
    return body.error?.message;
  } catch {
    return undefined;
  }
}

export async function getOwnerAccessToken(config: ServerSpotifyConfig, fetchImpl: FetchLike = fetch) {
  const response = await fetchImpl(`${SPOTIFY_ACCOUNTS}/api/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")}`
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: config.refreshToken
    })
  });
  if (!response.ok) {
    const detail = await readErrorMessage(response);
    throw new SpotifyServerError(
      `Spotify owner-token refresh failed (${response.status}${detail ? `: ${detail}` : ""}). Check SPOTIFY_CLIENT_SECRET and SPOTIFY_REFRESH_TOKEN.`
    );
  }
  const json = (await response.json()) as { access_token: string };
  return json.access_token;
}

async function spotifyFetch<T>(
  fetchImpl: FetchLike,
  token: string,
  path: string,
  init?: RequestInit
): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetchImpl(`${SPOTIFY_API}${path}`, {
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
    const endpoint = path.split("?")[0];
    if (response.status === 401 || response.status === 403) {
      const detail = await readErrorMessage(response);
      throw new SpotifyServerError(
        `Spotify rejected the site's credentials (${response.status}${detail ? `: ${detail}` : ""} at ${endpoint}).`
      );
    }
    if (!response.ok) {
      const detail = await readErrorMessage(response);
      throw new Error(
        `Spotify request failed (${response.status}${detail ? `: ${detail}` : ""} at ${endpoint}).`
      );
    }
    return (await response.json()) as T;
  }
  throw new SpotifyServerError("Spotify is rate limiting requests. Try again in a minute.", 429);
}

type SearchResponse = {
  artists: { items: Array<{ id: string; name: string; popularity: number; external_urls?: { spotify?: string } }> };
};

async function searchArtists(fetchImpl: FetchLike, token: string, query: string): Promise<SpotifyArtist[]> {
  const params = new URLSearchParams({ q: query, type: "artist", limit: "5" });
  const json = await spotifyFetch<SearchResponse>(fetchImpl, token, `/search?${params}`);
  return json.artists.items.map((item) => ({
    id: item.id,
    name: item.name,
    popularity: item.popularity,
    url: item.external_urls?.spotify
  }));
}

type TrackSearchResponse = {
  tracks: {
    items: Array<{
      uri: string;
      name: string;
      popularity: number;
      artists: Array<{ id: string; name: string }>;
    }>;
  };
};

/**
 * Spotify removed GET /artists/{id}/top-tracks for Development Mode apps in
 * the February 2026 migration with no replacement, so top tracks are
 * reconstructed from track search (still available, limit capped at 10):
 * search by artist name, keep only tracks actually by the resolved artist,
 * and rank by track popularity.
 */
async function getTopTracks(
  fetchImpl: FetchLike,
  token: string,
  artist: SpotifyArtist
): Promise<SpotifyTrack[]> {
  const params = new URLSearchParams({
    q: `artist:"${artist.name}"`,
    type: "track",
    limit: "10"
  });
  const json = await spotifyFetch<TrackSearchResponse>(fetchImpl, token, `/search?${params}`);
  const target = normalizeArtistName(artist.name);
  return json.tracks.items
    .filter((track) =>
      track.artists.some(
        (trackArtist) =>
          trackArtist.id === artist.id || normalizeArtistName(trackArtist.name) === target
      )
    )
    .sort((a, b) => b.popularity - a.popularity)
    .map((track) => ({
      uri: track.uri,
      name: track.name,
      artistNames: track.artists.map((trackArtist) => trackArtist.name)
    }));
}

async function resolveTarget(
  fetchImpl: FetchLike,
  token: string,
  target: ResolveTarget
): Promise<SpotifyArtist | undefined> {
  if (target.spotifyId) {
    return { id: target.spotifyId, name: target.name, popularity: 0 };
  }
  const results = await searchArtists(fetchImpl, token, target.query ?? target.name);
  return pickBestArtistMatch(results, target.name);
}

/**
 * Step-by-step access check used by GET /api/spotify-playlist?diagnose=1 to
 * pinpoint Spotify 403s: reports token refresh, /me (which account the token
 * belongs to), and /search results with Spotify's own error messages.
 */
export async function diagnoseSpotifyAccess(config: ServerSpotifyConfig, fetchImpl: FetchLike = fetch) {
  const steps: Record<string, unknown> = {};

  let token: string;
  try {
    token = await getOwnerAccessToken(config, fetchImpl);
    steps.tokenRefresh = "ok";
  } catch (error) {
    steps.tokenRefresh = error instanceof Error ? error.message : "failed";
    return steps;
  }

  const probe = async (label: string, path: string) => {
    const response = await fetchImpl(`${SPOTIFY_API}${path}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.ok) {
      return response.json();
    }
    const detail = await readErrorMessage(response);
    steps[label] = `HTTP ${response.status}${detail ? `: ${detail}` : ""}`;
    return undefined;
  };

  const me = (await probe("me", "/me")) as
    | { id?: string; display_name?: string; product?: string }
    | undefined;
  if (me) steps.me = { id: me.id, displayName: me.display_name, product: me.product };

  const search = (await probe("search", "/search?q=test&type=artist&limit=1")) as
    | { artists?: { items?: Array<{ id?: string }> } }
    | undefined;
  if (search) steps.search = `ok (${search.artists?.items?.length ?? 0} result)`;

  const trackSearch = (await probe(
    "trackSearch",
    `/search?${new URLSearchParams({ q: 'artist:"Brandi Carlile"', type: "track", limit: "10" })}`
  )) as { tracks?: { items?: unknown[] } } | undefined;
  if (trackSearch) steps.trackSearch = `ok (${trackSearch.tracks?.items?.length ?? 0} tracks)`;

  const createResponse = await fetchImpl(`${SPOTIFY_API}/me/playlists`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Folk Planner diagnostic - safe to delete",
      description: "Created and immediately removed by the diagnostics check.",
      public: true
    })
  });
  if (createResponse.ok) {
    const playlist = (await createResponse.json()) as { id: string };
    steps.createPlaylist = "ok";
    const cleanup = await fetchImpl(`${SPOTIFY_API}/me/library`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ uris: [`spotify:playlist:${playlist.id}`] })
    });
    steps.cleanupPlaylist = cleanup.ok ? "ok" : `HTTP ${cleanup.status}`;
  } else {
    const detail = await readErrorMessage(createResponse);
    steps.createPlaylist = `HTTP ${createResponse.status}${detail ? `: ${detail}` : ""}`;
  }

  return steps;
}

export type ServerBuildInput = {
  config: ServerSpotifyConfig;
  artists: Array<{ id: string; name: string }>;
  artistMap: ArtistMap;
  playlistName: string;
  fetchImpl?: FetchLike;
};

export async function buildPlaylistInOwnerAccount({
  config,
  artists,
  artistMap,
  playlistName,
  fetchImpl = fetch
}: ServerBuildInput): Promise<BuildResult> {
  const token = await getOwnerAccessToken(config, fetchImpl);

  const statuses: BuildArtistStatus[] = artists.map((artist) => ({
    artistId: artist.id,
    displayName: artist.name,
    state: "pending",
    resolvedNames: [],
    trackCount: 0
  }));

  const trackUris: string[] = [];
  const seenUris = new Set<string>();

  for (const [index, artist] of artists.entries()) {
    const status = statuses[index];
    const entry = artistMap[artist.id];

    if (entry?.skip) {
      status.state = "skipped";
      status.note = entry.note;
      continue;
    }

    const targets: ResolveTarget[] = entry?.resolve.length
      ? entry.resolve
      : [{ name: cleanBillingName(artist.name) }];
    const budget = tracksPerResolvedArtist(targets.length);

    try {
      let added = 0;
      for (const target of targets) {
        if (added >= TRACKS_PER_ARTIST) break;
        const match = await resolveTarget(fetchImpl, token, target);
        if (!match) continue;
        const tracks = await getTopTracks(fetchImpl, token, match);
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
      if (error instanceof SpotifyServerError) throw error;
      status.state = "error";
      status.note = error instanceof Error ? error.message : "Lookup failed.";
    }
  }

  if (!trackUris.length) {
    return { playlistName, totalTracks: 0, statuses };
  }

  // POST /me/playlists and /playlists/{id}/items are the February 2026
  // replacements for /users/{id}/playlists and /playlists/{id}/tracks.
  const playlist = await spotifyFetch<{ id: string; external_urls?: { spotify?: string } }>(
    fetchImpl,
    token,
    "/me/playlists",
    {
      method: "POST",
      body: JSON.stringify({
        name: playlistName,
        description:
          "Top tracks for a Newport Folk 2026 plan. Made with the unofficial Folk Planner at newportfolkschedule.com.",
        public: true
      })
    }
  );

  for (let start = 0; start < trackUris.length; start += 100) {
    await spotifyFetch(fetchImpl, token, `/playlists/${playlist.id}/items`, {
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
