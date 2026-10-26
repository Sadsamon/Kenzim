"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STEPS, statusLabel } from "@/lib/market";

export default function StatusControls({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [askCancel, setAskCancel] = useState(false);

  if (status === "collected" || status === "cancelled") return null;
  const idx = ORDER_STEPS.indexOf(status as (typeof ORDER_STEPS)[number]);
  const next = ORDER_STEPS[idx + 1];
  const later = ORDER_STEPS.slice(idx + 2);

  async function set(s: string) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/market/orders/${orderId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: s }) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Could not update the order.");
      setAskCancel(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update the order.");
    }
    setBusy(false);
  }

  return (
    <section className="mt-4 space-y-3 rounded-sheet bg-surface p-5 shadow-card">
      <h2 className="text-lg font-bold">Update this order</h2>
      <p className="text-sm text-muted">The member gets a notification each time you move the order forward.</p>
      {next && (
        <button type="button" disabled={busy} onClick={() => set(next)} className="h-[52px] w-full rounded-[14px] bg-success font-semibold text-white disabled:opacity-60">
          {next === "paid" ? "Mark as paid (payment received)" : `Move to: ${statusLabel[next]}`}
        </button>
      )}
      {later.length > 0 && (
        <details>
          <summary className="cursor-pointer py-2 text-sm font-semibold text-muted">Skip ahead</summary>
          <div className="mt-2 grid gap-2">
            {later.map((s) => (
              <button key={s} type="button" disabled={busy} onClick={() => set(s)} className="h-11 rounded-[12px] border border-line text-sm font-semibold">{statusLabel[s]}</button>
            ))}
          </div>
        </details>
      )}
      {!askCancel ? (
        <button type="button" onClick={() => setAskCancel(true)} className="h-11 w-full text-sm font-semibold text-primary">Cancel this order</button>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button type="button" disabled={busy} onClick={() => setAskCancel(false)} className="h-11 rounded-[12px] border border-line text-sm font-semibold">Keep it</button>
          <button type="button" disabled={busy} onClick={() => set("cancelled")} className="h-11 rounded-[12px] bg-primary text-sm font-semibold text-white">Yes, cancel</button>
        </div>
      )}
      {error && <p role="alert" className="rounded-card bg-primary/10 p-3 text-sm font-medium text-primary-dark">{error}</p>}
    </section>
  );
}
