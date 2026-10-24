"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function decide(formData: FormData) {
  const decision = String(formData.get("decision"));
  const id = String(formData.get("id"));
  if (decision !== "approve" && decision !== "reject") return;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  if (!(await can("members.verify"))) throw new Error("Not allowed");

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .update({ status: decision === "approve" ? "verified" : "new" })
    .eq("id", id)
    .eq("status", "pending")
    .select("id");
  if (data?.length) {
    await admin.from("audit_log").insert({
      actor_id: user.id,
      action: decision === "approve" ? "member.approve" : "member.reject",
      subject_id: id,
    });
  }
  revalidatePath("/admin/members");
  redirect("/admin/members");
}
