import type { Artist, HistoricalYear } from "@/lib/schemas";

/**
 * Newport Folk historical-appearance matching.
 *
 * The source data records each year's roster as free-text act names (e.g.
 * "Nathaniel Rateliff and the Night Sweats"), while the 2026 lineup uses a
 * shorter canonical name ("Nathaniel Rateliff"). Matching is name-based
 * rather than by hand-maintained id, so a historical name is linked to a
 * 2026 artist when one name contains the other as a whole-word match.
 */

const STOP_PREFIX = /^the\s+/;

export function normalizeHistoryName(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[.,'’()]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(STOP_PREFIX, "");
}

function containsWholeWord(haystack: string, needle: string) {
  if (!needle) return false;
  return new RegExp(`(^|\\s)${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$)`).test(haystack);
}

export type ArtistMatch = { artistId: string; name: string };

/** Best 2026 roster match for a historical act name, if any. */
export function matchHistoricalArtist(name: string, artists: Artist[]): ArtistMatch | undefined {
  const normalized = normalizeHistoryName(name);
  if (normalized.length < 4) return undefined;

  let best: ArtistMatch | undefined;
  for (const artist of artists) {
    const artistNormalized = normalizeHistoryName(artist.name);
    if (artistNormalized.length < 4) continue;
    const isMatch =
      artistNormalized === normalized ||
      containsWholeWord(normalized, artistNormalized) ||
      containsWholeWord(artistNormalized, normalized);
    if (!isMatch) continue;
    if (!best || artistNormalized.length > normalizeHistoryName(best.name).length) {
      best = { artistId: artist.id, name: artist.name };
    }
  }
  return best;
}

export type HistoryAppearanceRecord = {
  year: number;
  name: string;
  role: "billed" | "guest";
  notes?: string;
  artistId?: string;
  artistName?: string;
};

export function buildHistoryRecords(years: HistoricalYear[], artists: Artist[]): HistoryAppearanceRecord[] {
  const records: HistoryAppearanceRecord[] = [];
  for (const year of years) {
    if (year.cancelled) continue;
    for (const appearance of year.appearances) {
      const match = matchHistoricalArtist(appearance.name, artists);
      records.push({
        year: year.year,
        name: appearance.name,
        role: appearance.role,
        notes: appearance.notes,
        artistId: match?.artistId,
        artistName: match?.name
      });
    }
  }
  return records;
}

export type ArtistHistorySummary = {
  key: string;
  name: string;
  artistId?: string;
  totalAppearances: number;
  billedCount: number;
  guestCount: number;
  years: number[];
  records: HistoryAppearanceRecord[];
};

/** Group appearance records by matched artist (or normalized name if unmatched). */
export function summarizeHistory(records: HistoryAppearanceRecord[]): ArtistHistorySummary[] {
  const byKey = new Map<string, ArtistHistorySummary>();

  for (const record of records) {
    const key = record.artistId ?? `name:${normalizeHistoryName(record.name)}`;
    let summary = byKey.get(key);
    if (!summary) {
      summary = {
        key,
        name: record.name,
        artistId: record.artistId,
        totalAppearances: 0,
        billedCount: 0,
        guestCount: 0,
        years: [],
        records: []
      };
      byKey.set(key, summary);
    }
    summary.totalAppearances += 1;
    if (record.role === "billed") summary.billedCount += 1;
    else summary.guestCount += 1;
    if (!summary.years.includes(record.year)) summary.years.push(record.year);
    summary.records.push(record);
    if (record.artistName) summary.name = record.artistName;
  }

  for (const summary of byKey.values()) {
    summary.years.sort((a, b) => a - b);
    summary.records.sort((a, b) => a.year - b.year);
  }

  return Array.from(byKey.values()).sort((a, b) => {
    if (b.totalAppearances !== a.totalAppearances) return b.totalAppearances - a.totalAppearances;
    if (b.years.length !== a.years.length) return b.years.length - a.years.length;
    return a.name.localeCompare(b.name);
  });
}

export function getArtistHistory(
  artistId: string,
  summaries: ArtistHistorySummary[]
): ArtistHistorySummary | undefined {
  return summaries.find((summary) => summary.artistId === artistId);
}
