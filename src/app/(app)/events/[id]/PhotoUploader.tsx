"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { compressImage } from "@/lib/image";

export default function PhotoUploader({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files ?? []).slice(0, 12);
    e.target.value = "";
    if (!list.length) return;
    setBusy(true);
    setError("");
    setNote("");
    try {
      const fd = new FormData();
      for (let i = 0; i < list.length; i++) fd.append("photos", await compressImage(list[i]), `photo-${i + 1}.jpg`);
      const res = await fetch(`/api/events/${eventId}/photos`, { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Upload failed.");
      setNote(`${json.added} photo${json.added > 1 ? "s" : ""} added.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    }
    setBusy(false);
  }

  return (
    <div className="rounded-sheet bg-surface p-5 shadow-card">
      <h2 className="mb-1 text-lg font-bold">Event photos</h2>
      <p className="mb-3 text-sm text-muted">Choose up to 12 photos at a time.</p>
      <label className={`flex h-[52px] cursor-pointer items-center justify-center rounded-[14px] bg-ink font-semibold text-white ${busy ? "opacity-60" : ""}`}>
        {busy ? "Uploading..." : "Add photos"}
        <input type="file" accept="image/*" multiple disabled={busy} onChange={onFiles} className="hidden" />
      </label>
      {note && <p role="status" className="mt-2 text-sm font-semibold text-success">{note}</p>}
      {error && <p role="alert" className="mt-2 rounded-card bg-primary/10 p-3 text-sm font-medium text-primary-dark">{error}</p>}
    </div>
  );
}
