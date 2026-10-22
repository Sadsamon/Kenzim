"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { dismissPopup } from "@/app/(app)/news/actions";

export type PopupPost = { id: string; title: string; excerpt: string; imageUrl: string | null };

export default function PopupHost({ post }: { post: PopupPost | null }) {
  const [open, setOpen] = useState(!!post);
  const [, start] = useTransition();
  if (!post || !open) return null;

  function close() {
    setOpen(false);
    start(() => {
      void dismissPopup(post!.id);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-4 sm:items-center" role="dialog" aria-modal="true" aria-label="Announcement">
      <div className="w-full max-w-md overflow-hidden rounded-sheet bg-surface shadow-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {post.imageUrl && <img src={post.imageUrl} alt="" className="h-44 w-full object-cover" />}
        <div className="p-5">
          <p className="text-sm font-semibold text-primary">New from Kenzim</p>
          <h2 className="mt-1 text-[22px] font-bold leading-tight">{post.title}</h2>
          <p className="mt-2 text-muted">{post.excerpt}</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button onClick={close} className="h-[52px] rounded-[14px] border border-line font-semibold">Close</button>
            <Link href={`/news/${post.id}`} onClick={close} className="flex h-[52px] items-center justify-center rounded-[14px] bg-primary font-semibold text-white">
              Read more
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
