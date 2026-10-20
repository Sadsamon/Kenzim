"use client";
import { useFormState } from "react-dom";
import Link from "next/link";
import { signup, type FormState } from "../actions";
import Field from "@/components/ui/Field";
import SubmitButton from "@/components/ui/SubmitButton";

const initial: FormState = {};

export default function SignupForm() {
  const [state, action] = useFormState(signup, initial);

  if (state.message) {
    return (
      <div className="text-center">
        <p className="text-lg font-semibold">Almost there</p>
        <p className="mt-2 text-muted">{state.message}</p>
        <Link href="/login" className="mt-4 inline-block font-semibold text-primary">Back to log in</Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4" noValidate>
      <Field label="Full name" name="fullName" autoComplete="name" error={state.fieldErrors?.fullName} />
      <Field label="Email" name="email" type="email" inputMode="email" autoComplete="email" error={state.fieldErrors?.email} />
      <Field label="Password" name="password" type="password" autoComplete="new-password" hint="At least 8 characters." error={state.fieldErrors?.password} />
      {state.error && <p role="alert" className="rounded-card bg-primary/10 p-3 text-sm font-medium text-primary-dark">{state.error}</p>}
      <SubmitButton>Create account</SubmitButton>
      <p className="text-center text-muted">
        Already a member?{" "}
        <Link href="/login" className="font-semibold text-primary">Log in</Link>
      </p>
    </form>
  );
}
