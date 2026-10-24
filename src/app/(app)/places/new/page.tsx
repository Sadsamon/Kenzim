import { notFound } from "next/navigation";
import { can } from "@/lib/permissions";
import PlaceForm from "../PlaceForm";

export default async function NewPlace() {
  if (!(await can("places.manage"))) notFound();
  return (
    <>
      <h1 className="mb-4 text-[28px] font-bold leading-tight">Add a place</h1>
      <div className="rounded-sheet bg-surface p-5 shadow-card">
        <PlaceForm />
      </div>
      <p className="mt-3 text-sm text-muted">You can add photos after the place is saved.</p>
    </>
  );
}
