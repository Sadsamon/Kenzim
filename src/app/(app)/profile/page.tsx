import Link from "next/link";
import { redirect } from "next/navigation";
import { getMe } from "@/lib/me";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/actions";

export const dynamic = "force-dynamic";

const statusText = {
  new: { label: "Not verified yet", tone: "bg-accent text-ink" },
  pending: { label: "Verification in progress", tone: "bg-accent text-ink" },
  verified: { label: "Verified member", tone: "bg-success text-white" },
  suspended: { label: "On hold", tone: "bg-primary text-white" },
} as const;

export default async function ProfilePage() {
  const me = await getMe();
  if (!me) redirect("/login");
  const s = statusText[me.status];
  const supabase = createClient();

  const [{ count: emp }, { count: ec }, { data: last }, reviewer] = await Promise.all([
    supabase.from("employment").select("user_id", { count: "exact", head: true }).eq("user_id", me.id),
    supabase.from("emergency_contacts").select("id", { count: "exact", head: true }).eq("user_id", me.id),
    supabase.from("identity_submissions").select("status").order("created_at", { ascending: false }).limit(1),
    can("identity.review"),
  ]);
  const rejected = last?.[0]?.status === "rejected";
  const detailsDone = (emp ?? 0) > 0 && (ec ?? 0) >= 2;

  return (
    <>
      <h1 className="mb-4 text-[28px] font-bold leading-tight">Profile</h1>
      <section className="rounded-sheet bg-surface p-5 shadow-card">
        <p className="text-xl font-bold">{me.fullName}</p>
        <p className="text-muted">{me.email}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${s.tone}`}>{s.label}</span>
          {me.isSenior && (
            <span className="rounded-full bg-accent px-3 py-1 text-sm font-semibold text-ink">Trusted</span>
          )}
          {me.roles.map((r) => (
            <span key={r} className="rounded-full border border-line px-3 py-1 text-sm font-semibold">{r}</span>
          ))}
        </div>
      </section>

      {me.status !== "verified" && me.status !== "suspended" && (
        <section className="mt-4 rounded-sheet bg-surface p-5 shadow-card">
          <h2 className="text-lg font-bold">Your verification</h2>
          <ul className="mt-3 space-y-3">
            <li className="flex items-center justify-between">
              <span>1. Identity document</span>
              {me.status === "pending" ? (
                <span className="font-semibold text-muted">In review</span>
              ) : (
                <Link href="/verify" className="font-semibold text-primary">{rejected ? "Try again" : "Start"}</Link>
              )}
            </li>
            <li className="flex items-center justify-between">
              <span>2. Employment, emergency, family</span>
              <Link href="/verify/details" className="font-semibold text-primary">{detailsDone ? "Edit" : "Add"}</Link>
            </li>
          </ul>
          {rejected && me.status === "new" && (
            <p className="mt-3 text-sm font-medium text-primary-dark">Your last submission could not be approved.</p>
          )}
        </section>
      )}

      {me.status === "verified" && (
        <Link href="/verify/details" className="mt-4 block rounded-sheet bg-surface p-5 font-semibold shadow-card">
          Edit your employment, emergency and family details
        </Link>
      )}

      <Link href="/about" className="mt-4 block rounded-sheet bg-surface p-5 font-semibold shadow-card">
        About Kenzim
      </Link>

      {reviewer && (
        <Link href="/admin/identity" className="mt-4 block rounded-sheet bg-ink p-5 font-semibold text-white shadow-card">
          Admin: verification queue
        </Link>
      )}

      <form action={logout} className="mt-6">
        <button className="h-[52px] w-full rounded-[14px] border border-line bg-surface font-semibold">
          Log out
        </button>
      </form>
    </>
  );
}
