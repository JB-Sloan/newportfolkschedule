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

- **`sit-ins.csv` → `performances` + `sources`/`citations`** (migration `0015`).
  264 verified sit-ins → 183 guest performances (21 dropped for unresolved host
  sets — pre-shows/revues with no billed set). Created 18 aftershow/preshow
  events+sets. 172 confirmed sit-in-graph edges; top hosts Deer Tick, Marcus
  Mumford, Watkins Family Hour. High-confidence citations promote guests to
  `confirmed`. Rows with no named host (58) stay gated for review.

- **`songs-played.csv` → `songs` + `setlist_entries`** (migration `0016`).
  121 verified songs → 83 songs + 91 setlist entries across 29 sets. Positions
  are synthesized (the CSV rarely has them); `raw_title` preserved.

## Still open

- `setlist_entry_performers` (which guest played which song) — not yet linked.
- Sit-ins/songs on sets with no billed home (collaboration revues, pre-shows)
  remain gated; create the set first, then re-run (imports are idempotent).

## Rules

- `review_status` must be `verified` (or explicitly promoted) before import.
- Every imported claim keeps its `sources` row (permalink + author handle +
  ≤400-char excerpt) and, for sit-ins/songs, a `citations` row with confidence.
- Re-running an import must be idempotent (source `url` unique; performances
  unique on `(set_id, artist_id, role)`).
