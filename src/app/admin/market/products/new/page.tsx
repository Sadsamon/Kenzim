import Link from "next/link";
import { notFound } from "next/navigation";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import ProductForm from "../ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProduct() {
  if (!(await can("catalog.manage"))) notFound();
  const { data: retailers } = await createClient().from("retailers").select("id,name").eq("active", true).order("name");
  return (
    <>
      <Link href="/admin/market/products" className="mb-3 inline-block font-semibold text-primary">&lsaquo; Products</Link>
      <h1 className="mb-4 text-[28px] font-bold leading-tight">Add product</h1>
      <div className="rounded-sheet bg-surface p-5 shadow-card"><ProductForm retailers={retailers ?? []} /></div>
    </>
  );
}
