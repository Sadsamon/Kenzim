import { NextResponse } from "next/server";
import { z } from "zod";
import { can } from "@/lib/permissions";
import { fail } from "@/lib/apiHelpers";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const schema = z.object({
  kesPerUsd: z.number().positive("Enter how many Kenya shillings make one US dollar").max(100000),
  collectionPoint: z.string().trim().max(200).optional().or(z.literal("")),
});

export async function POST(request: Request) {
  if (!(await can("catalog.manage"))) return fail("You are not allowed to change these settings.", 403);
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const now = new Date().toISOString();
  const rows = [
    { key: "kes_per_usd", value: parsed.data.kesPerUsd, updated_by: user?.id, updated_at: now },
    { key: "collection_point", value: parsed.data.collectionPoint ?? "", updated_by: user?.id, updated_at: now },
  ];
  const { error } = await supabase.from("app_settings").upsert(rows);
  if (error) return fail(`Could not save: ${error.message}`, 500);
  return NextResponse.json({ ok: true });
}
