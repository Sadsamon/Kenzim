import { NextResponse } from "next/server";
import { z } from "zod";
import { can } from "@/lib/permissions";
import { fail, isUuid } from "@/lib/apiHelpers";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const schema = z.union([
  z.object({ action: z.literal("cancel") }),
  z.object({ status: z.enum(["paid", "ordered", "in_transit", "ready_for_collection", "collected", "cancelled"]) }),
]);

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!isUuid(params.id)) return fail("Invalid order.");
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail("Invalid request.");
  const supabase = createClient();

  if ("action" in parsed.data) {
    const { error } = await supabase.rpc("cancel_order", { p_id: params.id });
    if (error) return fail(error.message, 400);
  } else {
    if (!(await can("orders.manage"))) return fail("You are not allowed to update orders.", 403);
    const { error } = await supabase.rpc("set_order_status", { p_id: params.id, p_status: parsed.data.status });
    if (error) return fail(error.message, 400);
  }
  return NextResponse.json({ ok: true });
}
