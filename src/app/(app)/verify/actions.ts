"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { employmentSchema, emergencySchema, familySchema } from "@/lib/validation/verify";

export type FormState = { error?: string; saved?: boolean; fieldErrors?: Record<string, string> };

function errs(issues: { path: (string | number)[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const k = i.path.join(".");
    if (!out[k]) out[k] = i.message;
  }
  return out;
}
const s = (fd: FormData, k: string) => String(fd.get(k) ?? "");

async function userId() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, id: user?.id };
}

export async function saveEmployment(_p: FormState, fd: FormData): Promise<FormState> {
  const parsed = employmentSchema.safeParse({
    occupation: s(fd, "occupation"),
    employer: s(fd, "employer"),
    workCity: s(fd, "workCity"),
    workPhone: s(fd, "workPhone"),
  });
  if (!parsed.success) return { fieldErrors: errs(parsed.error.issues) };
  const { supabase, id } = await userId();
  if (!id) return { error: "Please log in again." };
  const d = parsed.data;
  const { error } = await supabase.from("employment").upsert({
    user_id: id,
    occupation: d.occupation,
    employer: d.employer || null,
    work_city: d.workCity || null,
    work_phone: d.workPhone || null,
  });
  if (error) return { error: "Could not save. Please try again." };
  revalidatePath("/verify/details");
  return { saved: true };
}

export async function saveEmergency(_p: FormState, fd: FormData): Promise<FormState> {
  const pick = (p: string) => ({
    fullName: s(fd, `${p}_fullName`),
    relationship: s(fd, `${p}_relationship`),
    phone: s(fd, `${p}_phone`),
    address: s(fd, `${p}_address`),
  });
  const parsed = emergencySchema.safeParse({ kenya: pick("kenya"), zim: pick("zim") });
  if (!parsed.success) return { fieldErrors: errs(parsed.error.issues) };
  const { supabase, id } = await userId();
  if (!id) return { error: "Please log in again." };
  const row = (kind: string, c: typeof parsed.data.kenya) => ({
    user_id: id,
    kind,
    full_name: c.fullName,
    relationship: c.relationship,
    phone: c.phone,
    address: c.address || null,
  });
  const { error } = await supabase
    .from("emergency_contacts")
    .upsert([row("kenya_contact", parsed.data.kenya), row("zimbabwe_next_of_kin", parsed.data.zim)], {
      onConflict: "user_id,kind",
    });
  if (error) return { error: "Could not save. Please try again." };
  revalidatePath("/verify/details");
  return { saved: true };
}

export async function addFamily(_p: FormState, fd: FormData): Promise<FormState> {
  const parsed = familySchema.safeParse({
    fullName: s(fd, "fullName"),
    relationship: s(fd, "relationship"),
    birthDate: s(fd, "birthDate"),
    anniversaryDate: s(fd, "anniversaryDate"),
    birthdayOptIn: fd.get("birthdayOptIn") === "on",
  });
  if (!parsed.success) return { fieldErrors: errs(parsed.error.issues) };
  const { supabase, id } = await userId();
  if (!id) return { error: "Please log in again." };
  const d = parsed.data;
  const { error } = await supabase.from("family_members").insert({
    user_id: id,
    full_name: d.fullName,
    relationship: d.relationship,
    birth_date: d.birthDate || null,
    anniversary_date: d.anniversaryDate || null,
    birthday_opt_in: d.birthdayOptIn,
  });
  if (error) return { error: "Could not save. Please try again." };
  revalidatePath("/verify/details");
  return { saved: true };
}

export async function removeFamily(fd: FormData) {
  const { supabase, id } = await userId();
  if (!id) return;
  await supabase.from("family_members").delete().eq("id", s(fd, "id")).eq("user_id", id);
  revalidatePath("/verify/details");
}
