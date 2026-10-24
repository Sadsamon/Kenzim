"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Status = "going" | "interested" | "declined";

export default function RsvpPanel({ eventId, current, guests: initialGuests }: { eventId: string; current: Status | null; guests: number }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status | null>(current);
  const [guests, setGuests] = useState(initialGuests);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function send(next: Status, g = guests) {
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next, guests: g }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Could not save your reply.");
      setStatus(next);
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your reply.");
    }
    setBusy(false);
  }

  const btn = (s: Status, label: string) => (
    <button
      type="button"
      disabled={busy}
      onClick={() => send(s)}
      className={`h-[52px] rounded-[14px] text-[15px] font-semibold ${
        status === s ? (s === "going" ? "bg-success text-white" : "bg-ink text-white") : "border border-line bg-surface"
      }`}
    >
      {label}
    </button>
  );

  return (
    <section className="rounded-sheet bg-surface p-5 shadow-card">
      <h2 className="mb-3 text-lg font-bold">Will you come?</h2>
      <div className="grid grid-cols-3 gap-2">
        {btn("going", "Going")}
        {btn("interested", "Maybe")}
        {btn("declined", "Can\u2019t")}
      </div>
      {status === "going" && (
        <div className="mt-4">
          <label htmlFor="guests" className="mb-1 block text-[15px] font-semibold">Family and friends coming with you</label>
          <select
            id="guests"
            value={guests}
            disabled={busy}
            onChange={(e) => {
              const g = Number(e.target.value);
              setGuests(g);
              send("going", g);
            }}
            className="h-[52px] w-full rounded-[14px] border border-line bg-surface px-4 text-base"
          >
            {Array.from({ length: 11 }, (_, i) => (
              <option key={i} value={i}>{i === 0 ? "Just me" : `${i} guest${i > 1 ? "s" : ""}`}</option>
            ))}
          </select>
        </div>
      )}
      {saved && <p role="status" className="mt-3 text-sm font-semibold text-success">Reply saved. Thank you!</p>}
      {error && <p role="alert" className="mt-3 rounded-card bg-primary/10 p-3 text-sm font-medium text-primary-dark">{error}</p>}
    </section>
  );
}
