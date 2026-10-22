import { notFound } from "next/navigation";
import { can } from "@/lib/permissions";
import LetterForm from "./LetterForm";

export default async function NewLetter() {
  if (!(await can("about.manage"))) notFound();
  return (
    <>
      <h1 className="mb-4 text-[28px] font-bold leading-tight">New letter</h1>
      <div className="rounded-sheet bg-surface p-5 shadow-card">
        <LetterForm />
      </div>
    </>
  );
}
