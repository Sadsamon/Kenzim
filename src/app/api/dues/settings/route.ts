import { NextResponse } from "next/server";
import { z } from "zod";
import { can } from "@/lib/permissions";
import { fail } from "@/lib/apiHelpers";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const schema = z.object({ monthly: z.number().positive("Enter the monthly amount").max(10000) });

export async function POST(request: Request) {
  if (!(await can("dues.configure"))) return fail("You are not allowed to change the dues amount.", 403);
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: "monthly_dues_usd", value: parsed.data.monthly, updated_by: user?.id, updated_at: new Date().toISOString() });
  if (error) return fail(`Could not save: ${error.message}`, 500);
  return NextResponse.json({ ok: true });
}
