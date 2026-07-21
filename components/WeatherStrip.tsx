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
      className="text-[11px] font-bold text-ink/45 underline hover:text-ink/70"
      href={WEATHER_ATTRIBUTION.url}
      target="_blank"
      rel="noreferrer"
    >
      Weather by {WEATHER_ATTRIBUTION.label}
    </a>
  );
}

function HourlyRow({ day }: { day: WeatherDay }) {
  if (!day.hours.length) return null;
  const peak = Math.max(...day.hours.map((hour) => hour.precipitationProbability), 10);

  return (
    <div className="mt-3 border-t border-ink/10 pt-3">
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {day.hours.map((hour) => {
          const { icon } = describeWeatherCode(hour.code);
          const wet = hour.precipitationProbability >= 40;
          return (
            <div
              key={hour.time}
              className="flex min-w-[52px] shrink-0 flex-col items-center rounded-xl bg-paper px-1.5 py-2"
              title={`${formatHourLabel(hour.hour)} · ${hour.temperature}° · ${hour.precipitationProbability}% rain`}
            >
              <span className="font-mono text-[10px] font-bold text-ink/55">
                {formatHourLabel(hour.hour)}
              </span>
              <span className="my-0.5 text-base leading-none" aria-hidden="true">
                {icon}
              </span>
              <span className="text-xs font-black tabular-nums">{hour.temperature}°</span>
              <span
                className="mt-1 h-1 w-full overflow-hidden rounded-full bg-ink/10"
                aria-hidden="true"
              >
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
      <p className="mt-1 text-[11px] text-ink/45">Hourly temperature and chance of rain, gates to headliners.</p>
    </div>
  );
}

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
      <div className="rounded-3xl bg-white p-4 shadow-soft" aria-busy="true">
        <div className="h-5 w-40 animate-pulse rounded-full bg-ink/10" />
        <div className="mt-3 h-8 w-56 animate-pulse rounded-full bg-ink/10" />
      </div>
    );
  }

  if (state === "unavailable") {
    return (
      <div className="rounded-3xl bg-white p-4 text-sm text-ink/60 shadow-soft">
        <p>
          <strong className="font-bold text-ink">Forecast unavailable.</strong> It needs a
          connection — the rest of the planner still works offline.
        </p>
        <p className="mt-1">
          <Attribution />
        </p>
      </div>
    );
  }

  const day = days.find((entry) => entry.date === activeDay);
  if (!day) {
    return (
      <div className="rounded-3xl bg-white p-4 text-sm text-ink/60 shadow-soft">
        <p>No forecast for this day yet — Open-Meteo publishes about 16 days ahead.</p>
        <p className="mt-1">
          <Attribution />
        </p>
      </div>
    );
  }

  const { label, icon } = describeWeatherCode(day.code);
  const advice = weatherAdvice(day);

  return (
    <section className="rounded-3xl bg-white p-4 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-4xl leading-none" aria-hidden="true">
            {icon}
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-ink/45">
              Fort Adams forecast
            </p>
            <p className="mt-0.5 text-xl font-black tabular-nums">
              {day.high}° <span className="text-ink/40">/ {day.low}°</span>
            </p>
            <p className="text-sm font-bold text-ink/65">
              {label} · {day.precipitationProbability}% rain
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-3 gap-x-4 gap-y-1 text-right text-xs text-ink/60 sm:text-sm">
          <div>
            <dt className="font-bold text-ink/45">Wind</dt>
            <dd className="tabular-nums">{day.windMax} mph</dd>
          </div>
          <div>
            <dt className="font-bold text-ink/45">UV</dt>
            <dd className="tabular-nums">{day.uvMax}</dd>
          </div>
          <div>
            <dt className="font-bold text-ink/45">Sunset</dt>
            <dd className="tabular-nums">{formatClock(day.sunset)}</dd>
          </div>
        </dl>
      </div>

      {advice ? (
        <p className="mt-3 rounded-2xl bg-paper px-3 py-2 text-sm font-bold text-ink/75">{advice}</p>
      ) : null}

      {day.hours.length ? (
        <button
          className="mt-3 rounded-full bg-ink/8 px-3 py-1.5 text-xs font-bold hover:bg-ink/15"
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? "Hide hourly" : "Hour by hour"}
        </button>
      ) : null}

      {expanded ? <HourlyRow day={day} /> : null}

      <p className="mt-3">
        <Attribution />
      </p>
    </section>
  );
}
