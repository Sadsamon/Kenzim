import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { todayHarare } from "@/lib/dues";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Note = { user_id: string; kind: string; title: string; body?: string; link?: string; dedupe_key: string };

// Runs once a day (07:00 Zimbabwe time). It also counts as activity, which keeps the free Supabase project awake.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const today = todayHarare();
  const year = today.slice(0, 4);
  const mmdd = today.slice(5);
  const notes: Note[] = [];

  const { data: members } = await admin
    .from("profiles")
    .select("id,full_name,paid_through,birthday,birthday_opt_in")
    .eq("status", "verified");
  const all = members ?? [];

  // 1. Dues reminders to members: 7 days before, on the day it runs out, and 7 days after.
  for (const m of all) {
    if (!m.paid_through) continue;
    const d = Math.round((Date.parse(m.paid_through) - Date.parse(today)) / 86400000);
    const tag = d === 7 ? "week" : d === 0 ? "today" : d === -7 ? "late" : null;
    if (!tag) continue;
    const text = {
      week: ["Dues due in a week", "Your Kenzim dues run out in 7 days."],
      today: ["Dues are due today", "Your Kenzim dues run out today."],
      late: ["Dues are overdue", "Your Kenzim dues ended a week ago. Please pay your Treasurer when you can."],
    }[tag];
    notes.push({ user_id: m.id, kind: "dues", title: text[0], body: text[1], link: "/dues", dedupe_key: `dues:${m.paid_through}:${tag}` });
  }

  // 2. Monday digest for people who can see dues (Super Admin and any role with dues.view).
  const weekday = new Date().toLocaleDateString("en-GB", { timeZone: "Africa/Harare", weekday: "long" });
  if (weekday === "Monday") {
    const overdue = all.filter((m) => m.paid_through && m.paid_through < today).length;
    if (overdue > 0) {
      const { data: perms } = await admin.from("role_permissions").select("role_id").eq("permission_key", "dues.view");
      const { data: sa } = await admin.from("roles").select("id").eq("key", "super_admin");
      const roleIds = [...(perms ?? []).map((p) => p.role_id), ...(sa ?? []).map((r) => r.id)];
      const { data: holders } = roleIds.length
        ? await admin.from("user_roles").select("user_id").in("role_id", roleIds)
        : { data: [] as { user_id: string }[] };
      for (const u of new Set((holders ?? []).map((h) => h.user_id))) {
        notes.push({
          user_id: u,
          kind: "dues",
          title: "Members with overdue dues",
          body: `${overdue} member${overdue > 1 ? "s are" : " is"} overdue.`,
          link: "/admin/dues?f=overdue",
          dedupe_key: `overdue:${today}`,
        });
      }
    }
  }

  // 3. Birthdays shared with the community (members and family members who opted in).
  const first = (n: string) => n.trim().split(/\s+/)[0];
  const celebrations: { key: string; selfId?: string; text: string }[] = [];
  for (const m of all) {
    if (m.birthday_opt_in && m.birthday && m.birthday.slice(5) === mmdd) {
      celebrations.push({ key: `bday:${m.id}:${year}`, selfId: m.id, text: `Today is ${first(m.full_name)}'s birthday. Wish them well!` });
      notes.push({ user_id: m.id, kind: "birthday", title: "Happy birthday!", body: "Everyone at Kenzim wishes you a wonderful day.", dedupe_key: `bday-self:${m.id}:${year}` });
    }
  }
  const { data: fam } = await admin
    .from("family_members")
    .select("id,user_id,full_name,birth_date,anniversary_date")
    .eq("birthday_opt_in", true);
  const owners = new Map(all.map((m) => [m.id, m.full_name]));
  for (const f of fam ?? []) {
    const owner = owners.get(f.user_id);
    if (!owner) continue;
    const family = owner.trim().split(/\s+/).slice(-1)[0];
    if (f.birth_date && String(f.birth_date).slice(5) === mmdd) {
      celebrations.push({ key: `fbday:${f.id}:${year}`, text: `Today is ${first(f.full_name)}'s birthday (the ${family} family).` });
    }
    if (f.anniversary_date && String(f.anniversary_date).slice(5) === mmdd) {
      celebrations.push({ key: `fanniv:${f.id}:${year}`, text: `Happy anniversary to the ${family} family!` });
    }
  }
  for (const c of celebrations) {
    for (const m of all) {
      if (m.id === c.selfId) continue;
      notes.push({ user_id: m.id, kind: "birthday", title: "Celebrations", body: c.text, dedupe_key: c.key });
    }
  }

  let sent = 0;
  for (let i = 0; i < notes.length; i += 500) {
    const chunk = notes.slice(i, i + 500);
    const { data } = await admin
      .from("notifications")
      .upsert(chunk, { onConflict: "user_id,dedupe_key", ignoreDuplicates: true })
      .select("id");
    sent += data?.length ?? 0;
  }

  return NextResponse.json({ ok: true, today, checkedMembers: all.length, created: sent });
}
