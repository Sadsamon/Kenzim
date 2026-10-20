"use client";
import { useFormState } from "react-dom";
import Link from "next/link";
import { login, type FormState } from "../actions";
import Field from "@/components/ui/Field";
import SubmitButton from "@/components/ui/SubmitButton";

const initial: FormState = {};

export default function LoginForm() {
  const [state, action] = useFormState(login, initial);
  return (
    <form action={action} className="space-y-4" noValidate>
      <Field label="Email" name="email" type="email" inputMode="email" autoComplete="email" error={state.fieldErrors?.email} />
      <Field label="Password" name="password" type="password" autoComplete="current-password" error={state.fieldErrors?.password} />
      {state.error && <p role="alert" className="rounded-card bg-primary/10 p-3 text-sm font-medium text-primary-dark">{state.error}</p>}
      <SubmitButton>Log in</SubmitButton>
      <p className="text-center text-muted">
        New to Kenzim?{" "}
        <Link href="/signup" className="font-semibold text-primary">Create an account</Link>
      </p>
    </form>
  );
}
