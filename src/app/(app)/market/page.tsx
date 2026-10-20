import { getMe } from "@/lib/me";
import EmptyState from "@/components/ui/EmptyState";
import VerifyGate from "@/components/ui/VerifyGate";

export default async function Page() {
  const me = await getMe();
  return (
    <>
      <h1 className="mb-4 text-[28px] font-bold leading-tight">Marketplace</h1>
      {me && me.status !== "verified" ? (
        <VerifyGate me={me} feature="marketplace" />
      ) : (
        <EmptyState title="Coming soon" body="This section is being built." />
      )}
    </>
  );
}
