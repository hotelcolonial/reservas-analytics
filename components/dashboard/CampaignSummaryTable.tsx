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
  const ativas = metricas.filter((m) => m.campanha.status !== "pausada");

  if (ativas.length === 0) {
    return (
      <EmptyState
        title="Nenhuma campanha ativa"
        description="Crie ou reative campanhas para começar a medir resultados."
      />
    );
  }

  const ordenadas = [...ativas].sort((a, b) => b.receita - a.receita);

  return (
    <div className="-mx-2 overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-subtle-fg">
            <th className="px-3 py-2 font-normal">Campanha</th>
            <th className="px-3 py-2 font-normal">Plataforma</th>
            <th className="px-3 py-2 text-right font-normal">Investido</th>
            <th className="px-3 py-2 text-right font-normal">Reservas</th>
            <th className="px-3 py-2 text-right font-normal">Receita</th>
            <th className="px-3 py-2 text-right font-normal">ROI</th>
            <th className="px-3 py-2 text-right font-normal">ROAS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {ordenadas.map((m) => (
            <tr key={m.campanha.id} className="hover:bg-carvao-50/50">
              <td className="px-3 py-3 font-normal text-carvao">
                {m.campanha.nome}
              </td>
              <td className="px-3 py-3 text-muted-fg">
                {PLATAFORMA_LABELS[m.campanha.plataforma]}
              </td>
              <td className="px-3 py-3 text-right text-muted-fg">
                {formatBRL(m.investimento)}
              </td>
              <td className="px-3 py-3 text-right text-muted-fg">
                {m.reservasConfirmadas}
                <span className="text-subtle-fg">/{m.totalReservas}</span>
              </td>
              <td className="px-3 py-3 text-right font-normal text-carvao">
                {formatBRL(m.receita)}
              </td>
              <td className="px-3 py-3 text-right">
                <RoiPill value={m.roi} />
              </td>
              <td className="px-3 py-3 text-right text-muted-fg">
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
    return <span className="text-subtle-fg">N/A</span>;
  }
  const positivo = value >= 0;
  return (
    <span
      className={
        positivo
          ? "font-normal text-carvao"
          : "font-normal text-destructive"
      }
    >
      {formatPercent(value)}
    </span>
  );
}
