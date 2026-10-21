import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { encrypt } from "@/lib/crypto";
import { identitySchema } from "@/lib/validation/verify";

export const runtime = "nodejs";

const MAX_BYTES = 3 * 1024 * 1024;

function sniff(b: Buffer): "jpg" | "png" | "webp" | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  if (b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP") return "webp";
  return null;
}
const MIME = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" } as const;

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please log in again." }, { status: 401 });

  const form = await request.formData();
  const parsed = identitySchema.safeParse({
    docType: form.get("docType"),
    idNumber: form.get("idNumber"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const file = form.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Please add a photo of your document." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "That photo is too large. Try a smaller one." }, { status: 400 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const kind = sniff(buf);
  if (!kind) return NextResponse.json({ error: "Use a JPG, PNG or WebP photo." }, { status: 400 });

  const admin = createAdminClient();

  const { data: profile } = await admin.from("profiles").select("status").eq("id", user.id).single();
  if (!profile || profile.status === "verified" || profile.status === "suspended" || profile.status === "pending") {
    return NextResponse.json({ error: "Your verification is already in progress or complete." }, { status: 409 });
  }

  const path = `${user.id}/${randomUUID()}.${kind}`;
  const up = await admin.storage.from("id-documents").upload(path, buf, { contentType: MIME[kind], upsert: false });
  if (up.error) return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });

  const ins = await admin.from("identity_submissions").insert({
    user_id: user.id,
    doc_type: parsed.data.docType,
    id_number_enc: encrypt(parsed.data.idNumber),
    photo_path: path,
  });
  if (ins.error) {
    await admin.storage.from("id-documents").remove([path]);
    return NextResponse.json({ error: "Could not save your submission. Please try again." }, { status: 500 });
  }

  await admin.from("profiles").update({ status: "pending" }).eq("id", user.id);
  await admin.from("audit_log").insert({ actor_id: user.id, action: "identity.submit", subject_id: user.id });

  return NextResponse.json({ ok: true });
}
