/** Escape LIKE metacharacters so a stray % or _ isn't treated as a wildcard. */
export function escapeLike(q: string): string {
  return q.replace(/[\\%_]/g, (c) => "\\" + c);
}

/** Exact, then prefix, then word-boundary matches first; alphabetical within each. */
export function rankByName<T extends { name: string }>(rows: T[], q: string): T[] {
  const lc = q.toLowerCase();
  const score = (name: string) => {
    const n = name.toLowerCase();
    if (n === lc) return 0;
    if (n.startsWith(lc)) return 1;
    if (n.includes(` ${lc}`)) return 2;
    return 3;
  };
  return [...rows].sort((a, b) => score(a.name) - score(b.name) || a.name.localeCompare(b.name));
}
