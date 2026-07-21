/**
 * Fort Adams weather, via Open-Meteo (https://open-meteo.com/).
 *
 * Open-Meteo is free for non-commercial use, needs no API key, and is licensed
 * CC BY 4.0 — attribution is required, so the UI renders a visible link back
 * to open-meteo.com. Requests are proxied through /api/weather rather than
 * called from the browser, which keeps the CSP at `connect-src 'self'` and
 * lets one cached upstream call serve every visitor.
 */

/** Fort Adams State Park, Newport RI — where the festival actually happens. */
export const FORT_ADAMS = { latitude: 41.478, longitude: -71.339 } as const;

export const WEATHER_ATTRIBUTION = {
  label: "Open-Meteo",
  url: "https://open-meteo.com/"
} as const;

/** Hours of day worth showing — gates open mid-morning, headliners end ~8pm. */
export const FESTIVAL_HOUR_START = 10;
export const FESTIVAL_HOUR_END = 20;

export type WeatherHour = {
  time: string; // ISO local, e.g. 2026-07-24T14:00
  hour: number;
  temperature: number;
  precipitationProbability: number;
  code: number;
};

export type WeatherDay = {
  date: string; // YYYY-MM-DD
  code: number;
  high: number;
  low: number;
  precipitationProbability: number;
  precipitationSum: number;
  windMax: number;
  uvMax: number;
  sunrise: string;
  sunset: string;
  hours: WeatherHour[];
};

export type WeatherPayload = {
  updatedAt: string;
  days: WeatherDay[];
};

/**
 * WMO weather interpretation codes, grouped into the buckets a festivalgoer
 * actually cares about. https://open-meteo.com/en/docs
 */
export function describeWeatherCode(code: number): { label: string; icon: string } {
  if (code === 0) return { label: "Clear", icon: "☀️" };
  if (code === 1) return { label: "Mostly clear", icon: "🌤️" };
  if (code === 2) return { label: "Partly cloudy", icon: "⛅" };
  if (code === 3) return { label: "Overcast", icon: "☁️" };
  if (code === 45 || code === 48) return { label: "Fog", icon: "🌫️" };
  if (code >= 51 && code <= 57) return { label: "Drizzle", icon: "🌦️" };
  if (code >= 61 && code <= 67) return { label: "Rain", icon: "🌧️" };
  if (code >= 71 && code <= 77) return { label: "Snow", icon: "🌨️" };
  if (code >= 80 && code <= 82) return { label: "Showers", icon: "🌦️" };
  if (code === 85 || code === 86) return { label: "Snow showers", icon: "🌨️" };
  if (code >= 95 && code <= 99) return { label: "Thunderstorms", icon: "⛈️" };
  return { label: "Unsettled", icon: "🌥️" };
}

/** A short, plain-language call to action for the day. */
export function weatherAdvice(day: WeatherDay): string | undefined {
  if (day.code >= 95 && day.code <= 99) return "Thunderstorms possible — have a plan for cover.";
  if (day.precipitationProbability >= 50) return "Pack a rain layer.";
  if (day.high >= 88) return "Hot one — bring water and find shade.";
  if (day.uvMax >= 8) return "High UV — sunscreen up.";
  if (day.windMax >= 20) return "Breezy off the bay — secure light layers.";
  return undefined;
}

export function buildOpenMeteoUrl(startDate: string, endDate: string) {
  const params = new URLSearchParams({
    latitude: String(FORT_ADAMS.latitude),
    longitude: String(FORT_ADAMS.longitude),
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max",
      "precipitation_sum",
      "wind_speed_10m_max",
      "uv_index_max",
      "sunrise",
      "sunset"
    ].join(","),
    hourly: ["temperature_2m", "precipitation_probability", "weather_code"].join(","),
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    precipitation_unit: "inch",
    timezone: "America/New_York",
    start_date: startDate,
    end_date: endDate
  });
  return `https://api.open-meteo.com/v1/forecast?${params}`;
}

type OpenMeteoResponse = {
  daily?: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: (number | null)[];
    precipitation_sum: (number | null)[];
    wind_speed_10m_max: (number | null)[];
    uv_index_max: (number | null)[];
    sunrise: string[];
    sunset: string[];
  };
  hourly?: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: (number | null)[];
    weather_code: number[];
  };
};

function hourOf(isoLocal: string) {
  return Number(isoLocal.slice(11, 13));
}

/** Normalises Open-Meteo's parallel arrays into per-day objects. */
export function normalizeForecast(raw: OpenMeteoResponse): WeatherDay[] {
  const daily = raw.daily;
  if (!daily?.time?.length) return [];

  const hoursByDate = new Map<string, WeatherHour[]>();
  const hourly = raw.hourly;
  if (hourly?.time?.length) {
    hourly.time.forEach((time, index) => {
      const date = time.slice(0, 10);
      const hour = hourOf(time);
      if (hour < FESTIVAL_HOUR_START || hour > FESTIVAL_HOUR_END) return;
      const list = hoursByDate.get(date) ?? [];
      list.push({
        time,
        hour,
        temperature: Math.round(hourly.temperature_2m[index] ?? 0),
        precipitationProbability: Math.round(hourly.precipitation_probability[index] ?? 0),
        code: hourly.weather_code[index] ?? 0
      });
      hoursByDate.set(date, list);
    });
  }

  return daily.time.map((date, index) => ({
    date,
    code: daily.weather_code[index] ?? 0,
    high: Math.round(daily.temperature_2m_max[index] ?? 0),
    low: Math.round(daily.temperature_2m_min[index] ?? 0),
    precipitationProbability: Math.round(daily.precipitation_probability_max[index] ?? 0),
    precipitationSum: Number((daily.precipitation_sum[index] ?? 0).toFixed(2)),
    windMax: Math.round(daily.wind_speed_10m_max[index] ?? 0),
    uvMax: Math.round(daily.uv_index_max[index] ?? 0),
    sunrise: daily.sunrise[index] ?? "",
    sunset: daily.sunset[index] ?? "",
    hours: hoursByDate.get(date) ?? []
  }));
}

/** "2026-07-24T20:17" -> "8:17 PM" */
export function formatClock(isoLocal: string) {
  if (!isoLocal) return "";
  const hour = Number(isoLocal.slice(11, 13));
  const minute = isoLocal.slice(14, 16);
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${minute} ${suffix}`;
}

export function formatHourLabel(hour: number) {
  const suffix = hour >= 12 ? "p" : "a";
  return `${hour % 12 || 12}${suffix}`;
}
