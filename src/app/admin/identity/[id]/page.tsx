import { notFound, redirect } from "next/navigation";
import { can } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { decrypt } from "@/lib/crypto";
import { review } from "./actions";

export const dynamic = "force-dynamic";

export default async function ReviewPage({ params }: { params: { id: string } }) {
  if (!(await can("identity.review"))) notFound();
  const canDownload = await can("identity.download");
  const admin = createAdminClient();

  const { data: sub } = await admin
    .from("identity_submissions")
    .select("id,user_id,doc_type,id_number_enc,photo_path,status")
    .eq("id", params.id)
    .single();
  if (!sub) notFound();
  if (sub.status !== "submitted") redirect("/admin/identity");

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name,phone,city_zw")
    .eq("id", sub.user_id)
    .single();

  let number = "(unreadable)";
  try {
    if (sub.id_number_enc) number = decrypt(sub.id_number_enc);
  } catch {
    /* key changed or data damaged: leave as unreadable */
  }
  const signed = sub.photo_path
    ? await admin.storage.from("id-documents").createSignedUrl(sub.photo_path, 60)
    : null;

  return (
    <>
      <h1 className="mb-1 text-[28px] font-bold leading-tight">{profile?.full_name ?? "Member"}</h1>
      <p className="mb-4 text-muted">{profile?.city_zw ?? "City not given"} · {profile?.phone ?? "No phone"}</p>

      <section className="rounded-sheet bg-surface p-5 shadow-card">
        <p className="text-sm text-muted">{sub.doc_type === "passport" ? "Passport" : "Kenyan ID"} number</p>
        <p className="text-xl font-bold tracking-wide">{number}</p>
        {signed?.data?.signedUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={signed.data.signedUrl} alt="Submitted document" className="mt-4 w-full rounded-card border border-line" />
        ) : (
          <p className="mt-4 text-primary">The photo could not be loaded.</p>
        )}
        <p className="mt-3 text-sm text-muted">
          Approving or rejecting permanently deletes this photo and the stored number.
        </p>
        {canDownload && (
          <a href={`/api/admin/identity/${sub.id}/download`} className="mt-3 inline-block font-semibold text-primary">
            Download a copy first (logged)
          </a>
        )}
      </section>

      <form action={review} className="mt-5 grid grid-cols-2 gap-3">
        <input type="hidden" name="id" value={sub.id} />
        <button name="decision" value="reject" className="h-[52px] rounded-[14px] border border-primary font-semibold text-primary">
          Reject
        </button>
        <button name="decision" value="approve" className="h-[52px] rounded-[14px] bg-success font-semibold text-white">
          Approve
        </button>
      </form>
    </>
  );
}
