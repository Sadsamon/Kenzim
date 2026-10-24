import { NextResponse } from "next/server";
import { can } from "@/lib/permissions";
import { fail, isUuid } from "@/lib/apiHelpers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { eventSchema } from "@/lib/validation/events";

export const runtime = "nodejs";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  if (!isUuid(params.id)) return fail("Invalid event.");
  if (!(await can("events.manage"))) return fail("You are not allowed to edit events.", 403);
  const parsed = eventSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const d = parsed.data;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("events")
    .update({
      title: d.title,
      category: d.category,
      location: d.location || null,
      description: d.description || null,
      starts_at: d.startsAt,
      ends_at: d.endsAt || null,
    })
    .eq("id", params.id)
    .select("id");
  if (error) return fail("Could not save the event.", 500);
  if (!data?.length) return fail("Event not found.", 404);
  return NextResponse.json({ id: params.id });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!isUuid(params.id)) return fail("Invalid event.");
  if (!(await can("events.manage"))) return fail("You are not allowed to delete events.", 403);

  const supabase = createClient();
  const { data: photos } = await supabase.from("event_photos").select("path").eq("event_id", params.id);
  const { data, error } = await supabase.from("events").delete().eq("id", params.id).select("id");
  if (error) return fail(`The database refused: ${error.message}`, 500);
  if (!data?.length) return fail("Nothing was deleted.", 404);
  if (photos?.length) {
    await createAdminClient().storage.from("event-photos").remove(photos.map((p) => p.path));
  }
  return NextResponse.json({ ok: true });
}
