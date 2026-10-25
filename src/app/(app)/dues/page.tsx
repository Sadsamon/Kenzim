import Link from "next/link";
import { redirect } from "next/navigation";
import { getMe } from "@/lib/me";
import { createClient } from "@/lib/supabase/server";
import { duesState, fmtDay, monthlyDues, money, stateLabel, stateTone } from "@/lib/dues";

export const dynamic = "force-dynamic";

export default async function MyDues() {
  const me = await getMe();
  if (!me) redirect("/login");
  const supabase = createClient();
  const [{ data: prof }, { data: payments }, monthly] = await Promise.all([
    supabase.from("profiles").select("paid_through").eq("id", me.id).single(),
    supabase
      .from("dues_payments")
      .select("id,amount_usd,months_covered,period_start,period_end,method,recorded_at")
      .eq("member_id", me.id)
      .is("voided_at", null)
      .order("recorded_at", { ascending: false })
      .limit(24),
    monthlyDues(supabase),
  ]);
  const st = duesState(prof?.paid_through ?? null);

  return (
    <>
      <Link href="/profile" className="mb-3 inline-block font-semibold text-primary">&lsaquo; Profile</Link>
      <h1 className="mb-4 text-[28px] font-bold leading-tight">My dues</h1>

      <section className="rounded-sheet bg-surface p-5 shadow-card">
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${stateTone[st.state]}`}>{stateLabel[st.state]}</span>
        {prof?.paid_through ? (
          <>
            <p className="mt-3 text-xl font-bold">Paid until {fmtDay(prof.paid_through)}</p>
            {st.state === "overdue" && (
              <p className="mt-1 text-muted">
                {st.months} month{st.months > 1 ? "s" : ""} overdue{monthly ? ` (about ${money(monthly * st.months)})` : ""}.
              </p>
            )}
            {st.state === "soon" && <p className="mt-1 text-muted">Your next payment is due in {st.days} day{st.days === 1 ? "" : "s"}.</p>}
          </>
        ) : (
          <p className="mt-3 text-muted">No dues have been recorded for you yet.</p>
        )}
        {monthly && <p className="mt-3 text-sm text-muted">Monthly dues: {money(monthly)}. You may also pay several months at once.</p>}
        <p className="mt-3 text-sm text-muted">Pay your Treasurer directly. They record your payment here and you will get a confirmation.</p>
      </section>

      <h2 className="mb-3 mt-6 text-[22px] font-bold">Payment history</h2>
      {payments && payments.length > 0 ? (
        <ul className="divide-y divide-line rounded-sheet bg-surface px-4 shadow-card">
          {payments.map((p) => (
            <li key={p.id} className="py-3">
              <p className="font-semibold">{money(p.amount_usd)} · {p.months_covered} month{p.months_covered > 1 ? "s" : ""}</p>
              <p className="text-sm text-muted">Covers {fmtDay(p.period_start)} to {fmtDay(p.period_end)} · {p.method}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-sheet bg-surface p-5 text-muted shadow-card">No payments yet.</p>
      )}
    </>
  );
}
