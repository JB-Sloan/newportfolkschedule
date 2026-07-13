# Implementation Handoff Notes

Last updated: 2026-07-13

This document records the current implementation state for the next developer or agent picking up the project.

## Current repository

- Canonical GitHub repository: `https://github.com/JB-Sloan/newportfolkschedule`
- Main branch: `main`
- Official schedule import commit: `91e7bfb`
- Local project root: `C:\Users\JBSloan\newport-folk-planner`

The app was also briefly pushed to `hethatGive/newportfolkschedule` during setup, but the requested/canonical repository is now `JB-Sloan/newportfolkschedule`.

## What has been built

The repository contains a working Next.js App Router application.

Implemented:

- mobile-first schedule view with day tabs, stage filter, search, selected-only filter, hide-ended toggle, and compact/comfortable density;
- persisted local selections using the local storage key `newport-folk-planner:v1`;
- priority cycle: unselected -> Interested -> Must See -> unselected;
- My Plan view with selected acts grouped by day;
- Now / Next view using the device clock;
- artist detail sheet with Spotify search fallback and available artist images;
- stage detail sheet with official/observed/unknown status labels;
- conflict detection for direct overlaps and tight stage transitions;
- share URLs that encode schedule version, selected IDs/priorities, and transition buffer;
- `.ics` export in `America/New_York`;
- print route at `/print` for browser print / Save as PDF;
- offline page, PWA manifest, SVG icon, custom service worker at `public/sw.js`, and mobile web app metadata;
- archived server-only `/api/assistant` route with OpenRouter support and deterministic fallback;
- build-time data validation script;
- lightweight smoke tests for conflicts, share encoding, and ICS output.

The app now uses the imported `2026.official.1` schedule data. It is still unofficial and schedule details should be confirmed with Newport Folk before relying on them.

## Important implementation differences from the original plan

- Zustand is not currently used. Plan state is implemented with React state plus local storage in `components/FolkPlannerApp.tsx`.
- Serwist is not currently used. Offline support is a small custom service worker in `public/sw.js`.
- Vitest is not currently used. Tests use a small Node assertion runner at `tests/run-tests.ts`.
- Direct PDF Blob generation is not implemented yet. The current supported PDF path is the print-optimized `/print` route and browser "Save as PDF".
- QR code display is not implemented yet. Share links are implemented through copy-to-clipboard.
- AI and recommendation UI is currently disabled. `/api/assistant`, `lib/recommendations.ts`, and the archived React components remain available for future re-enablement.

## Commands that should pass

Run from the repository root:

```bash
npm install
npm run validate:data
npm test
npm run lint
npm run build
```

As of the official schedule import, all four verification commands pass locally.

## Local preview

```bash
npm run dev
```

Open:

```text
http://127.0.0.1:3000/
```

If starting from PowerShell, use `npm.cmd` if script execution policy blocks `npm`.

## Files and areas to know

- `components/FolkPlannerApp.tsx` is the main interactive planner UI and local plan state owner.
- `components/PrintPlan.tsx` renders the print/PDF route.
- `lib/schemas.ts` contains Zod schemas for data and assistant contracts.
- `lib/conflicts.ts` is the deterministic conflict engine.
- `lib/recommendations.ts` is the archived offline recommendation engine.
- `lib/ics.ts` generates calendar files.
- `lib/share-plan.ts` encodes and decodes compact plan URLs.
- `scripts/validate-data.ts` is the build-time data integrity gate.
- `data/*.json` is the canonical bundled schedule, artist, stage, policy, and manifest data.
- `public/images/artists/*` contains the local artist thumbnails referenced by `data/artists-2026.json`.

## Data status

Current data version:

```text
2026.official.1
```

Current dataset:

- 77 schedule items
- 74 artist records
- 5 stage records
- 6 policy records
- 34 referenced local artist images

When Newport Folk publishes schedule changes, update the JSON data and `data/schedule-manifest.json`. Keep stable set IDs when a set moves, so saved selections and calendar UIDs survive schedule changes.

## Vercel deployment note

Local production build for commit `91e7bfb` completed successfully and generated `/`, `/about`, `/offline`, `/print`, `/manifest.webmanifest`, and `/api/assistant`.

GitHub `main` is pushed to `JB-Sloan/newportfolkschedule`, but the public production domain `https://www.newportfolkschedule.com/` returned Vercel platform `NOT_FOUND` immediately after the push. The apex domain redirects to `www`.

That result is not caused by the checked-in Next.js routes. Check these Vercel settings before changing app code:

1. Confirm the Vercel project is imported from `JB-Sloan/newportfolkschedule`.
2. Confirm the deployment for commit `91e7bfb` or later is promoted to Production.
3. Confirm `www.newportfolkschedule.com` and, if desired, `newportfolkschedule.com` are assigned under Settings -> Domains.
4. Check Settings -> Deployment Protection. Generated deployment URLs may be protected even when the production domain is intended to be public.

## Known follow-up work

Highest priority:

1. Fix/confirm Vercel project-domain wiring if production still returns `NOT_FOUND`.
2. Perform a real production PWA/offline test after the production domain is public.
3. Add production OpenRouter environment variables only after selecting a model and budget/rate limits.
4. Consider replacing the custom service worker with Serwist if more robust cache versioning is needed.

Nice-to-have:

- QR code display for shared plans.
- Direct generated PDF download.
- Playwright browser smoke tests.
- Schedule-diff UI for moved/cancelled sets.
- Friend/group comparison flow.

## Safety reminders

- Do not use the official Newport Folk logo or reproduce official schedule artwork without permission.
- Keep the visible unofficial-site disclaimer.
- AI UI is disabled; if re-enabled, do not send local plan data until the user explicitly opens/uses the assistant.
- If re-enabled, AI responses must only recommend IDs from the validated local dataset.
- Calendar exports are snapshots; they do not auto-update after schedule changes.
