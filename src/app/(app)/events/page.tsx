import EmptyState from "@/components/ui/EmptyState";

export default function Page() {
  return (
    <>
      <h1 className="mb-4 text-[28px] font-bold leading-tight">Events</h1>
      <EmptyState title="No events yet" body="Upcoming gatherings and embassy days will appear here." />
    </>
  );
}
