"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { compressImage } from "@/lib/image";

const box = "w-full rounded-[14px] border border-line bg-surface px-4 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

export default function NewPostForm() {
  const router = useRouter();
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const blob = await compressImage(f);
      setPhoto(blob);
      setPreview(URL.createObjectURL(blob));
    } catch {
      setError("We could not read that photo.");
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    fd.delete("photo");
    if (photo) fd.set("photo", photo, "post.jpg");
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
        <label htmlFor="photo" className="mb-1 block text-[15px] font-semibold">Photo (optional)</label>
        <input id="photo" name="photo" type="file" accept="image/*" onChange={onFile} className="block w-full text-base" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {preview && <img src={preview} alt="Preview" className="mt-3 max-h-56 rounded-card" />}
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
