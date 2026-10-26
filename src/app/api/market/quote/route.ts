import { NextResponse } from "next/server";
import { fail } from "@/lib/apiHelpers";
import { itemsSchema } from "@/lib/validation/market";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const parsed = itemsSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail("Your cart looks wrong. Please empty it and try again.");
  const supabase = createClient();
  const { data, error } = await supabase.rpc("quote_order", { p_items: parsed.data.items });
  if (error) return fail(error.message, 400);
  return NextResponse.json(data);
}
