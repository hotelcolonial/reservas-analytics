"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { MetricasCampanha } from "@/lib/types";
import { formatBRL, formatBRLCompact } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";

const CORES = ["#122b1c", "#233d20", "#3a5a3a", "#6b8f71", "#f3a42c"];

export function RevenueByCampaignChart({
  metricas,
}: {
  metricas: MetricasCampanha[];
}) {
  const data = metricas
    .filter((m) => m.receita > 0)
    .sort((a, b) => b.receita - a.receita)
    .slice(0, 8)
    .map((m) => ({ nome: m.campanha.nome, receita: m.receita }));

  if (data.length === 0) {
    return (
      <EmptyState
        title="Sem receita ainda"
        description="Registre reservas confirmadas para visualizar a receita por campanha."
      />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 48)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
      >
        <XAxis
          type="number"
          tickFormatter={(v) => formatBRLCompact(v)}
          tick={{ fontSize: 11, fill: "#6b6b6b" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="nome"
          width={140}
          tick={{ fontSize: 12, fill: "#122b1c" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "rgba(18,43,28,0.05)" }}
          formatter={(v) => [formatBRL(Number(v)), "Receita"]}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.06)",
            fontSize: 13,
          }}
        />
        <Bar dataKey="receita" radius={[0, 8, 8, 0]} barSize={22}>
          {data.map((_, i) => (
            <Cell key={i} fill={CORES[i % CORES.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
