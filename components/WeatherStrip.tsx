"use client";

import { useEffect, useState } from "react";
import {
  WEATHER_ATTRIBUTION,
  describeWeatherCode,
  formatClock,
  formatHourLabel,
  weatherAdvice,
  type WeatherDay,
  type WeatherPayload
} from "@/lib/weather";

type LoadState = "loading" | "ready" | "unavailable";

function Attribution() {
  return (
    <a
      className="text-[10px] font-bold text-ink/40 underline hover:text-ink/70"
      href={WEATHER_ATTRIBUTION.url}
      target="_blank"
      rel="noreferrer"
    >
      {WEATHER_ATTRIBUTION.label}
    </a>
  );
}

function HourlyRow({ day }: { day: WeatherDay }) {
  if (!day.hours.length) return null;
  const peak = Math.max(...day.hours.map((hour) => hour.precipitationProbability), 10);
  const advice = weatherAdvice(day);

  return (
    <div className="mt-2">
      {advice ? <p className="mb-2 text-xs font-bold text-ink/70">{advice}</p> : null}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {day.hours.map((hour) => {
          const { icon } = describeWeatherCode(hour.code);
          const wet = hour.precipitationProbability >= 40;
          return (
            <div
              key={hour.time}
              className="flex min-w-[48px] shrink-0 flex-col items-center rounded-xl bg-paper px-1.5 py-1.5"
              title={`${formatHourLabel(hour.hour)} · ${hour.temperature}° · ${hour.precipitationProbability}% rain`}
            >
              <span className="font-mono text-[10px] font-bold text-ink/55">
                {formatHourLabel(hour.hour)}
              </span>
              <span className="my-0.5 text-sm leading-none" aria-hidden="true">
                {icon}
              </span>
              <span className="text-xs font-black tabular-nums">{hour.temperature}°</span>
              <span className="mt-1 h-1 w-full overflow-hidden rounded-full bg-ink/10" aria-hidden="true">
                <span
                  className={`block h-full rounded-full ${wet ? "bg-bay" : "bg-ink/25"}`}
                  style={{ width: `${Math.round((hour.precipitationProbability / peak) * 100)}%` }}
                />
              </span>
              <span
                className={`mt-0.5 text-[10px] font-bold tabular-nums ${wet ? "text-bay" : "text-ink/40"}`}
              >
                {hour.precipitationProbability}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Deliberately low-key: a single line tucked under the day selector rather
 * than a card competing with the schedule. Detail is one tap away.
 */
export function WeatherStrip({ activeDay }: { activeDay: string }) {
  const [state, setState] = useState<LoadState>("loading");
  const [days, setDays] = useState<WeatherDay[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/weather")
      .then((response) => response.json())
      .then((payload: WeatherPayload & { error?: string }) => {
        if (cancelled) return;
        if (payload.error || !payload.days?.length) {
          setState("unavailable");
          return;
        }
        setDays(payload.days);
        setState("ready");
      })
      .catch(() => {
        if (!cancelled) setState("unavailable");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "loading") {
    return (
      <div className="mt-3 border-t border-ink/10 pt-3" aria-busy="true">
        <div className="h-4 w-52 animate-pulse rounded-full bg-ink/10" />
      </div>
    );
  }

  if (state === "unavailable") {
    return (
      <div className="mt-3 flex items-center gap-2 border-t border-ink/10 pt-3 text-xs text-ink/50">
        <span>Forecast needs a connection.</span>
        <Attribution />
      </div>
    );
  }

  const day = days.find((entry) => entry.date === activeDay);
  if (!day) {
    return (
      <div className="mt-3 flex items-center gap-2 border-t border-ink/10 pt-3 text-xs text-ink/50">
        <span>No forecast for this day yet.</span>
        <Attribution />
      </div>
    );
  }

  const { label, icon } = describeWeatherCode(day.code);

  return (
    <div className="mt-3 border-t border-ink/10 pt-3">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm">
        <span className="text-base leading-none" aria-hidden="true">
          {icon}
        </span>
        <span className="font-bold tabular-nums">
          {day.high}°<span className="text-ink/40"> / {day.low}°</span>
        </span>
        <span className="text-ink/60">{label}</span>
        <span className="text-ink/45" aria-hidden="true">
          ·
        </span>
        <span className="text-ink/60 tabular-nums">{day.precipitationProbability}% rain</span>
        <span className="hidden text-ink/45 sm:inline" aria-hidden="true">
          ·
        </span>
        <span className="hidden text-ink/60 tabular-nums sm:inline">UV {day.uvMax}</span>
        <span className="hidden text-ink/45 sm:inline" aria-hidden="true">
          ·
        </span>
        <span className="hidden text-ink/60 tabular-nums sm:inline">
          Sunset {formatClock(day.sunset)}
        </span>

        <span className="ml-auto flex items-center gap-2">
          {day.hours.length ? (
            <button
              className="text-xs font-bold text-bay underline"
              aria-expanded={expanded}
              onClick={() => setExpanded((current) => !current)}
            >
              {expanded ? "Hide hourly" : "Hourly"}
            </button>
          ) : null}
          <Attribution />
        </span>
      </div>

      {expanded ? <HourlyRow day={day} /> : null}
    </div>
  );
}
