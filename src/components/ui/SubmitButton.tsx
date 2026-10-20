"use client";
import { useFormStatus } from "react-dom";

export default function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-[52px] w-full rounded-[14px] bg-primary font-semibold text-white transition active:scale-[0.98] active:bg-primary-dark disabled:opacity-60"
    >
      {pending ? "Please wait..." : children}
    </button>
  );
}
