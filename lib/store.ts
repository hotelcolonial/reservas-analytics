import { create } from "zustand";
import type { Campanha, Reserva, GastoDiario, Propriedade } from "./types";
import {
  supabaseConfigured,
  getSupabase,
  fetchAll,
  rowToPropriedade,
  rowToCampanha,
  rowToReserva,
  rowToGasto,
  propriedadeToRow,
  campanhaToRow,
  reservaToRow,
  gastoToRow,
} from "./supabase";
import { campanhasMock, reservasMock, gastosMock } from "@/data/mockData";
import { escreverOtimista } from "./escritaOtimista";
import {
  acrescentar,
  localizar,
  localizarTodos,
  porOrdem,
  reinserir,
  reinserirVarios,
  semId,
  substituir,
} from "./listas";
import { formatDate } from "./utils";

/**
 * Toda escrita passa por `escreverOtimista` (ver lib/escritaOtimista.ts):
 * `aplicar` faz o `set()` na hora, `executar` grava no Supabase, e se a
 * gravação falhar `desfazer` devolve o store ao estado anterior e um toast
 * oferece "Tentar novamente". Os estados anterior/posterior são capturados
 * ANTES do `set()`, e `aplicar`/`desfazer` usam `set(fn)` com helpers
 * idempotentes de `lib/listas.ts`, para funcionarem também no retry.
 */

function novoId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function db() {
  return getSupabase();
}

/** Propriedade padrão para o modo mock (sem Supabase configurado). */
const PROPRIEDADES_MOCK: Propriedade[] = [
  { id: "colonial", nome: "Hotel Colonial", ordem: 1 },
  { id: "posada-cataratas", nome: "Posada Cataratas", ordem: 2 },
];

const STORAGE_PROP = "reservatrack:propriedade-ativa";

function lerPropriedadeSalva(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_PROP);
}

function salvarPropriedade(id: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_PROP, id);
  }
}

/** Escolhe a propriedade ativa: a salva (se ainda existir) ou a primeira. */
function escolherPropriedade(
  propriedades: Propriedade[],
  salva: string | null,
): string {
  if (salva && propriedades.some((p) => p.id === salva)) return salva;
  return [...propriedades].sort((a, b) => a.ordem - b.ordem)[0]?.id ?? "";
}

/** Recorta os dados completos para a propriedade ativa (o que as páginas leem). */
function escopar(
  campanhasAll: Campanha[],
  reservasAll: Reserva[],
  gastosAll: GastoDiario[],
  propId: string,
) {
  return {
    campanhas: campanhasAll.filter((c) => c.propriedadeId === propId),
    reservas: reservasAll.filter((r) => r.propriedadeId === propId),
    gastos: gastosAll.filter((g) => g.propriedadeId === propId),
  };
}

/**
 * Patch parcial das listas completas + o re-escopo obrigatório (ARQUITETURA.md
 * §5, trampa 1). Todo `set()` que mexa em `*All` passa por aqui.
 */
function comEscopo(
  st: Pick<
    AppState,
    "campanhasAll" | "reservasAll" | "gastosAll" | "propriedadeAtivaId"
  >,
  parcial: Partial<Pick<AppState, "campanhasAll" | "reservasAll" | "gastosAll">>,
) {
  const campanhasAll = parcial.campanhasAll ?? st.campanhasAll;
  const reservasAll = parcial.reservasAll ?? st.reservasAll;
  const gastosAll = parcial.gastosAll ?? st.gastosAll;
  return {
    campanhasAll,
    reservasAll,
    gastosAll,
    ...escopar(campanhasAll, reservasAll, gastosAll, st.propriedadeAtivaId),
  };
}

interface AppState {
  // Dados completos (todas as propriedades).
  campanhasAll: Campanha[];
  reservasAll: Reserva[];
  gastosAll: GastoDiario[];

  // Dados no escopo da propriedade ativa — o que as páginas leem.
  campanhas: Campanha[];
  reservas: Reserva[];
  gastos: GastoDiario[];

  // Propriedades (multipropriedade).
  propriedades: Propriedade[];
  propriedadeAtivaId: string;

  hydrated: boolean;

  loadData: () => Promise<void>;
  setPropriedadeAtiva: (id: string) => void;

  // Propriedades
  addPropriedade: (data: Omit<Propriedade, "id">) => void;
  updatePropriedade: (id: string, data: Partial<Omit<Propriedade, "id">>) => void;
  removePropriedade: (id: string) => void;

  // Campanhas
  addCampanha: (data: Omit<Campanha, "id" | "propriedadeId">) => void;
  updateCampanha: (
    id: string,
    data: Partial<Omit<Campanha, "id" | "propriedadeId">>,
  ) => void;
  removeCampanha: (id: string) => void;
  toggleCampanhaStatus: (id: string) => void;
  setCampanhasOrdem: (orderedIds: string[]) => void;

  // Reservas
  addReserva: (data: Omit<Reserva, "id" | "propriedadeId">) => void;
  updateReserva: (
    id: string,
    data: Partial<Omit<Reserva, "id" | "propriedadeId">>,
  ) => void;
  removeReserva: (id: string) => void;

  // Gastos diários (verba)
  addGasto: (data: Omit<GastoDiario, "id" | "propriedadeId">) => void;
  updateGasto: (
    id: string,
    data: Partial<Omit<GastoDiario, "id" | "propriedadeId">>,
  ) => void;
  removeGasto: (id: string) => void;
}

export const useStore = create<AppState>()((set, get) => ({
  campanhasAll: [],
  reservasAll: [],
  gastosAll: [],
  campanhas: [],
  reservas: [],
  gastos: [],
  propriedades: [],
  propriedadeAtivaId: "",
  hydrated: false,

  // ── Load ──────────────────────────────────────────────────────────────────

  loadData: async () => {
    if (!supabaseConfigured) {
      const propriedades = PROPRIEDADES_MOCK;
      const ativo = escolherPropriedade(propriedades, lerPropriedadeSalva());
      const campanhasAll = campanhasMock.map((c) => ({
        ...c,
        propriedadeId: "colonial",
      }));
      const reservasAll = reservasMock.map((r) => ({
        ...r,
        propriedadeId: "colonial",
      }));
      const gastosAll = gastosMock.map((g) => ({
        ...g,
        propriedadeId: "colonial",
      }));
      set({
        propriedades,
        propriedadeAtivaId: ativo,
        campanhasAll,
        reservasAll,
        gastosAll,
        ...escopar(campanhasAll, reservasAll, gastosAll, ativo),
        hydrated: true,
      });
      return;
    }
    const [
      { data: propsData, error: e0 },
      { data: campanhasData, error: e1 },
      { data: reservasData, error: e2 },
      { data: gastosData, error: e3 },
    ] = await Promise.all([
      fetchAll("propriedades", "ordem"),
      fetchAll("campanhas", "created_at"),
      fetchAll("reservas", "created_at"),
      fetchAll("gastos", "data"),
    ]);
    if (e0) console.error("Supabase fetch propriedades:", e0);
    if (e1) console.error("Supabase fetch campanhas:", e1);
    if (e2) console.error("Supabase fetch reservas:", e2);
    if (e3) console.error("Supabase fetch gastos:", e3);

    const propriedades = (propsData?.map(rowToPropriedade) ?? []).sort(
      (a, b) => a.ordem - b.ordem,
    );
    const campanhasAll = campanhasData?.map(rowToCampanha) ?? [];
    const reservasAll = reservasData?.map(rowToReserva) ?? [];
    const gastosAll = gastosData?.map(rowToGasto) ?? [];
    const ativo = escolherPropriedade(propriedades, lerPropriedadeSalva());

    set({
      propriedades,
      propriedadeAtivaId: ativo,
      campanhasAll,
      reservasAll,
      gastosAll,
      ...escopar(campanhasAll, reservasAll, gastosAll, ativo),
      hydrated: true,
    });
  },

  setPropriedadeAtiva: (id) => {
    salvarPropriedade(id);
    set((s) => ({
      propriedadeAtivaId: id,
      ...escopar(s.campanhasAll, s.reservasAll, s.gastosAll, id),
    }));
  },

  // ── Propriedades ──────────────────────────────────────────────────────────

  addPropriedade: (data) => {
    const nova: Propriedade = { ...data, id: novoId() };
    escreverOtimista({
      acao: `salvar a propriedade "${nova.nome}"`,
      aplicar: () =>
        set((s) => ({
          propriedades: porOrdem(acrescentar(s.propriedades, nova)),
        })),
      desfazer: () =>
        set((s) => ({ propriedades: semId(s.propriedades, nova.id) })),
      executar: () => db().from("propriedades").insert(propriedadeToRow(nova)),
    });
  },

  updatePropriedade: (id, data) => {
    const anterior = get().propriedades.find((p) => p.id === id);
    if (!anterior) return;
    const atualizada: Propriedade = { ...anterior, ...data };
    escreverOtimista({
      acao: `atualizar a propriedade "${atualizada.nome}"`,
      aplicar: () =>
        set((s) => ({
          propriedades: porOrdem(substituir(s.propriedades, atualizada)),
        })),
      // A lista já estava ordenada: devolver o objeto e reordenar restaura a
      // ordem original (sort é estável).
      desfazer: () =>
        set((s) => ({
          propriedades: porOrdem(substituir(s.propriedades, anterior)),
        })),
      executar: () =>
        db()
          .from("propriedades")
          .update(propriedadeToRow(atualizada))
          .eq("id", id),
    });
  },

  removePropriedade: (id) => {
    const s = get();
    // Proteção: não remove uma propriedade que ainda tem dados vinculados.
    const temDados =
      s.campanhasAll.some((c) => c.propriedadeId === id) ||
      s.reservasAll.some((r) => r.propriedadeId === id) ||
      s.gastosAll.some((g) => g.propriedadeId === id);
    if (temDados) return;

    const removida = localizar(s.propriedades, id);
    if (!removida) return;
    // A propriedade ativa pode mudar junto; o desfazer devolve as duas coisas.
    const ativaAnterior = s.propriedadeAtivaId;

    escreverOtimista({
      acao: `excluir a propriedade "${removida.item.nome}"`,
      aplicar: () =>
        set((st) => {
          const propriedades = semId(st.propriedades, id);
          const novaAtiva =
            st.propriedadeAtivaId === id
              ? (propriedades[0]?.id ?? "")
              : st.propriedadeAtivaId;
          if (novaAtiva !== st.propriedadeAtivaId) salvarPropriedade(novaAtiva);
          return {
            propriedades,
            propriedadeAtivaId: novaAtiva,
            ...escopar(st.campanhasAll, st.reservasAll, st.gastosAll, novaAtiva),
          };
        }),
      desfazer: () =>
        set((st) => {
          if (st.propriedadeAtivaId !== ativaAnterior) {
            salvarPropriedade(ativaAnterior);
          }
          return {
            propriedades: reinserir(st.propriedades, removida),
            propriedadeAtivaId: ativaAnterior,
            ...escopar(
              st.campanhasAll,
              st.reservasAll,
              st.gastosAll,
              ativaAnterior,
            ),
          };
        }),
      executar: () => db().from("propriedades").delete().eq("id", id),
    });
  },

  // ── Campanhas ─────────────────────────────────────────────────────────────

  addCampanha: (data) => {
    const s = get();
    const propId = s.propriedadeAtivaId;
    const proximaOrdem =
      s.campanhasAll
        .filter((c) => c.propriedadeId === propId)
        .reduce((max, c) => Math.max(max, c.ordem ?? 0), 0) + 1;
    const nova: Campanha = {
      ...data,
      propriedadeId: propId,
      ordem: proximaOrdem,
      id: novoId(),
    };
    escreverOtimista({
      acao: `salvar a campanha "${nova.nome}"`,
      aplicar: () =>
        set((st) =>
          comEscopo(st, { campanhasAll: acrescentar(st.campanhasAll, nova) }),
        ),
      desfazer: () =>
        set((st) =>
          comEscopo(st, { campanhasAll: semId(st.campanhasAll, nova.id) }),
        ),
      executar: () => db().from("campanhas").insert(campanhaToRow(nova)),
    });
  },

  updateCampanha: (id, data) => {
    const anterior = get().campanhasAll.find((c) => c.id === id);
    if (!anterior) return;
    const atualizada: Campanha = { ...anterior, ...data };
    escreverOtimista({
      acao: `atualizar a campanha "${atualizada.nome}"`,
      aplicar: () =>
        set((st) =>
          comEscopo(st, {
            campanhasAll: substituir(st.campanhasAll, atualizada),
          }),
        ),
      desfazer: () =>
        set((st) =>
          comEscopo(st, { campanhasAll: substituir(st.campanhasAll, anterior) }),
        ),
      executar: () =>
        db().from("campanhas").update(campanhaToRow(atualizada)).eq("id", id),
    });
  },

  removeCampanha: (id) => {
    const s = get();
    const removida = localizar(s.campanhasAll, id);
    if (!removida) return;
    // Efeitos locais que espelham o banco e precisam ser desfeitos junto:
    // reservas perdem o vínculo (ON DELETE SET NULL) e gastos somem (CASCADE).
    const reservasDesvinculadas = new Set(
      s.reservasAll.filter((r) => r.campanhaId === id).map((r) => r.id),
    );
    const gastosRemovidos = localizarTodos(
      s.gastosAll,
      (g) => g.campanhaId === id,
    );

    escreverOtimista({
      acao: `excluir a campanha "${removida.item.nome}"`,
      aplicar: () =>
        set((st) =>
          comEscopo(st, {
            campanhasAll: semId(st.campanhasAll, id),
            reservasAll: st.reservasAll.map((r) =>
              r.campanhaId === id ? { ...r, campanhaId: null } : r,
            ),
            gastosAll: st.gastosAll.filter((g) => g.campanhaId !== id),
          }),
        ),
      desfazer: () =>
        set((st) =>
          comEscopo(st, {
            campanhasAll: reinserir(st.campanhasAll, removida),
            reservasAll: st.reservasAll.map((r) =>
              reservasDesvinculadas.has(r.id) ? { ...r, campanhaId: id } : r,
            ),
            gastosAll: reinserirVarios(st.gastosAll, gastosRemovidos),
          }),
        ),
      executar: () => db().from("campanhas").delete().eq("id", id),
    });
  },

  toggleCampanhaStatus: (id) => {
    const anterior = get().campanhasAll.find((c) => c.id === id);
    if (!anterior) return;
    const atualizada: Campanha = {
      ...anterior,
      status: anterior.status === "ativa" ? "pausada" : "ativa",
    };
    const verbo = atualizada.status === "ativa" ? "reativar" : "pausar";
    escreverOtimista({
      acao: `${verbo} a campanha "${atualizada.nome}"`,
      aplicar: () =>
        set((st) =>
          comEscopo(st, {
            campanhasAll: substituir(st.campanhasAll, atualizada),
          }),
        ),
      desfazer: () =>
        set((st) =>
          comEscopo(st, { campanhasAll: substituir(st.campanhasAll, anterior) }),
        ),
      executar: () =>
        db()
          .from("campanhas")
          .update({ status: atualizada.status })
          .eq("id", id),
    });
  },

  setCampanhasOrdem: (orderedIds) => {
    const novasOrdens = new Map(orderedIds.map((id, i) => [id, i + 1]));
    const ordensAnteriores = new Map(
      get()
        .campanhasAll.filter((c) => novasOrdens.has(c.id))
        .map((c) => [c.id, c.ordem] as const),
    );
    const reordenar = (lista: Campanha[], ordens: Map<string, number>) =>
      lista.map((c) =>
        ordens.has(c.id) ? { ...c, ordem: ordens.get(c.id)! } : c,
      );

    escreverOtimista({
      acao: "reordenar as campanhas",
      aplicar: () =>
        set((st) =>
          comEscopo(st, {
            campanhasAll: reordenar(st.campanhasAll, novasOrdens),
          }),
        ),
      desfazer: () =>
        set((st) =>
          comEscopo(st, {
            campanhasAll: reordenar(st.campanhasAll, ordensAnteriores),
          }),
        ),
      // N updates em paralelo; o primeiro erro conta como falha do lote.
      executar: () =>
        Promise.all(
          orderedIds.map((id, i) =>
            db().from("campanhas").update({ ordem: i + 1 }).eq("id", id),
          ),
        ).then((resultados) => ({
          error: resultados.find((r) => r.error)?.error ?? null,
        })),
    });
  },

  // ── Reservas ──────────────────────────────────────────────────────────────

  addReserva: (data) => {
    const nova: Reserva = {
      ...data,
      propriedadeId: get().propriedadeAtivaId,
      id: novoId(),
    };
    escreverOtimista({
      acao: `salvar a reserva ${nova.codigo}`,
      aplicar: () =>
        set((st) =>
          comEscopo(st, { reservasAll: acrescentar(st.reservasAll, nova) }),
        ),
      desfazer: () =>
        set((st) =>
          comEscopo(st, { reservasAll: semId(st.reservasAll, nova.id) }),
        ),
      executar: () => db().from("reservas").insert(reservaToRow(nova)),
    });
  },

  updateReserva: (id, data) => {
    const anterior = get().reservasAll.find((r) => r.id === id);
    if (!anterior) return;
    const atualizada: Reserva = { ...anterior, ...data };
    escreverOtimista({
      acao: `atualizar a reserva ${atualizada.codigo}`,
      aplicar: () =>
        set((st) =>
          comEscopo(st, { reservasAll: substituir(st.reservasAll, atualizada) }),
        ),
      desfazer: () =>
        set((st) =>
          comEscopo(st, { reservasAll: substituir(st.reservasAll, anterior) }),
        ),
      executar: () =>
        db().from("reservas").update(reservaToRow(atualizada)).eq("id", id),
    });
  },

  removeReserva: (id) => {
    const removida = localizar(get().reservasAll, id);
    if (!removida) return;
    escreverOtimista({
      acao: `excluir a reserva ${removida.item.codigo}`,
      aplicar: () =>
        set((st) => comEscopo(st, { reservasAll: semId(st.reservasAll, id) })),
      desfazer: () =>
        set((st) =>
          comEscopo(st, { reservasAll: reinserir(st.reservasAll, removida) }),
        ),
      executar: () => db().from("reservas").delete().eq("id", id),
    });
  },

  // ── Gastos diários ────────────────────────────────────────────────────────

  addGasto: (data) => {
    const novo: GastoDiario = {
      ...data,
      propriedadeId: get().propriedadeAtivaId,
      id: novoId(),
    };
    escreverOtimista({
      acao: `salvar a verba de ${formatDate(novo.data)}`,
      aplicar: () =>
        set((st) =>
          comEscopo(st, { gastosAll: acrescentar(st.gastosAll, novo) }),
        ),
      desfazer: () =>
        set((st) => comEscopo(st, { gastosAll: semId(st.gastosAll, novo.id) })),
      executar: () => db().from("gastos").insert(gastoToRow(novo)),
    });
  },

  updateGasto: (id, data) => {
    const anterior = get().gastosAll.find((g) => g.id === id);
    if (!anterior) return;
    const atualizado: GastoDiario = { ...anterior, ...data };
    escreverOtimista({
      acao: `atualizar a verba de ${formatDate(atualizado.data)}`,
      aplicar: () =>
        set((st) =>
          comEscopo(st, { gastosAll: substituir(st.gastosAll, atualizado) }),
        ),
      desfazer: () =>
        set((st) =>
          comEscopo(st, { gastosAll: substituir(st.gastosAll, anterior) }),
        ),
      executar: () =>
        db().from("gastos").update(gastoToRow(atualizado)).eq("id", id),
    });
  },

  removeGasto: (id) => {
    const removido = localizar(get().gastosAll, id);
    if (!removido) return;
    escreverOtimista({
      acao: `excluir a verba de ${formatDate(removido.item.data)}`,
      aplicar: () =>
        set((st) => comEscopo(st, { gastosAll: semId(st.gastosAll, id) })),
      desfazer: () =>
        set((st) =>
          comEscopo(st, { gastosAll: reinserir(st.gastosAll, removido) }),
        ),
      executar: () => db().from("gastos").delete().eq("id", id),
    });
  },
}));
