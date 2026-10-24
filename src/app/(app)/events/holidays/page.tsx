import Link from "next/link";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { fmtHoliday } from "@/lib/dates";
import ConfirmDelete from "@/components/ui/ConfirmDelete";
import HolidayAdmin from "./HolidayAdmin";

export const dynamic = "force-dynamic";

export default async function HolidaysPage({ searchParams }: { searchParams: { c?: string } }) {
  const filter = searchParams.c === "KE" || searchParams.c === "ZW" ? searchParams.c : "all";
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);
  let q = supabase.from("holidays").select("id,country,name,holiday_date,note").gte("holiday_date", today).order("holiday_date");
  if (filter !== "all") q = q.eq("country", filter);
  const [{ data }, manage] = await Promise.all([q, can("events.manage")]);

  const tab = (c: string, label: string) => (
    <Link
      href={c === "all" ? "/events/holidays" : `/events/holidays?c=${c}`}
      className={`flex h-11 flex-1 items-center justify-center rounded-full text-[15px] font-semibold ${filter === c ? "bg-primary text-white" : "bg-surface shadow-card"}`}
    >
      {label}
    </Link>
  );

  return (
    <>
      <Link href="/events" className="mb-3 inline-block font-semibold text-primary">&lsaquo; Events</Link>
      <h1 className="mb-4 text-[28px] font-bold leading-tight">Public holidays</h1>
      <div className="mb-4 flex gap-2">
        {tab("all", "Both")}
        {tab("KE", "Kenya")}
        {tab("ZW", "Zimbabwe")}
      </div>

      {!data || data.length === 0 ? (
        <p className="rounded-sheet bg-surface p-5 text-muted shadow-card">No upcoming holidays are listed yet.</p>
      ) : (
        <ul className="divide-y divide-line rounded-sheet bg-surface px-4 shadow-card">
          {data.map((h) => (
            <li key={h.id} className="py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{h.name}</p>
                  <p className="text-sm text-muted">{fmtHoliday(h.holiday_date)}</p>
                  {h.note && <p className="text-sm text-muted">{h.note}</p>}
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-[13px] font-semibold ${h.country === "KE" ? "bg-primary text-white" : "bg-accent text-ink"}`}>
                  {h.country === "KE" ? "Kenya" : "Zimbabwe"}
                </span>
              </div>
              {manage && <ConfirmDelete endpoint={`/api/holidays/${h.id}`} label="Remove" compact />}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-sm text-muted">Dates follow official government notices and can change. Always confirm important plans.</p>
      {manage && <HolidayAdmin />}
    </>
  );
}
