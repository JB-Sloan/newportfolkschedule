import type { Artist, ScheduleItem } from "@/lib/schemas";
import { FESTIVAL_DAYS, compareSets } from "@/lib/time";

type ArtistLookup = Record<string, Pick<Artist, "name"> | undefined>;

const DEFAULT_MAX_LENGTH = 260;
const TITLE = "My Newport Folk 2026 schedule:";
const TAG = "#NewportFolk";

function performerName(item: ScheduleItem, artistsById: ArtistLookup) {
  return item.titleOverride ?? artistsById[item.artistId]?.name ?? "Unknown set";
}

function routeLine(label: string, names: string[], maxNames: number) {
  const shown = names.slice(0, maxNames);
  const remaining = names.length - shown.length;
  return `${label}: ${shown.join(" -> ")}${remaining > 0 ? ` -> +${remaining} more` : ""}`;
}

function buildPost(lines: string[]) {
  return [TITLE, ...lines, TAG].join("\n");
}

export function buildSocialPost(
  selectedItems: ScheduleItem[],
  artistsById: ArtistLookup,
  maxLength = DEFAULT_MAX_LENGTH
) {
  const groups = FESTIVAL_DAYS.map((day) => ({
    label: day.label,
    names: selectedItems
      .filter((item) => item.date === day.date)
      .sort(compareSets)
      .map((item) => performerName(item, artistsById))
  })).filter((group) => group.names.length > 0);

  if (!groups.length) {
    return "My Newport Folk 2026 schedule is wide open.\n#NewportFolk";
  }

  const mostNamesInAnyDay = Math.max(...groups.map((group) => group.names.length));
  for (let maxNames = mostNamesInAnyDay; maxNames >= 1; maxNames -= 1) {
    const candidate = buildPost(groups.map((group) => routeLine(group.label, group.names, maxNames)));
    if (candidate.length <= maxLength) return candidate;
  }

  const countLines = groups.map((group) => `${group.label}: ${group.names.length} picks`);
  return buildPost(countLines);
}
