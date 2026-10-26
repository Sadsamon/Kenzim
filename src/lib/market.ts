export const ORDER_STEPS = ["placed", "paid", "ordered", "in_transit", "ready_for_collection", "collected"] as const;

export const statusLabel: Record<string, string> = {
  placed: "Placed, waiting for payment",
  paid: "Paid",
  ordered: "Ordered",
  in_transit: "On its way",
  ready_for_collection: "Ready to collect",
  collected: "Collected",
  cancelled: "Cancelled",
};

export const statusTone: Record<string, string> = {
  placed: "bg-accent text-ink",
  paid: "bg-ink text-white",
  ordered: "bg-ink text-white",
  in_transit: "bg-ink text-white",
  ready_for_collection: "bg-success text-white",
  collected: "bg-success text-white",
  cancelled: "bg-line text-muted",
};

export async function marketSettings(supabase: { from: (t: string) => any }) {
  const { data } = await supabase.from("app_settings").select("key,value").in("key", ["kes_per_usd", "collection_point"]);
  const rows = (data ?? []) as { key: string; value: unknown }[];
  const rate = Number(rows.find((r) => r.key === "kes_per_usd")?.value);
  const point = rows.find((r) => r.key === "collection_point")?.value;
  return {
    rate: Number.isFinite(rate) && rate > 0 ? rate : null,
    collection: typeof point === "string" && point.trim() ? point : null,
  };
}

export const kes = (n: number | string) => `KES ${Number(n).toLocaleString("en-GB", { maximumFractionDigits: 2 })}`;
