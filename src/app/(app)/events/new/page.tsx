import { notFound } from "next/navigation";
import { can } from "@/lib/permissions";
import EventForm from "../EventForm";

export default async function NewEvent() {
  if (!(await can("events.manage"))) notFound();
  return (
    <>
      <h1 className="mb-4 text-[28px] font-bold leading-tight">Create event</h1>
      <div className="rounded-sheet bg-surface p-5 shadow-card">
        <EventForm />
      </div>
      <p className="mt-3 text-sm text-muted">You can add photos after the event is created.</p>
    </>
  );
}
