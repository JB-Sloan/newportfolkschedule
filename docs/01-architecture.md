# Architecture

## Stack

| Layer | Choice | Cost |
|---|---|---|
| Database | Supabase Postgres (`Newport-Folk-Schedule`, ref `uczitvfcazcujzbhjetj`) | Free tier |
| Auth | **Supabase Auth** (email magic link + Google/Apple OAuth) | Free tier |
| API | PostgREST (auto-generated) + Edge Functions for ingestion | Free tier |
| Frontend | Next.js on Vercel Hobby | Free tier |
| CDN / images | Cloudflare (proxy + Images resize on free plan) | Free tier |
| Media | **Embeds only** — YouTube, Instagram, Bandcamp, Archive.org, nugs | $0 |
| Scheduled jobs | GitHub Actions cron (public repo = unlimited minutes) | Free |
| Transactional email | Resend free tier (3k/mo) as custom SMTP for Supabase Auth | Free tier |
| Search | Postgres `tsvector` + `pg_trgm` | Included |
| Error tracking | Sentry free tier | Free tier |

## Decision: drop Auth0

You asked whether Auth0 is needed. It is not, and it actively costs you something.

**Why Supabase Auth instead:**

- It issues the JWT that Postgres Row Level Security reads natively. `auth.uid()` just works inside policies. With Auth0 you have to bridge the JWT into Supabase, keep signing keys in sync, and mirror user records — real work, permanently, for a consumer community with no enterprise SSO requirement.
- Free for 50,000 monthly active users. This site will not approach that.
- Magic-link email, plus Google and Apple OAuth, covers the whole audience.

**The one gotcha:** Supabase's built-in email sender is rate-limited to a handful of messages per hour and is not for production. Configure custom SMTP (Resend free tier) before you open signups. This is a 20-minute task in `E0-04` and it will silently break your launch if skipped.

## Decision: embeds, not uploads

All media is a reference to a third-party URL. Never store video or full-resolution photos.

Three benefits, one of them big:

1. **Zero storage and egress cost** — the binding constraint on the free tier.
2. **DMCA posture shifts to the host.** You are linking to a YouTube video, not hosting a recording of a copyrighted performance. This is meaningfully safer than the alternative and it is the reason this feature can ship without a legal budget.
3. Playback, transcoding, and mobile support are someone else's problem.

Store `provider`, `provider_id`, `url`, cached `title` and `thumbnail_url`. Render with lite-embed components so you aren't loading the YouTube iframe API on every set page.

## Free-tier limits and where they bind

| Limit | Free tier | Realistic usage | Risk |
|---|---|---|---|
| Database size | 500 MB | ~20 editions × ~70 sets × ~15 songs ≈ 25k setlist rows. Text is tiny. | None |
| Egress | 5 GB/mo | Binds only if you serve images from Supabase | Low — use Cloudflare |
| Auth MAU | 50,000 | Hundreds to low thousands | None |
| Edge Function calls | 500k/mo | Ingestion runs a few times daily | None |
| **Project pause** | **After 7 days inactive** | — | **Real** |

**The pause is the one that will actually bite you.** Supabase pauses free projects after a week without activity, and this app has quiet stretches. Mitigation: the GitHub Actions cron that runs The Wire ingestion doubles as a keepalive. Schedule it daily from day one, before there's anything to ingest.

## Vercel Hobby: the monetization tripwire

Vercel's Hobby plan is **non-commercial use only**. A free fan community site is fine. The moment the merch marketplace takes a transaction fee, or you run ads, or you sell first-party merch through the site, you are in violation and need Pro ($20/mo).

This is a real constraint on the merch epic, not a footnote. Plan:

- **Phase 1 (in scope, free):** classifieds. Listings link out to eBay/Discogs/Poshmark or to a DM. No payments, no fees, no escrow. Stays non-commercial.
- **Phase 2 (out of scope until there's a budget):** anything touching money.

Do not build Stripe Connect. It brings escrow, chargebacks, disputes, and 1099-K obligations that a volunteer fan site cannot staff.

## Data flow

```
                 ┌──────────────────────────────────┐
   GitHub        │  Ingestion (Edge Functions)       │
   Actions ─────►│  MusicBrainz · Spotify · Bandsintown │
   (cron)        │  setlist.fm · RSS feeds          │
                 └──────────────┬───────────────────┘
                                │
                                ▼
    ┌───────────────────────────────────────────────┐
    │        Supabase Postgres — the music graph     │
    │  artists · memberships · sets · performances   │
    │  setlists · sources · citations                │
    └───────┬───────────────┬───────────────┬───────┘
            │               │               │
            ▼               ▼               ▼
      Set pages        The Wire        The Oracle
      (archive)        (news feed)     (predictions)
                                             │
                                             ▼
                                       Bingo cards
                                    (crowd signal loops
                                     back as a feature)
```

## The loop worth noticing

User bingo cards are a **free crowdsourced prediction signal**. Your original feature list included "frequently mentioned by fans" as a model input — bingo picks are a far cleaner version of that than trying to parse forum sentiment. Aggregate pick-rate across all locked cards becomes the `crowd_pick_rate` feature in The Oracle.

That means the game feeds the model and the model makes the game more interesting. Build them in the same phase.

## Environments

| Env | Purpose |
|---|---|
| `local` | Supabase CLI local stack, seeded from `supabase/seed/` |
| `preview` | Supabase branch per PR (free tier allows branching on paid only — use local + a shared staging project if needed) |
| `production` | `uczitvfcazcujzbhjetj` |

Note: database branching is a paid feature. On free tier, test migrations locally with `supabase db reset` and push forward-only.

## Conventions

- UUID v4 primary keys, `gen_random_uuid()`.
- `created_at` / `updated_at` on every table, `updated_at` maintained by trigger.
- Slugs are `citext` and unique.
- All user-generated tables carry `status` (`visible` / `pending` / `hidden` / `removed`) and `submitted_by`.
- RLS on by default. No table ships without policies.
- Migrations are forward-only and numbered. Never edit a migration that has run in production.
