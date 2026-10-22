import { notFound } from "next/navigation";
import { can } from "@/lib/permissions";
import NewPostForm from "./NewPostForm";

export default async function NewPostPage() {
  if (!(await can("news.publish"))) notFound();
  return (
    <>
      <h1 className="mb-4 text-[28px] font-bold leading-tight">Write a post</h1>
      <div className="rounded-sheet bg-surface p-5 shadow-card">
        <NewPostForm />
      </div>
    </>
  );
}
