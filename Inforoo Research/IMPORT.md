# Production import status

Tracks what has been loaded from this research folder into the Supabase
production database (`uczitvfcazcujzbhjetj`). Only reviewed, verified rows are
imported; raw queues and candidate files never go to production.

## Imported

- **`requested-acts.csv` → `artist_requests` + `sources`** (migration `0014`).
  All 282 verified requests, 31 forum-post sources (kind `inforoo`), request
  types preserved (`wish`/`request`/`dream`). 101 resolved to existing `artists`;
  the rest keep `requested_name` with a null `artist_id` (act has never played
  Newport). Surfaced via `v_artist_demand`.

## Mapped, import pending

- **`sit-ins.csv` → `performances` (+ `sources`/`citations`).**
  Filter to `review_status=verified` and `confidence in (high, medium)`.
  - `festival_set` / `festival_collaboration` / `festival_kickoff`: host set
    already exists (resolve by year + host slug); add a `performances` row for
    the guest with the mapped role, plus a source + citation.
  - `aftershow` (~140 rows): create an `events` row (`kind='aftershow'`) and a
    `sets` row per distinct (year, event_name) first, then the guest performance.
  - Role map: `sit_in`→`sit_in`, `guest_vocal`→`guest_vocal`,
    `guest_instrumental`→`sit_in`, `backing_band`/`featured_member`→`band_member`,
    `surprise_guest`/`surprise_set`/`audience_guest`→`surprise_guest`.
  - Resolve/create guest + host artists by slug (create with `guest_artist_type`).

- **`songs-played.csv` → `songs` + `setlist_entries` + `setlist_entry_performers`.**
  Import after the parent sit-in/set is resolved; preserve `raw_song_title`.

## Rules

- `review_status` must be `verified` (or explicitly promoted) before import.
- Every imported claim keeps its `sources` row (permalink + author handle +
  ≤400-char excerpt) and, for sit-ins/songs, a `citations` row with confidence.
- Re-running an import must be idempotent (source `url` unique; performances
  unique on `(set_id, artist_id, role)`).
