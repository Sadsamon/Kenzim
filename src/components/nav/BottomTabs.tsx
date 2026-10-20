"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Newspaper, ShoppingBag, Users } from "lucide-react";

const tabs = [
  { href: "/news", label: "News", Icon: Newspaper },
  { href: "/directory", label: "Directory", Icon: Users },
  { href: "/market", label: "Market", Icon: ShoppingBag },
  { href: "/events", label: "Events", Icon: CalendarDays },
];

export default function BottomTabs() {
  const path = usePathname();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {tabs.map(({ href, label, Icon }) => {
          const active = path === href || path.startsWith(href + "/");
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-16 flex-col items-center justify-center gap-0.5 text-[13px] font-semibold ${
                  active ? "text-primary" : "text-muted"
                }`}
              >
                <Icon size={24} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
