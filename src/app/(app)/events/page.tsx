import Link from "next/link";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { publicUrl } from "@/lib/storage";
import { categoryLabel, fmtHoliday } from "@/lib/dates";
import Carousel from "@/components/Carousel";
import EmptyState from "@/components/ui/EmptyState";
import EventCard from "@/components/ui/EventCard";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const supabase = createClient();
  const cutoff = new Date(Date.now() - 3 * 3600e3).toISOString();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: upcoming }, { data: past }, { data: holidays }, { data: moments }, canManage] = await Promise.all([
    supabase.from("events").select("id,title,category,starts_at,location").gte("starts_at", cutoff).order("starts_at").limit(15),
    supabase.from("events").select("id,title,category,starts_at,location").lt("starts_at", cutoff).order("starts_at", { ascending: false }).limit(12),
    supabase.from("holidays").select("id,country,name,holiday_date").gte("holiday_date", today).order("holiday_date").limit(4),
    supabase.from("event_photos").select("id,path,event_id").order("created_at", { ascending: false }).limit(8),
    can("events.manage"),
  ]);

  const counts = new Map<string, number>();
  await Promise.all(
    (upcoming ?? []).map(async (e) => {
      const { data } = await supabase.rpc("rsvp_summary", { p_event: e.id });
      counts.set(e.id, Number(data?.[0]?.going ?? 0));
    })
  );

  const pastIds = (past ?? []).map((e) => e.id);
  const { data: pastPhotos } = pastIds.length
    ? await supabase.from("event_photos").select("event_id,path").in("event_id", pastIds).order("created_at")
    : { data: [] as { event_id: string; path: string }[] };
  const cover = new Map<string, string>();
  (pastPhotos ?? []).forEach((p) => {
    if (!cover.has(p.event_id)) cover.set(p.event_id, p.path);
  });

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-[28px] font-bold leading-tight">Events</h1>
        {canManage && (
          <Link href="/events/new" className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white">
            Create event
          </Link>
        )}
      </div>

      <Link href="/places" className="mb-5 flex items-center justify-between rounded-sheet bg-gradient-to-r from-success to-ink p-5 text-white shadow-card">
        <span>
          <span className="block text-lg font-bold">Places to visit</span>
          <span className="block text-sm opacity-90">Attractions, restaurants, parks and malls</span>
        </span>
        <span aria-hidden="true" className="text-2xl">&rsaquo;</span>
      </Link>

      {moments && moments.length > 0 && (
        <Carousel aspect="aspect-[16/10]" className="mb-5 overflow-hidden rounded-sheet shadow-card">
          {moments.map((m) => (
            <Link key={m.id} href={`/events/${m.event_id}`} className="relative block h-full w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={publicUrl("event-photos", m.path) ?? ""} alt="" />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-4 pb-9 text-lg font-bold text-white">
                Moments from our events
              </span>
            </Link>
          ))}
        </Carousel>
      )}

      <h2 className="mb-3 text-[22px] font-bold">Coming up</h2>
      {!upcoming || upcoming.length === 0 ? (
        <EmptyState title="Nothing planned yet" body="New Kenzim events will appear here. Check back soon." />
      ) : (
        <ul className="space-y-3">
          {upcoming.map((e) => (
            <li key={e.id}>
              <EventCard id={e.id} title={e.title} category={e.category} startsAt={e.starts_at} location={e.location} going={counts.get(e.id)} />
            </li>
          ))}
        </ul>
      )}

      <div className="mb-3 mt-8 flex items-center justify-between">
        <h2 className="text-[22px] font-bold">Public holidays</h2>
        <Link href="/events/holidays" className="font-semibold text-primary">See all</Link>
      </div>
      {holidays && holidays.length > 0 ? (
        <ul className="divide-y divide-line rounded-sheet bg-surface px-4 shadow-card">
          {holidays.map((h) => (
            <li key={h.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="font-semibold">{h.name}</p>
                <p className="text-sm text-muted">{fmtHoliday(h.holiday_date)}</p>
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1 text-[13px] font-semibold ${h.country === "KE" ? "bg-primary text-white" : "bg-accent text-ink"}`}>
                {h.country === "KE" ? "Kenya" : "Zimbabwe"}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="No holidays listed" body="Public holidays for Kenya and Zimbabwe will appear here." />
      )}

      {past && past.length > 0 && (
        <>
          <h2 className="mb-3 mt-8 text-[22px] font-bold">Past events</h2>
          <ul className="space-y-3">
            {past.map((e) => (
              <li key={e.id}>
                <EventCard
                  id={e.id}
                  title={e.title}
                  category={e.category}
                  startsAt={e.starts_at}
                  location={`${categoryLabel[e.category] ?? "Event"}${e.location ? ` · ${e.location}` : ""}`}
                  coverUrl={publicUrl("event-photos", cover.get(e.id))}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
