# One-Session Build Runbook

## 1. Outcome for today

By the end of the session, the repository should have:

- a deployed Vercel preview;
- placeholder but schema-valid festival data;
- mobile and desktop schedule views;
- persisted Must See / Interested selections;
- conflict detection;
- artist and stage detail sheets;
- Spotify links;
- My Plan and Now / Next views;
- offline PWA behavior;
- print/PDF and ICS export path;
- OpenRouter recommendation endpoint and side panel;
- automated tests for core logic;
- a documented schedule-replacement workflow for tomorrow.

## 2. Working method with two agents

Use one agent as **architecture/integration owner** and the other as **feature implementer/reviewer**. Avoid having both edit the same files simultaneously.

Suggested roles:

### Codex

- project scaffold;
- schemas and data import;
- schedule grid/list;
- local state;
- conflicts;
- ICS/print utilities;
- tests.

### Claude Code

- UI polish and responsive behavior;
- artist/stage sheets;
- PWA/Serwist integration;
- AI panel and OpenRouter route;
- accessibility review;
- integration review.

Reverse the assignments if one tool is stronger in the chosen codebase. The critical rule is file ownership by task.

## 3. Git strategy

Branches:

```text
main
feature/core-planner
feature/pwa-ui-ai
```

Sequence:

1. create repository and scaffold on `main`;
2. commit baseline immediately;
3. create both feature branches;
4. core branch lands schemas/store/grid first;
5. second branch rebases before integrating PWA and AI;
6. merge through pull requests with Vercel previews;
7. tag launch candidate before replacing placeholder schedule.

Use small commits with explicit scopes:

```text
feat(data): add validated schedule schemas
feat(plan): persist selection priorities
feat(schedule): add responsive timeline grid
feat(export): generate ICS calendar
feat(pwa): cache schedule and app shell
feat(ai): add structured recommendations
```

## 4. Time-boxed implementation plan

### Block 1 — 45 minutes: scaffold and contracts

- create Next.js TypeScript app;
- install dependencies;
- configure lint, format, tests;
- add schemas and placeholder data;
- add manifest/version display;
- deploy first Vercel preview.

Exit criterion: `pnpm build` passes and placeholder schedule renders as plain text.

### Block 2 — 90 minutes: core planner

- schedule list and desktop grid;
- mobile day/stage controls;
- plan store with persistence;
- selection states;
- My Plan;
- search/filter.

Exit criterion: selections survive refresh and work across all views.

### Block 3 — 60 minutes: conflict and details

- conflict engine and tests;
- artist sheet;
- stage sheet;
- Spotify links;
- schedule-version update handling.

Exit criterion: overlapping picks produce exact warnings.

### Block 4 — 75 minutes: offline and exports

- manifest and icons;
- service worker/Serwist;
- offline page and status;
- print route;
- ICS download;
- share URL.

Exit criterion: after one online load, airplane-mode reload works and My Plan remains available.

### Block 5 — 75 minutes: AI

- OpenRouter environment setup;
- deterministic recommender;
- `/api/assistant` with structured output;
- side panel and recommendation cards;
- rate limits/error fallback;
- offline handling.

Exit criterion: AI returns only valid set IDs and the app still recommends offline.

### Block 6 — 60 minutes: QA and polish

- mobile viewport checks;
- keyboard/focus review;
- print preview;
- calendar import test;
- Lighthouse/PWA audit;
- production build;
- merge and deploy release candidate.

## 5. Dependency installation suggestion

Start conservative and add packages only as needed.

```bash
pnpm create next-app@latest folk-planner \
  --typescript --tailwind --eslint --app --src-dir=false --import-alias='@/*'

cd folk-planner
pnpm add zod zustand date-fns clsx tailwind-merge
pnpm add @openrouter/sdk
pnpm add @serwist/next serwist
pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom
pnpm add -D @playwright/test
```

Optional after core functionality:

```bash
pnpm add @react-pdf/renderer qrcode.react
pnpm add @upstash/redis @upstash/ratelimit
```

Pin the lockfile after the first successful build.

## 6. Definition of done by feature

### Schedule

- correct sorting by date/time/stage;
- no layout dependence on network requests;
- mobile tap targets pass review;
- accessible list alternative exists.

### Plan persistence

- selection IDs and priorities persist;
- version migration does not erase valid selections;
- clear-plan requires confirmation.

### Offline

- cached shell and data;
- offline reload tested, not merely service-worker registration;
- no remote font dependency;
- AI and Spotify failures do not break the page.

### Export

- ICS imports into at least Google Calendar and Apple Calendar test environments;
- timezone correct;
- PDF/print matches selected acts;
- conflicts visible;
- schedule version included.

### AI

- server-only API key;
- strict response validation;
- unknown IDs filtered;
- deterministic fallback;
- budget/rate limits configured;
- errors are user-readable.

## 7. Schedule-release procedure tomorrow

1. Download official day images.
2. Run image extraction to `schedule.draft.csv`.
3. Verify every row manually.
4. Run importer and validation.
5. Add minimum artist metadata and Spotify links.
6. Render and compare all stage/day columns with the official images.
7. Update manifest version.
8. Deploy preview.
9. Test offline cache version.
10. Promote to production.

Target time from publication to production: 90–150 minutes, depending on metadata completeness.

## 8. Scope cuts if behind schedule

Cut in this order:

1. direct downloadable PDF library; retain print/save-PDF route;
2. AI free-form chat; retain recommendation mode;
3. group comparison;
4. QR code; retain copy-link sharing;
5. desktop hover preview; retain click details;
6. schedule-change diff UI; retain version notice;
7. advanced genre filters.

Never cut:

- offline schedule and plan;
- accurate data validation;
- mobile usability;
- persisted selections;
- conflict detection;
- official-source attribution;
- ICS or at least print export.

## 9. Agent coordination checklist

Before each agent starts:

- provide exact owned files/directories;
- state acceptance tests;
- prohibit broad refactors outside scope;
- require `pnpm lint`, `pnpm test`, and `pnpm build` before completion;
- require a concise handoff note listing changed files and known issues.

Before merge:

- rebase;
- run complete test/build suite;
- inspect Vercel preview on mobile;
- test airplane mode;
- verify no secrets in client bundles or Git history.

