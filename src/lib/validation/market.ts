import { z } from "zod";

export const itemsSchema = z.object({
  items: z.array(z.object({ id: z.string().uuid(), qty: z.number().int().min(1).max(100) })).min(1).max(60),
});

const num = (label: string, max: number) =>
  z.preprocess((v) => (v === "" || v == null ? undefined : Number(v)), z.number({ message: `Enter a valid ${label}` }).min(0).max(max));

export const productSchema = z.object({
  retailerId: z.string().uuid("Choose a shop"),
  name: z.string().trim().min(2, "Enter the product name").max(120),
  category: z.string().trim().max(40).optional().or(z.literal("")),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  priceKes: num("price in KES", 10000000),
  weightKg: z.preprocess((v) => (v === "" || v == null ? undefined : Number(v)), z.number().min(0).max(1000).optional()),
});

export const feeSchema = z.object({
  name: z.string().trim().min(2, "Enter a name for the fee").max(60),
  kind: z.enum(["percent_of_subtotal", "flat_per_order", "per_kg"]),
  value: num("amount", 100000),
});
