"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MetricasCampanha } from "@/lib/types";
import {
  formatBRL,
  formatPercent,
  PLATAFORMA_LABELS,
  TIPO_CAMPANHA_LABELS,
  STATUS_CAMPANHA_LABELS,
  STATUS_CAMPANHA_BADGE,
} from "@/lib/utils";

interface CampaignRowProps {
  m: MetricasCampanha;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  dragHandle?: React.ReactNode;
}

export function CampaignRow({
  m,
  onEdit,
  onDelete,
  onToggle,
  dragHandle,
}: CampaignRowProps) {
  const c = m.campanha;

  return (
    <Card className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:gap-4">
      {dragHandle && <div className="shrink-0">{dragHandle}</div>}

      <div className="min-w-0 flex-1">
        <Link
          href={`/campanhas/${c.id}`}
          className="font-display text-base font-semibold text-colonial hover:text-laranja-dark hover:underline"
        >
          {c.nome}
        </Link>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <Badge className="bg-colonial-50 text-colonial">
            {PLATAFORMA_LABELS[c.plataforma]}
          </Badge>
          <Badge className="bg-colonial-50 text-colonial/70">
            {TIPO_CAMPANHA_LABELS[c.tipo]}
          </Badge>
          <Badge className={STATUS_CAMPANHA_BADGE[c.status]}>
            {STATUS_CAMPANHA_LABELS[c.status]}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm md:flex md:shrink-0 md:gap-6">
        <Stat label="Verba" value={formatBRL(m.investimento)} />
        <Stat label="Receita" value={formatBRL(m.receita)} strong />
        <Stat
          label="Reservas"
          value={`${m.reservasConfirmadas}/${m.totalReservas}`}
        />
        <Stat label="ROI" value={formatPercent(m.roi)} accent={m.roi} />
      </div>

      <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
        <Link href={`/campanhas/${c.id}`}>
          <Button variant="outline" size="sm">
            Detalhes
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
          className="rounded-lg p-2 text-colonial/40 transition-colors hover:bg-rose-50 hover:text-rose-600"
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

function Stat({
  label,
  value,
  accent,
  strong,
}: {
  label: string;
  value: string;
  accent?: number | null;
  strong?: boolean;
}) {
  const cor =
    accent === undefined || accent === null
      ? strong
        ? "text-colonial font-semibold"
        : "text-colonial/75"
      : accent >= 0
        ? "font-semibold text-emerald-600"
        : "font-semibold text-rose-600";
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wide text-colonial/45">
        {label}
      </p>
      <p className={`truncate text-sm tabular-nums ${cor}`}>{value}</p>
    </div>
  );
}
