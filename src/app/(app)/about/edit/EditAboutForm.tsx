"use client";
import { useFormState } from "react-dom";
import SubmitButton from "@/components/ui/SubmitButton";
import { saveAbout, type FormState } from "../actions";

const box = "w-full rounded-[14px] border border-line bg-surface px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const init: FormState = {};

export default function EditAboutForm({ initial }: { initial: { history: string; mission: string; goals: string } }) {
  const [state, action] = useFormState(saveAbout, init);
  return (
    <form action={action} className="space-y-4">
      {(["history", "mission", "goals"] as const).map((k) => (
        <div key={k}>
          <label htmlFor={k} className="mb-1 block text-[15px] font-semibold capitalize">
            {k === "history" ? "Our story" : k === "mission" ? "Our mission" : "Our goals"}
          </label>
          <textarea id={k} name={k} rows={k === "mission" ? 4 : 8} defaultValue={initial[k]} className={box} />
        </div>
      ))}
      <p className="text-sm text-muted">Leave a blank line between paragraphs.</p>
      {state.error && <p role="alert" className="rounded-card bg-primary/10 p-3 text-sm font-medium text-primary-dark">{state.error}</p>}
      <SubmitButton>Save</SubmitButton>
    </form>
  );
}
