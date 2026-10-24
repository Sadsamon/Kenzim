"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  endpoint: string; // DELETE request is sent here
  label: string;
  redirectTo?: string;
  compact?: boolean;
};

// Two-step delete: first tap asks, second tap deletes and shows any error in plain words.
export default function ConfirmDelete({ endpoint, label, redirectTo, compact = false }: Props) {
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(endpoint, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Could not delete.");
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete.");
      setBusy(false);
    }
  }

  const pad = compact ? "px-4 pb-3" : "";
  const h = compact ? "h-11 text-sm rounded-[12px]" : "h-[52px] rounded-[14px]";

  if (!asking) {
    return (
      <button
        type="button"
        onClick={() => setAsking(true)}
        className={compact ? "h-11 px-4 text-sm font-semibold text-primary" : "h-[52px] w-full rounded-[14px] border border-primary font-semibold text-primary"}
      >
        {label}
      </button>
    );
  }

  return (
    <div className={pad}>
      <div className="grid grid-cols-2 gap-3">
        <button type="button" disabled={busy} onClick={() => setAsking(false)} className={`${h} border border-line font-semibold`}>
          Keep it
        </button>
        <button type="button" disabled={busy} onClick={remove} className={`${h} bg-primary font-semibold text-white disabled:opacity-60`}>
          {busy ? "Deleting..." : "Yes, delete"}
        </button>
      </div>
      {error && <p role="alert" className="mt-2 rounded-card bg-primary/10 p-3 text-sm font-medium text-primary-dark">{error}</p>}
    </div>
  );
}
