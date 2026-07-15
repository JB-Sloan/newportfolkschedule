import { NextResponse } from "next/server";
import { z } from "zod";
import spotifyArtistMapJson from "@/data/spotify-artist-map.json";
import { artistsById } from "@/lib/data";
import type { ArtistMap } from "@/lib/spotify";
import {
  buildPlaylistInOwnerAccount,
  diagnoseSpotifyAccess,
  getServerSpotifyConfig,
  SpotifyServerError
} from "@/lib/spotify-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const artistMap = (spotifyArtistMapJson as { overrides: ArtistMap }).overrides;

const RequestSchema = z.object({
  playlistName: z.string().trim().min(1).max(100),
  artistIds: z.array(z.string().min(1).max(120)).min(1).max(80)
});

// Best-effort per-IP rate limit. Serverless instances each keep their own map,
// so this is a soft cap, not a security boundary.
const RATE_LIMIT = 4;
const RATE_WINDOW_MS = 60_000;
const requestLog = new Map<string, number[]>();

function isRateLimited(ip: string) {
  const now = Date.now();
  const recent = (requestLog.get(ip) ?? []).filter((time) => now - time < RATE_WINDOW_MS);
  recent.push(now);
  requestLog.set(ip, recent);
  if (requestLog.size > 1000) {
    for (const [key, times] of requestLog) {
      if (times.every((time) => now - time >= RATE_WINDOW_MS)) requestLog.delete(key);
    }
  }
  return recent.length > RATE_LIMIT;
}

export async function GET(request: Request) {
  const config = getServerSpotifyConfig();
  const url = new URL(request.url);
  if (url.searchParams.get("diagnose") !== "1" || !config) {
    return NextResponse.json({ configured: Boolean(config) });
  }
  return NextResponse.json(await diagnoseSpotifyAccess(config));
}

export async function POST(request: Request) {
  const config = getServerSpotifyConfig();
  if (!config) {
    return NextResponse.json(
      { error: "Spotify playlists are not configured for this deployment." },
      { status: 503 }
    );
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many playlist requests. Wait a minute and try again." },
      { status: 429 }
    );
  }

  let body: z.infer<typeof RequestSchema>;
  try {
    body = RequestSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const artists = body.artistIds
    .map((artistId) => artistsById[artistId])
    .filter(Boolean)
    .map((artist) => ({ id: artist.id, name: artist.name }));

  if (!artists.length) {
    return NextResponse.json({ error: "No known artists in the request." }, { status: 400 });
  }

  try {
    const result = await buildPlaylistInOwnerAccount({
      config,
      artists,
      artistMap,
      playlistName: body.playlistName
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof SpotifyServerError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: "Playlist creation failed. Try again in a minute." },
      { status: 502 }
    );
  }
}
