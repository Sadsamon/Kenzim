import Link from "next/link";
import { notFound } from "next/navigation";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { statusLabel, statusTone, kes } from "@/lib/market";
import { fmtDate } from "@/lib/storage";
import StatusControls from "./StatusControls";

export const dynamic = "force-dynamic";

export default async function OrderAdmin({ params }: { params: { id: string } }) {
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound();
  if (!(await can("orders.manage"))) notFound();
  const supabase = createClient();
  const [{ data: o }, { data: items }, { data: fees }] = await Promise.all([
    supabase.from("goods_orders").select("id,member_id,member_name,status,subtotal_usd,fees_usd,total_usd,kes_per_usd,created_at,paid_at").eq("id", params.id).maybeSingle(),
    supabase.from("goods_order_items").select("id,name_snapshot,qty,price_kes_snapshot,line_usd").eq("order_id", params.id),
    supabase.from("goods_order_fees").select("id,name,amount_usd").eq("order_id", params.id),
  ]);
  if (!o) notFound();

  return (
    <>
      <Link href="/admin/market/orders" className="mb-3 inline-block font-semibold text-primary">&lsaquo; Orders</Link>
      <h1 className="text-[28px] font-bold leading-tight">{o.member_name}</h1>
      <p className="mb-3 text-muted">Placed {fmtDate(o.created_at)}{o.paid_at ? ` · paid ${fmtDate(o.paid_at)}` : ""}</p>
      <span className={`rounded-full px-3 py-1 text-sm font-semibold ${statusTone[o.status]}`}>{statusLabel[o.status]}</span>

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
          <div className="flex justify-between"><dt className="text-muted">Items (at {Number(o.kes_per_usd)} KES per USD)</dt><dd className="font-semibold">${Number(o.subtotal_usd).toFixed(2)}</dd></div>
          {(fees ?? []).map((f) => (
            <div key={f.id} className="flex justify-between"><dt className="text-muted">{f.name}</dt><dd className="font-semibold">${Number(f.amount_usd).toFixed(2)}</dd></div>
          ))}
          <div className="flex justify-between border-t border-line pt-3 text-xl font-bold"><dt>Total to collect</dt><dd>${Number(o.total_usd).toFixed(2)}</dd></div>
        </dl>
      </section>

      <StatusControls orderId={o.id} status={o.status} />
    </>
  );
}
