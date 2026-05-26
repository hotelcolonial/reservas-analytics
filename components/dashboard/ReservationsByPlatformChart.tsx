"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { Reserva } from "@/lib/types";
import { PLATAFORMA_LABELS, PLATAFORMA_CORES, PLATAFORMAS } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";

export function ReservationsByPlatformChart({
  reservas,
}: {
  reservas: Reserva[];
}) {
  const data = PLATAFORMAS.map((p) => ({
    plataforma: p,
    nome: PLATAFORMA_LABELS[p],
    cor: PLATAFORMA_CORES[p],
    total: reservas.filter((r) => r.plataforma === p).length,
  })).filter((d) => d.total > 0);

  const total = data.reduce((acc, d) => acc + d.total, 0);

  if (data.length === 0) {
    return (
      <EmptyState
        title="Sem reservas ainda"
        description="Registre reservas para ver a distribuição por plataforma."
      />
    );
  }

  return (
    <div>
      <div className="relative mx-auto h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="nome"
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={88}
              paddingAngle={3}
              cornerRadius={6}
              stroke="none"
            >
              {data.map((d) => (
                <Cell key={d.plataforma} fill={d.cor} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => [`${Number(v)} reserva(s)`, ""]}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.06)",
                fontSize: 13,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs font-medium text-colonial/45">Total</span>
          <span className="font-display text-3xl font-extrabold tracking-tight text-colonial">
            {total}
          </span>
        </div>
      </div>

      <ul className="mt-4 space-y-2.5">
        {data
          .sort((a, b) => b.total - a.total)
          .map((d) => (
            <li
              key={d.plataforma}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="flex items-center gap-2.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: d.cor }}
                />
                <span className="text-colonial/75">{d.nome}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="font-semibold text-colonial">{d.total}</span>
                <span className="text-xs text-colonial/40">
                  {Math.round((d.total / total) * 100)}%
                </span>
              </span>
            </li>
          ))}
      </ul>
    </div>
  );
}
