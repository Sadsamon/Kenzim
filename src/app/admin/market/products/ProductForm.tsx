"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { compressImage } from "@/lib/image";
import { publicUrl } from "@/lib/storage";
import ConfirmDelete from "@/components/ui/ConfirmDelete";

const box = "w-full rounded-[14px] border border-line bg-surface px-4 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

type Initial = {
  id?: string; retailer_id?: string; name?: string; category?: string | null; description?: string | null;
  price_kes?: number; weight_kg?: number | null; active?: boolean; image_path?: string | null;
};

export default function ProductForm({ retailers, initial }: { retailers: { id: string; name: string }[]; initial?: Initial }) {
  const router = useRouter();
  const editing = !!initial?.id;
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(publicUrl("product-images", initial?.image_path));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const b = await compressImage(f, 1200, 0.8);
      setPhoto(b);
      setPreview(URL.createObjectURL(b));
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
    if (photo) fd.set("photo", photo, "product.jpg");
    try {
      const res = await fetch(editing ? `/api/market/products/${initial!.id}` : "/api/market/products", { method: editing ? "PUT" : "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
      router.push("/admin/market/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="retailerId" className="mb-1 block text-[15px] font-semibold">Shop</label>
          <select id="retailerId" name="retailerId" defaultValue={initial?.retailer_id ?? ""} className={`${box} h-[52px]`}>
            <option value="">Choose a shop...</option>
            {retailers.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="name" className="mb-1 block text-[15px] font-semibold">Product name</label>
          <input id="name" name="name" defaultValue={initial?.name} maxLength={120} className={`${box} h-[52px]`} />
        </div>
        <div>
          <label htmlFor="category" className="mb-1 block text-[15px] font-semibold">Type (optional)</label>
          <input id="category" name="category" defaultValue={initial?.category ?? ""} maxLength={40} placeholder="e.g. Tea and coffee" className={`${box} h-[52px]`} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="priceKes" className="mb-1 block text-[15px] font-semibold">Price (KES)</label>
            <input id="priceKes" name="priceKes" inputMode="decimal" defaultValue={initial?.price_kes ?? ""} className={`${box} h-[52px]`} />
          </div>
          <div>
            <label htmlFor="weightKg" className="mb-1 block text-[15px] font-semibold">Weight (kg)</label>
            <input id="weightKg" name="weightKg" inputMode="decimal" defaultValue={initial?.weight_kg ?? ""} placeholder="for shipping" className={`${box} h-[52px]`} />
          </div>
        </div>
        <div>
          <label htmlFor="description" className="mb-1 block text-[15px] font-semibold">Description (optional)</label>
          <textarea id="description" name="description" rows={3} defaultValue={initial?.description ?? ""} maxLength={1000} className={`${box} py-3`} />
        </div>
        <div>
          <label htmlFor="photo" className="mb-1 block text-[15px] font-semibold">Photo (optional)</label>
          <input id="photo" type="file" accept="image/*" onChange={onFile} className="block w-full text-base" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {preview && <img src={preview} alt="Product preview" className="mt-3 h-40 w-40 rounded-card object-cover" />}
        </div>
        <label className="flex items-center gap-3 text-base">
          <input type="checkbox" name="active" defaultChecked={initial?.active ?? true} className="h-5 w-5" /> Show in the shop
        </label>
        {error && <p role="alert" className="rounded-card bg-primary/10 p-3 text-sm font-medium text-primary-dark">{error}</p>}
        <button disabled={busy} className="h-[52px] w-full rounded-[14px] bg-primary font-semibold text-white disabled:opacity-60">{busy ? "Saving..." : editing ? "Save changes" : "Add product"}</button>
      </form>
      {editing && (
        <div className="mt-4">
          <ConfirmDelete endpoint={`/api/market/products/${initial!.id}`} label="Delete this product" redirectTo="/admin/market/products" />
          <p className="mt-2 text-sm text-muted">Past orders keep their own copy of the name and price. To pause a product, untick &quot;Show in the shop&quot; instead.</p>
        </div>
      )}
    </>
  );
}
