import Link from "next/link";
import { redirect } from "next/navigation";
import { getMe } from "@/lib/me";
import { createClient } from "@/lib/supabase/server";
import RequestForm from "./RequestForm";

export const dynamic = "force-dynamic";

function Row({ done, label }: { done: boolean; label: string }) {
  return (
    <li className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${done ? "bg-success text-white" : "border border-line text-muted"}`}
      >
        {done ? "\u2713" : ""}
      </span>
      <span className={done ? "text-muted" : "font-semibold"}>{label}</span>
    </li>
  );
}

export default async function VerifyPage() {
  const me = await getMe();
  if (!me) redirect("/login");
  if (me.status === "verified") redirect("/profile");

  const supabase = createClient();
  const [{ data: prof }, { data: emp }, { data: ec }] = await Promise.all([
    supabase.from("profiles").select("phone,city_zw").eq("id", me.id).single(),
    supabase.from("employment").select("occupation").eq("user_id", me.id).maybeSingle(),
    supabase.from("emergency_contacts").select("kind").eq("user_id", me.id),
  ]);
  const contactDone = !!(prof?.phone && prof?.city_zw);
  const workDone = !!emp?.occupation;
  const emergencyDone = (ec?.length ?? 0) >= 2;

  return (
    <>
      <h1 className="mb-2 text-[28px] font-bold leading-tight">Become a verified member</h1>

      {me.status === "pending" ? (
        <section className="rounded-sheet bg-surface p-5 shadow-card">
          <h2 className="text-lg font-bold">Request received</h2>
          <p className="mt-1 text-muted">
            A Kenzim admin will confirm your membership and may contact you to check your identity directly. You will
            see the change on your profile once you are approved.
          </p>
          <Link href="/verify/details" className="mt-4 inline-block font-semibold text-primary">Update your details</Link>
        </section>
      ) : (
        <>
          <p className="mb-4 text-muted">
            Tell us a little about you. Kenzim admins confirm every member personally, so we do not collect ID
            numbers or document photos in the app.
          </p>
          <section className="rounded-sheet bg-surface p-5 shadow-card">
            <ul className="space-y-4">
              <Row done={contactDone} label="Contact details" />
              <Row done={workDone} label="Employment" />
              <Row done={emergencyDone} label="Emergency contacts (Kenya and Zimbabwe)" />
            </ul>
            <Link href="/verify/details" className="mt-5 flex h-[52px] items-center justify-center rounded-[14px] border border-primary font-semibold text-primary">
              {contactDone && workDone && emergencyDone ? "Review my details" : "Add my details"}
            </Link>
            <RequestForm />
          </section>
        </>
      )}
    </>
  );
}
