import { NextResponse } from "next/server";
import { z } from "zod";
import { can } from "@/lib/permissions";
import { fail, isUuid } from "@/lib/apiHelpers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const schema = z.object({ trusted: z.boolean().optional(), suspended: z.boolean().optional() });

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!isUuid(params.id)) return fail("Invalid member.");
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail("Invalid request.");
  const { trusted, suspended } = parsed.data;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Please log in again.", 401);
  const log = createAdminClient();

  if (typeof trusted === "boolean") {
    if (!(await can("roles.assign"))) return fail("You are not allowed to change the Trusted badge.", 403);
    const { data, error } = await supabase.from("profiles").update({ is_senior_member: trusted }).eq("id", params.id).select("id");
    if (error || !data?.length) return fail("Could not update the badge.", 500);
    await log.from("audit_log").insert({ actor_id: user.id, action: trusted ? "badge.give" : "badge.remove", subject_id: params.id });
  }

  if (typeof suspended === "boolean") {
    if (!(await can("members.suspend"))) return fail("You are not allowed to suspend members.", 403);
    if (params.id === user.id) return fail("You cannot suspend yourself.", 400);
    const { data, error } = await supabase
      .from("profiles")
      .update({ status: suspended ? "suspended" : "verified" })
      .eq("id", params.id)
      .select("id");
    if (error || !data?.length) return fail("Could not update the account.", 500);
    await log.from("audit_log").insert({ actor_id: user.id, action: suspended ? "member.suspend" : "member.unsuspend", subject_id: params.id });
  }
  return NextResponse.json({ ok: true });
}
