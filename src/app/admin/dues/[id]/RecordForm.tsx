"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const box = "h-[52px] w-full rounded-[14px] border border-line bg-surface px-4 text-base outline-none focus:border-primary";

export default function RecordForm({ memberId, monthly }: { memberId: string; monthly: number | null }) {
  const router = useRouter();
  const [months, setMonths] = useState(1);
  const [amount, setAmount] = useState(monthly ? String(monthly) : "");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    setOk("");
    try {
      const res = await fetch("/api/dues/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, amount: Number(amount), months, method: fd.get("method"), note: fd.get("note") }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Could not record the payment.");
      setOk(`Recorded. Paid until ${json.paidUntil}.`);
      e.currentTarget.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not record the payment.");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="months" className="mb-1 block text-[15px] font-semibold">Months covered</label>
        <select
          id="months"
          value={months}
          onChange={(e) => {
            const n = Number(e.target.value);
            setMonths(n);
            if (monthly) setAmount(String(Math.round(monthly * n * 100) / 100));
          }}
          className={box}
        >
          {[1, 2, 3, 4, 5, 6, 9, 12, 24].map((n) => (
            <option key={n} value={n}>{n} month{n > 1 ? "s" : ""}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="amount" className="mb-1 block text-[15px] font-semibold">Amount received (US dollars)</label>
        <input id="amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={box} />
      </div>
      <div>
        <label htmlFor="method" className="mb-1 block text-[15px] font-semibold">How it was paid</label>
        <select id="method" name="method" defaultValue="cash" className={box}>
          <option value="cash">Cash</option>
          <option value="ecocash">EcoCash</option>
          <option value="bank">Bank</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <label htmlFor="note" className="mb-1 block text-[15px] font-semibold">Note (optional)</label>
        <input id="note" name="note" maxLength={200} className={box} />
      </div>
      {error && <p role="alert" className="rounded-card bg-primary/10 p-3 text-sm font-medium text-primary-dark">{error}</p>}
      {ok && <p role="status" className="rounded-card bg-success/10 p-3 text-sm font-medium text-success">{ok}</p>}
      <button disabled={busy} className="h-[52px] w-full rounded-[14px] bg-primary font-semibold text-white disabled:opacity-60">
        {busy ? "Saving..." : "Record payment"}
      </button>
    </form>
  );
}
