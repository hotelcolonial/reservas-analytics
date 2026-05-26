import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Campanha, Reserva } from "@/lib/types";
import {
  formatBRL,
  formatDate,
  STATUS_RESERVA_BADGE,
  STATUS_RESERVA_LABELS,
} from "@/lib/utils";

export function RecentReservations({
  reservas,
  campanhas,
}: {
  reservas: Reserva[];
  campanhas: Campanha[];
}) {
  const recentes = [...reservas]
    .sort((a, b) => b.dataReserva.localeCompare(a.dataReserva))
    .slice(0, 6);

  if (recentes.length === 0) {
    return (
      <EmptyState
        title="Nenhuma reserva registrada"
        description="As reservas mais recentes aparecem aqui."
      />
    );
  }

  function nomeCampanha(id: string | null): string {
    if (!id) return "Sem campanha";
    return campanhas.find((c) => c.id === id)?.nome ?? "Sem campanha";
  }

  return (
    <ul className="divide-y divide-black/5">
      {recentes.map((r) => (
        <li
          key={r.id}
          className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
        >
          <div className="min-w-0">
            <p className="truncate font-semibold text-colonial">{r.codigo}</p>
            <p className="truncate text-xs text-colonial/50">
              {nomeCampanha(r.campanhaId)} · check-in {formatDate(r.checkIn)}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="text-sm font-semibold text-colonial">
              {formatBRL(r.valor)}
            </span>
            <Badge className={STATUS_RESERVA_BADGE[r.status]}>
              {STATUS_RESERVA_LABELS[r.status]}
            </Badge>
          </div>
        </li>
      ))}
    </ul>
  );
}
