import Link from "next/link";
import { notFound } from "next/navigation";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function RolesList({ searchParams }: { searchParams: { q?: string } }) {
  if (!(await can("roles.assign"))) notFound();
  const supabase = createClient();
  const q = (searchParams.q ?? "").trim();
  let query = supabase.from("profiles").select("id,full_name,status,is_senior_member").order("full_name").limit(100);
  if (q) query = query.ilike("full_name", `%${q.replace(/[%_]/g, "")}%`);
  const [{ data: members }, { data: urs }, { data: roles }] = await Promise.all([
    query,
    supabase.from("user_roles").select("user_id,role_id"),
    supabase.from("roles").select("id,name"),
  ]);
  const rname = new Map((roles ?? []).map((r) => [r.id, r.name]));
  const has = new Map<string, string[]>();
  (urs ?? []).forEach((u) => has.set(u.user_id, [...(has.get(u.user_id) ?? []), rname.get(u.role_id) ?? ""]));

  return (
    <>
      <h1 className="mb-4 text-[28px] font-bold leading-tight">Members and roles</h1>
      <form className="mb-4">
        <input name="q" defaultValue={q} placeholder="Search by name" aria-label="Search" className="h-[52px] w-full rounded-[14px] border border-line bg-surface px-4 text-base outline-none focus:border-primary" />
      </form>
      <ul className="space-y-3">
        {(members ?? []).map((m) => (
          <li key={m.id}>
            <Link href={`/admin/roles/${m.id}`} className="block rounded-card bg-surface p-4 shadow-card">
              <p className="font-bold">{m.full_name}</p>
              <p className="text-sm text-muted">
                {m.status}{m.is_senior_member ? " · Trusted" : ""}{has.get(m.id)?.length ? ` · ${has.get(m.id)!.join(", ")}` : ""}
              </p>
            </Link>
          </li>
        ))}
        {(members ?? []).length === 0 && <li className="rounded-card bg-surface p-4 text-muted shadow-card">No members found.</li>}
      </ul>
    </>
  );
}
