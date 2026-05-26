"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { GastoDiario } from "@/lib/types";
import { formatBRL, formatBRLCompact, formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";

function ddmm(iso: string): string {
  const [, m, d] = iso.split("-");
  return d && m ? `${d}/${m}` : iso;
}

export function SpendByDateChart({ gastos }: { gastos: GastoDiario[] }) {
  const mapa = new Map<string, number>();
  for (const g of gastos) {
    mapa.set(g.data, (mapa.get(g.data) ?? 0) + g.valor);
  }

  const data = Array.from(mapa.entries())
    .map(([iso, valor]) => ({ iso, valor, rotulo: ddmm(iso) }))
    .sort((a, b) => a.iso.localeCompare(b.iso));

  if (data.length === 0) {
    return (
      <EmptyState
        title="Sem verba no período"
        description="Lance gastos ou ajuste o filtro de datas para ver o gráfico."
      />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke="#e7e1d6" />
        <XAxis
          dataKey="rotulo"
          tick={{ fontSize: 11, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
          dy={6}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={(v) => formatBRLCompact(v)}
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
          width={64}
        />
        <Tooltip
          cursor={{ fill: "rgba(18,43,28,0.06)" }}
          formatter={(v) => [formatBRL(Number(v)), "Verba gasta"]}
          labelFormatter={(_, payload) =>
            payload && payload[0]
              ? formatDate(payload[0].payload.iso)
              : ""
          }
          contentStyle={{
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.06)",
            fontSize: 13,
          }}
        />
        <Bar dataKey="valor" fill="#f3a42c" radius={[6, 6, 0, 0]} maxBarSize={44} />
      </BarChart>
    </ResponsiveContainer>
  );
}
