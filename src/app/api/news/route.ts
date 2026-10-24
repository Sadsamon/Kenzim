import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const MAX_PHOTOS = 6;

const schema = z.object({
  title: z.string().trim().min(3, "Add a title (at least 3 letters)").max(120, "Title is too long"),
  body: z.string().trim().min(1, "Write the post text").max(5000, "Post is too long"),
  kind: z.enum(["admin", "embassy", "community"]),
  popupDays: z.enum(["0", "3", "7", "14"]),
});

function sniff(b: Buffer) {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: "jpg", mime: "image/jpeg" };
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { ext: "png", mime: "image/png" };
  if (b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP") return { ext: "webp", mime: "image/webp" };
  return null;
}

export async function POST(request: Request) {
  if (!(await can("news.publish"))) return NextResponse.json({ error: "You are not allowed to post news." }, { status: 403 });
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please log in again." }, { status: 401 });

  const form = await request.formData();
  const parsed = schema.safeParse({
    title: form.get("title"),
    body: form.get("body"),
    kind: form.get("kind"),
    popupDays: form.get("popupDays") ?? "0",
  });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const files = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > MAX_PHOTOS) return NextResponse.json({ error: `Add at most ${MAX_PHOTOS} photos.` }, { status: 400 });

  const admin = createAdminClient();
  const uploaded: string[] = [];
  const cleanup = async () => {
    if (uploaded.length) await admin.storage.from("news-images").remove(uploaded);
  };

  for (const file of files) {
    if (file.size > 3 * 1024 * 1024) {
      await cleanup();
      return NextResponse.json({ error: "One of the photos is too large." }, { status: 400 });
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const kind = sniff(buf);
    if (!kind) {
      await cleanup();
      return NextResponse.json({ error: "Use JPG, PNG or WebP photos." }, { status: 400 });
    }
    const path = `posts/${randomUUID()}.${kind.ext}`;
    const up = await admin.storage.from("news-images").upload(path, buf, { contentType: kind.mime });
    if (up.error) {
      await cleanup();
      return NextResponse.json({ error: "Photo upload failed. Please try again." }, { status: 500 });
    }
    uploaded.push(path);
  }

  const days = Number(parsed.data.popupDays);
  const { data, error } = await supabase
    .from("news_posts")
    .insert({
      author_id: user.id,
      kind: parsed.data.kind,
      title: parsed.data.title,
      body: parsed.data.body,
      image_paths: uploaded,
      pinned: form.get("pinned") === "on",
      popup_until: days > 0 ? new Date(Date.now() + days * 86400000).toISOString() : null,
    })
    .select("id")
    .single();
  if (error || !data) {
    await cleanup();
    return NextResponse.json({ error: "Could not save the post." }, { status: 500 });
  }
  return NextResponse.json({ id: data.id });
}
