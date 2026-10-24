"use client";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { kindInfo } from "@/lib/places";

export type MapPlace = { id: string; name: string; kind: string; lat: number; lng: number };

const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export default function PlacesMap({ places, height = 280 }: { places: MapPlace[]; height?: number }) {
  const el = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    let map: import("leaflet").Map | null = null;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !el.current) return;
      map = L.map(el.current, { scrollWheelZoom: false }).setView([-19.0, 29.9], 6);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: ATTRIBUTION }).addTo(map);

      const pts: [number, number][] = [];
      places.forEach((p) => {
        const color = kindInfo(p.kind).color;
        const icon = L.divIcon({
          className: "",
          html: `<span style="display:block;width:22px;height:22px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></span>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });
        const box = document.createElement("div");
        const title = document.createElement("strong");
        title.textContent = p.name;
        const btn = document.createElement("button");
        btn.textContent = "View details";
        btn.style.cssText = "display:block;margin-top:6px;color:#BC0000;font-weight:600;background:none;border:0;padding:6px 0;cursor:pointer";
        btn.onclick = () => router.push(`/places/${p.id}`);
        box.append(title, btn);
        L.marker([p.lat, p.lng], { icon }).addTo(map!).bindPopup(box);
        pts.push([p.lat, p.lng]);
      });
      if (pts.length > 1) map.fitBounds(pts, { padding: [28, 28], maxZoom: 11 });
      else if (pts.length === 1) map.setView(pts[0], 10);
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [places, router]);

  return <div ref={el} style={{ height }} className="z-0 w-full overflow-hidden rounded-sheet shadow-card" aria-label="Map of places" />;
}
