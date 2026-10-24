import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { can } from "@/lib/permissions";
import { fail, isUuid, sniffImage } from "@/lib/apiHelpers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const MAX_PHOTOS = 8;

export async function POST(request: Request, { params }: { params: { id: string } }) {
  if (!isUuid(params.id)) return fail("Invalid place.");
  if (!(await can("places.manage"))) return fail("You are not allowed to add photos.", 403);

  const supabase = createClient();
  const { data: place } = await supabase.from("places").select("photo_paths").eq("id", params.id).maybeSingle();
  if (!place) return fail("Place not found.", 404);
  const existing: string[] = place.photo_paths ?? [];

  const form = await request.formData();
  const files = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return fail("Choose at least one photo.");
  if (existing.length + files.length > MAX_PHOTOS) return fail(`A place can have at most ${MAX_PHOTOS} photos.`);

  const admin = createAdminClient();
  const uploaded: string[] = [];
  const cleanup = async () => {
    if (uploaded.length) await admin.storage.from("place-photos").remove(uploaded);
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
    const up = await admin.storage.from("place-photos").upload(path, buf, { contentType: kind.mime });
    if (up.error) {
      await cleanup();
      return fail("Photo upload failed. Please try again.", 500);
    }
    uploaded.push(path);
  }

  const { error } = await supabase.from("places").update({ photo_paths: [...existing, ...uploaded] }).eq("id", params.id);
  if (error) {
    await cleanup();
    return fail("Could not save the photos.", 500);
  }
  return NextResponse.json({ ok: true, added: uploaded.length });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  if (!isUuid(params.id)) return fail("Invalid place.");
  if (!(await can("places.manage"))) return fail("You are not allowed to remove photos.", 403);
  const path = new URL(request.url).searchParams.get("path") ?? "";
  if (!path.startsWith(`${params.id}/`)) return fail("Invalid photo.");

  const supabase = createClient();
  const { data: place } = await supabase.from("places").select("photo_paths").eq("id", params.id).maybeSingle();
  if (!place) return fail("Place not found.", 404);
  const next = (place.photo_paths as string[]).filter((p) => p !== path);
  const { error } = await supabase.from("places").update({ photo_paths: next }).eq("id", params.id);
  if (error) return fail("Could not remove the photo.", 500);
  await createAdminClient().storage.from("place-photos").remove([path]);
  return NextResponse.json({ ok: true });
}
