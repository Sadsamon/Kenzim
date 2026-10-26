import Link from "next/link";
import { notFound } from "next/navigation";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import ProductForm from "../ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProduct({ params }: { params: { id: string } }) {
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound();
  if (!(await can("catalog.manage"))) notFound();
  const supabase = createClient();
  const [{ data: p }, { data: retailers }] = await Promise.all([
    supabase.from("products").select("id,retailer_id,name,category,description,price_kes,weight_kg,active,image_path").eq("id", params.id).maybeSingle(),
    supabase.from("retailers").select("id,name").order("name"),
  ]);
  if (!p) notFound();
  return (
    <>
      <Link href="/admin/market/products" className="mb-3 inline-block font-semibold text-primary">&lsaquo; Products</Link>
      <h1 className="mb-4 text-[28px] font-bold leading-tight">Edit product</h1>
      <div className="rounded-sheet bg-surface p-5 shadow-card"><ProductForm retailers={retailers ?? []} initial={p} /></div>
    </>
  );
}
