import type { Metadata } from "next";
import { PrintPlan } from "@/components/PrintPlan";
import { artists, manifest, scheduleItems, stages } from "@/lib/data";

export const metadata: Metadata = {
  title: "Print pocket plan",
  robots: { index: false, follow: true }
};

export default function PrintPage() {
  return (
    <PrintPlan
      manifest={manifest}
      scheduleItems={scheduleItems}
      artists={artists}
      stages={stages}
    />
  );
}
