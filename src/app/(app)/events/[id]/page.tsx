import Link from "next/link";
import { notFound } from "next/navigation";
import { getMe } from "@/lib/me";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { publicUrl } from "@/lib/storage";
import { categoryLabel, fmtEventDate, fmtEventTime } from "@/lib/dates";
import Carousel from "@/components/Carousel";
import ConfirmDelete from "@/components/ui/ConfirmDelete";
import Paragraphs from "@/components/ui/Paragraphs";
import PhotoUploader from "./PhotoUploader";
import RsvpPanel from "./RsvpPanel";

export const dynamic = "force-dynamic";

export default async function EventPage({ params }: { params: { id: string } }) {
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound();
  const me = await getMe();
  const supabase = createClient();
  const { data: e } = await supabase
    .from("events")
    .select("id,title,category,description,location,starts_at,ends_at")
    .eq("id", params.id)
    .maybeSingle();
  if (!e) notFound();

  const [{ data: photos }, { data: mine }, { data: sum }, manage, gallery] = await Promise.all([
    supabase.from("event_photos").select("id,path").eq("event_id", e.id).order("created_at"),
    supabase.from("event_rsvps").select("status,guests").eq("event_id", e.id).eq("user_id", me?.id ?? "").maybeSingle(),
    supabase.rpc("rsvp_summary", { p_event: e.id }),
    can("events.manage"),
    can("gallery.manage"),
  ]);
  const going = Number(sum?.[0]?.going ?? 0);
  const maybe = Number(sum?.[0]?.interested ?? 0);
  const guests = Number(sum?.[0]?.guests ?? 0);
  const imgs = (photos ?? []).map((p) => publicUrl("event-photos", p.path)).filter(Boolean) as string[];
  const isPast = new Date(e.starts_at).getTime() < Date.now() - 3 * 3600e3;
  const verified = me?.status === "verified";

  let names: string[] = [];
  if (manage) {
    const admin = createAdminClient();
    const { data: rsvps } = await admin.from("event_rsvps").select("user_id,guests").eq("event_id", e.id).eq("status", "going");
    const ids = (rsvps ?? []).map((r) => r.user_id);
    if (ids.length) {
      const { data: profs } = await admin.from("profiles").select("id,full_name").in("id", ids);
      const g = new Map((rsvps ?? []).map((r) => [r.user_id, r.guests]));
      names = (profs ?? []).map((p) => `${p.full_name}${g.get(p.id) ? ` (+${g.get(p.id)})` : ""}`).sort();
    }
  }

  return (
    <>
      <Link href="/events" className="mb-3 inline-block font-semibold text-primary">&lsaquo; All events</Link>

      <article className="overflow-hidden rounded-sheet bg-surface shadow-card">
        {imgs.length > 0 && (
          <Carousel aspect="aspect-[4/3]">
            {imgs.map((u) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={u} src={u} alt="" />
            ))}
          </Carousel>
        )}
        <div className="p-5">
          <p className="text-sm font-semibold text-primary">{categoryLabel[e.category] ?? "Event"}</p>
          <h1 className="mt-1 text-[26px] font-bold leading-tight">{e.title}</h1>
          <p className="mt-3 font-semibold">{fmtEventDate(e.starts_at)}</p>
          <p className="text-muted">
            {fmtEventTime(e.starts_at)}
            {e.ends_at ? ` to ${fmtEventTime(e.ends_at)}` : ""} (Zimbabwe time)
          </p>
          {e.location && <p className="mt-1 text-muted">{e.location}</p>}
          {e.description && <Paragraphs text={e.description} className="mt-4" />}
          {!isPast && going + maybe > 0 && (
            <p className="mt-4 text-sm font-semibold text-success">
              {going} going{maybe ? ` · ${maybe} maybe` : ""}
            </p>
          )}
        </div>
      </article>

      {!isPast && (
        <div className="mt-4">
          {verified ? (
            <RsvpPanel eventId={e.id} current={(mine?.status as "going" | "interested" | "declined") ?? null} guests={mine?.guests ?? 0} />
          ) : (
            <Link href="/verify" className="block rounded-sheet bg-accent p-5 font-semibold shadow-card">
              Only verified members can reply. Tap to finish your verification.
            </Link>
          )}
        </div>
      )}

      {manage && (
        <section className="mt-4 rounded-sheet bg-surface p-5 shadow-card">
          <h2 className="text-lg font-bold">Headcount</h2>
          <p className="mt-1 text-muted">
            {going} members going with {guests} guest{guests === 1 ? "" : "s"}: {going + guests} people in total. {maybe} maybe.
          </p>
          {names.length > 0 && <p className="mt-2 text-sm text-muted">{names.join(", ")}</p>}
        </section>
      )}

      {(manage || gallery) && (
        <div className="mt-4">
          <PhotoUploader eventId={e.id} />
        </div>
      )}

      {manage && (
        <div className="mt-4 space-y-3">
          <Link href={`/events/${e.id}/edit`} className="flex h-[52px] items-center justify-center rounded-[14px] border border-ink font-semibold">
            Edit event
          </Link>
          <ConfirmDelete endpoint={`/api/events/${e.id}`} label="Delete this event" redirectTo="/events" />
        </div>
      )}
    </>
  );
}
