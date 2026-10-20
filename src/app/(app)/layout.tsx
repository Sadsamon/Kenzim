import { redirect } from "next/navigation";
import { getMe } from "@/lib/me";
import TopBar from "@/components/nav/TopBar";
import BottomTabs from "@/components/nav/BottomTabs";

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

  return (
    <div className="min-h-screen">
      <TopBar name={me.fullName} />
      <main className="mx-auto max-w-md px-4 pb-28 pt-4">{children}</main>
      <BottomTabs />
    </div>
  );
}
