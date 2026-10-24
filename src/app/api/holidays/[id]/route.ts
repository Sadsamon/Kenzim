import { NextResponse } from "next/server";
import { can } from "@/lib/permissions";
import { fail, isUuid } from "@/lib/apiHelpers";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!isUuid(params.id)) return fail("Invalid holiday.");
  if (!(await can("events.manage"))) return fail("You are not allowed to edit holidays.", 403);
  const supabase = createClient();
  const { data, error } = await supabase.from("holidays").delete().eq("id", params.id).select("id");
  if (error) return fail("Could not delete.", 500);
  if (!data?.length) return fail("Nothing was deleted.", 404);
  return NextResponse.json({ ok: true });
}
