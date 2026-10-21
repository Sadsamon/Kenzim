"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Shrinks a phone photo to about 1600px JPEG (well under 1 MB) before upload.
async function compress(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("compress"))), "image/jpeg", 0.8)
  );
}

export default function IdentityForm() {
  const router = useRouter();
  const [docType, setDocType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setError("");
    try {
      const blob = await compress(f);
      setPhoto(blob);
      setPreview(URL.createObjectURL(blob));
    } catch {
      setError("We could not read that photo. Please try another one.");
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!docType) return setError("Choose a document type.");
    if (idNumber.trim().length < 5) return setError("Enter the full document number.");
    if (!photo) return setError("Add a clear photo of your document.");
    setBusy(true);
    const fd = new FormData();
    fd.set("docType", docType);
    fd.set("idNumber", idNumber);
    fd.set("photo", photo, "id.jpg");
    try {
      const res = await fetch("/api/identity", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
      router.push("/verify/details");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="docType" className="mb-1 block text-[15px] font-semibold">Document type</label>
        <select
          id="docType"
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          className="h-[52px] w-full rounded-[14px] border border-line bg-surface px-4 text-base"
        >
          <option value="">Choose...</option>
          <option value="passport">Passport</option>
          <option value="kenyan_id">Kenyan ID</option>
        </select>
      </div>
      <div>
        <label htmlFor="idNumber" className="mb-1 block text-[15px] font-semibold">Document number</label>
        <input
          id="idNumber"
          value={idNumber}
          onChange={(e) => setIdNumber(e.target.value)}
          autoComplete="off"
          className="h-[52px] w-full rounded-[14px] border border-line bg-surface px-4 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div>
        <label htmlFor="photo" className="mb-1 block text-[15px] font-semibold">Photo of the document</label>
        <input id="photo" type="file" accept="image/*" onChange={onFile} className="block w-full text-base" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {preview && <img src={preview} alt="Your document preview" className="mt-3 max-h-56 rounded-card border border-line" />}
        <p className="mt-1 text-sm text-muted">Make sure all four corners and the number are clear.</p>
      </div>
      {error && <p role="alert" className="rounded-card bg-primary/10 p-3 text-sm font-medium text-primary-dark">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="h-[52px] w-full rounded-[14px] bg-primary font-semibold text-white active:bg-primary-dark disabled:opacity-60"
      >
        {busy ? "Uploading..." : "Submit for verification"}
      </button>
    </form>
  );
}
