import { create } from "zustand";
import type {
  Cartao,
  Natureza,
  DespesaRecorrente,
  Lancamento,
} from "./typesGastos";
import { supabaseConfigured, getSupabase, fetchAll } from "./supabase";
import { apagarComprovante } from "./storageGastos";
import { escreverOtimista } from "./escritaOtimista";
import {
  acrescentar,
  localizar,
  reinserir,
  semId,
  substituir,
} from "./listas";
import {
  rowToCartao,
  cartaoToRow,
  rowToNatureza,
  naturezaToRow,
  rowToDespesaRecorrente,
  despesaRecorrenteToRow,
  rowToLancamento,
  lancamentoToRow,
} from "./supabaseGastos";
import {
  cartoesMock,
  naturezasMock,
  despesasRecorrentesMock,
  lancamentosMock,
} from "@/data/mockDataGastos";

/**
 * Store do módulo Gastos — GrowthDirect.
 *
 * Separado de `lib/store.ts` de propósito: os dois módulos carregam sozinhos
 * e nenhum espera pelo outro.
 *
 * Diferença central em relação ao store de reservas: aqui NÃO existe escopo de
 * propriedade. As listas são planas, sem `escopar()` e sem estado duplicado.
 *
 * O padrão de escrita é o mesmo do outro store: otimista via
 * `escreverOtimista` (lib/escritaOtimista.ts) — `aplicar` faz o `set()` na
 * hora, `executar` grava no Supabase, e se falhar `desfazer` devolve o store
 * ao estado anterior e um toast oferece "Tentar novamente".
 */

/**
 * Id gerado no cliente. Exportado porque o formulário de lançamento precisa
 * dele ANTES de salvar: o caminho do comprovante no Storage inclui o id.
 */
export function novoId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function db() {
  return getSupabase();
}

/** Data de hoje em ISO local, para carimbar `criadoEm`. */
function hojeISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${dia}`;
}

interface GastosState {
  cartoes: Cartao[];
  naturezas: Natureza[];
  despesasRecorrentes: DespesaRecorrente[];
  lancamentos: Lancamento[];

  hydrated: boolean;
  loading: boolean;

  /**
   * Sinal de UI (não é dado): o botão "Novo Lançamento" do header liga isto,
   * e a página `/gastos/lancamentos` abre o Sheet e desliga. Serve para o
   * botão funcionar mesmo a partir de outra rota do módulo.
   */
  novoLancamentoPedido: boolean;
  pedirNovoLancamento: () => void;
  consumirNovoLancamento: () => void;

  loadGastos: () => Promise<void>;

  // Cartões
  addCartao: (data: Omit<Cartao, "id">) => void;
  updateCartao: (id: string, data: Partial<Omit<Cartao, "id">>) => void;
  removeCartao: (id: string) => void;

  // Naturezas
  addNatureza: (data: Omit<Natureza, "id">) => void;
  updateNatureza: (id: string, data: Partial<Omit<Natureza, "id">>) => void;
  removeNatureza: (id: string) => void;

  // Despesas recorrentes
  addDespesaRecorrente: (data: Omit<DespesaRecorrente, "id">) => void;
  updateDespesaRecorrente: (
    id: string,
    data: Partial<Omit<DespesaRecorrente, "id">>,
  ) => void;
  removeDespesaRecorrente: (id: string) => void;

  // Lançamentos
  /**
   * `id` é opcional: quem anexa comprovante precisa gerá-lo antes (o caminho
   * no Storage inclui o id). Sem ele, o store gera um.
   */
  addLancamento: (
    data: Omit<Lancamento, "id" | "criadoEm"> & { id?: string },
  ) => void;
  updateLancamento: (
    id: string,
    data: Partial<Omit<Lancamento, "id" | "criadoEm">>,
  ) => void;
  removeLancamento: (id: string) => void;
}

export const useGastosStore = create<GastosState>()((set, get) => ({
  cartoes: [],
  naturezas: [],
  despesasRecorrentes: [],
  lancamentos: [],
  hydrated: false,
  loading: false,
  novoLancamentoPedido: false,

  pedirNovoLancamento: () => set({ novoLancamentoPedido: true }),
  consumirNovoLancamento: () => set({ novoLancamentoPedido: false }),

  // ── Load ──────────────────────────────────────────────────────────────────

  loadGastos: async () => {
    if (get().loading) return;
    set({ loading: true });

    if (!supabaseConfigured) {
      set({
        cartoes: cartoesMock,
        naturezas: naturezasMock,
        despesasRecorrentes: despesasRecorrentesMock,
        lancamentos: lancamentosMock,
        hydrated: true,
        loading: false,
      });
      return;
    }

    const [
      { data: cartoesData, error: e0 },
      { data: naturezasData, error: e1 },
      { data: recorrentesData, error: e2 },
      { data: lancamentosData, error: e3 },
    ] = await Promise.all([
      fetchAll("cartoes", "ordem"),
      fetchAll("naturezas", "ordem"),
      fetchAll("despesas_recorrentes", "created_at"),
      fetchAll("lancamentos", "data_vencimento"),
    ]);
    if (e0) console.error("Supabase fetch cartoes:", e0);
    if (e1) console.error("Supabase fetch naturezas:", e1);
    if (e2) console.error("Supabase fetch despesas_recorrentes:", e2);
    if (e3) console.error("Supabase fetch lancamentos:", e3);

    set({
      cartoes: cartoesData?.map(rowToCartao) ?? [],
      naturezas: naturezasData?.map(rowToNatureza) ?? [],
      despesasRecorrentes: recorrentesData?.map(rowToDespesaRecorrente) ?? [],
      lancamentos: lancamentosData?.map(rowToLancamento) ?? [],
      hydrated: true,
      loading: false,
    });
  },

  // ── Cartões ───────────────────────────────────────────────────────────────

  addCartao: (data) => {
    const novo: Cartao = { ...data, id: novoId() };
    escreverOtimista({
      acao: `salvar o cartão "${novo.nome}"`,
      aplicar: () => set((s) => ({ cartoes: acrescentar(s.cartoes, novo) })),
      desfazer: () => set((s) => ({ cartoes: semId(s.cartoes, novo.id) })),
      executar: () => db().from("cartoes").insert(cartaoToRow(novo)),
    });
  },

  updateCartao: (id, data) => {
    const anterior = get().cartoes.find((c) => c.id === id);
    if (!anterior) return;
    const atualizado: Cartao = { ...anterior, ...data };
    escreverOtimista({
      acao: `atualizar o cartão "${atualizado.nome}"`,
      aplicar: () =>
        set((s) => ({ cartoes: substituir(s.cartoes, atualizado) })),
      desfazer: () => set((s) => ({ cartoes: substituir(s.cartoes, anterior) })),
      executar: () =>
        db().from("cartoes").update(cartaoToRow(atualizado)).eq("id", id),
    });
  },

  removeCartao: (id) => {
    const s = get();
    const removido = localizar(s.cartoes, id);
    if (!removido) return;
    // Espelha o ON DELETE SET NULL do schema — e guarda quem foi afetado para
    // devolver o vínculo se a exclusão falhar.
    const lancamentosAfetados = new Set(
      s.lancamentos.filter((l) => l.cartaoId === id).map((l) => l.id),
    );
    const recorrentesAfetadas = new Set(
      s.despesasRecorrentes.filter((d) => d.cartaoId === id).map((d) => d.id),
    );

    escreverOtimista({
      acao: `excluir o cartão "${removido.item.nome}"`,
      aplicar: () =>
        set((st) => ({
          cartoes: semId(st.cartoes, id),
          lancamentos: st.lancamentos.map((l) =>
            l.cartaoId === id ? { ...l, cartaoId: null } : l,
          ),
          despesasRecorrentes: st.despesasRecorrentes.map((d) =>
            d.cartaoId === id ? { ...d, cartaoId: null } : d,
          ),
        })),
      desfazer: () =>
        set((st) => ({
          cartoes: reinserir(st.cartoes, removido),
          lancamentos: st.lancamentos.map((l) =>
            lancamentosAfetados.has(l.id) ? { ...l, cartaoId: id } : l,
          ),
          despesasRecorrentes: st.despesasRecorrentes.map((d) =>
            recorrentesAfetadas.has(d.id) ? { ...d, cartaoId: id } : d,
          ),
        })),
      executar: () => db().from("cartoes").delete().eq("id", id),
    });
  },

  // ── Naturezas ─────────────────────────────────────────────────────────────

  addNatureza: (data) => {
    const nova: Natureza = { ...data, id: novoId() };
    escreverOtimista({
      acao: `salvar a natureza "${nova.nome}"`,
      aplicar: () => set((s) => ({ naturezas: acrescentar(s.naturezas, nova) })),
      desfazer: () => set((s) => ({ naturezas: semId(s.naturezas, nova.id) })),
      executar: () => db().from("naturezas").insert(naturezaToRow(nova)),
    });
  },

  updateNatureza: (id, data) => {
    const anterior = get().naturezas.find((n) => n.id === id);
    if (!anterior) return;
    const atualizada: Natureza = { ...anterior, ...data };
    escreverOtimista({
      acao: `atualizar a natureza "${atualizada.nome}"`,
      aplicar: () =>
        set((s) => ({ naturezas: substituir(s.naturezas, atualizada) })),
      desfazer: () =>
        set((s) => ({ naturezas: substituir(s.naturezas, anterior) })),
      executar: () =>
        db().from("naturezas").update(naturezaToRow(atualizada)).eq("id", id),
    });
  },

  removeNatureza: (id) => {
    const s = get();
    const removida = localizar(s.naturezas, id);
    if (!removida) return;
    // Espelha o ON DELETE SET NULL (o mapper devolve "" para null).
    const lancamentosAfetados = new Set(
      s.lancamentos.filter((l) => l.naturezaId === id).map((l) => l.id),
    );
    const recorrentesAfetadas = new Set(
      s.despesasRecorrentes
        .filter((d) => d.naturezaId === id)
        .map((d) => d.id),
    );

    escreverOtimista({
      acao: `excluir a natureza "${removida.item.nome}"`,
      aplicar: () =>
        set((st) => ({
          naturezas: semId(st.naturezas, id),
          lancamentos: st.lancamentos.map((l) =>
            l.naturezaId === id ? { ...l, naturezaId: "" } : l,
          ),
          despesasRecorrentes: st.despesasRecorrentes.map((d) =>
            d.naturezaId === id ? { ...d, naturezaId: "" } : d,
          ),
        })),
      desfazer: () =>
        set((st) => ({
          naturezas: reinserir(st.naturezas, removida),
          lancamentos: st.lancamentos.map((l) =>
            lancamentosAfetados.has(l.id) ? { ...l, naturezaId: id } : l,
          ),
          despesasRecorrentes: st.despesasRecorrentes.map((d) =>
            recorrentesAfetadas.has(d.id) ? { ...d, naturezaId: id } : d,
          ),
        })),
      executar: () => db().from("naturezas").delete().eq("id", id),
    });
  },

  // ── Despesas recorrentes ──────────────────────────────────────────────────

  addDespesaRecorrente: (data) => {
    const nova: DespesaRecorrente = { ...data, id: novoId() };
    escreverOtimista({
      acao: `salvar a recorrente "${nova.nome}"`,
      aplicar: () =>
        set((s) => ({
          despesasRecorrentes: acrescentar(s.despesasRecorrentes, nova),
        })),
      desfazer: () =>
        set((s) => ({
          despesasRecorrentes: semId(s.despesasRecorrentes, nova.id),
        })),
      executar: () =>
        db().from("despesas_recorrentes").insert(despesaRecorrenteToRow(nova)),
    });
  },

  updateDespesaRecorrente: (id, data) => {
    const anterior = get().despesasRecorrentes.find((d) => d.id === id);
    if (!anterior) return;
    const atualizada: DespesaRecorrente = { ...anterior, ...data };
    escreverOtimista({
      acao: `atualizar a recorrente "${atualizada.nome}"`,
      aplicar: () =>
        set((s) => ({
          despesasRecorrentes: substituir(s.despesasRecorrentes, atualizada),
        })),
      desfazer: () =>
        set((s) => ({
          despesasRecorrentes: substituir(s.despesasRecorrentes, anterior),
        })),
      executar: () =>
        db()
          .from("despesas_recorrentes")
          .update(despesaRecorrenteToRow(atualizada))
          .eq("id", id),
    });
  },

  removeDespesaRecorrente: (id) => {
    const s = get();
    const removida = localizar(s.despesasRecorrentes, id);
    if (!removida) return;
    // Espelha o ON DELETE SET NULL: os lançamentos gerados viram avulsos.
    const lancamentosAfetados = new Set(
      s.lancamentos
        .filter((l) => l.despesaRecorrenteId === id)
        .map((l) => l.id),
    );

    escreverOtimista({
      acao: `excluir a recorrente "${removida.item.nome}"`,
      aplicar: () =>
        set((st) => ({
          despesasRecorrentes: semId(st.despesasRecorrentes, id),
          lancamentos: st.lancamentos.map((l) =>
            l.despesaRecorrenteId === id
              ? { ...l, despesaRecorrenteId: null }
              : l,
          ),
        })),
      desfazer: () =>
        set((st) => ({
          despesasRecorrentes: reinserir(st.despesasRecorrentes, removida),
          lancamentos: st.lancamentos.map((l) =>
            lancamentosAfetados.has(l.id)
              ? { ...l, despesaRecorrenteId: id }
              : l,
          ),
        })),
      executar: () => db().from("despesas_recorrentes").delete().eq("id", id),
    });
  },

  // ── Lançamentos ───────────────────────────────────────────────────────────

  addLancamento: (data) => {
    const novo: Lancamento = {
      ...data,
      id: data.id ?? novoId(),
      criadoEm: hojeISO(),
    };
    escreverOtimista({
      acao: `salvar o lançamento "${novo.descricao}"`,
      aplicar: () =>
        set((s) => ({ lancamentos: acrescentar(s.lancamentos, novo) })),
      desfazer: () =>
        set((s) => ({ lancamentos: semId(s.lancamentos, novo.id) })),
      executar: () => db().from("lancamentos").insert(lancamentoToRow(novo)),
    });
  },

  updateLancamento: (id, data) => {
    const anterior = get().lancamentos.find((l) => l.id === id);
    if (!anterior) return;
    const atualizado: Lancamento = { ...anterior, ...data };
    escreverOtimista({
      acao: `atualizar o lançamento "${atualizado.descricao}"`,
      aplicar: () =>
        set((s) => ({ lancamentos: substituir(s.lancamentos, atualizado) })),
      desfazer: () =>
        set((s) => ({ lancamentos: substituir(s.lancamentos, anterior) })),
      executar: () =>
        db()
          .from("lancamentos")
          .update(lancamentoToRow(atualizado))
          .eq("id", id),
    });
  },

  removeLancamento: (id) => {
    const removido = localizar(get().lancamentos, id);
    if (!removido) return;
    const comprovante = removido.item.comprovanteUrl;

    escreverOtimista({
      acao: `excluir o lançamento "${removido.item.descricao}"`,
      aplicar: () =>
        set((s) => ({ lancamentos: semId(s.lancamentos, id) })),
      desfazer: () =>
        set((s) => ({ lancamentos: reinserir(s.lancamentos, removido) })),
      executar: () => db().from("lancamentos").delete().eq("id", id),
      // O arquivo só some DEPOIS que o banco confirmou: se a exclusão falhar
      // e o lançamento voltar, ele não pode voltar com o comprovante quebrado.
      aoConfirmar: () => {
        if (comprovante) void apagarComprovante(comprovante);
      },
    });
  },
}));
