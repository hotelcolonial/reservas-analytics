/**
 * Operações imutáveis em listas de entidades `{ id }`, usadas pelos stores
 * para aplicar e DESFAZER escritas otimistas (ver `escritaOtimista.ts`).
 *
 * O desfazer precisa devolver a lista exatamente como estava, e por isso os
 * removidos guardam a posição de onde saíram (`Removido`).
 */

export interface ComId {
  id: string;
}

/** Item removido e a posição que ocupava, para reinserir no mesmo lugar. */
export interface Removido<T> {
  item: T;
  indice: number;
}

export function semId<T extends ComId>(lista: T[], id: string): T[] {
  return lista.filter((x) => x.id !== id);
}

/** Troca o item de mesmo `id` por `novo`; se não existir, não muda nada. */
export function substituir<T extends ComId>(lista: T[], novo: T): T[] {
  return lista.map((x) => (x.id === novo.id ? novo : x));
}

/** Localiza o item e a posição, ou null. */
export function localizar<T extends ComId>(
  lista: T[],
  id: string,
): Removido<T> | null {
  const indice = lista.findIndex((x) => x.id === id);
  return indice < 0 ? null : { item: lista[indice], indice };
}

/**
 * Reinsere na posição original (limitada ao tamanho atual da lista). Se o
 * item já estiver na lista — retry após um desfazer, por exemplo —, não
 * duplica.
 */
export function reinserir<T extends ComId>(
  lista: T[],
  removido: Removido<T>,
): T[] {
  if (lista.some((x) => x.id === removido.item.id)) return lista;
  const indice = Math.min(removido.indice, lista.length);
  return [...lista.slice(0, indice), removido.item, ...lista.slice(indice)];
}

/** Reinsere vários, em ordem crescente de posição, para os índices baterem. */
export function reinserirVarios<T extends ComId>(
  lista: T[],
  removidos: Removido<T>[],
): T[] {
  return [...removidos]
    .sort((a, b) => a.indice - b.indice)
    .reduce((acc, r) => reinserir(acc, r), lista);
}

/** Todos os itens que satisfazem `criterio`, com as posições. */
export function localizarTodos<T extends ComId>(
  lista: T[],
  criterio: (x: T) => boolean,
): Removido<T>[] {
  const achados: Removido<T>[] = [];
  lista.forEach((item, indice) => {
    if (criterio(item)) achados.push({ item, indice });
  });
  return achados;
}

/** Acrescenta no fim, sem duplicar por `id` (idempotente para o retry). */
export function acrescentar<T extends ComId>(lista: T[], novo: T): T[] {
  return lista.some((x) => x.id === novo.id) ? lista : [...lista, novo];
}

/** Ordena por `ordem` crescente. `sort` é estável, então empates mantêm a ordem. */
export function porOrdem<T extends { ordem: number }>(lista: T[]): T[] {
  return [...lista].sort((a, b) => a.ordem - b.ordem);
}
