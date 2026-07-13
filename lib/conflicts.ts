import type { Priority, ScheduleItem, SelectionMap, Stage } from "@/lib/schemas";
import { compareSets, minutesBetween } from "@/lib/time";

export type ConflictType = "overlap" | "transition";

export type Conflict = {
  id: string;
  type: ConflictType;
  setIds: string[];
  overlapMinutes?: number;
  availableTransitionMinutes?: number;
  requiredTransitionMinutes?: number;
};

export type ConflictCluster = {
  id: string;
  type: ConflictType;
  setIds: string[];
  conflicts: Conflict[];
};

export function getSelectedItems(schedule: ScheduleItem[], selections: SelectionMap) {
  return schedule
    .filter((item) => selections[item.id])
    .sort(compareSets);
}

function rangesOverlap(a: ScheduleItem, b: ScheduleItem) {
  return new Date(a.start).getTime() < new Date(b.end).getTime() &&
    new Date(b.start).getTime() < new Date(a.end).getTime();
}

function overlapMinutes(a: ScheduleItem, b: ScheduleItem) {
  const start = Math.max(new Date(a.start).getTime(), new Date(b.start).getTime());
  const end = Math.min(new Date(a.end).getTime(), new Date(b.end).getTime());
  return Math.max(0, Math.round((end - start) / 60000));
}

function getTransitionMinutes(a: ScheduleItem, b: ScheduleItem, stages: Stage[]) {
  const from = stages.find((stage) => stage.id === a.stageId);
  return from?.transitions[b.stageId];
}

export function findConflicts(
  schedule: ScheduleItem[],
  selections: SelectionMap,
  transitionBufferMinutes: number,
  stages: Stage[] = []
): Conflict[] {
  const selected = getSelectedItems(schedule, selections);
  const conflicts: Conflict[] = [];

  for (let i = 0; i < selected.length; i += 1) {
    for (let j = i + 1; j < selected.length; j += 1) {
      const a = selected[i];
      const b = selected[j];
      if (a.date !== b.date) continue;

      if (rangesOverlap(a, b)) {
        conflicts.push({
          id: `overlap:${a.id}:${b.id}`,
          type: "overlap",
          setIds: [a.id, b.id],
          overlapMinutes: overlapMinutes(a, b)
        });
        continue;
      }

      if (a.stageId === b.stageId || transitionBufferMinutes === 0) continue;

      const gap = minutesBetween(a.end, b.start);
      if (gap < 0) continue;

      const required =
        getTransitionMinutes(a, b, stages) ?? transitionBufferMinutes;

      if (gap < Math.max(required, transitionBufferMinutes)) {
        conflicts.push({
          id: `transition:${a.id}:${b.id}`,
          type: "transition",
          setIds: [a.id, b.id],
          availableTransitionMinutes: gap,
          requiredTransitionMinutes: Math.max(required, transitionBufferMinutes)
        });
      }
    }
  }

  return conflicts;
}

export function clusterConflicts(conflicts: Conflict[]): ConflictCluster[] {
  const clusters: ConflictCluster[] = [];

  for (const conflict of conflicts) {
    const touching = clusters.filter((cluster) =>
      cluster.setIds.some((setId) => conflict.setIds.includes(setId))
    );

    if (touching.length === 0) {
      clusters.push({
        id: conflict.id,
        type: conflict.type,
        setIds: [...conflict.setIds],
        conflicts: [conflict]
      });
      continue;
    }

    const merged: ConflictCluster = {
      id: touching[0].id,
      type: touching.some((cluster) => cluster.type === "overlap") || conflict.type === "overlap"
        ? "overlap"
        : "transition",
      setIds: Array.from(
        new Set([
          ...touching.flatMap((cluster) => cluster.setIds),
          ...conflict.setIds
        ])
      ),
      conflicts: [...touching.flatMap((cluster) => cluster.conflicts), conflict]
    };

    for (const cluster of touching) {
      const index = clusters.indexOf(cluster);
      if (index >= 0) clusters.splice(index, 1);
    }
    clusters.push(merged);
  }

  return clusters;
}

export function getConflictTypeForSet(setId: string, conflicts: Conflict[]): ConflictType | "none" {
  const matching = conflicts.filter((conflict) => conflict.setIds.includes(setId));
  if (matching.some((conflict) => conflict.type === "overlap")) return "overlap";
  if (matching.some((conflict) => conflict.type === "transition")) return "transition";
  return "none";
}

export function describeConflict(conflict: Conflict) {
  if (conflict.type === "overlap") {
    return `Overlaps by ${conflict.overlapMinutes ?? 0} min`;
  }
  return `${conflict.availableTransitionMinutes ?? 0} min to move; ${conflict.requiredTransitionMinutes ?? 0} min recommended`;
}

export function priorityLabel(priority?: Priority) {
  if (priority === "must") return "Must See";
  if (priority === "interested") return "Interested";
  return "Not selected";
}
