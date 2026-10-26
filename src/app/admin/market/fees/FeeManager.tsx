"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Fee = { id: string; name: string; kind: string; value: number; active: boolean };

const describe = (f: Fee) =>
  f.kind === "percent_of_subtotal" ? `${Number(f.value)}% of the items total` : f.kind === "flat_per_order" ? `$${Number(f.value).toFixed(2)} per order` : `$${Number(f.value).toFixed(2)} per kg`;

const box = "h-[52px] w-full rounded-[14px] border border-line bg-surface px-4 text-base outline-none focus:border-primary";

export default function FeeManager({ fees }: { fees: Fee[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function call(url: string, method: string, body?: unknown) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
      router.refresh();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <ul className="space-y-3">
        {fees.map((f) => (
          <li key={f.id} className={`rounded-card bg-surface p-4 shadow-card ${f.active ? "" : "opacity-60"}`}>
            <p className="font-bold">{f.name}</p>
            <p className="text-muted">{describe(f)}{f.active ? "" : " (off)"}</p>
            <div className="mt-2 flex gap-2">
              <button type="button" disabled={busy} onClick={() => call("/api/market/fees", "PATCH", { id: f.id, active: !f.active })} className="h-11 px-3 text-sm font-semibold text-primary">
                {f.active ? "Turn off" : "Turn on"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => { if (confirm(`Delete the fee "${f.name}"?`)) call(`/api/market/fees?id=${f.id}`, "DELETE"); }}
                className="h-11 px-3 text-sm font-semibold text-primary"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
        {fees.length === 0 && <li className="rounded-card bg-surface p-4 text-muted shadow-card">No fees yet. Orders will have no extra charges until you add some.</li>}
      </ul>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const fd = new FormData(form);
          if (await call("/api/market/fees", "POST", { name: fd.get("name"), kind: fd.get("kind"), value: fd.get("value") })) form.reset();
        }}
        className="space-y-3 rounded-sheet bg-surface p-5 shadow-card"
      >
        <h2 className="text-lg font-bold">Add a fee</h2>
        <input name="name" placeholder="Name, e.g. Admin fee" maxLength={60} className={box} />
        <select name="kind" defaultValue="percent_of_subtotal" className={box}>
          <option value="percent_of_subtotal">Percent of the items total</option>
          <option value="flat_per_order">Flat amount per order (USD)</option>
          <option value="per_kg">Amount per kilogram (USD)</option>
        </select>
        <input name="value" inputMode="decimal" placeholder="Amount or percent" className={box} />
        <button disabled={busy} className="h-[52px] w-full rounded-[14px] bg-primary font-semibold text-white disabled:opacity-60">Add fee</button>
        {error && <p role="alert" className="rounded-card bg-primary/10 p-3 text-sm font-medium text-primary-dark">{error}</p>}
      </form>
    </div>
  );
}
