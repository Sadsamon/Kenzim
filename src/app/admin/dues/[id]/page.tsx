import Link from "next/link";
import { notFound } from "next/navigation";
import { can } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { duesState, fmtDay, monthlyDues, money, stateLabel, stateTone } from "@/lib/dues";
import RecordForm from "./RecordForm";
import VoidButton from "./VoidButton";

export const dynamic = "force-dynamic";

export default async function MemberDues({ params }: { params: { id: string } }) {
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound();
  if (!(await can("dues.view"))) notFound();
  const record = await can("dues.record");
  const admin = createAdminClient();

  const { data: m } = await admin.from("profiles").select("id,full_name,phone,paid_through,status").eq("id", params.id).single();
  if (!m) notFound();
  const { data: payments } = await admin
    .from("dues_payments")
    .select("id,amount_usd,months_covered,period_start,period_end,method,note,recorded_at,voided_at,void_reason")
    .eq("member_id", m.id)
    .order("recorded_at", { ascending: false })
    .limit(40);
  const monthly = await monthlyDues(createClient());
  const st = duesState(m.paid_through);

  return (
    <>
      <Link href="/admin/dues" className="mb-3 inline-block font-semibold text-primary">&lsaquo; Dues</Link>
      <h1 className="text-[28px] font-bold leading-tight">{m.full_name}</h1>
      <p className="mb-4 text-muted">{m.phone ?? "No phone"}</p>

      <section className="rounded-sheet bg-surface p-5 shadow-card">
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${stateTone[st.state]}`}>{stateLabel[st.state]}</span>
        <p className="mt-3 text-lg font-bold">{m.paid_through ? `Paid until ${fmtDay(m.paid_through)}` : "No payments recorded"}</p>
        {st.state === "overdue" && (
          <p className="text-muted">{st.months} month{st.months > 1 ? "s" : ""} overdue{monthly ? `, about ${money(monthly * st.months)}` : ""}</p>
        )}
      </section>

      {record && m.status === "verified" && (
        <section className="mt-4 rounded-sheet bg-surface p-5 shadow-card">
          <h2 className="mb-3 text-lg font-bold">Record a payment</h2>
          <RecordForm memberId={m.id} monthly={monthly} />
        </section>
      )}

      <h2 className="mb-3 mt-6 text-[22px] font-bold">History</h2>
      {payments && payments.length > 0 ? (
        <ul className="space-y-3">
          {payments.map((p) => (
            <li key={p.id} className={`rounded-card bg-surface p-4 shadow-card ${p.voided_at ? "opacity-60" : ""}`}>
              <p className="font-bold">
                {money(p.amount_usd)} · {p.months_covered} month{p.months_covered > 1 ? "s" : ""} {p.voided_at && <span className="text-primary">(voided)</span>}
              </p>
              <p className="text-sm text-muted">Covers {fmtDay(p.period_start)} to {fmtDay(p.period_end)} · {p.method}</p>
              <p className="text-sm text-muted">Recorded {new Date(p.recorded_at).toLocaleDateString("en-GB")}{p.note ? ` · ${p.note}` : ""}</p>
              {p.voided_at && p.void_reason && <p className="text-sm text-muted">Reason: {p.void_reason}</p>}
              {record && !p.voided_at && <VoidButton paymentId={p.id} />}
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-card bg-surface p-4 text-muted shadow-card">No payments yet.</p>
      )}
    </>
  );
}
