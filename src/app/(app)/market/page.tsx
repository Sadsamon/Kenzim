import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { marketSettings, kes } from "@/lib/market";
import { publicUrl } from "@/lib/storage";
import AddToCart from "@/components/market/AddToCart";
import EmptyState from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

type Row = {
  id: string; name: string; category: string | null; description: string | null; image_path: string | null;
  price_kes: number; retailer_id: string; retailers: { name: string; active: boolean } | { name: string; active: boolean }[] | null;
};

export default async function Shop({ searchParams }: { searchParams: { q?: string; r?: string; c?: string } }) {
  const supabase = createClient();
  const [{ data }, { data: retailers }, { rate, collection }] = await Promise.all([
    supabase.from("products").select("id,name,category,description,image_path,price_kes,retailer_id,retailers(name,active)").eq("active", true).order("name").limit(300),
    supabase.from("retailers").select("id,name").eq("active", true).order("name"),
    marketSettings(supabase),
  ]);

  const products = ((data ?? []) as unknown as Row[])
    .map((p) => ({ ...p, retailer: Array.isArray(p.retailers) ? p.retailers[0] : p.retailers }))
    .filter((p) => p.retailer?.active);

  const q = (searchParams.q ?? "").trim().toLowerCase();
  const r = searchParams.r ?? "";
  const c = searchParams.c ?? "";
  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean) as string[])).sort();
  const shown = products.filter(
    (p) => (!q || p.name.toLowerCase().includes(q)) && (!r || p.retailer_id === r) && (!c || p.category === c)
  );

  const href = (nr: string, nc: string) => {
    const sp = new URLSearchParams();
    if (searchParams.q) sp.set("q", searchParams.q);
    if (nr) sp.set("r", nr);
    if (nc) sp.set("c", nc);
    const s = sp.toString();
    return s ? `/market?${s}` : "/market";
  };
  const chip = (active: boolean, to: string, label: string) => (
    <Link key={label} href={to} className={`flex h-11 shrink-0 items-center rounded-full px-4 text-[15px] font-semibold ${active ? "bg-primary text-white" : "bg-surface shadow-card"}`}>{label}</Link>
  );

  return (
    <div className="pb-16">
      <h1 className="mb-1 text-[28px] font-bold leading-tight">Goods from Kenya</h1>
      <p className="mb-4 text-muted">Order your favourites from Kenyan shops. Delivery and admin fees are added at checkout.</p>

      {!rate && <p className="mb-4 rounded-card bg-accent p-3 font-semibold">Prices in dollars will appear once the Treasurer sets the exchange rate.</p>}
      {collection && <p className="mb-4 rounded-card bg-surface p-3 text-sm text-muted shadow-card">Collection point: {collection}</p>}

      <form className="mb-3">
        {r && <input type="hidden" name="r" value={r} />}
        {c && <input type="hidden" name="c" value={c} />}
        <input name="q" defaultValue={searchParams.q ?? ""} placeholder="Search products" aria-label="Search products" className="h-[52px] w-full rounded-[14px] border border-line bg-surface px-4 text-base outline-none focus:border-primary" />
      </form>
      <div className="no-scrollbar mb-2 flex gap-2 overflow-x-auto pb-1">
        {chip(!r, href("", c), "All shops")}
        {(retailers ?? []).map((x) => chip(r === x.id, href(x.id, c), x.name))}
      </div>
      {categories.length > 0 && (
        <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1">
          {chip(!c, href(r, ""), "All types")}
          {categories.map((x) => chip(c === x, href(r, x), x))}
        </div>
      )}

      {shown.length === 0 ? (
        <EmptyState title="Nothing here yet" body="Products will be added soon. Try another shop or search." />
      ) : (
        <ul className="space-y-3">
          {shown.map((p) => {
            const img = publicUrl("product-images", p.image_path);
            return (
              <li key={p.id} className="flex gap-4 rounded-sheet bg-surface p-4 shadow-card">
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt="" loading="lazy" className="h-24 w-24 shrink-0 rounded-card object-cover" />
                ) : (
                  <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-card bg-line text-3xl font-bold text-muted" aria-hidden="true">{p.name.charAt(0)}</span>
                )}
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="text-[13px] font-semibold text-primary">{p.retailer?.name}</p>
                  <h3 className="text-lg font-bold leading-snug">{p.name}</h3>
                  {p.description && <p className="line-clamp-2 text-sm text-muted">{p.description}</p>}
                  <div className="mt-2 flex items-end justify-between gap-2">
                    <div>
                      {rate ? <p className="text-lg font-bold">${(p.price_kes / rate).toFixed(2)}</p> : null}
                      <p className="text-sm text-muted">{kes(p.price_kes)}</p>
                    </div>
                    <AddToCart productId={p.id} name={p.name} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
