import Link from "next/link";
import { Bell } from "lucide-react";

export default function TopBar({ name, unread = 0 }: { name: string; unread?: number }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png" alt="" width={32} height={32} className="rounded-lg" />
          <span className="text-lg font-bold text-primary">Kenzim</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/notifications"
            aria-label={unread ? `Notifications, ${unread} new` : "Notifications"}
            className="relative flex h-11 w-11 items-center justify-center rounded-full text-ink"
          >
            <Bell size={24} aria-hidden="true" />
            {unread > 0 && (
              <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>
          <Link
            href="/profile"
            aria-label="Your profile and settings"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-bold text-white"
          >
            {initials || "K"}
          </Link>
        </div>
      </div>
    </header>
  );
}
