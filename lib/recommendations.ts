import { findConflicts, getConflictTypeForSet } from "@/lib/conflicts";
import type {
  Artist,
  RecommendationResponse,
  ScheduleItem,
  SelectionMap,
  Stage
} from "@/lib/schemas";
import { compareSets } from "@/lib/time";

type RecommendationInput = {
  schedule: ScheduleItem[];
  artists: Artist[];
  stages: Stage[];
  selections: SelectionMap;
  transitionBufferMinutes: number;
  preferredStageId?: string;
  limit?: number;
};

const WEIGHTS = {
  tags: 38,
  moods: 22,
  genres: 20,
  discovery: 8,
  stage: 6,
  schedule: 6
};

function asSet(values: string[]) {
  return new Set(values.map((value) => value.toLowerCase()));
}

function jaccard(a: Set<string>, b: Set<string>) {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const value of a) {
    if (b.has(value)) intersection += 1;
  }
  return intersection / new Set([...a, ...b]).size;
}

function artistForSet(item: ScheduleItem, artistsById: Record<string, Artist>) {
  return artistsById[item.artistId];
}

export function getDeterministicRecommendations({
  schedule,
  artists,
  stages,
  selections,
  transitionBufferMinutes,
  preferredStageId,
  limit = 5
}: RecommendationInput): RecommendationResponse {
  const artistsById = Object.fromEntries(artists.map((artist) => [artist.id, artist]));
  const selectedItems = schedule.filter((item) => selections[item.id]);
  const selectedArtists = selectedItems
    .map((item) => artistForSet(item, artistsById))
    .filter(Boolean);

  if (selectedArtists.length === 0) {
    const discovery = schedule
      .filter((item) => !selections[item.id])
      .sort(compareSets)
      .slice(0, limit)
      .map((item, index) => {
        const artist = artistsById[item.artistId];
        return {
          artistId: item.artistId,
          setId: item.id,
          score: Math.max(40, 70 - index * 6),
          reason: `${artist?.name ?? item.artistId} is an early placeholder discovery pick. Select a few acts to personalize this list.`,
          conflictType: "none" as const
        };
      });

    return {
      summary: "Pick two or more acts to get better offline recommendations. For now, here are schedule-valid discovery starters.",
      recommendations: discovery,
      warnings: ["Recommendations use placeholder metadata until the official 2026 schedule is imported."]
    };
  }

  const selectedTagSet = asSet(selectedArtists.flatMap((artist) => artist.tags));
  const selectedMoodSet = asSet(selectedArtists.flatMap((artist) => artist.moods));
  const selectedGenreSet = asSet(selectedArtists.flatMap((artist) => artist.genres));
  const selectedNames = selectedArtists.slice(0, 2).map((artist) => artist.name).join(" and ");

  const scored = schedule
    .filter((item) => !selections[item.id])
    .map((item) => {
      const artist = artistsById[item.artistId];
      const candidateSelections: SelectionMap = {
        ...selections,
        [item.id]: "interested"
      };
      const conflicts = findConflicts(schedule, candidateSelections, transitionBufferMinutes, stages);
      const conflictType = getConflictTypeForSet(item.id, conflicts);
      const tagScore = jaccard(selectedTagSet, asSet(artist.tags)) * WEIGHTS.tags;
      const moodScore = jaccard(selectedMoodSet, asSet(artist.moods)) * WEIGHTS.moods;
      const genreScore = jaccard(selectedGenreSet, asSet(artist.genres)) * WEIGHTS.genres;
      const discoveryScore = artist.metadataConfidence === "draft" ? WEIGHTS.discovery : WEIGHTS.discovery / 2;
      const stageScore = preferredStageId && preferredStageId === item.stageId ? WEIGHTS.stage : 0;
      const scheduleScore = conflictType === "none" ? WEIGHTS.schedule : conflictType === "transition" ? 2 : -18;
      const score = Math.max(
        0,
        Math.min(100, Math.round(tagScore + moodScore + genreScore + discoveryScore + stageScore + scheduleScore))
      );
      const matched = [...artist.tags, ...artist.moods, ...artist.genres]
        .filter((tag) =>
          selectedTagSet.has(tag.toLowerCase()) ||
          selectedMoodSet.has(tag.toLowerCase()) ||
          selectedGenreSet.has(tag.toLowerCase())
        )
        .slice(0, 4);

      return {
        artistId: item.artistId,
        setId: item.id,
        score,
        reason: `Recommended because you selected ${selectedNames}: ${matched.length ? matched.join(", ") : "complementary placeholder metadata"}.`,
        tradeoff:
          conflictType === "overlap"
            ? "This overlaps with one of your selected sets."
            : conflictType === "transition"
              ? "This leaves a tight stage transition."
              : undefined,
        conflictType
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return {
    summary: "Offline recommendations are based on shared genres, moods, tags, and schedule fit.",
    recommendations: scored,
    warnings: ["This is deterministic placeholder guidance, not an official recommendation."]
  };
}
