"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cart, useCart } from "@/lib/cart";

type Quote = {
  lines: { id: string; name: string; qty: number; price_kes: number; line_usd: number }[];
  fees: { name: string; amount_usd: number }[];
  subtotal_usd: number;
  total_usd: number;
};

const usd = (n: number) => `$${Number(n).toFixed(2)}`;

export default function CartView({ collection }: { collection: string | null }) {
  const router = useRouter();
  const items = useCart();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      setQuote(null);
      setError("");
      return;
    }
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/market/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
        });
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setQuote(null);
          setError(json.error ?? "Could not work out your total.");
        } else {
          setQuote(json);
          setError("");
        }
      } catch {
        if (!cancelled) setError("No connection. Please try again.");
      }
      if (!cancelled) setLoading(false);
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [items]);

  async function place() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/market/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Could not place the order.");
      cart.clear();
      router.push(`/market/orders/${json.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not place the order.");
      setBusy(false);
    }
  }

  if (items.length === 0) {
    return <p className="rounded-sheet bg-surface p-6 text-center text-muted shadow-card">Your cart is empty.</p>;
  }

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="rounded-card bg-primary/10 p-3 text-sm font-medium text-primary-dark">{error}</p>}

      {quote && (
        <section className={`rounded-sheet bg-surface p-5 shadow-card ${loading ? "opacity-60" : ""}`}>
          <ul className="divide-y divide-line">
            {quote.lines.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-semibold leading-snug">{l.name}</p>
                  <p className="text-sm text-muted">{usd(l.line_usd)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button type="button" onClick={() => cart.setQty(l.id, l.qty - 1)} aria-label={`Remove one ${l.name}`} className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-xl font-bold">&minus;</button>
                  <span className="w-8 text-center font-bold">{l.qty}</span>
                  <button type="button" onClick={() => cart.setQty(l.id, l.qty + 1)} aria-label={`Add one more ${l.name}`} className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">+</button>
                </div>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-2 border-t border-line pt-3">
            <div className="flex justify-between"><dt className="text-muted">Items</dt><dd className="font-semibold">{usd(quote.subtotal_usd)}</dd></div>
            {quote.fees.map((f) => (
              <div key={f.name} className="flex justify-between"><dt className="text-muted">{f.name}</dt><dd className="font-semibold">{usd(f.amount_usd)}</dd></div>
            ))}
            <div className="flex justify-between border-t border-line pt-3 text-xl font-bold"><dt>Total</dt><dd>{usd(quote.total_usd)}</dd></div>
          </dl>
        </section>
      )}

      {!quote && !error && <p className="rounded-sheet bg-surface p-6 text-center text-muted shadow-card">Working out your total...</p>}

      <section className="rounded-sheet bg-surface p-5 text-[15px] shadow-card">
        <h2 className="mb-2 text-lg font-bold">How it works</h2>
        <ol className="list-decimal space-y-1 pl-5 text-muted">
          <li>Place your order here.</li>
          <li>Pay the Treasurer. The order is confirmed once they record your payment.</li>
          <li>We order and ship the goods to Zimbabwe.</li>
          <li>Collect them at {collection ?? "the collection point (to be announced)"}.</li>
        </ol>
      </section>

      <button type="button" disabled={busy || !quote} onClick={place} className="h-[52px] w-full rounded-[14px] bg-primary font-semibold text-white disabled:opacity-60">
        {busy ? "Placing order..." : "Place order"}
      </button>
      <button type="button" onClick={() => cart.clear()} className="h-11 w-full text-sm font-semibold text-muted">Empty cart</button>
    </div>
  );
}
