import { redirect } from "next/navigation";
import { getMe } from "@/lib/me";
import { createClient } from "@/lib/supabase/server";
import { excerpt, publicUrl } from "@/lib/storage";
import TopBar from "@/components/nav/TopBar";
import BottomTabs from "@/components/nav/BottomTabs";
import PopupHost, { type PopupPost } from "@/components/PopupHost";

async function nextPopup(userId: string): Promise<PopupPost | null> {
  const supabase = createClient();
  const { data: posts } = await supabase
    .from("news_posts")
    .select("id,title,body,image_path")
    .gt("popup_until", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(5);
  if (!posts?.length) return null;
  const { data: seen } = await supabase
    .from("popup_dismissals")
    .select("post_id")
    .eq("user_id", userId)
    .in("post_id", posts.map((p) => p.id));
  const done = new Set((seen ?? []).map((s) => s.post_id));
  const p = posts.find((x) => !done.has(x.id));
  return p
    ? { id: p.id, title: p.title, excerpt: excerpt(p.body, 160), imageUrl: publicUrl("news-images", p.image_path) }
    : null;
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await getMe();
  if (!me) redirect("/login");

  if (me.status === "suspended") {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-[22px] font-bold">Account on hold</h1>
        <p className="mt-2 text-muted">Please contact a Kenzim admin about your account.</p>
      </main>
    );
  }

  const popup = await nextPopup(me.id);

  return (
    <div className="min-h-screen">
      <TopBar name={me.fullName} />
      <main className="mx-auto max-w-md px-4 pb-28 pt-4">{children}</main>
      <BottomTabs />
      <PopupHost post={popup} />
    </div>
  );
}
