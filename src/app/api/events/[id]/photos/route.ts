import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { can } from "@/lib/permissions";
import { fail, isUuid, sniffImage } from "@/lib/apiHelpers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const MAX_PER_UPLOAD = 12;
const MAX_PER_EVENT = 40;

async function allowed() {
  return (await can("gallery.manage")) || (await can("events.manage"));
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  if (!isUuid(params.id)) return fail("Invalid event.");
  if (!(await allowed())) return fail("You are not allowed to add photos.", 403);

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Please log in again.", 401);

  const form = await request.formData();
  const files = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return fail("Choose at least one photo.");
  if (files.length > MAX_PER_UPLOAD) return fail(`Add at most ${MAX_PER_UPLOAD} photos at a time.`);

  const { count } = await supabase.from("event_photos").select("id", { count: "exact", head: true }).eq("event_id", params.id);
  if ((count ?? 0) + files.length > MAX_PER_EVENT) return fail(`An event can have at most ${MAX_PER_EVENT} photos.`);

  const admin = createAdminClient();
  const uploaded: string[] = [];
  const cleanup = async () => {
    if (uploaded.length) await admin.storage.from("event-photos").remove(uploaded);
  };

  for (const file of files) {
    if (file.size > 3 * 1024 * 1024) {
      await cleanup();
      return fail("One of the photos is too large.");
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const kind = sniffImage(buf);
    if (!kind) {
      await cleanup();
      return fail("Use JPG, PNG or WebP photos.");
    }
    const path = `${params.id}/${randomUUID()}.${kind.ext}`;
    const up = await admin.storage.from("event-photos").upload(path, buf, { contentType: kind.mime });
    if (up.error) {
      await cleanup();
      return fail("Photo upload failed. Please try again.", 500);
    }
    uploaded.push(path);
  }

  const { error } = await supabase
    .from("event_photos")
    .insert(uploaded.map((path) => ({ event_id: params.id, path, uploaded_by: user.id })));
  if (error) {
    await cleanup();
    return fail("Could not save the photos.", 500);
  }
  return NextResponse.json({ ok: true, added: uploaded.length });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  if (!isUuid(params.id)) return fail("Invalid event.");
  if (!(await allowed())) return fail("You are not allowed to remove photos.", 403);
  const photoId = new URL(request.url).searchParams.get("photoId") ?? "";
  if (!isUuid(photoId)) return fail("Invalid photo.");

  const supabase = createClient();
  const { data } = await supabase.from("event_photos").delete().eq("id", photoId).eq("event_id", params.id).select("path");
  if (!data?.length) return fail("Photo not found.", 404);
  await createAdminClient().storage.from("event-photos").remove([data[0].path]);
  return NextResponse.json({ ok: true });
}
