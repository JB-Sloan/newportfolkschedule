"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { findConflicts, getConflictTypeForSet, priorityLabel } from "@/lib/conflicts";
import { SpotifyPlaylistCard } from "@/components/SpotifyPlaylistCard";
import { SurpriseBoard } from "@/components/SurpriseBoard";
import { WeatherStrip } from "@/components/WeatherStrip";
import { HistoryBoard } from "@/components/HistoryBoard";
import { encodeSharePlan, decodeSharePlan } from "@/lib/share-plan";
import { buildSocialPost } from "@/lib/social-post";
import { generateIcs } from "@/lib/ics";
import { getArtistHistory, type ArtistHistorySummary } from "@/lib/history";
import {
  FESTIVAL_DAYS,
  compareSets,
  durationMinutes,
  formatDateTime,
  formatTime,
  getCountdownLabel,
  isSetEnded
} from "@/lib/time";
import type {
  Artist,
  FestivalDate,
  HistoricalYear,
  Manifest,
  Policy,
  Priority,
  RecommendationResponse,
  ScheduleItem,
  SelectionMap,
  Stage
} from "@/lib/schemas";

type PlannerData = {
  manifest: Manifest;
  scheduleItems: ScheduleItem[];
  artists: Artist[];
  stages: Stage[];
  policies: Policy[];
  historicalYears: HistoricalYear[];
  historySummaries: ArtistHistorySummary[];
};

type PlanState = {
  scheduleVersion: string;
  selections: SelectionMap;
  transitionBufferMinutes: number;
  preferredStageId?: string;
  offlineReadyVersion?: string;
};

type SharedPlan = {
  version: string;
  selections: SelectionMap;
  transitionBufferMinutes: number;
};

const STORAGE_KEY = "newport-folk-planner:v1";
const DEFAULT_TAB = "schedule";

const tabLabels = [
  { id: "schedule", label: "Schedule" },
  { id: "plan", label: "My Plan" },
  { id: "now", label: "Now" },
  { id: "surprise", label: "Rumors" },
  { id: "history", label: "History" }
] as const;

type TabId = (typeof tabLabels)[number]["id"];
type SocialPlatform = "x" | "facebook";

function classNames(...values: Array<string | false | undefined>) {
  return values.filter(Boolean).join(" ");
}

function buildMaps(artists: Artist[], stages: Stage[]) {
  return {
    artistsById: Object.fromEntries(artists.map((artist) => [artist.id, artist])),
    stagesById: Object.fromEntries(stages.map((stage) => [stage.id, stage]))
  };
}

function defaultPlan(manifest: Manifest): PlanState {
  return {
    scheduleVersion: manifest.scheduleVersion,
    selections: {},
    transitionBufferMinutes: 10
  };
}

function loadPlan(manifest: Manifest): PlanState {
  if (typeof window === "undefined") {
    return defaultPlan(manifest);
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error("No saved plan");
    const parsed = JSON.parse(raw) as Partial<PlanState>;
    return {
      scheduleVersion: manifest.scheduleVersion,
      selections: parsed.selections ?? {},
      transitionBufferMinutes: parsed.transitionBufferMinutes ?? 10,
      preferredStageId: parsed.preferredStageId,
      offlineReadyVersion: parsed.offlineReadyVersion
    };
  } catch {
    return defaultPlan(manifest);
  }
}

function savePlan(plan: PlanState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
}

function spotifySearchUrl(artist: Artist) {
  return artist.spotifyUrl ?? `https://open.spotify.com/search/${encodeURIComponent(artist.name)}`;
}

function artistInitials(name: string) {
  return name
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

function ArtistImage({
  artist,
  className,
  rounded = "rounded-xl"
}: {
  artist: Artist;
  className?: string;
  rounded?: string;
}) {
  if (artist.imageUrl) {
    return (
      <span className={classNames("relative block overflow-hidden bg-ink/8", rounded, className)}>
        <Image
          src={artist.imageUrl}
          alt={`${artist.name} press photo`}
          fill
          sizes="(max-width: 640px) 44px, (max-width: 1024px) 64px, 96px"
          className="object-cover"
        />
      </span>
    );
  }
  return (
    <div
      aria-hidden="true"
      className={classNames(
        "flex items-center justify-center bg-ink/8 font-black text-ink/45",
        rounded,
        className
      )}
    >
      {artistInitials(artist.name) || "★"}
    </div>
  );
}

function downloadFile(filename: string, mimeType: string, contents: string) {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function useOnlineStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  return online;
}

export function FolkPlannerApp({
  manifest,
  scheduleItems,
  artists,
  stages,
  policies,
  historicalYears,
  historySummaries
}: PlannerData) {
  const [plan, setPlan] = useState<PlanState>(() => defaultPlan(manifest));
  const [hydrated, setHydrated] = useState(false);
  const [activeDay, setActiveDay] = useState<FestivalDate>("2026-07-24");
  const [activeTab, setActiveTab] = useState<TabId>(DEFAULT_TAB);
  const [stageFilter, setStageFilter] = useState("all");
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [hideEnded, setHideEnded] = useState(false);
  const [density, setDensity] = useState<"compact" | "comfortable">("comfortable");
  const [search, setSearch] = useState("");
  const [detailSetId, setDetailSetId] = useState<string | undefined>();
  const [stageDetailId, setStageDetailId] = useState<string | undefined>();
  const [sharedPlan, setSharedPlan] = useState<SharedPlan | undefined>();
  const [copied, setCopied] = useState(false);
  const [postCopied, setPostCopied] = useState(false);
  const [shareOrigin, setShareOrigin] = useState("https://www.newportfolkschedule.com");
  const online = useOnlineStatus();

  const { artistsById, stagesById } = useMemo(() => buildMaps(artists, stages), [artists, stages]);
  const scheduleById = useMemo(
    () => Object.fromEntries(scheduleItems.map((item) => [item.id, item])),
    [scheduleItems]
  );

  useEffect(() => {
    setPlan(loadPlan(manifest));
    setHydrated(true);
  }, [manifest]);

  useEffect(() => {
    if (!hydrated) return;
    savePlan(plan);
  }, [plan, hydrated]);

  useEffect(() => {
    setShareOrigin(window.location.origin);
  }, []);


  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("plan");
    if (!encoded) return;
    try {
      setSharedPlan(decodeSharePlan(encoded));
    } catch {
      setSharedPlan(undefined);
    }
  }, []);

  const conflicts = useMemo(
    () =>
      findConflicts(
        scheduleItems,
        plan.selections,
        plan.transitionBufferMinutes,
        stages
      ),
    [scheduleItems, plan.selections, plan.transitionBufferMinutes, stages]
  );

  const selectedItems = useMemo(
    () => scheduleItems.filter((item) => plan.selections[item.id]).sort(compareSets),
    [scheduleItems, plan.selections]
  );

  const planArtists = useMemo(() => {
    const seen = new Set<string>();
    const unique: Artist[] = [];
    for (const item of selectedItems) {
      if (seen.has(item.artistId)) continue;
      seen.add(item.artistId);
      const artist = artistsById[item.artistId];
      if (artist) unique.push(artist);
    }
    return unique;
  }, [selectedItems, artistsById]);

  const shareUrl = useMemo(() => {
    const encoded = encodeSharePlan({
      version: manifest.scheduleVersion,
      selections: plan.selections,
      transitionBufferMinutes: plan.transitionBufferMinutes
    });
    const url = new URL("/", shareOrigin);
    url.searchParams.set("plan", encoded);
    return url.toString();
  }, [manifest.scheduleVersion, plan.selections, plan.transitionBufferMinutes, shareOrigin]);

  const socialPost = useMemo(
    () => buildSocialPost(selectedItems, artistsById),
    [artistsById, selectedItems]
  );

  const visibleItems = useMemo(() => {
    const searchText = search.trim().toLowerCase();
    return scheduleItems
      .filter((item) => item.date === activeDay)
      .filter((item) => stageFilter === "all" || item.stageId === stageFilter)
      .filter((item) => !showSelectedOnly || plan.selections[item.id])
      .filter((item) => !hideEnded || !isSetEnded(item))
      .filter((item) => {
        if (!searchText) return true;
        const artist = artistsById[item.artistId];
        const stage = stagesById[item.stageId];
        return [artist?.name, item.titleOverride, stage?.name, ...(artist?.tags ?? []), ...(artist?.genres ?? [])]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(searchText);
      })
      .sort(compareSets);
  }, [
    activeDay,
    artistsById,
    hideEnded,
    plan.selections,
    scheduleItems,
    search,
    showSelectedOnly,
    stageFilter,
    stagesById
  ]);

  function updatePlan(updater: (current: PlanState) => PlanState) {
    setPlan((current) => updater(current));
  }

  function setSelection(setId: string, priority?: Priority) {
    updatePlan((current) => {
      const selections = { ...current.selections };
      if (priority) selections[setId] = priority;
      else delete selections[setId];
      return { ...current, selections };
    });
  }

  function cycleSelection(setId: string) {
    const current = plan.selections[setId];
    if (!current) setSelection(setId, "interested");
    else if (current === "interested") setSelection(setId, "must");
    else setSelection(setId);
  }

  function openArtist(artistId: string) {
    const set = scheduleItems.find((item) => item.artistId === artistId);
    if (set) setDetailSetId(set.id);
  }

  async function saveForOffline() {
    if (!("caches" in window)) return;
    const cache = await caches.open(`newport-folk-planner:${manifest.scheduleVersion}`);
    await cache.addAll(["/", "/offline", "/about", "/print"]);
    updatePlan((current) => ({
      ...current,
      offlineReadyVersion: manifest.scheduleVersion
    }));
  }

  async function copyShareLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function copySocialPost() {
    await navigator.clipboard.writeText(socialPost);
    setPostCopied(true);
    window.setTimeout(() => setPostCopied(false), 1600);
  }

  async function shareSocialPost() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Newport Folk 2026 schedule",
          text: socialPost,
          url: shareUrl
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await copySocialPost();
  }

  function openSocialShare(platform: SocialPlatform) {
    if (!selectedItems.length) return;
    const url =
      platform === "x"
        ? new URL("https://twitter.com/intent/tweet")
        : new URL("https://www.facebook.com/sharer/sharer.php");
    if (platform === "x") {
      url.searchParams.set("text", socialPost);
      url.searchParams.set("url", shareUrl);
    } else {
      url.searchParams.set("u", shareUrl);
    }
    window.open(url.toString(), "_blank", "noopener,noreferrer");
  }

  function downloadIcs() {
    const ics = generateIcs(scheduleItems, plan.selections, {
      artistsById,
      stagesById,
      manifest,
      includeAlarm: true
    });
    downloadFile("newport-folk-plan-2026.ics", "text/calendar;charset=utf-8", ics);
  }

  const detailItem = detailSetId ? scheduleById[detailSetId] : undefined;
  const detailArtist = detailItem ? artistsById[detailItem.artistId] : undefined;
  const detailStage = detailItem ? stagesById[detailItem.stageId] : undefined;
  const stageDetail = stageDetailId ? stagesById[stageDetailId] : undefined;
  const officialUrl = manifest.officialScheduleUrl;
  const hasPlaceholderData = manifest.scheduleVersion.includes("placeholder");
  const offlineReady = plan.offlineReadyVersion === manifest.scheduleVersion;

  return (
    <main className="min-h-screen bg-paper text-ink">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-4 sm:px-6 lg:px-8">
        <header className="overflow-hidden rounded-[2rem] bg-ink text-paper shadow-soft">
          <div className="grid gap-6 p-5 md:grid-cols-[1.4fr_0.8fr] md:p-8">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-paper/70">Unofficial planner</p>
              <h1 className="mt-3 text-4xl font-black leading-tight md:text-6xl">
                Newport Folk 2026 Schedule
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-paper/82">
                Every set time for July 24–26 at Fort Adams. Build a personal itinerary,
                spot conflicts, save it offline, and export a pocket plan before reception
                gets wobbly.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 text-sm">
                <span className="rounded-full bg-paper/14 px-3 py-1">
                  Version {manifest.scheduleVersion}
                </span>
                <span className="rounded-full bg-paper/14 px-3 py-1">
                  {online ? "Online" : "Offline"} · {offlineReady ? "saved for offline" : "not fully saved"}
                </span>
                <a className="rounded-full bg-paper px-3 py-1 font-semibold text-ink" href={officialUrl}>
                  Official schedule source
                </a>
              </div>
            </div>
            <div className="rounded-3xl bg-paper p-4 text-ink">
              <h2 className="text-lg font-bold">Offline preflight</h2>
              <p className="mt-2 text-sm text-ink/70">
                Reception can be limited at Fort Adams. Open the app once, tap save, then test it before you arrive.
              </p>
              <button
                className="mt-4 min-h-11 w-full rounded-2xl bg-bay px-4 py-3 font-bold text-white"
                onClick={saveForOffline}
              >
                {offlineReady ? "Saved for offline" : "Save for offline"}
              </button>
              <p className="mt-3 text-xs text-ink/60">
                Calendar exports are snapshots and do not auto-update after schedule changes.
              </p>
            </div>
          </div>
        </header>

        {hasPlaceholderData ? (
          <div className="rounded-3xl border-2 border-dashed border-sunset/60 bg-white/80 p-4 text-sm">
            <strong>Placeholder schedule:</strong> this app is wired with fake, schema-valid data so the planner can be tested now.
            Replace it with the official 2026 schedule as soon as Newport Folk publishes it.
          </div>
        ) : null}

        {sharedPlan ? (
          <SharedPlanBanner
            sharedPlan={sharedPlan}
            currentCount={selectedItems.length}
            onDismiss={() => setSharedPlan(undefined)}
            onReplace={() => {
              updatePlan((current) => ({
                ...current,
                selections: sharedPlan.selections,
                transitionBufferMinutes: sharedPlan.transitionBufferMinutes
              }));
              setSharedPlan(undefined);
            }}
            onMerge={() => {
              updatePlan((current) => ({
                ...current,
                selections: { ...current.selections, ...sharedPlan.selections },
                transitionBufferMinutes: sharedPlan.transitionBufferMinutes
              }));
              setSharedPlan(undefined);
            }}
          />
        ) : null}

        <div className={classNames("grid gap-5", (activeTab === "plan" || activeTab === "now") && "lg:grid-cols-[1fr_360px]")}>
          <section className="space-y-4">
            <nav className="grid grid-cols-3 gap-2 rounded-3xl bg-white p-2 shadow-soft sm:grid-cols-5" aria-label="Primary" role="tablist">
              {tabLabels.map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  className={classNames(
                    "min-h-11 rounded-2xl px-2 py-2 text-sm font-bold transition-colors",
                    activeTab === tab.id ? "bg-ink text-paper" : "bg-transparent text-ink/65 hover:bg-ink/5"
                  )}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                  {tab.id === "plan" && selectedItems.length > 0 ? (
                    <span className={classNames(
                      "ml-1.5 inline-block rounded-full px-1.5 text-xs tabular-nums",
                      activeTab === tab.id ? "bg-paper/20" : "bg-ink/10"
                    )}>
                      {selectedItems.length}
                    </span>
                  ) : null}
                </button>
              ))}
            </nav>

            {activeTab === "schedule" ? (
              <>
                <ScheduleControls
                  activeDay={activeDay}
                  stages={stages}
                  stageFilter={stageFilter}
                  setActiveDay={setActiveDay}
                  setStageFilter={setStageFilter}
                  search={search}
                  setSearch={setSearch}
                  showSelectedOnly={showSelectedOnly}
                  setShowSelectedOnly={setShowSelectedOnly}
                  hideEnded={hideEnded}
                  setHideEnded={setHideEnded}
                  density={density}
                  setDensity={setDensity}
                />
                <WeatherStrip activeDay={activeDay} />
                <ScheduleGrid
                  items={visibleItems}
                  allStages={stages}
                  artistsById={artistsById}
                  stagesById={stagesById}
                  selections={plan.selections}
                  conflicts={conflicts}
                  density={density}
                  onCycle={cycleSelection}
                  onOpen={setDetailSetId}
                  onOpenStage={setStageDetailId}
                />
              </>
            ) : null}

            {activeTab === "plan" ? (
              <MyPlan
                selectedItems={selectedItems}
                artistsById={artistsById}
                stagesById={stagesById}
                selections={plan.selections}
                conflicts={conflicts}
                transitionBufferMinutes={plan.transitionBufferMinutes}
                setTransitionBuffer={(value) =>
                  updatePlan((current) => ({ ...current, transitionBufferMinutes: value }))
                }
                onOpen={setDetailSetId}
                onCycle={cycleSelection}
                onRemove={(setId) => setSelection(setId)}
                onDownloadIcs={downloadIcs}
                onCopyShare={copyShareLink}
                socialPost={socialPost}
                shareUrl={shareUrl}
                onCopySocialPost={copySocialPost}
                onNativeShare={shareSocialPost}
                onOpenSocialShare={openSocialShare}
                copied={copied}
                postCopied={postCopied}
                spotifyCard={<SpotifyPlaylistCard planArtists={planArtists} />}
              />
            ) : null}

            {activeTab === "now" ? (
              <NowNext
                scheduleItems={scheduleItems}
                selectedItems={selectedItems}
                artistsById={artistsById}
                stages={stages}
                stagesById={stagesById}
                selections={plan.selections}
                preferredStageId={plan.preferredStageId}
                setPreferredStage={(stageId) =>
                  updatePlan((current) => ({
                    ...current,
                    preferredStageId: stageId === "none" ? undefined : stageId
                  }))
                }
                onOpen={setDetailSetId}
              />
            ) : null}

            {activeTab === "surprise" ? (
              <SurpriseBoard artistsById={artistsById} onOpenArtist={openArtist} />
            ) : null}

            {activeTab === "history" ? (
              <HistoryBoard
                historicalYears={historicalYears}
                historySummaries={historySummaries}
                onOpenArtist={openArtist}
              />
            ) : null}

          </section>

          {activeTab === "plan" || activeTab === "now" ? (
            <aside className="space-y-4">
              <PlanSummary
                selectedItems={selectedItems}
                selections={plan.selections}
                conflicts={conflicts}
                onCopyShare={copyShareLink}
                onCopySocialPost={copySocialPost}
                onDownloadIcs={downloadIcs}
                onOpenSpotify={() => setActiveTab("plan")}
                copied={copied}
                postCopied={postCopied}
              />
              <PolicyCard policies={policies} />
            </aside>
          ) : null}
        </div>
      </section>

      {detailItem && detailArtist && detailStage ? (
        <ArtistSheet
          item={detailItem}
          artist={detailArtist}
          stage={detailStage}
          priority={plan.selections[detailItem.id]}
          conflictType={getConflictTypeForSet(detailItem.id, conflicts)}
          history={getArtistHistory(detailArtist.id, historySummaries)}
          onClose={() => setDetailSetId(undefined)}
          onSetPriority={(priority) => setSelection(detailItem.id, priority)}
          onStage={() => setStageDetailId(detailItem.stageId)}
          onViewHistory={() => {
            setDetailSetId(undefined);
            setActiveTab("history");
          }}
        />
      ) : null}

      {stageDetail ? (
        <StageSheet
          stage={stageDetail}
          onClose={() => setStageDetailId(undefined)}
        />
      ) : null}

      <footer className="mx-auto max-w-7xl px-4 pb-8 text-sm text-ink/60 sm:px-6 lg:px-8">
        Unofficial fan-made planning tool. Not affiliated with or endorsed by Newport Festivals Foundation.
        Schedule information is subject to change; confirm critical details with Newport Folk.
      </footer>
    </main>
  );
}

function SharedPlanBanner({
  sharedPlan,
  currentCount,
  onReplace,
  onMerge,
  onDismiss
}: {
  sharedPlan: SharedPlan;
  currentCount: number;
  onReplace: () => void;
  onMerge: () => void;
  onDismiss: () => void;
}) {
  const incomingCount = Object.keys(sharedPlan.selections).length;
  return (
    <div className="rounded-3xl bg-bay p-4 text-white shadow-soft">
      <h2 className="font-bold">Shared plan detected</h2>
      <p className="mt-1 text-sm text-white/85">
        This link contains {incomingCount} picks from version {sharedPlan.version}. You currently have {currentCount}.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button className="rounded-full bg-white px-4 py-2 font-bold text-bay" onClick={onReplace}>Replace my plan</button>
        <button className="rounded-full bg-white/16 px-4 py-2 font-bold" onClick={onMerge}>Merge</button>
        <button className="rounded-full bg-white/16 px-4 py-2 font-bold" onClick={onDismiss}>Preview only</button>
      </div>
    </div>
  );
}

function ScheduleControls({
  activeDay,
  stages,
  stageFilter,
  setActiveDay,
  setStageFilter,
  search,
  setSearch,
  showSelectedOnly,
  setShowSelectedOnly,
  hideEnded,
  setHideEnded,
  density,
  setDensity
}: {
  activeDay: FestivalDate;
  stages: Stage[];
  stageFilter: string;
  setActiveDay: (day: FestivalDate) => void;
  setStageFilter: (stage: string) => void;
  search: string;
  setSearch: (search: string) => void;
  showSelectedOnly: boolean;
  setShowSelectedOnly: (value: boolean) => void;
  hideEnded: boolean;
  setHideEnded: (value: boolean) => void;
  density: "compact" | "comfortable";
  setDensity: (value: "compact" | "comfortable") => void;
}) {
  return (
    <div className="rounded-3xl bg-white p-4 shadow-soft">
      <div className="flex flex-wrap gap-2">
        {FESTIVAL_DAYS.map((day) => (
          <button
            key={day.date}
            className={classNames(
              "min-h-11 rounded-full px-4 py-2 font-bold",
              activeDay === day.date ? "bg-bay text-white" : "bg-ink/6 text-ink"
            )}
            onClick={() => setActiveDay(day.date)}
          >
            {day.label}
          </button>
        ))}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
        <label className="block">
          <span className="sr-only">Search artists, stages, and tags</span>
          <input
            className="min-h-12 w-full rounded-2xl border border-ink/15 bg-paper px-4 outline-none focus:border-bay"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search artist, mood, stage…"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            className={classNames("rounded-full px-4 py-2 font-bold", showSelectedOnly ? "bg-ink text-paper" : "bg-ink/6")}
            onClick={() => setShowSelectedOnly(!showSelectedOnly)}
          >
            My picks
          </button>
          <button
            className={classNames("rounded-full px-4 py-2 font-bold", hideEnded ? "bg-ink text-paper" : "bg-ink/6")}
            onClick={() => setHideEnded(!hideEnded)}
          >
            Hide ended
          </button>
          <button
            className="rounded-full bg-ink/6 px-4 py-2 font-bold"
            onClick={() => setDensity(density === "compact" ? "comfortable" : "compact")}
          >
            {density === "compact" ? "Comfortable" : "Compact"}
          </button>
        </div>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        <button
          className={classNames("min-h-11 shrink-0 rounded-full px-4 py-2 font-bold", stageFilter === "all" ? "bg-quad text-white" : "bg-ink/6")}
          onClick={() => setStageFilter("all")}
        >
          All stages
        </button>
        {stages.map((stage) => (
          <button
            key={stage.id}
            className={classNames("min-h-11 shrink-0 rounded-full px-4 py-2 font-bold", stageFilter === stage.id ? "bg-quad text-white" : "bg-ink/6")}
            onClick={() => setStageFilter(stage.id)}
          >
            {stage.shortName}
          </button>
        ))}
      </div>
    </div>
  );
}

const TIMELINE_INTERVAL_MINUTES = 30;
const TIMELINE_STAGE_MIN_WIDTH = 180;
const TIMELINE_RAIL_WIDTH = 62;

function getFestivalMinuteOfDay(iso: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    timeZone: "America/New_York"
  }).formatToParts(new Date(iso));
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

function formatTimelineMinute(minuteOfDay: number) {
  const hour24 = Math.floor(minuteOfDay / 60) % 24;
  const minute = minuteOfDay % 60;
  const hour12 = hour24 % 12 || 12;
  const suffix = hour24 >= 12 ? "PM" : "AM";
  return `${hour12}:${minute.toString().padStart(2, "0")} ${suffix}`;
}

function getTimelineSuffix(minuteOfDay: number) {
  return Math.floor(minuteOfDay / 60) >= 12 ? "PM" : "AM";
}

function formatTimelineClock(minuteOfDay: number) {
  const hour24 = Math.floor(minuteOfDay / 60) % 24;
  const minute = minuteOfDay % 60;
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:${minute.toString().padStart(2, "0")}`;
}

function formatCompactSuffix(minuteOfDay: number) {
  return getTimelineSuffix(minuteOfDay).toLowerCase()[0];
}

function formatSetTimeRange(startIso: string, endIso: string) {
  const start = getFestivalMinuteOfDay(startIso);
  const end = getFestivalMinuteOfDay(endIso);
  const startSuffix = formatCompactSuffix(start);
  const endSuffix = formatCompactSuffix(end);
  if (startSuffix === endSuffix) {
    return `${formatTimelineClock(start)}-${formatTimelineClock(end)}${endSuffix}`;
  }
  return `${formatTimelineClock(start)}${startSuffix}-${formatTimelineClock(end)}${endSuffix}`;
}

function buildTimelineTicks(startMinute: number, endMinute: number) {
  const ticks: number[] = [];
  for (let minute = startMinute; minute <= endMinute; minute += TIMELINE_INTERVAL_MINUTES) {
    ticks.push(minute);
  }
  return ticks;
}

function ScheduleGrid({
  items,
  allStages,
  artistsById,
  stagesById,
  selections,
  conflicts,
  density,
  onCycle,
  onOpen,
  onOpenStage
}: {
  items: ScheduleItem[];
  allStages: Stage[];
  artistsById: Record<string, Artist>;
  stagesById: Record<string, Stage>;
  selections: SelectionMap;
  conflicts: ReturnType<typeof findConflicts>;
  density: "compact" | "comfortable";
  onCycle: (setId: string) => void;
  onOpen: (setId: string) => void;
  onOpenStage: (stageId: string) => void;
}) {
  const [hovered, setHovered] = useState<{ setId: string; x: number; y: number } | undefined>();

  const stageIds = allStages.map((stage) => stage.id).filter((stageId) => items.some((item) => item.stageId === stageId));

  const POPOVER_WIDTH = 288;
  function showPopover(setId: string, rect: DOMRect) {
    let x = rect.right + 12;
    if (x + POPOVER_WIDTH > window.innerWidth - 8) {
      x = Math.max(8, rect.left - POPOVER_WIDTH - 12);
    }
    const y = Math.max(8, Math.min(rect.top, window.innerHeight - 240));
    setHovered({ setId, x, y });
  }

  const hoveredItem = hovered ? items.find((item) => item.id === hovered.setId) : undefined;
  const hoveredArtist = hoveredItem ? artistsById[hoveredItem.artistId] : undefined;

  if (!items.length) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center shadow-soft">
        <h2 className="text-xl font-bold">No sets match those filters.</h2>
        <p className="mt-2 text-ink/60">Try all stages, clear search, or turn off My picks.</p>
      </div>
    );
  }

  const startMinutes = items.map((item) => getFestivalMinuteOfDay(item.start));
  const endMinutes = items.map((item) => getFestivalMinuteOfDay(item.end));
  const timelineStart = Math.floor(Math.min(...startMinutes) / TIMELINE_INTERVAL_MINUTES) * TIMELINE_INTERVAL_MINUTES;
  const timelineEnd = Math.ceil(Math.max(...endMinutes) / TIMELINE_INTERVAL_MINUTES) * TIMELINE_INTERVAL_MINUTES;
  const pixelsPerMinute = density === "compact" ? 2 : 2.4;
  const timelineHeight = Math.max(260, (timelineEnd - timelineStart) * pixelsPerMinute);
  const ticks = buildTimelineTicks(timelineStart, timelineEnd);
  const gridTemplateColumns = `${TIMELINE_RAIL_WIDTH}px repeat(${stageIds.length}, minmax(${TIMELINE_STAGE_MIN_WIDTH}px, 1fr))`;
  const minTimelineWidth = TIMELINE_RAIL_WIDTH + stageIds.length * TIMELINE_STAGE_MIN_WIDTH;
  const dayLabel = FESTIVAL_DAYS.find((day) => day.date === items[0]?.date)?.long;

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/10 px-4 py-3">
        <div>
          <h2 className="text-lg font-black">{dayLabel ?? "Schedule"}</h2>
          <p className="text-xs font-bold text-ink/55">
            {stageIds.length} {stageIds.length === 1 ? "stage" : "stages"} · {items.length} {items.length === 1 ? "set" : "sets"}
          </p>
        </div>
        <p className="font-mono text-xs font-bold text-ink/55 tabular-nums">
          {formatTimelineMinute(timelineStart)} - {formatTimelineMinute(timelineEnd)}
        </p>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-full" style={{ minWidth: minTimelineWidth }}>
          <div
            className="sticky top-0 z-20 grid border-b border-ink/10 bg-white"
            style={{ gridTemplateColumns }}
          >
            <div className="sticky left-0 z-30 border-r border-ink/10 bg-white px-2 py-3 text-[11px] font-black uppercase tracking-[0.12em] text-ink/45">
              Time
            </div>
            {stageIds.map((stageId) => {
              const stage = stagesById[stageId];
              return (
                <button
                  key={stageId}
                  className="border-r border-ink/10 px-3 py-3 text-left last:border-r-0"
                  onClick={() => onOpenStage(stageId)}
                >
                  <span className="block text-sm font-black leading-tight sm:text-base">{stage?.name ?? stageId}</span>
                  <span className="mt-1 inline-block rounded-full bg-ink/8 px-2 py-1 text-xs font-bold text-ink/60">details</span>
                </button>
              );
            })}
          </div>
          <div className="grid" style={{ gridTemplateColumns, height: timelineHeight }}>
            <div className="sticky left-0 z-10 border-r border-ink/10 bg-white" style={{ height: timelineHeight }}>
              {ticks.map((tick) => {
                const top = (tick - timelineStart) * pixelsPerMinute;
                return (
                  <div key={tick} className="absolute left-0 right-0 border-t border-ink/10" style={{ top }}>
                    <span className="absolute right-2 top-[-0.7rem] bg-white px-1 text-right font-mono text-[11px] font-bold text-ink/50 tabular-nums">
                      {formatTimelineMinute(tick)}
                    </span>
                  </div>
                );
              })}
            </div>
            {stageIds.map((stageId) => (
              <div key={stageId} className="relative border-r border-ink/10 bg-paper/25 last:border-r-0" style={{ height: timelineHeight }}>
                {ticks.map((tick) => {
                  const top = (tick - timelineStart) * pixelsPerMinute;
                  return <div key={tick} className="pointer-events-none absolute left-0 right-0 border-t border-ink/10" style={{ top }} />;
                })}
                {items
                  .filter((item) => item.stageId === stageId)
                  .map((item) => {
                    const start = getFestivalMinuteOfDay(item.start);
                    const end = getFestivalMinuteOfDay(item.end);
                    const duration = Math.max(1, end - start);
                    return (
                      <SetCard
                        key={item.id}
                        item={item}
                        artist={artistsById[item.artistId]}
                        priority={selections[item.id]}
                        conflictType={getConflictTypeForSet(item.id, conflicts)}
                        density={density}
                        duration={duration}
                        style={{
                          top: (start - timelineStart) * pixelsPerMinute,
                          height: duration * pixelsPerMinute
                        }}
                        onCycle={() => onCycle(item.id)}
                        onOpen={() => {
                          setHovered(undefined);
                          onOpen(item.id);
                        }}
                        onHover={(rect) => showPopover(item.id, rect)}
                        onHoverEnd={() => setHovered(undefined)}
                      />
                    );
                  })}
              </div>
            ))}
          </div>
        </div>
      </div>
      {hoveredItem && hoveredArtist && hovered ? (
        <div
          className="pointer-events-none fixed z-40 w-72 rounded-2xl border border-ink/10 bg-white p-4 shadow-soft"
          style={{ left: hovered.x, top: hovered.y }}
          role="tooltip"
        >
          <p className="font-mono text-xs font-bold text-ink/60 tabular-nums">
            {formatSetTimeRange(hoveredItem.start, hoveredItem.end)} · {durationMinutes(hoveredItem.start, hoveredItem.end)} min
          </p>
          <p className="mt-1 text-lg font-black leading-tight">{hoveredItem.titleOverride ?? hoveredArtist.name}</p>
          <p className="mt-0.5 text-sm font-bold text-ink/60">{stagesById[hoveredItem.stageId]?.name}</p>
          {hoveredArtist.genres.length ? (
            <p className="mt-1 text-sm text-ink/60">{hoveredArtist.genres.slice(0, 3).join(" / ")}</p>
          ) : null}
          <p className="mt-2 line-clamp-3 text-sm text-ink/75">{hoveredArtist.shortBio}</p>
          <div className="mt-2 flex flex-wrap gap-1 text-xs font-bold">
            <span className="rounded-full bg-paper px-2 py-0.5">{priorityLabel(selections[hoveredItem.id])}</span>
            {getConflictTypeForSet(hoveredItem.id, conflicts) !== "none" ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-900">
                {getConflictTypeForSet(hoveredItem.id, conflicts) === "overlap" ? "Overlap" : "Tight move"}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-[11px] text-ink/45">Click the card for full details</p>
        </div>
      ) : null}
    </div>
  );
}

function SetCard({
  item,
  artist,
  priority,
  conflictType,
  density,
  style,
  onCycle,
  onOpen,
  onHover,
  onHoverEnd
}: {
  item: ScheduleItem;
  artist: Artist;
  priority?: Priority;
  conflictType: "none" | "overlap" | "transition";
  density: "compact" | "comfortable";
  duration: number;
  style: CSSProperties;
  onCycle: () => void;
  onOpen: () => void;
  onHover: (rect: DOMRect) => void;
  onHoverEnd: () => void;
}) {
  // Gate content on the card's actual pixel height so nothing overlaps on
  // short sets (or in compact density), where there isn't room for every row.
  const cardHeight = typeof style.height === "number" ? style.height : 200;
  const selection = priorityLabel(priority);
  const twoLineName = cardHeight >= 82;
  const showGenre = cardHeight >= 104;
  const showBadges = (Boolean(priority) || conflictType !== "none") && cardHeight >= 82;
  const showConflictDot = conflictType !== "none" && !showBadges;
  return (
    <article
      className={classNames(
        "absolute left-1.5 right-1.5 overflow-hidden rounded-lg border p-1.5 shadow-sm transition hover:shadow-soft sm:left-2 sm:right-2 sm:p-2",
        priority === "must" && "border-bay bg-bay/10",
        priority === "interested" && "border-quad bg-quad/10",
        !priority && "border-ink/12 bg-white/90",
        conflictType === "overlap" && "outline outline-2 outline-red-500",
        conflictType === "transition" && "outline outline-2 outline-amber-500"
      )}
      style={style}
      onMouseEnter={(event) => onHover(event.currentTarget.getBoundingClientRect())}
      onMouseLeave={onHoverEnd}
    >
      <div className="flex h-full min-h-0 flex-col gap-1 overflow-hidden">
        <div className="flex min-h-0 items-start gap-1.5">
          <button className="min-w-0 flex-1 text-left" onClick={onOpen}>
            <span className="block whitespace-nowrap font-mono text-[10px] font-bold leading-none text-ink/60 tabular-nums sm:text-[11px]">
              {formatSetTimeRange(item.start, item.end)}
            </span>
            <span className={classNames("mt-1 block font-black leading-tight", density === "compact" ? "text-xs sm:text-sm" : "text-sm sm:text-base", twoLineName ? "line-clamp-2" : "line-clamp-1")}>
              {item.titleOverride ?? artist.name}
            </span>
          </button>
          <button
            className={classNames(
              "min-h-7 min-w-7 shrink-0 rounded-full px-2 text-xs font-black sm:min-h-8 sm:min-w-8 sm:text-sm",
              priority === "must" ? "bg-bay text-white" : priority === "interested" ? "bg-quad text-white" : "bg-paper"
            )}
            aria-label={`Set ${artist.name} priority. Current: ${selection}`}
            onClick={onCycle}
          >
            {priority === "must" ? "★" : priority === "interested" ? "☆" : "+"}
          </button>
        </div>
        {showGenre ? (
          <p className="truncate text-[11px] text-ink/60 sm:text-xs">{artist.genres.slice(0, 2).join(" / ")}</p>
        ) : null}
        {showBadges ? (
          <div className="mt-auto flex flex-wrap gap-1 text-[10px] sm:text-[11px]">
            {priority ? <span className="rounded-full bg-white/80 px-2 py-0.5">{selection}</span> : null}
            {conflictType !== "none" ? (
              <span className={classNames("rounded-full px-2 py-0.5 font-bold", conflictType === "overlap" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-900")}>
                {conflictType === "overlap" ? "Overlap" : "Tight move"}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
      {showConflictDot ? (
        <span
          className={classNames(
            "pointer-events-none absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full ring-2 ring-white",
            conflictType === "overlap" ? "bg-red-500" : "bg-amber-500"
          )}
          aria-hidden="true"
        />
      ) : null}
    </article>
  );
}

function MyPlan({
  selectedItems,
  artistsById,
  stagesById,
  selections,
  conflicts,
  transitionBufferMinutes,
  setTransitionBuffer,
  onOpen,
  onCycle,
  onRemove,
  onDownloadIcs,
  onCopyShare,
  socialPost,
  shareUrl,
  onCopySocialPost,
  onNativeShare,
  onOpenSocialShare,
  copied,
  postCopied,
  spotifyCard
}: {
  selectedItems: ScheduleItem[];
  artistsById: Record<string, Artist>;
  stagesById: Record<string, Stage>;
  selections: SelectionMap;
  conflicts: ReturnType<typeof findConflicts>;
  transitionBufferMinutes: number;
  setTransitionBuffer: (value: number) => void;
  onOpen: (setId: string) => void;
  onCycle: (setId: string) => void;
  onRemove: (setId: string) => void;
  onDownloadIcs: () => void;
  onCopyShare: () => void;
  socialPost: string;
  shareUrl: string;
  onCopySocialPost: () => void | Promise<void>;
  onNativeShare: () => void | Promise<void>;
  onOpenSocialShare: (platform: SocialPlatform) => void;
  copied: boolean;
  postCopied: boolean;
  spotifyCard?: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="rounded-3xl bg-white p-4 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black">My Plan</h2>
            <p className="text-sm text-ink/60">{selectedItems.length} selected · {conflicts.length} warnings</p>
          </div>
          <label className="text-sm font-bold">
            Transition buffer
            <select
              className="ml-2 rounded-xl border border-ink/15 bg-paper px-3 py-2"
              value={transitionBufferMinutes}
              onChange={(event) => setTransitionBuffer(Number(event.target.value))}
            >
              {[0, 5, 10, 15].map((value) => (
                <option key={value} value={value}>{value} min</option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="rounded-full bg-bay px-4 py-2 font-bold text-white" onClick={onDownloadIcs}>
            Download calendar
          </button>
          <a className="rounded-full bg-ink px-4 py-2 font-bold text-paper" href="/print" target="_blank">
            Print / save PDF
          </a>
          <button className="rounded-full bg-ink/8 px-4 py-2 font-bold" onClick={onCopyShare}>
            {copied ? "Copied" : "Copy share link"}
          </button>
        </div>
      </div>

      {spotifyCard}

      {selectedItems.length > 0 ? (
        <SocialPostCard
          postText={socialPost}
          shareUrl={shareUrl}
          copied={postCopied}
          onCopy={onCopySocialPost}
          onNativeShare={onNativeShare}
          onOpenSocialShare={onOpenSocialShare}
        />
      ) : null}

      {selectedItems.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center shadow-soft">
          <h3 className="text-xl font-bold">Your plan is empty.</h3>
          <p className="mt-2 text-ink/60">Tap + once for Interested, again for Must See. The third tap clears it.</p>
        </div>
      ) : (
        FESTIVAL_DAYS.map((day) => {
          const dayItems = selectedItems.filter((item) => item.date === day.date);
          if (!dayItems.length) return null;
          return (
            <div key={day.date} className="rounded-3xl bg-white p-4 shadow-soft">
              <h3 className="text-xl font-black">{day.long}</h3>
              <div className="mt-3 space-y-2">
                {dayItems.map((item) => {
                  const artist = artistsById[item.artistId];
                  const stage = stagesById[item.stageId];
                  const conflictType = getConflictTypeForSet(item.id, conflicts);
                  return (
                    <div key={item.id} className="flex items-center gap-3 rounded-2xl bg-paper p-3">
                      <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => onOpen(item.id)}>
                        <ArtistImage artist={artist} className="h-11 w-11 shrink-0" rounded="rounded-lg" />
                        <span className="min-w-0">
                          <span className="block text-sm font-bold text-ink/60">{formatTime(item.start)}–{formatTime(item.end)} · {stage.name}</span>
                          <span className="block font-black">{item.titleOverride ?? artist.name}</span>
                          <span className="block text-sm text-ink/60">{priorityLabel(selections[item.id])}{conflictType !== "none" ? ` · ${conflictType === "overlap" ? "overlap conflict" : "tight transition"}` : ""}</span>
                        </span>
                      </button>
                      <button
                        className="min-h-11 rounded-full bg-white px-3 font-black"
                        aria-label={`Toggle priority for ${artist.name}. Current: ${priorityLabel(selections[item.id])}`}
                        onClick={() => onCycle(item.id)}
                      >
                        {selections[item.id] === "must" ? "★" : "☆"}
                      </button>
                      <button
                        className="min-h-11 rounded-full bg-white px-3 font-black text-ink/50 hover:text-red-700"
                        aria-label={`Remove ${artist.name} from plan`}
                        onClick={() => onRemove(item.id)}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </section>
  );
}


function SocialPostCard({
  postText,
  shareUrl,
  copied,
  onCopy,
  onNativeShare,
  onOpenSocialShare
}: {
  postText: string;
  shareUrl: string;
  copied: boolean;
  onCopy: () => void | Promise<void>;
  onNativeShare: () => void | Promise<void>;
  onOpenSocialShare: (platform: SocialPlatform) => void;
}) {
  return (
    <section className="rounded-3xl bg-white p-4 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-black">Social post</h3>
          <p className="text-sm text-ink/60">{postText.length} characters</p>
        </div>
        <a className="rounded-full bg-ink/8 px-3 py-2 text-sm font-bold" href={shareUrl} target="_blank" rel="noreferrer">
          Open share link
        </a>
      </div>
      <textarea
        aria-label="Generated social post"
        className="mt-3 min-h-32 w-full resize-y rounded-2xl border border-ink/12 bg-paper p-3 font-mono text-sm leading-relaxed text-ink outline-none focus:border-bay"
        readOnly
        value={postText}
      />
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button className="min-h-11 rounded-2xl bg-bay px-3 font-bold text-white" onClick={onCopy}>
          {copied ? "Post copied" : "Copy post"}
        </button>
        <button className="min-h-11 rounded-2xl bg-ink px-3 font-bold text-paper" onClick={onNativeShare}>
          Share
        </button>
        <button className="min-h-11 rounded-2xl bg-ink/8 px-3 font-bold" onClick={() => onOpenSocialShare("x")}>
          X
        </button>
        <button className="min-h-11 rounded-2xl bg-ink/8 px-3 font-bold" onClick={() => onOpenSocialShare("facebook")}>
          Facebook
        </button>
      </div>
    </section>
  );
}

function NowNext({
  scheduleItems,
  selectedItems,
  artistsById,
  stages,
  stagesById,
  selections,
  preferredStageId,
  setPreferredStage,
  onOpen
}: {
  scheduleItems: ScheduleItem[];
  selectedItems: ScheduleItem[];
  artistsById: Record<string, Artist>;
  stages: Stage[];
  stagesById: Record<string, Stage>;
  selections: SelectionMap;
  preferredStageId?: string;
  setPreferredStage: (stageId: string) => void;
  onOpen: (setId: string) => void;
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const current = selectedItems.find(
    (item) => new Date(item.start) <= now && new Date(item.end) >= now
  );
  const next = selectedItems.find((item) => new Date(item.start) > now);
  const alternatives = scheduleItems
    .filter((item) => !selections[item.id] && new Date(item.end) > now)
    .filter((item) => !preferredStageId || item.stageId === preferredStageId)
    .sort(compareSets)
    .slice(0, 2);

  return (
    <section className="rounded-3xl bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-black">Now / Next</h2>
          <p className="text-sm text-ink/60">{formatDateTime(now.toISOString())}</p>
        </div>
        <label className="text-sm font-bold">
          I’m at
          <select
            className="ml-2 rounded-xl border border-ink/15 bg-paper px-3 py-2"
            value={preferredStageId ?? "none"}
            onChange={(event) => setPreferredStage(event.target.value)}
          >
            <option value="none">No preference</option>
            {stages.map((stage) => (
              <option key={stage.id} value={stage.id}>{stage.shortName}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <NowCard label="Current selected set" item={current} artistsById={artistsById} stagesById={stagesById} onOpen={onOpen} />
        <NowCard label="Next selected set" item={next} artistsById={artistsById} stagesById={stagesById} onOpen={onOpen} countdown />
      </div>
      <h3 className="mt-5 font-black">Immediate alternatives</h3>
      <div className="mt-2 grid gap-2">
        {alternatives.map((item) => (
          <button key={item.id} className="rounded-2xl bg-paper p-3 text-left" onClick={() => onOpen(item.id)}>
            <span className="font-bold">{artistsById[item.artistId]?.name}</span>
            <span className="block text-sm text-ink/60">{formatTime(item.start)} · {stagesById[item.stageId]?.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function NowCard({
  label,
  item,
  artistsById,
  stagesById,
  onOpen,
  countdown
}: {
  label: string;
  item?: ScheduleItem;
  artistsById: Record<string, Artist>;
  stagesById: Record<string, Stage>;
  onOpen: (setId: string) => void;
  countdown?: boolean;
}) {
  if (!item) {
    return (
      <div className="rounded-3xl bg-paper p-5">
        <p className="text-sm font-bold text-ink/60">{label}</p>
        <p className="mt-2 text-xl font-black">No selected act</p>
      </div>
    );
  }

  const artist = artistsById[item.artistId];
  const stage = stagesById[item.stageId];
  return (
    <button className="rounded-3xl bg-bay p-5 text-left text-white" onClick={() => onOpen(item.id)}>
      <p className="text-sm font-bold text-white/70">{label}</p>
      <p className="mt-2 text-2xl font-black">{artist.name}</p>
      <p className="mt-1 text-white/80">{formatTime(item.start)}–{formatTime(item.end)} · {stage.name}</p>
      {countdown ? <p className="mt-3 rounded-full bg-white/16 px-3 py-1 text-sm font-bold">Starts in {getCountdownLabel(item.start)}</p> : null}
    </button>
  );
}

// AI and recommendation UI is intentionally retained for future re-enablement, but not rendered.
function Explore({
  recommendations,
  scheduleById,
  artistsById,
  stagesById,
  selections,
  onSelect,
  onOpen
}: {
  recommendations: RecommendationResponse;
  scheduleById: Record<string, ScheduleItem>;
  artistsById: Record<string, Artist>;
  stagesById: Record<string, Stage>;
  selections: SelectionMap;
  onSelect: (setId: string) => void;
  onOpen: (setId: string) => void;
}) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-soft">
      <h2 className="text-3xl font-black">Explore</h2>
      <p className="mt-1 text-ink/60">{recommendations.summary}</p>
      <div className="mt-4 grid gap-3">
        {recommendations.recommendations.map((rec) => {
          const item = scheduleById[rec.setId];
          const artist = artistsById[rec.artistId];
          if (!item || !artist) return null;
          return (
            <article key={rec.setId} className="rounded-2xl bg-paper p-4">
              <div className="flex items-start justify-between gap-3">
                <button className="min-w-0 text-left" onClick={() => onOpen(rec.setId)}>
                  <h3 className="text-xl font-black">{artist.name}</h3>
                  <p className="text-sm font-bold text-ink/60">{formatTime(item.start)} · {stagesById[item.stageId]?.name} · {rec.score}% fit</p>
                  <p className="mt-2 text-sm text-ink/70">{rec.reason}</p>
                  {rec.tradeoff ? <p className="mt-2 text-sm font-bold text-amber-800">{rec.tradeoff}</p> : null}
                </button>
                <button
                  className="min-h-11 rounded-full bg-bay px-4 font-bold text-white disabled:bg-ink/20"
                  disabled={Boolean(selections[rec.setId])}
                  onClick={() => onSelect(rec.setId)}
                >
                  {selections[rec.setId] ? "Picked" : "Add"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function PlanSummary({
  selectedItems,
  selections,
  conflicts,
  onCopyShare,
  onCopySocialPost,
  onDownloadIcs,
  onOpenSpotify,
  copied,
  postCopied
}: {
  selectedItems: ScheduleItem[];
  selections: SelectionMap;
  conflicts: ReturnType<typeof findConflicts>;
  onCopyShare: () => void;
  onCopySocialPost: () => void | Promise<void>;
  onDownloadIcs: () => void;
  onOpenSpotify: () => void;
  copied: boolean;
  postCopied: boolean;
}) {
  const mustCount = Object.values(selections).filter((priority) => priority === "must").length;
  return (
    <section className="rounded-3xl bg-white p-5 shadow-soft">
      <h2 className="text-xl font-black">Plan summary</h2>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-paper p-3"><strong className="block text-2xl">{selectedItems.length}</strong><span className="text-xs">selected</span></div>
        <div className="rounded-2xl bg-paper p-3"><strong className="block text-2xl">{mustCount}</strong><span className="text-xs">must see</span></div>
        <div className="rounded-2xl bg-paper p-3"><strong className="block text-2xl">{conflicts.length}</strong><span className="text-xs">warnings</span></div>
      </div>
      <div className="mt-4 flex flex-col gap-2">
        <button className="rounded-2xl bg-bay px-4 py-3 font-bold text-white" onClick={onDownloadIcs}>Download .ics</button>
        <button
          className="rounded-2xl bg-[#1DB954] px-4 py-3 font-bold text-white disabled:bg-ink/10 disabled:text-ink/40"
          disabled={selectedItems.length === 0}
          onClick={onOpenSpotify}
        >
          Spotify playlist
        </button>
        <a className="rounded-2xl bg-ink px-4 py-3 text-center font-bold text-paper" href="/print" target="_blank">Print pocket plan</a>
        <button className="rounded-2xl bg-sunset px-4 py-3 font-bold text-ink disabled:bg-ink/10 disabled:text-ink/40" disabled={selectedItems.length === 0} onClick={onCopySocialPost}>{postCopied ? "Post copied" : "Copy social post"}</button>
        <button className="rounded-2xl bg-ink/8 px-4 py-3 font-bold" onClick={onCopyShare}>{copied ? "Link copied" : "Copy share URL"}</button>
      </div>
    </section>
  );
}

function AssistantPanel({
  online,
  query,
  setQuery,
  result,
  busy,
  error,
  scheduleById,
  artistsById,
  stagesById,
  onAsk,
  onSelect,
  onOpen
}: {
  online: boolean;
  query: string;
  setQuery: (query: string) => void;
  result: RecommendationResponse;
  busy: boolean;
  error?: string;
  scheduleById: Record<string, ScheduleItem>;
  artistsById: Record<string, Artist>;
  stagesById: Record<string, Stage>;
  onAsk: () => void;
  onSelect: (setId: string) => void;
  onOpen: (setId: string) => void;
}) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-soft">
      <h2 className="text-xl font-black">Assistant</h2>
      <p className="mt-1 text-sm text-ink/60">
        {online ? "Ask for schedule-aware recommendations." : "AI chat needs a connection. Offline recommendations still work."}
      </p>
      <textarea
        className="mt-3 min-h-24 w-full rounded-2xl border border-ink/15 bg-paper p-3 text-sm outline-none focus:border-bay"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Find three discoveries, resolve conflicts, keep me near the Fort Stage…"
      />
      <button
        className="mt-2 min-h-11 w-full rounded-2xl bg-ink px-4 font-bold text-paper disabled:bg-ink/30"
        disabled={!online || busy}
        onClick={onAsk}
      >
        {busy ? "Asking…" : "Ask AI"}
      </button>
      {error ? <p className="mt-2 text-sm font-bold text-amber-800">{error}</p> : null}
      <div className="mt-4 space-y-2">
        {result.recommendations.slice(0, 3).map((rec) => {
          const item = scheduleById[rec.setId];
          const artist = artistsById[rec.artistId];
          if (!item || !artist) return null;
          return (
            <article key={rec.setId} className="rounded-2xl bg-paper p-3">
              <button className="text-left" onClick={() => onOpen(rec.setId)}>
                <p className="font-black">{artist.name}</p>
                <p className="text-xs text-ink/60">{formatTime(item.start)} · {stagesById[item.stageId]?.shortName} · {rec.conflictType}</p>
                <p className="mt-1 text-sm text-ink/70">{rec.reason}</p>
              </button>
              <button className="mt-2 rounded-full bg-bay px-3 py-2 text-sm font-bold text-white" onClick={() => onSelect(rec.setId)}>Add Interested</button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function PolicyCard({ policies }: { policies: Policy[] }) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-soft">
      <h2 className="text-xl font-black">Verified policy notes</h2>
      <div className="mt-3 space-y-2">
        {policies.slice(0, 4).map((policy) => (
          <details key={policy.id} className="rounded-2xl bg-paper p-3">
            <summary className="cursor-pointer font-bold">{policy.title}</summary>
            <p className="mt-2 text-sm text-ink/70">{policy.summary}</p>
            <a className="mt-2 inline-block text-sm font-bold text-bay" href={policy.officialSourceUrl}>Official source</a>
          </details>
        ))}
      </div>
    </section>
  );
}

function SheetShell({
  label,
  onClose,
  children
}: {
  label: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    panelRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-ink/45 p-3 md:items-center md:justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={panelRef}
        tabIndex={-1}
        className="max-h-[92vh] w-full max-w-2xl overflow-auto rounded-[2rem] bg-white p-5 shadow-soft outline-none"
      >
        {children}
      </section>
    </div>
  );
}

function ArtistSheet({
  item,
  artist,
  stage,
  priority,
  conflictType,
  history,
  onClose,
  onSetPriority,
  onStage,
  onViewHistory
}: {
  item: ScheduleItem;
  artist: Artist;
  stage: Stage;
  priority?: Priority;
  conflictType: "none" | "overlap" | "transition";
  history?: ArtistHistorySummary;
  onClose: () => void;
  onSetPriority: (priority?: Priority) => void;
  onStage: () => void;
  onViewHistory: () => void;
}) {
  return (
    <SheetShell label={`${artist.name} set details`} onClose={onClose}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <ArtistImage artist={artist} className="h-24 w-24 shrink-0" rounded="rounded-2xl" />
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-bay">{stage.name}</p>
              <h2 className="text-3xl font-black">{item.titleOverride ?? artist.name}</h2>
              <p className="mt-1 text-ink/60">{formatTime(item.start)}–{formatTime(item.end)} · {durationMinutes(item.start, item.end)} minutes</p>
            </div>
          </div>
          <button className="min-h-11 rounded-full bg-ink/8 px-4 font-bold" onClick={onClose}>Close</button>
        </div>
        <p className="mt-4 text-lg">{artist.shortBio}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {Array.from(new Set([...artist.genres, ...artist.tags, ...artist.moods])).slice(0, 12).map((tag) => (
            <span key={tag} className="rounded-full bg-paper px-3 py-1 text-sm font-bold">{tag}</span>
          ))}
        </div>
        <div className="mt-4 rounded-2xl bg-paper p-3 text-sm">
          <strong>Conflict status:</strong> {conflictType === "none" ? "No selected conflict." : conflictType === "overlap" ? "Direct overlap with a selected set." : "Tight stage transition."}
        </div>
        {history ? (
          <button
            className="mt-3 flex w-full items-center justify-between gap-2 rounded-2xl bg-bay/10 p-3 text-left text-sm text-bay hover:bg-bay/15"
            onClick={onViewHistory}
          >
            <span>
              <strong>{history.totalAppearances}x at Newport Folk</strong> since {Math.min(...history.years)}
              {history.guestCount ? ` (including ${history.guestCount} guest sit-in${history.guestCount === 1 ? "" : "s"})` : ""}
            </span>
            <span aria-hidden="true">→</span>
          </button>
        ) : (
          <p className="mt-3 rounded-2xl bg-paper p-3 text-sm text-ink/50">
            No appearance found in our 2016–2025 history data — may be a Newport Folk debut.
          </p>
        )}
        <div className="mt-5 grid grid-cols-3 gap-2" role="group" aria-label="Set priority">
          <button
            className={classNames(
              "min-h-12 rounded-2xl px-2 font-bold",
              priority === "interested" ? "bg-quad text-white" : "bg-ink/8"
            )}
            aria-pressed={priority === "interested"}
            onClick={() => onSetPriority(priority === "interested" ? undefined : "interested")}
          >
            ☆ Interested
          </button>
          <button
            className={classNames(
              "min-h-12 rounded-2xl px-2 font-bold",
              priority === "must" ? "bg-bay text-white" : "bg-ink/8"
            )}
            aria-pressed={priority === "must"}
            onClick={() => onSetPriority(priority === "must" ? undefined : "must")}
          >
            ★ Must see
          </button>
          <button
            className="min-h-12 rounded-2xl bg-ink/8 px-2 font-bold disabled:opacity-40"
            disabled={!priority}
            onClick={() => onSetPriority(undefined)}
          >
            Remove
          </button>
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <a className="min-h-12 rounded-2xl bg-ink px-4 py-3 text-center font-bold text-paper" href={spotifySearchUrl(artist)} target="_blank" rel="noreferrer">
            Open in Spotify
          </a>
          <button className="min-h-12 rounded-2xl bg-ink/8 px-4 font-bold" onClick={onStage}>Stage details</button>
        </div>
        <ArtistLinks artist={artist} />
        <p className="mt-4 text-xs text-ink/50">Metadata confidence: {artist.metadataConfidence}. {item.sourceNote}</p>
        {artist.imageCredit ? (
          <p className="mt-1 text-xs text-ink/40">
            {artist.imageSourceUrl ? (
              <a href={artist.imageSourceUrl} target="_blank" rel="noreferrer" className="underline">
                {artist.imageCredit}
              </a>
            ) : (
              artist.imageCredit
            )}
          </p>
        ) : null}
    </SheetShell>
  );
}

function ArtistLinks({ artist }: { artist: Artist }) {
  const links: Array<[string, string | undefined]> = [
    ["Website", artist.officialUrl],
    ["Bandcamp", artist.links?.bandcamp],
    ["Instagram", artist.links?.instagram],
    ["YouTube", artist.links?.youtube],
    ["TikTok", artist.links?.tiktok],
    ["Wikipedia", artist.links?.wikipedia],
    ["More links", artist.links?.other]
  ];
  const available = links.filter((entry): entry is [string, string] => Boolean(entry[1]));
  if (!available.length) return null;

  return (
    <div className="mt-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-ink/45">Listen &amp; follow</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {available.map(([label, url]) => (
          <a
            key={label}
            className="rounded-full bg-ink/8 px-3 py-1.5 text-sm font-bold text-ink hover:bg-ink/15"
            href={url}
            target="_blank"
            rel="noreferrer"
          >
            {label}
          </a>
        ))}
      </div>
    </div>
  );
}

function StageSheet({ stage, onClose }: { stage: Stage; onClose: () => void }) {
  const facts = [
    ["Seating", stage.seating],
    ["Shade / cover", stage.shade],
    ["Blankets", stage.blankets],
    ["Chairs", stage.chairs],
    ["Surface", stage.surface],
    ["Accessibility", stage.accessibility]
  ] as const;

  return (
    <SheetShell label={`${stage.name} stage details`} onClose={onClose}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-quad">Stage details</p>
            <h2 className="text-3xl font-black">{stage.name}</h2>
          </div>
          <button className="min-h-11 rounded-full bg-ink/8 px-4 font-bold" onClick={onClose}>Close</button>
        </div>
        <p className="mt-3 text-ink/70">{stage.description}</p>
        <div className="mt-4 grid gap-2">
          {facts.map(([label, fact]) => (
            <div key={label} className="rounded-2xl bg-paper p-3">
              <div className="flex items-center justify-between gap-3">
                <strong>{label}</strong>
                <span className={classNames("rounded-full px-2 py-1 text-xs font-bold", fact.status === "official" ? "bg-bay/15 text-bay" : fact.status === "observed" ? "bg-quad/15 text-quad" : "bg-ink/10 text-ink/60")}>
                  {fact.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-ink/70">{fact.summary}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-2xl bg-paper p-3">
          <strong>Transition estimates</strong>
          <div className="mt-2 flex flex-wrap gap-2 text-sm">
            {Object.entries(stage.transitions).map(([stageId, minutes]) => (
              <span key={stageId} className="rounded-full bg-white px-3 py-1">{stageId}: {minutes} min</span>
            ))}
          </div>
          <p className="mt-2 text-xs text-ink/50">Use these as configurable planning estimates until measured during a realistic crowd.</p>
        </div>
        <div className="mt-4 text-sm">
          {stage.sources.map((source) => (
            <a key={source.url} className="mr-3 font-bold text-bay" href={source.url}>{source.label}</a>
          ))}
        </div>
    </SheetShell>
  );
}
