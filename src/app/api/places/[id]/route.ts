import { NextResponse } from "next/server";
import { can } from "@/lib/permissions";
import { fail, isUuid } from "@/lib/apiHelpers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { placeSchema } from "@/lib/validation/places";

export const runtime = "nodejs";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  if (!isUuid(params.id)) return fail("Invalid place.");
  if (!(await can("places.manage"))) return fail("You are not allowed to edit places.", 403);
  const parsed = placeSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const d = parsed.data;
  const supabase = createClient();
  const { data, error } = await supabase
    .from("places")
    .update({
      name: d.name,
      kind: d.kind,
      country: d.country,
      city: d.city || null,
      description: d.description || null,
      phone: d.phone || null,
      website: d.website || null,
      lat: d.lat,
      lng: d.lng,
    })
    .eq("id", params.id)
    .select("id");
  if (error) return fail("Could not save the place.", 500);
  if (!data?.length) return fail("Place not found.", 404);
  return NextResponse.json({ id: params.id });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!isUuid(params.id)) return fail("Invalid place.");
  if (!(await can("places.manage"))) return fail("You are not allowed to delete places.", 403);
  const supabase = createClient();
  const { data, error } = await supabase.from("places").delete().eq("id", params.id).select("photo_paths");
  if (error) return fail(`The database refused: ${error.message}`, 500);
  if (!data?.length) return fail("Nothing was deleted.", 404);
  const paths = data[0].photo_paths as string[];
  if (paths?.length) await createAdminClient().storage.from("place-photos").remove(paths);
  return NextResponse.json({ ok: true });
}
