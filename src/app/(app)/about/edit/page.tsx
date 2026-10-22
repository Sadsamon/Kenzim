import { notFound } from "next/navigation";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import EditAboutForm from "./EditAboutForm";

export const dynamic = "force-dynamic";

export default async function EditAbout() {
  if (!(await can("about.manage"))) notFound();
  const supabase = createClient();
  const { data } = await supabase.from("about_page").select("history,mission,goals").eq("id", 1).maybeSingle();
  return (
    <>
      <h1 className="mb-4 text-[28px] font-bold leading-tight">Edit About page</h1>
      <div className="rounded-sheet bg-surface p-5 shadow-card">
        <EditAboutForm initial={data ?? { history: "", mission: "", goals: "" }} />
      </div>
    </>
  );
}
