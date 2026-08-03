# Data Sourcing

## Automated sources

| Source | Provides | Licensing | Notes |
|---|---|---|---|
| **MusicBrainz** | Artist identity, MBIDs, memberships, release groups | CC0 for core data | The backbone. Rate limit 1 req/sec, set a real User-Agent |
| **Spotify Web API** | New releases, popularity, related artists, playlist export | Free, ToS-bound | Cannot store audio features long-term under current ToS — check before designing around it |
| **Bandsintown / Ticketmaster Discovery** | Tour dates | Free tier, key required | Primary input for F02 adjacency and F03 conflicts |
| **setlist.fm** | Setlists elsewhere, sit-ins elsewhere | API key, non-commercial OK | See below |
| **Wikipedia / Wikidata** | Bios, geography, formation dates | CC BY-SA | Attribution required |
| **RSS** | No Depression, NPR Music, Aquarium Drunkard, Pitchfork, Paste | Headline + link only | Never republish article bodies |
| **oEmbed** | Media titles and thumbnails | Per-provider | Powers E3 |

### On setlist.fm

Worth deciding deliberately rather than by default. Their API is free for non-commercial use with attribution.

- **Integrating** gets you immediate density and no cold start, and — more usefully — gives you sit-ins at *other* festivals, which is a real prediction signal for the collaborator-orbit feature.
- **Building your own** keeps the engagement and the data in your product.

Recommendation: do both, asymmetrically. Own the Newport setlists natively; pull non-Newport performances from setlist.fm as reference data. Don't try to out-setlist.fm setlist.fm for the rest of the world.

---

## Mining the Inforoo boards

You want to mine past Inforoo threads for sit-in records and aftershow details, and use them as validation. This is the right instinct — that forum contains a decade-plus of firsthand accounts that exist nowhere else, and much of it will otherwise be lost. Some care is warranted in how it's done.

### What's actually at stake

Forum posts are copyrighted by their authors. Bulk-copying them into your database and republishing is a genuine problem, and "it's a fan site" isn't a defense. But that isn't what you need.

**You need the facts, not the prose.** "Nels Cline sat in on 'Cortez the Killer' at the 2019 Deer Tick set" is a fact, and facts aren't copyrightable. The post asserting it is the *evidence*, and a link plus a short excerpt is enough to establish that.

So the schema is built for exactly this: `sources` holds the thread (URL, author handle, date, short excerpt), `citations` links it to the specific claim, and the claim itself lives as a normal `performances` row. You get validation and provenance without republishing anyone's writing.

### Rules for the importer

1. **Check the site's terms and `robots.txt` first.** If either prohibits automated access, switch to manual-assist import — a bookmarklet that lets a human paste a URL and extract the claim. Slower, entirely unobjectionable, and honestly fine at this volume.
2. **Rate limit hard.** 1 request per 2 seconds, off-peak, honest User-Agent identifying the project with a contact address. You are a guest.
3. **Store excerpts under ~200 characters**, only where needed to support a specific claim. Never full posts, never whole threads.
4. **Always link back and attribute** to the original poster's handle.
5. **Never import PII.** No emails, no real names, no location details beyond what the claim requires.
6. **Human in the loop.** Mined claims enter as `status='pending'` with `confidence='low'` and require confirmation before displaying as fact. Automated extraction from casual forum prose will be wrong often — people misremember, joke, and speculate in the same register they report.
7. **Honor opt-out.** Publish a contact address; remove any citation on request, no argument.
8. **Reach out first.** Post in the relevant thread explaining the project and asking whether people mind. This community overlaps almost entirely with yours. Handled well it produces collaborators and a data-donation of hand-curated records; handled badly it produces a fight with the exact people you need. This is the highest-leverage five minutes in the whole epic.

### Extraction approach

Regex and heuristics over forum prose will be brittle. Better: a two-pass pipeline.

1. **Pass 1 — candidate detection.** Cheap filters find posts mentioning known artist names near sit-in language ("sat in," "joined," "came out for," "guest," "surprise").
2. **Pass 2 — structured extraction.** An LLM call converts the candidate to a structured claim: `{set, guest_artist, instrument, song, confidence}`. Returns `null` liberally when uncertain.
3. **Pass 3 — human review queue.** Moderator confirms or rejects. Community confirm/dispute after that.

Expect a low yield and a high false-positive rate. That's fine — the queue is the safety net, and even a few hundred recovered sit-ins is a dataset nobody else has.

### Priority order for backfill

1. Recent editions (best sourcing, most community memory to verify against)
2. Aftershows and late-night sets (worst-documented, highest marginal value)
3. Older editions
4. Pre-2000 archival, which is mostly a press-and-books problem, not a forum one

---

## Data quality

- Every non-obvious archival fact should be traceable to a `source`. That discipline is what separates this from a wiki that slowly fills with confident nonsense.
- Conflicting claims are a feature: display both, show the evidence, let the community resolve it.
- Show completeness meters per edition. Visible gaps recruit contributors better than any call to action.
