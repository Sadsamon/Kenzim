import { NextResponse } from "next/server";
import { z } from "zod";
import { can } from "@/lib/permissions";
import { fail } from "@/lib/apiHelpers";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const schema = z.object({
  country: z.enum(["KE", "ZW"]),
  name: z.string().trim().min(2, "Enter the holiday name").max(80),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date"),
  note: z.string().trim().max(120).optional().or(z.literal("")),
});

export async function POST(request: Request) {
  if (!(await can("events.manage"))) return fail("You are not allowed to edit holidays.", 403);
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const d = parsed.data;
  const supabase = createClient();
  const { error } = await supabase
    .from("holidays")
    .insert({ country: d.country, name: d.name, holiday_date: d.date, note: d.note || null });
  if (error) return fail("Could not save (is it already in the list?).", 500);
  return NextResponse.json({ ok: true });
}
