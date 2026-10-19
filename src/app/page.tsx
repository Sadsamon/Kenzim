import RegisterSW from "@/components/RegisterSW";

const tiles = [
  { label: "Events", note: "Gatherings and embassy days" },
  { label: "Directory", note: "Verified people and businesses" },
  { label: "Groups", note: "Your city, your circle" },
  { label: "Market", note: "Coming soon" },
];

export default function Home() {
  return (
    <main className="mx-auto min-h-screen max-w-md px-4 pb-24 pt-8">
      <RegisterSW />
      <header className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192.png" alt="Kenzim logo" width={48} height={48} className="rounded-card" />
        <div>
          <h1 className="text-[28px] font-bold leading-tight">Karibu to Kenzim</h1>
          <p className="text-muted">The Kenyan community, together in Zimbabwe.</p>
        </div>
      </header>

      <section className="mt-6 rounded-sheet bg-surface p-5 shadow-card">
        <span className="inline-block rounded-full bg-accent px-3 py-1 text-sm font-semibold text-ink">
          Phase 1 · Foundation
        </span>
        <p className="mt-3">
          The app shell is live. Sign-in, events and the directory are coming next.
        </p>
        <button className="mt-4 h-[52px] w-full rounded-[14px] bg-primary font-semibold text-white active:scale-[0.98] active:bg-primary-dark">
          Get started
        </button>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-card bg-surface p-4 shadow-card">
            <h2 className="text-lg font-semibold">{t.label}</h2>
            <p className="mt-1 text-sm text-muted">{t.note}</p>
          </div>
        ))}
      </section>

      <p className="mt-6 flex items-center gap-2 text-sm text-muted">
        <span className="h-2.5 w-2.5 rounded-full bg-success" /> App online
      </p>
    </main>
  );
}
