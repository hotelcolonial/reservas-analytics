"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useGastosStore } from "@/lib/storeGastos";
import type { Lancamento } from "@/lib/typesGastos";
import { FORMA_PAGAMENTO_LABELS } from "@/lib/typesGastos";
import {
  metricasGastos,
  maioresGastos,
  aVencer,
  porCartao,
  porFormaPagamento,
  totalDoMes,
  variacaoMensal,
  somarMeses,
  rotuloCompetencia,
} from "@/lib/calculationsGastos";
import {
  formatBRL,
  formatDate,
  formatNumber,
  formatPercent,
  todayISO,
} from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { SectionCardHeader } from "@/components/ui/section-card";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricCard } from "@/components/dashboard/MetricCard";
import {
  PeriodFilterGastos,
  COMPETENCIA_TUDO,
  dentroDaCompetencia,
  type PeriodoCompetencia,
} from "@/components/gastos/PeriodFilterGastos";
import {
  GastosPorMesChart,
  GastosPorMesNaturezaChart,
  GastosPorNaturezaChart,
  BarrasHorizontais,
} from "@/components/gastos/GastosCharts";

const MESES_GRAFICO = 12;
const DIAS_A_VENCER = 15;
const TOP_GASTOS = 10;

export default function GastosDashboardPage() {
  const lancamentos = useGastosStore((s) => s.lancamentos);
  const naturezas = useGastosStore((s) => s.naturezas);
  const cartoes = useGastosStore((s) => s.cartoes);

  const hoje = todayISO();
  const mesAtual = hoje.slice(0, 7);

  const [periodo, setPeriodo] = useState<PeriodoCompetencia>(COMPETENCIA_TUDO);

  const naturezaPorId = useMemo(
    () => new Map(naturezas.map((n) => [n.id, n])),
    [naturezas],
  );
  const cartaoPorId = useMemo(
    () => new Map(cartoes.map((c) => [c.id, c])),
    [cartoes],
  );

  const filtrados = useMemo(
    () => lancamentos.filter((l) => dentroDaCompetencia(l.competencia, periodo)),
    [lancamentos, periodo],
  );

  const metricas = useMemo(
    () => metricasGastos(filtrados, hoje),
    [filtrados, hoje],
  );

  // O comparativo olha o último mês do período (ou o mês corrente, sem filtro).
  const mesReferencia = periodo.ate || mesAtual;
  const mesAnterior = somarMeses(mesReferencia, -1);
  const comparativo = useMemo(() => {
    const atual = totalDoMes(lancamentos, mesReferencia);
    const anterior = totalDoMes(lancamentos, mesAnterior);
    return {
      atual,
      anterior,
      delta: atual - anterior,
      variacao: variacaoMensal(atual, anterior),
    };
  }, [lancamentos, mesReferencia, mesAnterior]);

  const topGastos = useMemo(
    () => maioresGastos(filtrados, TOP_GASTOS),
    [filtrados],
  );

  // Contas a pagar olham todos os pendentes, não só os do período filtrado.
  const contas = useMemo(
    () => aVencer(lancamentos, hoje, DIAS_A_VENCER),
    [lancamentos, hoje],
  );

  const gruposCartao = useMemo(() => porCartao(filtrados), [filtrados]);
  const gruposForma = useMemo(
    () => porFormaPagamento(filtrados),
    [filtrados],
  );

  const semDados = lancamentos.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-brand text-[clamp(34px,4.4vw,58px)] leading-[0.95] font-light tracking-[-0.045em] text-carvao lowercase">
          gastos growthdirect
        </h1>
        <p className="mt-3 max-w-2xl text-[clamp(15px,1.1vw,17px)] leading-relaxed text-muted-fg">
          Controle de despesas do escritório. Os valores ignoram os lançamentos
          cancelados.
        </p>
      </div>

      <PeriodFilterGastos
        periodo={periodo}
        onChange={setPeriodo}
        mesAtual={mesAtual}
      />

      {semDados ? (
        <EmptyState
          title="Nenhum lançamento registrado"
          description="Registre o primeiro gasto para ver os números do escritório aqui."
          action={
            <Link
              href="/gastos/lancamentos"
              className="text-sm font-normal text-coral-dark hover:underline"
            >
              Ir para Lançamentos
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MetricCard
              label="Total do período"
              value={formatBRL(metricas.totalPeriodo)}
              hint="Sem os cancelados"
            />
            <MetricCard
              label="Total pago"
              value={formatBRL(metricas.totalPago)}
              hint="Já quitado"
            />
            <MetricCard
              label="Total pendente"
              value={formatBRL(metricas.totalPendente)}
              hint="Ainda a pagar"
            />
            <MetricCard
              label="Total atrasado"
              value={formatBRL(metricas.totalAtrasado)}
              hint="Pendente e vencido"
              trend={
                metricas.totalAtrasado > 0
                  ? { direction: "down", label: "atenção" }
                  : null
              }
            />
            <MetricCard
              label="Lançamentos"
              value={formatNumber(metricas.quantidade)}
              hint="No período filtrado"
            />
            <MetricCard
              label="Ticket médio"
              value={
                metricas.ticketMedio === null
                  ? "N/A"
                  : formatBRL(metricas.ticketMedio)
              }
              hint="Por lançamento"
            />
          </div>

          <Card>
            <SectionCardHeader
              title={`${rotuloCompetencia(mesReferencia)} vs. ${rotuloCompetencia(mesAnterior)}`}
              subtitle="Comparativo entre o mês de referência e o anterior."
            />
            <CardContent>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-subtle-fg">
                    {rotuloCompetencia(mesReferencia)}
                  </p>
                  <p className="mt-1 font-brand text-2xl font-light tracking-tight text-carvao tabular-nums">
                    {formatBRL(comparativo.atual)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-subtle-fg">
                    {rotuloCompetencia(mesAnterior)}
                  </p>
                  <p className="mt-1 font-brand text-2xl font-light tracking-tight text-muted-fg tabular-nums">
                    {formatBRL(comparativo.anterior)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-subtle-fg">Variação</p>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="font-brand text-2xl font-light tracking-tight text-carvao tabular-nums">
                      {formatPercent(comparativo.variacao)}
                    </p>
                    {comparativo.variacao !== null && (
                      <Seta subindo={comparativo.variacao >= 0} />
                    )}
                  </div>
                  <p className="mt-1 text-xs text-subtle-fg">
                    {comparativo.delta >= 0 ? "+" : "−"}
                    {formatBRL(Math.abs(comparativo.delta))} no mês
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <SectionCardHeader
                title="Total por mês"
                subtitle={`Últimos ${MESES_GRAFICO} meses de competência.`}
              />
              <CardContent>
                <GastosPorMesChart
                  lancamentos={lancamentos}
                  meses={MESES_GRAFICO}
                />
              </CardContent>
            </Card>

            <Card>
              <SectionCardHeader
                title="Por natureza"
                subtitle="Distribuição no período filtrado."
              />
              <CardContent>
                <GastosPorNaturezaChart
                  lancamentos={filtrados}
                  naturezas={naturezas}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <SectionCardHeader
              title="Por mês e natureza"
              subtitle="A mesma evolução, quebrada por categoria de gasto."
            />
            <CardContent>
              <GastosPorMesNaturezaChart
                lancamentos={lancamentos}
                naturezas={naturezas}
                meses={MESES_GRAFICO}
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <SectionCardHeader
                title="Por cartão"
                subtitle="Quanto passou em cada cartão."
                href="/gastos/cartoes"
              />
              <CardContent>
                <BarrasHorizontais
                  grupos={gruposCartao}
                  rotuloDe={(chave) =>
                    chave
                      ? (cartaoPorId.get(chave)?.nome ?? "Cartão excluído")
                      : "Sem cartão"
                  }
                  vazio="Nenhum gasto no período filtrado."
                />
              </CardContent>
            </Card>

            <Card>
              <SectionCardHeader
                title="Por forma de pagamento"
                subtitle="Como as despesas foram pagas."
              />
              <CardContent>
                <BarrasHorizontais
                  grupos={gruposForma}
                  cor="#f95738"
                  rotuloDe={(chave) =>
                    FORMA_PAGAMENTO_LABELS[
                      chave as keyof typeof FORMA_PAGAMENTO_LABELS
                    ] ?? chave
                  }
                  vazio="Nenhum gasto no período filtrado."
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <SectionCardHeader
                title="Maiores gastos do período"
                subtitle={`Top ${TOP_GASTOS} por valor.`}
                href="/gastos/lancamentos"
              />
              <CardContent>
                {topGastos.length === 0 ? (
                  <EmptyState
                    title="Sem gastos no período"
                    description="Ajuste o período para ver os maiores lançamentos."
                  />
                ) : (
                  <div className="-mx-2 overflow-x-auto">
                    <table className="w-full min-w-[420px] border-collapse text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wide text-subtle-fg">
                          <th className="px-3 py-2 font-normal">Descrição</th>
                          <th className="px-3 py-2 font-normal">Natureza</th>
                          <th className="px-3 py-2 text-right font-normal">
                            Valor
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5">
                        {topGastos.map((l) => {
                          const natureza = naturezaPorId.get(l.naturezaId);
                          return (
                            <tr key={l.id} className="hover:bg-carvao-50/50">
                              <td className="px-3 py-3">
                                <p className="font-normal text-carvao">
                                  {l.descricao}
                                </p>
                                <p className="text-xs text-subtle-fg">
                                  {formatDate(l.dataVencimento)}
                                </p>
                              </td>
                              <td className="px-3 py-3">
                                {natureza ? (
                                  <span className="inline-flex items-center gap-2">
                                    <span
                                      aria-hidden
                                      className="size-2.5 shrink-0 rounded-full"
                                      style={{ backgroundColor: natureza.cor }}
                                    />
                                    <span className="text-muted-fg">
                                      {natureza.nome}
                                    </span>
                                  </span>
                                ) : (
                                  <span className="text-subtle-fg">—</span>
                                )}
                              </td>
                              <td className="px-3 py-3 text-right font-normal text-carvao tabular-nums">
                                {formatBRL(l.valor)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <SectionCardHeader
                title="A vencer"
                subtitle={`Atrasados e vencimentos nos próximos ${DIAS_A_VENCER} dias.`}
                href="/gastos/lancamentos"
              />
              <CardContent>
                {contas.atrasados.length === 0 &&
                contas.proximos.length === 0 ? (
                  <EmptyState
                    title="Nada a pagar por agora"
                    description={`Nenhum lançamento pendente vence nos próximos ${DIAS_A_VENCER} dias.`}
                  />
                ) : (
                  <div className="space-y-4">
                    {contas.atrasados.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-normal uppercase tracking-wide text-destructive">
                          Atrasados ({contas.atrasados.length})
                        </p>
                        <ul className="space-y-2">
                          {contas.atrasados.map((l) => (
                            <LinhaAVencer key={l.id} lancamento={l} atrasado />
                          ))}
                        </ul>
                      </div>
                    )}

                    {contas.proximos.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-normal uppercase tracking-wide text-muted-foreground">
                          Próximos ({contas.proximos.length})
                        </p>
                        <ul className="space-y-2">
                          {contas.proximos.map((l) => (
                            <LinhaAVencer key={l.id} lancamento={l} />
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function Seta({ subindo }: { subindo: boolean }) {
  return (
    <span
      className={
        subindo
          ? "inline-flex items-center gap-0.5 rounded-full bg-destructive/8 px-2 py-0.5 text-xs font-normal text-destructive"
          : "inline-flex items-center gap-0.5 rounded-full bg-carvao-50 px-2 py-0.5 text-xs font-normal text-carvao"
      }
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {subindo ? <path d="M7 17 17 7M9 7h8v8" /> : <path d="M7 7 17 17M17 9v8H9" />}
      </svg>
      {subindo ? "gastou mais" : "gastou menos"}
    </span>
  );
}

function LinhaAVencer({
  lancamento,
  atrasado = false,
}: {
  lancamento: Lancamento;
  atrasado?: boolean;
}) {
  return (
    <li
      className={
        atrasado
          ? "flex items-center justify-between gap-3 rounded-lg bg-destructive/8 px-3 py-2 text-sm"
          : "flex items-center justify-between gap-3 px-3 py-1.5 text-sm"
      }
    >
      <span className="min-w-0">
        <span
          className={
            atrasado
              ? "block truncate font-normal text-destructive"
              : "block truncate font-normal text-carvao"
          }
        >
          {lancamento.descricao}
        </span>
        <span
          className={
            atrasado
              ? "block text-xs text-destructive"
              : "block text-xs text-subtle-fg"
          }
        >
          venc. {formatDate(lancamento.dataVencimento)}
        </span>
      </span>
      <span
        className={
          atrasado
            ? "shrink-0 font-normal text-destructive tabular-nums"
            : "shrink-0 font-normal text-carvao tabular-nums"
        }
      >
        {formatBRL(lancamento.valor)}
      </span>
    </li>
  );
}
