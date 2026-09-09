"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { MetricasCampanha } from "@/lib/types";
import {
  formatBRL,
  formatPercent,
  formatMultiplier,
  PLATAFORMA_LABELS,
  TIPO_CAMPANHA_LABELS,
  STATUS_CAMPANHA_LABELS,
  STATUS_CAMPANHA_BADGE,
} from "@/lib/utils";

interface CampaignCardProps {
  m: MetricasCampanha;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  /** Slot opcional para o handle de drag (renderiza no topo-direito do card). */
  dragHandle?: React.ReactNode;
}

export function CampaignCard({
  m,
  onEdit,
  onDelete,
  onToggle,
  dragHandle,
}: CampaignCardProps) {
  const c = m.campanha;

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/campanhas/${c.id}`}
            className="font-brand text-lg font-normal text-carvao hover:text-coral-dark hover:underline"
          >
            {c.nome}
          </Link>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge className="bg-carvao-50 text-carvao">
              {PLATAFORMA_LABELS[c.plataforma]}
            </Badge>
            <Badge className="bg-carvao-50 text-muted-fg">
              {TIPO_CAMPANHA_LABELS[c.tipo]}
            </Badge>
            <Badge className={STATUS_CAMPANHA_BADGE[c.status]}>
              {STATUS_CAMPANHA_LABELS[c.status]}
            </Badge>
          </div>
        </div>
        {dragHandle && <div className="shrink-0">{dragHandle}</div>}
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-black/5">
        <Metric label="Verba gasta" value={formatBRL(m.investimento)} />
        <Metric label="Receita" value={formatBRL(m.receita)} />
        <Metric
          label="Reservas"
          value={`${m.reservasConfirmadas}/${m.totalReservas}`}
        />
        <Metric label="ROI" value={formatPercent(m.roi)} accent={m.roi} />
        <Metric label="ROAS" value={formatMultiplier(m.roas)} />
        <Metric
          label="Custo/reserva"
          value={m.custoPorReserva === null ? "N/A" : formatBRL(m.custoPorReserva)}
        />
      </div>

      <div className="mt-auto flex items-center gap-2 pt-1">
        <Link href={`/campanhas/${c.id}`}>
          <Button variant="outline" size="sm">
            Ver detalhes
          </Button>
        </Link>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          Editar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          disabled={c.status === "finalizada"}
        >
          {c.status === "ativa" ? "Pausar" : "Ativar"}
        </Button>
        <button
          onClick={onDelete}
          className="ml-auto rounded-lg p-2 text-subtle-fg transition-colors hover:bg-destructive/8 hover:text-destructive"
          aria-label="Excluir campanha"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>
    </Card>
  );
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: number | null;
}) {
  const cor =
    accent === undefined || accent === null
      ? "text-carvao"
      : accent >= 0
        ? "text-carvao"
        : "text-destructive";
  return (
    <div className="bg-branco px-3 py-2.5">
      <p className="text-[11px] uppercase tracking-wide text-subtle-fg">
        {label}
      </p>
      <p className={`mt-0.5 text-sm font-normal ${cor}`}>{value}</p>
    </div>
  );
}
