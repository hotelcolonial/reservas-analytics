import { create } from "zustand";
import type { Campanha, Reserva } from "./types";
import {
  supabaseConfigured,
  getSupabase,
  rowToCampanha,
  rowToReserva,
  campanhaToRow,
  reservaToRow,
} from "./supabase";
import { campanhasMock, reservasMock } from "@/data/mockData";

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
  hydrated: boolean;

  loadData: () => Promise<void>;

  // Campanhas
  addCampanha: (data: Omit<Campanha, "id">) => void;
  updateCampanha: (id: string, data: Partial<Omit<Campanha, "id">>) => void;
  removeCampanha: (id: string) => void;
  toggleCampanhaStatus: (id: string) => void;

  // Reservas
  addReserva: (data: Omit<Reserva, "id">) => void;
  updateReserva: (id: string, data: Partial<Omit<Reserva, "id">>) => void;
  removeReserva: (id: string) => void;

  resetarDadosExemplo: () => Promise<void>;
}

export const useStore = create<AppState>()((set, get) => ({
  campanhas: [],
  reservas: [],
  hydrated: false,

  // ── Load ──────────────────────────────────────────────────────────────────

  loadData: async () => {
    if (!supabaseConfigured) {
      set({ campanhas: campanhasMock, reservas: reservasMock, hydrated: true });
      return;
    }
    const [{ data: campanhasData, error: e1 }, { data: reservasData, error: e2 }] =
      await Promise.all([
        db().from("campanhas").select("*").order("created_at", { ascending: true }),
        db().from("reservas").select("*").order("created_at", { ascending: true }),
      ]);
    if (e1) console.error("Supabase fetch campanhas:", e1.message);
    if (e2) console.error("Supabase fetch reservas:", e2.message);
    set({
      campanhas: campanhasData?.map(rowToCampanha) ?? [],
      reservas: reservasData?.map(rowToReserva) ?? [],
      hydrated: true,
    });
  },

  // ── Campanhas ─────────────────────────────────────────────────────────────

  addCampanha: (data) => {
    const nova: Campanha = { ...data, id: novoId() };
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

  // ── Utilitários ───────────────────────────────────────────────────────────

  resetarDadosExemplo: async () => {
    set({ campanhas: campanhasMock, reservas: reservasMock });
    if (!supabaseConfigured) return;
    await db().from("reservas").delete().neq("id", "");
    await db().from("campanhas").delete().neq("id", "");
    await db().from("campanhas").insert(campanhasMock.map(campanhaToRow));
    await db().from("reservas").insert(reservasMock.map(reservaToRow));
  },
}));
