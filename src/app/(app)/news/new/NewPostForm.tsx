"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { compressImage } from "@/lib/image";

const box = "w-full rounded-[14px] border border-line bg-surface px-4 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const MAX = 6;

type Photo = { id: string; blob: Blob; url: string };

export default function NewPostForm() {
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files ?? []);
    e.target.value = "";
    setError("");
    const room = MAX - photos.length;
    if (list.length > room) setError(`You can add up to ${MAX} photos. Extra photos were skipped.`);
    const added: Photo[] = [];
    for (const f of list.slice(0, Math.max(room, 0))) {
      try {
        const blob = await compressImage(f);
        added.push({ id: crypto.randomUUID(), blob, url: URL.createObjectURL(blob) });
      } catch {
        setError("One of the photos could not be read.");
      }
    }
    setPhotos((p) => [...p, ...added]);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    fd.delete("photos");
    photos.forEach((p, i) => fd.append("photos", p.blob, `photo-${i + 1}.jpg`));
    try {
      const res = await fetch("/api/news", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
      router.push(`/news/${json.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="mb-1 block text-[15px] font-semibold">Title</label>
        <input id="title" name="title" maxLength={120} className={`${box} h-[52px]`} />
      </div>
      <div>
        <label htmlFor="kind" className="mb-1 block text-[15px] font-semibold">Type of post</label>
        <select id="kind" name="kind" className={`${box} h-[52px]`} defaultValue="admin">
          <option value="admin">Kenzim update</option>
          <option value="embassy">Embassy news</option>
          <option value="community">Community</option>
        </select>
      </div>
      <div>
        <label htmlFor="body" className="mb-1 block text-[15px] font-semibold">Post text</label>
        <textarea id="body" name="body" rows={8} maxLength={5000} className={`${box} py-3`} />
        <p className="mt-1 text-sm text-muted">Leave a blank line between paragraphs.</p>
      </div>
      <div>
        <label htmlFor="photos" className="mb-1 block text-[15px] font-semibold">Photos (optional, up to {MAX})</label>
        <input id="photos" type="file" accept="image/*" multiple onChange={onFiles} className="block w-full text-base" />
        {photos.length > 0 && (
          <ul className="mt-3 grid grid-cols-3 gap-2">
            {photos.map((p, i) => (
              <li key={p.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={`Photo ${i + 1}`} className="aspect-square w-full rounded-card object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotos((all) => all.filter((x) => x.id !== p.id))}
                  aria-label={`Remove photo ${i + 1}`}
                  className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-full bg-ink/70 text-lg font-bold text-white"
                >
                  &times;
                </button>
              </li>
            ))}
          </ul>
        )}
        {photos.length > 1 && <p className="mt-1 text-sm text-muted">The first photo is the cover. Members can swipe through the rest.</p>}
      </div>
      <label className="flex items-center gap-3 text-base">
        <input type="checkbox" name="pinned" className="h-5 w-5" /> Pin to the top of the feed
      </label>
      <div>
        <label htmlFor="popupDays" className="mb-1 block text-[15px] font-semibold">Show as a pop-up when members open the app</label>
        <select id="popupDays" name="popupDays" className={`${box} h-[52px]`} defaultValue="0">
          <option value="0">No pop-up</option>
          <option value="3">For 3 days</option>
          <option value="7">For 7 days</option>
          <option value="14">For 14 days</option>
        </select>
      </div>
      {error && <p role="alert" className="rounded-card bg-primary/10 p-3 text-sm font-medium text-primary-dark">{error}</p>}
      <button disabled={busy} className="h-[52px] w-full rounded-[14px] bg-primary font-semibold text-white disabled:opacity-60">
        {busy ? "Publishing..." : "Publish"}
      </button>
    </form>
  );
}
