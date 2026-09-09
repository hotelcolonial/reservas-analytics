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

  resetarDadosExemplo: () => Promise<void>;
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
    set((s) => ({
      propriedades: [...s.propriedades, nova].sort((a, b) => a.ordem - b.ordem),
    }));
    if (supabaseConfigured) {
      db()
        .from("propriedades")
        .insert(propriedadeToRow(nova))
        .then(({ error }) => {
          if (error) console.error("Supabase insert propriedade:", error.message);
        });
    }
  },

  updatePropriedade: (id, data) => {
    set((s) => ({
      propriedades: s.propriedades
        .map((p) => (p.id === id ? { ...p, ...data } : p))
        .sort((a, b) => a.ordem - b.ordem),
    }));
    if (supabaseConfigured) {
      const updated = get().propriedades.find((p) => p.id === id);
      if (updated) {
        db()
          .from("propriedades")
          .update(propriedadeToRow(updated))
          .eq("id", id)
          .then(({ error }) => {
            if (error)
              console.error("Supabase update propriedade:", error.message);
          });
      }
    }
  },

  removePropriedade: (id) => {
    const s = get();
    // Proteção: não remove uma propriedade que ainda tem dados vinculados.
    const temDados =
      s.campanhasAll.some((c) => c.propriedadeId === id) ||
      s.reservasAll.some((r) => r.propriedadeId === id) ||
      s.gastosAll.some((g) => g.propriedadeId === id);
    if (temDados) return;

    set((st) => {
      const propriedades = st.propriedades.filter((p) => p.id !== id);
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
    });
    if (supabaseConfigured) {
      db()
        .from("propriedades")
        .delete()
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.error("Supabase delete propriedade:", error.message);
        });
    }
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
    set((st) => {
      const campanhasAll = [...st.campanhasAll, nova];
      return {
        campanhasAll,
        ...escopar(campanhasAll, st.reservasAll, st.gastosAll, st.propriedadeAtivaId),
      };
    });
    if (supabaseConfigured) {
      db()
        .from("campanhas")
        .insert(campanhaToRow(nova))
        .then(({ error }) => {
          if (error) console.error("Supabase insert campanha:", error.message);
        });
    }
  },

  updateCampanha: (id, data) => {
    set((s) => {
      const campanhasAll = s.campanhasAll.map((c) =>
        c.id === id ? { ...c, ...data } : c,
      );
      return {
        campanhasAll,
        ...escopar(campanhasAll, s.reservasAll, s.gastosAll, s.propriedadeAtivaId),
      };
    });
    if (supabaseConfigured) {
      const updated = get().campanhasAll.find((c) => c.id === id);
      if (updated) {
        db()
          .from("campanhas")
          .update(campanhaToRow(updated))
          .eq("id", id)
          .then(({ error }) => {
            if (error) console.error("Supabase update campanha:", error.message);
          });
      }
    }
  },

  removeCampanha: (id) => {
    set((s) => {
      const campanhasAll = s.campanhasAll.filter((c) => c.id !== id);
      // Reservas linked to this campaign lose the link (mirrors ON DELETE SET NULL)
      const reservasAll = s.reservasAll.map((r) =>
        r.campanhaId === id ? { ...r, campanhaId: null } : r,
      );
      // Gastos dessa campanha são removidos (mirrors ON DELETE CASCADE)
      const gastosAll = s.gastosAll.filter((g) => g.campanhaId !== id);
      return {
        campanhasAll,
        reservasAll,
        gastosAll,
        ...escopar(campanhasAll, reservasAll, gastosAll, s.propriedadeAtivaId),
      };
    });
    if (supabaseConfigured) {
      db()
        .from("campanhas")
        .delete()
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.error("Supabase delete campanha:", error.message);
        });
    }
  },

  toggleCampanhaStatus: (id) => {
    set((s) => {
      const campanhasAll: Campanha[] = s.campanhasAll.map((c) =>
        c.id === id
          ? { ...c, status: c.status === "ativa" ? "pausada" : "ativa" }
          : c,
      );
      return {
        campanhasAll,
        ...escopar(campanhasAll, s.reservasAll, s.gastosAll, s.propriedadeAtivaId),
      };
    });
    if (supabaseConfigured) {
      const updated = get().campanhasAll.find((c) => c.id === id);
      if (updated) {
        db()
          .from("campanhas")
          .update({ status: updated.status })
          .eq("id", id)
          .then(({ error }) => {
            if (error) console.error("Supabase toggle campanha:", error.message);
          });
      }
    }
  },

  setCampanhasOrdem: (orderedIds) => {
    const mapa = new Map(orderedIds.map((id, i) => [id, i + 1]));
    set((s) => {
      const campanhasAll = s.campanhasAll.map((c) =>
        mapa.has(c.id) ? { ...c, ordem: mapa.get(c.id)! } : c,
      );
      return {
        campanhasAll,
        ...escopar(campanhasAll, s.reservasAll, s.gastosAll, s.propriedadeAtivaId),
      };
    });
    if (supabaseConfigured) {
      Promise.all(
        orderedIds.map((id, i) =>
          db().from("campanhas").update({ ordem: i + 1 }).eq("id", id),
        ),
      ).then((results) => {
        for (const { error } of results) {
          if (error) console.error("Supabase reorder campanhas:", error.message);
        }
      });
    }
  },

  // ── Reservas ──────────────────────────────────────────────────────────────

  addReserva: (data) => {
    const nova: Reserva = {
      ...data,
      propriedadeId: get().propriedadeAtivaId,
      id: novoId(),
    };
    set((s) => {
      const reservasAll = [...s.reservasAll, nova];
      return {
        reservasAll,
        ...escopar(s.campanhasAll, reservasAll, s.gastosAll, s.propriedadeAtivaId),
      };
    });
    if (supabaseConfigured) {
      db()
        .from("reservas")
        .insert(reservaToRow(nova))
        .then(({ error }) => {
          if (error) console.error("Supabase insert reserva:", error.message);
        });
    }
  },

  updateReserva: (id, data) => {
    set((s) => {
      const reservasAll = s.reservasAll.map((r) =>
        r.id === id ? { ...r, ...data } : r,
      );
      return {
        reservasAll,
        ...escopar(s.campanhasAll, reservasAll, s.gastosAll, s.propriedadeAtivaId),
      };
    });
    if (supabaseConfigured) {
      const updated = get().reservasAll.find((r) => r.id === id);
      if (updated) {
        db()
          .from("reservas")
          .update(reservaToRow(updated))
          .eq("id", id)
          .then(({ error }) => {
            if (error) console.error("Supabase update reserva:", error.message);
          });
      }
    }
  },

  removeReserva: (id) => {
    set((s) => {
      const reservasAll = s.reservasAll.filter((r) => r.id !== id);
      return {
        reservasAll,
        ...escopar(s.campanhasAll, reservasAll, s.gastosAll, s.propriedadeAtivaId),
      };
    });
    if (supabaseConfigured) {
      db()
        .from("reservas")
        .delete()
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.error("Supabase delete reserva:", error.message);
        });
    }
  },

  // ── Gastos diários ────────────────────────────────────────────────────────

  addGasto: (data) => {
    const novo: GastoDiario = {
      ...data,
      propriedadeId: get().propriedadeAtivaId,
      id: novoId(),
    };
    set((s) => {
      const gastosAll = [...s.gastosAll, novo];
      return {
        gastosAll,
        ...escopar(s.campanhasAll, s.reservasAll, gastosAll, s.propriedadeAtivaId),
      };
    });
    if (supabaseConfigured) {
      db()
        .from("gastos")
        .insert(gastoToRow(novo))
        .then(({ error }) => {
          if (error) console.error("Supabase insert gasto:", error.message);
        });
    }
  },

  updateGasto: (id, data) => {
    set((s) => {
      const gastosAll = s.gastosAll.map((g) =>
        g.id === id ? { ...g, ...data } : g,
      );
      return {
        gastosAll,
        ...escopar(s.campanhasAll, s.reservasAll, gastosAll, s.propriedadeAtivaId),
      };
    });
    if (supabaseConfigured) {
      const updated = get().gastosAll.find((g) => g.id === id);
      if (updated) {
        db()
          .from("gastos")
          .update(gastoToRow(updated))
          .eq("id", id)
          .then(({ error }) => {
            if (error) console.error("Supabase update gasto:", error.message);
          });
      }
    }
  },

  removeGasto: (id) => {
    set((s) => {
      const gastosAll = s.gastosAll.filter((g) => g.id !== id);
      return {
        gastosAll,
        ...escopar(s.campanhasAll, s.reservasAll, gastosAll, s.propriedadeAtivaId),
      };
    });
    if (supabaseConfigured) {
      db()
        .from("gastos")
        .delete()
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.error("Supabase delete gasto:", error.message);
        });
    }
  },

  // ── Utilitários ───────────────────────────────────────────────────────────

  resetarDadosExemplo: async () => {
    const propId = get().propriedadeAtivaId || "colonial";
    const campanhas: Campanha[] = campanhasMock.map((c) => ({
      ...c,
      propriedadeId: propId,
    }));
    const reservas: Reserva[] = reservasMock.map((r) => ({
      ...r,
      propriedadeId: propId,
    }));
    const gastos: GastoDiario[] = gastosMock.map((g) => ({
      ...g,
      propriedadeId: propId,
    }));

    set((s) => {
      // Substitui apenas os dados da propriedade ativa.
      const campanhasAll = [
        ...s.campanhasAll.filter((c) => c.propriedadeId !== propId),
        ...campanhas,
      ];
      const reservasAll = [
        ...s.reservasAll.filter((r) => r.propriedadeId !== propId),
        ...reservas,
      ];
      const gastosAll = [
        ...s.gastosAll.filter((g) => g.propriedadeId !== propId),
        ...gastos,
      ];
      return {
        campanhasAll,
        reservasAll,
        gastosAll,
        ...escopar(campanhasAll, reservasAll, gastosAll, propId),
      };
    });

    if (!supabaseConfigured) return;
    await db().from("gastos").delete().eq("propriedade_id", propId);
    await db().from("reservas").delete().eq("propriedade_id", propId);
    await db().from("campanhas").delete().eq("propriedade_id", propId);
    await db().from("campanhas").insert(campanhas.map(campanhaToRow));
    await db().from("reservas").insert(reservas.map(reservaToRow));
    await db().from("gastos").insert(gastos.map(gastoToRow));
  },
}));
