import { FolkPlannerApp } from "@/components/FolkPlannerApp";
import { getScheduleHydrationData } from "@/lib/data";
import { buildFestivalJsonLd, buildSiteJsonLd } from "@/lib/seo";

export default function HomePage() {
  const jsonLd = [buildFestivalJsonLd(), buildSiteJsonLd()];
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FolkPlannerApp {...getScheduleHydrationData()} />
    </>
  );
}
