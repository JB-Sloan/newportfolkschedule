# HANDOFF — read this first

**Last updated:** 2026-08-02
**Written by:** the previous agent session (claude.ai chat), handing off to Claude Code.

---

## TL;DR

The database schema is **live and verified** on the production Supabase project. Nine migrations applied, 50 tables, RLS on all of them, reference data seeded, end-to-end smoke test passing. No application code exists yet.

**Your first job is `E2-08`: seed the 2026 edition.** It blocks all content capture and the content-capture window is closing. See "Do these first" below.

---

## Project facts

| Thing | Value |
|---|---|
| Product | Fan-run, year-round community archive + lineup prediction engine for Newport Folk Festival |
| Tagline | "We are weird for this festival" |
| **Affiliation** | **Unaffiliated fan project.** Not official. This constrains several features |
| Supabase project | `Newport-Folk-Schedule` |
| Project ref | `uczitvfcazcujzbhjetj` |
| Owner | JB (`jbslo` on Windows / PowerShell) |
| Monetization | **None.** This is load-bearing — see "Constraints" |

---

## Current state of the database

Applied migrations, in order:

| Migration | Contents |
|---|---|
| `0001_foundation` | Extensions, enums, `profiles`, role helpers, `revisions`, moderation, `sources`/`citations` |
| `0002_music_graph` | `artists` (person + group), aliases, memberships, orgs, releases |
| `0003_festival_and_performances` | venues → editions → events → sets → performances, vote triggers |
| `0004_setlists_media_attendance` | songs, setlists, reviews, media embeds, attendance, badges, 3 views |
| `0005_community_oracle_bingo` | Forum, Wire, Oracle, Bingo, schedules, merch |
| `0006_rls_policies` | RLS across all tables |
| `0007_seed_reference_data` | Instruments, Fort Adams stages, forum categories, 23 prediction features, 13 badges |
| `0008_fix_performance_status_cast` | Bug fix — see below |
| `0009_security_hardening` | Advisor fixes — see below |

**Verified state:** 50 tables · RLS enabled on 50 · 147 policies · 4 views · 0 tables with RLS but no policy.

Seeded: 22 instruments, 5 stages, 20 stage transits, 11 forum categories, 23 prediction features, 13 badges.

**No user data, no artists, no editions.** The archive is empty.

### Two things that were fixed during deployment — don't reintroduce them

1. **`0008`** — `recompute_performance_status()` had a `CASE` returning `text` assigned to a `claim_status` column. Postgres won't implicitly cast text → enum in `UPDATE SET`. The fix casts the whole `CASE` with `::claim_status`. A SQL parser will *not* catch this class of bug; only executing it does. Write execution tests, not just parse checks.

2. **`0009`** — `user_badges` had RLS enabled with no policies, which silently locks out every role including reads. Any new table needs a policy in the same migration that creates it.

### One deliberate non-fix

The advisor flags `citext` and `pg_trgm` as installed in the `public` schema. Moving them post-hoc (`alter extension … set schema extensions`) is risky because `citext` columns already exist across the schema and several functions pin `search_path = public`. It's a WARN, not an ERROR, and the standard Supabase role search_path includes `extensions`. **Left as-is deliberately.** If you ever rebuild from scratch, install them into `extensions` from the start.

Also deliberate: `current_role_level()`, `is_active_user()`, and `is_moderator()` remain executable by `anon` and `authenticated` despite advisor warnings. RLS policy expressions evaluate as the *calling* role, so revoking `EXECUTE` breaks every policy on the site. They leak only the caller's own role level. Do not "fix" this.

---

## The one modeling idea to understand before touching anything

**A person and a band are both rows in `artists`,** discriminated by `artist_type`. Membership is a relationship between them.

JB's canonical example: the guitarist from Wilco played with an R.E.M. cover band.

```
artists            Nels Cline (person), Wilco (group)
artist_memberships Nels Cline → Wilco, roles {guitar}, 2004–
performances       (Wilco's set,   Wilco,      'billed')
                   (Wilco's set,   Nels Cline, 'band_member')
                   (tribute set,   Nels Cline, 'sit_in', instruments {guitar})
```

This makes `v_sit_in_graph` possible — who has shared a stage with whom, across all years. It is the single most valuable asset in the product and no other Newport resource has it. Don't collapse people into bands.

**Aftershows are first-class.** The `events` layer sits between editions and sets specifically so aftershows/late-night sets get full setlist and sit-in treatment while remaining filterable out of "official lineup" stats.

**Verification is layered:** community confirm/dispute votes (`performance_votes`), evidence (`sources` + `citations`), and wiki revision history (`revisions`). Sit-ins start `pending`; `billed` and `band_member` auto-confirm. Net +3, one `trusted`-role confirm, or one `high`-confidence citation promotes to `confirmed`. Net negative → `disputed`. Net zero stays `pending` (verified behaviour, intentional).

---

## Do these first

1. **`E2-08` — seed the 2026 edition.** Editions, events (including aftershows), stages, sets, from the published schedule. Everything downstream is blocked on this. *Highest priority.*
2. **`E2-16` — put up a Google Form** for setlist and sit-in submissions today, as insurance. The post-festival memory window is measured in weeks; do not let it close while the app is being built. Backfill later.
3. **`E0-04` — configure custom SMTP (Resend).** Supabase's built-in email sender is rate-limited to a few messages per hour and is not for production. Signups will silently fail without this.
4. **`E0-11` — GitHub Actions keepalive cron.** Free-tier Supabase projects **pause after 7 days of inactivity.** Template at `.github_workflows_keepalive.yml.example`. Set it up before the first quiet week, not after.
5. **`E6-04` — weekly prediction feature snapshots.** `artist_feature_snapshots` is keyed by `as_of`. Point-in-time data **cannot be reconstructed retroactively**, and without it every backtest silently cheats. Start writing snapshots as soon as there are artists, even if the model isn't built.

---

## Constraints that will bite you if you forget them

- **Vercel Hobby is non-commercial only.** The moment merch takes a fee, or ads appear, it's a ToS violation. Merch is **classifieds that link out** — no payments, no escrow, no Stripe Connect. First-party merch is marked `cut` and needs a legal entity, budget, and a trademark conversation first.
- **Media is embeds only.** Never host video or full-res photos. Cost, yes — but mainly it keeps DMCA exposure with YouTube/Instagram rather than with a volunteer fan site hosting recordings of copyrighted performances.
- **Inforoo mining: facts, not prose.** "X sat in on Y" is a fact and not copyrightable; the forum post asserting it is *evidence*. Store a link, an author handle, and a sub-400-char excerpt in `sources`/`citations`. Never bulk-copy posts. **`E12-04` — post in the community explaining the project before scraping anything** — is the highest-leverage task in that epic. That audience is your audience.
- **This is a fan site with no influence over the festival.** The feedback forum was deliberately reframed as *The Wishlist* (dream sit-ins, artists we want back) with honest status labels. Don't rebuild it as something that implies the organizers are listening.
- **Bingo stays free-entry with no prizes of material value.** An entry fee or real prize pulls it into sweepstakes/gambling regulation with state registration thresholds.

---

## Where things live

```
README.md                  Orientation + quickstart
HANDOFF.md                 ← you are here
docs/00-product-brief.md   Thesis, audience, non-goals
docs/01-architecture.md    Stack, $0 cost model, free-tier limits, key decisions
docs/02-data-model.md      Schema rationale — read before changing tables
docs/03-roadmap.md         5 phases keyed to the festival calendar + risk register
docs/04-epics.md           E0–E15 scope and acceptance criteria
docs/05-prediction-model.md  23 features with weights, scoring, evaluation
docs/06-data-sourcing.md   APIs, licensing, Inforoo mining rules
tracking/BACKLOG.md        127 tasks. THE source of truth for status
tracking/STATUS.md         Generated — never edit by hand
scripts/status.py          Regenerates STATUS.md from BACKLOG.md
supabase/migrations/       0001–0009, matching production exactly
supabase/seed/             Reference data (same content as migration 0007)
```

**Repo and production are in sync.** All nine migrations exist as files and all nine are applied to `uczitvfcazcujzbhjetj`. Verify with `supabase migration list` after linking. Note that `supabase/seed/001_reference_data.sql` duplicates migration `0007` — it's kept for local `db reset` workflows and is idempotent, so running both is harmless.

---

## Working agreements

- **Tracking:** update the `Status` column in `tracking/BACKLOG.md`, then run `python3 scripts/status.py`. Never hand-edit `STATUS.md`. Valid statuses: `todo` `wip` `blocked` `done` `cut`.
- **Migrations are forward-only.** Never edit one that has run in production. Numbered, snake_case names.
- **Every new table gets RLS + at least one policy in the same migration.**
- **Run `get_advisors` after every DDL change.** It caught two real problems here.
- **Test by executing, not by parsing.** The enum-cast bug passed a real Postgres parser cleanly and failed instantly on execution.
- **Database branching is a paid feature.** On free tier, test locally with `supabase db reset` and push forward.

---

## Environment notes for JB's machine

Working from `C:\Users\jbslo` in PowerShell. Earlier CLI attempts failed for three reasons worth knowing:

1. `supabase link` needs `supabase login` first (or `SUPABASE_ACCESS_TOKEN`)
2. `supabase db push` reads `./supabase/migrations` relative to cwd — it must be run from the repo root, which didn't exist yet
3. `psql` isn't installed on Windows by default

None of this matters if you use the Supabase MCP connector, which is what deployed the current schema.

---

## Open questions for JB

- Are there real measured walking times between Fort Adams stages? `stage_transits` currently holds placeholder values (5–9 min) and they drive the schedule builder's conflict detection.
- Which prior editions matter most for backfill priority?
- Does anyone already have a personal setlist/sit-in archive that could seed the database? Worth asking before mining anything.
- Confirm the 2026 stage list — seeded with Fort, Quad, Harbor, Museum, Foundation.
