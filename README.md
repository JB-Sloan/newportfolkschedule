# Folk Planner 2026

Unofficial, fan-made Newport Folk Festival planner for July 24-26, 2026.

This app is built to make the static festival schedule usable on a phone at Fort Adams:

- browse the full 2026 schedule by day, stage, and search/filter;
- mark sets as **Interested** or **Must See** with persistent local storage;
- see overlap conflicts and tight stage-transition warnings;
- inspect artist and stage detail sheets with available artist images;
- copy compact share URLs;
- export selected acts to `.ics`;
- open a print-optimized pocket plan for browser "Save as PDF";
- create a private Spotify playlist with the top 10 songs for every selected artist;
- install/save the app as an offline-capable PWA.

Important: the committed schedule is `2026.official.1`, transcribed from Newport Folk's official schedule. Schedule information can still change; confirm critical details with Newport Folk before relying on them.

## Current handoff state

The app is connected to `https://github.com/JB-Sloan/newportfolkschedule` on `main` and is intended to deploy through GitHub to Vercel.

`newport-folk-planner-docs/10_IMPLEMENTATION_HANDOFF.md` captures the original implementation architecture and deployment notes. Some schedule-replacement notes in that handoff are now historical because the official 2026 schedule has been imported.

## Tech stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Zod data validation
- Local-storage persisted plan state
- Custom service worker/PWA shell

Implementation note: the original planning packet mentioned Zustand and Serwist. The current app uses lightweight local React state persisted to local storage and a custom service worker.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Verification

```bash
npm run validate:data
npm test
npm run lint
npm run build
```

Current local verification status:

- data validation passes for 77 schedule items, 74 artists, 5 stages, and 6 policy records;
- unit smoke tests pass for conflict detection, share-plan encoding, and ICS export;
- lint passes with no warnings;
- production build passes;
- a headless Edge smoke test confirms the homepage, artist images, selection flow, My Plan, and artist detail dialog load without failed network responses or console/runtime errors.

`npm test` uses `tsx tests/run-tests.ts`, a small Node assertion smoke-test runner. Vitest is not currently installed.

## Environment variables

Copy `.env.example` to `.env.local` for local AI testing:

```text
OPENROUTER_API_KEY=
OPENROUTER_MODEL=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=
```

The AI assistant and recommendation UI are currently disabled. The archived `/api/assistant` and `lib/recommendations.ts` code remains in the repository for future re-enablement.

## Spotify playlists

The My Plan tab can build a private Spotify playlist containing the top 10 songs
for each selected artist. It uses the Authorization Code + PKCE flow entirely in
the browser, so no server or client secret is needed:

1. Create an app at <https://developer.spotify.com/dashboard>.
2. Add redirect URIs for each origin the app runs on, with a trailing slash:
   `https://www.newportfolkschedule.com/` and `http://127.0.0.1:3000/` for local
   development (Spotify no longer accepts `http://localhost`, so open the dev
   server via `http://127.0.0.1:3000`).
3. Set `NEXT_PUBLIC_SPOTIFY_CLIENT_ID` in `.env.local` (and in Vercel project
   settings for production).

Schedule billings that are not literal Spotify artist names (side projects,
tribute sets, multi-artist billings, non-musical sets) are resolved through the
curated override map in `data/spotify-artist-map.json` — for example Brandon
Flowers resolves to The Killers and the R.E.M. tribute set pulls R.E.M. tracks.
Multi-artist billings blend a few top tracks from each artist. Update that file
when the lineup changes.

## Schedule update workflow

When Newport Folk publishes schedule changes:

1. Update `data/schedule-2026.json` with verified official schedule rows.
2. Update `data/artists-2026.json` when artists, metadata, or image credits change.
3. Update `data/schedule-manifest.json` with a new `scheduleVersion`, publish time, verification time, and verifier initials.
4. Keep stable set IDs when times/stages move.
5. Run:

   ```bash
   npm run validate:data
   npm test
   npm run build
   ```

6. Compare the rendered schedule against the official source twice: once against data rows and once against the UI.
7. Deploy through GitHub -> Vercel.

## Disclaimer

Unofficial fan-made planning tool. Not affiliated with or endorsed by Newport Festivals Foundation. Schedule information is subject to change; confirm critical details with Newport Folk.