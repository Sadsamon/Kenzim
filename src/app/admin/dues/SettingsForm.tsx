"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { money } from "@/lib/dues";

export default function SettingsForm({ current, canEdit }: { current: number | null; canEdit: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState(current ? String(current) : "");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  if (!canEdit) {
    return <p className="rounded-card bg-surface p-4 text-muted shadow-card">Monthly dues: {current ? money(current) : "not set yet"}</p>;
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/dues/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthly: Number(value) }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? `Could not save (server said ${res.status}).`);
      setMsg("Saved.");
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Could not save.");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={save} className="rounded-sheet bg-surface p-4 shadow-card">
      <label htmlFor="monthly" className="mb-1 block text-[15px] font-semibold">Monthly dues (US dollars)</label>
      <div className="flex gap-3">
        <input id="monthly" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder="e.g. 5" className="h-[52px] w-full rounded-[14px] border border-line bg-surface px-4 text-base outline-none focus:border-primary" />
        <button disabled={busy} className="h-[52px] shrink-0 rounded-[14px] bg-ink px-5 font-semibold text-white disabled:opacity-60">Save</button>
      </div>
      {msg && <p role="status" className="mt-2 text-sm font-semibold text-muted">{msg}</p>}
    </form>
  );
}
