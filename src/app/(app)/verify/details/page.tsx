import Link from "next/link";
import { redirect } from "next/navigation";
import { getMe } from "@/lib/me";
import { createClient } from "@/lib/supabase/server";
import { removeFamily } from "../actions";
import { ContactForm, EmergencyForm, EmploymentForm, FamilyForm } from "./Forms";

export const dynamic = "force-dynamic";

export default async function DetailsPage() {
  const me = await getMe();
  if (!me) redirect("/login");
  const supabase = createClient();

  const [{ data: emp }, { data: contacts }, { data: family }, { data: prof }] = await Promise.all([
    supabase.from("employment").select("occupation,employer,work_city,work_phone").eq("user_id", me.id).maybeSingle(),
    supabase.from("emergency_contacts").select("kind,full_name,relationship,phone,address").eq("user_id", me.id),
    supabase.from("family_members").select("id,full_name,relationship").eq("user_id", me.id).order("full_name"),
    supabase.from("profiles").select("phone,city_zw").eq("id", me.id).single(),
  ]);
  const kenya = contacts?.find((c) => c.kind === "kenya_contact");
  const zim = contacts?.find((c) => c.kind === "zimbabwe_next_of_kin");

  return (
    <>
      <h1 className="mb-1 text-[28px] font-bold leading-tight">Your details</h1>
      <p className="mb-4 text-muted">
        Only you and authorised Kenzim officials can see these. You can finish them any time.
      </p>
      {me.status === "new" && (
        <Link href="/verify" className="mb-4 block rounded-card bg-accent p-3 font-semibold">
          When you are done here, go back to request verification.
        </Link>
      )}

      <section className="mb-5 rounded-sheet bg-surface p-5 shadow-card">
        <h2 className="mb-3 text-lg font-bold">Contact details</h2>
        <ContactForm phone={prof?.phone} city={prof?.city_zw} />
      </section>

      <section className="mb-5 rounded-sheet bg-surface p-5 shadow-card">
        <h2 className="mb-3 text-lg font-bold">Employment</h2>
        <EmploymentForm initial={emp} />
      </section>

      <section className="mb-5 rounded-sheet bg-surface p-5 shadow-card">
        <h2 className="mb-3 text-lg font-bold">Emergency contacts</h2>
        <EmergencyForm kenya={kenya} zim={zim} />
      </section>

      <section className="mb-5 rounded-sheet bg-surface p-5 shadow-card">
        <h2 className="mb-3 text-lg font-bold">Family</h2>
        {family && family.length > 0 && (
          <ul className="mb-4 divide-y divide-line">
            {family.map((f) => (
              <li key={f.id} className="flex items-center justify-between py-2">
                <span>{f.full_name} <span className="text-muted">({f.relationship})</span></span>
                <form action={removeFamily}>
                  <input type="hidden" name="id" value={f.id} />
                  <button className="h-11 px-3 font-semibold text-primary">Remove</button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <FamilyForm />
      </section>
    </>
  );
}
