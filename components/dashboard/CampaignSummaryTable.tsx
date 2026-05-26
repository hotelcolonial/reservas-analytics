import type { MetricasCampanha } from "@/lib/types";
import {
  formatBRL,
  formatPercent,
  formatMultiplier,
  PLATAFORMA_LABELS,
} from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";

export function CampaignSummaryTable({
  metricas,
}: {
  metricas: MetricasCampanha[];
}) {
  if (metricas.length === 0) {
    return (
      <EmptyState
        title="Nenhuma campanha cadastrada"
        description="Crie campanhas para começar a medir resultados."
      />
    );
  }

  const ordenadas = [...metricas].sort((a, b) => b.receita - a.receita);

  return (
    <div className="-mx-2 overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-colonial/50">
            <th className="px-3 py-2 font-semibold">Campanha</th>
            <th className="px-3 py-2 font-semibold">Plataforma</th>
            <th className="px-3 py-2 text-right font-semibold">Investido</th>
            <th className="px-3 py-2 text-right font-semibold">Reservas</th>
            <th className="px-3 py-2 text-right font-semibold">Receita</th>
            <th className="px-3 py-2 text-right font-semibold">ROI</th>
            <th className="px-3 py-2 text-right font-semibold">ROAS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {ordenadas.map((m) => (
            <tr key={m.campanha.id} className="hover:bg-colonial-50/50">
              <td className="px-3 py-3 font-medium text-colonial">
                {m.campanha.nome}
              </td>
              <td className="px-3 py-3 text-colonial/70">
                {PLATAFORMA_LABELS[m.campanha.plataforma]}
              </td>
              <td className="px-3 py-3 text-right text-colonial/70">
                {formatBRL(m.investimento)}
              </td>
              <td className="px-3 py-3 text-right text-colonial/70">
                {m.reservasConfirmadas}
                <span className="text-colonial/40">/{m.totalReservas}</span>
              </td>
              <td className="px-3 py-3 text-right font-semibold text-colonial">
                {formatBRL(m.receita)}
              </td>
              <td className="px-3 py-3 text-right">
                <RoiPill value={m.roi} />
              </td>
              <td className="px-3 py-3 text-right text-colonial/70">
                {formatMultiplier(m.roas)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RoiPill({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-colonial/40">N/A</span>;
  }
  const positivo = value >= 0;
  return (
    <span
      className={
        positivo
          ? "font-semibold text-emerald-600"
          : "font-semibold text-rose-600"
      }
    >
      {formatPercent(value)}
    </span>
  );
}
