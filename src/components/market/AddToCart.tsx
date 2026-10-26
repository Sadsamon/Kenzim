"use client";
import { cart, useCart } from "@/lib/cart";

export default function AddToCart({ productId, name }: { productId: string; name: string }) {
  const items = useCart();
  const qty = items.find((i) => i.id === productId)?.qty ?? 0;

  if (qty === 0) {
    return (
      <button type="button" onClick={() => cart.setQty(productId, 1)} aria-label={`Add ${name} to cart`} className="h-11 rounded-full bg-primary px-5 text-[15px] font-semibold text-white active:bg-primary-dark">
        Add
      </button>
    );
  }
  return (
    <div className="flex items-center gap-1" role="group" aria-label={`${name} quantity`}>
      <button type="button" onClick={() => cart.setQty(productId, qty - 1)} aria-label="Remove one" className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-xl font-bold">&minus;</button>
      <span className="w-8 text-center text-lg font-bold" aria-live="polite">{qty}</span>
      <button type="button" onClick={() => cart.setQty(productId, qty + 1)} aria-label="Add one more" className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">+</button>
    </div>
  );
}
