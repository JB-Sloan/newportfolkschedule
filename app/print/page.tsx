import { PrintPlan } from "@/components/PrintPlan";
import { artists, manifest, scheduleItems, stages } from "@/lib/data";

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
