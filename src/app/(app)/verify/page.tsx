import Link from "next/link";
import { redirect } from "next/navigation";
import { getMe } from "@/lib/me";
import { createClient } from "@/lib/supabase/server";
import IdentityForm from "./IdentityForm";

export const dynamic = "force-dynamic";

export default async function VerifyPage() {
  const me = await getMe();
  if (!me) redirect("/login");
  if (me.status === "verified") redirect("/profile");

  const supabase = createClient();
  const { data: last } = await supabase
    .from("identity_submissions")
    .select("status")
    .order("created_at", { ascending: false })
    .limit(1);
  const rejected = last?.[0]?.status === "rejected";

  return (
    <>
      <h1 className="mb-2 text-[28px] font-bold leading-tight">Verify your identity</h1>
      {me.status === "pending" ? (
        <section className="rounded-sheet bg-surface p-5 shadow-card">
          <h2 className="text-lg font-bold">In review</h2>
          <p className="mt-1 text-muted">An admin is checking your document. You will be notified once you are approved.</p>
          <Link href="/verify/details" className="mt-4 inline-block font-semibold text-primary">Complete your other details</Link>
        </section>
      ) : (
        <>
          <p className="mb-4 text-muted">
            Kenzim admins check every document by hand. Your photo and number are stored securely, and the photo is
            deleted as soon as the review is done.
          </p>
          {rejected && (
            <p className="mb-4 rounded-card bg-primary/10 p-3 text-sm font-medium text-primary-dark">
              Your last submission could not be approved. Please check the photo and number, then try again.
            </p>
          )}
          <div className="rounded-sheet bg-surface p-5 shadow-card">
            <IdentityForm />
          </div>
        </>
      )}
    </>
  );
}
