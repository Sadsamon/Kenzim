"use client";
import { useSyncExternalStore } from "react";

export type CartItem = { id: string; qty: number };

const KEY = "kenzim-cart";
const EMPTY: CartItem[] = [];
const listeners = new Set<() => void>();
let cache: CartItem[] | null = null;

function load(): CartItem[] {
  if (cache) return cache;
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    cache = Array.isArray(raw)
      ? raw.filter((x) => x && typeof x.id === "string" && Number.isInteger(x.qty) && x.qty >= 1 && x.qty <= 100)
      : [];
  } catch {
    cache = [];
  }
  return cache!;
}

function save(items: CartItem[]) {
  cache = items;
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* storage can be unavailable; the cart then lives only for this visit */
  }
  listeners.forEach((l) => l());
}

export const cart = {
  setQty(id: string, qty: number) {
    const rest = load().filter((i) => i.id !== id);
    save(qty > 0 ? [...rest, { id, qty: Math.min(qty, 100) }] : rest);
  },
  clear() {
    save([]);
  },
};

export function useCart() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    load,
    () => EMPTY
  );
}
