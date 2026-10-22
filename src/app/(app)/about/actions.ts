"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string };

const aboutSchema = z.object({
  history: z.string().trim().max(8000),
  mission: z.string().trim().max(3000),
  goals: z.string().trim().max(5000),
});
const letterSchema = z.object({
  title: z.string().trim().min(3, "Add a title").max(150),
  body: z.string().trim().min(10, "Write the letter").max(8000, "The letter is too long"),
  authorName: z.string().trim().min(2).max(80),
});

export async function saveAbout(_p: FormState, fd: FormData): Promise<FormState> {
  if (!(await can("about.manage"))) return { error: "You are not allowed to edit this page." };
  const parsed = aboutSchema.safeParse({
    history: String(fd.get("history") ?? ""),
    mission: String(fd.get("mission") ?? ""),
    goals: String(fd.get("goals") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("about_page")
    .update({ ...parsed.data, updated_by: user?.id, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) return { error: "Could not save. Please try again." };
  revalidatePath("/about");
  redirect("/about");
}

export async function saveLetter(_p: FormState, fd: FormData): Promise<FormState> {
  if (!(await can("about.manage"))) return { error: "You are not allowed to publish letters." };
  const parsed = letterSchema.safeParse({
    title: String(fd.get("title") ?? ""),
    body: String(fd.get("body") ?? ""),
    authorName: String(fd.get("authorName") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("chair_letters")
    .insert({ title: parsed.data.title, body: parsed.data.body, author_name: parsed.data.authorName, created_by: user?.id })
    .select("id")
    .single();
  if (error || !data) return { error: "Could not publish. Please try again." };
  revalidatePath("/news");
  revalidatePath("/about");
  redirect(`/about/letters/${data.id}`);
}

export async function deleteLetter(fd: FormData) {
  if (!(await can("about.manage"))) throw new Error("Not allowed");
  const supabase = createClient();
  await supabase.from("chair_letters").delete().eq("id", String(fd.get("id")));
  revalidatePath("/news");
  revalidatePath("/about");
  redirect("/about");
}
