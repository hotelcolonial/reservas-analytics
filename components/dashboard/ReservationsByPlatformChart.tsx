"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
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

  if (data.length === 0) {
    return (
      <EmptyState
        title="Sem reservas ainda"
        description="Registre reservas para ver a distribuição por plataforma."
      />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="total"
          nameKey="nome"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={2}
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
        <Legend
          iconType="circle"
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
