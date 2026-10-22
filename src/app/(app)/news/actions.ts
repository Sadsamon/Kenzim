"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function dismissPopup(postId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("popup_dismissals").upsert({ user_id: user.id, post_id: postId });
}

export async function deletePost(formData: FormData) {
  if (!(await can("news.publish"))) throw new Error("Not allowed");
  const id = String(formData.get("id"));
  const supabase = createClient();
  const { data: post } = await supabase.from("news_posts").select("image_path").eq("id", id).single();
  await supabase.from("news_posts").delete().eq("id", id);
  if (post?.image_path) {
    await createAdminClient().storage.from("news-images").remove([post.image_path]);
  }
  revalidatePath("/news");
  redirect("/news");
}
