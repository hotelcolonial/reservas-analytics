import { create } from "zustand";
import type {
  Cartao,
  Natureza,
  DespesaRecorrente,
  Lancamento,
} from "./typesGastos";
import { supabaseConfigured, getSupabase, fetchAll } from "./supabase";
import { apagarComprovante } from "./storageGastos";
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
 * O padrão de escrita é o mesmo do outro store, e é otimista: primeiro o
 * estado local, depois a chamada ao Supabase sem `await`, e um `console.error`
 * se falhar. Não há rollback nem toast.
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
    set((s) => ({ cartoes: [...s.cartoes, novo] }));
    if (supabaseConfigured) {
      db()
        .from("cartoes")
        .insert(cartaoToRow(novo))
        .then(({ error }) => {
          if (error) console.error("Supabase insert cartao:", error.message);
        });
    }
  },

  updateCartao: (id, data) => {
    set((s) => ({
      cartoes: s.cartoes.map((c) => (c.id === id ? { ...c, ...data } : c)),
    }));
    if (supabaseConfigured) {
      const updated = get().cartoes.find((c) => c.id === id);
      if (updated) {
        db()
          .from("cartoes")
          .update(cartaoToRow(updated))
          .eq("id", id)
          .then(({ error }) => {
            if (error) console.error("Supabase update cartao:", error.message);
          });
      }
    }
  },

  removeCartao: (id) => {
    set((s) => ({
      cartoes: s.cartoes.filter((c) => c.id !== id),
      // Espelha o ON DELETE SET NULL do schema.
      lancamentos: s.lancamentos.map((l) =>
        l.cartaoId === id ? { ...l, cartaoId: null } : l,
      ),
      despesasRecorrentes: s.despesasRecorrentes.map((d) =>
        d.cartaoId === id ? { ...d, cartaoId: null } : d,
      ),
    }));
    if (supabaseConfigured) {
      db()
        .from("cartoes")
        .delete()
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.error("Supabase delete cartao:", error.message);
        });
    }
  },

  // ── Naturezas ─────────────────────────────────────────────────────────────

  addNatureza: (data) => {
    const nova: Natureza = { ...data, id: novoId() };
    set((s) => ({ naturezas: [...s.naturezas, nova] }));
    if (supabaseConfigured) {
      db()
        .from("naturezas")
        .insert(naturezaToRow(nova))
        .then(({ error }) => {
          if (error) console.error("Supabase insert natureza:", error.message);
        });
    }
  },

  updateNatureza: (id, data) => {
    set((s) => ({
      naturezas: s.naturezas.map((n) => (n.id === id ? { ...n, ...data } : n)),
    }));
    if (supabaseConfigured) {
      const updated = get().naturezas.find((n) => n.id === id);
      if (updated) {
        db()
          .from("naturezas")
          .update(naturezaToRow(updated))
          .eq("id", id)
          .then(({ error }) => {
            if (error) console.error("Supabase update natureza:", error.message);
          });
      }
    }
  },

  removeNatureza: (id) => {
    set((s) => ({
      naturezas: s.naturezas.filter((n) => n.id !== id),
      // Espelha o ON DELETE SET NULL do schema (o mapper devolve "" para null).
      lancamentos: s.lancamentos.map((l) =>
        l.naturezaId === id ? { ...l, naturezaId: "" } : l,
      ),
      despesasRecorrentes: s.despesasRecorrentes.map((d) =>
        d.naturezaId === id ? { ...d, naturezaId: "" } : d,
      ),
    }));
    if (supabaseConfigured) {
      db()
        .from("naturezas")
        .delete()
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.error("Supabase delete natureza:", error.message);
        });
    }
  },

  // ── Despesas recorrentes ──────────────────────────────────────────────────

  addDespesaRecorrente: (data) => {
    const nova: DespesaRecorrente = { ...data, id: novoId() };
    set((s) => ({ despesasRecorrentes: [...s.despesasRecorrentes, nova] }));
    if (supabaseConfigured) {
      db()
        .from("despesas_recorrentes")
        .insert(despesaRecorrenteToRow(nova))
        .then(({ error }) => {
          if (error)
            console.error("Supabase insert despesa_recorrente:", error.message);
        });
    }
  },

  updateDespesaRecorrente: (id, data) => {
    set((s) => ({
      despesasRecorrentes: s.despesasRecorrentes.map((d) =>
        d.id === id ? { ...d, ...data } : d,
      ),
    }));
    if (supabaseConfigured) {
      const updated = get().despesasRecorrentes.find((d) => d.id === id);
      if (updated) {
        db()
          .from("despesas_recorrentes")
          .update(despesaRecorrenteToRow(updated))
          .eq("id", id)
          .then(({ error }) => {
            if (error)
              console.error(
                "Supabase update despesa_recorrente:",
                error.message,
              );
          });
      }
    }
  },

  removeDespesaRecorrente: (id) => {
    set((s) => ({
      despesasRecorrentes: s.despesasRecorrentes.filter((d) => d.id !== id),
      // Espelha o ON DELETE SET NULL: os lançamentos gerados viram avulsos.
      lancamentos: s.lancamentos.map((l) =>
        l.despesaRecorrenteId === id ? { ...l, despesaRecorrenteId: null } : l,
      ),
    }));
    if (supabaseConfigured) {
      db()
        .from("despesas_recorrentes")
        .delete()
        .eq("id", id)
        .then(({ error }) => {
          if (error)
            console.error("Supabase delete despesa_recorrente:", error.message);
        });
    }
  },

  // ── Lançamentos ───────────────────────────────────────────────────────────

  addLancamento: (data) => {
    const novo: Lancamento = {
      ...data,
      id: data.id ?? novoId(),
      criadoEm: hojeISO(),
    };
    set((s) => ({ lancamentos: [...s.lancamentos, novo] }));
    if (supabaseConfigured) {
      db()
        .from("lancamentos")
        .insert(lancamentoToRow(novo))
        .then(({ error }) => {
          if (error) console.error("Supabase insert lancamento:", error.message);
        });
    }
  },

  updateLancamento: (id, data) => {
    set((s) => ({
      lancamentos: s.lancamentos.map((l) =>
        l.id === id ? { ...l, ...data } : l,
      ),
    }));
    if (supabaseConfigured) {
      const updated = get().lancamentos.find((l) => l.id === id);
      if (updated) {
        db()
          .from("lancamentos")
          .update(lancamentoToRow(updated))
          .eq("id", id)
          .then(({ error }) => {
            if (error)
              console.error("Supabase update lancamento:", error.message);
          });
      }
    }
  },

  removeLancamento: (id) => {
    // Apaga também o comprovante, para não deixar arquivo órfão no bucket.
    const comprovante =
      get().lancamentos.find((l) => l.id === id)?.comprovanteUrl ?? null;
    if (comprovante) void apagarComprovante(comprovante);

    set((s) => ({
      lancamentos: s.lancamentos.filter((l) => l.id !== id),
    }));
    if (supabaseConfigured) {
      db()
        .from("lancamentos")
        .delete()
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.error("Supabase delete lancamento:", error.message);
        });
    }
  },
}));
