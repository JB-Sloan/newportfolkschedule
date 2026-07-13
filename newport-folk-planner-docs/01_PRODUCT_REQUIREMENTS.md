# Product Requirements Document

## 1. Objective

Create a more usable alternative to the static festival schedule graphic, optimized for personal planning at a venue where cellular reception becomes unreliable. The application should be useful both during pre-festival discovery and while moving between stages.

## 2. Primary users

### Planner

Before the festival, the user studies acts, marks priorities, resolves conflicts, explores unfamiliar artists, and exports a plan.

### On-site attendee

During the festival, the user needs a quick **Now / Next** view, stage directions/context, conflict reminders, and access to the plan without network service.

### Group coordinator

The user shares a schedule URL or QR code with friends so the group can compare plans without creating accounts.

## 3. Success criteria

- The schedule becomes usable in airplane mode after one successful online load.
- A user can create a day plan in under five minutes.
- No selected acts are lost after refresh, PWA installation, or temporary loss of connection.
- The planner clearly identifies overlapping selected sets.
- PDF and calendar exports exactly match the user’s selected acts and current schedule version.
- AI results contain only valid artist IDs from the schedule.
- The primary mobile schedule interaction remains responsive on a mid-range phone.

## 4. MVP feature set

### 4.1 Schedule browsing

Required views:

1. **Timeline:** stages as columns and time vertically, similar to the familiar official grid.
2. **My Plan:** only selected acts, in chronological order.
3. **Now / Next:** current set, next selected set, countdown, and immediate alternatives.
4. **List:** accessible compact list grouped by time or stage.

Controls:

- day selector;
- stage filter;
- show all / selected / unselected;
- search by artist;
- genre or discovery tag filter when metadata is available;
- “hide ended sets” during the festival;
- zoom density: compact / comfortable.

### 4.2 Selection states

Each scheduled set supports:

- **Must See** — highest priority;
- **Interested** — optional or conflict fallback;
- **Not selected**.

A long press or secondary menu may support **Avoid/Hide**, but it is not required for launch.

Selections persist in local storage. No sign-in is required.

### 4.3 Conflict detection

A conflict is shown when selected sets overlap after applying an optional transition buffer.

Rules:

- direct time overlap = red conflict;
- less than the user’s transition buffer between different stages = amber warning;
- same-stage consecutive sets = no movement warning;
- user can choose a default buffer of 0, 5, 10, or 15 minutes;
- conflict dialog shows the exact overlap and allows priority changes.

### 4.4 Artist information

Desktop: hover/focus card.  
Mobile: tap opens bottom sheet.

Show:

- artist name;
- one- or two-sentence description;
- genres and descriptive tags;
- scheduled day, time, and stage;
- Spotify link;
- official artist site when available;
- selection control;
- “Recommend similar acts” action.

Do not depend on remote artist images for the MVP. Text-first cards are faster, lighter, and avoid image licensing complications.

### 4.5 Stage information

Each stage panel should expose:

- seating conditions;
- chair and blanket restrictions;
- general shade/tent coverage;
- ground/surface description;
- accessibility-area information;
- approximate transition times to other stages;
- restrooms, water, and food context if verified;
- source and verification date;
- a distinction between **officially verified**, **locally observed**, and **unverified** information.

Unknown information must be labeled unknown rather than inferred.

### 4.6 Personalized export

#### PDF

Provide two layouts:

- **Pocket plan:** chronological, one day per section, large type, conflict notes.
- **Grid plan:** selected acts shown in stage columns.

PDF includes:

- schedule version and generated timestamp;
- official-source attribution;
- “times subject to change” disclaimer;
- user’s transition buffer;
- optional QR code back to the shared plan URL.

Implementation priority:

1. print-optimized page with `window.print()` and “Save as PDF” guidance;
2. direct PDF Blob generation after the core planner works.

#### Calendar

- export all selected acts as one `.ics` file;
- optional per-act `.ics` export;
- timezone: `America/New_York`;
- location: stage name, Fort Adams State Park, Newport, RI;
- description includes artist summary and official schedule link;
- stable event UID derived from festival year + schedule item ID;
- optional 10-minute alarm;
- warn the user that imported events do not automatically update.

### 4.7 Offline PWA

Required:

- installable manifest;
- service worker;
- cached application shell;
- cached schedule, artist metadata, stage metadata, and policies;
- offline fallback route;
- visible online/offline indicator;
- pre-festival “Make available offline” action;
- last successful schedule version and sync time;
- no blank screens when an external resource fails.

The AI panel and Spotify links should show a graceful **Internet required** state while the planner continues working.

### 4.8 AI recommendations

User selects two or more acts and requests recommendations. The system returns up to five other scheduled acts with:

- act name;
- brief reason;
- fit score;
- conflict status;
- selection action.

Preferences can include:

- “more like these”;
- “something different”;
- upbeat / quiet / roots / experimental / danceable / singer-songwriter;
- prioritize discovery;
- avoid conflicts;
- stay near a stage;
- available time window.

### 4.9 AI schedule assistant

The side panel can answer questions such as:

- “What can I see after Artist A without leaving the Quad?”
- “Build a Saturday plan centered on three selected acts.”
- “Which artists are likely to appeal to me based on my Must See list?”
- “Which selected sets overlap?”
- “What are the chair rules?”

The assistant is grounded only in validated schedule, artist, stage, and policy data. It cannot claim live schedule changes unless those changes exist in the current dataset.

## 5. Additional high-value features

These should be implemented only after the core flow is stable.

### Recommended for launch if time permits

- **Now / Next lock screen-style view** with countdowns.
- **Share plan** using URL-encoded selections and a QR code.
- **Schedule change diff:** highlight changed times/stages when a new dataset version is loaded.
- **Plan B suggestions:** show an interested act near the user’s current stage when a Must See set is missed.
- **Accessibility mode:** larger tap targets, list-first layout, reduced motion, high contrast.
- **Group comparison:** paste a friend’s shared-plan URL and see common/unique selections locally.

### Deferred

- user accounts and cloud synchronization;
- true subscribed calendar feeds;
- push notifications for schedule changes;
- live crowd reports;
- social comments or ratings;
- GPS tracking;
- Spotify account OAuth and automatic playlist creation.

## 6. Non-functional requirements

### Performance

- initial mobile JavaScript kept as small as practical;
- PDF and AI code dynamically loaded;
- schedule interactions should not trigger server requests;
- Lighthouse mobile performance target: 90+ before optional third-party scripts;
- avoid embedded Spotify players in schedule cards.

### Accessibility

- WCAG 2.2 AA target;
- full keyboard support;
- focus behavior equivalent to hover;
- minimum 44×44 CSS-pixel touch targets;
- no information conveyed by color alone;
- schedule also available as a semantic list/table;
- respect `prefers-reduced-motion`.

### Privacy

- no account and no personal profile required;
- selections stored on device;
- AI request contains only selection IDs, user query, and relevant public festival context;
- no API keys exposed to the browser;
- analytics optional and disclosed;
- do not send local plan data to AI until the user explicitly opens or uses the AI feature.

### Reliability

- invalid schedule data fails the build;
- a schedule version is displayed throughout the app;
- user selections survive schedule updates when item IDs remain stable;
- orphaned selections are reported after data changes.

## 7. Acceptance test scenarios

1. Select five acts, close the browser, return, and verify all five remain selected.
2. Select overlapping acts and verify a conflict is visible in Timeline, My Plan, PDF, and AI context.
3. Install/open the PWA, enable airplane mode, reload, switch days, open stage details, and export an ICS file.
4. Tap an artist on mobile and confirm the same information available through hover/focus on desktop.
5. Request recommendations and verify every returned ID exists in the current schedule and is not already selected unless explicitly identified as selected.
6. Load a new schedule version with one moved act and verify the user sees a change notice.
7. Try AI while offline and verify the deterministic recommendations still work.
8. Print a pocket plan and verify no controls, hover text, or clipped schedule blocks appear.

