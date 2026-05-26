import { MetricCard } from "./MetricCard";
import type { MetricasDashboard } from "@/lib/types";
import {
  formatBRL,
  formatPercent,
  formatMultiplier,
  formatNumber,
} from "@/lib/utils";

export function MetricsGrid({ m }: { m: MetricasDashboard }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        label="Receita total"
        value={formatBRL(m.receitaTotal)}
        hint="Reservas confirmadas"
        trend={
          m.receitaTotal > 0
            ? { direction: "up", label: formatMultiplier(m.roasGeral) }
            : null
        }
      />
      <MetricCard
        label="Investimento total"
        value={formatBRL(m.investimentoTotal)}
        hint="Soma da verba diária"
      />
      <MetricCard
        label="ROI geral"
        value={formatPercent(m.roiGeral)}
        hint="Retorno sobre investimento"
        trend={
          m.roiGeral === null
            ? null
            : {
                direction: m.roiGeral >= 0 ? "up" : "down",
                label: m.roiGeral >= 0 ? "lucro" : "prejuízo",
              }
        }
      />
      <MetricCard
        label="ROAS geral"
        value={formatMultiplier(m.roasGeral)}
        hint="Receita por R$ investido"
      />
      <MetricCard
        label="Total de reservas"
        value={formatNumber(m.totalReservas)}
        hint="Todos os status"
      />
      <MetricCard
        label="Ticket médio"
        value={formatBRL(m.ticketMedio ?? 0)}
        hint="Por reserva confirmada"
      />
      <MetricCard
        label="Total de hóspedes"
        value={formatNumber(m.totalPax)}
        hint="Pax confirmados"
      />
      <MetricCard
        label="Total de diárias"
        value={formatNumber(m.totalNoites)}
        hint="Noites confirmadas"
      />
      <MetricCard
        label="Campanha de maior receita"
        value={
          m.campanhaMaiorReceita && m.campanhaMaiorReceita.receita > 0
            ? formatBRL(m.campanhaMaiorReceita.receita)
            : "—"
        }
        hint={m.campanhaMaiorReceita?.campanha.nome ?? "Sem dados"}
      />
      <MetricCard
        label="Campanha de melhor ROI"
        value={m.campanhaMelhorRoi ? formatPercent(m.campanhaMelhorRoi.roi) : "—"}
        hint={m.campanhaMelhorRoi?.campanha.nome ?? "Sem dados"}
      />
    </div>
  );
}
