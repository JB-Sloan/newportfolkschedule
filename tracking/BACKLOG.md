# Backlog

**Single source of truth for status.** Edit the `Status` column here; then run
`python3 scripts/status.py` to regenerate `tracking/STATUS.md`.

Valid statuses: `todo` · `wip` · `blocked` · `done` · `cut`

---

## E0 — Foundation · Phase 0

| ID | Task | Status | Notes |
|---|---|---|---|
| E0-01 | Migration: extensions, enums, `set_updated_at` | done | `0001_foundation.sql` |
| E0-02 | Migration: `profiles`, auto-create trigger, role helpers | done | `0001_foundation.sql` |
| E0-03 | Decide auth provider | done | Supabase Auth. Auth0 dropped — see docs/01 |
| E0-04 | Configure custom SMTP (Resend) for magic links | done | Resend SMTP configured in Supabase Auth (2026-08-04) |
| E0-05 | Enable Google + Apple OAuth providers | cut | Email-only by decision — magic link is the sole method; OAuth buttons removed from `/login` |
| E0-05a | App-side auth plumbing (login, callback, middleware, AuthStatus) | done | `middleware.ts`, `/login`, `/auth/*`; works once E0-04/05 configured |
| E0-06 | Migration: `revisions` + `record_revision()` trigger | done | `0001_foundation.sql` |
| E0-07 | Migration: `reports`, `moderation_actions` | done | `0001_foundation.sql` |
| E0-08 | Migration: `sources`, `citations` | done | `0001_foundation.sql` |
| E0-09 | Migration: RLS policies across all tables | done | `0006` + `0009` hardening. Applied & verified |
| E0-10 | Handle reservation + profanity/impersonation blocklist | todo | |
| E0-11 | GitHub Actions keepalive cron | todo | **Free tier pauses after 7 days idle** |
| E0-12 | Next.js scaffold on Vercel Hobby + Supabase client | done | `@supabase/ssr` clients in `lib/supabase/{client,server}.ts`, generated `database.types.ts`, `/archive` proof page reads seeded data. Set `NEXT_PUBLIC_SUPABASE_*` in Vercel |
| E0-13 | Sentry + basic analytics (Plausible/Umami self-host) | todo | |
| E0-14 | Moderation queue UI | todo | Ships Phase 0, not later |
| E0-15 | Rate limiting on write endpoints | todo | |
| E0-16 | Recruit 3 volunteer moderators | todo | Do this before you need them |
| E0-17 | Apply all migrations to production | done | 0001–0009 live on `uczitvfcazcujzbhjetj` |
| E0-18 | End-to-end smoke test of verification pipeline | done | Wilco/Nels scenario passing |
| E0-19 | Resolve security advisor findings | done | `0009`. 2 accepted with rationale in HANDOFF |
| E0-20 | Automated migration test suite in CI | todo | Parser missed a real enum-cast bug; execute, don't parse |

## E1 — Music Graph · Phase 0

| ID | Task | Status | Notes |
|---|---|---|---|
| E1-01 | Migration: `artists`, aliases, memberships, instruments | done | `0002_music_graph.sql` |
| E1-02 | Migration: `organizations`, `artist_org_links` | done | `0002_music_graph.sql` |
| E1-03 | Migration: `releases`, `release_credits` | done | `0002_music_graph.sql` |
| E1-04 | MusicBrainz lookup + import service | todo | 1 req/sec, real User-Agent |
| E1-05 | Artist merge/dedupe tool for moderators | todo | You will need this sooner than you think |
| E1-06 | Artist page: appearances, memberships, releases | done | `/artist/[slug]` ships appearance history from `v_artist_appearances`. Memberships/releases await that data |
| E1-07 | Artist search with trigram + alias matching | todo | |
| E1-08 | Seed instruments + reference data | done | Applied. 22 instruments, 5 stages, 20 transits |

## E2 — Set Pages & Core UGC · Phase 0

| ID | Task | Status | Notes |
|---|---|---|---|
| E2-01 | Migration: venues, editions, events, stages, transits | done | `0003_...sql` |
| E2-02 | Migration: `sets` | done | `0003_...sql` |
| E2-03 | Migration: `performances` + role defaults | done | `0003_...sql` |
| E2-04 | Migration: `performance_votes` + status recompute trigger | done | `0003_...sql` |
| E2-05 | Migration: `songs`, `setlist_entries`, entry performers | done | `0004_...sql` |
| E2-06 | Migration: `set_reviews` | done | `0004_...sql` |
| E2-07 | Views: appearances, sit-in graph, heard songs | done | `0004_...sql` |
| E2-08 | **Seed 2026 edition: events, stages, sets** | done | `0010_seed_2026_edition.sql`. 1 edition, 5 events (3 days + 2 aftershows), 79 sets. Added Bike stage + Jane Pickens venue |
| E2-09 | Set page UI | done | `/archive/[year]/[slug]` shows performers by role + stage/time; edition pages link to it. Setlist/media/reviews attach next |
| E2-10 | Setlist editor with revision history + revert | wip | Add-song contribution shipped (`/archive/[year]/[slug]`); revision-history/revert UI still todo |
| E2-11 | Sit-in submission with instrument + song tagging | wip | Guest+role+instruments submission shipped (`/archive/[year]/[slug]`, pending until confirmed); per-song tagging still todo |
| E2-12 | Confirm/dispute UI with "confirmed by N" | todo | |
| E2-13 | Review + rating UI | todo | |
| E2-14 | Citation attachment UI | todo | |
| E2-15 | Song fuzzy-match on setlist entry | todo | |
| E2-16 | **Google Form fallback for submissions** | todo | **Day 1. Insurance against build slip** |

## E3 — Media Embeds · Phase 0

| ID | Task | Status | Notes |
|---|---|---|---|
| E3-01 | Migration: `media_embeds` | done | `0004_...sql` |
| E3-02 | oEmbed resolver (YouTube, Instagram, Bandcamp, Archive.org) | todo | |
| E3-03 | Paste-a-URL embed UI, attach to set/song/performance | todo | |
| E3-04 | Lite-embed rendering (no iframe API on page load) | todo | |
| E3-05 | Auto-promote performance to `confirmed` on high-confidence video | todo | |

## E4 — Message Board · Phase 1

| ID | Task | Status | Notes |
|---|---|---|---|
| E4-01 | Migration: categories, topics, posts, votes | done | `0005_...sql` |
| E4-02 | Seed Newport-specific categories | done | Applied. 11 categories live |
| E4-03 | Threaded posting UI + markdown | todo | |
| E4-04 | Auto-create set threads | todo | |
| E4-05 | Subscriptions + notification digest | todo | |
| E4-06 | Ticket exchange rules, pinned, verified-user gate | todo | Highest fraud surface on the site |
| E4-07 | Report/flag integration | todo | |

## E5 — The Wire · Phase 1

| ID | Task | Status | Notes |
|---|---|---|---|
| E5-01 | Migration: `news_items`, `user_follows` | done | `0005_...sql` |
| E5-02 | Ingestion: MusicBrainz release groups | todo | |
| E5-03 | Ingestion: Spotify new releases | todo | |
| E5-04 | Ingestion: Bandsintown/Ticketmaster tour dates | todo | Also writes F02/F03 features |
| E5-05 | Ingestion: setlist.fm non-Newport performances | todo | Feeds F06 orbit centrality |
| E5-06 | Ingestion: RSS (No Depression, NPR, Aquarium Drunkard, Paste) | todo | Headline + link only |
| E5-07 | Editorial layer: feature / suppress / annotate | todo | |
| E5-08 | Feed UI + follow-an-artist | todo | |
| E5-09 | Weekly digest email | todo | |

## E6 — The Oracle · Phase 2

| ID | Task | Status | Notes |
|---|---|---|---|
| E6-01 | Migration: features, snapshots, predictions, outcomes | done | `0005_...sql` |
| E6-02 | Seed feature weights | done | Applied. 23 features live |
| E6-03 | Candidate universe builder | todo | |
| E6-04 | **Weekly snapshot job** | todo | **Start immediately — cannot be backfilled** |
| E6-05 | Feature computers F01–F23 | todo | One per feature; F03 first |
| E6-06 | Scoring + tier assignment | todo | Ranks/tiers only until calibrated |
| E6-07 | Public odds board with visible weights | todo | |
| E6-08 | Per-artist explanation view | todo | Interpretability *is* the product |
| E6-09 | Calibration + Brier tracking | todo | |
| E6-10 | Post-mortem generator | todo | |

## E7 — Bingo · Phase 2

| ID | Task | Status | Notes |
|---|---|---|---|
| E7-01 | Migration: cards, squares, lock trigger, pick-rate view | done | `0005_...sql` |
| E7-02 | Card builder UI with artist autocomplete | todo | User picks their own 24 |
| E7-03 | Lock enforcement + deadline before wave 1 | todo | Game is meaningless without it |
| E7-04 | Public card gallery | todo | |
| E7-05 | Wave-based incremental scoring | todo | |
| E7-06 | Leaderboards: overall, boldest, most contrarian | todo | |
| E7-07 | Wire `crowd_pick_rate` into F20 | todo | The game feeds the model |
| E7-08 | Confirm free-entry/no-prize framing in rules copy | todo | Keeps it out of sweepstakes regulation |

## E8 — The Wishlist · Phase 2

| ID | Task | Status | Notes |
|---|---|---|---|
| E8-01 | Wishlist topic kind + status labels | done | `0005_...sql` |
| E8-02 | Wishlist UI with voting | todo | |
| E8-03 | Annual "did it happen?" resolution pass | todo | |
| E8-04 | Feed wishlist votes into F20 | todo | |
| E8-05 | Unaffiliated-site disclaimer, prominent | todo | |

## E9 — Profiles, Attendance & Badges · Phase 1

| ID | Task | Status | Notes |
|---|---|---|---|
| E9-01 | Migration: attendance, badges, user_badges | done | `0004_...sql` |
| E9-02 | Seed badge definitions | done | Applied. 13 badges live |
| E9-03 | Public profile page | todo | |
| E9-04 | **Retroactive set check-off across all editions** | todo | The feature that wins 15-year veterans |
| E9-05 | Nightly badge evaluator | todo | |
| E9-06 | **Attendance playlist + Spotify export** | todo | Best share artifact in the product |
| E9-07 | "Your Newport" annual recap | todo | Phase 5 |

## E10 — Announcement Tracker · Phase 3

| ID | Task | Status | Notes |
|---|---|---|---|
| E10-01 | Migration: waves, lineup_announcements | done | `0005_...sql` |
| E10-02 | Wave entry tool for moderators | todo | |
| E10-03 | Trigger bingo scoring + Oracle resolution on wave | todo | |
| E10-04 | Countdown / "next wave" UI + push | todo | |

## E11 — Schedule Builder · Phase 3

| ID | Task | Status | Notes |
|---|---|---|---|
| E11-01 | Migration: user_schedules, items | done | `0005_...sql` |
| E11-02 | Grid view, all stages, mobile-first | todo | Clashfinder parity |
| E11-03 | Three-tier priority (must/want/if-free) | todo | |
| E11-04 | **Walking-time conflict detection via `stage_transits`** | todo | The differentiator |
| E11-05 | Measure and populate real Fort Adams transit times | todo | Manual, once |
| E11-06 | Auto-suggest from attendance history + follows | todo | |
| E11-07 | Crew mode: compare schedules with friends | todo | |
| E11-08 | Shareable image export | todo | |
| E11-09 | Historical actual set times overlay | todo | |

## E12 — Historical Backfill · Phase 1, ongoing

| ID | Task | Status | Notes |
|---|---|---|---|
| E12-01 | Per-edition completeness meters | todo | Visible gaps recruit contributors |
| E12-02 | Contribution leaderboard | todo | |
| E12-03 | setlist.fm import for prior editions | todo | Check licensing |
| E12-04 | **Post in the Inforoo community explaining the project** | todo | **Do this before any scraping.** Highest-leverage 5 min in the epic |
| E12-05 | Check Inforoo robots.txt + ToS | todo | If restricted → manual-assist import only |
| E12-06 | Candidate-detection pass over forum threads | done | Research agent: 30,483 posts / 1,024 pages across 15 threads → candidate queues |
| E12-07 | LLM structured-extraction pass | done | Research agent: 282 requests, 274 sit-ins, 138 songs extracted with per-row citations |
| E12-08 | Moderator review queue for mined claims | wip | Verified imported: requests (0014), sit-ins (0015), songs (0016). Gated: unnamed-host + collaboration-set rows |
| E12-09 | Opt-out request handling + contact address | todo | |
| E12-10 | "Adopt an edition" program | todo | |

## E13 — Merch · Phase 4

| ID | Task | Status | Notes |
|---|---|---|---|
| E13-01 | Migration: merch_items, merch_listings | done | `0005_...sql` |
| E13-02 | Merch archive by year with designer credits | todo | Good content on its own |
| E13-03 | Classifieds UI — **links out, no payments** | todo | Keeps Vercel Hobby ToS intact |
| E13-04 | Scam reporting + seller history | todo | |
| E13-05 | First-party merch | cut | Needs legal entity, budget, trademark review |

## E14 — Logistics & Meetups · Phase 4

| ID | Task | Status | Notes |
|---|---|---|---|
| E14-01 | Carpool matching board | todo | |
| E14-02 | Newcomer guide as living wiki | todo | |
| E14-03 | Meetup RSVP | todo | |

## E15 — Live Mode · Phase 4

| ID | Task | Status | Notes |
|---|---|---|---|
| E15-01 | Realtime set threads (Supabase Realtime) | todo | |
| E15-02 | Live sit-in reporting, <30s stage-to-site | todo | |
| E15-03 | Live bingo resolution | todo | |
| E15-04 | Sit-in bingo (predict who joins whom) | todo | Most Newport-specific feature in the plan |
| E15-05 | Load test + moderation staffing plan | todo | Freeze features 6 weeks out |
