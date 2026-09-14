/**
 * Escrita otimista com rollback e "tentar novamente".
 *
 * Mantém o padrão do app (ARQUITETURA.md §5): a UI responde na hora, a query
 * vai depois. O que muda é o que acontece quando a query falha — antes era só
 * um `console.error` e a tela ficava mentindo; agora:
 *
 *   1. `desfazer()` devolve o store ao estado anterior;
 *   2. um toast de erro PERSISTENTE explica o que não foi salvo;
 *   3. "Tentar novamente" roda a query de novo e, só se ela passar,
 *      `aplicar()` reaplica a mudança no store (o retry não é otimista: a
 *      pessoa já viu a tela voltar atrás, não faz sentido enganar duas vezes).
 *
 * Em modo mock (sem Supabase) só aplica: não há o que gravar.
 */
import { toast } from "sonner";
import { supabaseConfigured } from "./supabase";

/** Forma mínima do que os builders do Supabase resolvem: `{ error }`. */
export interface ResultadoSupabase {
  error: { message: string } | null;
}

export interface EscritaOtimista {
  /**
   * O que se tentou fazer, no infinitivo e em pt-BR, para o toast:
   * `salvar a reserva RES-0001`, `excluir o cartão "Nubank PJ"`.
   */
  acao: string;
  /** Aplica a mudança no store (o `set()` otimista). Reusado no retry. */
  aplicar: () => void;
  /** Devolve o store EXATAMENTE ao estado anterior à mudança. */
  desfazer: () => void;
  /** A query. Os builders do Supabase são thenables e servem direto. */
  executar: () => PromiseLike<ResultadoSupabase>;
  /**
   * Roda só depois que o servidor confirmou (na primeira vez ou no retry).
   * Para efeitos que não podem ser desfeitos, como apagar um arquivo.
   */
  aoConfirmar?: () => void;
}

/** Normaliza rejeição e `{ error }` numa mensagem, ou null se deu certo. */
async function rodar(
  executar: () => PromiseLike<ResultadoSupabase>,
): Promise<string | null> {
  try {
    const { error } = await executar();
    return error ? error.message : null;
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
}

const DESCRICAO_ERRO =
  "A alteração foi desfeita na tela. Verifique a conexão e tente de novo.";

export function escreverOtimista(op: EscritaOtimista): void {
  const { acao, aplicar, desfazer, executar, aoConfirmar } = op;

  aplicar();
  if (!supabaseConfigured) return;

  void rodar(executar).then((erro) => {
    if (erro === null) {
      aoConfirmar?.();
      return;
    }
    console.error(`Supabase ${acao}:`, erro);
    desfazer();
    mostrarErro();
  });

  function mostrarErro(id?: string | number) {
    toast.error(`Não foi possível ${acao}.`, {
      id,
      description: DESCRICAO_ERRO,
      duration: Infinity,
      action: { label: "Tentar novamente", onClick: () => void tentarDeNovo() },
    });
  }

  async function tentarDeNovo() {
    const id = toast.loading(`Tentando ${acao} de novo…`);
    const erro = await rodar(executar);
    if (erro !== null) {
      console.error(`Supabase ${acao} (retry):`, erro);
      mostrarErro(id);
      return;
    }
    aplicar();
    aoConfirmar?.();
    toast.success(`Pronto: ${acao}.`, { id, duration: 4000 });
  }
}
