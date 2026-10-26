"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const box = "h-[52px] w-full rounded-[14px] border border-line bg-surface px-4 text-base outline-none focus:border-primary";

export default function SettingsForm({ rate, collection }: { rate: number | null; collection: string | null }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/market/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kesPerUsd: Number(fd.get("rate")), collectionPoint: fd.get("point") }),
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
    <form onSubmit={save} className="space-y-4 rounded-sheet bg-surface p-5 shadow-card">
      <h2 className="text-lg font-bold">Rates and collection</h2>
      <div>
        <label htmlFor="rate" className="mb-1 block text-[15px] font-semibold">Exchange rate: Kenya shillings per 1 US dollar</label>
        <input id="rate" name="rate" inputMode="decimal" defaultValue={rate ?? ""} placeholder="e.g. 129" className={box} />
        <p className="mt-1 text-sm text-muted">Members see product prices in dollars using this rate. Orders keep the rate they were placed at.</p>
      </div>
      <div>
        <label htmlFor="point" className="mb-1 block text-[15px] font-semibold">Collection point</label>
        <input id="point" name="point" defaultValue={collection ?? ""} maxLength={200} placeholder="Where members collect their orders" className={box} />
      </div>
      <button disabled={busy} className="h-[52px] w-full rounded-[14px] bg-ink font-semibold text-white disabled:opacity-60">{busy ? "Saving..." : "Save"}</button>
      {msg && <p role="status" className="text-sm font-semibold text-muted">{msg}</p>}
    </form>
  );
}
