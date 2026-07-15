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
        const artistName = query.match(/artist:"(.+)"/)?.[1] ?? query;
        const artistId = `id-${artistName.toLowerCase().replace(/[^a-z]/g, "")}`;
        return json({
          tracks: {
            items: Array.from({ length: 10 }, (_, index) => ({
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

testConflicts();
testSharePlan();
testSocialPost();
testIcs();
testSpotifyResolution();
testServerPlaylistBuilder()
  .then(() => console.log("Unit smoke tests passed."))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
