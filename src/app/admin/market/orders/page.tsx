import Link from "next/link";
import { notFound } from "next/navigation";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { statusLabel, statusTone } from "@/lib/market";
import { fmtDate } from "@/lib/storage";

export const dynamic = "force-dynamic";

const FILTERS: [string, string][] = [
  ["open", "Open"], ["placed", "Unpaid"], ["paid", "Paid"], ["ordered", "Ordered"], ["in_transit", "On its way"],
  ["ready_for_collection", "Ready"], ["collected", "Collected"], ["cancelled", "Cancelled"], ["all", "All"],
];

export default async function OrdersAdmin({ searchParams }: { searchParams: { s?: string } }) {
  if (!(await can("orders.manage"))) notFound();
  const f = FILTERS.some(([k]) => k === searchParams.s) ? searchParams.s! : "open";
  let q = createClient().from("goods_orders").select("id,member_name,total_usd,status,created_at").order("created_at", { ascending: false }).limit(100);
  if (f === "open") q = q.not("status", "in", "(collected,cancelled)");
  else if (f !== "all") q = q.eq("status", f);
  const { data } = await q;

  return (
    <>
      <Link href="/admin/market" className="mb-3 inline-block font-semibold text-primary">&lsaquo; Marketplace</Link>
      <h1 className="mb-4 text-[28px] font-bold leading-tight">Orders</h1>
      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(([k, label]) => (
          <Link key={k} href={`/admin/market/orders?s=${k}`} className={`flex h-11 shrink-0 items-center rounded-full px-4 text-[15px] font-semibold ${f === k ? "bg-primary text-white" : "bg-surface shadow-card"}`}>{label}</Link>
        ))}
      </div>
      <ul className="space-y-3">
        {(data ?? []).map((o) => (
          <li key={o.id}>
            <Link href={`/admin/market/orders/${o.id}`} className="flex items-center justify-between gap-3 rounded-card bg-surface p-4 shadow-card">
              <div>
                <p className="font-bold">{o.member_name}</p>
                <p className="text-sm text-muted">${Number(o.total_usd).toFixed(2)} · {fmtDate(o.created_at)}</p>
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1 text-[13px] font-semibold ${statusTone[o.status]}`}>{statusLabel[o.status]}</span>
            </Link>
          </li>
        ))}
        {(data ?? []).length === 0 && <li className="rounded-card bg-surface p-4 text-muted shadow-card">No orders here.</li>}
      </ul>
    </>
  );
}
