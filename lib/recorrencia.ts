/**
 * Cálculo das ocorrências de uma despesa recorrente.
 *
 * Funções puras: entram e saem strings ISO (`yyyy-mm-dd` e `yyyy-mm`), nunca
 * objetos `Date`. A única exceção é `diaDaSemana`, que precisa do calendário
 * para saber em que dia da semana uma data cai — e mesmo ali usa `Date.UTC`,
 * para o resultado não depender do fuso de quem abre a página.
 *
 * Não existe cron nem servidor: a geração é sempre disparada à mão pela UI.
 */
import type { DespesaRecorrente, Lancamento } from "./typesGastos";
import { DIAS_SEMANA_PLURAL, MESES_LABELS } from "./typesGastos";

/** Quebra uma competência `yyyy-mm`. Devolve null se o formato não bater. */
export function partesCompetencia(
  competencia: string,
): { ano: number; mes: number } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(competencia);
  if (!m) return null;
  const ano = Number(m[1]);
  const mes = Number(m[2]);
  if (mes < 1 || mes > 12) return null;
  return { ano, mes };
}

function bissexto(ano: number): boolean {
  return (ano % 4 === 0 && ano % 100 !== 0) || ano % 400 === 0;
}

/** Quantos dias tem o mês (1-12). */
export function diasNoMes(ano: number, mes: number): number {
  const dias = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (mes === 2 && bissexto(ano)) return 29;
  return dias[mes - 1] ?? 30;
}

/** Monta uma data ISO a partir das partes. */
export function isoDe(ano: number, mes: number, dia: number): string {
  return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

/** Dia da semana de uma data ISO: 0 = domingo … 6 = sábado. */
export function diaDaSemana(iso: string): number {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay();
}

/** True se a data cai dentro da vigência da recorrente (limites inclusivos). */
function dentroDaVigencia(data: string, d: DespesaRecorrente): boolean {
  if (d.inicio && data < d.inicio) return false;
  if (d.fim && data > d.fim) return false;
  return true;
}

/**
 * Datas de vencimento que esta recorrente gera dentro da competência.
 *
 * • Semanal — uma por cada vez que o dia da semana cai no mês (4 ou 5).
 * • Mensal  — uma; se o dia passa do fim do mês, usa o último dia.
 * • Anual   — uma, e só quando `mesVencimento` bate com o mês pedido.
 *
 * Só devolve datas dentro do `inicio`/`fim` da recorrente.
 */
export function ocorrenciasNoMes(
  d: DespesaRecorrente,
  competencia: string,
): string[] {
  const partes = partesCompetencia(competencia);
  if (!partes) return [];
  const { ano, mes } = partes;
  const ultimoDia = diasNoMes(ano, mes);

  if (d.periodicidade === "semanal") {
    const alvo = d.diaVencimento;
    if (alvo < 0 || alvo > 6) return [];
    const datas: string[] = [];
    for (let dia = 1; dia <= ultimoDia; dia++) {
      const iso = isoDe(ano, mes, dia);
      if (diaDaSemana(iso) === alvo) datas.push(iso);
    }
    return datas.filter((iso) => dentroDaVigencia(iso, d));
  }

  if (d.periodicidade === "anual" && d.mesVencimento !== mes) return [];

  // Mensal e anual: um vencimento, limitado ao último dia do mês.
  const dia = Math.min(Math.max(d.diaVencimento, 1), ultimoDia);
  const iso = isoDe(ano, mes, dia);
  return dentroDaVigencia(iso, d) ? [iso] : [];
}

/** Linha legível do card: "Mensal, todo dia 15", "Semanal, às segundas". */
export function descreverRecorrencia(d: DespesaRecorrente): string {
  if (d.periodicidade === "semanal") {
    return `Semanal, ${DIAS_SEMANA_PLURAL[d.diaVencimento] ?? "—"}`;
  }
  if (d.periodicidade === "anual") {
    const mes = d.mesVencimento
      ? MESES_LABELS[d.mesVencimento].toLowerCase()
      : "—";
    return `Anual, ${d.diaVencimento} de ${mes}`;
  }
  return `Mensal, todo dia ${d.diaVencimento}`;
}

/* ---------- Planejamento da geração ---------- */

export interface ItemGeracao {
  despesa: DespesaRecorrente;
  data: string; // ISO
}

export interface PlanoGeracao {
  /** O que seria criado agora. */
  criar: ItemGeracao[];
  /** Ocorrências que já existem e por isso são puladas. */
  omitidos: number;
  /** Soma dos `valorPrevisto` do que seria criado. */
  total: number;
}

/** Chave de unicidade: uma recorrente não repete o mesmo vencimento. */
function chave(despesaRecorrenteId: string, dataVencimento: string): string {
  return `${despesaRecorrenteId}|${dataVencimento}`;
}

/**
 * Monta o plano de geração SEM escrever nada.
 *
 * A idempotência mora aqui: qualquer ocorrência que já tenha um lançamento com
 * o mesmo `despesaRecorrenteId` e a mesma `dataVencimento` entra em `omitidos`
 * em vez de `criar`. Rodar duas vezes seguidas devolve `criar` vazio na
 * segunda, porque o store já tem as linhas da primeira.
 */
export function planejarGeracao(
  despesas: DespesaRecorrente[],
  lancamentos: Lancamento[],
  competencia: string,
): PlanoGeracao {
  const existentes = new Set(
    lancamentos
      .filter((l) => l.despesaRecorrenteId)
      .map((l) => chave(l.despesaRecorrenteId as string, l.dataVencimento)),
  );

  const criar: ItemGeracao[] = [];
  let omitidos = 0;

  for (const despesa of despesas) {
    if (!despesa.ativa) continue;
    for (const data of ocorrenciasNoMes(despesa, competencia)) {
      if (existentes.has(chave(despesa.id, data))) {
        omitidos++;
        continue;
      }
      criar.push({ despesa, data });
    }
  }

  const total = criar.reduce((acc, i) => acc + i.despesa.valorPrevisto, 0);
  return { criar, omitidos, total };
}
