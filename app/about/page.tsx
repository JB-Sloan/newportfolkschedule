import Link from "next/link";
import { manifest, policies } from "@/lib/data";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-paper px-4 py-8 text-ink">
      <section className="mx-auto max-w-3xl rounded-[2rem] bg-white p-6 shadow-soft">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-bay">About</p>
        <h1 className="mt-3 text-4xl font-black">Folk Planner 2026</h1>
        <p className="mt-4 text-lg text-ink/75">
          This is an unofficial fan-made planning tool for Newport Folk Festival. It is not affiliated with
          or endorsed by Newport Festivals Foundation. Schedule information is subject to change; confirm
          critical details with Newport Folk.
        </p>
        <div className="mt-5 rounded-2xl bg-paper p-4">
          <h2 className="font-black">Data status</h2>
          <p className="mt-1 text-sm text-ink/70">
            Current schedule version: {manifest.scheduleVersion}. {manifest.notes}
          </p>
          <a className="mt-2 inline-block font-bold text-bay" href={manifest.officialScheduleUrl}>
            Official schedule source
          </a>
        </div>
        <h2 className="mt-6 text-2xl font-black">Policy summaries</h2>
        <div className="mt-3 space-y-3">
          {policies.map((policy) => (
            <article key={policy.id} className="rounded-2xl bg-paper p-4">
              <h3 className="font-bold">{policy.title}</h3>
              <p className="mt-1 text-sm text-ink/70">{policy.summary}</p>
              <a className="mt-2 inline-block text-sm font-bold text-bay" href={policy.officialSourceUrl}>
                Official source
              </a>
            </article>
          ))}
        </div>
        <Link className="mt-6 inline-block rounded-full bg-ink px-5 py-3 font-bold text-paper" href="/">
          Back to planner
        </Link>
      </section>
    </main>
  );
}
