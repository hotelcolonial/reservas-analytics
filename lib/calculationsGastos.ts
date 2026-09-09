/**
 * Métricas do módulo Gastos (ver GASTOS.md).
 *
 * Funções puras, sem estado. Duas regras valem em todo o arquivo:
 *
 *   1. Lançamentos com `status = "cancelado"` ficam FORA de todos os totais.
 *   2. Divisão por zero devolve `null` — nunca `0` nem `Infinity`. A camada de
 *      formatação (`formatPercent`, `formatNumber`) imprime isso como "N/A".
 */
import type { Lancamento, Natureza } from "./typesGastos";

/** Divisão segura: null se o divisor for 0 (→ "N/A" na UI). */
function safeDiv(num: number, den: number): number | null {
  if (!den) return null;
  return num / den;
}

/** Atrasado é derivado, não guardado: pendente com vencimento já passado. */
export function estaAtrasado(l: Lancamento, hoje: string): boolean {
  return l.status === "pendente" && l.dataVencimento < hoje;
}

/** Tudo que entra em total: o cancelado nunca conta. */
export function naoCancelados(lancamentos: Lancamento[]): Lancamento[] {
  return lancamentos.filter((l) => l.status !== "cancelado");
}

/* ---------- Datas (sempre string ISO, nunca Date para fora) ---------- */

/** Soma dias a uma data ISO. Usa UTC para não depender do fuso. */
export function somarDias(iso: string, dias: number): string {
  const [ano, mes, dia] = iso.split("-").map(Number);
  const t = new Date(Date.UTC(ano, mes - 1, dia));
  t.setUTCDate(t.getUTCDate() + dias);
  const m = String(t.getUTCMonth() + 1).padStart(2, "0");
  const d = String(t.getUTCDate()).padStart(2, "0");
  return `${t.getUTCFullYear()}-${m}-${d}`;
}

/** Soma meses a uma competência `yyyy-mm`. */
export function somarMeses(competencia: string, meses: number): string {
  const [ano, mes] = competencia.split("-").map(Number);
  if (!ano || !mes) return competencia;
  const total = ano * 12 + (mes - 1) + meses;
  const novoAno = Math.floor(total / 12);
  const novoMes = (total % 12) + 1;
  return `${novoAno}-${String(novoMes).padStart(2, "0")}`;
}

const MESES_CURTOS = [
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

/** Rótulo curto de uma competência: "2026-09" → "Set/26". */
export function rotuloCompetencia(competencia: string): string {
  const [ano, mes] = competencia.split("-");
  const nome = MESES_CURTOS[Number(mes) - 1] ?? mes;
  return `${nome}/${ano?.slice(2) ?? ""}`;
}

/* ---------- Métricas gerais ---------- */

export interface MetricasGastos {
  totalPeriodo: number;
  totalPago: number;
  totalPendente: number;
  totalAtrasado: number;
  quantidade: number; // lançamentos não cancelados
  ticketMedio: number | null;
}

export function metricasGastos(
  lancamentos: Lancamento[],
  hoje: string,
): MetricasGastos {
  const validos = naoCancelados(lancamentos);

  let totalPeriodo = 0;
  let totalPago = 0;
  let totalPendente = 0;
  let totalAtrasado = 0;

  for (const l of validos) {
    totalPeriodo += l.valor;
    if (l.status === "pago") totalPago += l.valor;
    if (l.status === "pendente") {
      totalPendente += l.valor;
      if (estaAtrasado(l, hoje)) totalAtrasado += l.valor;
    }
  }

  return {
    totalPeriodo,
    totalPago,
    totalPendente,
    totalAtrasado,
    quantidade: validos.length,
    ticketMedio: safeDiv(totalPeriodo, validos.length),
  };
}

/* ---------- Agrupamentos ---------- */

export interface GrupoValor {
  /** Id da natureza / do cartão / da forma, ou a competência. */
  chave: string;
  total: number;
  quantidade: number;
}

function agrupar(
  lancamentos: Lancamento[],
  chaveDe: (l: Lancamento) => string,
): GrupoValor[] {
  const mapa = new Map<string, GrupoValor>();
  for (const l of naoCancelados(lancamentos)) {
    const chave = chaveDe(l);
    const atual = mapa.get(chave) ?? { chave, total: 0, quantidade: 0 };
    atual.total += l.valor;
    atual.quantidade += 1;
    mapa.set(chave, atual);
  }
  return Array.from(mapa.values());
}

/** Por natureza, do maior total para o menor. */
export function porNatureza(lancamentos: Lancamento[]): GrupoValor[] {
  return agrupar(lancamentos, (l) => l.naturezaId).sort(
    (a, b) => b.total - a.total,
  );
}

/** Por cartão. Chave "" agrupa o que não foi no crédito. */
export function porCartao(lancamentos: Lancamento[]): GrupoValor[] {
  return agrupar(lancamentos, (l) => l.cartaoId ?? "").sort(
    (a, b) => b.total - a.total,
  );
}

export function porFormaPagamento(lancamentos: Lancamento[]): GrupoValor[] {
  return agrupar(lancamentos, (l) => l.formaPagamento).sort(
    (a, b) => b.total - a.total,
  );
}

/** Por competência, em ordem cronológica. */
export function porMes(lancamentos: Lancamento[]): GrupoValor[] {
  return agrupar(lancamentos, (l) => l.competencia).sort((a, b) =>
    a.chave.localeCompare(b.chave),
  );
}

/**
 * Linhas prontas para a barra empilhada: uma por mês, com uma coluna por
 * natureza. Meses sem lançamento de uma natureza ficam em 0.
 */
export function porMesPorNatureza(
  lancamentos: Lancamento[],
  naturezas: Natureza[],
  meses: string[],
): Array<Record<string, string | number>> {
  const validos = naoCancelados(lancamentos);
  return meses.map((competencia) => {
    const linha: Record<string, string | number> = {
      competencia,
      rotulo: rotuloCompetencia(competencia),
    };
    for (const n of naturezas) linha[n.id] = 0;
    for (const l of validos) {
      if (l.competencia !== competencia) continue;
      if (!(l.naturezaId in linha)) continue;
      linha[l.naturezaId] = (linha[l.naturezaId] as number) + l.valor;
    }
    return linha;
  });
}

/** Total de uma competência específica (cancelados fora). */
export function totalDoMes(
  lancamentos: Lancamento[],
  competencia: string,
): number {
  return naoCancelados(lancamentos)
    .filter((l) => l.competencia === competencia)
    .reduce((acc, l) => acc + l.valor, 0);
}

/**
 * Variação percentual entre dois meses.
 * Null quando o mês anterior é 0 — não existe "% de crescimento sobre nada".
 */
export function variacaoMensal(
  mesAtual: number,
  mesAnterior: number,
): number | null {
  if (!mesAnterior) return null;
  return ((mesAtual - mesAnterior) / mesAnterior) * 100;
}

/* ---------- Listas ---------- */

/** Os maiores gastos do período, do maior para o menor. */
export function maioresGastos(
  lancamentos: Lancamento[],
  limite: number,
): Lancamento[] {
  return [...naoCancelados(lancamentos)]
    .sort((a, b) => b.valor - a.valor)
    .slice(0, limite);
}

export interface AVencer {
  /** Pendentes já vencidos, do mais antigo para o mais recente. */
  atrasados: Lancamento[];
  /** Pendentes que vencem de hoje até `hoje + dias`. */
  proximos: Lancamento[];
}

/**
 * Contas a pagar. Olha TODOS os pendentes, não só os do período filtrado:
 * uma conta atrasada de outro mês continua sendo um problema de hoje.
 */
export function aVencer(
  lancamentos: Lancamento[],
  hoje: string,
  dias: number,
): AVencer {
  const limite = somarDias(hoje, dias);
  const pendentes = lancamentos.filter((l) => l.status === "pendente");

  return {
    atrasados: pendentes
      .filter((l) => l.dataVencimento < hoje)
      .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento)),
    proximos: pendentes
      .filter((l) => l.dataVencimento >= hoje && l.dataVencimento <= limite)
      .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento)),
  };
}
