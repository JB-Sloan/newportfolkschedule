# Newport Folk Personal Planner — Build Packet

**Working title:** Folk Planner 2026  
**Target event:** Newport Folk Festival, July 24–26, 2026  
**Target launch:** Same day the official 2026 schedule is published  
**Deployment:** GitHub → Vercel  
**Primary constraint:** The core planner must remain usable after cellular service degrades at Fort Adams.

## Product statement

Build a fast, mobile-first, offline-capable festival planner that converts the official stage schedule into an interactive personal itinerary. A visitor can:

- browse the full schedule by day, stage, or time;
- tap acts as **Must See**, **Interested**, or **Skip**;
- see conflicts and transition warnings;
- inspect stage conditions and policies;
- open artist information and Spotify links;
- receive recommendations based on selected acts;
- export a personalized PDF and `.ics` calendar file;
- install the site as a PWA and use the saved plan without reception.

The site should not require an account. Selections are stored locally and can be shared through a compact URL.

## Recommended MVP architecture

- **Next.js App Router, TypeScript, Tailwind CSS**
- **Static schedule data committed to the repository**
- **Zod** for data validation
- **Zustand persist middleware** or a small custom persisted store for user selections
- **Serwist** for PWA/service-worker caching
- **OpenRouter** through a server-only Next.js route for chat and recommendation requests
- **Client-side `.ics` generation**
- **Print-optimized HTML first; downloadable PDF second** using a dynamically imported PDF library
- **No database and no authentication for launch**

This keeps the entire planner, schedule, stage information, artist summaries, conflict logic, and exports available offline. Only fresh AI calls and external Spotify pages require connectivity.

## Documents in this packet

1. `01_PRODUCT_REQUIREMENTS.md` — scope, user stories, requirements, acceptance criteria
2. `02_UI_UX_SPEC.md` — mobile and desktop interaction design
3. `03_TECHNICAL_ARCHITECTURE.md` — application architecture, directory structure, offline strategy, APIs
4. `04_DATA_MODEL_AND_INGESTION.md` — schedule/stage/artist schemas and tomorrow’s ingestion workflow
5. `05_AI_RECOMMENDATIONS_AND_CHAT.md` — OpenRouter design, prompts, guardrails, offline fallback
6. `06_BUILD_SESSION_RUNBOOK.md` — time-boxed division of work for Codex and Claude Code
7. `07_QA_DEPLOYMENT_OPERATIONS.md` — testing, deployment, schedule updates, monitoring
8. `08_STAGE_INFORMATION_WORKSHEET.md` — known official policies plus fields that must be verified
9. `09_AGENT_PROMPTS.md` — ready-to-paste prompts for coding agents

Additional starter files:

- `.env.example`
- `schedule.template.csv`
- `artists.template.csv`
- `stages.template.json`

## Immediate build order

1. Scaffold and deploy a blank Next.js application to Vercel.
2. Implement schemas and load placeholder data.
3. Build the mobile schedule grid and selection store.
4. Add conflicts, filters, stage details, artist sheets, Spotify links.
5. Add PWA caching and verify true airplane-mode operation.
6. Add print/ICS exports.
7. Add OpenRouter recommendations and chat behind strict validation and rate limits.
8. Replace placeholder data with the 2026 schedule, verify every entry twice, and deploy.

## Important product decisions

### Offline is a first-class feature

The user must load or install the application before reception disappears. The app should display a clear status such as **“Saved for offline use”** and a one-tap preflight check. Schedule data must be bundled or precached, not fetched only at runtime.

### “Calendar sync” in the MVP means export

The MVP creates a personalized `.ics` file and optional per-act “Add to calendar” links. This does not automatically update a user’s calendar after a schedule change. A true subscription calendar requires a persistent user-specific feed and is deferred.

### Hover cannot be the only interaction

Desktop can show hover cards. Mobile must use tap-to-open sheets/dialogs with the same artist and stage information.

### AI enhances rather than controls the plan

The AI can recommend only acts present in the validated schedule dataset. It may not invent acts, stage times, policies, or schedule changes. The deterministic recommendation engine remains usable offline.

### Independent-site labeling

Unless Newport Festivals Foundation has authorized the project, place a visible footer and About-page statement:

> Unofficial fan-made planning tool. Not affiliated with or endorsed by Newport Festivals Foundation. Schedule information is subject to change; confirm critical details with Newport Folk.

Do not use the official Newport Folk logo or reproduce the official schedule artwork without permission. Use factual artist, stage, date, and time data with attribution and a link to the official schedule.

## Source references

- Official schedule page: https://newportfolk.org/schedule
- Official 2026 event information and policies: https://newportfolk.org/info
- Official accessibility information: https://newportfolk.org/info/accessibility
- Next.js PWA guide: https://nextjs.org/docs/app/guides/progressive-web-apps
- Serwist for Next.js: https://serwist.pages.dev/docs/next
- OpenRouter quickstart: https://openrouter.ai/docs/quickstart
- OpenRouter structured outputs: https://openrouter.ai/docs/guides/features/structured-outputs
- OpenRouter provider routing: https://openrouter.ai/docs/guides/routing/provider-selection
- Spotify Web API policy/reference: https://developer.spotify.com/documentation/web-api

