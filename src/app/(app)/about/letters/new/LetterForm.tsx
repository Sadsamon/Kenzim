"use client";
import { useFormState } from "react-dom";
import SubmitButton from "@/components/ui/SubmitButton";
import Field from "@/components/ui/Field";
import { saveLetter, type FormState } from "../../actions";

const init: FormState = {};

export default function LetterForm() {
  const [state, action] = useFormState(saveLetter, init);
  return (
    <form action={action} className="space-y-4">
      <Field label="Title" name="title" />
      <Field label="Signed by" name="authorName" defaultValue="The Chairperson" />
      <div>
        <label htmlFor="body" className="mb-1 block text-[15px] font-semibold">Letter</label>
        <textarea
          id="body"
          name="body"
          rows={12}
          className="w-full rounded-[14px] border border-line bg-surface px-4 py-3 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <p className="mt-1 text-sm text-muted">Leave a blank line between paragraphs. The newest letter shows on the News page.</p>
      </div>
      {state.error && <p role="alert" className="rounded-card bg-primary/10 p-3 text-sm font-medium text-primary-dark">{state.error}</p>}
      <SubmitButton>Publish letter</SubmitButton>
    </form>
  );
}
