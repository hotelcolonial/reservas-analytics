"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { metricasTodasCampanhas } from "@/lib/calculations";
import type { Campanha } from "@/lib/types";
import { PERIODO_TUDO, dentroDoPeriodo, type Periodo } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PeriodFilter } from "@/components/ui/PeriodFilter";
import { CampaignCard } from "@/components/campaigns/CampaignCard";
import { CampaignForm } from "@/components/campaigns/CampaignForm";

export default function CampanhasPage() {
  const campanhas = useStore((s) => s.campanhas);
  const reservas = useStore((s) => s.reservas);
  const gastos = useStore((s) => s.gastos);
  const removeCampanha = useStore((s) => s.removeCampanha);
  const toggleCampanhaStatus = useStore((s) => s.toggleCampanhaStatus);

  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState<Campanha | null>(null);
  const [excluir, setExcluir] = useState<Campanha | null>(null);
  const [periodo, setPeriodo] = useState<Periodo>(PERIODO_TUDO);

  const metricas = useMemo(() => {
    const reservasFiltradas = reservas.filter((r) =>
      dentroDoPeriodo(r.dataReserva, periodo),
    );
    const gastosFiltrados = gastos.filter((g) =>
      dentroDoPeriodo(g.data, periodo),
    );
    return metricasTodasCampanhas(campanhas, reservasFiltradas, gastosFiltrados);
  }, [campanhas, reservas, gastos, periodo]);

  function abrirNova() {
    setEditando(null);
    setFormOpen(true);
  }

  function abrirEdicao(c: Campanha) {
    setEditando(c);
    setFormOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-colonial">
            Campanhas
          </h1>
          <p className="mt-1 text-sm text-colonial/60">
            Crie, edite e acompanhe o desempenho de cada campanha.
          </p>
        </div>
        <Button onClick={abrirNova}>+ Nova Campanha</Button>
      </div>

      <PeriodFilter periodo={periodo} onChange={setPeriodo} />

      {campanhas.length === 0 ? (
        <EmptyState
          title="Nenhuma campanha ainda"
          description="Cadastre sua primeira campanha para começar a medir reservas e retorno."
          action={<Button onClick={abrirNova}>+ Nova Campanha</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {metricas.map((m) => (
            <CampaignCard
              key={m.campanha.id}
              m={m}
              onEdit={() => abrirEdicao(m.campanha)}
              onToggle={() => toggleCampanhaStatus(m.campanha.id)}
              onDelete={() => setExcluir(m.campanha)}
            />
          ))}
        </div>
      )}

      <CampaignForm
        key={`camp-${formOpen}-${editando?.id ?? "novo"}`}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        campanha={editando}
      />

      <ConfirmDialog
        open={Boolean(excluir)}
        title="Excluir campanha"
        message={`Tem certeza que deseja excluir "${excluir?.nome}"? Os gastos diários dela serão removidos e as reservas vinculadas ficarão sem campanha.`}
        onConfirm={() => excluir && removeCampanha(excluir.id)}
        onClose={() => setExcluir(null)}
      />
    </div>
  );
}
