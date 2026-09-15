/**
 * Ordenação por coluna, em memória, para tabelas paginadas.
 *
 * Regras (as mesmas para qualquer tabela que use isto):
 *  - a chave de cada linha é string (comparada com `localeCompare` pt-BR),
 *    number (comparado como número, nunca como texto) ou null;
 *  - null vai SEMPRE para o fim, em asc e em desc;
 *  - estável: empates mantêm a ordem em que chegaram (o `sort` do JS é
 *    estável, e o comparador devolve 0 no empate em vez de inventar critério);
 *  - datas ISO `yyyy-mm-dd` são strings e ordenam certo lexicograficamente —
 *    nunca passar por `Date`.
 *
 * Quem chama ordena a lista FILTRADA INTEIRA e só depois pagina.
 */

export type Direcao = "asc" | "desc";

export type ChaveOrdenacao = string | number | null;

export interface Ordenacao<C extends string> {
  coluna: C;
  direcao: Direcao;
}

/** Próximo estado ao clicar na mesma coluna: asc → desc → nenhuma. */
export function alternarOrdenacao<C extends string>(
  atual: Ordenacao<C> | null,
  coluna: C,
): Ordenacao<C> | null {
  if (!atual || atual.coluna !== coluna) return { coluna, direcao: "asc" };
  if (atual.direcao === "asc") return { coluna, direcao: "desc" };
  return null;
}

function comparar(a: ChaveOrdenacao, b: ChaveOrdenacao, direcao: Direcao): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1; // null no fim, independente da direção
  if (b === null) return -1;
  let r: number;
  if (typeof a === "number" && typeof b === "number") {
    r = a - b;
  } else {
    r = String(a).localeCompare(String(b), "pt-BR", { sensitivity: "base" });
  }
  return direcao === "asc" ? r : -r;
}

/** Devolve uma lista nova; a original não muda. */
export function ordenarPor<T>(
  lista: T[],
  chave: (item: T) => ChaveOrdenacao,
  direcao: Direcao,
): T[] {
  // Calcula a chave uma vez por linha, não a cada comparação.
  return lista
    .map((item, i) => ({ item, i, k: chave(item) }))
    .sort((x, y) => comparar(x.k, y.k, direcao) || x.i - y.i)
    .map((x) => x.item);
}
