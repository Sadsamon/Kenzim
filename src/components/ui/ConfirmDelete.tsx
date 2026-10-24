"use client";
import { useState } from "react";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  id: string;
  label: string;
  compact?: boolean;
};

// Two-step delete: first tap asks, second tap confirms. Prevents accidental deletes on a phone.
export default function ConfirmDelete({ action, id, label, compact = false }: Props) {
  const [asking, setAsking] = useState(false);

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
    <form action={action} className={compact ? "flex items-center gap-2 px-4 pb-3" : "grid grid-cols-2 gap-3"}>
      <input type="hidden" name="id" value={id} />
      <button
        type="button"
        onClick={() => setAsking(false)}
        className={compact ? "h-11 flex-1 rounded-[12px] border border-line text-sm font-semibold" : "h-[52px] rounded-[14px] border border-line font-semibold"}
      >
        Keep it
      </button>
      <button
        className={compact ? "h-11 flex-1 rounded-[12px] bg-primary text-sm font-semibold text-white" : "h-[52px] rounded-[14px] bg-primary font-semibold text-white"}
      >
        Yes, delete
      </button>
    </form>
  );
}
