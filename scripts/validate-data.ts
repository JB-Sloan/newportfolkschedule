import artistsJson from "../data/artists-2026.json";
import manifestJson from "../data/schedule-manifest.json";
import policiesJson from "../data/policies-2026.json";
import scheduleJson from "../data/schedule-2026.json";
import spotifyArtistMapJson from "../data/spotify-artist-map.json";
import stagesJson from "../data/stages-2026.json";
import surpriseGuestsJson from "../data/surprise-guests-2026.json";
import historyJson from "../data/newport-history-2016-2025.json";
import {
  ArtistSchema,
  HistoricalYearSchema,
  ManifestSchema,
  PolicySchema,
  ScheduleItemSchema,
  SpotifyArtistMapSchema,
  StageSchema,
  SurpriseGuestSchema
} from "../lib/schemas";

const manifest = ManifestSchema.parse(manifestJson);
const schedule = ScheduleItemSchema.array().parse(scheduleJson);
const artists = ArtistSchema.array().parse(artistsJson);
const stages = StageSchema.array().parse(stagesJson);
const policies = PolicySchema.array().parse(policiesJson);
const spotifyArtistMap = SpotifyArtistMapSchema.parse(spotifyArtistMapJson);
const surpriseGuests = SurpriseGuestSchema.array().parse(surpriseGuestsJson);
const historicalYears = HistoricalYearSchema.array().parse(historyJson);

const errors: string[] = [];
const warnings: string[] = [];

function duplicateIds(items: Array<{ id: string }>, label: string) {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id)) errors.push(`Duplicate ${label} id: ${item.id}`);
    seen.add(item.id);
  }
}

duplicateIds(schedule, "schedule");
duplicateIds(artists, "artist");
duplicateIds(stages, "stage");
duplicateIds(policies, "policy");

const artistIds = new Set(artists.map((artist) => artist.id));
const stageIds = new Set(stages.map((stage) => stage.id));

for (const item of schedule) {
  const start = new Date(item.start);
  const end = new Date(item.end);

  if (!artistIds.has(item.artistId)) {
    errors.push(`${item.id} references unknown artist ${item.artistId}`);
  }
  if (!stageIds.has(item.stageId)) {
    errors.push(`${item.id} references unknown stage ${item.stageId}`);
  }
  if (item.start.slice(0, 10) !== item.date || item.end.slice(0, 10) !== item.date) {
    errors.push(`${item.id} date does not match start/end timestamps`);
  }
  if (end <= start) {
    errors.push(`${item.id} ends before it starts`);
  }
  if (!item.start.endsWith("-04:00") || !item.end.endsWith("-04:00")) {
    errors.push(`${item.id} must use America/New_York daylight offset -04:00 for July`);
  }

  const duration = Math.round((end.getTime() - start.getTime()) / 60000);
  if (duration < 20 || duration > 150) {
    warnings.push(`${item.id} unusual duration: ${duration} minutes`);
  }
}

for (const stage of stages) {
  for (const transitionStageId of Object.keys(stage.transitions)) {
    if (!stageIds.has(transitionStageId)) {
      errors.push(`${stage.id} has transition to unknown stage ${transitionStageId}`);
    }
  }
}

for (const date of ["2026-07-24", "2026-07-25", "2026-07-26"]) {
  for (const stage of stages) {
    const stageSets = schedule
      .filter((item) => item.date === date && item.stageId === stage.id)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    for (let i = 1; i < stageSets.length; i += 1) {
      const previous = stageSets[i - 1];
      const current = stageSets[i];
      if (new Date(previous.end) > new Date(current.start)) {
        errors.push(`${stage.name} has overlapping sets: ${previous.id} and ${current.id}`);
      }
    }
  }
}

for (const policy of policies) {
  if (policy.scheduleVersion !== manifest.scheduleVersion) {
    errors.push(`${policy.id} policy version does not match manifest version`);
  }
}

for (const [artistId, entry] of Object.entries(spotifyArtistMap.overrides)) {
  if (!artistIds.has(artistId)) {
    errors.push(`spotify-artist-map references unknown artist ${artistId}`);
  }
  if (!entry.skip && entry.resolve.length === 0) {
    errors.push(`spotify-artist-map entry ${artistId} is not skipped but has no resolve targets`);
  }
}

duplicateIds(surpriseGuests, "surprise-guest");
for (const suspect of surpriseGuests) {
  for (const item of suspect.evidence) {
    if (item.artistId && !artistIds.has(item.artistId)) {
      errors.push(`surprise guest ${suspect.id} references unknown artist ${item.artistId}`);
    }
  }
  const hasArtistEdge = suspect.evidence.some((item) => item.artistId);
  if (!hasArtistEdge) {
    warnings.push(`surprise guest ${suspect.id} has no evidence tied to a billed artist`);
  }
}

const seenYears = new Set<number>();
for (const year of historicalYears) {
  if (seenYears.has(year.year)) errors.push(`Duplicate historical year: ${year.year}`);
  seenYears.add(year.year);
  if (!year.cancelled && year.appearances.length === 0) {
    errors.push(`Historical year ${year.year} has no appearances and is not marked cancelled`);
  }
  if (year.cancelled && year.appearances.length > 0) {
    errors.push(`Historical year ${year.year} is marked cancelled but lists appearances`);
  }
}

if (warnings.length) {
  console.warn(`Data validation warnings:\n${warnings.map((warning) => `- ${warning}`).join("\n")}`);
}

if (errors.length) {
  console.error(`Data validation failed:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  process.exit(1);
}

console.log(
  `Validated ${schedule.length} schedule items, ${artists.length} artists, ${stages.length} stages, ${policies.length} policies, ${Object.keys(spotifyArtistMap.overrides).length} Spotify overrides, ${surpriseGuests.length} surprise suspects, ${historicalYears.length} historical years for ${manifest.scheduleVersion}.`
);
