"use client";
import { useFormState } from "react-dom";
import SubmitButton from "@/components/ui/SubmitButton";
import { requestVerification, type FormState } from "./actions";

const init: FormState = {};

export default function RequestForm() {
  const [state, action] = useFormState(requestVerification, init);
  return (
    <form action={action} className="mt-5 space-y-3">
      {state.error && <p role="alert" className="rounded-card bg-primary/10 p-3 text-sm font-medium text-primary-dark">{state.error}</p>}
      <SubmitButton>Request verification</SubmitButton>
    </form>
  );
}
