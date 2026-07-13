import { getSetTitle } from "@/lib/data";
import type { Artist, Manifest, ScheduleItem, SelectionMap, Stage } from "@/lib/schemas";

type IcsContext = {
  artistsById: Record<string, Artist>;
  stagesById: Record<string, Stage>;
  manifest: Manifest;
  includeAlarm?: boolean;
};

function escapeIcs(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function foldLine(line: string) {
  const chunks: string[] = [];
  let remaining = line;
  while (remaining.length > 75) {
    chunks.push(remaining.slice(0, 75));
    remaining = ` ${remaining.slice(75)}`;
  }
  chunks.push(remaining);
  return chunks.join("\r\n");
}

function localIcsDate(iso: string) {
  return iso.slice(0, 19).replace(/[-:]/g, "");
}

function nowStamp() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function generateIcs(
  schedule: ScheduleItem[],
  selections: SelectionMap,
  context: IcsContext
) {
  const selected = schedule
    .filter((item) => selections[item.id])
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Unofficial Newport Folk Planner//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Newport Folk Personal Plan"
  ];

  for (const item of selected) {
    const artist = context.artistsById[item.artistId];
    const stage = context.stagesById[item.stageId];
    const title = getSetTitle(item);
    const description = [
      artist?.shortBio,
      `Priority: ${selections[item.id] === "must" ? "Must See" : "Interested"}`,
      `Schedule version: ${context.manifest.scheduleVersion}`,
      "Calendar imports are a snapshot. Confirm critical details with Newport Folk.",
      context.manifest.officialScheduleUrl
    ]
      .filter(Boolean)
      .join("\\n");

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${item.id}@newport-folk-planner.local`);
    lines.push(`DTSTAMP:${nowStamp()}`);
    lines.push(`DTSTART;TZID=America/New_York:${localIcsDate(item.start)}`);
    lines.push(`DTEND;TZID=America/New_York:${localIcsDate(item.end)}`);
    lines.push(foldLine(`SUMMARY:${escapeIcs(title)}`));
    lines.push(foldLine(`LOCATION:${escapeIcs(`${stage?.name ?? item.stageId}, Fort Adams State Park, Newport, RI`)}`));
    lines.push(foldLine(`DESCRIPTION:${escapeIcs(description)}`));
    lines.push(`URL:${context.manifest.officialScheduleUrl}`);
    if (context.includeAlarm) {
      lines.push("BEGIN:VALARM");
      lines.push("TRIGGER:-PT10M");
      lines.push("ACTION:DISPLAY");
      lines.push(foldLine(`DESCRIPTION:${escapeIcs(`Newport Folk: ${title} starts in 10 minutes`)}`));
      lines.push("END:VALARM");
    }
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}

