"use client";

import { useEffect, useRef, useState } from "react";
import { TRACKS_PER_ARTIST, type BuildArtistStatus, type BuildResult } from "@/lib/spotify";
import type { Artist } from "@/lib/schemas";

type Phase = "idle" | "building" | "done" | "error";

function statusChip(state: BuildArtistStatus["state"]) {
  switch (state) {
    case "resolved":
      return { label: "Added", className: "bg-bay/15 text-bay" };
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

export function SpotifyPlaylistCard({ planArtists }: { planArtists: Artist[] }) {
  const [configured, setConfigured] = useState<boolean | undefined>();
  const [playlistName, setPlaylistName] = useState("Newport Folk 2026 · My Picks");
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<BuildResult | undefined>();
  const [error, setError] = useState<string | undefined>();
  const buildingRef = useRef(false);

  useEffect(() => {
    fetch("/api/spotify-playlist")
      .then((response) => response.json())
      .then((json: { configured?: boolean }) => setConfigured(Boolean(json.configured)))
      .catch(() => setConfigured(false));
  }, []);

  async function runBuild() {
    if (buildingRef.current) return;
    buildingRef.current = true;
    setPhase("building");
    setError(undefined);
    setResult(undefined);
    try {
      const response = await fetch("/api/spotify-playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playlistName: playlistName.trim(),
          artistIds: planArtists.map((artist) => artist.id)
        })
      });
      const json = (await response.json()) as BuildResult & { error?: string };
      if (!response.ok) {
        throw new Error(json.error ?? "Playlist creation failed.");
      }
      setResult(json);
      setPhase("done");
    } catch (buildError) {
      setError(buildError instanceof Error ? buildError.message : "Playlist creation failed.");
      setPhase("error");
    } finally {
      buildingRef.current = false;
    }
  }

  if (!planArtists.length) return null;

  return (
    <section className="rounded-3xl bg-white p-4 shadow-soft">
      <div>
        <h3 className="text-xl font-black">Spotify playlist</h3>
        <p className="text-sm text-ink/60">
          One tap builds a public playlist with the top {TRACKS_PER_ARTIST} songs for each of your{" "}
          {planArtists.length} {planArtists.length === 1 ? "artist" : "artists"} — no Spotify login
          needed. Open it, then hit save to keep it in your library.
        </p>
      </div>

      {configured === false ? (
        <p className="mt-3 rounded-2xl bg-paper p-3 text-sm text-ink/70">
          Spotify playlists aren&apos;t configured for this deployment yet. Set{" "}
          <code className="font-mono text-xs">SPOTIFY_CLIENT_SECRET</code> and{" "}
          <code className="font-mono text-xs">SPOTIFY_REFRESH_TOKEN</code> to enable them.
        </p>
      ) : (
        <>
          {phase === "idle" || phase === "building" ? (
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
                disabled={phase === "building" || configured === undefined || !playlistName.trim()}
                onClick={() => void runBuild()}
              >
                {phase === "building" ? "Building…" : "Create playlist"}
              </button>
            </div>
          ) : null}

          {phase === "building" ? (
            <p className="mt-3 text-sm font-bold text-ink/70" role="status">
              Finding each artist&apos;s top tracks and assembling the playlist — usually 10-20
              seconds.
            </p>
          ) : null}

          {phase === "done" && result ? (
            <div className="mt-3 rounded-2xl bg-bay/10 p-3">
              {result.playlistUrl ? (
                <>
                  <p className="font-bold">
                    Done! {result.totalTracks} tracks in “{result.playlistName}”.
                  </p>
                  <a
                    className="mt-2 inline-block rounded-full bg-[#1DB954] px-4 py-2 font-bold text-white"
                    href={result.playlistUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open playlist in Spotify
                  </a>
                  <button
                    className="ml-2 mt-2 rounded-full bg-ink/8 px-4 py-2 font-bold"
                    onClick={() => {
                      setPhase("idle");
                      setResult(undefined);
                    }}
                  >
                    Make another
                  </button>
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
                onClick={() => void runBuild()}
              >
                Try again
              </button>
            </div>
          ) : null}

          {result?.statuses.length ? (
            <ul className="mt-3 grid gap-1.5" aria-label="Playlist build results">
              {result.statuses.map((status) => {
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
