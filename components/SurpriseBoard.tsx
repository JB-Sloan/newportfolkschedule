"use client";

import { useMemo, useState } from "react";
import { historicalYears, surpriseGuests } from "@/lib/data";
import {
  EVIDENCE_TYPES,
  connectedArtists,
  rankSuspects,
  type ScoreBreakdown
} from "@/lib/surprise";
import type { Artist, SurpriseGuest } from "@/lib/schemas";

function ScoreChip({ percent, label }: { percent: number; label: string }) {
  const tone =
    percent >= 55 ? "bg-bay text-white" : percent >= 35 ? "bg-quad text-white" : "bg-ink/10 text-ink/70";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-black ${tone}`}>
      <span className="tabular-nums">{percent}%</span>
      <span className="text-xs font-bold opacity-90">{label}</span>
    </span>
  );
}

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

const TYPEWRITER = "'Courier New', ui-monospace, monospace";
const PAPER_STYLES = [
  { fill: "#efe3c6", edge: "#d7c39a" }, // manila
  { fill: "#f7f3e8", edge: "#e0d8c4" }, // white
  { fill: "#f1e7a3", edge: "#ddd085" }, // sticky note
  { fill: "#e7e1d2", edge: "#cfc7b3" } // newsprint
];
const PIN_COLORS = ["#c0392b", "#2a6f97", "#2e8b57", "#b8860b"];
const CARD_TILT = [-3, 2.4, -2, 3.2, -1.6, 2];

function Pushpin({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g>
      <ellipse cx={x + 1.2} cy={y + 2} rx={4.6} ry={2.4} fill="#000" opacity={0.18} />
      <circle cx={x} cy={y} r={4.4} fill={color} />
      <circle cx={x - 1.3} cy={y - 1.3} r={1.5} fill="#fff" opacity={0.7} />
    </g>
  );
}

function ConnectionMap({
  suspect,
  artistsById,
  onOpenArtist
}: {
  suspect: SurpriseGuest;
  artistsById: Record<string, Artist>;
  onOpenArtist: (artistId: string) => void;
}) {
  // One pinned scrap per argument — every piece of evidence gets its own card.
  const items = suspect.evidence;
  const width = 340;
  const topPad = 16;
  const rowHeight = 64;
  const height = Math.max(168, topPad * 2 + items.length * rowHeight);
  const centerY = height / 2;

  // Suspect polaroid (left), string origin pin on its right edge.
  const originX = 92;
  // Evidence scrap cards (right column).
  const cardX = 150;
  const cardW = 168;
  const cardH = 46;
  const cardPinX = cardX + 12;
  const rowY = (index: number) =>
    items.length === 1 ? centerY : topPad + rowHeight * index + rowHeight / 2;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      role="img"
      aria-label={`${suspect.name} connection board`}
    >
      <defs>
        <pattern id="pegboard" width="15" height="15" patternUnits="userSpaceOnUse">
          <circle cx="7.5" cy="7.5" r="1.7" fill="#8a744c" />
          <circle cx="7.5" cy="8.3" r="1.7" fill="#e6d2a6" opacity="0.35" />
        </pattern>
        <filter id="scrapShadow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0.8" dy="2.4" stdDeviation="1.6" floodColor="#000" floodOpacity="0.32" />
        </filter>
      </defs>

      {/* pegboard */}
      <rect x="0" y="0" width={width} height={height} rx="10" fill="#d3bd90" />
      <rect x="0" y="0" width={width} height={height} rx="10" fill="url(#pegboard)" />
      <rect
        x="1"
        y="1"
        width={width - 2}
        height={height - 2}
        rx="9"
        fill="none"
        stroke="#00000022"
        strokeWidth="2"
      />

      {/* string connectors (sagging yarn) */}
      {items.map((node) => {
        const y = rowY(items.indexOf(node));
        const color = EVIDENCE_TYPES[node.type].color;
        const midX = (originX + cardPinX) / 2;
        const sagY = Math.max(centerY, y) + 16;
        const d = `M${originX},${centerY} Q${midX},${sagY} ${cardPinX},${y}`;
        const w = 1.6 + (node.weight / 100) * 2.2;
        return (
          <g key={`str-${node.artistId ?? "general"}-${items.indexOf(node)}`}>
            <path d={d} fill="none" stroke="#5c1a12" strokeWidth={w + 1.4} strokeLinecap="round" opacity="0.5" />
            <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" />
          </g>
        );
      })}

      {/* suspect polaroid */}
      <g transform={`rotate(-2 56 ${centerY})`} filter="url(#scrapShadow)">
        <rect x="26" y={centerY - 42} width="60" height="84" rx="1.5" fill="#fcfaf2" />
        <rect x="31" y={centerY - 37} width="50" height="44" fill="#5f6f7b" />
        <circle cx="56" cy={centerY - 20} r="9" fill="#8b97a2" />
        <rect x="45" y={centerY - 12} width="22" height="12" rx="6" fill="#8b97a2" />
        <text
          x="56"
          y={centerY + 20}
          textAnchor="middle"
          fontFamily={TYPEWRITER}
          fontSize="7.5"
          fontWeight="700"
          fill="#23292f"
        >
          {truncate(suspect.name.toUpperCase(), 11)}
        </text>
        <text x="56" y={centerY + 32} textAnchor="middle" fontFamily={TYPEWRITER} fontSize="6" fill="#b23b2e">
          {suspect.status === "debunked" ? "X RULED OUT X" : "? RUMORED ?"}
        </text>
      </g>
      <Pushpin x={56} y={centerY - 40} color="#b8860b" />
      <Pushpin x={originX} y={centerY} color="#c0392b" />

      {/* artist scrap cards */}
      {items.map((node) => {
        const index = items.indexOf(node);
        const y = rowY(index);
        const color = EVIDENCE_TYPES[node.type].color;
        const artist = node.artistId ? artistsById[node.artistId] : undefined;
        const paper = PAPER_STYLES[index % PAPER_STYLES.length];
        const tilt = CARD_TILT[index % CARD_TILT.length];
        const pin = PIN_COLORS[index % PIN_COLORS.length];
        const artistId = node.artistId;
        return (
          <g
            key={`${artistId ?? "general"}-${index}`}
            className={artistId ? "cursor-pointer" : undefined}
            onClick={artistId ? () => onOpenArtist(artistId) : undefined}
            role={artistId ? "button" : undefined}
            tabIndex={artistId ? 0 : undefined}
            aria-label={artistId ? `Open ${artist?.name ?? artistId}` : undefined}
            onKeyDown={
              artistId
                ? (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onOpenArtist(artistId);
                    }
                  }
                : undefined
            }
          >
            <g transform={`rotate(${tilt} ${cardPinX} ${y})`}>
              <g filter="url(#scrapShadow)">
                <rect
                  x={cardX}
                  y={y - cardH / 2}
                  width={cardW}
                  height={cardH}
                  rx="1.5"
                  fill={paper.fill}
                  stroke={paper.edge}
                  strokeWidth="0.75"
                />
              </g>
              {/* strip of masking tape over the pin corner */}
              <rect
                x={cardX + 2}
                y={y - cardH / 2 - 4}
                width="26"
                height="12"
                fill="#d8cfa8"
                opacity="0.55"
                transform={`rotate(-8 ${cardX + 15} ${y - cardH / 2})`}
              />
              <line
                x1={cardX + 10}
                y1={y + 3}
                x2={cardX + cardW - 10}
                y2={y + 3}
                stroke={paper.edge}
                strokeWidth="0.5"
              />
              <text
                x={cardX + 22}
                y={y - 4}
                fontFamily={TYPEWRITER}
                fontSize="11.5"
                fontWeight="700"
                fill="#241a10"
              >
                {truncate(artist?.name ?? node.artistId ?? "General signal", 19)}
              </text>
              <text x={cardX + 22} y={y + 14} fontFamily={TYPEWRITER} fontSize="8.5" fontWeight="700" fill={color}>
                {EVIDENCE_TYPES[node.type].label.toUpperCase()}
              </text>
            </g>
            <Pushpin x={cardPinX} y={y} color={pin} />
          </g>
        );
      })}

      {items.length === 0 ? (
        <g transform={`rotate(-2 ${cardX + 70} ${centerY})`} filter="url(#scrapShadow)">
          <rect x={cardX} y={centerY - 16} width="150" height="32" rx="1.5" fill="#f7f3e8" />
          <text x={cardX + 12} y={centerY + 4} fontFamily={TYPEWRITER} fontSize="9" fill="#241a10">
            No billed-artist link yet
          </text>
        </g>
      ) : null}
    </svg>
  );
}

function SuspectDetail({
  suspect,
  score,
  artistsById,
  onOpenArtist
}: {
  suspect: SurpriseGuest;
  score: ScoreBreakdown;
  artistsById: Record<string, Artist>;
  onOpenArtist: (artistId: string) => void;
}) {
  const generalSignals = suspect.evidence.filter((item) => !item.artistId);
  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-white p-5 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-2xl font-black">{suspect.name}</h3>
            <p className="mt-1 text-sm text-ink/65">{suspect.summary}</p>
          </div>
          <ScoreChip percent={score.percent} label={score.label} />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_1.1fr]">
          <ConnectionMap suspect={suspect} artistsById={artistsById} onOpenArtist={onOpenArtist} />
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-ink/45">Why this number</p>
            <div className="mt-2 space-y-2">
              {score.categories.map((category) => {
                const meta = EVIDENCE_TYPES[category.type];
                return (
                  <div key={category.type} className="grid grid-cols-[110px_1fr_34px] items-center gap-2 text-sm">
                    <span className="truncate font-bold text-ink/70">{meta.label}</span>
                    <span className="h-2 overflow-hidden rounded-full bg-ink/10">
                      <span
                        className="block h-full rounded-full"
                        style={{ width: `${Math.round(category.strength * 100)}%`, background: meta.color }}
                      />
                    </span>
                    <span className="text-right font-mono text-xs font-bold tabular-nums text-ink/60">
                      {category.type === "schedule-friction"
                        ? `-${Math.round(category.strength * 100)}`
                        : Math.round(category.strength * 100)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 rounded-2xl bg-paper p-3 text-xs text-ink/65">
              <p>
                Starts from a <strong>{Math.round(score.baseRate * 100)}% historical prior</strong>.
                {!score.availabilityKnown
                  ? " No current routing or festival-specific signal is verified, so the model applies an unknown-availability penalty."
                  : " Current availability or a festival-specific signal has been researched."}
              </p>
              <p className="mt-1 font-bold">
                Research confidence: {score.confidenceLabel} ({score.confidence}%)
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-soft">
        <h4 className="text-lg font-black">The case</h4>
        <div className="mt-3 space-y-2.5">
          {suspect.evidence.map((item, index) => {
            const meta = EVIDENCE_TYPES[item.type];
            const artist = item.artistId ? artistsById[item.artistId] : undefined;
            return (
              <div
                key={index}
                className="rounded-2xl bg-paper p-3"
                style={{ borderLeft: `4px solid ${meta.color}` }}
              >
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                  <span className="rounded-full px-2 py-0.5 text-white" style={{ background: meta.color }}>
                    {meta.label}
                  </span>
                  {artist ? (
                    <button
                      className="rounded-full bg-ink/8 px-2 py-0.5 font-bold text-ink hover:bg-ink/15"
                      onClick={() => onOpenArtist(artist.id)}
                    >
                      ↳ {artist.name}
                    </button>
                  ) : (
                    <span className="rounded-full bg-ink/8 px-2 py-0.5 text-ink/60">general signal</span>
                  )}
                  <span className="font-mono text-ink/45">weight {item.weight}</span>
                </div>
                <p className="mt-1.5 text-sm text-ink/75">{item.detail}</p>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                  {item.sources.map((source) => (
                    <a
                      key={source}
                      href={source}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-bay underline"
                    >
                      source
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {generalSignals.length === 0 ? (
          <p className="mt-3 text-xs text-ink/45">
            Tour routing, label ties, and public hints for {suspect.name} are still open leads — see the research guide.
          </p>
        ) : null}
        {suspect.links?.wikipedia ? (
          <a
            className="mt-3 inline-block text-sm font-bold text-bay"
            href={suspect.links.wikipedia}
            target="_blank"
            rel="noreferrer"
          >
            More on {suspect.name}
          </a>
        ) : null}
      </div>
    </div>
  );
}

export function SurpriseBoard({
  artistsById,
  onOpenArtist
}: {
  artistsById: Record<string, Artist>;
  onOpenArtist: (artistId: string) => void;
}) {
  const ranked = useMemo(() => rankSuspects(surpriseGuests as SurpriseGuest[], historicalYears), []);
  const [selectedId, setSelectedId] = useState<string>(ranked[0]?.suspect.id ?? "");
  const [query, setQuery] = useState("");
  const selected = ranked.find((entry) => entry.suspect.id === selectedId) ?? ranked[0];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ranked;
    return ranked.filter(
      ({ suspect }) =>
        suspect.name.toLowerCase().includes(q) ||
        suspect.evidence.some(
          (item) => item.artistId && (artistsById[item.artistId]?.name ?? "").toLowerCase().includes(q)
        )
    );
  }, [query, ranked, artistsById]);

  if (!ranked.length) return null;

  return (
    <section className="space-y-4">
      <div className="rounded-3xl bg-ink p-5 text-paper shadow-soft">
        <h2 className="text-2xl font-black">Rumor Evaluator</h2>
        <p className="mt-2 max-w-2xl text-sm text-paper/80">
          Estimates start from the guest rate in the historical dataset, then update for a named
          set vehicle, verified routing, current hints, musical ties, and conflicts. Correlated
          facts are deliberately prevented from stacking like independent clues.
        </p>
        <p className="mt-2 text-xs text-paper/55">
          Fan speculation only. Not insider info, and not affiliated with the festival or these artists.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <div className="order-2 lg:order-1 lg:sticky lg:top-3 lg:self-start">
          <label className="relative block">
            <span className="sr-only">Search rumored guests</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Search ${ranked.length} rumors…`}
              className="min-h-11 w-full rounded-2xl border border-ink/15 bg-white px-4 pr-9 text-sm outline-none focus:border-bay"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-2 text-ink/50 hover:text-ink"
              >
                ✕
              </button>
            ) : null}
          </label>
          <div className="mt-2 max-h-[58vh] space-y-2 overflow-y-auto pr-1 lg:max-h-[70vh]">
            {filtered.length ? (
              filtered.map(({ suspect, score }) => {
                const isActive = suspect.id === selected?.suspect.id;
                const topLink = connectedArtists(suspect)[0];
                const via = topLink ? artistsById[topLink.artistId]?.name : undefined;
                return (
                  <button
                    key={suspect.id}
                    onClick={() => setSelectedId(suspect.id)}
                    className={`w-full rounded-2xl p-3 text-left shadow-soft transition ${
                      isActive ? "bg-white ring-2 ring-bay" : "bg-white hover:bg-paper"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate font-black">{suspect.name}</span>
                      <ScoreChip percent={score.percent} label={score.label} />
                    </div>
                    {via ? <span className="mt-1 block text-xs font-bold text-ink/55">via {via}</span> : null}
                  </button>
                );
              })
            ) : (
              <p className="rounded-2xl bg-white p-4 text-sm text-ink/55 shadow-soft">
                No rumored guests match “{query}”.
              </p>
            )}
          </div>
        </div>

        <div className="order-1 lg:order-2">
          {selected ? (
            <SuspectDetail
              suspect={selected.suspect}
              score={selected.score}
              artistsById={artistsById}
              onOpenArtist={onOpenArtist}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
