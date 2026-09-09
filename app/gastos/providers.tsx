"use client";

import { useEffect } from "react";
import { useGastosStore } from "@/lib/storeGastos";

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
          <div className="size-9 animate-spin rounded-full border-2 border-border-strong border-t-coral" />
          <p className="font-brand text-lg font-light tracking-tighter text-carvao lowercase">
            growthdirect<span className="text-coral">.</span>
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
