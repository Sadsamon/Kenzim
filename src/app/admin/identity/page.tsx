import Link from "next/link";
import { notFound } from "next/navigation";
import { can } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import EmptyState from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function IdentityQueue() {
  if (!(await can("identity.review"))) notFound();
  const admin = createAdminClient();
  const { data } = await admin
    .from("identity_submissions")
    .select("id,doc_type,created_at,user_id")
    .eq("status", "submitted")
    .order("created_at");

  const ids = (data ?? []).map((d) => d.user_id);
  const { data: profiles } = ids.length
    ? await admin.from("profiles").select("id,full_name").in("id", ids)
    : { data: [] as { id: string; full_name: string }[] };
  const name = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  return (
    <>
      <h1 className="mb-4 text-[28px] font-bold leading-tight">Verification queue</h1>
      {!data || data.length === 0 ? (
        <EmptyState title="All caught up" body="No members are waiting for verification." />
      ) : (
        <ul className="space-y-3">
          {data.map((d) => (
            <li key={d.id}>
              <Link href={`/admin/identity/${d.id}`} className="block rounded-card bg-surface p-4 shadow-card">
                <p className="font-bold">{name.get(d.user_id) ?? "Member"}</p>
                <p className="text-muted">
                  {d.doc_type === "passport" ? "Passport" : "Kenyan ID"} · {new Date(d.created_at).toLocaleDateString("en-GB")}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
