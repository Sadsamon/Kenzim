import { notFound } from "next/navigation";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import PlaceForm from "../../PlaceForm";

export const dynamic = "force-dynamic";

export default async function EditPlace({ params }: { params: { id: string } }) {
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound();
  if (!(await can("places.manage"))) notFound();
  const supabase = createClient();
  const { data: p } = await supabase
    .from("places")
    .select("id,name,kind,country,city,description,phone,website,lat,lng")
    .eq("id", params.id)
    .maybeSingle();
  if (!p) notFound();
  return (
    <>
      <h1 className="mb-4 text-[28px] font-bold leading-tight">Edit place</h1>
      <div className="rounded-sheet bg-surface p-5 shadow-card">
        <PlaceForm initial={p} />
      </div>
    </>
  );
}
