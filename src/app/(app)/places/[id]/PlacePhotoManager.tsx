"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { compressImage } from "@/lib/image";
import { publicUrl } from "@/lib/storage";

export default function PlacePhotoManager({ placeId, paths }: { placeId: string; paths: string[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files ?? []).slice(0, 8);
    e.target.value = "";
    if (!list.length) return;
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      for (let i = 0; i < list.length; i++) fd.append("photos", await compressImage(list[i]), `photo-${i + 1}.jpg`);
      const res = await fetch(`/api/places/${placeId}/photos`, { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Upload failed.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    }
    setBusy(false);
  }

  async function remove(path: string) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/places/${placeId}/photos?path=${encodeURIComponent(path)}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Could not remove the photo.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove the photo.");
    }
    setBusy(false);
  }

  return (
    <section className="rounded-sheet bg-surface p-5 shadow-card">
      <h2 className="mb-1 text-lg font-bold">Photos</h2>
      <p className="mb-3 text-sm text-muted">Up to 8 photos per place. The first one is the cover.</p>
      {paths.length > 0 && (
        <ul className="mb-3 grid grid-cols-3 gap-2">
          {paths.map((p, i) => (
            <li key={p} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={publicUrl("place-photos", p) ?? ""} alt={`Photo ${i + 1}`} className="aspect-square w-full rounded-card object-cover" />
              <button type="button" disabled={busy} onClick={() => remove(p)} aria-label={`Remove photo ${i + 1}`} className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-full bg-ink/70 text-lg font-bold text-white">
                &times;
              </button>
            </li>
          ))}
        </ul>
      )}
      <label className={`flex h-[52px] cursor-pointer items-center justify-center rounded-[14px] bg-ink font-semibold text-white ${busy ? "opacity-60" : ""}`}>
        {busy ? "Working..." : "Add photos"}
        <input type="file" accept="image/*" multiple disabled={busy} onChange={onFiles} className="hidden" />
      </label>
      {error && <p role="alert" className="mt-2 rounded-card bg-primary/10 p-3 text-sm font-medium text-primary-dark">{error}</p>}
    </section>
  );
}
