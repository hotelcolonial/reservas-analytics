"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { Reserva, GastoDiario } from "@/lib/types";
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
  receita: number;
  investimento: number;
}

export function MonthlyRevenueChart({
  reservas,
  gastos,
}: {
  reservas: Reserva[];
  gastos: GastoDiario[];
}) {
  const mapa = new Map<string, Ponto>();

  function ponto(chaveMes: string): Ponto {
    const existente = mapa.get(chaveMes);
    if (existente) return existente;
    const [, mes] = chaveMes.split("-");
    const novo: Ponto = {
      chave: chaveMes,
      rotulo: MESES[Number(mes) - 1] ?? mes,
      receita: 0,
      investimento: 0,
    };
    mapa.set(chaveMes, novo);
    return novo;
  }

  for (const r of reservas) {
    if (r.status !== "confirmada") continue;
    const [ano, mes] = r.dataReserva.split("-");
    if (!ano || !mes) continue;
    ponto(`${ano}-${mes}`).receita += r.valor;
  }

  for (const g of gastos) {
    const [ano, mes] = g.data.split("-");
    if (!ano || !mes) continue;
    ponto(`${ano}-${mes}`).investimento += g.valor;
  }

  const data = Array.from(mapa.values())
    .sort((a, b) => a.chave.localeCompare(b.chave))
    .slice(-8);

  if (data.length === 0) {
    return (
      <EmptyState
        title="Sem dados ainda"
        description="Registre reservas e a verba diária para ver receita × investimento."
      />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke="rgba(16,17,19,0.10)" />
        <XAxis
          dataKey="rotulo"
          tick={{ fontSize: 12, fill: "#5e6166" }}
          axisLine={false}
          tickLine={false}
          dy={6}
        />
        <YAxis
          tickFormatter={(v) => formatBRLCompact(v)}
          tick={{ fontSize: 11, fill: "#9da0a5" }}
          axisLine={false}
          tickLine={false}
          width={64}
        />
        <Tooltip
          cursor={{ fill: "rgba(16,17,19,0.06)" }}
          formatter={(v, name) => [
            formatBRL(Number(v)),
            name === "receita" ? "Receita" : "Investimento",
          ]}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid rgba(16,17,19,0.10)",
            fontSize: 13,
          }}
        />
        <Legend
          formatter={(value) =>
            value === "receita" ? "Receita confirmada" : "Investimento"
          }
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
        />
        <Bar dataKey="receita" fill="#101113" barSize={20} radius={[6, 6, 0, 0]} />
        <Bar
          dataKey="investimento"
          fill="#f95738"
          barSize={20}
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
