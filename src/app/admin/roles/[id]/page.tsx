import Link from "next/link";
import { notFound } from "next/navigation";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import MemberControls from "./MemberControls";

export const dynamic = "force-dynamic";

export default async function MemberRoles({ params }: { params: { id: string } }) {
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound();
  if (!(await can("roles.assign"))) notFound();
  const canSuspend = await can("members.suspend");
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: m }, { data: roles }, { data: mine }] = await Promise.all([
    supabase.from("profiles").select("id,full_name,status,is_senior_member,phone,city_zw").eq("id", params.id).single(),
    supabase.from("roles").select("id,key,name").order("name"),
    supabase.from("user_roles").select("role_id").eq("user_id", params.id),
  ]);
  if (!m) notFound();
  const held = new Set((mine ?? []).map((r) => r.role_id));

  return (
    <>
      <Link href="/admin/roles" className="mb-3 inline-block font-semibold text-primary">&lsaquo; Members and roles</Link>
      <h1 className="text-[28px] font-bold leading-tight">{m.full_name}</h1>
      <p className="mb-4 text-muted">{m.status}{m.city_zw ? ` · ${m.city_zw}` : ""}{m.phone ? ` · ${m.phone}` : ""}</p>
      <MemberControls
        memberId={m.id}
        isSelf={user?.id === m.id}
        trusted={m.is_senior_member}
        suspended={m.status === "suspended"}
        canSuspend={canSuspend}
        roles={(roles ?? []).map((r) => ({ key: r.key, name: r.name, held: held.has(r.id) }))}
      />
    </>
  );
}
