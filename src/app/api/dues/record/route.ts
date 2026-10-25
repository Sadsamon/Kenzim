import { NextResponse } from "next/server";
import { z } from "zod";
import { can } from "@/lib/permissions";
import { fail } from "@/lib/apiHelpers";
import { createClient } from "@/lib/supabase/server";
import { fmtDay } from "@/lib/dues";

export const runtime = "nodejs";

const schema = z.object({
  memberId: z.string().uuid(),
  amount: z.number().positive("Enter the amount received").max(100000),
  months: z.number().int().min(1).max(36),
  method: z.enum(["cash", "ecocash", "bank", "other"]),
  note: z.string().trim().max(200).optional().or(z.literal("")),
});

export async function POST(request: Request) {
  if (!(await can("dues.record"))) return fail("You are not allowed to record payments.", 403);
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const d = parsed.data;
  const supabase = createClient();
  const { data, error } = await supabase.rpc("record_dues_payment", {
    p_member: d.memberId,
    p_amount: d.amount,
    p_method: d.method,
    p_months: d.months,
    p_note: d.note ?? "",
  });
  if (error) return fail(`Could not record the payment: ${error.message}`, 500);
  return NextResponse.json({ ok: true, paidUntil: fmtDay(String(data)) });
}
