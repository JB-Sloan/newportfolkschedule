import { z } from "zod";
import type { Priority, SelectionMap } from "@/lib/schemas";

const SharePrioritySchema = z.enum(["m", "i"]);

const SharePayloadSchema = z.object({
  v: z.string().min(1).max(80),
  s: z
    .array(z.tuple([z.string().min(1).max(120), SharePrioritySchema]))
    .max(80),
  b: z.number().int().min(0).max(15)
});

export type SharePayload = z.infer<typeof SharePayloadSchema>;

function priorityToShort(priority: Priority): "m" | "i" {
  return priority === "must" ? "m" : "i";
}

function priorityFromShort(priority: "m" | "i"): Priority {
  return priority === "m" ? "must" : "interested";
}

function encodeBase64Url(value: string) {
  if (typeof window === "undefined") {
    return Buffer.from(value, "utf8").toString("base64url");
  }
  return btoa(unescape(encodeURIComponent(value)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeBase64Url(value: string) {
  if (typeof window === "undefined") {
    return Buffer.from(value, "base64url").toString("utf8");
  }
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return decodeURIComponent(escape(atob(padded)));
}

export function encodeSharePlan({
  version,
  selections,
  transitionBufferMinutes
}: {
  version: string;
  selections: SelectionMap;
  transitionBufferMinutes: number;
}) {
  const payload: SharePayload = {
    v: version,
    s: Object.entries(selections).map(([id, priority]) => [id, priorityToShort(priority)]),
    b: transitionBufferMinutes
  };

  return encodeBase64Url(JSON.stringify(payload));
}

export function decodeSharePlan(encoded: string) {
  const raw = decodeBase64Url(encoded);
  const parsed = SharePayloadSchema.parse(JSON.parse(raw));
  const selections: SelectionMap = Object.fromEntries(
    parsed.s.map(([id, priority]) => [id, priorityFromShort(priority)])
  );

  return {
    version: parsed.v,
    selections,
    transitionBufferMinutes: parsed.b
  };
}
