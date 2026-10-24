import { NextResponse } from "next/server";
import { can } from "@/lib/permissions";
import { fail, isUuid } from "@/lib/apiHelpers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!isUuid(params.id)) return fail("Invalid post.", 400);
  if (!(await can("news.publish"))) return fail("You are not allowed to delete posts.", 403);

  const supabase = createClient();
  const { data: post } = await supabase.from("news_posts").select("image_paths").eq("id", params.id).maybeSingle();
  if (!post) return fail("That post no longer exists.", 404);

  const { data, error } = await supabase.from("news_posts").delete().eq("id", params.id).select("id");
  if (error) return fail(`The database refused: ${error.message}`, 500);
  if (!data?.length) return fail("Nothing was deleted. Your account may not have permission.", 403);

  if (post.image_paths?.length) {
    await createAdminClient().storage.from("news-images").remove(post.image_paths);
  }
  return NextResponse.json({ ok: true });
}
