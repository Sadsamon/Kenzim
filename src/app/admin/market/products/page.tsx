import Link from "next/link";
import { notFound } from "next/navigation";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { kes } from "@/lib/market";
import RetailerManager from "./RetailerManager";

export const dynamic = "force-dynamic";

export default async function ProductsAdmin() {
  if (!(await can("catalog.manage"))) notFound();
  const supabase = createClient();
  const [{ data: products }, { data: retailers }] = await Promise.all([
    supabase.from("products").select("id,name,price_kes,active,retailers(name)").order("name").limit(400),
    supabase.from("retailers").select("id,name,active").order("name"),
  ]);

  return (
    <>
      <Link href="/admin/market" className="mb-3 inline-block font-semibold text-primary">&lsaquo; Marketplace</Link>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-[28px] font-bold leading-tight">Products</h1>
        <Link href="/admin/market/products/new" className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white">Add product</Link>
      </div>

      <ul className="mb-6 space-y-3">
        {(products ?? []).map((p) => {
          const shop = Array.isArray(p.retailers) ? p.retailers[0]?.name : (p.retailers as { name: string } | null)?.name;
          return (
            <li key={p.id}>
              <Link href={`/admin/market/products/${p.id}`} className={`flex items-center justify-between gap-3 rounded-card bg-surface p-4 shadow-card ${p.active ? "" : "opacity-60"}`}>
                <div>
                  <p className="font-bold">{p.name}</p>
                  <p className="text-sm text-muted">{shop} · {kes(p.price_kes)}{p.active ? "" : " · hidden"}</p>
                </div>
                <span aria-hidden="true" className="text-primary">&rsaquo;</span>
              </Link>
            </li>
          );
        })}
        {(products ?? []).length === 0 && <li className="rounded-card bg-surface p-4 text-muted shadow-card">No products yet. Add the first one.</li>}
      </ul>

      <RetailerManager retailers={retailers ?? []} />
    </>
  );
}
