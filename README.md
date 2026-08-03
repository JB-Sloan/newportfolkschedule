# Newport Folk

> **Not affiliated with Newport Folk Festival or the Newport Festivals Foundation.**
> Independent fan projects. Schedule information is subject to change; confirm
> critical details with Newport Folk before relying on them.

This repository holds two related Newport Folk projects that share one home:

| Project | What it is | Start here |
|---|---|---|
| **Folk Planner** | The live, offline-first schedule planner app for the 2026 festival (Next.js, deployed to Vercel). Browse by day/stage, mark must-sees, spot conflicts, export `.ics`, build a Spotify playlist. | [Planner README](newport-folk-planner-docs/PLANNER_README.md) |
| **We Are Weird For This Festival** | A fan-run, year-round community archive + speculation engine backed by Supabase (the Archive, the Wire, the Oracle). Under active build. | [HANDOFF.md](HANDOFF.md) |

The planner app lives at the repo root (`app/`, `components/`, `lib/`, `data/`).
The community platform's schema, docs, and tracking live in `docs/`,
`supabase/`, and `tracking/`.

---

## The community platform

Three products sharing one spine:

1. **The Archive** — every set, setlist, sit-in, and aftershow, going back as far
   as we can source it. Individual musicians are tracked separately from bands, so
   "Nels Cline sat in with the R.E.M. tribute set" is a first-class record.
2. **The Wire** — a daily feed of releases, tour announcements, and folk-adjacent
   news for every artist who has ever played the Fort.
3. **The Oracle** — a transparent, argue-with-it lineup prediction model, plus
   user-built bingo cards, to carry the six-month dead zone between festivals.

### Layout

```
docs/          Product, architecture, data model, roadmap, prediction design
tracking/      BACKLOG.md is the single source of truth for status
scripts/       status.py regenerates tracking/STATUS.md from BACKLOG.md
supabase/      Versioned SQL migrations (0001–0010) + seed data
```

### Where to look

| If you want to... | Read |
|---|---|
| Understand the product | `docs/00-product-brief.md` |
| Understand the stack and why it costs $0 | `docs/01-architecture.md` |
| Understand the schema | `docs/02-data-model.md` |
| Know what to build next | `tracking/BACKLOG.md` |
| Understand the prediction model | `docs/05-prediction-model.md` |
| Understand where data comes from | `docs/06-data-sourcing.md` |
| Pick up the build | `HANDOFF.md` |

### Working with the database

The schema is live on the Supabase project `uczitvfcazcujzbhjetj`
(migrations `0001`–`0010` applied). To work with it:

```bash
# Link the Supabase project
npx supabase link --project-ref uczitvfcazcujzbhjetj

# Apply migrations in order
npx supabase db push

# Seed reference data (stages, instruments, feature weights)
psql "$DATABASE_URL" -f supabase/seed/001_reference_data.sql

# Regenerate the status dashboard after editing BACKLOG.md
python3 scripts/status.py
```

Migrations are forward-only; every new table ships with RLS + at least one policy
in the same migration. See `HANDOFF.md` for the working agreements and the two
deliberate advisor non-fixes.
