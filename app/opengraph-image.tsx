import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Newport Folk Festival 2026 schedule and set times planner";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px",
          background: "#17231d",
          color: "#fff9ec"
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 26,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "#e9d9b6"
          }}
        >
          Unofficial Planner
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 84,
            fontWeight: 700,
            lineHeight: 1.05,
            marginTop: 24
          }}
        >
          Newport Folk 2026
        </div>
        <div style={{ display: "flex", fontSize: 46, marginTop: 12, color: "#f0e2c4" }}>
          Schedule &amp; set times · July 24–26
        </div>
        <div style={{ display: "flex", fontSize: 30, marginTop: 32, color: "#b9c7bd" }}>
          Build your itinerary · spot conflicts · Fort Adams
        </div>
        <div style={{ display: "flex", marginTop: 48 }}>
          <div
            style={{
              display: "flex",
              background: "#126a73",
              color: "#ffffff",
              fontSize: 28,
              padding: "14px 28px",
              borderRadius: 999
            }}
          >
            newportfolkschedule.com
          </div>
        </div>
      </div>
    ),
    size
  );
}
