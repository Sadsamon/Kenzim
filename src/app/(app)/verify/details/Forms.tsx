"use client";
import { useFormState } from "react-dom";
import Field from "@/components/ui/Field";
import SubmitButton from "@/components/ui/SubmitButton";
import { addFamily, saveEmergency, saveEmployment, type FormState } from "../actions";

const init: FormState = {};

function Status({ state }: { state: FormState }) {
  if (state.error) return <p role="alert" className="rounded-card bg-primary/10 p-3 text-sm font-medium text-primary-dark">{state.error}</p>;
  if (state.saved) return <p role="status" className="rounded-card bg-success/10 p-3 text-sm font-medium text-success">Saved.</p>;
  return null;
}

export type Employment = { occupation?: string; employer?: string; work_city?: string; work_phone?: string } | null;
export type Contact = { full_name?: string; relationship?: string; phone?: string; address?: string } | undefined;

export function EmploymentForm({ initial }: { initial: Employment }) {
  const [state, action] = useFormState(saveEmployment, init);
  return (
    <form action={action} className="space-y-4" noValidate>
      <Field label="Current occupation" name="occupation" defaultValue={initial?.occupation} error={state.fieldErrors?.occupation} />
      <Field label="Employer (optional)" name="employer" defaultValue={initial?.employer} error={state.fieldErrors?.employer} />
      <Field label="Workplace city (optional)" name="workCity" defaultValue={initial?.work_city} error={state.fieldErrors?.workCity} />
      <Field label="Work phone (optional)" name="workPhone" defaultValue={initial?.work_phone} type="tel" inputMode="tel" error={state.fieldErrors?.workPhone} />
      <Status state={state} />
      <SubmitButton>Save employment</SubmitButton>
      {initial && <p className="text-sm text-muted">Saved before: {initial.occupation}{initial.employer ? ` at ${initial.employer}` : ""}. Saving again replaces it.</p>}
    </form>
  );
}

export function EmergencyForm({ kenya, zim }: { kenya: Contact; zim: Contact }) {
  const [state, action] = useFormState(saveEmergency, init);
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      <h3 className="font-bold">Emergency contact in Kenya</h3>
      <Field label="Full name" name="kenya_fullName" defaultValue={kenya?.full_name} error={fe["kenya.fullName"]} />
      <Field label="Relationship" name="kenya_relationship" defaultValue={kenya?.relationship} error={fe["kenya.relationship"]} />
      <Field label="Phone" name="kenya_phone" defaultValue={kenya?.phone} type="tel" inputMode="tel" error={fe["kenya.phone"]} />
      <Field label="Contact address in Kenya (optional)" name="kenya_address" defaultValue={kenya?.address} error={fe["kenya.address"]} />
      <h3 className="pt-2 font-bold">Next of kin in Zimbabwe</h3>
      <Field label="Full name" name="zim_fullName" defaultValue={zim?.full_name} error={fe["zim.fullName"]} />
      <Field label="Relationship" name="zim_relationship" defaultValue={zim?.relationship} error={fe["zim.relationship"]} />
      <Field label="Phone" name="zim_phone" defaultValue={zim?.phone} type="tel" inputMode="tel" error={fe["zim.phone"]} />
      <Field label="Address (optional)" name="zim_address" defaultValue={zim?.address} error={fe["zim.address"]} />
      <Status state={state} />
      <SubmitButton>Save emergency contacts</SubmitButton>
      {(kenya || zim) && <p className="text-sm text-muted">Contacts are already saved. Saving again replaces them.</p>}
    </form>
  );
}

export function FamilyForm() {
  const [state, action] = useFormState(addFamily, init);
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      <Field label="Full name" name="fullName" error={fe.fullName} />
      <Field label="Relationship (e.g. spouse, child)" name="relationship" error={fe.relationship} />
      <div>
        <label htmlFor="birthDate" className="mb-1 block text-[15px] font-semibold">Date of birth (optional)</label>
        <input id="birthDate" name="birthDate" type="date" className="h-[52px] w-full rounded-[14px] border border-line bg-surface px-4 text-base" />
        {fe.birthDate && <p className="mt-1 text-sm font-medium text-primary">{fe.birthDate}</p>}
      </div>
      <div>
        <label htmlFor="anniversaryDate" className="mb-1 block text-[15px] font-semibold">Anniversary (optional)</label>
        <input id="anniversaryDate" name="anniversaryDate" type="date" className="h-[52px] w-full rounded-[14px] border border-line bg-surface px-4 text-base" />
      </div>
      <label className="flex items-start gap-3 text-base">
        <input type="checkbox" name="birthdayOptIn" className="mt-1 h-5 w-5" />
        <span>Share this birthday with the community (first name, day and month only)</span>
      </label>
      <Status state={state} />
      <SubmitButton>Add family member</SubmitButton>
    </form>
  );
}
