import { notFound } from "next/navigation";
import { can } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  if (!(await can("audit.read"))) notFound();
  const admin = createAdminClient();
  const { data } = await admin.from("audit_log").select("id,actor_id,action,subject_id,created_at").order("created_at", { ascending: false }).limit(80);
  const ids = Array.from(new Set((data ?? []).flatMap((r) => [r.actor_id, r.subject_id]).filter(Boolean) as string[]));
  const { data: names } = ids.length ? await admin.from("profiles").select("id,full_name").in("id", ids) : { data: [] as { id: string; full_name: string }[] };
  const nm = new Map((names ?? []).map((n) => [n.id, n.full_name]));
  return (
    <>
      <h1 className="mb-4 text-[28px] font-bold leading-tight">Activity log</h1>
      <ul className="divide-y divide-line rounded-sheet bg-surface px-4 shadow-card">
        {(data ?? []).map((r) => (
          <li key={r.id} className="py-3">
            <p className="font-semibold">{r.action}</p>
            <p className="text-sm text-muted">
              {nm.get(r.actor_id) ?? "System"}
              {r.subject_id ? ` → ${nm.get(r.subject_id) ?? "removed member"}` : ""} · {new Date(r.created_at).toLocaleString("en-GB", { timeZone: "Africa/Harare" })}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}
