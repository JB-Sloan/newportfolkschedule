# Surprise-Guest Board — Research & Data Guide

This guide is for a research agent (or person) populating
`data/surprise-guests-2026.json` — the list of rumored surprise guests shown on
the app's **Surprises** tab. The engine, schema, UI, and 4 seed suspects are
already built. Your job is to **add more suspects and deepen the evidence** on
existing ones, keeping every claim cited.

The whole point of this feature is **credibility through transparency**: every
percentage point traces to a sourced fact. A suspect with a made-up connection
is worse than no suspect at all. When in doubt, leave it out or lower the weight.

---

## 1. What you're producing

A JSON array in `data/surprise-guests-2026.json`. Each element is one *suspect*
(a plausible unannounced guest — usually **not** on the official bill). Example
(a real seed entry):

```json
{
  "id": "phoebe-bridgers",
  "name": "Phoebe Bridgers",
  "billed": false,
  "summary": "boygenius bandmate of billed artist Lucy Dacus; a Saturday walk-on is the natural vehicle.",
  "links": { "wikipedia": "https://en.wikipedia.org/wiki/Phoebe_Bridgers" },
  "evidence": [
    {
      "type": "shared-band",
      "artistId": "lucy-dacus",
      "weight": 95,
      "detail": "Active member of boygenius alongside Lucy Dacus, who plays the Fort Stage on Saturday.",
      "sources": ["https://en.wikipedia.org/wiki/Boygenius"]
    }
  ],
  "status": "researched",
  "verifiedAt": "2026-07-20"
}
```

### Field rules (enforced by `lib/schemas.ts` — `SurpriseGuestSchema`)

| Field | Rule |
|---|---|
| `id` | kebab-case, unique, `^[a-z0-9-]+$` (e.g. `phoebe-bridgers`) |
| `name` | Display name |
| `billed` | `true` only if they're already on the 2026 lineup (rare for a "surprise") |
| `summary` | ≤ 280 chars, one-line "why them" |
| `links` | optional; `wikipedia`, `website`, `spotify` — **only real URLs you verified** |
| `evidence` | ≥ 1 item (see below) |
| `status` | `draft` \| `researched` \| `confirmed` \| `debunked` |
| `verifiedAt` | date you checked it, `YYYY-MM-DD` |

### Evidence item

```json
{ "type": "...", "artistId": "lucy-dacus", "weight": 70, "detail": "...", "sources": ["https://..."] }
```

- `type` — one of the eight categories in §2.
- `artistId` — the **billed lineup artist** this connects to. Must exist in
  `data/artists-2026.json` (validation fails otherwise). **Omit** for
  artist-agnostic signals (e.g. general tour routing, "played Newport before").
- `weight` — 1–100, strength of *this single fact* (see §3 for calibration).
- `detail` — ≤ 400 chars, plain-English explanation a fan can read.
- `sources` — ≥ 1 real URL. **Every** evidence item needs a citation.

> Get the list of valid `artistId` values from `data/artists-2026.json` (the
> `id` field of each artist). Common hubs: `lucy-dacus`, `brandi-carlile`,
> `nathaniel-rateliff`, `hayley-williams`, `the-lumineers`.

---

## 2. The eight evidence types (and what they mean)

Defined in `lib/surprise.ts` as `EVIDENCE_TYPES`. The scorer starts from a 9%
historical prior and applies documented log-odds coefficients. Pick the right
`type` and a fair `weight`; do not try to reverse-engineer a desired percentage.

| `type` | Means | Relative impact | Typical strong source |
|---|---|---|---|
| `appearance-vehicle` | A named 2026 `& Friends`, tribute, or revue set gives the guest a concrete slot | strongest | Official Newport schedule |
| `tour-routing` | Touring the US Northeast around Jul 24–26, 2026 | strong | Official artist/venue schedule |
| `public-hint` | Current Newport-specific clue or credible community report | strong | Artist/festival social, specific thread |
| `shared-band` | Currently in a band / active project with a billed artist | medium | MusicBrainz "member of", official bio |
| `collaboration` | Co-writes, features, production with a billed artist | modest | Liner notes, music press |
| `past-newport` | Has played or surprise-guested Newport Folk before | small | Historical dataset, past lineups |
| `label-mgmt` | Shares a label, manager, or booking agent | very small | Label or agency roster |
| `schedule-friction` | Difficult route, competing booking, or documented limited live activity | strong penalty | Official tour/history page |

The model infers `appearance-vehicle` when a sourced artist connection points to
one of the four named collaborative 2026 sets. Missing current routing or a
festival-specific signal receives an explicit unknown-availability penalty.
Use `status: "debunked"` only for a hard conflict covering every festival day.

---

## 3. Weighting calibration

Pick `weight` (1–100) for how strong *that one fact* is within its category:

- **90–100** — airtight, current, central (e.g. an *active* band member).
- **65–85** — solid and recent (a documented co-write; a Newport set in the last few years).
- **40–60** — real but older/looser (toured together once; a decade-old collab).
- **15–35** — thin or circumstantial (same genre scene; a vague social hint).

Multiple facts of the *same* type are treated as correlated. The strongest fact
carries the category and later facts close only 20% of the remaining weighted
gap. Two 50s therefore produce 55, not 75. One strong source still beats padding.

**Honesty checks:**
- If you can't find a real source, don't invent the weight — drop the item.
- Prefer structural facts (band membership, credited collaborations, documented
  past appearances) over vibes.
- `tour-routing` for 2026 is time-sensitive — cite an actual date/announcement,
  or use a low weight and note it's provisional.
- Use `schedule-friction` when travel is difficult but a cameo remains possible.
  Do not use it for a clear all-weekend conflict; mark that suspect `debunked`.
- Do **not** assert personal-life facts (relationships, etc.). Keep it musical.

---

## 4. Where to find the data (all free / low-cost)

- **MusicBrainz** (`musicbrainz.org`, open API) — band membership, labels,
  producer/collaborator relationships. The backbone for `shared-band`,
  `collaboration`, `label-mgmt`.
- **Wikidata / Wikipedia** — members, labels, "part of" relations; reliable,
  citable URLs. Good default `sources`.
- **setlist.fm** (API key) — past Newport Folk appearances (`past-newport`) and
  recent tour stops for routing.
- **Bandsintown / Songkick** — upcoming 2026 tour dates for `tour-routing`.
- **Past Newport Folk lineups** (Wikipedia has year-by-year) — who's part of the
  festival's recurring "family" and surprise-guest history.
- **Community signal** — r/newportfolk, the festival's own socials, music press
  (NPR, Cognoscenti/WBUR cover Newport surprises). Use for `public-hint`, and
  cite the specific post/article.

---

## 5. Who to add (suggested targets)

Aim for **12–20 suspects** total across a spread of likelihood. Good hunting grounds:

1. **Bandmates of billed artists** who aren't themselves billed — the strongest
   leads (the seed `boygenius` and `The Highwomen` threads are examples).
2. **Newport "family"** — artists who orbit the festival's collaborative scene
   and recur year to year (the Brandi Carlile / Americana circle, past
   surprise guests).
3. **Artists touring the Northeast** that exact weekend — check routing.
4. **A few long shots** — big names with a thin-but-real thread. Low scores are
   fine and make the board honest; the engine will rank them last.

Avoid: pure fantasy bookings with zero connection (they'll score ~0 and clutter
the board), and anyone already on the bill unless there's a specific reason.

---

## 6. Workflow & validation

1. Edit `data/surprise-guests-2026.json`.
2. Run `npm run validate:data` — it checks the schema, unique ids, and that
   every `artistId` matches a real lineup artist. Fix any errors it prints.
3. (Optional) eyeball scores: the ranked list and percentages render on the
   **Surprises** tab (`npm run dev`, open the tab). Sanity-check that the
   ordering feels right; if a number seems off, it's the evidence talking —
   adjust weights, don't fight the model.
4. Run `npm test && npm run lint && npm run build` before handing back.

Do **not** change `lib/surprise.ts` weights/caps or the schema unless the model
itself needs tuning — that's a separate decision. Your job is data.

---

## 7. Paste-ready prompt for the research agent

> You are populating `data/surprise-guests-2026.json` for the Newport Folk 2026
> "Surprise-guest board." Read `newport-folk-planner-docs/SURPRISE_GUEST_RESEARCH_GUIDE.md`
> and `data/artists-2026.json` (for valid `artistId` values) first. Add 12–20
> plausible surprise-guest suspects, each with cited evidence across the six
> types, following the schema and weighting rules exactly. Every evidence item
> must have at least one real, verified source URL — never invent a fact, a
> Spotify ID, or a source. Prefer MusicBrainz/Wikidata/Wikipedia for structural
> facts and setlist.fm/Bandsintown for Newport history and 2026 tour routing.
> When done, run `npm run validate:data` and fix any errors, then report a table
> of every suspect, their computed likelihood, and the top evidence you found.
