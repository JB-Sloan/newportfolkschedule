import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Folk Planner 2026",
    short_name: "Folk Planner",
    description: "Unofficial offline-first Newport Folk personal schedule planner.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fff9ec",
    theme_color: "#17231d",
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable"
      }
    ]
  };
}
