# UI and Interaction Specification

## 1. Design principles

- **Glanceable on a sunny field:** large type, strong contrast, minimal chrome.
- **One-handed mobile use:** core actions stay within thumb reach.
- **Offline confidence:** clearly show whether the schedule is saved locally.
- **Progressive disclosure:** schedule first; artist details, stage details, and AI are secondary layers.
- **Familiar but not copied:** preserve the useful mental model of stage columns and vertical time without reproducing Newport Folk’s protected artwork or branding.

## 2. Information architecture

Primary navigation on mobile:

1. **Schedule**
2. **My Plan**
3. **Now**
4. **Explore**

Persistent utility actions:

- day switcher;
- search;
- filters;
- share/export;
- AI assistant button;
- offline status.

On desktop, the AI assistant and plan summary can occupy a collapsible right rail. On mobile they open as full-height or bottom sheets.

## 3. Schedule screen

### Mobile default

Use one stage at a time or a horizontally scrollable stage grid. Do not force three or four tiny columns into the viewport.

Header:

- festival/date label;
- day tabs: Fri / Sat / Sun;
- offline badge;
- filter button.

View controls:

- **Grid** / **List**;
- stage chips;
- **All** / **My picks**;
- **Hide ended** during event hours.

Schedule card:

- start–end time;
- artist name;
- stage indicator;
- duration;
- selection button;
- conflict icon;
- optional “recommended” badge.

Selection interaction:

- first tap on star = Interested;
- second tap = Must See;
- third tap = clear;
- alternatively use a small explicit menu if usability testing shows ambiguity.

### Desktop grid

- sticky day/stage headers;
- vertical time ruler;
- stage columns;
- selected acts visually emphasized;
- current-time line on festival days;
- hover card for artist details;
- click opens persistent details panel.

### Set-card states

- default;
- Interested;
- Must See;
- recommended;
- direct conflict;
- transition warning;
- ended;
- cancelled/moved if represented in the dataset.

Never rely on fill color alone. Add icons, labels, border patterns, or badges.

## 4. Artist detail sheet

Content order:

1. artist name and selection controls;
2. set day/time/stage;
3. concise description;
4. genre and mood tags;
5. conflict note;
6. **Open in Spotify**;
7. **Find similar acts here**;
8. official artist link;
9. data/source note.

On mobile, use a bottom sheet that can expand to full screen. On desktop, use a popover for hover/focus and a right-side details panel on click.

Spotify should open externally. Do not autoplay or embed audio in the default schedule view.

## 5. Stage detail sheet

Display compact fact rows:

- Seating
- Shade / cover
- Blankets
- Chairs
- Surface
- Accessibility area
- Transition times
- Nearby amenities
- Verification source

Use status markers:

- **Official**
- **Observed / community knowledge**
- **Unverified**

A user should be able to open stage details from the stage header and from an artist’s set card.

## 6. My Plan screen

Chronological itinerary grouped by day.

Each row shows:

- time;
- artist;
- stage;
- priority;
- conflict/transition status;
- quick link to artist details.

Summary strip:

- selected count;
- Must See count;
- conflicts;
- longest open break;
- export/share actions.

Conflict resolution mode:

- pairs or clusters of overlapping acts shown together;
- user can change priority or deselect without leaving the dialog;
- AI may suggest alternatives but must clearly label them as suggestions.

## 7. Now / Next screen

Designed for on-site use and minimal interaction.

Show:

- current local time;
- currently playing selected act or “No selected act now”;
- next selected act with countdown;
- stage and transition warning;
- next two alternatives nearby or non-conflicting;
- “I’m at [stage]” local preference, manually selected rather than GPS-dependent;
- one-tap full schedule.

The screen should update from the device clock and function fully offline.

## 8. Explore screen

Sections:

- recommended based on picks;
- unfamiliar acts with strong metadata confidence;
- “fill my gap” by time window;
- by mood/genre;
- by stage/day.

Offline recommendations use deterministic tag similarity. Online AI recommendations are labeled **AI-assisted**.

## 9. AI assistant

Desktop: collapsible right rail.  
Mobile: floating button opens a full-screen sheet.

Suggested prompt chips:

- Build my Friday plan
- Resolve my conflicts
- Find three discoveries
- Keep me near the Fort Stage
- What should I see during this gap?
- Explain the chair and blanket rules

Every recommendation result should be a structured card with a selection action rather than only prose.

Offline state:

> AI chat needs a connection. Your schedule and offline recommendations are still available.

Cache the last successful recommendation response for reference.

## 10. Offline/install experience

Pre-festival banner:

> Reception can be limited at Fort Adams. Save this planner for offline use before you arrive.

Actions:

- **Install app** when supported;
- **Save for offline**;
- **Test offline** instructions;
- display cached schedule version.

Status states:

- Online — current version loaded
- Online — update available
- Offline — saved version available
- Offline — first load incomplete

Do not claim the app is available offline until required assets and data are confirmed cached.

## 11. Share flow

A plan URL encodes:

- schedule version;
- selected IDs and priority values;
- transition buffer;
- optional preferred stage.

Share sheet options:

- native share API;
- copy link;
- show QR code;
- download PDF;
- download calendar.

On opening a shared plan, present:

- **Replace my plan**
- **Merge with my plan**
- **Preview only**

## 12. Print layouts

### Pocket layout

- black text on white;
- no backgrounds required for meaning;
- day header;
- chronological list;
- stage name in full;
- conflicts and transition warnings;
- QR code and schedule version footer.

### Grid layout

- stage columns sized for letter paper landscape;
- only selected sets plus optional Interested sets;
- readable at 100% print scale;
- no clipped cards across pages where possible.

## 13. Empty and failure states

- No selections: explain priority states and offer “recommend from lineup.”
- No results: clear filters action.
- Schedule unavailable: retain last cached version.
- AI error: deterministic recommendation fallback.
- Spotify URL missing: open a Spotify search URL generated from the artist name.
- Data mismatch after update: show removed/moved selections and recovery options.

