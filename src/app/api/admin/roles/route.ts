import { NextResponse } from "next/server";
import { z } from "zod";
import { can } from "@/lib/permissions";
import { fail } from "@/lib/apiHelpers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const schema = z.object({ userId: z.string().uuid(), roleKey: z.string().min(2).max(40), action: z.enum(["add", "remove"]) });

export async function POST(request: Request) {
  if (!(await can("roles.assign"))) return fail("You are not allowed to assign roles.", 403);
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail("Invalid request.");
  const { userId, roleKey, action } = parsed.data;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: role } = await supabase.from("roles").select("id,name").eq("key", roleKey).single();
  if (!role) return fail("Unknown role.", 404);

  if (action === "add") {
    const { error } = await supabase.from("user_roles").upsert({ user_id: userId, role_id: role.id, granted_by: user?.id });
    if (error) return fail("Could not add the role.", 500);
  } else {
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role_id", role.id);
    if (error) return fail(error.message.includes("last Super Admin") ? "You cannot remove the last Super Admin." : "Could not remove the role.", 400);
  }
  await createAdminClient().from("audit_log").insert({ actor_id: user?.id, action: `role.${action}`, subject_id: userId, detail: { role: roleKey } });
  return NextResponse.json({ ok: true });
}
