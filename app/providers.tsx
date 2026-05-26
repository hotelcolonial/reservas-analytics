"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useStore } from "@/lib/store";

/**
 * Hidrata o store do Zustand a partir do localStorage no cliente.
 * Usa useSyncExternalStore para acompanhar o estado de hidratação sem
 * provocar mismatch de SSR: no servidor e no primeiro render do cliente o
 * snapshot é `false` (mostra placeholder); após `rehydrate()` terminar, o
 * componente re-renderiza com o conteúdo real.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const hydrated = useSyncExternalStore(
    (cb) => useStore.persist.onFinishHydration(cb),
    () => useStore.persist.hasHydrated(),
    () => false,
  );

  useEffect(() => {
    useStore.persist.rehydrate();
  }, []);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutro">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-colonial/20 border-t-colonial" />
          <p className="font-display text-lg text-colonial">
            ReservaTrack Colonial
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
