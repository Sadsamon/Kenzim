import Link from "next/link";
import { notFound } from "next/navigation";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { fmtDate, publicUrl } from "@/lib/storage";
import Carousel from "@/components/Carousel";
import KindBadge from "@/components/ui/KindBadge";
import Paragraphs from "@/components/ui/Paragraphs";
import { deletePost } from "../actions";

export const dynamic = "force-dynamic";

export default async function PostPage({ params }: { params: { id: string } }) {
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound();
  const supabase = createClient();
  const { data: p } = await supabase
    .from("news_posts")
    .select("id,kind,title,body,image_paths,created_at")
    .eq("id", params.id)
    .maybeSingle();
  if (!p) notFound();
  const canDelete = await can("news.publish");
  const imgs = (p.image_paths ?? []).map((x: string) => publicUrl("news-images", x)).filter(Boolean) as string[];

  return (
    <>
      <Link href="/news" className="mb-3 inline-block font-semibold text-primary">&lsaquo; Back to news</Link>
      <article className="overflow-hidden rounded-sheet bg-surface shadow-card">
        {imgs.length > 0 && (
          <Carousel aspect="aspect-[4/3]">
            {imgs.map((u) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={u} src={u} alt="" />
            ))}
          </Carousel>
        )}
        <div className="p-5">
          <KindBadge kind={p.kind} />
          <h1 className="mt-3 text-[26px] font-bold leading-tight">{p.title}</h1>
          <p className="mb-4 mt-1 text-sm text-muted">{fmtDate(p.created_at)}</p>
          <Paragraphs text={p.body} />
        </div>
      </article>
      {canDelete && (
        <form action={deletePost} className="mt-5">
          <input type="hidden" name="id" value={p.id} />
          <button className="h-[52px] w-full rounded-[14px] border border-primary font-semibold text-primary">Delete this post</button>
        </form>
      )}
    </>
  );
}
