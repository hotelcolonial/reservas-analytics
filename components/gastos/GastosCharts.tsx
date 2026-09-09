"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { Lancamento, Natureza } from "@/lib/typesGastos";
import {
  porMes,
  porMesPorNatureza,
  porNatureza,
  rotuloCompetencia,
  type GrupoValor,
} from "@/lib/calculationsGastos";
import { formatBRL, formatBRLCompact } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";

const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: "1px solid rgba(16,17,19,0.10)",
  fontSize: 13,
};

const CURSOR = { fill: "rgba(16,17,19,0.06)" };

/** Cor de fallback quando a natureza foi excluída (naturezaId órfão). */
const COR_SEM_NATUREZA = "#eae3da";

/* ---------- Total por mês ---------- */

export function GastosPorMesChart({
  lancamentos,
  meses,
}: {
  lancamentos: Lancamento[];
  meses: number;
}) {
  const data = porMes(lancamentos)
    .slice(-meses)
    .map((g) => ({ rotulo: rotuloCompetencia(g.chave), total: g.total }));

  if (data.length === 0) {
    return (
      <EmptyState
        title="Sem lançamentos ainda"
        description="Registre gastos para ver a evolução mês a mês."
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
          cursor={CURSOR}
          formatter={(v) => [formatBRL(Number(v)), "Total"]}
          contentStyle={TOOLTIP_STYLE}
        />
        <Bar dataKey="total" fill="#101113" barSize={26} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ---------- Total por mês, empilhado por natureza ---------- */

export function GastosPorMesNaturezaChart({
  lancamentos,
  naturezas,
  meses,
}: {
  lancamentos: Lancamento[];
  naturezas: Natureza[];
  meses: number;
}) {
  const chaves = porMes(lancamentos)
    .slice(-meses)
    .map((g) => g.chave);

  // Só empilha naturezas que aparecem no recorte — evita 20 séries em zero.
  const usadas = new Set(lancamentos.map((l) => l.naturezaId));
  const series = naturezas.filter((n) => usadas.has(n.id));

  const data = porMesPorNatureza(lancamentos, series, chaves);

  if (data.length === 0 || series.length === 0) {
    return (
      <EmptyState
        title="Sem dados para empilhar"
        description="Classifique os lançamentos por natureza para ver esta quebra."
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
          cursor={CURSOR}
          formatter={(v, name) => [
            formatBRL(Number(v)),
            series.find((n) => n.id === name)?.nome ?? String(name),
          ]}
          contentStyle={TOOLTIP_STYLE}
        />
        {series.map((n, i) => (
          <Bar
            key={n.id}
            dataKey={n.id}
            stackId="natureza"
            fill={n.cor}
            barSize={26}
            // Só a série do topo arredonda, para a pilha não ficar serrilhada.
            radius={i === series.length - 1 ? [6, 6, 0, 0] : undefined}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ---------- Distribuição por natureza (donut) ---------- */

export function GastosPorNaturezaChart({
  lancamentos,
  naturezas,
}: {
  lancamentos: Lancamento[];
  naturezas: Natureza[];
}) {
  const porId = new Map(naturezas.map((n) => [n.id, n]));

  const data = porNatureza(lancamentos)
    .filter((g) => g.total > 0)
    .map((g) => ({
      chave: g.chave,
      nome: porId.get(g.chave)?.nome ?? "Sem natureza",
      cor: porId.get(g.chave)?.cor ?? COR_SEM_NATUREZA,
      total: g.total,
    }));

  const total = data.reduce((acc, d) => acc + d.total, 0);

  if (data.length === 0) {
    return (
      <EmptyState
        title="Sem lançamentos no período"
        description="Ajuste o período para ver a distribuição por natureza."
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
                <Cell key={d.chave} fill={d.cor} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => [formatBRL(Number(v)), ""]}
              contentStyle={TOOLTIP_STYLE}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs font-normal text-subtle-fg">Total</span>
          <span className="font-brand text-xl font-light tracking-tight text-carvao">
            {formatBRLCompact(total)}
          </span>
        </div>
      </div>

      <ul className="mt-4 space-y-2.5">
        {data.map((d) => (
          <li
            key={d.chave}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: d.cor }}
              />
              <span className="truncate text-muted-fg">{d.nome}</span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <span className="font-normal text-carvao tabular-nums">
                {formatBRL(d.total)}
              </span>
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

/* ---------- Barras horizontais genéricas ---------- */

export function BarrasHorizontais({
  grupos,
  rotuloDe,
  cor = "#101113",
  vazio,
}: {
  grupos: GrupoValor[];
  rotuloDe: (chave: string) => string;
  cor?: string;
  vazio: string;
}) {
  const data = grupos
    .filter((g) => g.total > 0)
    .map((g) => ({ nome: rotuloDe(g.chave), total: g.total }));

  if (data.length === 0) {
    return <EmptyState title="Sem dados" description={vazio} />;
  }

  // Altura acompanha a quantidade de barras, para não achatar nem sobrar.
  const altura = Math.max(160, data.length * 44 + 24);

  return (
    <ResponsiveContainer width="100%" height={altura}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
      >
        <CartesianGrid horizontal={false} stroke="rgba(16,17,19,0.10)" />
        <XAxis
          type="number"
          tickFormatter={(v) => formatBRLCompact(v)}
          tick={{ fontSize: 11, fill: "#9da0a5" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="nome"
          tick={{ fontSize: 12, fill: "#5e6166" }}
          axisLine={false}
          tickLine={false}
          width={140}
        />
        <Tooltip
          cursor={CURSOR}
          formatter={(v) => [formatBRL(Number(v)), "Total"]}
          contentStyle={TOOLTIP_STYLE}
        />
        <Bar dataKey="total" fill={cor} barSize={20} radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
