/**
 * Aviso de possível duplicidade ao salvar um lançamento.
 *
 * É AVISO, não regra: duplicatas legítimas existem (duas compras iguais no
 * mesmo mês), por isso não há constraint no banco e a pessoa pode salvar
 * mesmo assim. Verificação em memória, sobre o store — sem consulta nova.
 *
 * Colide quem tem a mesma descrição (normalizada: sem acento, sem caixa,
 * espaços colapsados), o mesmo valor e a mesma competência. Cancelados não
 * contam; ao editar, o próprio lançamento é ignorado.
 */
import type { Lancamento } from "./typesGastos";
import { chaveDescricao } from "./sugestoesGastos";

export interface CandidatoLancamento {
  descricao: string;
  valor: number;
  competencia: string;
}

/** Máximo de colisões mostradas no diálogo; o resto vira "e mais N". */
export const MAX_COLISOES_EXIBIDAS = 3;

export function encontrarDuplicatas(
  lancamentos: Lancamento[],
  candidato: CandidatoLancamento,
  ignorarId?: string | null,
): Lancamento[] {
  const k = chaveDescricao(candidato.descricao);
  if (!k) return [];
  return lancamentos.filter(
    (l) =>
      l.id !== ignorarId &&
      l.status !== "cancelado" &&
      l.valor === candidato.valor &&
      l.competencia === candidato.competencia &&
      chaveDescricao(l.descricao) === k,
  );
}
