import { NextResponse } from "next/server";
import { z } from "zod";
import { can } from "@/lib/permissions";
import { fail } from "@/lib/apiHelpers";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const schema = z.object({ paymentId: z.string().uuid(), reason: z.string().trim().min(3, "Give a short reason").max(200) });

export async function POST(request: Request) {
  if (!(await can("dues.record"))) return fail("You are not allowed to void payments.", 403);
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const supabase = createClient();
  const { error } = await supabase.rpc("void_dues_payment", { p_id: parsed.data.paymentId, p_reason: parsed.data.reason });
  if (error) return fail(`Could not void: ${error.message}`, 500);
  return NextResponse.json({ ok: true });
}
