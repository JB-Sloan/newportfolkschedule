/**
 * Newport Bingo shared rules. A card is 25 slots in reading order: 24 artist
 * picks plus a free center. The database (migration 0023) is the authority;
 * these helpers keep the UI and server actions in step with it.
 */
export const CARD_SIZE = 25;
export const FREE_POSITION = 12;
export const PICKS_NEEDED = 24;
export const MAX_TITLE = 60;
export const MAX_NAME = 80;

/** `id` is absent for a write-in that isn't in the artist archive yet. */
export type Pick = { id?: string; name: string };
export type Slots = (Pick | null)[];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (s: string): boolean => UUID.test(s);

export function emptySlots(): Slots {
  return Array.from({ length: CARD_SIZE }, () => null);
}

const normalizeName = (s: string) => s.replace(/\s+/g, " ").trim();

export function samePick(a: Pick, b: Pick): boolean {
  if (a.id && b.id) return a.id === b.id;
  return normalizeName(a.name).toLowerCase() === normalizeName(b.name).toLowerCase();
}

/** Coerce untrusted input (localStorage, stored draft, action args) to a valid card. */
export function sanitizeSlots(input: unknown): Slots {
  const slots = emptySlots();
  if (!Array.isArray(input)) return slots;
  const seen: Pick[] = [];
  for (let i = 0; i < CARD_SIZE; i++) {
    const raw = input[i] as { id?: unknown; name?: unknown } | null | undefined;
    if (i === FREE_POSITION || !raw || typeof raw !== "object" || typeof raw.name !== "string") continue;
    const name = normalizeName(raw.name).slice(0, MAX_NAME).trim();
    if (!name) continue;
    const pick: Pick = typeof raw.id === "string" && isUuid(raw.id) ? { id: raw.id, name } : { name };
    if (seen.some((s) => samePick(s, pick))) continue;
    seen.push(pick);
    slots[i] = pick;
  }
  return slots;
}

export function countPicks(slots: Slots): number {
  return slots.filter(Boolean).length;
}

/** First open slot at or after `from`, wrapping; -1 when the card is full. */
export function nextEmpty(slots: Slots, from = 0): number {
  for (let k = 0; k < CARD_SIZE; k++) {
    const i = (from + k) % CARD_SIZE;
    if (i !== FREE_POSITION && !slots[i]) return i;
  }
  return -1;
}

/** Rearrange the picks at random, leaving the free center alone. */
export function shuffleSlots(slots: Slots, random: () => number = Math.random): Slots {
  const values = slots.filter((_, i) => i !== FREE_POSITION);
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }
  return [...values.slice(0, FREE_POSITION), null, ...values.slice(FREE_POSITION)];
}

/** Display mirror of bingo_is_open() in migration 0023. */
export function isBingoOpen(
  edition: { year: number; start_date: string | null; is_cancelled: boolean },
  waveAnnounced: boolean,
  today: string = new Date().toISOString().slice(0, 10)
): boolean {
  return !edition.is_cancelled && !waveAnnounced && (edition.start_date ?? `${edition.year}-07-01`) > today;
}
