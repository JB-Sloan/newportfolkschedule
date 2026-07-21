import type { HistoricalYear, SurpriseEvidence, SurpriseEvidenceType, SurpriseGuest } from "@/lib/schemas";

/**
 * Historically anchored rumor model.
 *
 * The history file records a median of three identified guests per completed
 * festival from 2016-2023. Dividing that median by the live researched
 * candidate-pool size supplies a conservative prior for a screened rumor.
 *
 * Evidence updates log-odds instead of adding percentages. Coefficients are
 * deliberately conservative because the historical data identifies winners
 * but not the full set of pre-festival rumors (the negative training class).
 * They are therefore documented priors ready for later back-testing, not a
 * claim of fully trained statistical calibration.
 *
 * Two historical findings drive the structure:
 * - only 8 of 33 recorded guests had appeared in an earlier dataset year, so
 *   Newport history is a small modifier;
 * - essentially every recorded guest had a named host set or special revue,
 *   so a concrete 2026 appearance vehicle is a major independent signal.
 */

export const HISTORICAL_BASE_RATE = 0.09;

/**
 * Window of seasons that have an audited guest census. Years outside it list
 * billed lineups only, so counting their (zero) guests would understate the
 * real rate — the bound is explicit on both ends so extending the history
 * dataset backwards cannot silently move every rumor percentage.
 */
export const GUEST_CENSUS_FIRST_YEAR = 2016;
export const GUEST_CENSUS_LAST_YEAR = 2023;

/**
 * Uses the median identified-guest count from the completed, guest-audited
 * 2016-2023 seasons. Other history rows document billed lineups but
 * explicitly do not yet contain a complete guest census.
 */
export function deriveHistoricalBaseRate(history: HistoricalYear[], candidatePoolSize: number) {
  if (candidatePoolSize <= 0) return HISTORICAL_BASE_RATE;
  const counts = history
    .filter(
      (year) =>
        !year.cancelled &&
        year.year >= GUEST_CENSUS_FIRST_YEAR &&
        year.year <= GUEST_CENSUS_LAST_YEAR
    )
    .map((year) => year.appearances.filter((appearance) => appearance.role === "guest").length)
    .sort((a, b) => a - b);
  if (!counts.length) return HISTORICAL_BASE_RATE;
  const middle = Math.floor(counts.length / 2);
  const median = counts.length % 2 ? counts[middle] : (counts[middle - 1] + counts[middle]) / 2;
  return Math.min(0.25, Math.max(0.02, median / candidatePoolSize));
}

export const COLLABORATIVE_SET_ARTIST_IDS = new Set([
  "hayley-williams",
  "shannon-narducy-rem",
  "deer-tick",
  "nathaniel-rateliff"
]);

export const EVIDENCE_TYPES: Record<
  SurpriseEvidenceType,
  { label: string; short: string; coefficient: number; color: string; blurb: string }
> = {
  "shared-band": {
    label: "Shared active band",
    short: "Bandmate",
    coefficient: 0.65,
    color: "#c0392b",
    blurb: "A direct active-project relationship with a billed artist."
  },
  "appearance-vehicle": {
    label: "Named guest vehicle",
    short: "Vehicle",
    coefficient: 1,
    color: "#9b2c73",
    blurb: "A documented & Friends or tribute set provides a concrete place for the guest to appear."
  },
  "past-newport": {
    label: "Newport history",
    short: "Newport",
    coefficient: 0.15,
    color: "#b8860b",
    blurb: "A weak modifier: most recorded historical guests were not prior returnees."
  },
  "tour-routing": {
    label: "Verified availability",
    short: "Nearby",
    coefficient: 0.75,
    color: "#7d5ba6",
    blurb: "A dated route places the artist within realistic reach during festival weekend."
  },
  "schedule-friction": {
    label: "Availability friction",
    short: "Conflict",
    coefficient: -1.4,
    color: "#6f3346",
    blurb: "A competing booking, difficult route, or documented lack of live activity lowers the odds."
  },
  collaboration: {
    label: "Past collaboration",
    short: "Collab",
    coefficient: 0.35,
    color: "#2a7d7d",
    blurb: "A real musical relationship, useful but not proof of festival-week availability."
  },
  "public-hint": {
    label: "Festival-specific signal",
    short: "Hint",
    coefficient: 0.8,
    color: "#55708a",
    blurb: "A current, Newport-specific clue or sourced community report."
  },
  "label-mgmt": {
    label: "Label / management",
    short: "Label",
    coefficient: 0.08,
    color: "#8a6d4a",
    blurb: "A small structural tie; it rarely predicts a walk-on by itself."
  }
};

export const EVIDENCE_ORDER: SurpriseEvidenceType[] = [
  "appearance-vehicle",
  "shared-band",
  "tour-routing",
  "schedule-friction",
  "public-hint",
  "collaboration",
  "past-newport",
  "label-mgmt"
];

/**
 * Correlated clues do not behave like independent coin flips. The strongest
 * fact carries the category; each additional fact can close only 20% of the
 * remaining gap. This rewards corroboration without letting padded lists
 * saturate a category.
 */
function correlatedStrength(weights: number[]) {
  const sorted = [...weights].sort((a, b) => b - a);
  if (!sorted.length) return 0;
  let strength = sorted[0];
  for (const weight of sorted.slice(1)) {
    strength += (1 - strength) * weight * 0.2;
  }
  return strength;
}

/** Combined 0..1 strength of one evidence category. */
export function categoryStrength(evidence: SurpriseEvidence[], type: SurpriseEvidenceType) {
  if (type === "appearance-vehicle") {
    const explicit = evidence.filter((item) => item.type === type).map((item) => item.weight / 100);
    const inferred = evidence
      .filter((item) => item.artistId && COLLABORATIVE_SET_ARTIST_IDS.has(item.artistId))
      .map((item) => item.weight / 100);
    return correlatedStrength([...explicit, ...inferred]);
  }

  return correlatedStrength(
    evidence.filter((item) => item.type === type).map((item) => item.weight / 100)
  );
}

function logit(probability: number) {
  return Math.log(probability / (1 - probability));
}

function logistic(value: number) {
  return 1 / (1 + Math.exp(-value));
}

export type CategoryScore = {
  type: SurpriseEvidenceType;
  strength: number;
  contribution: number; // signed log-odds contribution
  inferred?: boolean;
};

export type ScoreBreakdown = {
  percent: number;
  label: string;
  categories: CategoryScore[];
  baseRate: number;
  availabilityKnown: boolean;
  availabilityAdjustment: number;
  confidence: number;
  confidenceLabel: "Low" | "Medium" | "High";
};

export function likelihoodLabel(percent: number) {
  if (percent >= 60) return "Prime suspect";
  if (percent >= 35) return "Strong lead";
  if (percent >= 20) return "Person of interest";
  if (percent >= 8) return "Long shot";
  return "Cold trail";
}

function researchConfidence(evidence: SurpriseEvidence[], categoryCount: number, availabilityKnown: boolean) {
  const sources = new Set(evidence.flatMap((item) => item.sources)).size;
  const billedEdges = new Set(evidence.flatMap((item) => (item.artistId ? [item.artistId] : []))).size;
  const score = Math.min(
    100,
    15 + Math.min(sources, 8) * 5 + Math.min(categoryCount, 5) * 7 + Math.min(billedEdges, 3) * 4 +
      (availabilityKnown ? 15 : 0)
  );
  return { score, label: score >= 75 ? "High" as const : score >= 50 ? "Medium" as const : "Low" as const };
}

export function scoreSuspect(
  suspect: Pick<SurpriseGuest, "evidence"> & Partial<Pick<SurpriseGuest, "status">>,
  baseRate = HISTORICAL_BASE_RATE
): ScoreBreakdown {
  if (suspect.status === "debunked") {
    return {
      percent: 0,
      label: "Ruled out",
      categories: [],
      baseRate,
      availabilityKnown: true,
      availabilityAdjustment: 0,
      confidence: 100,
      confidenceLabel: "High"
    };
  }

  const categories = EVIDENCE_ORDER.map((type) => {
    const strength = categoryStrength(suspect.evidence, type);
    return {
      type,
      strength,
      contribution: strength * EVIDENCE_TYPES[type].coefficient,
      inferred: type === "appearance-vehicle" && !suspect.evidence.some((item) => item.type === type)
    };
  }).filter((category) => category.strength > 0);

  const availabilityKnown = categories.some(
    (category) => category.type === "tour-routing" || category.type === "public-hint"
  );
  const availabilityAdjustment = availabilityKnown ? 0 : -0.6;
  const totalLogOdds =
    logit(baseRate) +
    availabilityAdjustment +
    categories.reduce((total, category) => total + category.contribution, 0);
  const percent = Math.round(logistic(totalLogOdds) * 100);
  const confidence = researchConfidence(suspect.evidence, categories.length, availabilityKnown);

  return {
    percent,
    label: likelihoodLabel(percent),
    categories,
    baseRate,
    availabilityKnown,
    availabilityAdjustment,
    confidence: confidence.score,
    confidenceLabel: confidence.label
  };
}

/** Unique billed artists a suspect is tied to, with the dominant edge type/color. */
export function connectedArtists(suspect: Pick<SurpriseGuest, "evidence">) {
  const byArtist = new Map<string, { artistId: string; type: SurpriseEvidenceType; weight: number }>();
  for (const item of suspect.evidence) {
    if (!item.artistId) continue;
    const existing = byArtist.get(item.artistId);
    if (!existing || item.weight > existing.weight) {
      byArtist.set(item.artistId, { artistId: item.artistId, type: item.type, weight: item.weight });
    }
  }
  return Array.from(byArtist.values());
}

export function rankSuspects<
  T extends Pick<SurpriseGuest, "evidence"> & Partial<Pick<SurpriseGuest, "status">>
>(suspects: T[], history?: HistoricalYear[]) {
  const baseRate = history ? deriveHistoricalBaseRate(history, suspects.length) : HISTORICAL_BASE_RATE;
  return suspects
    .map((suspect) => ({ suspect, score: scoreSuspect(suspect, baseRate) }))
    .sort((a, b) => b.score.percent - a.score.percent || b.score.confidence - a.score.confidence);
}
