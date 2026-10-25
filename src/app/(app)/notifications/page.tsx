import Link from "next/link";
import { redirect } from "next/navigation";
import { getMe } from "@/lib/me";
import { createClient } from "@/lib/supabase/server";
import { fmtDate } from "@/lib/storage";
import EmptyState from "@/components/ui/EmptyState";
import MarkRead from "./MarkRead";

export const dynamic = "force-dynamic";

export default async function Notifications() {
  const me = await getMe();
  if (!me) redirect("/login");
  const supabase = createClient();
  const { data } = await supabase
    .from("notifications")
    .select("id,title,body,link,created_at,read_at")
    .order("created_at", { ascending: false })
    .limit(50);
  const unread = (data ?? []).filter((n) => !n.read_at).length;

  return (
    <>
      <MarkRead unread={unread} />
      <h1 className="mb-4 text-[28px] font-bold leading-tight">Notifications</h1>
      {!data || data.length === 0 ? (
        <EmptyState title="You are all caught up" body="Reminders, payment confirmations and birthdays will appear here." />
      ) : (
        <ul className="space-y-3">
          {data.map((n) => {
            const inner = (
              <>
                <div className="flex items-start gap-3">
                  {!n.read_at && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" aria-label="New" />}
                  <div>
                    <p className="font-bold">{n.title}</p>
                    {n.body && <p className="text-muted">{n.body}</p>}
                    <p className="mt-1 text-sm text-muted">{fmtDate(n.created_at)}</p>
                  </div>
                </div>
              </>
            );
            return (
              <li key={n.id} className="rounded-card bg-surface p-4 shadow-card">
                {n.link ? <Link href={n.link} className="block">{inner}</Link> : inner}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
