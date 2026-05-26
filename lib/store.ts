import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Campanha, Reserva } from "./types";
import { storage, STORAGE_KEY } from "./storage";
import { campanhasMock, reservasMock } from "@/data/mockData";

function novoId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

interface AppState {
  campanhas: Campanha[];
  reservas: Reserva[];

  // Campanhas
  addCampanha: (data: Omit<Campanha, "id">) => void;
  updateCampanha: (id: string, data: Partial<Omit<Campanha, "id">>) => void;
  removeCampanha: (id: string) => void;
  toggleCampanhaStatus: (id: string) => void;

  // Reservas
  addReserva: (data: Omit<Reserva, "id">) => void;
  updateReserva: (id: string, data: Partial<Omit<Reserva, "id">>) => void;
  removeReserva: (id: string) => void;

  // Utilitários
  resetarDadosExemplo: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      campanhas: campanhasMock,
      reservas: reservasMock,

      addCampanha: (data) =>
        set((state) => ({
          campanhas: [...state.campanhas, { ...data, id: novoId() }],
        })),

      updateCampanha: (id, data) =>
        set((state) => ({
          campanhas: state.campanhas.map((c) =>
            c.id === id ? { ...c, ...data } : c,
          ),
        })),

      removeCampanha: (id) =>
        set((state) => ({
          campanhas: state.campanhas.filter((c) => c.id !== id),
          // Reservas vinculadas ficam sem campanha (não são apagadas).
          reservas: state.reservas.map((r) =>
            r.campanhaId === id ? { ...r, campanhaId: null } : r,
          ),
        })),

      toggleCampanhaStatus: (id) =>
        set((state) => ({
          campanhas: state.campanhas.map((c) =>
            c.id === id
              ? { ...c, status: c.status === "ativa" ? "pausada" : "ativa" }
              : c,
          ),
        })),

      addReserva: (data) =>
        set((state) => ({
          reservas: [...state.reservas, { ...data, id: novoId() }],
        })),

      updateReserva: (id, data) =>
        set((state) => ({
          reservas: state.reservas.map((r) =>
            r.id === id ? { ...r, ...data } : r,
          ),
        })),

      removeReserva: (id) =>
        set((state) => ({
          reservas: state.reservas.filter((r) => r.id !== id),
        })),

      resetarDadosExemplo: () =>
        set({ campanhas: campanhasMock, reservas: reservasMock }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => storage),
      // Hidratação manual em app/providers.tsx para evitar mismatch SSR/CSR.
      skipHydration: true,
    },
  ),
);
