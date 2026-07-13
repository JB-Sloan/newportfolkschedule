import { FolkPlannerApp } from "@/components/FolkPlannerApp";
import { getScheduleHydrationData } from "@/lib/data";

export default function HomePage() {
  return <FolkPlannerApp {...getScheduleHydrationData()} />;
}
