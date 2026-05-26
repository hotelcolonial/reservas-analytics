"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { metricasTodasPlataformas } from "@/lib/calculations";
import { PlatformComparison } from "@/components/platforms/PlatformComparison";
import { PeriodFilter } from "@/components/ui/PeriodFilter";
import { PERIODO_TUDO, dentroDoPeriodo, type Periodo } from "@/lib/utils";

export default function PlataformasPage() {
  const campanhas = useStore((s) => s.campanhas);
  const reservas = useStore((s) => s.reservas);
  const gastos = useStore((s) => s.gastos);

  const [periodo, setPeriodo] = useState<Periodo>(PERIODO_TUDO);

  const metricas = useMemo(() => {
    const reservasFiltradas = reservas.filter((r) =>
      dentroDoPeriodo(r.dataReserva, periodo),
    );
    const gastosFiltrados = gastos.filter((g) =>
      dentroDoPeriodo(g.data, periodo),
    );
    return metricasTodasPlataformas(
      campanhas,
      reservasFiltradas,
      gastosFiltrados,
    );
  }, [campanhas, reservas, gastos, periodo]);

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

      <PeriodFilter periodo={periodo} onChange={setPeriodo} />

      <PlatformComparison metricas={metricas} />
    </div>
  );
}
