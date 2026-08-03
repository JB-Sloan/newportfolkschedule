# The Oracle — Lineup Prediction Model

## Design principles

**1. Transparent weighted scoring, not machine learning — in year one.**

Three reasons, and the first is the important one:

- **Interpretability is the product.** Fans want to argue with the weights. "Why is this artist ranked 34th?" must have an answer, and the answer is what generates forum threads. An unexplainable ranking generates nothing.
- You have no training pipeline and no labeled history yet.
- A fitted model needs point-in-time feature snapshots that do not exist retroactively.

Log every prediction from day one. In two or three cycles you'll have genuine supervised data and can fit a model against a transparent baseline you already trust.

**2. This is ranking, not classification.**

You're ordering a candidate universe of several thousand artists against roughly 60–70 slots. Optimize for ranking quality (precision@70, NDCG), not accuracy — a model that predicts "no" for everyone is 98% accurate and useless.

**3. Predict slot type, not just presence.**

"Will play" is less interesting and less falsifiable than "headliner vs. Quad afternoon vs. Museum stage." Model tier as a secondary output.

**4. Point-in-time discipline.**

Tour adjacency in January is a different value than in June. `artist_feature_snapshots` is keyed by `as_of`. **Snapshot weekly from day one.** You cannot reconstruct this retroactively, and without it every backtest silently cheats and tells you the model is far better than it is.

---

## Candidate universe

Union of:

- Every artist with a prior Newport performance (any role, including sit-ins and aftershows)
- Everyone in the collaborator orbit — within 2 degrees in the sit-in graph
- Artists on labels/agencies with Newport history
- Recent Tiny Desk performers
- Lineups from correlated festivals (see feature F13)
- Manual watchlist additions (including Jay's white whales)

Expect 2,000–5,000. Score all of them; publish the top few hundred.

---

## Feature catalog

Your original list, refined, plus additions. `w` is a starting weight — these are guesses to be argued with and tuned, which is the point.

### Tier 1 — Strongest signals

| ID | Feature | w | Notes |
|---|---|---|---|
| F01 | **Prior Newport history** | 10 | Count and recency of prior appearances. Non-linear: 1 prior appearance is a big jump, the 5th matters less |
| F02 | **Tour routing adjacency** | 9 | Announced dates within ~500mi / ±10 days of fest weekend. Strongest *timely* signal; grows sharply Feb–May |
| F03 | **Hard availability conflict** | −15 | Announced conflicting date that weekend. Cheapest, strongest negative you have. Compute this first |
| F04 | **Album cycle position** | 8 | Record released 0–9 months before, or announced for release just after. Newport books the cycle |
| F05 | **Booking agent** | 7 | Probably a stronger clustering signal than label or producer. Agents route regionally and package clients |

### Tier 2 — Strong

| ID | Feature | w | Notes |
|---|---|---|---|
| F06 | **Collaborator-orbit centrality** | 7 | Degrees of separation in *your own sit-in graph* from the Carlile / Isbell / Watchhouse cluster. Computable from data you already own — nobody else has this |
| F07 | **Label** | 5 | Your original feature. Real but weaker than agent |
| F08 | **Producer** | 4 | Your original feature. Works via `release_credits` |
| F09 | **Management company** | 5 | Same clustering logic as agent |
| F10 | **Opened for a Newport-adjacent artist** | 6 | Your original feature. Strong pipeline indicator |
| F11 | **Collaborated with a Newport-adjacent artist** | 6 | Your original feature. Overlaps F06; keep separate for explainability |
| F12 | **Tiny Desk appearance** | 5 | Genuinely predictive for this festival. Recency-weighted |
| F13 | **Correlated festival circuit** | 6 | Green River, Pickathon, Telluride, Railbird, Bonnaroo folk slots; European routing via Cambridge Folk, Green Man, End of the Road |

### Tier 3 — Moderate

| ID | Feature | w | Notes |
|---|---|---|---|
| F14 | **Newport Festivals Foundation ties** | 5 | Grant recipients, workshop and folk-school participants. Underrated and easy to miss |
| F15 | **Newport Jazz overlap** | 4 | Same organization, adjacent weekend, shared routing |
| F16 | **Geography bonus** | 3 | Ireland, UK, Australia, Nashville, LA, Brooklyn/NY, North Carolina. Add: Boston/Providence (local), Austin, Toronto/Montreal, Muscle Shoals/Athens |
| F17 | **Genre/style fit** | 4 | Folk, Americana, political, indie-folk, folk-adjacent pop, gospel, blues. Multi-label, not single |
| F18 | **Debut/breakout flag** | 5 | First significant record. Newport reliably books artists early in the cycle |
| F19 | **Nostalgia score** | 4 | Pre-2000 acts, once-major, still touring. Needs a hard availability/health check |
| F20 | **Crowd pick rate** | 4 | From locked bingo cards + Wishlist votes. A far cleaner version of "frequently mentioned by fans" than parsing forum sentiment |
| F21 | **Recency cooldown** | −3 | Played last year → slightly less likely. **Handle carefully** — regulars break this badly. Suppress for artists with ≥3 appearances |
| F22 | **Themed-set fit** | 3 | Tribute/superjam slots are a separate booking problem — see below |
| F23 | **Jay's White Whale bonus** | +∞ | Manual override. Displayed as such, honestly, with a 🐋. This is a feature, not a bug — every good prediction site has a house pick |

### Modeled separately

**Themed and collaborative sets.** This festival reliably books tribute sets, superjams, and curated collaborations. These have different mechanics — they're assembled, not booked — and predicting "there will be a tribute to X" is a different question. Give it its own board.

---

## Scoring

```
raw_score(artist) = Σ (weight_i × normalized_value_i)
```

Normalize each feature to 0–1 (or −1–0 for negatives) before weighting, so weights stay comparable and arguable.

Convert to a probability by fitting an isotonic or Platt calibration against historical hit rates once you have two cycles of logged predictions. Until then, publish **ranks and tiers** (Lock / Likely / Live Longshot / Dark Horse), not fake percentages. Publishing an uncalibrated "73%" is worse than publishing "Likely" — it implies a precision you don't have.

---

## Evaluation

Publish all of it. Being wrong loudly and honestly is better community content than being vaguely right.

- **Precision@70** — how many of your top 70 actually played
- **Brier score** — once probabilities are calibrated
- **Calibration plot** by confidence bucket
- **Beat-the-crowd** — model vs. aggregate bingo picks. If the crowd beats the model, say so
- **Post-mortem post** after the final wave: biggest misses, biggest hits, what the model didn't know

## Anti-patterns

- Don't tune weights against the current cycle's outcome and then claim predictive success. Freeze weights at a published date each cycle.
- Don't let F03 (availability) be overwhelmed by positive features. A confirmed conflicting date should functionally eliminate an artist.
- Don't hide the white whale. Label it.
- Don't publish percentages until you've calibrated.
