import { redirect } from "next/navigation";
import { getMe } from "@/lib/me";
import TopBar from "@/components/nav/TopBar";
import BottomTabs from "@/components/nav/BottomTabs";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await getMe();
  if (!me) redirect("/login");
  return (
    <div className="min-h-screen">
      <TopBar name={me.fullName} />
      <main className="mx-auto max-w-md px-4 pb-28 pt-4">{children}</main>
      <BottomTabs />
    </div>
  );
}
