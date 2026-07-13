# Implementation Handoff Notes

Last updated: 2026-07-13

This document records the current implementation state after the first build pass. It is intended for the next developer or agent picking up the project.

## Current repository

- Canonical GitHub repository: `https://github.com/JB-Sloan/newportfolkschedule`
- Main branch: `main`
- Current implementation commit at handoff: `9f8c31f`
- Local project root: `C:\Users\JBSloan\newport-folk-planner`

The app was also briefly pushed to `hethatGive/newportfolkschedule` during setup, but the requested/canonical repository is now `JB-Sloan/newportfolkschedule`.

## What has been built

The repository now contains a working Next.js App Router application, not just the original planning docs.

Implemented:

- mobile-first schedule view with day tabs, stage filter, search, selected-only filter, hide-ended toggle, and compact/comfortable density;
- persisted local selections using the local storage key `newport-folk-planner:v1`;
- priority cycle: unselected -> Interested -> Must See -> unselected;
- My Plan view with selected acts grouped by day;
- Now / Next view using the device clock;
- Explore view with deterministic offline recommendations;
- artist detail sheet with Spotify search fallback;
- stage detail sheet with official/observed/unknown status labels;
- conflict detection for direct overlaps and tight stage transitions;
- share URLs that encode schedule version, selected IDs/priorities, and transition buffer;
- `.ics` export in `America/New_York`;
- print route at `/print` for browser print / Save as PDF;
- offline page, PWA manifest, SVG icon, and a custom service worker at `public/sw.js`;
- server-only `/api/assistant` route with OpenRouter support and deterministic fallback;
- build-time data validation script;
- lightweight smoke tests for conflicts, share encoding, and ICS output.

The app intentionally uses placeholder schedule and artist data. It must not be treated as the official Newport Folk 2026 schedule.

## Important implementation differences from the original plan

- Zustand is not currently used. Plan state is implemented with React state plus local storage in `components/FolkPlannerApp.tsx`.
- Serwist is not currently used. Offline support is a small custom service worker in `public/sw.js`.
- Vitest is not currently used. A previous install was internally inconsistent on this Windows/Node setup, so tests use a small Node assertion runner at `tests/run-tests.ts`.
- Direct PDF Blob generation is not implemented yet. The current supported PDF path is the print-optimized `/print` route and browser "Save as PDF".
- QR code display is not implemented yet. Share links are implemented through copy-to-clipboard.
- OpenRouter is optional. Without `OPENROUTER_API_KEY` and `OPENROUTER_MODEL`, `/api/assistant` returns deterministic recommendations.

## Commands that should pass

Run from the repository root:

```bash
npm install
npm run validate:data
npm test
npm run lint
npm run build
```

As of this handoff, all four verification commands pass locally.

## Local preview

```bash
npm run dev
```

Open:

```text
http://127.0.0.1:3000/
```

The app was locally verified on the Next.js dev server. If starting from PowerShell, use `npm.cmd` if script execution policy blocks `npm`.

## Files and areas to know

- `components/FolkPlannerApp.tsx` is the main interactive planner UI and local plan state owner.
- `components/PrintPlan.tsx` renders the print/PDF route.
- `lib/schemas.ts` contains Zod schemas for data and assistant contracts.
- `lib/conflicts.ts` is the deterministic conflict engine.
- `lib/recommendations.ts` is the offline recommendation engine.
- `lib/ics.ts` generates calendar files.
- `lib/share-plan.ts` encodes and decodes compact plan URLs.
- `scripts/validate-data.ts` is the build-time data integrity gate.
- `data/*.json` is the canonical bundled schedule, artist, stage, policy, and manifest data.

## Data status

Current data version:

```text
2026.placeholder.1
```

Current placeholder dataset:

- 27 schedule items
- 27 artist records
- 3 stage records
- 6 policy records

When the official 2026 schedule is published, replace the placeholder data and update `data/schedule-manifest.json`. Keep stable set IDs when a set moves, so saved selections and calendar UIDs survive schedule changes.

## Vercel deployment note

The Vercel build for commit `9f8c31f` completed successfully and generated `/`, `/about`, `/offline`, `/print`, `/manifest.webmanifest`, and `/api/assistant`.

If a Vercel URL shows a platform `404: NOT_FOUND` or redirects through `vercel.com/sso-api`, that is not caused by the Next.js routes. The observed deployment URL was protected by Vercel Deployment Protection / Vercel Authentication before the app ran.

Check these Vercel settings before changing app code:

1. Confirm the project is imported from `JB-Sloan/newportfolkschedule`.
2. Confirm the deployment for commit `9f8c31f` or later is promoted to Production.
3. Confirm the intended production domain is assigned under Settings -> Domains.
4. Check Settings -> Deployment Protection. Generated deployment URLs may be protected even when the production domain is public.

The expected public production domain may not automatically be `newportfolkschedule.vercel.app` unless Vercel has assigned that alias to the project.

## Known follow-up work

Highest priority:

1. Replace placeholder data with the verified official 2026 schedule.
2. Do a rendered UI verification pass against the official source.
3. Perform a real production PWA/offline test after Vercel production domain setup is correct.
4. Add production OpenRouter environment variables only after selecting a model and budget/rate limits.
5. Consider replacing the custom service worker with Serwist if more robust cache versioning is needed.

Nice-to-have:

- QR code display for shared plans.
- Direct generated PDF download.
- Playwright browser smoke tests.
- Schedule-diff UI for moved/cancelled sets.
- Friend/group comparison flow.

## Safety reminders

- Do not use the official Newport Folk logo or reproduce official schedule artwork without permission.
- Keep the visible unofficial-site disclaimer.
- Do not send local plan data to AI until the user opens/uses the assistant.
- AI responses must only recommend IDs from the validated local dataset.
- Calendar exports are snapshots; they do not auto-update after schedule changes.