import { NextResponse } from "next/server";
import { can } from "@/lib/permissions";
import { fail } from "@/lib/apiHelpers";
import { eventSchema } from "@/lib/validation/events";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await can("events.manage"))) return fail("You are not allowed to create events.", 403);
  const parsed = eventSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const d = parsed.data;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("events")
    .insert({
      title: d.title,
      category: d.category,
      location: d.location || null,
      description: d.description || null,
      starts_at: d.startsAt,
      ends_at: d.endsAt || null,
      created_by: user?.id,
    })
    .select("id")
    .single();
  if (error || !data) return fail("Could not save the event.", 500);
  return NextResponse.json({ id: data.id });
}
