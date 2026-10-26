import { NextResponse } from "next/server";
import { z } from "zod";
import { can } from "@/lib/permissions";
import { fail, isUuid } from "@/lib/apiHelpers";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await can("catalog.manage"))) return fail("You are not allowed to add shops.", 403);
  const parsed = z.object({ name: z.string().trim().min(2, "Enter the shop name").max(60) }).safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const { error } = await createClient().from("retailers").insert({ name: parsed.data.name });
  if (error) return fail("Could not add the shop (is it already in the list?).", 400);
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  if (!(await can("catalog.manage"))) return fail("You are not allowed to change shops.", 403);
  const parsed = z.object({ id: z.string(), active: z.boolean() }).safeParse(await request.json().catch(() => ({})));
  if (!parsed.success || !isUuid(parsed.data.id)) return fail("Invalid request.");
  const { error } = await createClient().from("retailers").update({ active: parsed.data.active }).eq("id", parsed.data.id);
  if (error) return fail("Could not update the shop.", 500);
  return NextResponse.json({ ok: true });
}
