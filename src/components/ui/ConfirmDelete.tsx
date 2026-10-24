"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ActionProps = {
  action: (formData: FormData) => Promise<void> | void;
  id: string | number;
  label: string;
  compact?: boolean;
};

type EndpointProps = {
  endpoint: string;
  label: string;
  redirectTo?: string;
  compact?: boolean;
};

type Props = ActionProps | EndpointProps;

export default function ConfirmDelete(props: Props) {
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const isActionVersion = "action" in props;

  async function handleSubmit(formData: FormData) {
    setBusy(true);
    setError("");

    try {
      if (isActionVersion) {
        await props.action(formData);
        return;
      }

      const res = await fetch(props.endpoint, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Could not delete.");
      if (props.redirectTo) router.push(props.redirectTo);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete.");
    } finally {
      setBusy(false);
    }
  }

  const compact = props.compact ?? false;
  const pad = compact ? "px-4 pb-3" : "";
  const h = compact ? "h-11 text-sm rounded-[12px]" : "h-[52px] rounded-[14px]";
  const label = props.label;

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

  if (isActionVersion) {
    return (
      <div className={pad}>
        <form action={handleSubmit}>
          <input type="hidden" name="id" value={String(props.id)} />

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

  return (
    <div className={pad}>
      <div className="grid grid-cols-2 gap-3">
        <button type="button" disabled={busy} onClick={() => setAsking(false)} className={`${h} border border-line font-semibold`}>
          Keep it
        </button>
        <button type="button" disabled={busy} onClick={() => handleSubmit(new FormData())} className={`${h} bg-primary font-semibold text-white disabled:opacity-60`}>
          {busy ? "Deleting..." : "Yes, delete"}
        </button>
      </div>
      {error && <p role="alert" className="mt-2 rounded-card bg-primary/10 p-3 text-sm font-medium text-primary-dark">{error}</p>}
    </div>
  );
}
