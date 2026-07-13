# Folk Planner 2026

Unofficial, fan-made Newport Folk Festival planner for July 24–26, 2026.

This app is built to make a static festival schedule usable on a phone at Fort Adams:

- browse the full placeholder schedule by day, stage, and search/filter;
- mark sets as **Interested** or **Must See** with persistent local storage;
- see overlap conflicts and tight stage-transition warnings;
- inspect artist and stage detail sheets;
- use deterministic offline recommendations and an optional OpenRouter-backed assistant;
- copy compact share URLs;
- export selected acts to `.ics`;
- open a print-optimized pocket plan for browser “Save as PDF”;
- install/save the app as an offline-capable PWA.

Important: the committed schedule is placeholder data for development. Replace it with the official Newport Folk 2026 schedule as soon as it is published.

## Current handoff state

The first implementation pass is complete and pushed to `https://github.com/JB-Sloan/newportfolkschedule` on `main`.

Read `newport-folk-planner-docs/10_IMPLEMENTATION_HANDOFF.md` before continuing development. It captures the current architecture, verification status, implementation shortcuts, Vercel deployment gotchas, and remaining work.

## Tech stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Zod data validation
- Local-storage persisted plan state
- Custom service worker/PWA shell
- Server-only `/api/assistant` OpenRouter integration with deterministic fallback

Implementation note: the original planning packet mentioned Zustand and Serwist. The current app uses lightweight local React state persisted to local storage and a custom service worker. See the handoff doc before swapping either piece.

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

- data validation passes for 27 placeholder schedule items, 27 artists, 3 stages, and 6 policy records;
- unit smoke tests pass for conflict detection, share-plan encoding, and ICS export;
- lint passes;
- production build passes.

`npm test` uses `tsx tests/run-tests.ts`, a small Node assertion smoke-test runner. Vitest is not currently installed.

## Environment variables

Copy `.env.example` to `.env.local` for local AI testing:

```text
OPENROUTER_API_KEY=
OPENROUTER_MODEL=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

If OpenRouter is not configured, the assistant panel still returns deterministic offline recommendations.

## Schedule replacement workflow

When the official 2026 schedule is published:

1. Replace `data/schedule-2026.json` with verified official schedule rows.
2. Update `data/artists-2026.json` with minimum original artist summaries and metadata.
3. Update `data/schedule-manifest.json` with a real `scheduleVersion`, publish time, verification time, and verifier initials.
4. Keep stable set IDs when times/stages move.
5. Run:

   ```bash
   npm run validate:data
   npm test
   npm run build
   ```

6. Compare the rendered schedule against the official source twice: once against data rows and once against the UI.
7. Deploy through GitHub → Vercel.

## Disclaimer

Unofficial fan-made planning tool. Not affiliated with or endorsed by Newport Festivals Foundation. Schedule information is subject to change; confirm critical details with Newport Folk.
