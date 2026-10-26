"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CancelOrder({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function go() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/market/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Could not cancel.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not cancel.");
      setBusy(false);
    }
  }

  if (!asking) {
    return <button type="button" onClick={() => setAsking(true)} className="h-[52px] w-full rounded-[14px] border border-primary font-semibold text-primary">Cancel this order</button>;
  }
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-3">
        <button type="button" disabled={busy} onClick={() => setAsking(false)} className="h-[52px] rounded-[14px] border border-line font-semibold">Keep it</button>
        <button type="button" disabled={busy} onClick={go} className="h-[52px] rounded-[14px] bg-primary font-semibold text-white disabled:opacity-60">{busy ? "Cancelling..." : "Yes, cancel"}</button>
      </div>
      {error && <p role="alert" className="rounded-card bg-primary/10 p-3 text-sm font-medium text-primary-dark">{error}</p>}
    </div>
  );
}
