import { NextResponse } from "next/server";
import { can } from "@/lib/permissions";
import { fail } from "@/lib/apiHelpers";
import { createClient } from "@/lib/supabase/server";
import { placeSchema } from "@/lib/validation/places";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await can("places.manage"))) return fail("You are not allowed to add places.", 403);
  const parsed = placeSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const d = parsed.data;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("places")
    .insert({
      name: d.name,
      kind: d.kind,
      country: d.country,
      city: d.city || null,
      description: d.description || null,
      phone: d.phone || null,
      website: d.website || null,
      lat: d.lat,
      lng: d.lng,
      created_by: user?.id,
    })
    .select("id")
    .single();
  if (error || !data) return fail("Could not save the place.", 500);
  return NextResponse.json({ id: data.id });
}
