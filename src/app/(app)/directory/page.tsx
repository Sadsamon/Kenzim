import Link from "next/link";
import { getMe } from "@/lib/me";
import { createAdminClient } from "@/lib/supabase/admin";
import EmptyState from "@/components/ui/EmptyState";
import VerifyGate from "@/components/ui/VerifyGate";

export const dynamic = "force-dynamic";

type SP = { q?: string; city?: string; i?: string; t?: string };

export default async function DirectoryPage({ searchParams }: { searchParams: SP }) {
  const me = await getMe();
  if (me && me.status !== "verified") {
    return (
      <>
        <h1 className="mb-4 text-[28px] font-bold leading-tight">Directory</h1>
        <VerifyGate me={me} feature="member directory" />
      </>
    );
  }

  // Verified members only. Reads use the server key, but only whitelisted fields are ever sent to the page.
  const admin = createAdminClient();
  const { data: profiles } = await admin
    .from("profiles")
    .select("id,full_name,city_zw,phone,contact_visible,is_senior_member")
    .eq("status", "verified")
    .eq("directory_visible", true)
    .order("full_name")
    .limit(400);
  const ids = (profiles ?? []).map((p) => p.id);

  const [{ data: emp }, { data: mi }, { data: interests }] = await Promise.all([
    ids.length ? admin.from("employment").select("user_id,occupation,employer").in("user_id", ids) : Promise.resolve({ data: [] as any[] }),
    ids.length ? admin.from("member_interests").select("user_id,interest_id").in("user_id", ids) : Promise.resolve({ data: [] as any[] }),
    admin.from("interests").select("id,name").order("name"),
  ]);
  const job = new Map((emp ?? []).map((e: any) => [e.user_id, e]));
  const iname = new Map((interests ?? []).map((i: any) => [i.id, i.name as string]));
  const mine = new Map<string, number[]>();
  (mi ?? []).forEach((r: any) => mine.set(r.user_id, [...(mine.get(r.user_id) ?? []), r.interest_id]));

  const q = (searchParams.q ?? "").trim().toLowerCase();
  const city = searchParams.city ?? "";
  const interest = Number(searchParams.i) || 0;
  const trusted = searchParams.t === "1";
  const cities = Array.from(new Set((profiles ?? []).map((p) => p.city_zw).filter(Boolean) as string[])).sort();

  const rows = (profiles ?? []).filter((p) => {
    const e: any = job.get(p.id);
    if (q && ![p.full_name, e?.occupation, e?.employer].some((x) => x?.toLowerCase().includes(q))) return false;
    if (city && p.city_zw !== city) return false;
    if (interest && !(mine.get(p.id) ?? []).includes(interest)) return false;
    if (trusted && !p.is_senior_member) return false;
    return true;
  });

  const input = "h-[52px] w-full rounded-[14px] border border-line bg-surface px-4 text-base outline-none focus:border-primary";

  return (
    <>
      <h1 className="mb-4 text-[28px] font-bold leading-tight">Directory</h1>

      <form className="mb-4 space-y-3 rounded-sheet bg-surface p-4 shadow-card">
        <input name="q" defaultValue={searchParams.q ?? ""} placeholder="Search by name or profession" className={input} aria-label="Search" />
        <div className="grid grid-cols-2 gap-3">
          <select name="city" defaultValue={city} className={input} aria-label="City">
            <option value="">All cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select name="i" defaultValue={interest || ""} className={input} aria-label="Interest">
            <option value="">All interests</option>
            {(interests ?? []).map((i: any) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-3 text-base">
          <input type="checkbox" name="t" value="1" defaultChecked={trusted} className="h-5 w-5" /> Trusted members only
        </label>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/directory" className="flex h-[52px] items-center justify-center rounded-[14px] border border-line font-semibold">Clear</Link>
          <button className="h-[52px] rounded-[14px] bg-primary font-semibold text-white">Search</button>
        </div>
      </form>

      <p className="mb-3 text-sm text-muted">{rows.length} member{rows.length === 1 ? "" : "s"}</p>

      {rows.length === 0 ? (
        <EmptyState title="No members found" body="Try a different search or clear the filters." />
      ) : (
        <ul className="space-y-3">
          {rows.map((p) => {
            const e: any = job.get(p.id);
            const tags = (mine.get(p.id) ?? []).map((id) => iname.get(id)).filter(Boolean).slice(0, 3) as string[];
            const phone = p.contact_visible ? p.phone : null;
            const wa = phone ? phone.replace(/[^0-9]/g, "") : "";
            return (
              <li key={p.id} className="rounded-sheet bg-surface p-4 shadow-card">
                <div className="flex items-start gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-white" aria-hidden="true">
                    {p.full_name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-lg font-bold leading-snug">
                      {p.full_name}
                      {p.is_senior_member && <span className="rounded-full bg-accent px-2.5 py-0.5 text-[13px] font-semibold text-ink">Trusted</span>}
                    </p>
                    <p className="text-muted">{[e?.occupation, p.city_zw].filter(Boolean).join(" · ") || "Kenzim member"}</p>
                    {e?.employer && <p className="text-sm text-muted">{e.employer}</p>}
                  </div>
                </div>
                {tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {tags.map((t) => (
                      <span key={t} className="rounded-full border border-line px-3 py-1 text-sm">{t}</span>
                    ))}
                  </div>
                )}
                {phone && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <a href={`tel:${phone}`} className="flex h-11 items-center justify-center rounded-[12px] border border-line font-semibold">Call</a>
                    <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="flex h-11 items-center justify-center rounded-[12px] bg-success font-semibold text-white">WhatsApp</a>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
