import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { marketSettings } from "@/lib/market";
import CartView from "./CartView";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const { collection } = await marketSettings(createClient());
  return (
    <>
      <Link href="/market" className="mb-3 inline-block font-semibold text-primary">&lsaquo; Keep shopping</Link>
      <h1 className="mb-4 text-[28px] font-bold leading-tight">Your cart</h1>
      <CartView collection={collection} />
    </>
  );
}
