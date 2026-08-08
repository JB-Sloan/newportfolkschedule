# Status

*Generated 2026-08-08 by `scripts/status.py`. Do not edit by hand — edit `BACKLOG.md`.*

## Overall

`███████████░░░░░░░░░░░░░░░░░░░` **36%** (46/129 tasks)

| Status | Count |
|---|---|
| ✅ done | 46 |
| 🔨 wip | 3 |
| ⛔ blocked | 0 |
| ⬜ todo | 80 |
| 🚫 cut | 3 |

## By epic

| Epic | Phase | Progress | Done | Open | Blocked |
|---|---|---|---|---|---|
| **E0** Foundation | Phase 0 | `████████░░░░` 63% | 12 | 7 | 0 |
| **E1** Music Graph | Phase 0 | `████████░░░░` 62% | 5 | 3 | 0 |
| **E2** Set Pages & Core UGC | Phase 0 | `██████████░░` 81% | 13 | 3 | 0 |
| **E3** Media Embeds | Phase 0 | `██░░░░░░░░░░` 20% | 1 | 4 | 0 |
| **E4** Message Board | Phase 1 | `███░░░░░░░░░` 29% | 2 | 5 | 0 |
| **E5** The Wire | Phase 1 | `█░░░░░░░░░░░` 11% | 1 | 8 | 0 |
| **E6** The Oracle | Phase 2 | `██░░░░░░░░░░` 20% | 2 | 8 | 0 |
| **E7** Bingo | Phase 2 | `██░░░░░░░░░░` 12% | 1 | 7 | 0 |
| **E8** The Wishlist | Phase 2 | `██░░░░░░░░░░` 20% | 1 | 4 | 0 |
| **E9** Profiles, Attendance & Badges | Phase 1 | `███░░░░░░░░░` 29% | 2 | 5 | 0 |
| **E10** Announcement Tracker | Phase 3 | `███░░░░░░░░░` 25% | 1 | 3 | 0 |
| **E11** Schedule Builder | Phase 3 | `█░░░░░░░░░░░` 11% | 1 | 8 | 0 |
| **E12** Historical Backfill | Phase 1, ongoing | `████░░░░░░░░` 30% | 3 | 7 | 0 |
| **E13** Merch | Phase 4 | `███░░░░░░░░░` 25% | 1 | 3 | 0 |
| **E14** Logistics & Meetups | Phase 4 | `░░░░░░░░░░░░` 0% | 0 | 3 | 0 |
| **E15** Live Mode | Phase 4 | `░░░░░░░░░░░░` 0% | 0 | 5 | 0 |

## In progress

- 🔨 **E1-07** Artist search with trigram + alias matching
- 🔨 **E2-11** Sit-in submission with instrument + song tagging
- 🔨 **E12-08** Moderator review queue for mined claims

## Critical path / warnings

- ⬜ **E0-11** GitHub Actions keepalive cron — **Free tier pauses after 7 days idle**
- ⬜ **E2-16** **Google Form fallback for submissions** — **Day 1. Insurance against build slip**
- ⬜ **E6-04** **Weekly snapshot job** — **Start immediately — cannot be backfilled**
- ⬜ **E12-04** **Post in the Inforoo community explaining the project** — **Do this before any scraping.** Highest-leverage 5 min in the epic

## Next up

**E0 Foundation**
- ⬜ E0-10 Handle reservation + profanity/impersonation blocklist
- ⬜ E0-11 GitHub Actions keepalive cron
- ⬜ E0-13 Sentry + basic analytics (Plausible/Umami self-host)

**E1 Music Graph**
- ⬜ E1-04 MusicBrainz lookup + import service
- ⬜ E1-05 Artist merge/dedupe tool for moderators

**E2 Set Pages & Core UGC**
- ⬜ E2-15 Song fuzzy-match on setlist entry
- ⬜ E2-16 **Google Form fallback for submissions**

**E3 Media Embeds**
- ⬜ E3-02 oEmbed resolver (YouTube, Instagram, Bandcamp, Archive.org)
- ⬜ E3-03 Paste-a-URL embed UI, attach to set/song/performance
- ⬜ E3-04 Lite-embed rendering (no iframe API on page load)

**E4 Message Board**
- ⬜ E4-03 Threaded posting UI + markdown
- ⬜ E4-04 Auto-create set threads
- ⬜ E4-05 Subscriptions + notification digest

**E5 The Wire**
- ⬜ E5-02 Ingestion: MusicBrainz release groups
- ⬜ E5-03 Ingestion: Spotify new releases
- ⬜ E5-04 Ingestion: Bandsintown/Ticketmaster tour dates

**E6 The Oracle**
- ⬜ E6-03 Candidate universe builder
- ⬜ E6-04 **Weekly snapshot job**
- ⬜ E6-05 Feature computers F01–F23

**E7 Bingo**
- ⬜ E7-02 Card builder UI with artist autocomplete
- ⬜ E7-03 Lock enforcement + deadline before wave 1
- ⬜ E7-04 Public card gallery

**E8 The Wishlist**
- ⬜ E8-02 Wishlist UI with voting
- ⬜ E8-03 Annual "did it happen?" resolution pass
- ⬜ E8-04 Feed wishlist votes into F20

**E9 Profiles, Attendance & Badges**
- ⬜ E9-03 Public profile page
- ⬜ E9-04 **Retroactive set check-off across all editions**
- ⬜ E9-05 Nightly badge evaluator

**E10 Announcement Tracker**
- ⬜ E10-02 Wave entry tool for moderators
- ⬜ E10-03 Trigger bingo scoring + Oracle resolution on wave
- ⬜ E10-04 Countdown / "next wave" UI + push

**E11 Schedule Builder**
- ⬜ E11-02 Grid view, all stages, mobile-first
- ⬜ E11-03 Three-tier priority (must/want/if-free)
- ⬜ E11-04 **Walking-time conflict detection via `stage_transits`**

**E12 Historical Backfill**
- ⬜ E12-02 Contribution leaderboard
- ⬜ E12-03 setlist.fm import for prior editions
- ⬜ E12-04 **Post in the Inforoo community explaining the project**

**E13 Merch**
- ⬜ E13-02 Merch archive by year with designer credits
- ⬜ E13-03 Classifieds UI — **links out, no payments**
- ⬜ E13-04 Scam reporting + seller history

**E14 Logistics & Meetups**
- ⬜ E14-01 Carpool matching board
- ⬜ E14-02 Newcomer guide as living wiki
- ⬜ E14-03 Meetup RSVP

**E15 Live Mode**
- ⬜ E15-01 Realtime set threads (Supabase Realtime)
- ⬜ E15-02 Live sit-in reporting, <30s stage-to-site
- ⬜ E15-03 Live bingo resolution

