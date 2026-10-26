import Link from "next/link";
import { notFound } from "next/navigation";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import FeeManager from "./FeeManager";

export const dynamic = "force-dynamic";

export default async function FeesAdmin() {
  if (!(await can("catalog.manage"))) notFound();
  const { data } = await createClient().from("fee_rules").select("id,name,kind,value,active").order("name");
  return (
    <>
      <Link href="/admin/market" className="mb-3 inline-block font-semibold text-primary">&lsaquo; Marketplace</Link>
      <h1 className="mb-1 text-[28px] font-bold leading-tight">Fees</h1>
      <p className="mb-4 text-muted">Every active fee is added automatically to each order at checkout.</p>
      <FeeManager fees={data ?? []} />
    </>
  );
}
