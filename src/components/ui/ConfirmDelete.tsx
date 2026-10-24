"use client";

import { useState } from "react";

type Props = {
  action: (formData: FormData) => Promise<void> | void;
  id: string | number;
  label: string;
  compact?: boolean;
};

export default function ConfirmDelete({ action, id, label, compact = false }: Props) {
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(formData: FormData) {
    setBusy(true);
    setError("");

    try {
      await action(formData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete.");
    } finally {
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
        className={
          compact
            ? "h-11 px-4 text-sm font-semibold text-primary"
            : "h-[52px] w-full rounded-[14px] border border-primary font-semibold text-primary"
        }
      >
        {label}
      </button>
    );
  }

  return (
    <div className={pad}>
      <form action={handleSubmit}>
        <input type="hidden" name="id" value={String(id)} />

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => setAsking(false)}
            className={`${h} border border-line font-semibold`}
          >
            Keep it
          </button>

          <button
            type="submit"
            disabled={busy}
            className={`${h} bg-primary font-semibold text-white disabled:opacity-60`}
          >
            {busy ? "Deleting..." : "Yes, delete"}
          </button>
        </div>
      </form>

      {error && (
        <p role="alert" className="mt-2 rounded-card bg-primary/10 p-3 text-sm font-medium text-primary-dark">
          {error}
        </p>
      )}
    </div>
  );
}
