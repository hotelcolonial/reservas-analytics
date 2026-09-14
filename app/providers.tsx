"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { ROTA_LOGIN } from "@/lib/rotasAuth";
import { Logo } from "@/components/layout/Logo";

/**
 * Carga inicial do ReservaTrack.
 *
 * Em `/login` não carrega nada nem bloqueia: não faz sentido baixar as tabelas
 * antes de saber quem é o usuário (e o `proxy.ts` nem deixaria a query passar
 * sem sessão). O `useEffect` depende da rota justamente para disparar a carga
 * quando a pessoa sai do login e cai no hub.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const publica = pathname === ROTA_LOGIN;
  const hydrated = useStore((s) => s.hydrated);
  const loadData = useStore((s) => s.loadData);

  useEffect(() => {
    if (!publica && !hydrated) loadData();
  }, [publica, hydrated, loadData]);

  if (publica) return <>{children}</>;

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-branco">
        <div className="flex flex-col items-center gap-4">
          <Logo variante="simbolo" className="h-10" />
          <div className="size-6 animate-spin rounded-full border-2 border-border-strong border-t-coral" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
