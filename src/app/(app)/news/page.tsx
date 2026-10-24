import Link from "next/link";
import { getMe } from "@/lib/me";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { excerpt, fmtDate, publicUrl } from "@/lib/storage";
import Carousel from "@/components/Carousel";
import KindBadge from "@/components/ui/KindBadge";
import EmptyState from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const me = await getMe();
  const supabase = createClient();
  const [{ data: letters }, { data: posts }, canPost] = await Promise.all([
    supabase.from("chair_letters").select("id,title,body,author_name,published_at").order("published_at", { ascending: false }).limit(1),
    supabase
      .from("news_posts")
      .select("id,kind,title,body,image_paths,pinned,created_at")
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(30),
    can("news.publish"),
  ]);
  const letter = letters?.[0];
  const first = me?.fullName.split(" ")[0] ?? "friend";
  const highlights = (posts ?? []).filter((p) => p.image_paths?.length).slice(0, 5);

  return (
    <>
      <section className="overflow-hidden rounded-sheet bg-gradient-to-br from-primary to-primary-dark p-5 text-white shadow-card">
        <p className="text-sm font-semibold opacity-90">Karibu, {first}</p>
        <h1 className="mt-1 text-[28px] font-bold leading-tight">Kenyans together in Zimbabwe</h1>
        <div className="mt-3 flex gap-1.5" aria-hidden="true">
          <span className="h-1.5 w-10 rounded-full bg-ink" />
          <span className="h-1.5 w-10 rounded-full bg-accent" />
          <span className="h-1.5 w-10 rounded-full bg-success" />
        </div>
      </section>

      {highlights.length > 0 && (
        <Carousel aspect="aspect-[16/10]" className="mt-4 overflow-hidden rounded-sheet shadow-card">
          {highlights.map((p) => (
            <Link key={p.id} href={`/news/${p.id}`} className="relative block h-full w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={publicUrl("news-images", p.image_paths[0]) ?? ""} alt="" />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-4 pb-9 text-lg font-bold leading-snug text-white">
                {p.title}
              </span>
            </Link>
          ))}
        </Carousel>
      )}

      {letter && (
        <Link href={`/about/letters/${letter.id}`} className="mt-4 block rounded-sheet bg-surface p-5 shadow-card">
          <p className="text-sm font-semibold text-primary">Letter from the Chairperson</p>
          <h2 className="mt-1 text-lg font-bold leading-snug">{letter.title}</h2>
          <p className="mt-1 text-muted">{excerpt(letter.body, 130)}</p>
          <p className="mt-2 text-sm font-semibold text-primary">Read the letter</p>
        </Link>
      )}

      <Link href="/about" className="mt-3 flex items-center justify-between rounded-card bg-surface p-4 font-semibold shadow-card">
        About Kenzim: our story, mission and goals
        <span aria-hidden="true" className="text-primary">&rsaquo;</span>
      </Link>

      <div className="mb-3 mt-6 flex items-center justify-between">
        <h2 className="text-[22px] font-bold">Latest news</h2>
        {canPost && (
          <Link href="/news/new" className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white">
            Write a post
          </Link>
        )}
      </div>

      {!posts || posts.length === 0 ? (
        <EmptyState title="No news yet" body="Announcements, embassy updates and community news will appear here." />
      ) : (
        <ul className="space-y-4">
          {posts.map((p) => {
            const imgs = (p.image_paths ?? []).map((x: string) => publicUrl("news-images", x)).filter(Boolean) as string[];
            return (
              <li key={p.id} className="overflow-hidden rounded-sheet bg-surface shadow-card">
                {imgs.length > 0 && (
                  <Carousel aspect="aspect-[16/10]">
                    {imgs.map((u) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={u} src={u} alt="" loading="lazy" />
                    ))}
                  </Carousel>
                )}
                <Link href={`/news/${p.id}`} className="block p-4">
                  <div className="flex items-center gap-2">
                    <KindBadge kind={p.kind} />
                    {p.pinned && <span className="text-sm font-semibold text-muted">Pinned</span>}
                  </div>
                  <h3 className="mt-2 text-lg font-bold leading-snug">{p.title}</h3>
                  <p className="mt-1 text-muted">{excerpt(p.body)}</p>
                  <p className="mt-2 text-sm text-muted">{fmtDate(p.created_at)}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
