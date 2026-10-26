import Link from "next/link";
import { getMe } from "@/lib/me";
import VerifyGate from "@/components/ui/VerifyGate";
import CartBar from "@/components/market/CartBar";

export default async function MarketLayout({ children }: { children: React.ReactNode }) {
  const me = await getMe();
  if (me && me.status !== "verified") {
    return (
      <>
        <h1 className="mb-4 text-[28px] font-bold leading-tight">Marketplace</h1>
        <VerifyGate me={me} feature="marketplace" />
      </>
    );
  }
  const tab = "flex h-11 flex-1 items-center justify-center rounded-full bg-surface text-[15px] font-semibold shadow-card";
  return (
    <>
      <div className="mb-4 flex gap-2">
        <Link href="/market" className={tab}>Shop</Link>
        <Link href="/market/orders" className={tab}>My orders</Link>
      </div>
      {children}
      <CartBar />
    </>
  );
}
