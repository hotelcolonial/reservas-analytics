"use client";

import { Badge } from "@/components/ui/badge";
import type { Campanha, Reserva } from "@/lib/types";
import {
  formatBRL,
  formatDate,
  PLATAFORMA_LABELS,
  STATUS_RESERVA_BADGE,
  STATUS_RESERVA_LABELS,
} from "@/lib/utils";

function EditIcon() {
  return (
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
  );
}

function TrashIcon() {
  return (
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
  );
}

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
    <>
      {/* Mobile: cartões empilhados em coluna única */}
      <ul className="space-y-3 md:hidden">
        {reservas.map((r) => (
          <li
            key={r.id}
            className="rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-base font-bold text-colonial">
                  {r.codigo}
                </p>
                <p className="mt-0.5 truncate text-sm text-colonial/60">
                  {nomeCampanha(r.campanhaId)}
                </p>
              </div>
              <Badge className={STATUS_RESERVA_BADGE[r.status]}>
                {STATUS_RESERVA_LABELS[r.status]}
              </Badge>
            </div>

            {r.campanhaId && !r.veioDaCampanha && (
              <span className="mt-2 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                data não coincide
              </span>
            )}

            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <Field label="Valor" value={formatBRL(r.valor)} strong />
              <Field label="Plataforma" value={PLATAFORMA_LABELS[r.plataforma]} />
              <Field label="Data reserva" value={formatDate(r.dataReserva)} />
              <Field label="Pax / Noites" value={`${r.pax} / ${r.noites}`} />
              <Field label="Check-in" value={formatDate(r.checkIn)} />
              <Field label="Check-out" value={formatDate(r.checkOut)} />
            </dl>

            <div className="mt-3 flex items-center justify-end gap-2 border-t border-black/5 pt-3">
              <button
                onClick={() => onEdit(r)}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-colonial/70 transition-colors hover:bg-colonial-50 hover:text-colonial"
              >
                <EditIcon />
                Editar
              </button>
              <button
                onClick={() => onDelete(r)}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-colonial/50 transition-colors hover:bg-rose-50 hover:text-rose-600"
              >
                <TrashIcon />
                Excluir
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Desktop: tabela completa */}
      <div className="hidden overflow-x-auto rounded-xl border border-border bg-card shadow-sm md:block">
        <table className="w-full min-w-[880px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-black/5 text-left text-xs uppercase tracking-wide text-colonial/45">
              <th className="px-4 py-3.5 font-semibold">Reserva</th>
              <th className="px-4 py-3.5 font-semibold">Data reserva</th>
              <th className="px-4 py-3.5 font-semibold">Campanha</th>
              <th className="px-4 py-3.5 font-semibold">Plataforma</th>
              <th className="px-4 py-3.5 font-semibold">Check-in</th>
              <th className="px-4 py-3.5 font-semibold">Check-out</th>
              <th className="px-4 py-3.5 text-right font-semibold">Pax</th>
              <th className="px-4 py-3.5 text-right font-semibold">Noites</th>
              <th className="px-4 py-3.5 text-right font-semibold">Valor</th>
              <th className="px-4 py-3.5 font-semibold">Status</th>
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
                  {formatDate(r.dataReserva)}
                </td>
                <td className="px-4 py-3.5 text-colonial/70">
                  <span>{nomeCampanha(r.campanhaId)}</span>
                  {r.campanhaId && !r.veioDaCampanha && (
                    <span className="ml-1.5 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                      data não coincide
                    </span>
                  )}
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
                <td className="px-4 py-3.5 text-right text-colonial/70">
                  {r.pax}
                </td>
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
                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit(r)}
                      className="rounded-lg p-1.5 text-colonial/50 transition-colors hover:bg-colonial-50 hover:text-colonial"
                      aria-label="Editar reserva"
                    >
                      <EditIcon />
                    </button>
                    <button
                      onClick={() => onDelete(r)}
                      className="rounded-lg p-1.5 text-colonial/40 transition-colors hover:bg-rose-50 hover:text-rose-600"
                      aria-label="Excluir reserva"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Field({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] uppercase tracking-wide text-colonial/45">
        {label}
      </dt>
      <dd
        className={
          strong
            ? "truncate font-semibold text-colonial"
            : "truncate text-colonial/75"
        }
      >
        {value}
      </dd>
    </div>
  );
}
