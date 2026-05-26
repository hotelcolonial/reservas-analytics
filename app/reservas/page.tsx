"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import type { Reserva } from "@/lib/types";
import { formatBRL } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ReservationForm } from "@/components/reservations/ReservationForm";
import { ReservationTable } from "@/components/reservations/ReservationTable";
import {
  ReservationFilters,
  filtrosVazios,
  type FiltrosReserva,
} from "@/components/reservations/ReservationFilters";

export default function ReservasPage() {
  const reservas = useStore((s) => s.reservas);
  const campanhas = useStore((s) => s.campanhas);
  const removeReserva = useStore((s) => s.removeReserva);

  const [filtros, setFiltros] = useState<FiltrosReserva>(filtrosVazios);
  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState<Reserva | null>(null);
  const [excluir, setExcluir] = useState<Reserva | null>(null);

  const filtradas = useMemo(() => {
    const busca = filtros.busca.trim().toLowerCase();
    return reservas
      .filter((r) => {
        if (busca) {
          if (!r.codigo.toLowerCase().includes(busca)) return false;
        }
        if (filtros.campanhaId === "sem" && r.campanhaId !== null) return false;
        if (
          filtros.campanhaId &&
          filtros.campanhaId !== "sem" &&
          r.campanhaId !== filtros.campanhaId
        )
          return false;
        if (filtros.plataforma && r.plataforma !== filtros.plataforma)
          return false;
        if (filtros.status && r.status !== filtros.status) return false;
        if (filtros.checkInDe && r.checkIn < filtros.checkInDe) return false;
        if (filtros.checkInAte && r.checkIn > filtros.checkInAte) return false;
        return true;
      })
      .sort((a, b) => b.checkIn.localeCompare(a.checkIn));
  }, [reservas, filtros]);

  const totalFiltrado = useMemo(
    () =>
      filtradas
        .filter((r) => r.status === "confirmada")
        .reduce((acc, r) => acc + r.valor, 0),
    [filtradas],
  );

  function abrirNova() {
    setEditando(null);
    setFormOpen(true);
  }

  function abrirEdicao(r: Reserva) {
    setEditando(r);
    setFormOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-colonial">
            Reservas
          </h1>
          <p className="mt-1 text-sm text-colonial/60">
            {filtradas.length} reserva(s) · receita confirmada{" "}
            <span className="font-semibold text-colonial">
              {formatBRL(totalFiltrado)}
            </span>
          </p>
        </div>
        <Button onClick={abrirNova}>+ Nova Reserva</Button>
      </div>

      <ReservationFilters
        filtros={filtros}
        onChange={setFiltros}
        campanhas={campanhas}
      />

      {filtradas.length === 0 ? (
        <EmptyState
          title={
            reservas.length === 0
              ? "Nenhuma reserva registrada"
              : "Nenhuma reserva encontrada"
          }
          description={
            reservas.length === 0
              ? "Registre a primeira reserva para começar a acompanhar resultados."
              : "Ajuste os filtros ou limpe a busca para ver mais resultados."
          }
          action={
            reservas.length === 0 ? (
              <Button onClick={abrirNova}>+ Nova Reserva</Button>
            ) : undefined
          }
        />
      ) : (
        <ReservationTable
          reservas={filtradas}
          campanhas={campanhas}
          onEdit={abrirEdicao}
          onDelete={setExcluir}
        />
      )}

      <ReservationForm
        key={`res-${formOpen}-${editando?.id ?? "nova"}`}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        reserva={editando}
      />

      <ConfirmDialog
        open={Boolean(excluir)}
        title="Excluir reserva"
        message={`Tem certeza que deseja excluir a reserva "${excluir?.codigo}"? Esta ação não pode ser desfeita.`}
        onConfirm={() => excluir && removeReserva(excluir.id)}
        onClose={() => setExcluir(null)}
      />
    </div>
  );
}
