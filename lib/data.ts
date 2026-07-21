import artistsJson from "@/data/artists-2026.json";
import manifestJson from "@/data/schedule-manifest.json";
import policiesJson from "@/data/policies-2026.json";
import scheduleJson from "@/data/schedule-2026.json";
import stagesJson from "@/data/stages-2026.json";
import surpriseGuestsJson from "@/data/surprise-guests-2026.json";
import historyJson from "@/data/newport-history.json";
import {
  ArtistSchema,
  HistoricalYearSchema,
  ManifestSchema,
  PolicySchema,
  ScheduleItemSchema,
  StageSchema,
  SurpriseGuestSchema,
  type Artist,
  type FestivalDate,
  type ScheduleItem,
  type Stage
} from "@/lib/schemas";
import { compareSets } from "@/lib/time";
import { buildHistoryRecords, summarizeHistory } from "@/lib/history";

export const manifest = ManifestSchema.parse(manifestJson);
export const scheduleItems = ScheduleItemSchema.array().parse(scheduleJson).sort(compareSets);
export const artists = ArtistSchema.array().parse(artistsJson).sort((a, b) =>
  (a.sortName ?? a.name).localeCompare(b.sortName ?? b.name)
);
export const stages = StageSchema.array().parse(stagesJson);
export const policies = PolicySchema.array().parse(policiesJson);
export const surpriseGuests = SurpriseGuestSchema.array().parse(surpriseGuestsJson);
export const historicalYears = HistoricalYearSchema.array()
  .parse(historyJson)
  .sort((a, b) => a.year - b.year);
export const historyRecords = buildHistoryRecords(historicalYears, artists);
export const historySummaries = summarizeHistory(historyRecords);

export const artistsById: Record<string, Artist> = Object.fromEntries(
  artists.map((artist) => [artist.id, artist])
);

export const stagesById: Record<string, Stage> = Object.fromEntries(
  stages.map((stage) => [stage.id, stage])
);

export const scheduleById: Record<string, ScheduleItem> = Object.fromEntries(
  scheduleItems.map((item) => [item.id, item])
);

export function getSetTitle(item: ScheduleItem) {
  return item.titleOverride ?? artistsById[item.artistId]?.name ?? item.artistId;
}

export function getSpotifyUrl(artist: Artist) {
  return (
    artist.spotifyUrl ??
    `https://open.spotify.com/search/${encodeURIComponent(artist.name)}`
  );
}

export function getSetsForDay(date: FestivalDate) {
  return scheduleItems.filter((item) => item.date === date);
}

export function getScheduleHydrationData() {
  return {
    manifest,
    scheduleItems,
    artists,
    stages,
    policies,
    historicalYears,
    historySummaries
  };
}
