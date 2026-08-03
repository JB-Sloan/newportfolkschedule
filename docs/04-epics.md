# Epics

Task-level tracking lives in `tracking/BACKLOG.md`. This file defines scope and intent.

---

## E0 — Foundation
**Phase 0 · Blocks everything**

Supabase project config, Supabase Auth with magic link + Google/Apple OAuth, **custom SMTP via Resend** (see architecture note — the built-in sender will not work in production), `profiles` table with handle reservation, role system (`member` / `trusted` / `moderator` / `admin`), RLS baseline, `reports` + `moderation_actions` tables, rate limiting, `revisions` trigger infrastructure, GitHub Actions keepalive cron, Sentry.

The moderation queue ships in Phase 0, not later. Retrofitting moderation after your first bad weekend is miserable and you will do it badly under pressure.

**Done when:** a user can sign up, get a handle, and be banned.

---

## E1 — The Music Graph
**Phase 0 · The spine**

`artists` (person/group/collective), `artist_aliases`, `artist_memberships` with date ranges, `instruments`, `organizations` (labels, management, booking agencies), `artist_org_links`, `releases`, `release_credits` (producer/engineer/featured).

MusicBrainz ID on every artist from the start. It is the join key for every external data source you will ever add, and backfilling it later across thousands of artists is a nightmare.

**Done when:** Nels Cline, Wilco, and the membership between them exist, with MBIDs, and an artist page can render both.

---

## E2 — Set Pages & Core UGC
**Phase 0 · The product**

`venues`, `editions`, `events` (main day / aftershow / late night / preshow), `stages`, `sets`, `performances`, `performance_votes`, `songs`, `setlist_entries`, `setlist_entry_performers`, `set_reviews`, `sources`, `citations`.

Every set page exists on day one, pre-populated from the schedule with time, stage, and billed artist. No blank-page problem.

Features: wiki-style setlist editing with revision history and revert; sit-in submission with instrument tagging; confirm/dispute with "confirmed by N" display; per-song guest attribution; cover tagging with `cover_of_artist`; reviews and ratings; citation attachment.

**Done when:** a user can add a setlist, tag a sit-in on song 7, another user can confirm it, and a third can revert a bad edit.

---

## E3 — Media Embeds
**Phase 0**

Paste a URL, get an embed. Providers: YouTube, Vimeo, Instagram, TikTok, Bandcamp, SoundCloud, Archive.org, nugs, Flickr. oEmbed lookup for title and thumbnail, cached. Attach to a set, or to a specific `setlist_entry`, or to a `performance` (so a sit-in can carry its own video proof).

Embeds double as citation evidence — a video showing a sit-in auto-promotes it to `confirmed`.

**No uploads. No hosting.** See architecture doc for why this is a legal decision as much as a cost one.

---

## E4 — Message Board
**Phase 1**

Threaded topics, markdown, quoting, subscriptions, per-user mute, moderation integration.

Seeded categories, chosen for this specific audience:

| Category | Why |
|---|---|
| General / Fort Talk | The default |
| Set Discussion | Auto-created threads linked to `sets` |
| **Face-Value Ticket Exchange** | Huge demand, big trust win, **and your highest fraud surface** — strict rules, no off-platform payment advice, verified-user gating |
| Lodging & Travel | Newport in July is brutal for accommodation |
| Ferry, Shuttle & Parking | The perennial logistics thread |
| Newcomer FAQ | Wiki-style: chairs, water, sunscreen, the walk in |
| Meetups | Pre-fest gatherings |
| **The Wall of Weird** | Traditions, tattoos, rituals. The tagline made load-bearing |
| Aftershows & Late Night | Distinct culture, distinct data |
| Off-Season Listening | What carries you through February |

---

## E5 — The Wire
**Phase 1 · Daily reason to return**

Automated ingestion against a watchlist = every artist with a `performance` row.

Sources: MusicBrainz (release groups), Spotify Web API (new releases), Bandsintown or Ticketmaster Discovery (tour announcements), setlist.fm (performances elsewhere — including sit-ins at other festivals, which is a real signal), RSS from No Depression, NPR Music, Aquarium Drunkard, Pitchfork, Paste.

Editorial layer on top: a human can feature, suppress, or annotate. Otherwise it's a firehose and nobody reads it.

**The second job of this epic:** the same ingest that produces a news item produces a *prediction feature*. Tour announcements → adjacency. Release detection → album-cycle flag. Build the writers for both from day one.

`user_follows` + digest email closes the retention loop.

---

## E6 — The Oracle
**Phase 2 · The strategic center**

See `docs/05-prediction-model.md` for the full design.

Scope: candidate universe construction, weekly feature snapshots, transparent weighted scoring, public odds board with visible weights, per-artist explanation ("why is this artist ranked 34th?"), calibration tracking, post-lineup post-mortem.

**Explicitly not ML in year one.** Interpretability is the product — fans want to argue with the weights, and an unexplainable ranking generates no discussion. Log everything; in two or three cycles you'll have real supervised data.

---

## E7 — Bingo
**Phase 2**

User-built cards: pick 24 artists from the candidate pool plus a free center square. Autocomplete search over `artists`. Hard lock before the first announcement wave — without it the game is meaningless. Public gallery after lock. Incremental scoring per wave. Leaderboards: overall, "boldest correct pick" (lowest crowd pick-rate that hit), "most contrarian card."

**Free entry, no prizes of material value.** Badges and bragging rights only. The moment there's an entry fee or a real prize you're in sweepstakes/gambling regulation with state registration thresholds and official-rules requirements. Not worth it, and the bragging rights motivate this audience more anyway.

**Sit-in bingo** during festival weekend — predict who joins whose set — is the most Newport-specific feature in the whole plan. Phase 4.

---

## E8 — The Wishlist
**Phase 2**

Reframed from "feedback forum." This is a fan site; you cannot change the shuttle schedule, and a voting forum implying influence it doesn't have will curdle when the top-voted item goes unanswered for a year.

Categories: dream sit-ins, artists we want back, dream tribute sets, first-timers we're rooting for. Voting, discussion, and a yearly "did it happen?" resolution pass.

Dream-lineup votes become a crowd feature for The Oracle.

---

## E9 — Profiles, Attendance & Badges
**Phase 1**

Public profiles with years attended and sets seen. **Retroactive check-off**: browse any past edition and mark what you saw — this is the feature that makes a 15-year veteran care about the site.

Payoff: the **attendance playlist**. Every song you have ever heard at the Fort, generated from `set_attendance ⋈ setlist_entries ⋈ songs`, exportable to Spotify. Best share artifact in the product, essentially free from the schema.

Badge ideas: year counts, "saw the surprise set," "aftershow regular," archival contribution tiers, "saw X sit in with Y," completionist badges per edition. Criteria stored as JSONB, evaluated nightly — adding a badge is a data change, not a deploy.

---

## E10 — Announcement Tracker
**Phase 3**

`announcement_waves` + `lineup_announcements`. Monitor official channels, record each wave with a timestamp and source. Triggers bingo scoring, Oracle resolution, and notifications. Countdown UI between waves.

---

## E11 — Schedule Builder
**Phase 3 · "Better than Clashfinder"**

Baseline Clashfinder parity: grid view, all stages, personal selection, conflict highlighting, mobile-friendly, shareable image export.

Where it beats Clashfinder:

1. **Walking time.** `stage_transits` knows Fort Adams. A "conflict" isn't just overlapping times — leaving the Quad at 4:58 for a 5:00 Fort Stage set is a conflict even without overlap.
2. **Three-tier priority** (must / want / if-free) instead of binary, so conflict resolution has real information to work with.
3. **Auto-suggest** from `set_attendance` history and followed artists — "you've seen this artist 4 times, they conflict with someone you've never seen."
4. **Crew mode.** Share a schedule; see where friends' schedules diverge and where you'll all be together. Newport is a group activity.
5. **Sit-in awareness.** Once the archive is deep, flag "this artist has sat in with 3 other acts this weekend historically."
6. **Set-length reality.** Historical actual start/end times from the archive, not just the printed grid.

---

## E12 — Historical Backfill
**Phase 1, ongoing**

Community archival project. Import prior editions from official archives, setlist.fm, press, and the Inforoo boards. See `docs/06-data-sourcing.md` for the rules.

Make it a game: contribution leaderboard, per-edition completeness meters, "adopt an edition." This is exactly the work the obsessive core will do for free if you give them a progress bar.

---

## E13 — Merch Archive & Classifieds
**Phase 4**

`merch_items` — a canonical, year-by-year archive of posters, tees, and prints, with designer credits and print-run notes. Valuable on its own as content, and it makes listings precise ("2019 poster, second printing" not "old poster").

`merch_listings` — **classifieds only.** Links out to eBay/Discogs/Poshmark or to a DM. No payments, no escrow, no fees. This keeps you inside the Vercel Hobby non-commercial ToS and out of chargeback and 1099-K territory.

First-party merch is deliberately deferred until there's a legal entity, a budget, and a hosting plan — and note that selling merch with the festival's name on it has trademark implications worth a real conversation first.

---

## E14 — Logistics & Meetups
**Phase 4**

Carpool matching, lodging boards, ferry and shuttle info, the newcomer guide as living wiki, meetup organizing with RSVP.

---

## E15 — Live Mode
**Phase 4**

Realtime set threads via Supabase Realtime, live sit-in reporting (target: under 30 seconds from stage to site), live bingo resolution, "who's at what stage right now," lost-and-found board.

Feature freeze 6 weeks out. Load test. Staff moderation for the weekend.
