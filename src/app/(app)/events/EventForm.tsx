"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { fromLocalInput } from "@/lib/dates";

const box = "w-full rounded-[14px] border border-line bg-surface px-4 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

type Initial = {
  id?: string;
  title?: string;
  category?: string;
  location?: string | null;
  description?: string | null;
  start?: string; // datetime-local value
  end?: string;
};

export default function EventForm({ initial }: { initial?: Initial }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const editing = !!initial?.id;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const start = String(fd.get("start") ?? "");
    const end = String(fd.get("end") ?? "");
    if (!start) return setError("Choose a start date and time.");
    setBusy(true);
    try {
      const res = await fetch(editing ? `/api/events/${initial!.id}` : "/api/events", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: fd.get("title"),
          category: fd.get("category"),
          location: fd.get("location"),
          description: fd.get("description"),
          startsAt: fromLocalInput(start),
          endsAt: end ? fromLocalInput(end) : "",
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
      router.push(`/events/${json.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="mb-1 block text-[15px] font-semibold">Event name</label>
        <input id="title" name="title" defaultValue={initial?.title} maxLength={120} className={`${box} h-[52px]`} />
      </div>
      <div>
        <label htmlFor="category" className="mb-1 block text-[15px] font-semibold">Type</label>
        <select id="category" name="category" defaultValue={initial?.category ?? "community"} className={`${box} h-[52px]`}>
          <option value="kenya_club">Kenya Club</option>
          <option value="fun_day">Fun Day</option>
          <option value="community">Community</option>
          <option value="embassy">Embassy</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <label htmlFor="start" className="mb-1 block text-[15px] font-semibold">Starts (Zimbabwe time)</label>
        <input id="start" name="start" type="datetime-local" defaultValue={initial?.start} className={`${box} h-[52px]`} />
      </div>
      <div>
        <label htmlFor="end" className="mb-1 block text-[15px] font-semibold">Ends (optional)</label>
        <input id="end" name="end" type="datetime-local" defaultValue={initial?.end} className={`${box} h-[52px]`} />
      </div>
      <div>
        <label htmlFor="location" className="mb-1 block text-[15px] font-semibold">Where</label>
        <input id="location" name="location" defaultValue={initial?.location ?? ""} maxLength={120} className={`${box} h-[52px]`} />
      </div>
      <div>
        <label htmlFor="description" className="mb-1 block text-[15px] font-semibold">Details</label>
        <textarea id="description" name="description" rows={7} defaultValue={initial?.description ?? ""} maxLength={3000} className={`${box} py-3`} />
        <p className="mt-1 text-sm text-muted">Leave a blank line between paragraphs.</p>
      </div>
      {error && <p role="alert" className="rounded-card bg-primary/10 p-3 text-sm font-medium text-primary-dark">{error}</p>}
      <button disabled={busy} className="h-[52px] w-full rounded-[14px] bg-primary font-semibold text-white disabled:opacity-60">
        {busy ? "Saving..." : editing ? "Save changes" : "Create event"}
      </button>
    </form>
  );
}
