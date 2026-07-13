# QA, Deployment, and Operations

## 1. Test pyramid

### Unit tests

Highest priority:

- schema validation;
- sorting;
- interval overlap;
- transition warnings;
- conflict clustering;
- plan-state migration;
- share payload encode/decode;
- ICS escaping and timezone output;
- deterministic recommendation scoring;
- AI response post-filtering.

### Component tests

- selection priority cycling;
- filters;
- artist sheet;
- stage sheet;
- conflict dialog;
- offline banner states;
- AI error/fallback state.

### End-to-end tests

- create and restore plan;
- shared-plan merge/replace;
- print route;
- calendar download;
- mobile navigation;
- service-worker offline reload;
- schedule-version update;
- AI recommendation happy path and 429 fallback.

## 2. Data QA checklist

For each day:

- every official stage present;
- first and last act match official graphic;
- every set’s start/end time checked;
- artist spelling and punctuation checked;
- collaborations represented correctly;
- no same-stage overlap;
- all official disclaimer text represented where appropriate;
- stage IDs map to correct labels/colors;
- Spotify links open the intended artist/project.

Require two independent checks: raw data and rendered UI.

## 3. Mobile device matrix

Minimum:

- recent iPhone Safari;
- older supported iPhone Safari;
- Pixel/Android Chrome;
- desktop Chrome;
- desktop Safari or Firefox.

Test:

- portrait and landscape;
- larger text/accessibility font settings;
- reduced motion;
- low-power mode where practical;
- add to home screen;
- browser tab and installed PWA.

## 4. Offline test protocol

A valid offline test is:

1. open production preview online;
2. navigate through every core route;
3. trigger **Save for offline** and wait for confirmation;
4. close all tabs/PWA windows;
5. enable airplane mode and disable Wi-Fi;
6. reopen the installed PWA or URL;
7. refresh;
8. switch days/stages;
9. open artist and stage details;
10. edit selections;
11. open My Plan and Now / Next;
12. generate print view and ICS file;
13. confirm AI shows offline fallback rather than spinning.

Repeat after a new deployment to ensure cache updates correctly.

## 5. PWA audit

Check:

- manifest name, short name, start URL, display mode, theme color, icons;
- HTTPS;
- service-worker scope;
- installability;
- offline fallback;
- cache versioning;
- no mixed content;
- no cross-origin font dependency;
- readable icon and splash behavior;
- update notification.

## 6. Accessibility audit

- keyboard can reach and operate every control;
- focus is visible;
- hover cards also open on focus/click;
- dialogs trap focus and restore it on close;
- headings and landmarks are logical;
- list view is usable with a screen reader;
- stage colors have text labels;
- conflicts include textual explanation;
- touch targets are at least 44×44;
- page works at 200% zoom;
- print output remains legible without color.

## 7. Export QA

### ICS

Verify:

- correct dates and Eastern timezone;
- no one-hour offset;
- special characters and commas escaped;
- multiline description folded correctly if implemented;
- stable UID;
- optional alarm works;
- one file includes all selected events;
- Apple/Google import does not merge unrelated acts.

### PDF/print

Verify:

- selected acts only, according to chosen export settings;
- Must See/Interested distinction visible without color;
- no clipped artist names;
- stage and time included;
- schedule version and generation time included;
- disclaimer and official URL included;
- QR code resolves to correct shared state if enabled.

## 8. AI QA

Automated postconditions:

- returned set ID exists;
- returned artist ID matches set;
- no more than five recommendations;
- conflict state recalculated by code;
- response length bounded;
- invalid response triggers fallback.

Manual review:

- recommendations plausibly relate to chosen acts;
- “something different” is meaningfully different;
- no fabricated biographies;
- no claim of official endorsement;
- no live-status claim from stale data;
- policy answers match stored official summaries.

## 9. Vercel configuration

Production environment variables:

```text
OPENROUTER_API_KEY
OPENROUTER_MODEL
NEXT_PUBLIC_SITE_URL
UPSTASH_REDIS_REST_URL        # if rate limiting is enabled
UPSTASH_REDIS_REST_TOKEN      # if rate limiting is enabled
```

Configuration:

- connect GitHub production branch;
- enable preview deployments;
- apply deployment protection to non-public previews when appropriate;
- set framework preset to Next.js;
- confirm Node runtime supported by current Next.js release;
- enable Web Analytics only after privacy decision;
- configure custom domain and redirects;
- set security headers in `next.config.ts` or `vercel.json`;
- configure a low function timeout for AI requests and a graceful timeout response.

## 10. Release checklist

- [ ] Official schedule URL and version correct
- [ ] Two-pass schedule verification complete
- [ ] `pnpm lint` passes
- [ ] `pnpm test` passes
- [ ] `pnpm build` passes
- [ ] Playwright smoke suite passes
- [ ] Mobile UI checked on physical device
- [ ] Airplane-mode test passes
- [ ] ICS import checked
- [ ] Print/PDF checked
- [ ] AI key absent from client bundle
- [ ] AI budget and rate limits set
- [ ] Unofficial-site disclaimer visible
- [ ] No official logo or copied schedule graphic used without authorization
- [ ] Official schedule link and “subject to change” notice visible
- [ ] Production service worker reports correct schedule version

## 11. Schedule update operations

When Newport changes a time, stage, or act:

1. update canonical data without changing stable set ID when the same act remains;
2. increment schedule version;
3. generate diff;
4. run tests/build;
5. deploy preview;
6. check affected user flows and exports;
7. release;
8. app shows update banner and affected-selection summary;
9. post a visible “last updated” timestamp.

Do not silently change a user’s local priorities.

## 12. Incident handling

### Bad schedule data

- immediately revert to previous Vercel deployment;
- correct data in a new PR;
- increment version again;
- display correction note if users may have exported wrong events.

### AI cost spike

- disable AI route with environment feature flag;
- preserve deterministic recommendations;
- lower request/token limits;
- rotate API key if abuse is suspected.

### Service-worker cache issue

- publish a new worker with a new cache namespace;
- provide an in-app “Refresh offline data” action;
- avoid instructing ordinary users to clear all browser storage unless necessary.

### Spotify link error

- correct metadata without affecting schedule IDs;
- fallback to Spotify search link.

## 13. Post-launch enhancements

After launch telemetry and real-world use:

- refine stage transition times;
- improve deterministic recommendation weights;
- add calendar subscription only if users request ongoing updates;
- consider push notifications for verified schedule changes;
- create a reusable multi-festival data model;
- add a small admin/import interface before the following year.

