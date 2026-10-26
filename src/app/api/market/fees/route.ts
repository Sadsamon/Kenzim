import { NextResponse } from "next/server";
import { z } from "zod";
import { can } from "@/lib/permissions";
import { fail, isUuid } from "@/lib/apiHelpers";
import { createClient } from "@/lib/supabase/server";
import { feeSchema } from "@/lib/validation/market";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await can("catalog.manage"))) return fail("You are not allowed to add fees.", 403);
  const parsed = feeSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const { error } = await createClient().from("fee_rules").insert(parsed.data);
  if (error) return fail("Could not save the fee.", 500);
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  if (!(await can("catalog.manage"))) return fail("You are not allowed to change fees.", 403);
  const parsed = z.object({ id: z.string(), active: z.boolean() }).safeParse(await request.json().catch(() => ({})));
  if (!parsed.success || !isUuid(parsed.data.id)) return fail("Invalid request.");
  const { error } = await createClient().from("fee_rules").update({ active: parsed.data.active }).eq("id", parsed.data.id);
  if (error) return fail("Could not update the fee.", 500);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!(await can("catalog.manage"))) return fail("You are not allowed to delete fees.", 403);
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!isUuid(id)) return fail("Invalid request.");
  const { data, error } = await createClient().from("fee_rules").delete().eq("id", id).select("id");
  if (error || !data?.length) return fail("Could not delete the fee.", 500);
  return NextResponse.json({ ok: true });
}
