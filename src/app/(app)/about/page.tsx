import Link from "next/link";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { fmtDate } from "@/lib/storage";
import Paragraphs from "@/components/ui/Paragraphs";

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const supabase = createClient();
  const [{ data: about }, { data: letters }, canEdit] = await Promise.all([
    supabase.from("about_page").select("history,mission,goals").eq("id", 1).maybeSingle(),
    supabase.from("chair_letters").select("id,title,author_name,published_at").order("published_at", { ascending: false }).limit(20),
    can("about.manage"),
  ]);

  const sections = [
    { title: "Our story", text: about?.history },
    { title: "Our mission", text: about?.mission },
    { title: "Our goals", text: about?.goals },
  ];

  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192.png" alt="" width={48} height={48} className="rounded-card" />
        <h1 className="text-[28px] font-bold leading-tight">About Kenzim</h1>
      </div>

      {sections.map((s) => (
        <section key={s.title} className="mb-4 rounded-sheet bg-surface p-5 shadow-card">
          <h2 className="mb-3 text-xl font-bold text-primary">{s.title}</h2>
          {s.text ? <Paragraphs text={s.text} /> : <p className="text-muted">To be added.</p>}
        </section>
      ))}

      <section className="mb-4 rounded-sheet bg-surface p-5 shadow-card">
        <h2 className="mb-3 text-xl font-bold text-primary">Letters from the Chairperson</h2>
        {letters && letters.length > 0 ? (
          <ul className="divide-y divide-line">
            {letters.map((l) => (
              <li key={l.id}>
                <Link href={`/about/letters/${l.id}`} className="block py-3">
                  <p className="font-semibold">{l.title}</p>
                  <p className="text-sm text-muted">{l.author_name} · {fmtDate(l.published_at)}</p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">No letters yet.</p>
        )}
      </section>

      {canEdit && (
        <div className="grid gap-3">
          <Link href="/about/edit" className="flex h-[52px] items-center justify-center rounded-[14px] bg-ink font-semibold text-white">
            Edit About page
          </Link>
          <Link href="/about/letters/new" className="flex h-[52px] items-center justify-center rounded-[14px] bg-primary font-semibold text-white">
            Publish a new letter
          </Link>
        </div>
      )}
    </>
  );
}
