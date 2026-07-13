import { NextResponse } from "next/server";
import {
  artists,
  artistsById,
  manifest,
  scheduleById,
  scheduleItems,
  stages,
  stagesById
} from "@/lib/data";
import {
  AssistantRequestSchema,
  RecommendationResponseSchema,
  type RecommendationResponse,
  type SelectionMap
} from "@/lib/schemas";
import { getDeterministicRecommendations } from "@/lib/recommendations";
import { findConflicts, getConflictTypeForSet } from "@/lib/conflicts";
import { formatTime } from "@/lib/time";

export const dynamic = "force-dynamic";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function selectionMapFromRequest(selected: Array<{ setId: string; priority: "must" | "interested" }>) {
  const selections: SelectionMap = {};
  for (const item of selected) {
    if (scheduleById[item.setId]) selections[item.setId] = item.priority;
  }
  return selections;
}

function fallbackResponse(selections: SelectionMap, preferredStageId?: string): RecommendationResponse {
  return getDeterministicRecommendations({
    schedule: scheduleItems,
    artists,
    stages,
    selections,
    transitionBufferMinutes: 10,
    preferredStageId
  });
}

function recommendationJsonSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["summary", "recommendations", "warnings"],
    properties: {
      summary: { type: "string", maxLength: 500 },
      recommendations: {
        type: "array",
        maxItems: 5,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["artistId", "setId", "score", "reason", "conflictType"],
          properties: {
            artistId: { type: "string" },
            setId: { type: "string" },
            score: { type: "number", minimum: 0, maximum: 100 },
            reason: { type: "string", maxLength: 260 },
            tradeoff: { type: "string", maxLength: 200 },
            conflictType: { enum: ["none", "transition", "overlap"] }
          }
        }
      },
      warnings: {
        type: "array",
        maxItems: 5,
        items: { type: "string", maxLength: 240 }
      }
    }
  };
}

function buildContext(selections: SelectionMap, query?: string) {
  const selected = Object.entries(selections)
    .map(([setId, priority]) => {
      const item = scheduleById[setId];
      const artist = item ? artistsById[item.artistId] : undefined;
      const stage = item ? stagesById[item.stageId] : undefined;
      if (!item || !artist || !stage) return undefined;
      return {
        setId,
        priority,
        artistId: artist.id,
        name: artist.name,
        stage: stage.name,
        time: `${formatTime(item.start)}-${formatTime(item.end)}`,
        genres: artist.genres,
        tags: artist.tags,
        moods: artist.moods,
        bio: artist.shortBio
      };
    })
    .filter(Boolean);

  const candidates = scheduleItems
    .filter((item) => !selections[item.id])
    .map((item) => {
      const artist = artistsById[item.artistId];
      const stage = stagesById[item.stageId];
      return {
        setId: item.id,
        artistId: artist.id,
        name: artist.name,
        stage: stage.name,
        date: item.date,
        time: `${formatTime(item.start)}-${formatTime(item.end)}`,
        genres: artist.genres,
        tags: artist.tags,
        moods: artist.moods,
        bio: artist.shortBio
      };
    });

  return {
    app: "Unofficial Newport Folk planner",
    scheduleVersion: manifest.scheduleVersion,
    officialScheduleUrl: manifest.officialScheduleUrl,
    userQuery: query ?? "",
    selected,
    candidates,
    rules: [
      "Use only supplied candidate setIds and artistIds.",
      "Never invent artists, stages, times, policies, or schedule changes.",
      "Treat Must See selections as hard constraints unless the user asks otherwise.",
      "Explain fit using supplied genres, tags, moods, and bios."
    ]
  };
}

function normalizeModelResponse(
  response: RecommendationResponse,
  selections: SelectionMap,
  transitionBufferMinutes: number
): RecommendationResponse {
  const normalized = response.recommendations
    .filter((rec) => scheduleById[rec.setId])
    .filter((rec) => scheduleById[rec.setId].artistId === rec.artistId)
    .filter((rec) => !selections[rec.setId])
    .slice(0, 5)
    .map((rec) => {
      const candidateSelections = { ...selections, [rec.setId]: "interested" as const };
      const conflicts = findConflicts(scheduleItems, candidateSelections, transitionBufferMinutes, stages);
      return {
        ...rec,
        score: Math.max(0, Math.min(100, Math.round(rec.score))),
        conflictType: getConflictTypeForSet(rec.setId, conflicts)
      };
    });

  return {
    summary: response.summary,
    recommendations: normalized,
    warnings: response.warnings
  };
}

export async function POST(request: Request) {
  let parsed;
  try {
    parsed = AssistantRequestSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid assistant request." }, { status: 400 });
  }

  const selections = selectionMapFromRequest(parsed.selected);
  const localFallback = fallbackResponse(selections, parsed.preferences.preferredStageId);

  if (parsed.scheduleVersion !== manifest.scheduleVersion) {
    return NextResponse.json({
      ...localFallback,
      warnings: [
        "Your request used a different schedule version. Showing current local recommendations.",
        ...localFallback.warnings
      ].slice(0, 5)
    });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL;

  if (!apiKey || !model) {
    return NextResponse.json({
      ...localFallback,
      warnings: [
        "OpenRouter is not configured, so these are deterministic offline recommendations.",
        ...localFallback.warnings
      ].slice(0, 5)
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const openRouterResponse = await fetch(OPENROUTER_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
        "X-OpenRouter-Title": "Folk Planner 2026"
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are the planning assistant for an unofficial Newport Folk schedule planner. Use only the supplied festival dataset. Never invent an artist, set, time, stage, policy, or schedule change. Recommend only candidate IDs supplied in the context. Return exactly the required JSON schema."
          },
          {
            role: "user",
            content: JSON.stringify(buildContext(selections, parsed.query))
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "festival_recommendations",
            strict: true,
            schema: recommendationJsonSchema()
          }
        },
        temperature: 0.2,
        max_tokens: 900
      })
    });

    if (!openRouterResponse.ok) {
      return NextResponse.json({
        ...localFallback,
        warnings: [`OpenRouter returned ${openRouterResponse.status}; showing offline recommendations.`]
      });
    }

    const payload = await openRouterResponse.json();
    const content = payload?.choices?.[0]?.message?.content;
    const raw = typeof content === "string" ? JSON.parse(content) : content;
    const validated = RecommendationResponseSchema.parse(raw);
    return NextResponse.json(
      normalizeModelResponse(validated, selections, parsed.preferences.avoidConflicts ? 10 : 0)
    );
  } catch {
    return NextResponse.json({
      ...localFallback,
      warnings: ["AI request failed or timed out; showing offline recommendations."]
    });
  } finally {
    clearTimeout(timeout);
  }
}
