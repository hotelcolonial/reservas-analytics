"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { metricasTodasPlataformas } from "@/lib/calculations";
import { PlatformComparison } from "@/components/platforms/PlatformComparison";

export default function PlataformasPage() {
  const campanhas = useStore((s) => s.campanhas);
  const reservas = useStore((s) => s.reservas);

  const metricas = useMemo(
    () => metricasTodasPlataformas(campanhas, reservas),
    [campanhas, reservas],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-colonial">
          Comparativo por plataforma
        </h1>
        <p className="mt-1 text-sm text-colonial/60">
          Veja onde o investimento rende mais: Google Ads, Meta Ads, Orgânico,
          WhatsApp Direto e outros.
        </p>
      </div>

      <PlatformComparison metricas={metricas} />
    </div>
  );
}
