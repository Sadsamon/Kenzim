"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { KINDS } from "@/lib/places";
import PlacePicker from "@/components/maps/PlacePicker";

const box = "w-full rounded-[14px] border border-line bg-surface px-4 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

type Initial = {
  id?: string;
  name?: string;
  kind?: string;
  country?: string;
  city?: string | null;
  description?: string | null;
  phone?: string | null;
  website?: string | null;
  lat?: number;
  lng?: number;
};

export default function PlaceForm({ initial }: { initial?: Initial }) {
  const router = useRouter();
  const editing = !!initial?.id;
  const [lat, setLat] = useState<number | null>(initial?.lat ?? null);
  const [lng, setLng] = useState<number | null>(initial?.lng ?? null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (lat == null || lng == null) return setError("Tap the map to set the location.");
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    try {
      const res = await fetch(editing ? `/api/places/${initial!.id}` : "/api/places", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          kind: fd.get("kind"),
          country: fd.get("country"),
          city: fd.get("city"),
          description: fd.get("description"),
          phone: fd.get("phone"),
          website: fd.get("website"),
          lat,
          lng,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
      router.push(`/places/${json.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="mb-1 block text-[15px] font-semibold">Name</label>
        <input id="name" name="name" defaultValue={initial?.name} maxLength={100} className={`${box} h-[52px]`} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="kind" className="mb-1 block text-[15px] font-semibold">Type</label>
          <select id="kind" name="kind" defaultValue={initial?.kind ?? "attraction"} className={`${box} h-[52px]`}>
            {KINDS.map((k) => (
              <option key={k.key} value={k.key}>{k.single}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="country" className="mb-1 block text-[15px] font-semibold">Country</label>
          <select id="country" name="country" defaultValue={initial?.country ?? "ZW"} className={`${box} h-[52px]`}>
            <option value="ZW">Zimbabwe</option>
            <option value="KE">Kenya</option>
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="city" className="mb-1 block text-[15px] font-semibold">City or town</label>
        <input id="city" name="city" defaultValue={initial?.city ?? ""} maxLength={80} className={`${box} h-[52px]`} />
      </div>
      <div>
        <span className="mb-1 block text-[15px] font-semibold">Location</span>
        <PlacePicker lat={lat} lng={lng} onChange={(a, b) => { setLat(a); setLng(b); }} />
        {lat != null && lng != null && <p className="mt-1 text-sm text-muted">Pin set at {lat}, {lng}</p>}
      </div>
      <div>
        <label htmlFor="description" className="mb-1 block text-[15px] font-semibold">About this place</label>
        <textarea id="description" name="description" rows={6} defaultValue={initial?.description ?? ""} maxLength={2000} className={`${box} py-3`} />
      </div>
      <div>
        <label htmlFor="phone" className="mb-1 block text-[15px] font-semibold">Phone (optional)</label>
        <input id="phone" name="phone" type="tel" defaultValue={initial?.phone ?? ""} maxLength={30} className={`${box} h-[52px]`} />
      </div>
      <div>
        <label htmlFor="website" className="mb-1 block text-[15px] font-semibold">Website (optional)</label>
        <input id="website" name="website" defaultValue={initial?.website ?? ""} maxLength={200} placeholder="https://" className={`${box} h-[52px]`} />
      </div>
      {error && <p role="alert" className="rounded-card bg-primary/10 p-3 text-sm font-medium text-primary-dark">{error}</p>}
      <button disabled={busy} className="h-[52px] w-full rounded-[14px] bg-primary font-semibold text-white disabled:opacity-60">
        {busy ? "Saving..." : editing ? "Save changes" : "Add place"}
      </button>
    </form>
  );
}
