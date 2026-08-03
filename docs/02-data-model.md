# Data Model

## The central modeling decision

**A person and a band are both artists.** One table, `artists`, discriminated by `artist_type` (`person` / `group` / `collective`). Membership is a relationship between them, with date ranges.

This is what makes your Wilco example work:

> The guitarist from Wilco played with the R.E.M. cover band this year.

```
artists: Nels Cline          (person)
artists: Wilco               (group)
artists: [R.E.M. tribute]    → actually a `set` with set_kind='tribute', no billed_artist

artist_memberships: Nels Cline → Wilco, role 'guitar', 2004–present

performances:
  set=[Wilco 2025 Fort Stage]     artist=Wilco         role='billed'
  set=[Wilco 2025 Fort Stage]     artist=Nels Cline    role='band_member'
  set=[R.E.M. tribute 2025]       artist=Nels Cline    role='sit_in'   instruments={guitar}
```

Nels Cline now has an artist page listing every set he has ever appeared on, in any capacity, across any band. That query is the single most valuable thing in this database and no other Newport resource has it.

## Entity hierarchy

```
editions (a festival year)
   └── events (a day of the main fest, OR an aftershow, OR a preshow)
          └── sets (a performance slot on a stage)
                 ├── performances (who played, in what role)
                 └── setlist_entries (what they played, in order)
                        └── setlist_entry_performers (which guest on which song)
```

### Why `events` sits between editions and sets

Because **aftershows are their own value**, as you asked. An aftershow at the Newport Blues Cafe is not a main-fest day: different venue, different capacity, often unofficial, frequently where the best sit-ins happen. Modeling it as an `event` with `kind='aftershow'` means:

- Aftershow sets get full setlist and sit-in treatment
- They can be filtered in or out of stats ("sets seen" should probably count them; "official lineup" should not)
- The prediction model can use aftershow history as a distinct signal — playing a late night at the Blues Cafe is a different indicator than playing the Quad

`event_kind` values: `main_stage_day`, `aftershow`, `late_night`, `preshow`, `satellite`, `workshop`.

## Performance roles

`performance_role` enum:

| Role | Meaning |
|---|---|
| `billed` | The act as printed on the schedule |
| `band_member` | A member of the billed act, playing their normal role |
| `sit_in` | A guest who joined someone else's set |
| `guest_vocal` | Sit-in, vocals specifically (worth separating — it's the most common kind) |
| `host` | Curator/MC of a collaborative set |
| `curator` | Assembled a tribute or superjam |
| `surprise_guest` | Unannounced, distinct from a planned collaboration |

`sit_in` records carry verification state — see below.

## Verification: how a sit-in becomes fact

Sit-ins are the most attractive thing in this dataset to misremember or embellish. Unverified sit-in data is worse than none, because the whole value proposition is that the archive is trustworthy.

Three mechanisms, layered:

**1. Community confirm/dispute.** `performance_votes` (+1 / −1). A trigger maintains `confirm_count` and `dispute_count` and promotes `status`:

- `pending` — submitted, unreviewed
- `confirmed` — ≥3 net confirmations, or 1 confirmation from a `trusted` user, or a citation from a `high` confidence source
- `disputed` — net negative, surfaced to moderators, displayed with a warning
- `rejected` — moderator decision

**2. Citations.** Every claim can carry evidence via `sources` + `citations`. A YouTube clip showing the sit-in is `high` confidence and auto-confirms. An Inforoo post saying "pretty sure that was Nels" is `low` and doesn't.

**3. Revision history.** Setlists and performances are wiki-style. `revisions` records every change as a JSONB diff with an author and a comment. Anything can be reverted. This is what lets you open editing to the community without opening it to vandalism.

## Sources and citations

Generic, polymorphic, and the backbone of the Inforoo mining work:

```
sources    — a document: a forum thread, a YouTube video, a press article
citations  — links a source to any entity, with a short excerpt and a confidence level
```

`citations.entity_table` + `entity_id` means any row in the database can be evidenced. Design intent: **every non-obvious fact in the archive should be traceable to a source.** That's what separates this from a wiki that slowly fills with confident nonsense.

See `docs/06-data-sourcing.md` for the rules on what may be stored from mined sources.

## Setlists

`setlist_entries` are positioned rows against a set. They store both `song_id` (canonical, once matched) and `raw_title` (as the submitter typed it), because matching is fuzzy and you want to preserve the original.

Flags that matter for this festival specifically:
- `is_cover` + `cover_of_artist_id` — Newport is drowning in covers and the cover graph is genuinely interesting
- `is_tease` — partial quotes inside another song
- `is_traditional` on `songs` — folk canon has no single canonical author

`setlist_entry_performers` joins a guest's `performance` row to specific songs, so a set page can render "Song 5 — with Nels Cline (guitar)."

## Attendance, and the playlist payoff

```
set_attendance (user_id, set_id)
```

You asked to let people go back through past years and check off what they saw. That table is the whole feature. It gives you:

- "You've attended 11 Newports and seen 284 sets"
- Badges (`docs/04-epics.md`, E9)
- **The playlist**: `set_attendance` ⋈ `setlist_entries` ⋈ `songs` → every song you have ever heard at the Fort, deduplicated or not, exportable to Spotify. This is the best share artifact in the product and it falls out of the schema for free.

Badge criteria live in `badges.criteria` as JSONB and are evaluated by a nightly job, so adding a badge is a data change, not a deploy.

## Schedule builder

```
user_schedules       (user, edition, name, share_slug, is_public)
user_schedule_items  (schedule, set, priority: must/want/if_free)
stage_transits       (from_stage, to_stage, walk_minutes)
```

`stage_transits` is the "better than Clashfinder" bit — see `docs/04-epics.md`, E11. It's a tiny table (Fort Adams has ~5 stages) that you populate by hand once and never touch again.

## Bingo

```
bingo_cards            (user, edition, locked_at, is_public, score)
bingo_squares          (card, position 0–24, artist, is_hit, resolved_at)
announcement_waves     (edition, wave_number, announced_at)
lineup_announcements   (edition, wave, artist, billed_name)
```

Users build their own cards by picking artists (your requirement). Constraints enforced in the app layer:

- 24 picks + a center free space
- No duplicate artists on one card
- `locked_at` is set on submit and **must precede the first announcement wave**; after that the card is immutable. Without a hard lock the game is meaningless.
- Cards are public after lock, which creates the leaderboard *and* the crowd-signal dataset

Scoring resolves incrementally per wave, which converts one big announcement moment into five or six engagement spikes.

## Prediction snapshots

```
artist_feature_snapshots (artist, edition, as_of, feature_key, raw_value, normalized)
predictions              (artist, edition, as_of, score, rank, probability, model_version)
```

**The `as_of` column is not optional.** Tour adjacency in January is a different value than in June. Without point-in-time snapshots every backtest you ever run will quietly cheat by using information that didn't exist yet, and you will believe the model is far better than it is. Snapshot weekly from day one — storage is trivial and you cannot reconstruct this retroactively.

## Full table list

**Identity** — `profiles`, `user_follows`
**Music graph** — `artists`, `artist_aliases`, `artist_memberships`, `instruments`, `organizations`, `artist_org_links`, `releases`, `release_credits`
**Festival** — `venues`, `editions`, `events`, `stages`, `stage_transits`, `sets`, `performances`, `performance_votes`
**Setlists** — `songs`, `song_aliases`, `setlist_entries`, `setlist_entry_performers`
**Evidence** — `sources`, `citations`, `revisions`
**Community** — `set_reviews`, `media_embeds`, `forum_categories`, `topics`, `posts`, `votes`
**Attendance** — `set_attendance`, `event_attendance`, `badges`, `user_badges`
**Wire** — `news_items`
**Oracle** — `prediction_features`, `artist_feature_snapshots`, `predictions`, `prediction_outcomes`
**Bingo** — `bingo_cards`, `bingo_squares`, `announcement_waves`, `lineup_announcements`
**Schedule** — `user_schedules`, `user_schedule_items`
**Merch** — `merch_items`, `merch_listings`
**Moderation** — `reports`, `moderation_actions`
**Community demand** — `artist_requests` (view `v_artist_demand`)

## `artist_requests` (0013)

Forum-sourced fan demand — "I wish they'd book X" — captured as one row per
explicit request in an Inforoo annual thread, with a `sources` row for the
post (permalink + author handle + short excerpt). Distinct from the Wishlist
(E8) and bingo; it is a third crowd signal that feeds Oracle `F20_crowd_pick_rate`.

- `festival_year` is the edition discussed; `request_post_year` is when it was
  posted (annual threads open the prior summer).
- `request_type`: `wish` | `request` | `dream` | `prediction`. Only `wish`/`request`
  count as demand in `v_artist_demand`.
- `artist_id` resolves to `artists` when the act exists in our graph; requests
  for acts that have never played Newport keep `requested_name` with a null
  `artist_id` until an artist record is created.

### Research → schema mapping (`Inforoo Research/`)

| Research file | Target | Status |
|---|---|---|
| `requested-acts.csv` | `artist_requests` + `sources` | **Imported** (282 verified) |
| `sit-ins.csv` | `performances` (role `sit_in`/`guest_vocal`/…) + `sources`/`citations`; aftershows need `events`/`sets` first | Mapped; import pending |
| `songs-played.csv` | `songs` + `setlist_entries` + `setlist_entry_performers` | Mapped; import pending |

Only `review_status=verified` (and `confidence` high/medium) rows are imported;
the raw queues in the research folder stay out of production.
