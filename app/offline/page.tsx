import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-paper px-4 py-8 text-ink">
      <section className="mx-auto max-w-xl rounded-[2rem] bg-white p-6 text-center shadow-soft">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-bay">Offline</p>
        <h1 className="mt-3 text-4xl font-black">You’re offline.</h1>
        <p className="mt-4 text-ink/70">
          If you saved the planner for offline use, your schedule and selections should still be available.
          AI chat and external Spotify links require an internet connection.
        </p>
        <Link className="mt-6 inline-block rounded-full bg-ink px-5 py-3 font-bold text-paper" href="/">
          Open saved planner
        </Link>
      </section>
    </main>
  );
}
