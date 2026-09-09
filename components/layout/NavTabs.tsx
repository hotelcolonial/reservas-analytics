"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface NavTab {
  href: string;
  label: string;
  /** True quando só o caminho exato ativa a aba (dashboards com sub-rotas). */
  exact?: boolean;
}

/** Abas do módulo de reservas (ReservaTrack). */
export const TABS_RESERVAS: NavTab[] = [
  { href: "/painel", label: "dashboard", exact: true },
  { href: "/campanhas", label: "campanhas" },
  { href: "/reservas", label: "reservas" },
  { href: "/verba", label: "verba" },
  { href: "/plataformas", label: "plataformas" },
  { href: "/propriedades", label: "propriedades" },
];

/** Abas do módulo de gastos (GrowthDirect). */
export const TABS_GASTOS: NavTab[] = [
  { href: "/gastos", label: "dashboard", exact: true },
  { href: "/gastos/lancamentos", label: "lançamentos" },
  { href: "/gastos/recorrentes", label: "recorrentes" },
  { href: "/gastos/cartoes", label: "cartões" },
  { href: "/gastos/naturezas", label: "naturezas" },
];

export function NavTabs({ tabs }: { tabs: NavTab[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto">
      {tabs.map((tab) => {
        const active = tab.exact
          ? pathname === tab.href
          : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "whitespace-nowrap rounded-full px-4 py-2 text-sm font-normal lowercase transition-colors duration-300",
              active
                ? "bg-carvao text-branco"
                : "text-muted-fg hover:bg-carvao-50 hover:text-carvao",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
