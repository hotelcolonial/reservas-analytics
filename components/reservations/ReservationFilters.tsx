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
  reservaDe: string;
  reservaAte: string;
  checkInDe: string;
  checkInAte: string;
  checkOutDe: string;
  checkOutAte: string;
}

export const filtrosVazios: FiltrosReserva = {
  busca: "",
  campanhaId: "",
  plataforma: "",
  status: "",
  reservaDe: "",
  reservaAte: "",
  checkInDe: "",
  checkInAte: "",
  checkOutDe: "",
  checkOutAte: "",
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

  const algumFiltro = Object.values(filtros).some(Boolean);

  return (
    <div className="space-y-4 rounded-3xl bg-branco p-4 shadow-[0_1px_3px_rgba(16,24,40,0.04),0_8px_24px_-12px_rgba(16,24,40,0.10)] sm:p-5">
      <Input
        placeholder="Buscar por código de reserva..."
        value={filtros.busca}
        onChange={(e) => set("busca", e.target.value)}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <DateRange
          label="Data da reserva"
          de={filtros.reservaDe}
          ate={filtros.reservaAte}
          onDe={(v) => set("reservaDe", v)}
          onAte={(v) => set("reservaAte", v)}
        />
        <DateRange
          label="Check-in"
          de={filtros.checkInDe}
          ate={filtros.checkInAte}
          onDe={(v) => set("checkInDe", v)}
          onAte={(v) => set("checkInAte", v)}
        />
        <DateRange
          label="Check-out"
          de={filtros.checkOutDe}
          ate={filtros.checkOutAte}
          onDe={(v) => set("checkOutDe", v)}
          onAte={(v) => set("checkOutAte", v)}
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

function DateRange({
  label,
  de,
  ate,
  onDe,
  onAte,
}: {
  label: string;
  de: string;
  ate: string;
  onDe: (v: string) => void;
  onAte: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-colonial/45">
        {label}
      </p>
      <div className="flex items-center gap-2">
        <Input
          type="date"
          aria-label={`${label} de`}
          value={de}
          onChange={(e) => onDe(e.target.value)}
          className="py-2"
        />
        <span className="text-colonial/40">—</span>
        <Input
          type="date"
          aria-label={`${label} até`}
          value={ate}
          onChange={(e) => onAte(e.target.value)}
          className="py-2"
        />
      </div>
    </div>
  );
}
