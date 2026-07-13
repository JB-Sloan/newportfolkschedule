# Data Model and Schedule Ingestion

## 1. Data-source principle

The repository is the source of truth for the application. The official Newport Folk schedule remains the authoritative external source. The app should show the official URL, dataset version, and verification timestamp.

As of July 13, 2026, the official `/schedule` page still displays the 2025 schedule. The 2026 data should be imported immediately after Newport Folk publishes it and then manually verified.

## 2. Files

```text
data/schedule-2026.json
 data/artists-2026.json
 data/stages-2026.json
 data/policies-2026.json
 data/schedule-manifest.json
```

### Manifest

```json
{
  "festival": "Newport Folk Festival",
  "year": 2026,
  "timezone": "America/New_York",
  "officialScheduleUrl": "https://newportfolk.org/schedule",
  "scheduleVersion": "2026.07.14.1",
  "publishedAt": "2026-07-14T12:00:00-04:00",
  "verifiedAt": "2026-07-14T14:30:00-04:00",
  "verifiedBy": ["initials-1", "initials-2"],
  "notes": "Initial official schedule publication"
}
```

## 3. Schedule item schema

```ts
const ScheduleItemSchema = z.object({
  id: z.string().regex(/^2026-07-(24|25|26)-[a-z0-9-]+$/),
  artistId: z.string(),
  stageId: z.string(),
  date: z.enum(['2026-07-24', '2026-07-25', '2026-07-26']),
  start: z.string().datetime({ offset: true }),
  end: z.string().datetime({ offset: true }),
  titleOverride: z.string().optional(),
  subtitle: z.string().optional(),
  kind: z.enum(['artist', 'collaboration', 'workshop', 'special-set']).default('artist'),
  status: z.enum(['scheduled', 'moved', 'cancelled']).default('scheduled'),
  officialSourceUrl: z.string().url(),
  sourceNote: z.string().optional()
});
```

Example:

```json
{
  "id": "2026-07-25-example-artist",
  "artistId": "example-artist",
  "stageId": "harbor",
  "date": "2026-07-25",
  "start": "2026-07-25T13:20:00-04:00",
  "end": "2026-07-25T14:10:00-04:00",
  "kind": "artist",
  "status": "scheduled",
  "officialSourceUrl": "https://newportfolk.org/schedule"
}
```

## 4. Artist schema

```ts
const ArtistSchema = z.object({
  id: z.string(),
  name: z.string(),
  sortName: z.string().optional(),
  shortBio: z.string().max(360),
  genres: z.array(z.string()).max(8),
  tags: z.array(z.string()).max(12),
  moods: z.array(z.string()).max(8).default([]),
  spotifyUrl: z.string().url().optional(),
  officialUrl: z.string().url().optional(),
  lineupUrl: z.string().url().optional(),
  metadataConfidence: z.enum(['verified', 'reviewed', 'draft']),
  metadataSources: z.array(z.string().url()).default([])
});
```

Guidelines:

- write original summaries; do not copy long biographies;
- distinguish a special collaborative set from its individual participants;
- tags should describe sound and performance, not make demographic inferences;
- keep summaries useful to a festivalgoer: instrumentation, energy, tradition/innovation, and comparable styles;
- verify Spotify links to avoid same-name artists;
- if a direct Spotify URL is missing, generate a search URL at runtime.

## 5. Stage schema

```ts
const StageSchema = z.object({
  id: z.string(),
  name: z.string(),
  shortName: z.string(),
  description: z.string(),
  seating: z.object({
    summary: z.string(),
    status: z.enum(['official', 'observed', 'unknown'])
  }),
  shade: z.object({
    summary: z.string(),
    status: z.enum(['official', 'observed', 'unknown'])
  }),
  blankets: z.object({
    summary: z.string(),
    status: z.enum(['official', 'observed', 'unknown'])
  }),
  chairs: z.object({
    summary: z.string(),
    status: z.enum(['official', 'observed', 'unknown'])
  }),
  surface: z.object({
    summary: z.string(),
    status: z.enum(['official', 'observed', 'unknown'])
  }),
  accessibility: z.object({
    summary: z.string(),
    status: z.enum(['official', 'observed', 'unknown'])
  }),
  amenities: z.array(z.string()).default([]),
  transitions: z.record(z.string(), z.number().int().min(0).max(30)),
  sources: z.array(z.object({
    url: z.string().url(),
    label: z.string(),
    verifiedAt: z.string()
  }))
});
```

## 6. Policy schema

Store concise, attributed policy statements rather than copying the entire official FAQ.

```ts
const PolicySchema = z.object({
  id: z.string(),
  category: z.enum(['chairs', 'blankets', 'shade', 'bags', 'water', 'accessibility', 'weather', 'entry']),
  title: z.string(),
  summary: z.string(),
  officialSourceUrl: z.string().url(),
  verifiedAt: z.string(),
  scheduleVersion: z.string()
});
```

Official 2026 facts suitable for the data file include:

- blankets are allowed at 6 by 8 feet or smaller;
- chairs must be under 34 inches;
- chairs under 30 inches are allowed outside no-chair zones;
- 30–34 inch chairs belong farthest from the stage or in designated shade areas;
- personal shade tents are allowed at the back of performance areas when they do not impede others;
- umbrellas must be closed during performances;
- the festival is rain or shine;
- all artists, set times, and stages are subject to change.

Source: https://newportfolk.org/info

## 7. Tomorrow’s ingestion workflow

### Step 1 — Capture authoritative source

- save each official daily schedule image locally;
- record the page URL and publication time;
- do not rely on social reposts if the official page is available;
- preserve the source images privately for verification, but do not automatically republish them on the site.

### Step 2 — Produce a draft CSV

Use an image-capable coding/AI tool to extract:

```text
date,stage_id,start_time,end_time,artist_name,title_override,subtitle
```

The AI/OCR output is a draft only.

### Step 3 — Human verification pass one

One person compares every row to the official graphic and confirms:

- spelling and punctuation;
- day;
- stage;
- start and end time;
- collaboration or special-set wording;
- duplicate appearances.

### Step 4 — Normalize IDs

- map stage labels to canonical IDs;
- create stable artist/project IDs;
- keep special projects separate from artist identities;
- assign stable set IDs that will survive later time/stage changes.

### Step 5 — Automated validation

The build must fail on:

- end time not later than start time;
- date mismatch between row and timestamp;
- unknown artist or stage ID;
- duplicate set ID;
- two sets on the same stage overlapping;
- missing official source URL;
- dates outside July 24–26, 2026;
- invalid timezone offset;
- duplicate artist entries caused by punctuation variants.

Warnings, requiring review:

- set shorter than 20 minutes or longer than 150 minutes;
- gaps shorter than 5 minutes on the same stage;
- artist in lineup but not schedule;
- schedule artist not in lineup;
- missing Spotify URL;
- draft artist metadata.

### Step 6 — Human verification pass two

A second person reviews the rendered application rather than the CSV. Compare each day/stage column with the official graphic. This catches errors introduced by conversion, sorting, and timezone handling.

### Step 7 — Version and deploy

- set `scheduleVersion` to `YYYY.MM.DD.N`;
- run unit tests and production build;
- deploy preview;
- test phone and desktop;
- merge to production;
- verify the production PWA cache contains the new version.

## 8. Artist enrichment workflow

Do not make artist enrichment a blocker for schedule launch.

### Pass A — launch minimum

- name;
- short original description;
- 3–6 tags;
- Spotify search/direct link;
- metadata status `draft` or `reviewed`.

### Pass B — quality review

- verify direct Spotify artist profile;
- add official website;
- refine descriptions;
- identify collaborations and side projects;
- verify genres/tags against reliable sources.

### Pass C — recommendation tuning

- normalize tags into a controlled vocabulary;
- add mood, energy, instrumentation, and tradition/innovation tags;
- review deterministic similarity output.

## 9. Controlled tag vocabulary

Suggested categories:

### Genre/style

folk, indie-folk, americana, roots-rock, country, bluegrass, blues, soul, gospel, jazz, world, traditional, singer-songwriter, indie-rock, experimental, electronic, punk, pop

### Energy

quiet, intimate, reflective, mid-tempo, upbeat, danceable, high-energy, anthemic

### Performance character

storytelling, harmony-led, guitar-led, vocal-led, band, solo, collaborative, improvisational, orchestral, rhythmic

### Discovery

emerging, established, legacy, special-project, rare-collaboration, local-connection

Use tags as descriptive metadata, not definitive critical judgments.

## 10. Schedule diff

`scripts/diff-schedule.ts` compares old and new versions and emits:

```json
{
  "from": "2026.07.14.1",
  "to": "2026.07.16.1",
  "moved": [
    {
      "id": "2026-07-25-example-artist",
      "oldStageId": "harbor",
      "newStageId": "quad",
      "oldStart": "...",
      "newStart": "..."
    }
  ],
  "cancelled": [],
  "added": []
}
```

The client uses this to alert users whose selected acts changed.

