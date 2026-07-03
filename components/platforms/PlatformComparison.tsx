"use client";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import type { MetricasPlataforma } from "@/lib/types";
import {
  formatBRL,
  formatPercent,
  formatMultiplier,
  PLATAFORMA_LABELS,
  PLATAFORMA_CORES,
} from "@/lib/utils";

export function PlatformComparison({
  metricas,
}: {
  metricas: MetricasPlataforma[];
}) {
  if (metricas.length === 0) {
    return (
      <EmptyState
        title="Sem dados de plataforma"
        description="Cadastre campanhas e reservas para comparar as plataformas."
      />
    );
  }

  const maxReceita = Math.max(...metricas.map((m) => m.receita), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {metricas.map((m) => (
          <Card key={m.plataforma} className="space-y-4 p-5">
            <div className="flex items-center gap-2.5">
              <span
                className="h-3 w-3 rounded-full"
                style={{ background: PLATAFORMA_CORES[m.plataforma] }}
              />
              <h3 className="font-display text-lg font-semibold text-colonial">
                {PLATAFORMA_LABELS[m.plataforma]}
              </h3>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-colonial-50">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(m.receita / maxReceita) * 100}%`,
                  background: PLATAFORMA_CORES[m.plataforma],
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Item label="Investido" value={formatBRL(m.investimento)} />
              <Item label="Receita" value={formatBRL(m.receita)} />
              <Item
                label="Reservas"
                value={`${m.reservasConfirmadas}/${m.totalReservas}`}
              />
              <Item label="ROI" value={formatPercent(m.roi)} accent={m.roi} />
              <Item label="ROAS" value={formatMultiplier(m.roas)} />
              <Item
                label="Custo/reserva"
                value={
                  m.custoPorReserva === null
                    ? "N/A"
                    : formatBRL(m.custoPorReserva)
                }
              />
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h2 className="mb-4 font-display text-xl font-semibold text-colonial">
          Comparativo geral
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-colonial/50">
                <th className="px-3 py-2 font-semibold">Plataforma</th>
                <th className="px-3 py-2 text-right font-semibold">Investido</th>
                <th className="px-3 py-2 text-right font-semibold">Reservas</th>
                <th className="px-3 py-2 text-right font-semibold">Receita</th>
                <th className="px-3 py-2 text-right font-semibold">ROI</th>
                <th className="px-3 py-2 text-right font-semibold">ROAS</th>
                <th className="px-3 py-2 text-right font-semibold">
                  Custo/reserva
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {metricas.map((m) => (
                <tr key={m.plataforma} className="hover:bg-colonial-50/50">
                  <td className="px-3 py-3 font-medium text-colonial">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: PLATAFORMA_CORES[m.plataforma] }}
                      />
                      {PLATAFORMA_LABELS[m.plataforma]}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right text-colonial/70">
                    {formatBRL(m.investimento)}
                  </td>
                  <td className="px-3 py-3 text-right text-colonial/70">
                    {m.reservasConfirmadas}/{m.totalReservas}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-colonial">
                    {formatBRL(m.receita)}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {m.roi === null ? (
                      <span className="text-colonial/40">N/A</span>
                    ) : (
                      <span
                        className={
                          m.roi >= 0
                            ? "font-semibold text-emerald-600"
                            : "font-semibold text-rose-600"
                        }
                      >
                        {formatPercent(m.roi)}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right text-colonial/70">
                    {formatMultiplier(m.roas)}
                  </td>
                  <td className="px-3 py-3 text-right text-colonial/70">
                    {m.custoPorReserva === null
                      ? "N/A"
                      : formatBRL(m.custoPorReserva)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Item({
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
      ? "text-colonial"
      : accent >= 0
        ? "text-emerald-600"
        : "text-rose-600";
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-colonial/45">
        {label}
      </p>
      <p className={`mt-0.5 text-sm font-semibold ${cor}`}>{value}</p>
    </div>
  );
}
