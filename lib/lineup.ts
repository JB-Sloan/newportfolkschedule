import { slugify } from "@/lib/slug";

/**
 * Matching announced or written-in names to artists in the archive. Only an
 * exact normalized match links automatically; anything looser is a suggestion
 * for a person to accept (substring collisions like "Peter Rowan" are why).
 */
export type ArtistRef = { id: string; name: string; slug: string };

export const MAX_LINEUP_LINES = 150;
export const MAX_BILLED_NAME = 120;

/** One artist per line. Strips list markers, drops blanks and repeats. */
export function parseLineup(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const name = line
      .replace(/^\s*(?:[-–—*•·]|\d{1,3}[.)])\s+/, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, MAX_BILLED_NAME)
      .trim();
    const key = slugify(name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

/** Look up by normalized name, or by slug. A name match wins over a slug match. */
export function indexArtists<T extends ArtistRef>(artists: T[]): Map<string, T> {
  const index = new Map<string, T>();
  for (const a of artists) {
    const key = slugify(a.slug);
    if (key && !index.has(key)) index.set(key, a);
  }
  const named = new Set<string>();
  for (const a of artists) {
    const key = slugify(a.name);
    if (key && !named.has(key)) {
      named.add(key);
      index.set(key, a);
    }
  }
  return index;
}

const FILLER = new Set(["the", "and", "of", "a", "an", "his", "her", "with", "band"]);
const words = (s: string) => new Set(slugify(s).split("-").filter((w) => w && !FILLER.has(w)));

function bigrams(s: string): Set<string> {
  const t = slugify(s).replace(/-/g, "");
  const out = new Set<string>();
  for (let i = 0; i < t.length - 1; i++) out.add(t.slice(i, i + 2));
  return out;
}

function overlap(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const x of a) if (b.has(x)) n++;
  return n;
}

/** Closest archive names for a billing with no exact match, best first. */
export function suggestArtists<T extends ArtistRef>(name: string, artists: T[], limit = 4): T[] {
  const w = words(name);
  const g = bigrams(name);
  return artists
    .map((artist) => {
      const aw = words(artist.name);
      const shared = overlap(w, aw);
      const jaccard = shared / (w.size + aw.size - shared || 1);
      const ag = bigrams(artist.name);
      const dice = (2 * overlap(g, ag)) / (g.size + ag.size || 1);
      return { artist, score: Math.max(jaccard, dice) };
    })
    .filter((s) => s.score >= 0.45)
    .sort((a, b) => b.score - a.score || a.artist.name.localeCompare(b.artist.name))
    .slice(0, limit)
    .map((s) => s.artist);
}
