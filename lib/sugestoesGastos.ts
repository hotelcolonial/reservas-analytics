/**
 * Sugestões de descrição para o formulário de lançamento.
 *
 * Função pura sobre a lista em memória do store: nada de consulta nem de
 * catálogo à parte. "Tráfego pago — Meta Ads" digitado 12 vezes vira uma
 * sugestão só, na frente das menos usadas. A grafia que fica é a da
 * primeira ocorrência (a lista do store vem ordenada por vencimento, então
 * é a mais antiga).
 */
import type { Lancamento } from "./typesGastos";

/** Chave de agrupamento: sem acento, sem caixa, sem espaço sobrando. */
function chave(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function sugestoesDeDescricao(lancamentos: Lancamento[]): string[] {
  const grupos = new Map<string, { texto: string; usos: number }>();
  for (const l of lancamentos) {
    const texto = l.descricao.trim();
    if (!texto) continue;
    const k = chave(texto);
    const g = grupos.get(k);
    if (g) g.usos += 1;
    else grupos.set(k, { texto, usos: 1 });
  }
  return [...grupos.values()]
    .sort((a, b) => b.usos - a.usos || a.texto.localeCompare(b.texto, "pt-BR"))
    .map((g) => g.texto);
}

/* ---------- Perfil de uma descrição ---------- */

/**
 * Campos que o formulário pode preencher ao ESCOLHER uma sugestão. Só entram
 * os que têm histórico; o que não aparece aqui fica como a pessoa deixou.
 * Nunca: valor, competência, vencimento, status — mudam a cada lançamento.
 */
export interface PerfilDescricao {
  naturezaId?: string;
  fornecedor?: string;
  propriedadeId?: string;
  formaPagamento?: Lancamento["formaPagamento"];
  /** Só quando a forma sugerida é cartão de crédito. */
  cartaoId?: string;
}

/** Ordem de recência: quando foi criado; sem isso, o vencimento. */
function recencia(l: Lancamento): string {
  return l.criadoEm ?? l.dataVencimento;
}

/**
 * Valor mais usado de um campo entre os lançamentos dados; no empate, o do
 * lançamento mais recente. Vazios/nulos não contam (não são "histórico").
 */
function maisFrequente<V extends string>(
  lancamentos: Lancamento[],
  valorDe: (l: Lancamento) => V | null | undefined,
): V | undefined {
  const contagem = new Map<V, { usos: number; ultimo: string }>();
  for (const l of lancamentos) {
    const v = valorDe(l);
    if (v === null || v === undefined || v === "") continue;
    const atual = contagem.get(v) ?? { usos: 0, ultimo: "" };
    atual.usos += 1;
    const r = recencia(l);
    if (r > atual.ultimo) atual.ultimo = r;
    contagem.set(v, atual);
  }
  let melhor: { v: V; usos: number; ultimo: string } | null = null;
  for (const [v, { usos, ultimo }] of contagem) {
    if (
      !melhor ||
      usos > melhor.usos ||
      (usos === melhor.usos && ultimo > melhor.ultimo)
    ) {
      melhor = { v, usos, ultimo };
    }
  }
  return melhor?.v;
}

/**
 * Perfil dos lançamentos que já usaram esta descrição (mesma chave que as
 * sugestões: sem acento, sem caixa). Vazio se nunca foi usada.
 */
export function perfilDaDescricao(
  lancamentos: Lancamento[],
  descricao: string,
): PerfilDescricao {
  const k = chave(descricao);
  if (!k) return {};
  const iguais = lancamentos.filter((l) => chave(l.descricao) === k);
  if (iguais.length === 0) return {};

  const perfil: PerfilDescricao = {};
  const naturezaId = maisFrequente(iguais, (l) => l.naturezaId);
  const fornecedor = maisFrequente(iguais, (l) => l.fornecedor.trim());
  const propriedadeId = maisFrequente(iguais, (l) => l.propriedadeId);
  const formaPagamento = maisFrequente(iguais, (l) => l.formaPagamento);
  if (naturezaId) perfil.naturezaId = naturezaId;
  if (fornecedor) perfil.fornecedor = fornecedor;
  if (propriedadeId) perfil.propriedadeId = propriedadeId;
  if (formaPagamento) perfil.formaPagamento = formaPagamento;
  if (formaPagamento === "cartao_credito") {
    // O cartão só faz sentido junto da forma; e só entre os que foram no crédito.
    const cartaoId = maisFrequente(
      iguais.filter((l) => l.formaPagamento === "cartao_credito"),
      (l) => l.cartaoId,
    );
    if (cartaoId) perfil.cartaoId = cartaoId;
  }
  return perfil;
}
