import Link from "next/link";
import { notFound } from "next/navigation";
import { can } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import EmptyState from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function MemberQueue() {
  if (!(await can("members.verify"))) notFound();
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id,full_name,city_zw,phone,created_at")
    .eq("status", "pending")
    .order("created_at");

  return (
    <>
      <h1 className="mb-4 text-[28px] font-bold leading-tight">Member approvals</h1>
      {!data || data.length === 0 ? (
        <EmptyState title="All caught up" body="No members are waiting for approval." />
      ) : (
        <ul className="space-y-3">
          {data.map((m) => (
            <li key={m.id}>
              <Link href={`/admin/members/${m.id}`} className="block rounded-card bg-surface p-4 shadow-card">
                <p className="font-bold">{m.full_name}</p>
                <p className="text-muted">{m.city_zw ?? "City not given"} · {m.phone ?? "No phone"}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
