import Link from "next/link";
import { notFound } from "next/navigation";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { fmtDate } from "@/lib/storage";
import Paragraphs from "@/components/ui/Paragraphs";
import { deleteLetter } from "../../actions";

export const dynamic = "force-dynamic";

export default async function LetterPage({ params }: { params: { id: string } }) {
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound();
  const supabase = createClient();
  const { data: l } = await supabase
    .from("chair_letters")
    .select("id,title,body,author_name,published_at")
    .eq("id", params.id)
    .maybeSingle();
  if (!l) notFound();
  const canDelete = await can("about.manage");

  return (
    <>
      <Link href="/about" className="mb-3 inline-block font-semibold text-primary">&lsaquo; About Kenzim</Link>
      <article className="rounded-sheet bg-surface p-5 shadow-card">
        <p className="text-sm font-semibold text-primary">Letter to the community</p>
        <h1 className="mt-1 text-[26px] font-bold leading-tight">{l.title}</h1>
        <p className="mb-4 mt-1 text-sm text-muted">{fmtDate(l.published_at)}</p>
        <Paragraphs text={l.body} />
        <p className="mt-6 font-semibold">{l.author_name}</p>
      </article>
      {canDelete && (
        <form action={deleteLetter} className="mt-5">
          <input type="hidden" name="id" value={l.id} />
          <button className="h-[52px] w-full rounded-[14px] border border-primary font-semibold text-primary">Delete this letter</button>
        </form>
      )}
    </>
  );
}
