import { create } from "zustand";
import type { Campanha, Reserva, GastoDiario } from "./types";
import {
  supabaseConfigured,
  getSupabase,
  rowToCampanha,
  rowToReserva,
  rowToGasto,
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

interface AppState {
  campanhas: Campanha[];
  reservas: Reserva[];
  gastos: GastoDiario[];
  hydrated: boolean;

  loadData: () => Promise<void>;

  // Campanhas
  addCampanha: (data: Omit<Campanha, "id">) => void;
  updateCampanha: (id: string, data: Partial<Omit<Campanha, "id">>) => void;
  removeCampanha: (id: string) => void;
  toggleCampanhaStatus: (id: string) => void;
  moveCampanha: (id: string, direction: "up" | "down") => void;

  // Reservas
  addReserva: (data: Omit<Reserva, "id">) => void;
  updateReserva: (id: string, data: Partial<Omit<Reserva, "id">>) => void;
  removeReserva: (id: string) => void;

  // Gastos diários (verba)
  addGasto: (data: Omit<GastoDiario, "id">) => void;
  updateGasto: (id: string, data: Partial<Omit<GastoDiario, "id">>) => void;
  removeGasto: (id: string) => void;

  resetarDadosExemplo: () => Promise<void>;
}

export const useStore = create<AppState>()((set, get) => ({
  campanhas: [],
  reservas: [],
  gastos: [],
  hydrated: false,

  // ── Load ──────────────────────────────────────────────────────────────────

  loadData: async () => {
    if (!supabaseConfigured) {
      set({
        campanhas: campanhasMock,
        reservas: reservasMock,
        gastos: gastosMock,
        hydrated: true,
      });
      return;
    }
    const [
      { data: campanhasData, error: e1 },
      { data: reservasData, error: e2 },
      { data: gastosData, error: e3 },
    ] = await Promise.all([
      db().from("campanhas").select("*").order("created_at", { ascending: true }),
      db().from("reservas").select("*").order("created_at", { ascending: true }),
      db().from("gastos").select("*").order("data", { ascending: true }),
    ]);
    if (e1) console.error("Supabase fetch campanhas:", e1.message);
    if (e2) console.error("Supabase fetch reservas:", e2.message);
    if (e3) console.error("Supabase fetch gastos:", e3.message);
    set({
      campanhas: campanhasData?.map(rowToCampanha) ?? [],
      reservas: reservasData?.map(rowToReserva) ?? [],
      gastos: gastosData?.map(rowToGasto) ?? [],
      hydrated: true,
    });
  },

  // ── Campanhas ─────────────────────────────────────────────────────────────

  addCampanha: (data) => {
    const proximaOrdem =
      get().campanhas.reduce((max, c) => Math.max(max, c.ordem ?? 0), 0) + 1;
    const nova: Campanha = { ...data, ordem: proximaOrdem, id: novoId() };
    set((s) => ({ campanhas: [...s.campanhas, nova] }));
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
    set((s) => ({
      campanhas: s.campanhas.map((c) => (c.id === id ? { ...c, ...data } : c)),
    }));
    if (supabaseConfigured) {
      const updated = get().campanhas.find((c) => c.id === id);
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
    set((s) => ({
      campanhas: s.campanhas.filter((c) => c.id !== id),
      // Reservas linked to this campaign lose the link (mirrors ON DELETE SET NULL)
      reservas: s.reservas.map((r) =>
        r.campanhaId === id ? { ...r, campanhaId: null } : r,
      ),
      // Gastos dessa campanha são removidos (mirrors ON DELETE CASCADE)
      gastos: s.gastos.filter((g) => g.campanhaId !== id),
    }));
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
    set((s) => ({
      campanhas: s.campanhas.map((c) =>
        c.id === id
          ? { ...c, status: c.status === "ativa" ? "pausada" : "ativa" }
          : c,
      ),
    }));
    if (supabaseConfigured) {
      const updated = get().campanhas.find((c) => c.id === id);
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

  moveCampanha: (id, direction) => {
    const sorted = [...get().campanhas].sort(
      (a, b) => (a.ordem ?? 0) - (b.ordem ?? 0) || a.nome.localeCompare(b.nome),
    );
    const idx = sorted.findIndex((c) => c.id === id);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[swapIdx];
    const ordemA = a.ordem;
    const ordemB = b.ordem;
    set((s) => ({
      campanhas: s.campanhas.map((c) => {
        if (c.id === a.id) return { ...c, ordem: ordemB };
        if (c.id === b.id) return { ...c, ordem: ordemA };
        return c;
      }),
    }));
    if (supabaseConfigured) {
      Promise.all([
        db().from("campanhas").update({ ordem: ordemB }).eq("id", a.id),
        db().from("campanhas").update({ ordem: ordemA }).eq("id", b.id),
      ]).then((results) => {
        for (const { error } of results) {
          if (error) console.error("Supabase move campanha:", error.message);
        }
      });
    }
  },

  // ── Reservas ──────────────────────────────────────────────────────────────

  addReserva: (data) => {
    const nova: Reserva = { ...data, id: novoId() };
    set((s) => ({ reservas: [...s.reservas, nova] }));
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
    set((s) => ({
      reservas: s.reservas.map((r) => (r.id === id ? { ...r, ...data } : r)),
    }));
    if (supabaseConfigured) {
      const updated = get().reservas.find((r) => r.id === id);
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
    set((s) => ({ reservas: s.reservas.filter((r) => r.id !== id) }));
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
    const novo: GastoDiario = { ...data, id: novoId() };
    set((s) => ({ gastos: [...s.gastos, novo] }));
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
    set((s) => ({
      gastos: s.gastos.map((g) => (g.id === id ? { ...g, ...data } : g)),
    }));
    if (supabaseConfigured) {
      const updated = get().gastos.find((g) => g.id === id);
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
    set((s) => ({ gastos: s.gastos.filter((g) => g.id !== id) }));
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
    set({
      campanhas: campanhasMock,
      reservas: reservasMock,
      gastos: gastosMock,
    });
    if (!supabaseConfigured) return;
    await db().from("gastos").delete().neq("id", "");
    await db().from("reservas").delete().neq("id", "");
    await db().from("campanhas").delete().neq("id", "");
    await db().from("campanhas").insert(campanhasMock.map(campanhaToRow));
    await db().from("reservas").insert(reservasMock.map(reservaToRow));
    await db().from("gastos").insert(gastosMock.map(gastoToRow));
  },
}));
