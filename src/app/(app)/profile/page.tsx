import Link from "next/link";
import { redirect } from "next/navigation";
import { getMe } from "@/lib/me";
import { can } from "@/lib/permissions";
import { logout } from "@/app/(auth)/actions";

export const dynamic = "force-dynamic";

const statusText = {
  new: { label: "Not verified yet", tone: "bg-accent text-ink" },
  pending: { label: "Verification requested", tone: "bg-accent text-ink" },
  verified: { label: "Verified member", tone: "bg-success text-white" },
  suspended: { label: "On hold", tone: "bg-primary text-white" },
} as const;

export default async function ProfilePage() {
  const me = await getMe();
  if (!me) redirect("/login");
  const s = statusText[me.status];
  const approver = await can("members.verify");

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

      {(me.status === "new" || me.status === "pending") && (
        <Link href="/verify" className="mt-4 block rounded-sheet bg-surface p-5 shadow-card">
          <h2 className="text-lg font-bold">{me.status === "new" ? "Become a verified member" : "Request received"}</h2>
          <p className="mt-1 text-muted">
            {me.status === "new"
              ? "Add your details and ask an admin to verify you. This unlocks the Directory and Marketplace."
              : "An admin will confirm your membership soon."}
          </p>
          <p className="mt-2 font-semibold text-primary">{me.status === "new" ? "Start" : "View"}</p>
        </Link>
      )}

      {me.status === "verified" && (
        <Link href="/verify/details" className="mt-4 block rounded-sheet bg-surface p-5 font-semibold shadow-card">
          Edit your contact, employment, emergency and family details
        </Link>
      )}

      <Link href="/about" className="mt-4 block rounded-sheet bg-surface p-5 font-semibold shadow-card">
        About Kenzim
      </Link>

      {approver && (
        <Link href="/admin/members" className="mt-4 block rounded-sheet bg-ink p-5 font-semibold text-white shadow-card">
          Admin: member approvals
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
