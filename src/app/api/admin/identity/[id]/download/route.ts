import { NextResponse } from "next/server";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  if (!(await can("identity.download"))) return new NextResponse("Forbidden", { status: 403 });
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("identity_submissions")
    .select("id,user_id,photo_path")
    .eq("id", params.id)
    .single();
  if (!sub?.photo_path) return new NextResponse("Not found", { status: 404 });

  const signed = await admin.storage.from("id-documents").createSignedUrl(sub.photo_path, 60, { download: true });
  if (!signed.data?.signedUrl) return new NextResponse("Could not create link", { status: 500 });

  await admin.from("audit_log").insert({
    actor_id: user.id,
    action: "identity.download",
    subject_id: sub.user_id,
    detail: { submission: sub.id },
  });
  return NextResponse.redirect(signed.data.signedUrl);
}
