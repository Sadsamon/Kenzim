import EmptyState from "@/components/ui/EmptyState";

export default function Page() {
  return (
    <>
      <h1 className="mb-4 text-[28px] font-bold leading-tight">News Feed</h1>
      <EmptyState title="No news yet" body="Announcements, embassy updates and community news will appear here." />
    </>
  );
}
