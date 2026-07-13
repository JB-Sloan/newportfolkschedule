# Technical Architecture

## 1. Architecture summary

The launch version is a mostly static, offline-first Next.js application. Schedule, artist, stage, and policy data are version-controlled and validated at build time. User state is stored locally. Server execution is limited to AI requests and optional rate limiting.

```text
Official schedule image/page
          |
          v
Manual/AI-assisted extraction -> CSV/JSON -> validation script -> Git commit
                                                        |
                                                        v
                                              Next.js static build
                                                        |
                         +------------------------------+--------------------+
                         |                                                   |
                         v                                                   v
                  Browser/PWA cache                                  /api/assistant
       schedule + metadata + user plan                         OpenRouter server call
                         |                                                   |
                         +--> PDF/print, ICS, sharing                         |
                                      all client-side              structured, validated JSON
```

## 2. Recommended stack

### Core

- Next.js App Router (`create-next-app@latest`)
- TypeScript with strict mode
- React
- Tailwind CSS
- accessible primitives from Radix UI or shadcn/ui as needed
- Zod for runtime schemas
- Zustand with `persist` middleware for local plan state
- date-fns for time formatting and interval logic

### Offline

- `@serwist/next` and `serwist`
- web app manifest
- offline fallback page
- explicit cache version tied to `scheduleVersion`

### Export and sharing

- native Blob creation for `.ics`
- print CSS and dedicated `/print` route
- dynamically imported `@react-pdf/renderer` or `pdf-lib` only after the print route is stable
- QR-code package loaded only on the share/export sheet

### AI

- `@openrouter/sdk` or server-side `fetch` to OpenRouter
- Zod schema for request and response validation
- structured output using JSON Schema
- optional Upstash Redis rate limiting

### Testing

- Vitest for utilities and data validation
- React Testing Library for interaction tests
- Playwright for mobile, print, offline, and export flows
- Lighthouse/PWA audit

## 3. Repository structure

```text
folk-planner/
├─ app/
│  ├─ api/
│  │  └─ assistant/route.ts
│  ├─ offline/page.tsx
│  ├─ print/page.tsx
│  ├─ about/page.tsx
│  ├─ manifest.ts
│  ├─ layout.tsx
│  └─ page.tsx
├─ components/
│  ├─ schedule/
│  │  ├─ ScheduleGrid.tsx
│  │  ├─ ScheduleList.tsx
│  │  ├─ SetCard.tsx
│  │  ├─ TimeRuler.tsx
│  │  └─ DayTabs.tsx
│  ├─ plan/
│  │  ├─ MyPlan.tsx
│  │  ├─ ConflictPanel.tsx
│  │  └─ NowNext.tsx
│  ├─ details/
│  │  ├─ ArtistSheet.tsx
│  │  └─ StageSheet.tsx
│  ├─ ai/
│  │  ├─ AssistantPanel.tsx
│  │  └─ RecommendationCards.tsx
│  ├─ export/
│  │  ├─ ExportSheet.tsx
│  │  └─ PrintablePlan.tsx
│  └─ ui/
├─ data/
│  ├─ schedule-2026.json
│  ├─ artists-2026.json
│  ├─ stages-2026.json
│  ├─ policies-2026.json
│  └─ schedule-manifest.json
├─ lib/
│  ├─ schemas.ts
│  ├─ schedule.ts
│  ├─ conflicts.ts
│  ├─ recommendations.ts
│  ├─ ics.ts
│  ├─ share-plan.ts
│  ├─ openrouter.ts
│  └─ constants.ts
├─ stores/
│  └─ plan-store.ts
├─ scripts/
│  ├─ import-schedule.ts
│  ├─ validate-data.ts
│  ├─ generate-search-links.ts
│  └─ diff-schedule.ts
├─ public/
│  ├─ icons/
│  └─ stage-map-optional.*
├─ tests/
├─ worker/
│  └─ sw.ts
├─ .env.example
├─ next.config.ts
├─ package.json
└─ README.md
```

## 4. Rendering strategy

### Static/public routes

The schedule, plan UI, offline page, and About page should prerender. Data can be imported directly from validated JSON so the application works without a runtime data request.

### Client components

Use client components only where necessary:

- selection state;
- current-time updates;
- filters;
- export generation;
- AI chat interaction;
- install prompt;
- online/offline status.

Keep the top-level page and static explanatory content server-rendered.

### Dynamic server route

`POST /api/assistant` is dynamic and server-only. The OpenRouter key never reaches the client.

## 5. State architecture

Persist only user-generated state:

```ts
type Priority = 'must' | 'interested';

type PlanState = {
  scheduleVersion: string;
  selections: Record<string, Priority>;
  transitionBufferMinutes: number;
  preferredStageId?: string;
  hiddenSetIds: string[];
  lastAiRecommendations?: AiRecommendationResult;
};
```

Do not duplicate full artist or schedule objects in local storage. Store stable IDs and resolve them against the current dataset.

On data-version change:

1. retain selections whose IDs still exist;
2. report moved times/stages using the schedule diff;
3. list removed IDs as orphaned selections;
4. allow the user to dismiss the update notice.

## 6. Stable identifiers

Set IDs must not be generated from time or stage alone because those values can change. Use a normalized artist/project slug plus date and optional occurrence suffix:

```text
2026-07-25-lucius
2026-07-25-sea-to-shining-sea
2026-07-25-artist-name-2
```

When an artist moves stages or times, keep the same ID. This preserves selections and calendar UIDs.

## 7. Offline/PWA design

### Cached assets

Precache:

- application shell;
- current schedule, artist, stage, policy, and manifest data;
- fonts hosted by the application;
- icons;
- offline page.

Runtime strategies:

- `/_next/static/*`: cache first;
- navigation: network first with cached fallback;
- schedule/data: stale-while-revalidate while online, but bundled data remains available;
- Spotify and artist external links: do not proxy or cache;
- AI route: network only with explicit offline failure handling.

### Offline readiness check

After service-worker activation, the app should request/check all required URLs and store a marker:

```text
offlineReadyVersion = 2026.07.14.1
```

The UI displays **Saved for offline** only when this marker matches the active schedule version.

### Update behavior

Do not force-reload while a user is on site. When a new service worker or schedule version is available:

- show a non-blocking update banner;
- allow **Update now**;
- save the local plan before reload;
- show a schedule change summary after reload.

## 8. Conflict engine

Represent times as ISO timestamps with the event timezone. For each pair of selected sets:

```text
actual overlap = max(startA, startB) < min(endA, endB)
transition warning = different stages AND gap < transitionBuffer
```

The engine returns clusters rather than only pairs so three-way conflicts are understandable.

```ts
type Conflict = {
  type: 'overlap' | 'transition';
  setIds: string[];
  overlapMinutes?: number;
  availableTransitionMinutes?: number;
  requiredTransitionMinutes?: number;
};
```

All views and exports consume the same engine.

## 9. Calendar export

Generate ICS in the browser. Required properties:

- `BEGIN:VCALENDAR`
- `VERSION:2.0`
- `PRODID`
- `CALSCALE:GREGORIAN`
- one `VEVENT` per selected set
- stable `UID`
- `DTSTAMP`
- `DTSTART;TZID=America/New_York`
- `DTEND;TZID=America/New_York`
- escaped `SUMMARY`, `LOCATION`, and `DESCRIPTION`
- optional `VALARM`

Return/download with MIME type `text/calendar;charset=utf-8` and a filename such as `newport-folk-plan-2026.ics`.

Include a warning in the UI:

> Calendar imports are a snapshot. Check the planner or official schedule for changes.

## 10. PDF/print architecture

### Phase 1

Dedicated `/print` route reads the persisted plan and applies `@media print` styles. It is fully offline and has no dependency on a server.

### Phase 2

Dynamically import a client PDF renderer on demand. Pass a normalized `PrintablePlanModel`; do not let PDF code independently calculate conflicts or formatting data.

```ts
type PrintablePlanModel = {
  generatedAt: string;
  scheduleVersion: string;
  days: Array<{
    date: string;
    items: Array<{
      startLabel: string;
      endLabel: string;
      artistName: string;
      stageName: string;
      priority: Priority;
      warning?: string;
    }>;
  }>;
};
```

## 11. Share links

Encode only compact state, not full metadata:

```json
{
  "v": "2026.07.14.1",
  "s": [["artist-id", "m"], ["artist-id-2", "i"]],
  "b": 5
}
```

Use a URL-safe compact encoding. Validate decoded input strictly and cap the number/length of IDs. The server does not need to store a shared plan.

If the payload becomes too long, add a later server-side short-code service. Do not block MVP on it.

## 12. OpenRouter route

### Server responsibilities

- parse and validate request;
- attach only known public context;
- enforce length and rate limits;
- call an explicitly configured model;
- request structured output for recommendations;
- validate response against Zod;
- discard unknown artist IDs;
- return normalized cards;
- log request ID, duration, model, and token usage without logging unnecessary user text.

### Environment variables

```text
OPENROUTER_API_KEY=
OPENROUTER_MODEL=
NEXT_PUBLIC_SITE_URL=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

For a one-day launch, `OPENROUTER_MODEL` should be configurable without code changes. Do not use a floating model alias in production unless cost and behavior changes are acceptable.

### Cost and abuse controls

- daily OpenRouter account budget limit;
- request size cap;
- maximum completion tokens;
- temperature kept low for planning questions;
- per-IP and per-session rate limit;
- reject automated bulk requests;
- optional Turnstile challenge after repeated use.

## 13. Security headers

Set at least:

- Content-Security-Policy appropriate to self-hosted assets and OpenRouter route behavior;
- `Referrer-Policy: strict-origin-when-cross-origin`;
- `X-Content-Type-Options: nosniff`;
- `Permissions-Policy` disabling unneeded camera, microphone, and geolocation;
- frame protection via CSP `frame-ancestors`.

No OpenRouter key, rate-limit credential, or private prompt is placed in `NEXT_PUBLIC_*` variables.

## 14. Observability

Track:

- successful schedule data version loads;
- offline-ready completion;
- export success/failure;
- AI request count, latency, error class, and cost/usage;
- client errors;
- schedule-update adoption.

Avoid logging user selections as a named profile. Aggregate analytics are enough.

## 15. Deployment

- GitHub repository connected to Vercel;
- preview deployment on every pull request;
- production branch protected;
- environment variables separated for preview and production;
- custom domain attached after core functionality works;
- schedule data updates go through a small PR so Vercel preview can be verified before promotion.

