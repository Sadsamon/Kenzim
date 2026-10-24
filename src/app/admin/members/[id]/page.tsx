import { notFound, redirect } from "next/navigation";
import { can } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { decide } from "./actions";

export const dynamic = "force-dynamic";

export default async function MemberReview({ params }: { params: { id: string } }) {
  if (!(await can("members.verify"))) notFound();
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound();
  const admin = createAdminClient();

  const { data: m } = await admin
    .from("profiles")
    .select("id,full_name,phone,city_zw,status,created_at")
    .eq("id", params.id)
    .single();
  if (!m) notFound();
  if (m.status !== "pending") redirect("/admin/members");

  const [{ data: emp }, { data: contacts }, { count: fam }] = await Promise.all([
    admin.from("employment").select("occupation,employer,work_city,work_phone").eq("user_id", m.id).maybeSingle(),
    admin.from("emergency_contacts").select("kind,full_name,relationship,phone").eq("user_id", m.id),
    admin.from("family_members").select("id", { count: "exact", head: true }).eq("user_id", m.id),
  ]);
  const kenya = contacts?.find((c) => c.kind === "kenya_contact");
  const zim = contacts?.find((c) => c.kind === "zimbabwe_next_of_kin");

  const Row = ({ k, v }: { k: string; v?: string | null }) => (
    <div className="flex justify-between gap-4 py-2">
      <dt className="text-muted">{k}</dt>
      <dd className="text-right font-semibold">{v || "-"}</dd>
    </div>
  );

  return (
    <>
      <h1 className="mb-1 text-[28px] font-bold leading-tight">{m.full_name}</h1>
      <p className="mb-4 text-muted">Requested on {new Date(m.created_at).toLocaleDateString("en-GB")}</p>

      <section className="rounded-sheet bg-surface p-5 shadow-card">
        <h2 className="mb-1 text-lg font-bold">Contact</h2>
        <dl className="divide-y divide-line">
          <Row k="Phone" v={m.phone} />
          <Row k="City in Zimbabwe" v={m.city_zw} />
        </dl>
      </section>

      <section className="mt-4 rounded-sheet bg-surface p-5 shadow-card">
        <h2 className="mb-1 text-lg font-bold">Employment</h2>
        <dl className="divide-y divide-line">
          <Row k="Occupation" v={emp?.occupation} />
          <Row k="Employer" v={emp?.employer} />
          <Row k="Workplace city" v={emp?.work_city} />
        </dl>
      </section>

      <section className="mt-4 rounded-sheet bg-surface p-5 shadow-card">
        <h2 className="mb-1 text-lg font-bold">Emergency contacts</h2>
        <dl className="divide-y divide-line">
          <Row k="Kenya" v={kenya ? `${kenya.full_name} (${kenya.relationship}) ${kenya.phone}` : null} />
          <Row k="Next of kin in Zimbabwe" v={zim ? `${zim.full_name} (${zim.relationship}) ${zim.phone}` : null} />
          <Row k="Family members added" v={String(fam ?? 0)} />
        </dl>
      </section>

      <p className="mt-4 text-sm text-muted">
        Confirm the member&apos;s identity yourself (for example by phone or in person) before approving.
      </p>
      <form action={decide} className="mt-4 grid grid-cols-2 gap-3">
        <input type="hidden" name="id" value={m.id} />
        <button name="decision" value="reject" className="h-[52px] rounded-[14px] border border-primary font-semibold text-primary">
          Reject
        </button>
        <button name="decision" value="approve" className="h-[52px] rounded-[14px] bg-success font-semibold text-white">
          Approve
        </button>
      </form>
    </>
  );
}
