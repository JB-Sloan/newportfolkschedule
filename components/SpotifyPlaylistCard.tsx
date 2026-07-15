"use client";

import { useEffect, useRef, useState } from "react";
import spotifyArtistMapJson from "@/data/spotify-artist-map.json";
import {
  beginSpotifyAuth,
  buildSpotifyPlaylist,
  clearSpotifyToken,
  getSpotifyClientId,
  getValidToken,
  rememberPendingBuild,
  TRACKS_PER_ARTIST,
  type ArtistMap,
  type BuildArtistStatus,
  type BuildResult
} from "@/lib/spotify";
import type { Artist } from "@/lib/schemas";

const artistMap = (spotifyArtistMapJson as { overrides: ArtistMap }).overrides;

type Phase = "idle" | "connecting" | "building" | "done" | "error";

function statusChip(state: BuildArtistStatus["state"]) {
  switch (state) {
    case "resolved":
      return { label: "Added", className: "bg-bay/15 text-bay" };
    case "resolving":
      return { label: "Searching…", className: "bg-quad/15 text-quad" };
    case "skipped":
      return { label: "Skipped", className: "bg-ink/10 text-ink/60" };
    case "not-found":
      return { label: "Not found", className: "bg-amber-100 text-amber-900" };
    case "error":
      return { label: "Error", className: "bg-red-100 text-red-800" };
    default:
      return { label: "Waiting", className: "bg-ink/8 text-ink/50" };
  }
}

export function SpotifyPlaylistCard({
  planArtists,
  autoStart,
  onAutoStartConsumed
}: {
  planArtists: Artist[];
  autoStart?: { playlistName: string };
  onAutoStartConsumed: () => void;
}) {
  const configured = Boolean(getSpotifyClientId());
  const [playlistName, setPlaylistName] = useState("Newport Folk 2026 · My Picks");
  const [phase, setPhase] = useState<Phase>("idle");
  const [statuses, setStatuses] = useState<BuildArtistStatus[]>([]);
  const [result, setResult] = useState<BuildResult | undefined>();
  const [error, setError] = useState<string | undefined>();
  const buildingRef = useRef(false);

  async function runBuild(name: string) {
    if (buildingRef.current) return;
    buildingRef.current = true;
    setPhase("building");
    setError(undefined);
    setResult(undefined);
    setStatuses([]);
    try {
      const token = await getValidToken();
      if (!token) {
        rememberPendingBuild({ playlistName: name });
        setPhase("connecting");
        await beginSpotifyAuth();
        return;
      }
      const built = await buildSpotifyPlaylist({
        token,
        artists: planArtists.map((artist) => ({ id: artist.id, name: artist.name })),
        artistMap,
        playlistName: name,
        onProgress: setStatuses
      });
      setResult(built);
      setStatuses(built.statuses);
      setPhase("done");
    } catch (buildError) {
      setError(buildError instanceof Error ? buildError.message : "Playlist build failed.");
      setPhase("error");
    } finally {
      buildingRef.current = false;
    }
  }

  useEffect(() => {
    if (!autoStart) return;
    setPlaylistName(autoStart.playlistName);
    onAutoStartConsumed();
    void runBuild(autoStart.playlistName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  if (!planArtists.length) return null;

  return (
    <section className="rounded-3xl bg-white p-4 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-black">Spotify playlist</h3>
          <p className="text-sm text-ink/60">
            Top {TRACKS_PER_ARTIST} songs for each of your {planArtists.length}{" "}
            {planArtists.length === 1 ? "artist" : "artists"}, in one private playlist.
          </p>
        </div>
        {phase === "done" || phase === "error" ? (
          <button
            className="rounded-full bg-ink/8 px-3 py-2 text-sm font-bold"
            onClick={() => {
              clearSpotifyToken();
              setPhase("idle");
              setStatuses([]);
              setResult(undefined);
              setError(undefined);
            }}
          >
            Disconnect Spotify
          </button>
        ) : null}
      </div>

      {!configured ? (
        <p className="mt-3 rounded-2xl bg-paper p-3 text-sm text-ink/70">
          Spotify isn&apos;t configured for this deployment yet. Set{" "}
          <code className="font-mono text-xs">NEXT_PUBLIC_SPOTIFY_CLIENT_ID</code> to enable
          one-tap playlists.
        </p>
      ) : (
        <>
          {phase === "idle" || phase === "connecting" ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
              <label className="block">
                <span className="sr-only">Playlist name</span>
                <input
                  className="min-h-12 w-full rounded-2xl border border-ink/15 bg-paper px-4 outline-none focus:border-bay"
                  value={playlistName}
                  maxLength={100}
                  onChange={(event) => setPlaylistName(event.target.value)}
                />
              </label>
              <button
                className="min-h-12 rounded-2xl bg-[#1DB954] px-5 font-bold text-white disabled:opacity-50"
                disabled={phase === "connecting" || !playlistName.trim()}
                onClick={() => void runBuild(playlistName.trim())}
              >
                {phase === "connecting" ? "Opening Spotify…" : "Create playlist"}
              </button>
            </div>
          ) : null}

          {phase === "connecting" ? (
            <p className="mt-2 text-sm text-ink/60">
              You&apos;ll be sent to Spotify to approve access, then brought right back here.
            </p>
          ) : null}

          {phase === "building" ? (
            <p className="mt-3 text-sm font-bold text-ink/70" role="status">
              Building playlist… finding artists and their top tracks.
            </p>
          ) : null}

          {phase === "done" && result ? (
            <div className="mt-3 rounded-2xl bg-bay/10 p-3">
              {result.playlistUrl ? (
                <>
                  <p className="font-bold">
                    Done! {result.totalTracks} tracks added to “{result.playlistName}”.
                  </p>
                  <a
                    className="mt-2 inline-block rounded-full bg-[#1DB954] px-4 py-2 font-bold text-white"
                    href={result.playlistUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open playlist in Spotify
                  </a>
                </>
              ) : (
                <p className="font-bold">No tracks could be found for your picks.</p>
              )}
            </div>
          ) : null}

          {phase === "error" ? (
            <div className="mt-3 rounded-2xl bg-red-50 p-3 text-sm">
              <p className="font-bold text-red-800">{error}</p>
              <button
                className="mt-2 rounded-full bg-ink px-4 py-2 font-bold text-paper"
                onClick={() => void runBuild(playlistName.trim())}
              >
                Try again
              </button>
            </div>
          ) : null}

          {statuses.length > 0 ? (
            <ul className="mt-3 grid gap-1.5" aria-label="Playlist build progress">
              {statuses.map((status) => {
                const chip = statusChip(status.state);
                const resolvedElsewhere =
                  status.resolvedNames.length > 0 &&
                  status.resolvedNames.join(", ") !== status.displayName;
                return (
                  <li
                    key={status.artistId}
                    className="flex items-center justify-between gap-3 rounded-xl bg-paper px-3 py-2 text-sm"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-bold">{status.displayName}</span>
                      {resolvedElsewhere ? (
                        <span className="block truncate text-xs text-ink/60">
                          via {status.resolvedNames.join(", ")}
                        </span>
                      ) : null}
                      {status.note && status.state !== "resolved" ? (
                        <span className="block truncate text-xs text-ink/50">{status.note}</span>
                      ) : null}
                    </span>
                    <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-bold ${chip.className}`}>
                      {chip.label}
                      {status.state === "resolved" ? ` · ${status.trackCount}` : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </>
      )}
    </section>
  );
}
