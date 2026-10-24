"use client";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";

const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

type Props = { lat: number | null; lng: number | null; onChange: (lat: number, lng: number) => void };

// Tap the map to place the pin. Also offers "use my current location".
export default function PlacePicker({ lat, lng, onChange }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);
  const leaflet = useRef<typeof import("leaflet") | null>(null);
  const cb = useRef(onChange);
  const [msg, setMsg] = useState("");
  cb.current = onChange;

  function place(la: number, ln: number, pan = false) {
    const L = leaflet.current;
    const map = mapRef.current;
    if (!L || !map) return;
    if (!markerRef.current) {
      const icon = L.divIcon({
        className: "",
        html: '<span style="display:block;width:26px;height:26px;border-radius:50%;background:#BC0000;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.5)"></span>',
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });
      markerRef.current = L.marker([la, ln], { icon }).addTo(map);
    } else markerRef.current.setLatLng([la, ln]);
    if (pan) map.setView([la, ln], Math.max(map.getZoom(), 14));
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !el.current) return;
      leaflet.current = L;
      const start: [number, number] = lat != null && lng != null ? [lat, lng] : [-19.0, 29.9];
      const map = L.map(el.current, { scrollWheelZoom: false }).setView(start, lat != null ? 14 : 6);
      mapRef.current = map;
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: ATTRIBUTION }).addTo(map);
      if (lat != null && lng != null) place(lat, lng);
      map.on("click", (e: import("leaflet").LeafletMouseEvent) => {
        place(e.latlng.lat, e.latlng.lng);
        cb.current(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
      });
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function useMyLocation() {
    setMsg("");
    if (!navigator.geolocation) return setMsg("Your phone does not share its location with this page.");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const la = Number(pos.coords.latitude.toFixed(6));
        const ln = Number(pos.coords.longitude.toFixed(6));
        place(la, ln, true);
        onChange(la, ln);
      },
      () => setMsg("Could not get your location. Allow location access, or tap the map instead."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div>
      <div ref={el} className="z-0 h-72 w-full overflow-hidden rounded-card border border-line" aria-label="Tap the map to set the location" />
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">Tap the map to place the pin.</p>
        <button type="button" onClick={useMyLocation} className="h-11 shrink-0 rounded-full border border-line px-4 text-sm font-semibold">
          Use my location
        </button>
      </div>
      {msg && <p role="alert" className="mt-2 text-sm font-medium text-primary-dark">{msg}</p>}
    </div>
  );
}
