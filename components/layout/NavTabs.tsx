"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "Dashboard" },
  { href: "/campanhas", label: "Campanhas" },
  { href: "/reservas", label: "Reservas" },
  { href: "/plataformas", label: "Plataformas" },
];

export function NavTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto">
      {tabs.map((tab) => {
        const active =
          tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-colonial text-branco"
                : "text-colonial/70 hover:bg-colonial-50 hover:text-colonial",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
