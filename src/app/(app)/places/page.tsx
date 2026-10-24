import Link from "next/link";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { KINDS, countryName, kindInfo } from "@/lib/places";
import { publicUrl } from "@/lib/storage";
import PlacesMap from "@/components/maps/PlacesMap";
import EmptyState from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function PlacesPage({ searchParams }: { searchParams: { k?: string; c?: string } }) {
  const country = searchParams.c === "KE" || searchParams.c === "all" ? searchParams.c : "ZW";
  const kind = KINDS.some((x) => x.key === searchParams.k) ? searchParams.k! : "all";

  const supabase = createClient();
  let q = supabase.from("places").select("id,name,kind,country,city,description,lat,lng,photo_paths").order("name").limit(200);
  if (country !== "all") q = q.eq("country", country);
  if (kind !== "all") q = q.eq("kind", kind);
  const [{ data: places }, manage] = await Promise.all([q, can("places.manage")]);

  const href = (c: string, k: string) => {
    const p = new URLSearchParams();
    if (c !== "ZW") p.set("c", c);
    if (k !== "all") p.set("k", k);
    const s = p.toString();
    return s ? `/places?${s}` : "/places";
  };
  const chip = (active: boolean, to: string, label: string) => (
    <Link
      key={label}
      href={to}
      className={`flex h-11 shrink-0 items-center rounded-full px-4 text-[15px] font-semibold ${active ? "bg-primary text-white" : "bg-surface shadow-card"}`}
    >
      {label}
    </Link>
  );

  return (
    <>
      <Link href="/events" className="mb-3 inline-block font-semibold text-primary">&lsaquo; Events</Link>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-[28px] font-bold leading-tight">Places to visit</h1>
        {manage && (
          <Link href="/places/new" className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white">
            Add a place
          </Link>
        )}
      </div>

      <div className="no-scrollbar mb-2 flex gap-2 overflow-x-auto pb-1">
        {chip(country === "ZW", href("ZW", kind), "Zimbabwe")}
        {chip(country === "KE", href("KE", kind), "Kenya")}
        {chip(country === "all", href("all", kind), "Both")}
      </div>
      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1">
        {chip(kind === "all", href(country, "all"), "All")}
        {KINDS.filter((x) => x.key !== "other").map((x) => chip(kind === x.key, href(country, x.key), x.label))}
      </div>

      {places && places.length > 0 ? (
        <>
          <PlacesMap places={places.map((p) => ({ id: p.id, name: p.name, kind: p.kind, lat: p.lat, lng: p.lng }))} />
          <ul className="mt-5 space-y-3">
            {places.map((p) => {
              const photo = publicUrl("place-photos", p.photo_paths?.[0]);
              const info = kindInfo(p.kind);
              return (
                <li key={p.id}>
                  <Link href={`/places/${p.id}`} className="flex gap-4 overflow-hidden rounded-sheet bg-surface p-4 shadow-card">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo} alt="" className="h-20 w-20 shrink-0 rounded-card object-cover" />
                    ) : (
                      <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-card text-3xl font-bold text-white" style={{ background: info.color }} aria-hidden="true">
                        {p.name.charAt(0)}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold" style={{ color: info.color }}>{info.single}</p>
                      <h3 className="text-lg font-bold leading-snug">{p.name}</h3>
                      <p className="text-muted">{[p.city, countryName(p.country)].filter(Boolean).join(", ")}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <EmptyState title="Nothing here yet" body="Places will be added soon. Try another filter, or check back later." />
      )}
    </>
  );
}
