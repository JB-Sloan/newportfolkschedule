/**
 * Shared Spotify types and pure artist-resolution logic.
 *
 * Playlist creation happens server-side in the site owner's account (see
 * lib/spotify-server.ts and /api/spotify-playlist): Spotify Development Mode
 * only lets allowlisted accounts call the API, so per-visitor OAuth cannot
 * serve the public.
 */

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
