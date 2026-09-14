"use client";

import { useEffect } from "react";
import { useGastosStore } from "@/lib/storeGastos";
import { Logo } from "@/components/layout/Logo";

/**
 * Carga do módulo Gastos.
 *
 * Vive só aqui, nunca em `app/providers.tsx`: a carga é preguiçosa, então o
 * módulo de reservas não espera pelos gastos nem os gastos esperam pelas
 * reservas.
 */
export function GastosProviders({ children }: { children: React.ReactNode }) {
  const hydrated = useGastosStore((s) => s.hydrated);
  const loadGastos = useGastosStore((s) => s.loadGastos);

  useEffect(() => {
    loadGastos();
  }, [loadGastos]);

  if (!hydrated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Logo variante="simbolo" className="h-10" />
          <div className="size-6 animate-spin rounded-full border-2 border-border-strong border-t-coral" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
