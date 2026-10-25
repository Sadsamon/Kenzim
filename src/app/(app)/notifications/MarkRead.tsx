"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Marks everything as read a moment after the list is shown, so the bell badge clears.
export default function MarkRead({ unread }: { unread: number }) {
  const router = useRouter();
  useEffect(() => {
    if (!unread) return;
    const t = setTimeout(async () => {
      await fetch("/api/notifications/read", { method: "POST" }).catch(() => {});
      router.refresh();
    }, 1500);
    return () => clearTimeout(t);
  }, [unread, router]);
  return null;
}
