"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function VoidButton({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function go() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/dues/void", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, reason }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Could not void the payment.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not void the payment.");
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-2 h-11 text-sm font-semibold text-primary">
        Void this payment
      </button>
    );
  }
  return (
    <div className="mt-3 space-y-2">
      <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (for example, wrong amount)" maxLength={200} className="h-[52px] w-full rounded-[14px] border border-line bg-surface px-4 text-base" />
      <div className="grid grid-cols-2 gap-3">
        <button type="button" disabled={busy} onClick={() => setOpen(false)} className="h-11 rounded-[12px] border border-line text-sm font-semibold">Keep it</button>
        <button type="button" disabled={busy || reason.trim().length < 3} onClick={go} className="h-11 rounded-[12px] bg-primary text-sm font-semibold text-white disabled:opacity-60">
          {busy ? "Voiding..." : "Yes, void"}
        </button>
      </div>
      {error && <p role="alert" className="text-sm font-medium text-primary-dark">{error}</p>}
    </div>
  );
}
