import type { MetricasCampanha } from "@/lib/types";
import { formatBRL, formatPercent } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";

export function CampaignRanking({
  metricas,
}: {
  metricas: MetricasCampanha[];
}) {
  const ranking = metricas
    .filter((m) => m.receita > 0)
    .sort((a, b) => b.receita - a.receita)
    .slice(0, 5);

  if (ranking.length === 0) {
    return (
      <EmptyState
        title="Sem ranking ainda"
        description="As campanhas aparecem aqui conforme geram receita."
      />
    );
  }

  const maxReceita = ranking[0].receita || 1;

  return (
    <ol className="space-y-4">
      {ranking.map((m, i) => (
        <li key={m.campanha.id}>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                {i + 1}
              </span>
              <span className="truncate font-medium text-colonial">
                {m.campanha.nome}
              </span>
            </div>
            <span className="shrink-0 text-sm font-semibold text-colonial">
              {formatBRL(m.receita)}
            </span>
          </div>
          <div className="ml-9 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-colonial-50">
              <div
                className="h-full rounded-full bg-brand"
                style={{ width: `${(m.receita / maxReceita) * 100}%` }}
              />
            </div>
            <span className="shrink-0 whitespace-nowrap text-right text-xs text-colonial/50">
              ROI {formatPercent(m.roi)}
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}
