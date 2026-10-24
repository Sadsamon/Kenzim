import Link from "next/link";
import { notFound } from "next/navigation";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { countryName, directionsUrl, kindInfo } from "@/lib/places";
import { publicUrl } from "@/lib/storage";
import Carousel from "@/components/Carousel";
import PlacesMap from "@/components/maps/PlacesMap";
import ConfirmDelete from "@/components/ui/ConfirmDelete";
import Paragraphs from "@/components/ui/Paragraphs";
import PlacePhotoManager from "./PlacePhotoManager";

export const dynamic = "force-dynamic";

export default async function PlacePage({ params }: { params: { id: string } }) {
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound();
  const supabase = createClient();
  const { data: p } = await supabase
    .from("places")
    .select("id,name,kind,country,city,description,lat,lng,phone,website,photo_paths")
    .eq("id", params.id)
    .maybeSingle();
  if (!p) notFound();
  const manage = await can("places.manage");
  const info = kindInfo(p.kind);
  const imgs = (p.photo_paths ?? []).map((x: string) => publicUrl("place-photos", x)).filter(Boolean) as string[];

  return (
    <>
      <Link href="/places" className="mb-3 inline-block font-semibold text-primary">&lsaquo; All places</Link>
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
          <p className="text-sm font-semibold" style={{ color: info.color }}>{info.single}</p>
          <h1 className="mt-1 text-[26px] font-bold leading-tight">{p.name}</h1>
          <p className="text-muted">{[p.city, countryName(p.country)].filter(Boolean).join(", ")}</p>
          {p.description && <Paragraphs text={p.description} className="mt-4" />}
          <div className="mt-5 grid gap-3">
            <a href={directionsUrl(p.lat, p.lng)} target="_blank" rel="noopener noreferrer" className="flex h-[52px] items-center justify-center rounded-[14px] bg-primary font-semibold text-white">
              Get directions
            </a>
            {p.phone && (
              <a href={`tel:${p.phone.replace(/\s+/g, "")}`} className="flex h-[52px] items-center justify-center rounded-[14px] border border-line font-semibold">
                Call {p.phone}
              </a>
            )}
            {p.website && (
              <a href={p.website} target="_blank" rel="noopener noreferrer" className="flex h-[52px] items-center justify-center rounded-[14px] border border-line font-semibold">
                Visit website
              </a>
            )}
          </div>
        </div>
      </article>

      <div className="mt-4">
        <PlacesMap places={[{ id: p.id, name: p.name, kind: p.kind, lat: p.lat, lng: p.lng }]} height={220} />
      </div>

      {manage && (
        <div className="mt-4 space-y-3">
          <PlacePhotoManager placeId={p.id} paths={p.photo_paths ?? []} />
          <Link href={`/places/${p.id}/edit`} className="flex h-[52px] items-center justify-center rounded-[14px] border border-ink font-semibold">
            Edit place
          </Link>
          <ConfirmDelete endpoint={`/api/places/${p.id}`} label="Delete this place" redirectTo="/places" />
        </div>
      )}
    </>
  );
}
