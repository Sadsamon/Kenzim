"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function review(formData: FormData) {
  const decision = String(formData.get("decision"));
  const id = String(formData.get("id"));
  if (decision !== "approve" && decision !== "reject") return;
  if (!(await can("identity.review"))) throw new Error("Not allowed");

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("identity_submissions")
    .select("id,user_id,photo_path,status")
    .eq("id", id)
    .single();
  if (!sub || sub.status !== "submitted") redirect("/admin/identity");

  // 1. Delete the photo first. If this fails we stop and nothing else changes.
  if (sub.photo_path) {
    const rm = await admin.storage.from("id-documents").remove([sub.photo_path]);
    if (rm.error) throw new Error("Could not delete the photo");
  }

  // 2. Record the decision and wipe the sensitive fields.
  const now = new Date().toISOString();
  await admin
    .from("identity_submissions")
    .update({
      status: decision === "approve" ? "approved" : "rejected",
      reviewed_by: user.id,
      reviewed_at: now,
      photo_path: null,
      id_number_enc: null,
      photo_deleted_at: now,
    })
    .eq("id", id);

  // 3. Update the member and log it.
  await admin
    .from("profiles")
    .update({ status: decision === "approve" ? "verified" : "new" })
    .eq("id", sub.user_id);
  await admin.from("audit_log").insert({
    actor_id: user.id,
    action: decision === "approve" ? "identity.approve" : "identity.reject",
    subject_id: sub.user_id,
  });

  revalidatePath("/admin/identity");
  redirect("/admin/identity");
}
