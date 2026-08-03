# Roadmap

Phases are named for the festival calendar, not for scope. The calendar is the constraint; scope flexes.

---

## Phase 0 — Afterglow · August 2026 · 4 weeks

**Goal:** capture this year's archive before the memory of it degrades.

This is the only phase with a hard external deadline. Every week of slip costs setlist and sit-in detail you cannot recover, because the people who remember will stop remembering.

**Ships:** E0 Foundation (minimum), E1 Music Graph, E2 Set Pages & UGC, E3 Media Embeds, plus email capture.

**Ruthless scope cut:** no forum, no news feed, no predictions, no bingo, no profiles beyond a handle. If it isn't "record what happened," it doesn't ship in Phase 0.

**Interim mitigation, day 1:** if the build will take more than a week to reach usable, put up a Google Form for setlist and sit-in submissions immediately and backfill. Do not let the window close while the schema is being argued about.

**Exit criteria**
- 2026 edition fully seeded: all events, stages, sets
- Setlists submittable and editable with revision history
- Sit-ins submittable with confirm/dispute
- YouTube/Instagram embeds attachable to sets
- ≥60% of 2026 sets have a setlist

---

## Phase 1 — Quiet · September–October 2026 · 8 weeks

**Goal:** a reason to open the site on a random Tuesday in October.

**Ships:** E4 Message Board, E5 The Wire, E9 Profiles & Badges, E12 Historical Backfill.

The Wire is the load-bearing feature here. Automated daily ingestion of releases and tour announcements for every artist in the graph means the site has fresh content without anyone writing it. Follow-an-artist notifications turn that into a retention loop.

E12 (backfilling past editions, including the Inforoo mining) runs in parallel as a slow-burn community project. Give it a leaderboard — archival contribution is exactly the kind of work the obsessive core will do for badges.

**Exit criteria**
- Wire ingesting daily with <10% junk rate
- Forum live with the Newport-specific categories seeded
- 5+ prior editions backfilled to set level
- Non-zero DAU sustained through October

---

## Phase 2 — Speculation · November 2026–February 2027 · 14 weeks

**Goal:** peak off-season engagement. This is the phase the whole product exists for.

**Ships:** E6 The Oracle, E7 Bingo, E8 Wishlist.

Sequence matters: Oracle first (it needs feature snapshots accumulating), Bingo second (it needs the artist candidate pool the Oracle defines), Wishlist last.

Publish the odds board publicly with the weights visible and editable-in-argument. The comment threads on the odds board *are* the content.

**Exit criteria**
- Odds board live for the 2027 edition with ≥500 ranked candidate artists
- Weekly feature snapshots running and stored
- Bingo cards buildable, lockable, and public
- `crowd_pick_rate` feeding back into the model

---

## Phase 3 — Reveal · March–May 2027

**Goal:** convert announcement waves into engagement spikes; ship the schedule builder as artists land.

**Ships:** E10 Announcement Tracker, E11 Schedule Builder, E6 scoring/post-mortem.

The schedule builder is useless before March, as you noted — but the `stage_transits` data and the conflict-detection engine can be built in Phase 2 against last year's schedule and simply switched over.

**Exit criteria**
- Bingo scored within 1 hour of each wave
- Public model post-mortem with Brier score published
- Schedule builder usable with a partial lineup

---

## Phase 4 — Countdown · June–July 2027

**Ships:** E13 Merch Archive & Classifieds, E14 Logistics & Meetups, E15 Live Mode.

**Feature freeze 6 weeks before the fest.** Spend that time on load testing and moderation staffing. The weekend is the highest-traffic, lowest-tolerance-for-bugs moment of the year and there is no second chance at it.

**Exit criteria**
- Live sit-in reporting under 30s from stage to site
- Live bingo resolution
- Zero unplanned downtime across the weekend

---

## Phase 5 — Afterglow II · August 2027

The loop closes. Annual recap, "Your Newport" wrapped, model post-mortem, and this year's archive capture — now with a product that already exists.

---

## Dependency map

```
E0 Foundation
 └─► E1 Music Graph ──► E2 Set Pages ──► E3 Media
                    │              └──► E9 Profiles/Badges ──► E11 Schedule Builder
                    ├──► E5 The Wire ──► E6 The Oracle ◄──┐
                    │                         └──► E7 Bingo ┘ (crowd signal)
                    ├──► E12 Backfill ────────────► E6 (training data)
                    └──► E4 Forum ──► E8 Wishlist
                                  └──► E14 Logistics
E10 Announcement Tracker ──► E7 scoring
E13 Merch (independent)
E15 Live Mode (needs E2 + E4)
```

## Risk register

| Risk | Impact | Mitigation |
|---|---|---|
| Afterglow window closes mid-build | High — unrecoverable data loss | Google Form fallback on day 1 |
| Supabase pauses the project | High — site down | Daily GitHub Actions cron from day 1 |
| Moderation load in month 4 | High — quality collapse | Recruit 3 volunteer mods in Phase 1, not Phase 4 |
| Inforoo scraping blocked or objected to | Medium | Manual-assist import, attribution, opt-out; see 06 |
| Cold start on setlists | Medium | Seed from setlist.fm where licensing permits; recruit the 20 known obsessives directly |
| Vercel Hobby ToS if merch monetizes | Medium | Classifieds only; no payments |
| Model is bad in year 1 | Low — it's fine | Frame as transparent and argue-able, publish calibration honestly |
