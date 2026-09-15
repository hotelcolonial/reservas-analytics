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
