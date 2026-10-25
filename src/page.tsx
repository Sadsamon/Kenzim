import Link from "next/link";
import { notFound } from "next/navigation";
import { can } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function AdminHub() {
  const [approve, dues, roles, audit] = await Promise.all([
    can("members.verify"),
    can("dues.view"),
    can("roles.assign"),
    can("audit.read"),
  ]);
  const cards = [
    approve && { href: "/admin/members", title: "Member approvals", note: "Confirm new members" },
    dues && { href: "/admin/dues", title: "Dues", note: "Payments, balances and reminders" },
    roles && { href: "/admin/roles", title: "Members and roles", note: "Assign roles, Trusted badge, suspend" },
    audit && { href: "/admin/audit", title: "Activity log", note: "Who did what, and when" },
  ].filter(Boolean) as { href: string; title: string; note: string }[];
  if (cards.length === 0) notFound();

  return (
    <>
      <h1 className="mb-4 text-[28px] font-bold leading-tight">Admin</h1>
      <ul className="space-y-3">
        {cards.map((c) => (
          <li key={c.href}>
            <Link href={c.href} className="block rounded-sheet bg-surface p-5 shadow-card">
              <p className="text-lg font-bold">{c.title}</p>
              <p className="text-muted">{c.note}</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
