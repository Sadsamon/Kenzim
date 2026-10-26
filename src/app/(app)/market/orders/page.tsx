import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMe } from "@/lib/me";
import { statusLabel, statusTone } from "@/lib/market";
import { fmtDate } from "@/lib/storage";
import EmptyState from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function MyOrders() {
  const me = await getMe();
  const supabase = createClient();
  const { data } = await supabase
    .from("goods_orders")
    .select("id,total_usd,status,created_at")
    .eq("member_id", me?.id ?? "")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <>
      <h1 className="mb-4 text-[28px] font-bold leading-tight">My orders</h1>
      {!data || data.length === 0 ? (
        <EmptyState title="No orders yet" body="When you place an order it will show here, with every step of its journey." />
      ) : (
        <ul className="space-y-3">
          {data.map((o) => (
            <li key={o.id}>
              <Link href={`/market/orders/${o.id}`} className="flex items-center justify-between gap-3 rounded-card bg-surface p-4 shadow-card">
                <div>
                  <p className="font-bold">${Number(o.total_usd).toFixed(2)}</p>
                  <p className="text-sm text-muted">{fmtDate(o.created_at)}</p>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-[13px] font-semibold ${statusTone[o.status]}`}>{statusLabel[o.status]}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
