import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Folk Planner 2026",
  description: "Unofficial offline-first Newport Folk personal schedule planner.",
  applicationName: "Folk Planner 2026",
  appleWebApp: {
    capable: true,
    title: "Folk Planner"
  },
  openGraph: {
    title: "Folk Planner 2026",
    description: "Build a personal Newport Folk itinerary, spot conflicts, and export a plan.",
    type: "website"
  }
};

export const viewport: Viewport = {
  themeColor: "#17231d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
