import assert from "node:assert/strict";
import { findConflicts } from "@/lib/conflicts";
import { generateIcs } from "@/lib/ics";
import { decodeSharePlan, encodeSharePlan } from "@/lib/share-plan";
import { buildSocialPost } from "@/lib/social-post";
import { artistsById, manifest, scheduleItems, stagesById } from "@/lib/data";
import type { ScheduleItem, SelectionMap, Stage } from "@/lib/schemas";

const stages: Stage[] = [
  {
    id: "a",
    name: "A",
    shortName: "A",
    description: "A",
    seating: { summary: "Unknown", status: "unknown" },
    shade: { summary: "Unknown", status: "unknown" },
    blankets: { summary: "Unknown", status: "unknown" },
    chairs: { summary: "Unknown", status: "unknown" },
    surface: { summary: "Unknown", status: "unknown" },
    accessibility: { summary: "Unknown", status: "unknown" },
    amenities: [],
    transitions: { b: 10 },
    sources: []
  },
  {
    id: "b",
    name: "B",
    shortName: "B",
    description: "B",
    seating: { summary: "Unknown", status: "unknown" },
    shade: { summary: "Unknown", status: "unknown" },
    blankets: { summary: "Unknown", status: "unknown" },
    chairs: { summary: "Unknown", status: "unknown" },
    surface: { summary: "Unknown", status: "unknown" },
    accessibility: { summary: "Unknown", status: "unknown" },
    amenities: [],
    transitions: { a: 10 },
    sources: []
  }
];

function item(
  id: string,
  stageId: string,
  start: string,
  end: string,
  artistId = id,
  date: ScheduleItem["date"] = "2026-07-24"
): ScheduleItem {
  return {
    id,
    artistId,
    stageId,
    date,
    start,
    end,
    kind: "artist",
    status: "scheduled",
    officialSourceUrl: "https://newportfolk.org/schedule"
  };
}

function testConflicts() {
  const overlapping = [
    item("2026-07-24-alpha", "a", "2026-07-24T12:00:00-04:00", "2026-07-24T13:00:00-04:00"),
    item("2026-07-24-beta", "b", "2026-07-24T12:30:00-04:00", "2026-07-24T13:30:00-04:00")
  ];
  const overlappingSelections: SelectionMap = {
    "2026-07-24-alpha": "must",
    "2026-07-24-beta": "interested"
  };
  const overlap = findConflicts(overlapping, overlappingSelections, 10, stages);
  assert.equal(overlap[0].type, "overlap");
  assert.equal(overlap[0].overlapMinutes, 30);

  const sameStage = [
    item("2026-07-24-alpha", "a", "2026-07-24T12:00:00-04:00", "2026-07-24T13:00:00-04:00"),
    item("2026-07-24-beta", "a", "2026-07-24T13:00:00-04:00", "2026-07-24T14:00:00-04:00")
  ];
  assert.equal(findConflicts(sameStage, overlappingSelections, 10, stages).length, 0);

  const tight = [
    item("2026-07-24-alpha", "a", "2026-07-24T12:00:00-04:00", "2026-07-24T13:00:00-04:00"),
    item("2026-07-24-beta", "b", "2026-07-24T13:05:00-04:00", "2026-07-24T14:00:00-04:00")
  ];
  const transition = findConflicts(tight, overlappingSelections, 10, stages);
  assert.equal(transition[0].type, "transition");
  assert.equal(transition[0].availableTransitionMinutes, 5);
}

function testSharePlan() {
  const encoded = encodeSharePlan({
    version: "2026.official.1",
    transitionBufferMinutes: 10,
    selections: {
      "2026-07-24-alpha": "must",
      "2026-07-24-beta": "interested"
    }
  });

  assert.deepEqual(decodeSharePlan(encoded), {
    version: "2026.official.1",
    transitionBufferMinutes: 10,
    selections: {
      "2026-07-24-alpha": "must",
      "2026-07-24-beta": "interested"
    }
  });
}

function testSocialPost() {
  const socialArtists = {
    "brother-wallace": { name: "Brother Wallace" },
    "courtney-marie-andrews": { name: "Courtney Marie Andrews" },
    "tiny-habits": { name: "Tiny Habits" }
  };
  const picks = [
    item("2026-07-24-courtney-marie-andrews", "b", "2026-07-24T12:05:00-04:00", "2026-07-24T12:50:00-04:00", "courtney-marie-andrews"),
    item("2026-07-24-brother-wallace", "a", "2026-07-24T11:05:00-04:00", "2026-07-24T11:50:00-04:00", "brother-wallace"),
    item("2026-07-24-tiny-habits", "a", "2026-07-24T12:30:00-04:00", "2026-07-24T13:20:00-04:00", "tiny-habits")
  ];

  const post = buildSocialPost(picks, socialArtists);
  assert.equal(
    post,
    "My Newport Folk 2026 schedule:\nFri: Brother Wallace -> Courtney Marie Andrews -> Tiny Habits\n#NewportFolk"
  );
  assert.doesNotMatch(post, /\+\d+ more/);
}

function testIcs() {
  const selected = { [scheduleItems[0].id]: "must" as const };
  const ics = generateIcs(scheduleItems, selected, {
    artistsById,
    stagesById,
    manifest,
    includeAlarm: true
  });

  assert.match(ics, new RegExp(`UID:${scheduleItems[0].id}@newport-folk-planner.local`));
  assert.match(ics, /DTSTART;TZID=America\/New_York:/);
  assert.match(ics, /BEGIN:VALARM/);
  const unfolded = ics.replaceAll("\r\n ", "");
  assert.match(unfolded, /Calendar imports are a snapshot/);
}

testConflicts();
testSharePlan();
testSocialPost();
testIcs();

console.log("Unit smoke tests passed.");
