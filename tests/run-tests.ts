import assert from "node:assert/strict";
import { findConflicts } from "@/lib/conflicts";
import { generateIcs } from "@/lib/ics";
import { decodeSharePlan, encodeSharePlan } from "@/lib/share-plan";
import { buildSocialPost } from "@/lib/social-post";
import {
  cleanBillingName,
  normalizeArtistName,
  pickBestArtistMatch,
  tracksPerResolvedArtist,
  type ArtistMap
} from "@/lib/spotify";
import { buildPlaylistInOwnerAccount } from "@/lib/spotify-server";
import {
  categoryStrength,
  connectedArtists,
  deriveHistoricalBaseRate,
  likelihoodLabel,
  rankSuspects,
  scoreSuspect
} from "@/lib/surprise";
import {
  buildHistoryRecords,
  getArtistHistory,
  matchHistoricalArtist,
  normalizeHistoryName,
  summarizeHistory
} from "@/lib/history";
import type { SurpriseEvidence } from "@/lib/schemas";
import { artists, artistsById, historicalYears, historySummaries, manifest, scheduleItems, stagesById } from "@/lib/data";
import type { Artist, HistoricalYear, ScheduleItem, SelectionMap, Stage } from "@/lib/schemas";

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

function testSpotifyResolution() {
  assert.equal(normalizeArtistName("Ms. Lauryn Hill"), "lauryn hill");
  assert.equal(normalizeArtistName("Tim Bernardes"), "tim bernardes");
  assert.equal(normalizeArtistName("Haley Heynderickx & Max García Conover"), "haley heynderickx max garcia conover");

  assert.equal(
    cleanBillingName("Michael Shannon & Jason Narducy and Friends Play R.E.M."),
    "Michael Shannon & Jason Narducy"
  );
  assert.equal(cleanBillingName("Dawes (acoustic)"), "Dawes");
  assert.equal(cleanBillingName("Madi Diaz feat. Someone"), "Madi Diaz");

  const results = [
    { id: "1", name: "Wednesday Campanella", popularity: 70 },
    { id: "2", name: "Wednesday", popularity: 60 }
  ];
  assert.equal(pickBestArtistMatch(results, "Wednesday")?.id, "2");
  assert.equal(pickBestArtistMatch([], "Wednesday"), undefined);
  assert.equal(pickBestArtistMatch(results, "The Wednesday Band")?.id, "2");

  assert.equal(tracksPerResolvedArtist(1), 10);
  assert.equal(tracksPerResolvedArtist(2), 5);
  assert.equal(tracksPerResolvedArtist(4), 3);
}

async function testServerPlaylistBuilder() {
  const artistMap: ArtistMap = {
    "brandon-flowers": {
      displayName: "Brandon Flowers",
      resolve: [{ name: "The Killers" }],
      skip: false
    },
    "jordan-klepper": {
      displayName: "Jordan Klepper",
      resolve: [],
      skip: true,
      note: "comedian"
    }
  };

  const calls: string[] = [];
  const json = (body: unknown) =>
    new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });

  const fetchImpl: typeof fetch = async (input, init) => {
    const url = String(input);
    calls.push(`${init?.method ?? "GET"} ${url}`);
    if (url.includes("accounts.spotify.com/api/token")) {
      return json({ access_token: "owner-token", expires_in: 3600 });
    }
    if (url.includes("/search")) {
      const params = new URL(url).searchParams;
      const query = decodeURIComponent(params.get("q") ?? "");
      if (params.get("type") === "track") {
        // Mirrors production behavior: 5 items per page regardless of limit.
        const artistName = query.match(/artist:"(.+)"/)?.[1] ?? query;
        const artistId = `id-${artistName.toLowerCase().replace(/[^a-z]/g, "")}`;
        const offset = Number(params.get("offset") ?? 0);
        const pageIndexes = [0, 1, 2, 3, 4].map((i) => offset + i).filter((i) => i < 12);
        return json({
          tracks: {
            items: pageIndexes.map((index) => ({
              uri: `spotify:track:${artistId}-${index}`,
              name: `Track ${index}`,
              popularity: 100 - index,
              artists: [{ id: artistId, name: artistName }]
            }))
          }
        });
      }
      return json({
        artists: { items: [{ id: `id-${query.toLowerCase().replace(/[^a-z]/g, "")}`, name: query, popularity: 80 }] }
      });
    }
    if (url.endsWith("/me/playlists")) {
      return json({ id: "pl1", external_urls: { spotify: "https://open.spotify.com/playlist/pl1" } });
    }
    if (url.includes("/playlists/pl1/items")) return json({ snapshot_id: "snap" });
    throw new Error(`Unexpected request: ${url}`);
  };

  const result = await buildPlaylistInOwnerAccount({
    config: { clientId: "cid", clientSecret: "secret", refreshToken: "refresh" },
    artists: [
      { id: "brandon-flowers", name: "Brandon Flowers" },
      { id: "jordan-klepper", name: "Jordan Klepper" },
      { id: "lucy-dacus", name: "Lucy Dacus" }
    ],
    artistMap,
    playlistName: "Test Playlist",
    fetchImpl
  });

  assert.equal(result.playlistUrl, "https://open.spotify.com/playlist/pl1");
  assert.equal(result.totalTracks, 20);
  assert.equal(result.statuses[0].state, "resolved");
  assert.deepEqual(result.statuses[0].resolvedNames, ["The Killers"]);
  assert.equal(result.statuses[1].state, "skipped");
  assert.equal(result.statuses[2].state, "resolved");
  assert.equal(result.statuses[2].trackCount, 10);
  assert.ok(calls.some((call) => call === "POST https://api.spotify.com/v1/me/playlists"));
  assert.ok(calls.some((call) => call.startsWith("POST https://api.spotify.com/v1/playlists/pl1/items")));
  assert.ok(!calls.some((call) => call.includes("top-tracks")), "must not call removed top-tracks endpoint");
}

function ev(type: SurpriseEvidence["type"], weight: number, artistId?: string): SurpriseEvidence {
  return { type, weight, artistId, detail: "x", sources: ["https://example.com"] };
}

function testSurpriseScoring() {
  const historicalPrior = deriveHistoricalBaseRate(historicalYears, 34);
  assert.ok(historicalPrior > 0.08 && historicalPrior < 0.1, `history-derived prior is ~9% (got ${historicalPrior})`);

  // Same-category clues corroborate modestly instead of behaving as independent events.
  assert.equal(categoryStrength([ev("collaboration", 50)], "collaboration"), 0.5);
  const two = categoryStrength([ev("collaboration", 50), ev("collaboration", 50)], "collaboration");
  assert.equal(two, 0.55, "a second 50 clue closes only 20% of the remaining weighted gap");
  assert.equal(categoryStrength([ev("collaboration", 50)], "shared-band"), 0);

  // A relationship without current availability remains close to the historical prior.
  const lone = scoreSuspect({ evidence: [ev("shared-band", 95, "lucy-dacus")] });
  assert.ok(lone.percent >= 7 && lone.percent <= 12, `unrouted band tie stays conservative (got ${lone.percent})`);
  assert.equal(lone.availabilityKnown, false);

  // Distinct categories corroborate, but do not create an implausible 70% rumor.
  const corroborated = scoreSuspect({
    evidence: [
      ev("shared-band", 95, "lucy-dacus"),
      ev("past-newport", 70),
      ev("collaboration", 60, "lucy-dacus")
    ]
  });
  assert.ok(corroborated.percent > lone.percent, "corroboration raises the score");
  assert.ok(corroborated.percent < 25, "relationships without availability stay capped naturally");

  const routed = scoreSuspect({
    evidence: [
      ev("collaboration", 80, "nathaniel-rateliff"),
      ev("tour-routing", 80),
      ev("public-hint", 70)
    ]
  });
  assert.ok(routed.percent >= 30, "routing, a named vehicle, and a current hint materially raise odds");
  assert.equal(routed.availabilityKnown, true);
  assert.ok(
    routed.categories.some((category) => category.type === "appearance-vehicle" && category.inferred),
    "named & Friends sets create an inferred appearance vehicle"
  );

  const difficultRoute = scoreSuspect({
    evidence: [
      ev("shared-band", 95, "lucy-dacus"),
      ev("past-newport", 70),
      ev("collaboration", 60, "lucy-dacus"),
      ev("schedule-friction", 70)
    ]
  });
  assert.ok(difficultRoute.percent < corroborated.percent, "schedule friction lowers the score");
  assert.ok(difficultRoute.percent > 0, "schedule friction is a penalty, not a hard exclusion");

  const ruledOut = scoreSuspect({
    status: "debunked",
    evidence: [ev("shared-band", 100, "lucy-dacus")]
  });
  assert.equal(ruledOut.percent, 0, "a verified hard conflict overrides positive evidence");
  assert.equal(ruledOut.label, "Ruled out");

  // Labels and ranking.
  assert.equal(likelihoodLabel(65), "Prime suspect");
  assert.equal(likelihoodLabel(40), "Strong lead");
  assert.equal(likelihoodLabel(5), "Cold trail");

  // connectedArtists dedupes to the strongest edge per artist.
  const connections = connectedArtists({
    evidence: [ev("collaboration", 40, "brandi-carlile"), ev("shared-band", 90, "brandi-carlile")]
  });
  assert.equal(connections.length, 1);
  assert.equal(connections[0].type, "shared-band");

  const ranked = rankSuspects([
    { evidence: [ev("public-hint", 20)] },
    { evidence: [ev("shared-band", 95, "lucy-dacus")] },
    { status: "debunked" as const, evidence: [ev("shared-band", 100, "lucy-dacus")] }
  ]);
  assert.ok(ranked[0].score.percent >= ranked[1].score.percent, "ranked descending by score");
  assert.equal(ranked[2].score.percent, 0, "ruled-out suspects rank last");
}

function testHistory() {
  assert.equal(normalizeHistoryName("The Night Sweats"), "night sweats");
  assert.equal(normalizeHistoryName("Nathaniel Rateliff and the Night Sweats"), "nathaniel rateliff and the night sweats");
  assert.equal(normalizeHistoryName("Gillian Welch & David Rawlings"), "gillian welch and david rawlings");

  const roster: Artist[] = [
    { ...artists[0], id: "nathaniel-rateliff", name: "Nathaniel Rateliff" },
    { ...artists[0], id: "father-john-misty", name: "Father John Misty" }
  ];

  assert.equal(
    matchHistoricalArtist("Nathaniel Rateliff and the Night Sweats", roster)?.artistId,
    "nathaniel-rateliff"
  );
  assert.equal(matchHistoricalArtist("Father John Misty", roster)?.artistId, "father-john-misty");
  assert.equal(matchHistoricalArtist("The National", roster), undefined);

  const years: HistoricalYear[] = [
    { year: 2016, cancelled: false, appearances: [{ name: "Father John Misty", role: "billed" }] },
    {
      year: 2021,
      cancelled: false,
      appearances: [
        { name: "Nathaniel Rateliff and the Night Sweats", role: "billed" },
        { name: "Father John Misty", role: "guest", notes: "sat in" }
      ]
    },
    { year: 2020, cancelled: true, appearances: [] }
  ];
  const records = buildHistoryRecords(years, roster);
  assert.equal(records.length, 3, "cancelled year contributes no records");

  const summaries = summarizeHistory(records);
  const misty = getArtistHistory("father-john-misty", summaries);
  assert.ok(misty);
  assert.equal(misty!.totalAppearances, 2);
  assert.equal(misty!.billedCount, 1);
  assert.equal(misty!.guestCount, 1);
  assert.deepEqual(misty!.years, [2016, 2021]);

  const rateliff = getArtistHistory("nathaniel-rateliff", summaries);
  assert.equal(rateliff!.name, "Nathaniel Rateliff", "matched summaries display the 2026 canonical name");

  // Real dataset sanity checks.
  assert.ok(historicalYears.some((year) => year.year === 2020 && year.cancelled));
  assert.ok(historySummaries.length > 100, "history covers many distinct acts");
  const realMisty = getArtistHistory("father-john-misty", historySummaries);
  assert.ok(realMisty, "Father John Misty should be linked from 2016 history to the 2026 roster");
  assert.ok(realMisty!.years.includes(2016));
}

testConflicts();
testSharePlan();
testSocialPost();
testIcs();
testSpotifyResolution();
testSurpriseScoring();
testHistory();
testServerPlaylistBuilder()
  .then(() => console.log("Unit smoke tests passed."))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
