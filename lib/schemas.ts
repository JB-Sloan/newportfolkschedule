import { z } from "zod";

export const FestivalDateSchema = z.enum([
  "2026-07-24",
  "2026-07-25",
  "2026-07-26"
]);

export const PrioritySchema = z.enum(["must", "interested"]);

export const ScheduleItemSchema = z.object({
  id: z.string().regex(/^2026-07-(24|25|26)-[a-z0-9-]+$/),
  artistId: z.string().min(1),
  stageId: z.string().min(1),
  date: FestivalDateSchema,
  start: z.string().datetime({ offset: true }),
  end: z.string().datetime({ offset: true }),
  titleOverride: z.string().optional(),
  subtitle: z.string().optional(),
  kind: z
    .enum(["artist", "collaboration", "workshop", "special-set"])
    .default("artist"),
  status: z.enum(["scheduled", "moved", "cancelled"]).default("scheduled"),
  officialSourceUrl: z.string().url(),
  sourceNote: z.string().optional()
});

export const ArtistSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  sortName: z.string().optional(),
  shortBio: z.string().min(1).max(360),
  genres: z.array(z.string().min(1)).max(8),
  tags: z.array(z.string().min(1)).max(12),
  moods: z.array(z.string().min(1)).max(8).default([]),
  spotifyUrl: z.string().url().optional(),
  officialUrl: z.string().url().optional(),
  lineupUrl: z.string().url().optional(),
  links: z
    .object({
      bandcamp: z.string().url().optional(),
      wikipedia: z.string().url().optional(),
      instagram: z.string().url().optional(),
      youtube: z.string().url().optional(),
      tiktok: z.string().url().optional(),
      other: z.string().url().optional()
    })
    .optional(),
  imageUrl: z.string().min(1).optional(),
  imageCredit: z.string().min(1).optional(),
  imageSourceUrl: z.string().url().optional(),
  metadataConfidence: z.enum(["verified", "reviewed", "draft"]),
  metadataSources: z.array(z.string().url()).default([])
});

export const FactStatusSchema = z.enum(["official", "observed", "unknown"]);

export const StageFactSchema = z.object({
  summary: z.string().min(1),
  status: FactStatusSchema
});

export const StageSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  shortName: z.string().min(1),
  description: z.string().min(1),
  seating: StageFactSchema,
  shade: StageFactSchema,
  blankets: StageFactSchema,
  chairs: StageFactSchema,
  surface: StageFactSchema,
  accessibility: StageFactSchema,
  amenities: z.array(z.string()).default([]),
  transitions: z.record(z.number().int().min(0).max(30)),
  sources: z.array(
    z.object({
      url: z.string().url(),
      label: z.string().min(1),
      verifiedAt: z.string().min(1)
    })
  )
});

export const PolicySchema = z.object({
  id: z.string().min(1),
  category: z.enum([
    "chairs",
    "blankets",
    "shade",
    "bags",
    "water",
    "accessibility",
    "weather",
    "entry"
  ]),
  title: z.string().min(1),
  summary: z.string().min(1),
  officialSourceUrl: z.string().url(),
  verifiedAt: z.string().min(1),
  scheduleVersion: z.string().min(1)
});

export const ManifestSchema = z.object({
  festival: z.string().min(1),
  year: z.literal(2026),
  timezone: z.literal("America/New_York"),
  officialScheduleUrl: z.string().url(),
  officialInfoUrl: z.string().url().optional(),
  scheduleVersion: z.string().min(1),
  publishedAt: z.string().datetime({ offset: true }),
  verifiedAt: z.string().datetime({ offset: true }),
  verifiedBy: z.array(z.string().min(1)),
  notes: z.string().min(1)
});

export const SpotifyArtistMapSchema = z.object({
  $comment: z.string().optional(),
  overrides: z.record(
    z.object({
      displayName: z.string().min(1),
      resolve: z.array(
        z.object({
          name: z.string().min(1),
          spotifyId: z.string().regex(/^[0-9A-Za-z]{22}$/).optional(),
          query: z.string().min(1).optional()
        })
      ),
      skip: z.boolean(),
      note: z.string().optional()
    })
  )
});

export const SurpriseEvidenceTypeSchema = z.enum([
  "shared-band",
  "appearance-vehicle",
  "collaboration",
  "tour-routing",
  "schedule-friction",
  "past-newport",
  "label-mgmt",
  "public-hint"
]);

export const SurpriseEvidenceSchema = z.object({
  type: SurpriseEvidenceTypeSchema,
  // References a billed lineup artist id; omit for general (artist-agnostic) signals.
  artistId: z.string().min(1).optional(),
  weight: z.number().int().min(1).max(100),
  detail: z.string().min(1).max(400),
  sources: z.array(z.string().url()).min(1)
});

export const SurpriseGuestSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  billed: z.boolean().default(false),
  summary: z.string().min(1).max(280),
  links: z
    .object({
      spotify: z.string().url().optional(),
      wikipedia: z.string().url().optional(),
      website: z.string().url().optional()
    })
    .optional(),
  evidence: z.array(SurpriseEvidenceSchema).min(1),
  status: z.enum(["draft", "researched", "confirmed", "debunked"]).default("draft"),
  verifiedAt: z.string().min(1)
});

export const HistoricalAppearanceSchema = z.object({
  name: z.string().min(1),
  role: z.enum(["billed", "guest"]),
  notes: z.string().max(300).optional()
});

export const HistoricalYearSchema = z.object({
  // 1959 is the first Newport Folk Festival.
  year: z.number().int().min(1959).max(2025),
  cancelled: z.boolean().default(false),
  note: z.string().max(300).optional(),
  sourceUrl: z.string().url().optional(),
  appearances: z.array(HistoricalAppearanceSchema).default([])
});

export const AssistantRequestSchema = z.object({
  mode: z.enum(["recommend", "chat", "build-plan", "resolve-conflicts"]),
  query: z.string().max(800).optional(),
  selected: z
    .array(
      z.object({
        setId: z.string().min(1).max(120),
        priority: PrioritySchema
      })
    )
    .max(80),
  preferences: z
    .object({
      discovery: z.boolean().optional(),
      energy: z.array(z.string().max(40)).max(8).optional(),
      genres: z.array(z.string().max(40)).max(8).optional(),
      avoidConflicts: z.boolean().optional(),
      preferredStageId: z.string().max(80).optional(),
      availableWindow: z
        .object({
          start: z.string().datetime({ offset: true }),
          end: z.string().datetime({ offset: true })
        })
        .optional()
    })
    .default({}),
  scheduleVersion: z.string().min(1)
});

export const RecommendationResponseSchema = z.object({
  summary: z.string().max(500),
  recommendations: z
    .array(
      z.object({
        artistId: z.string(),
        setId: z.string(),
        score: z.number().min(0).max(100),
        reason: z.string().max(260),
        tradeoff: z.string().max(200).optional(),
        conflictType: z.enum(["none", "transition", "overlap"])
      })
    )
    .max(5),
  warnings: z.array(z.string().max(240)).max(5)
});

export type FestivalDate = z.infer<typeof FestivalDateSchema>;
export type Priority = z.infer<typeof PrioritySchema>;
export type ScheduleItem = z.infer<typeof ScheduleItemSchema>;
export type Artist = z.infer<typeof ArtistSchema>;
export type Stage = z.infer<typeof StageSchema>;
export type Policy = z.infer<typeof PolicySchema>;
export type Manifest = z.infer<typeof ManifestSchema>;
export type SurpriseEvidenceType = z.infer<typeof SurpriseEvidenceTypeSchema>;
export type SurpriseEvidence = z.infer<typeof SurpriseEvidenceSchema>;
export type SurpriseGuest = z.infer<typeof SurpriseGuestSchema>;
export type HistoricalAppearance = z.infer<typeof HistoricalAppearanceSchema>;
export type HistoricalYear = z.infer<typeof HistoricalYearSchema>;
export type AssistantRequest = z.infer<typeof AssistantRequestSchema>;
export type RecommendationResponse = z.infer<typeof RecommendationResponseSchema>;
export type SelectionMap = Record<string, Priority>;
