"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart";

export default function CartBar() {
  const items = useCart();
  const path = usePathname();
  const count = items.reduce((n, i) => n + i.qty, 0);
  if (count === 0 || path.startsWith("/market/cart")) return null;
  return (
    <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 px-4 pb-2">
      <Link href="/market/cart" className="mx-auto flex h-[52px] max-w-md items-center justify-between rounded-[14px] bg-ink px-5 font-semibold text-white shadow-card">
        <span>View cart</span>
        <span className="rounded-full bg-accent px-3 py-1 text-sm text-ink">{count} item{count > 1 ? "s" : ""}</span>
      </Link>
    </div>
  );
}
