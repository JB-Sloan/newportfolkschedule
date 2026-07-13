import type { Artist, ScheduleItem } from "@/lib/schemas";
import { FESTIVAL_DAYS, compareSets } from "@/lib/time";

type ArtistLookup = Record<string, Pick<Artist, "name"> | undefined>;

const TITLE = "My Newport Folk 2026 schedule:";
const TAG = "#NewportFolk";

function performerName(item: ScheduleItem, artistsById: ArtistLookup) {
  return item.titleOverride ?? artistsById[item.artistId]?.name ?? "Unknown set";
}

function routeLine(label: string, names: string[]) {
  return `${label}: ${names.join(" -> ")}`;
}

function buildPost(lines: string[]) {
  return [TITLE, ...lines, TAG].join("\n");
}

export function buildSocialPost(selectedItems: ScheduleItem[], artistsById: ArtistLookup) {
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

  return buildPost(groups.map((group) => routeLine(group.label, group.names)));
}
