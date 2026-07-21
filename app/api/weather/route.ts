import { NextResponse } from "next/server";
import { FESTIVAL_DAYS } from "@/lib/time";
import { buildOpenMeteoUrl, normalizeForecast } from "@/lib/weather";

export const runtime = "nodejs";
// One upstream Open-Meteo call serves every visitor for 30 minutes.
export const revalidate = 1800;

export async function GET() {
  const startDate = FESTIVAL_DAYS[0].date;
  const endDate = FESTIVAL_DAYS[FESTIVAL_DAYS.length - 1].date;

  try {
    const response = await fetch(buildOpenMeteoUrl(startDate, endDate), {
      next: { revalidate }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Forecast provider returned ${response.status}.`, days: [] },
        { status: 502 }
      );
    }

    const days = normalizeForecast(await response.json());
    return NextResponse.json(
      { updatedAt: new Date().toISOString(), days },
      {
        headers: {
          "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600"
        }
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Could not reach the forecast provider.", days: [] },
      { status: 502 }
    );
  }
}
