"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Campanha, Plataforma, StatusReserva } from "@/lib/types";
import {
  PLATAFORMAS,
  PLATAFORMA_LABELS,
  STATUS_RESERVA_LABELS,
  porOrdemSelecionaveis,
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

// Radix Select não aceita value="" — sentinels para as opções "todas/todos".
const TODAS = "__todas__";
const TODOS = "__todos__";

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
    <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <Input
        placeholder="Buscar por código de reserva..."
        value={filtros.busca}
        onChange={(e) => set("busca", e.target.value)}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Select
          value={filtros.campanhaId === "" ? TODAS : filtros.campanhaId}
          onValueChange={(v) => set("campanhaId", v === TODAS ? "" : v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODAS}>Todas as campanhas</SelectItem>
            <SelectItem value="sem">Sem campanha</SelectItem>
            {porOrdemSelecionaveis(campanhas, filtros.campanhaId).map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filtros.plataforma === "" ? TODAS : filtros.plataforma}
          onValueChange={(v) => set("plataforma", v === TODAS ? "" : v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODAS}>Todas as plataformas</SelectItem>
            {PLATAFORMAS.map((p: Plataforma) => (
              <SelectItem key={p} value={p}>
                {PLATAFORMA_LABELS[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filtros.status === "" ? TODOS : filtros.status}
          onValueChange={(v) => set("status", v === TODOS ? "" : v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos os status</SelectItem>
            {statusOpcoes.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_RESERVA_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
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
        <Button
          variant="link"
          onClick={() => onChange(filtrosVazios)}
          className="h-auto px-0 text-coral-dark"
        >
          Limpar filtros
        </Button>
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
      <p className="mb-1.5 text-xs font-normal uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="flex items-center gap-2">
        <Input
          type="date"
          aria-label={`${label} de`}
          value={de}
          onChange={(e) => onDe(e.target.value)}
        />
        <span className="text-muted-foreground">—</span>
        <Input
          type="date"
          aria-label={`${label} até`}
          value={ate}
          onChange={(e) => onAte(e.target.value)}
        />
      </div>
    </div>
  );
}
