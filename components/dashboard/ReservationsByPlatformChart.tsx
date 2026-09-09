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
                border: "1px solid rgba(16,17,19,0.10)",
                fontSize: 13,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs font-normal text-subtle-fg">Total</span>
          <span className="font-brand text-3xl font-light tracking-tight text-carvao">
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
                <span className="text-muted-fg">{d.nome}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="font-normal text-carvao">{d.total}</span>
                <span className="text-xs text-subtle-fg">
                  {Math.round((d.total / total) * 100)}%
                </span>
              </span>
            </li>
          ))}
      </ul>
    </div>
  );
}
