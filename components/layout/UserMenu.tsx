"use client";

import { useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useUsuario, sair } from "@/lib/auth";

/**
 * Menu do usuário logado: e-mail e "sair". Não renderiza nada sem usuário
 * (modo mock, ou o instante antes do `getUser` responder).
 */
export function UserMenu() {
  const usuario = useUsuario();
  const [saindo, setSaindo] = useState(false);

  if (!usuario?.email) return null;

  const email = usuario.email;
  const inicial = email.charAt(0).toLowerCase();

  async function onSair() {
    setSaindo(true);
    await sair();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="menu do usuário"
        disabled={saindo}
        className="flex h-9 items-center gap-2 rounded-full border border-border bg-card pr-3 pl-1 text-sm font-normal text-carvao transition-colors outline-none hover:bg-carvao-50 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 data-[state=open]:bg-carvao-50"
      >
        {/* Avatar tipográfico: inicial do e-mail no círculo carvão. */}
        <span className="flex size-7 items-center justify-center rounded-full bg-carvao text-xs text-branco">
          {inicial}
        </span>
        <span className="hidden max-w-[16rem] truncate sm:block">{email}</span>
        <ChevronDown className="size-4 text-muted-fg" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="normal-case">
          <span className="block text-[11px] lowercase">conectado como</span>
          <span className="mt-0.5 block truncate text-sm text-carvao">
            {email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onSair} disabled={saindo}>
          <LogOut />
          {saindo ? "saindo…" : "sair"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
