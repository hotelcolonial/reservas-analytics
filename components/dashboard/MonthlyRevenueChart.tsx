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
import type { Reserva } from "@/lib/types";
import { formatBRL, formatBRLCompact } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";

const MESES = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

interface Ponto {
  chave: string;
  rotulo: string;
  confirmada: number;
  pendente: number;
}

export function MonthlyRevenueChart({ reservas }: { reservas: Reserva[] }) {
  const mapa = new Map<string, Ponto>();

  for (const r of reservas) {
    if (r.status === "cancelada") continue;
    const [ano, mes] = r.checkIn.split("-");
    if (!ano || !mes) continue;
    const chave = `${ano}-${mes}`;
    if (!mapa.has(chave)) {
      mapa.set(chave, {
        chave,
        rotulo: MESES[Number(mes) - 1] ?? mes,
        confirmada: 0,
        pendente: 0,
      });
    }
    const ponto = mapa.get(chave)!;
    if (r.status === "confirmada") ponto.confirmada += r.valor;
    else ponto.pendente += r.valor;
  }

  const data = Array.from(mapa.values())
    .sort((a, b) => a.chave.localeCompare(b.chave))
    .slice(-8);

  if (data.length === 0) {
    return (
      <EmptyState
        title="Sem receita ainda"
        description="Registre reservas para ver a receita por mês."
      />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke="#eef0f3" />
        <XAxis
          dataKey="rotulo"
          tick={{ fontSize: 12, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
          dy={6}
        />
        <YAxis
          tickFormatter={(v) => formatBRLCompact(v)}
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
          width={64}
        />
        <Tooltip
          cursor={{ fill: "rgba(79,70,229,0.06)" }}
          formatter={(v, name) => [
            formatBRL(Number(v)),
            name === "confirmada" ? "Confirmada" : "Pendente",
          ]}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.06)",
            fontSize: 13,
          }}
        />
        <Bar dataKey="confirmada" stackId="a" fill="#4f46e5" barSize={28} />
        <Bar
          dataKey="pendente"
          stackId="a"
          fill="#c7d2fe"
          barSize={28}
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
