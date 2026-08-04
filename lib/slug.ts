const LEADING_THE = /^the\s+/;

/**
 * Slugify a title into the same shape the Inforoo import used for songs
 * (lowercase, ampersands spelled out, punctuation dropped, leading "the "
 * removed, spaces to hyphens), so user submissions resolve to existing rows.
 */
export function slugify(input: string): string {
  return (input || "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[.,'’()?!]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(LEADING_THE, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
