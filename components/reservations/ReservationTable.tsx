"use client";

import { Badge } from "@/components/ui/Badge";
import type { Campanha, Reserva } from "@/lib/types";
import {
  formatBRL,
  formatDate,
  PLATAFORMA_LABELS,
  STATUS_RESERVA_BADGE,
  STATUS_RESERVA_LABELS,
} from "@/lib/utils";

export function ReservationTable({
  reservas,
  campanhas,
  onEdit,
  onDelete,
}: {
  reservas: Reserva[];
  campanhas: Campanha[];
  onEdit: (r: Reserva) => void;
  onDelete: (r: Reserva) => void;
}) {
  function nomeCampanha(id: string | null): string {
    if (!id) return "Sem campanha";
    return campanhas.find((c) => c.id === id)?.nome ?? "Sem campanha";
  }

  return (
    <div className="overflow-x-auto rounded-3xl bg-branco shadow-[0_1px_3px_rgba(16,24,40,0.04),0_8px_24px_-12px_rgba(16,24,40,0.10)]">
      <table className="w-full min-w-[880px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-black/5 text-left text-xs uppercase tracking-wide text-colonial/45">
            <th className="px-4 py-3.5 font-semibold">Reserva</th>
            <th className="px-4 py-3.5 font-semibold">Campanha</th>
            <th className="px-4 py-3.5 font-semibold">Plataforma</th>
            <th className="px-4 py-3.5 font-semibold">Check-in</th>
            <th className="px-4 py-3.5 font-semibold">Check-out</th>
            <th className="px-4 py-3.5 text-right font-semibold">Pax</th>
            <th className="px-4 py-3.5 text-right font-semibold">Noites</th>
            <th className="px-4 py-3.5 text-right font-semibold">Valor</th>
            <th className="px-4 py-3.5 font-semibold">Status</th>
            <th className="px-4 py-3.5 font-semibold">Atendente</th>
            <th className="px-4 py-3.5 text-right font-semibold">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {reservas.map((r) => (
            <tr key={r.id} className="hover:bg-colonial-50/60">
              <td className="px-4 py-3.5 font-semibold text-colonial">
                {r.codigo}
              </td>
              <td className="px-4 py-3.5 text-colonial/70">
                {nomeCampanha(r.campanhaId)}
              </td>
              <td className="px-4 py-3.5 text-colonial/70">
                {PLATAFORMA_LABELS[r.plataforma]}
              </td>
              <td className="px-4 py-3.5 text-colonial/70">
                {formatDate(r.checkIn)}
              </td>
              <td className="px-4 py-3.5 text-colonial/70">
                {formatDate(r.checkOut)}
              </td>
              <td className="px-4 py-3.5 text-right text-colonial/70">{r.pax}</td>
              <td className="px-4 py-3.5 text-right text-colonial/70">
                {r.noites}
              </td>
              <td className="px-4 py-3.5 text-right font-semibold text-colonial">
                {formatBRL(r.valor)}
              </td>
              <td className="px-4 py-3.5">
                <Badge className={STATUS_RESERVA_BADGE[r.status]}>
                  {STATUS_RESERVA_LABELS[r.status]}
                </Badge>
              </td>
              <td className="px-4 py-3.5 text-colonial/70">
                {r.atendente || "—"}
              </td>
              <td className="px-4 py-3.5">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onEdit(r)}
                    className="rounded-lg p-1.5 text-colonial/50 transition-colors hover:bg-colonial-50 hover:text-colonial"
                    aria-label="Editar reserva"
                  >
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDelete(r)}
                    className="rounded-lg p-1.5 text-colonial/40 transition-colors hover:bg-rose-50 hover:text-rose-600"
                    aria-label="Excluir reserva"
                  >
                    <svg
                      width="17"
                      height="17"
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
