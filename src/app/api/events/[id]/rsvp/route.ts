import { NextResponse } from "next/server";
import { z } from "zod";
import { fail, isUuid } from "@/lib/apiHelpers";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const schema = z.object({
  status: z.enum(["going", "interested", "declined"]),
  guests: z.number().int().min(0).max(10),
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  if (!isUuid(params.id)) return fail("Invalid event.");
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail("Please choose a reply and a number of guests.");

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Please log in again.", 401);

  const { error } = await supabase.from("event_rsvps").upsert({
    event_id: params.id,
    user_id: user.id,
    status: parsed.data.status,
    guests: parsed.data.status === "going" ? parsed.data.guests : 0,
    updated_at: new Date().toISOString(),
  });
  if (error) return fail("Only verified members can reply. Please finish your verification first.", 403);
  return NextResponse.json({ ok: true });
}
