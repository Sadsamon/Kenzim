import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { marketSettings, ORDER_STEPS, statusLabel, statusTone, kes } from "@/lib/market";
import { fmtDate } from "@/lib/storage";
import CancelOrder from "./CancelOrder";

export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: { params: { id: string } }) {
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound();
  const supabase = createClient();
  const [{ data: o }, { data: items }, { data: fees }, { collection }] = await Promise.all([
    supabase.from("goods_orders").select("id,status,subtotal_usd,fees_usd,total_usd,created_at").eq("id", params.id).maybeSingle(),
    supabase.from("goods_order_items").select("id,name_snapshot,qty,price_kes_snapshot,line_usd").eq("order_id", params.id),
    supabase.from("goods_order_fees").select("id,name,amount_usd").eq("order_id", params.id),
    marketSettings(supabase),
  ]);
  if (!o) notFound();
  const idx = ORDER_STEPS.indexOf(o.status as (typeof ORDER_STEPS)[number]);

  return (
    <>
      <Link href="/market/orders" className="mb-3 inline-block font-semibold text-primary">&lsaquo; My orders</Link>
      <h1 className="text-[28px] font-bold leading-tight">Order</h1>
      <p className="mb-4 text-muted">{fmtDate(o.created_at)}</p>

      <section className="rounded-sheet bg-surface p-5 shadow-card">
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${statusTone[o.status]}`}>{statusLabel[o.status]}</span>
        {o.status !== "cancelled" && (
          <ol className="mt-4 space-y-3">
            {ORDER_STEPS.map((s, i) => (
              <li key={s} className="flex items-center gap-3">
                <span aria-hidden="true" className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${i <= idx ? "bg-success text-white" : "border border-line text-muted"}`}>{i <= idx ? "\u2713" : ""}</span>
                <span className={i <= idx ? "font-semibold" : "text-muted"}>{statusLabel[s]}</span>
              </li>
            ))}
          </ol>
        )}
        {o.status === "placed" && (
          <p className="mt-4 rounded-card bg-accent p-3 text-sm font-semibold">Pay ${Number(o.total_usd).toFixed(2)} to the Treasurer to confirm your order.</p>
        )}
        {o.status === "ready_for_collection" && <p className="mt-4 rounded-card bg-success/10 p-3 text-sm font-semibold text-success">Collect at {collection ?? "the collection point"}.</p>}
      </section>

      <section className="mt-4 rounded-sheet bg-surface p-5 shadow-card">
        <ul className="divide-y divide-line">
          {(items ?? []).map((i) => (
            <li key={i.id} className="flex justify-between gap-3 py-2">
              <span>{i.qty} x {i.name_snapshot}<span className="block text-sm text-muted">{kes(i.price_kes_snapshot)} each</span></span>
              <span className="font-semibold">${Number(i.line_usd).toFixed(2)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-2 border-t border-line pt-3">
          <div className="flex justify-between"><dt className="text-muted">Items</dt><dd className="font-semibold">${Number(o.subtotal_usd).toFixed(2)}</dd></div>
          {(fees ?? []).map((f) => (
            <div key={f.id} className="flex justify-between"><dt className="text-muted">{f.name}</dt><dd className="font-semibold">${Number(f.amount_usd).toFixed(2)}</dd></div>
          ))}
          <div className="flex justify-between border-t border-line pt-3 text-xl font-bold"><dt>Total</dt><dd>${Number(o.total_usd).toFixed(2)}</dd></div>
        </dl>
      </section>

      {o.status === "placed" && <div className="mt-4"><CancelOrder orderId={o.id} /></div>}
    </>
  );
}
