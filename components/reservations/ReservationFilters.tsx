"use client";

import { Input, Select } from "@/components/ui/Field";
import type { Campanha, Plataforma, StatusReserva } from "@/lib/types";
import {
  PLATAFORMAS,
  PLATAFORMA_LABELS,
  STATUS_RESERVA_LABELS,
} from "@/lib/utils";

export interface FiltrosReserva {
  busca: string;
  campanhaId: string; // "" = todas
  plataforma: string; // "" = todas
  status: string; // "" = todos
  checkInDe: string;
  checkInAte: string;
}

export const filtrosVazios: FiltrosReserva = {
  busca: "",
  campanhaId: "",
  plataforma: "",
  status: "",
  checkInDe: "",
  checkInAte: "",
};

const statusOpcoes: StatusReserva[] = ["confirmada", "pendente", "cancelada"];

export function ReservationFilters({
  filtros,
  onChange,
  campanhas,
}: {
  filtros: FiltrosReserva;
  onChange: (f: FiltrosReserva) => void;
  campanhas: Campanha[];
}) {
  function set<K extends keyof FiltrosReserva>(
    key: K,
    value: FiltrosReserva[K],
  ) {
    onChange({ ...filtros, [key]: value });
  }

  const algumFiltro =
    filtros.busca ||
    filtros.campanhaId ||
    filtros.plataforma ||
    filtros.status ||
    filtros.checkInDe ||
    filtros.checkInAte;

  return (
    <div className="space-y-4 rounded-2xl border border-black/5 bg-branco p-4 sm:p-5">
      <Input
        placeholder="Buscar por cliente ou WhatsApp..."
        value={filtros.busca}
        onChange={(e) => set("busca", e.target.value)}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Select
          value={filtros.campanhaId}
          onChange={(e) => set("campanhaId", e.target.value)}
        >
          <option value="">Todas as campanhas</option>
          <option value="sem">Sem campanha</option>
          {campanhas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </Select>

        <Select
          value={filtros.plataforma}
          onChange={(e) => set("plataforma", e.target.value)}
        >
          <option value="">Todas as plataformas</option>
          {PLATAFORMAS.map((p: Plataforma) => (
            <option key={p} value={p}>
              {PLATAFORMA_LABELS[p]}
            </option>
          ))}
        </Select>

        <Select
          value={filtros.status}
          onChange={(e) => set("status", e.target.value)}
        >
          <option value="">Todos os status</option>
          {statusOpcoes.map((s) => (
            <option key={s} value={s}>
              {STATUS_RESERVA_LABELS[s]}
            </option>
          ))}
        </Select>

        <Input
          type="date"
          aria-label="Check-in de"
          value={filtros.checkInDe}
          onChange={(e) => set("checkInDe", e.target.value)}
        />
        <Input
          type="date"
          aria-label="Check-in até"
          value={filtros.checkInAte}
          onChange={(e) => set("checkInAte", e.target.value)}
        />
      </div>
      {algumFiltro && (
        <button
          onClick={() => onChange(filtrosVazios)}
          className="text-sm font-medium text-laranja-dark hover:underline"
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
}
