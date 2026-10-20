import { redirect } from "next/navigation";
import { getMe } from "@/lib/me";
import { logout } from "@/app/(auth)/actions";

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

      {me.status === "new" && (
        <section className="mt-4 rounded-sheet bg-surface p-5 shadow-card">
          <h2 className="text-lg font-bold">Verify your identity</h2>
          <p className="mt-1 text-muted">
            Verification unlocks the Directory and Marketplace. It opens in the next update.
          </p>
        </section>
      )}

      <form action={logout} className="mt-6">
        <button className="h-[52px] w-full rounded-[14px] border border-line bg-surface font-semibold">
          Log out
        </button>
      </form>
    </>
  );
}
