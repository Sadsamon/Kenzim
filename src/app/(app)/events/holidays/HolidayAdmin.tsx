"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const box = "w-full rounded-[14px] border border-line bg-surface px-4 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 h-[52px]";

export default function HolidayAdmin() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: fd.get("country"), name: fd.get("name"), date: fd.get("date"), note: fd.get("note") }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Could not save.");
      form.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-3 rounded-sheet bg-surface p-5 shadow-card">
      <h2 className="text-lg font-bold">Add a holiday</h2>
      <select name="country" className={box} defaultValue="KE">
        <option value="KE">Kenya</option>
        <option value="ZW">Zimbabwe</option>
      </select>
      <input name="name" placeholder="Holiday name" maxLength={80} className={box} />
      <input name="date" type="date" className={box} />
      <input name="note" placeholder="Note (optional)" maxLength={120} className={box} />
      {error && <p role="alert" className="rounded-card bg-primary/10 p-3 text-sm font-medium text-primary-dark">{error}</p>}
      <button disabled={busy} className="h-[52px] w-full rounded-[14px] bg-primary font-semibold text-white disabled:opacity-60">
        {busy ? "Saving..." : "Add holiday"}
      </button>
    </form>
  );
}
