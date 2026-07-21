import { artistsById, manifest, scheduleItems, stagesById } from "@/lib/data";

/**
 * Canonical site origin. Vercel/preview deploys can override with
 * NEXT_PUBLIC_SITE_URL; production canonicalises to the www host so the apex
 * and www variants don't compete as duplicate content.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.newportfolkschedule.com"
).replace(/\/+$/, "");

export const SITE_NAME = "Folk Planner 2026";

export const SITE_TITLE = "Newport Folk Festival 2026 Schedule & Set Times";

export const SITE_DESCRIPTION =
  "Every set time for Newport Folk Festival 2026 (July 24–26, Fort Adams). Build a personal itinerary, spot set conflicts, and export it. Unofficial fan-made planner.";

const VENUE_ADDRESS = {
  "@type": "PostalAddress",
  streetAddress: "90 Fort Adams Dr",
  addressLocality: "Newport",
  addressRegion: "RI",
  postalCode: "02840",
  addressCountry: "US"
} as const;

const EVENT_STATUS = "https://schema.org/EventScheduled";
const ATTENDANCE_MODE = "https://schema.org/OfflineEventAttendanceMode";

function festivalWindow() {
  const starts = scheduleItems.map((item) => item.start).sort();
  const ends = scheduleItems.map((item) => item.end).sort();
  return { start: starts[0], end: ends[ends.length - 1] };
}

/**
 * schema.org MusicFestival with one MusicEvent per set, so search engines can
 * surface individual performances. Deliberately omits `offers` and `organizer`
 * — this is an unofficial fan listing and must not imply ticketing authority.
 */
export function buildFestivalJsonLd() {
  const { start, end } = festivalWindow();

  const subEvents = scheduleItems.map((item) => {
    const artist = artistsById[item.artistId];
    const stage = stagesById[item.stageId];
    const name = item.titleOverride ?? artist?.name ?? item.artistId;
    return {
      "@type": "MusicEvent",
      name,
      startDate: item.start,
      endDate: item.end,
      eventStatus: EVENT_STATUS,
      eventAttendanceMode: ATTENDANCE_MODE,
      performer: { "@type": "MusicGroup", name: artist?.name ?? name },
      location: {
        "@type": "MusicVenue",
        name: stage ? `${stage.name}, Fort Adams State Park` : "Fort Adams State Park",
        address: VENUE_ADDRESS
      },
      url: item.officialSourceUrl
    };
  });

  return {
    "@context": "https://schema.org",
    "@type": "MusicFestival",
    name: "Newport Folk Festival 2026",
    alternateName: "Newport Folk 2026",
    description:
      "Newport Folk Festival 2026 runs July 24–26 at Fort Adams State Park in Newport, Rhode Island, across the Fort, Quad, Harbor, Foundation, and Bike stages.",
    startDate: start,
    endDate: end,
    eventStatus: EVENT_STATUS,
    eventAttendanceMode: ATTENDANCE_MODE,
    location: {
      "@type": "MusicVenue",
      name: "Fort Adams State Park",
      address: VENUE_ADDRESS
    },
    url: manifest.officialScheduleUrl,
    subEvent: subEvents
  };
}

/** Describes the planner itself, separate from the festival it lists. */
export function buildSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: "Newport Folk Schedule",
    url: `${SITE_URL}/`,
    description: SITE_DESCRIPTION,
    inLanguage: "en-US",
    isAccessibleForFree: true,
    about: { "@type": "MusicFestival", name: "Newport Folk Festival 2026" }
  };
}
