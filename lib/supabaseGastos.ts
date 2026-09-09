/**
 * Mappers row ↔ domínio do módulo Gastos.
 *
 * O cliente Supabase e a leitura paginada (`fetchAll`) vivem em
 * `lib/supabase.ts` e são reusados daqui — não duplicar nem o cliente nem a
 * paginação de 1000 linhas.
 */
import type { Row } from "./supabase";
import type {
  Cartao,
  Natureza,
  DespesaRecorrente,
  Lancamento,
} from "./typesGastos";

/** Texto opcional: no banco pode vir null, no domínio é sempre string. */
function texto(value: unknown): string {
  return (value as string | null) ?? "";
}

/** Inteiro opcional: mantém null em vez de virar 0. */
function inteiroOuNull(value: unknown): number | null {
  return value === null || value === undefined ? null : Number(value);
}

// ── Cartão ────────────────────────────────────────────────────────────────

export function rowToCartao(row: Row): Cartao {
  return {
    id: row.id as string,
    nome: row.nome as string,
    bandeira: row.bandeira as Cartao["bandeira"],
    final: texto(row.final),
    titular: texto(row.titular),
    ativo: Boolean(row.ativo),
    ordem: Number(row.ordem ?? 0),
  };
}

export function cartaoToRow(c: Cartao) {
  return {
    id: c.id,
    nome: c.nome,
    bandeira: c.bandeira,
    final: c.final,
    titular: c.titular,
    ativo: c.ativo,
    ordem: c.ordem,
  };
}

// ── Natureza ──────────────────────────────────────────────────────────────

export function rowToNatureza(row: Row): Natureza {
  return {
    id: row.id as string,
    nome: row.nome as string,
    grupo: row.grupo as Natureza["grupo"],
    cor: texto(row.cor),
    ordem: Number(row.ordem ?? 0),
  };
}

export function naturezaToRow(n: Natureza) {
  return {
    id: n.id,
    nome: n.nome,
    grupo: n.grupo,
    cor: n.cor,
    ordem: n.ordem,
  };
}

// ── Despesa recorrente ────────────────────────────────────────────────────

export function rowToDespesaRecorrente(row: Row): DespesaRecorrente {
  return {
    id: row.id as string,
    nome: row.nome as string,
    descricao: texto(row.descricao),
    naturezaId: texto(row.natureza_id),
    fornecedor: texto(row.fornecedor),
    formaPagamento: row.forma_pagamento as DespesaRecorrente["formaPagamento"],
    cartaoId: (row.cartao_id as string | null) ?? null,
    valorPrevisto: Number(row.valor_previsto ?? 0),
    periodicidade: row.periodicidade as DespesaRecorrente["periodicidade"],
    diaVencimento: Number(row.dia_vencimento ?? 1),
    mesVencimento: inteiroOuNull(row.mes_vencimento),
    ativa: Boolean(row.ativa),
    inicio: row.inicio as string,
    fim: (row.fim as string | null) ?? null,
  };
}

export function despesaRecorrenteToRow(d: DespesaRecorrente) {
  return {
    id: d.id,
    nome: d.nome,
    descricao: d.descricao,
    natureza_id: d.naturezaId,
    fornecedor: d.fornecedor,
    forma_pagamento: d.formaPagamento,
    cartao_id: d.cartaoId,
    valor_previsto: d.valorPrevisto,
    periodicidade: d.periodicidade,
    dia_vencimento: d.diaVencimento,
    mes_vencimento: d.mesVencimento,
    ativa: d.ativa,
    inicio: d.inicio,
    fim: d.fim,
  };
}

// ── Lançamento ────────────────────────────────────────────────────────────

export function rowToLancamento(row: Row): Lancamento {
  return {
    id: row.id as string,
    descricao: row.descricao as string,
    naturezaId: texto(row.natureza_id),
    fornecedor: texto(row.fornecedor),
    formaPagamento: row.forma_pagamento as Lancamento["formaPagamento"],
    cartaoId: (row.cartao_id as string | null) ?? null,
    valor: Number(row.valor ?? 0),
    competencia: row.competencia as string,
    dataVencimento: row.data_vencimento as string,
    dataPagamento: (row.data_pagamento as string | null) ?? null,
    status: row.status as Lancamento["status"],
    comprovanteUrl: (row.comprovante_url as string | null) ?? null,
    observacoes: texto(row.observacoes),
    despesaRecorrenteId: (row.despesa_recorrente_id as string | null) ?? null,
    criadoEm: row.criado_em as string,
  };
}

export function lancamentoToRow(l: Lancamento) {
  return {
    id: l.id,
    descricao: l.descricao,
    natureza_id: l.naturezaId,
    fornecedor: l.fornecedor,
    forma_pagamento: l.formaPagamento,
    cartao_id: l.cartaoId,
    valor: l.valor,
    competencia: l.competencia,
    data_vencimento: l.dataVencimento,
    data_pagamento: l.dataPagamento,
    status: l.status,
    comprovante_url: l.comprovanteUrl,
    observacoes: l.observacoes,
    despesa_recorrente_id: l.despesaRecorrenteId,
    criado_em: l.criadoEm,
  };
}
