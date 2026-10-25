import Link from "next/link";
import { notFound } from "next/navigation";
import { can } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { duesState, fmtDay, monthlyDues, money, stateLabel, stateTone, type DuesState } from "@/lib/dues";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function DuesAdmin({ searchParams }: { searchParams: { f?: string; q?: string } }) {
  if (!(await can("dues.view"))) notFound();
  const configure = await can("dues.configure");
  const admin = createAdminClient();
  const monthly = await monthlyDues(createClient());

  const { data } = await admin.from("profiles").select("id,full_name,phone,paid_through").eq("status", "verified").order("full_name").limit(500);
  const rows = (data ?? []).map((m) => ({ ...m, st: duesState(m.paid_through) }));
  const count = (s: DuesState) => rows.filter((r) => r.st.state === s).length;
  const owed = monthly ? rows.filter((r) => r.st.state === "overdue").reduce((sum, r) => sum + r.st.months * monthly, 0) : null;

  const f = ["paid", "soon", "overdue", "never"].includes(searchParams.f ?? "") ? (searchParams.f as DuesState) : "all";
  const q = (searchParams.q ?? "").trim().toLowerCase();
  const shown = rows.filter((r) => (f === "all" || r.st.state === f) && (!q || r.full_name.toLowerCase().includes(q)));

  const chip = (key: string, label: string) => (
    <Link key={key} href={key === "all" ? "/admin/dues" : `/admin/dues?f=${key}`} className={`flex h-11 shrink-0 items-center rounded-full px-4 text-[15px] font-semibold ${f === key ? "bg-primary text-white" : "bg-surface shadow-card"}`}>
      {label}
    </Link>
  );

  return (
    <>
      <h1 className="mb-4 text-[28px] font-bold leading-tight">Dues</h1>

      <div className="mb-4 grid grid-cols-2 gap-3">
        {([["paid", "Paid up"], ["soon", "Due soon"], ["overdue", "Overdue"], ["never", "No payments"]] as [DuesState, string][]).map(([s, label]) => (
          <div key={s} className="rounded-card bg-surface p-4 shadow-card">
            <p className="text-3xl font-bold">{count(s)}</p>
            <p className="text-muted">{label}</p>
          </div>
        ))}
      </div>
      {owed !== null && owed > 0 && <p className="mb-4 text-muted">About {money(owed)} outstanding from overdue members at the monthly rate.</p>}

      <SettingsForm current={monthly} canEdit={configure} />

      <form className="mb-3 mt-5">
        {f !== "all" && <input type="hidden" name="f" value={f} />}
        <input name="q" defaultValue={searchParams.q ?? ""} placeholder="Search by name" aria-label="Search" className="h-[52px] w-full rounded-[14px] border border-line bg-surface px-4 text-base outline-none focus:border-primary" />
      </form>
      <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto pb-1">
        {chip("all", "All")}
        {chip("overdue", "Overdue")}
        {chip("soon", "Due soon")}
        {chip("paid", "Paid up")}
        {chip("never", "No payments")}
      </div>

      <ul className="space-y-3">
        {shown.map((m) => (
          <li key={m.id}>
            <Link href={`/admin/dues/${m.id}`} className="flex items-center justify-between gap-3 rounded-card bg-surface p-4 shadow-card">
              <div>
                <p className="font-bold">{m.full_name}</p>
                <p className="text-sm text-muted">{m.paid_through ? `Until ${fmtDay(m.paid_through)}` : "Never paid"}</p>
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1 text-[13px] font-semibold ${stateTone[m.st.state]}`}>{stateLabel[m.st.state]}</span>
            </Link>
          </li>
        ))}
        {shown.length === 0 && <li className="rounded-card bg-surface p-4 text-muted shadow-card">No members match.</li>}
      </ul>
    </>
  );
}
