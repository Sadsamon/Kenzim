import Link from "next/link";
import { notFound } from "next/navigation";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { marketSettings } from "@/lib/market";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function MarketAdmin() {
  const [catalog, orders] = await Promise.all([can("catalog.manage"), can("orders.manage")]);
  if (!catalog && !orders) notFound();
  const supabase = createClient();
  const { rate, collection } = await marketSettings(supabase);

  let open = 0;
  if (orders) {
    const { count } = await supabase.from("goods_orders").select("id", { count: "exact", head: true }).not("status", "in", "(collected,cancelled)");
    open = count ?? 0;
  }
  const card = "block rounded-sheet bg-surface p-5 shadow-card";

  return (
    <>
      <h1 className="mb-4 text-[28px] font-bold leading-tight">Marketplace</h1>
      <ul className="mb-5 space-y-3">
        {orders && (
          <li><Link href="/admin/market/orders" className={card}><p className="text-lg font-bold">Orders</p><p className="text-muted">{open} open order{open === 1 ? "" : "s"}</p></Link></li>
        )}
        {catalog && (
          <>
            <li><Link href="/admin/market/products" className={card}><p className="text-lg font-bold">Products and shops</p><p className="text-muted">Add items from Quickmart, Naivas and others</p></Link></li>
            <li><Link href="/admin/market/fees" className={card}><p className="text-lg font-bold">Fees</p><p className="text-muted">Admin and shipping costs added at checkout</p></Link></li>
          </>
        )}
      </ul>
      {catalog && <SettingsForm rate={rate} collection={collection} />}
    </>
  );
}
