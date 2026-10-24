import { notFound } from "next/navigation";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { toLocalInput } from "@/lib/dates";
import EventForm from "../../EventForm";

export const dynamic = "force-dynamic";

export default async function EditEvent({ params }: { params: { id: string } }) {
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound();
  if (!(await can("events.manage"))) notFound();
  const supabase = createClient();
  const { data: e } = await supabase
    .from("events")
    .select("id,title,category,location,description,starts_at,ends_at")
    .eq("id", params.id)
    .maybeSingle();
  if (!e) notFound();
  return (
    <>
      <h1 className="mb-4 text-[28px] font-bold leading-tight">Edit event</h1>
      <div className="rounded-sheet bg-surface p-5 shadow-card">
        <EventForm
          initial={{
            id: e.id,
            title: e.title,
            category: e.category,
            location: e.location,
            description: e.description,
            start: toLocalInput(e.starts_at),
            end: e.ends_at ? toLocalInput(e.ends_at) : "",
          }}
        />
      </div>
    </>
  );
}
