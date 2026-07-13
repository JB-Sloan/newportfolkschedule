# Ready-to-Paste Coding Agent Prompts

## Prompt A — Core scaffold and data contracts

```text
Build the core of an unofficial Newport Folk 2026 personal schedule planner in a new Next.js App Router repository.

Read these project documents first:
- 00_README.md
- 01_PRODUCT_REQUIREMENTS.md
- 03_TECHNICAL_ARCHITECTURE.md
- 04_DATA_MODEL_AND_INGESTION.md

Requirements:
1. TypeScript strict mode, Tailwind, ESLint.
2. Add Zod schemas for schedule items, artists, stages, policies, and manifest.
3. Add small schema-valid placeholder datasets for July 24–26, 2026. Clearly label them placeholder data.
4. Add a build-time validation script that fails for unknown IDs, invalid timestamps, duplicate IDs, and same-stage overlaps.
5. Render a simple schedule list grouped by day and stage.
6. Add tests for schemas and sorting.
7. Add a schedule version indicator and unofficial-site disclaimer.
8. Do not use the official Newport Folk logo or schedule artwork.
9. Do not add a database or authentication.
10. Run lint, tests, and production build.

Before coding, summarize the proposed files. Keep changes within the stated scope. At completion, provide changed files, commands run, results, and known issues.
```

## Prompt B — Planner UI and persistence

```text
Implement the interactive planner UI using the existing validated schedule data.

Read:
- 01_PRODUCT_REQUIREMENTS.md
- 02_UI_UX_SPEC.md
- 03_TECHNICAL_ARCHITECTURE.md

Own only components/schedule, components/plan, stores, and directly required page composition files.

Requirements:
1. Mobile-first day tabs, stage filters, search, list/grid toggle.
2. Desktop timeline with stage columns and sticky headers.
3. Selection states: Must See, Interested, unselected.
4. Persist only IDs/priorities/settings in local storage.
5. My Plan chronological view.
6. Now / Next view based on America/New_York device-normalized times.
7. Accessible keyboard and screen-reader behavior.
8. Do not make hover the only way to access details.
9. Add tests for persistence and selection behavior.
10. Avoid unrelated refactors.

Run lint, tests, and build. Return a concise handoff.
```

## Prompt C — Conflict engine

```text
Implement a pure, well-tested schedule conflict engine.

Requirements:
1. Detect direct interval overlaps.
2. Detect insufficient stage-transition gaps using a configurable 0/5/10/15-minute buffer.
3. No transition warning for consecutive sets on the same stage.
4. Return conflict clusters, not only pairs.
5. Use the same result model for UI, print, ICS notes, and AI context.
6. Add comprehensive unit tests including edge-touching intervals, three-way conflicts, and timezone-safe timestamps.
7. Integrate warnings into Schedule and My Plan without changing their overall design.

Do not ask an LLM to calculate conflicts. All calculations must be deterministic code.
```

## Prompt D — Artist and stage details

```text
Implement artist and stage detail experiences.

Read 02_UI_UX_SPEC.md and 08_STAGE_INFORMATION_WORKSHEET.md.

Requirements:
1. Desktop hover/focus preview plus click-pinned detail panel.
2. Mobile tap bottom sheet.
3. Artist: name, time/stage, short bio, tags, selection, Spotify link, official link, similar-act action.
4. Stage: seating, shade, blanket/chair rules, surface, accessibility, transitions, amenities, source/status.
5. Clearly label official, observed, and unknown information.
6. If Spotify URL is absent, create a safe Spotify search URL from the artist name.
7. No autoplay or embedded Spotify player.
8. No artist images unless rights/source handling is explicitly implemented.
9. Meet keyboard, focus, and touch-target requirements.
```

## Prompt E — Offline PWA

```text
Add production-quality offline PWA behavior using Serwist or the current recommended Next.js-compatible approach.

Read the offline sections of 01_PRODUCT_REQUIREMENTS.md, 02_UI_UX_SPEC.md, 03_TECHNICAL_ARCHITECTURE.md, and 07_QA_DEPLOYMENT_OPERATIONS.md.

Requirements:
1. Installable manifest and locally hosted icons.
2. Cache app shell and all current schedule/artist/stage/policy data.
3. Offline fallback page.
4. Visible online/offline and offline-readiness status.
5. Do not claim “Saved for offline” until required resources are confirmed cached for the current schedule version.
6. Network-only behavior for AI with graceful offline fallback.
7. Do not break service-worker updates or user selections.
8. Add a Playwright or documented automated offline test.
9. Verify with a production build, not only dev mode.

Return exact manual steps to test airplane-mode reload.
```

## Prompt F — Export and sharing

```text
Implement personalized export and sharing.

Requirements:
1. Generate a single .ics calendar file client-side for selected acts.
2. Use America/New_York timezone and stable UIDs.
3. Include artist, stage, Fort Adams location, official schedule URL, schedule version, and optional 10-minute alarm.
4. Add dedicated print route with pocket and landscape-grid layouts.
5. Print output must work offline and without color.
6. Add a share URL that encodes only version, selected IDs/priorities, and transition buffer.
7. Validate and cap all decoded shared input.
8. Offer merge, replace, and preview behavior when opening a shared plan.
9. Add tests for ICS escaping, share encode/decode, and selected-item filtering.
10. Dynamically load optional PDF/QR libraries so the schedule bundle stays small.
```

## Prompt G — OpenRouter recommendations

```text
Implement the AI recommendation layer and side panel.

Read 05_AI_RECOMMENDATIONS_AND_CHAT.md.

Requirements:
1. Server-only POST /api/assistant route.
2. OPENROUTER_API_KEY and OPENROUTER_MODEL environment variables; never expose the key client-side.
3. Validate client request with Zod.
4. Server loads canonical festival data and resolves selection IDs.
5. Use OpenRouter structured output for recommendation mode.
6. Validate model output and discard unknown IDs.
7. Recalculate schedule conflicts in deterministic code.
8. Add a deterministic offline recommendation engine.
9. Side panel renders recommendation cards with explicit Select actions.
10. AI text may never directly mutate the plan.
11. Add request-size, token, timeout, rate-limit, and budget-conscious controls.
12. Show offline and error fallbacks.
13. Add tests for hallucinated/unknown IDs and malformed output.

Do not enable general web search for the assistant. It should answer from the validated local festival context.
```

## Prompt H — Final integration review

```text
Perform a release-candidate integration review of the Newport Folk planner.

Do not redesign the application. Identify and fix only release-blocking issues.

Run:
- lint
- unit/component tests
- production build
- Playwright smoke tests
- offline reload test
- mobile viewport review
- print preview
- ICS generation/import sanity check

Review specifically:
1. schedule data correctness and stable IDs;
2. local state migration/version handling;
3. conflicts consistent across views and exports;
4. mobile touch and keyboard accessibility;
5. service-worker cache/version behavior;
6. OpenRouter key not exposed;
7. AI output IDs validated;
8. unofficial-site disclaimer and official links;
9. no copied official logo/schedule graphic;
10. bundle impact from PDF, QR, and AI UI.

Return a table of blockers, fixes made, residual risks, and exact deployment steps.
```

