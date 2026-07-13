import type { FestivalDate, ScheduleItem } from "@/lib/schemas";

export const FESTIVAL_DAYS: Array<{ date: FestivalDate; label: string; long: string }> = [
  { date: "2026-07-24", label: "Fri", long: "Friday, July 24" },
  { date: "2026-07-25", label: "Sat", long: "Saturday, July 25" },
  { date: "2026-07-26", label: "Sun", long: "Sunday, July 26" }
];

export function compareSets(a: ScheduleItem, b: ScheduleItem) {
  return (
    new Date(a.start).getTime() - new Date(b.start).getTime() ||
    a.stageId.localeCompare(b.stageId) ||
    a.id.localeCompare(b.id)
  );
}

export function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York"
  }).format(new Date(iso));
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York"
  }).format(new Date(iso));
}

export function durationMinutes(start: string, end: string) {
  return Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000));
}

export function minutesBetween(aEnd: string, bStart: string) {
  return Math.round((new Date(bStart).getTime() - new Date(aEnd).getTime()) / 60000);
}

export function getNowForFestivalTimezone() {
  return new Date();
}

export function isSetEnded(item: ScheduleItem, now = getNowForFestivalTimezone()) {
  return new Date(item.end).getTime() < now.getTime();
}

export function getCountdownLabel(targetIso: string, now = getNowForFestivalTimezone()) {
  const minutes = Math.round((new Date(targetIso).getTime() - now.getTime()) / 60000);
  if (minutes < 0) return "now";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}
