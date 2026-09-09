"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { useStore } from "@/lib/store";
import { metricasTodasCampanhas } from "@/lib/calculations";
import type { Campanha } from "@/lib/types";
import {
  PERIODO_TUDO,
  dentroDoPeriodo,
  porOrdem,
  cn,
  type Periodo,
} from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PeriodFilter } from "@/components/ui/PeriodFilter";
import { CampaignForm } from "@/components/campaigns/CampaignForm";
import { SortableCampaign } from "@/components/campaigns/SortableCampaign";

type Visualizacao = "grid" | "list";

function lerVisualizacao(): Visualizacao {
  if (typeof window === "undefined") return "grid";
  const v = window.localStorage.getItem("campanhas-view");
  return v === "list" ? "list" : "grid";
}

function salvarVisualizacao(v: Visualizacao) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem("campanhas-view", v);
  }
}

export default function CampanhasPage() {
  const campanhas = useStore((s) => s.campanhas);
  const reservas = useStore((s) => s.reservas);
  const gastos = useStore((s) => s.gastos);
  const removeCampanha = useStore((s) => s.removeCampanha);
  const toggleCampanhaStatus = useStore((s) => s.toggleCampanhaStatus);
  const setCampanhasOrdem = useStore((s) => s.setCampanhasOrdem);

  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState<Campanha | null>(null);
  const [excluir, setExcluir] = useState<Campanha | null>(null);
  const [periodo, setPeriodo] = useState<Periodo>(PERIODO_TUDO);
  const [view, setView] = useState<Visualizacao>(lerVisualizacao);

  function aplicarView(v: Visualizacao) {
    setView(v);
    salvarVisualizacao(v);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const metricas = useMemo(() => {
    const reservasFiltradas = reservas.filter((r) =>
      dentroDoPeriodo(r.dataReserva, periodo),
    );
    const gastosFiltrados = gastos.filter((g) =>
      dentroDoPeriodo(g.data, periodo),
    );
    const ordenadas = porOrdem(campanhas);
    return metricasTodasCampanhas(
      ordenadas,
      reservasFiltradas,
      gastosFiltrados,
    );
  }, [campanhas, reservas, gastos, periodo]);

  // Separa as campanhas entre não pausadas (Ativas) e pausadas.
  const naoPausadas = metricas.filter((m) => m.campanha.status !== "pausada");
  const pausadas = metricas.filter((m) => m.campanha.status === "pausada");
  const naoPausadasIds = naoPausadas.map((m) => m.campanha.id);
  const pausadasIds = pausadas.map((m) => m.campanha.id);

  const grupos = [
    { key: "ativas", titulo: "Ativas", itens: naoPausadas },
    { key: "pausadas", titulo: "Pausadas", itens: pausadas },
  ].filter((g) => g.itens.length > 0);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    // Reordena apenas dentro do mesmo grupo (Ativas ou Pausadas).
    const emAtivas = naoPausadasIds.includes(active.id as string);
    const lista = emAtivas ? naoPausadasIds : pausadasIds;
    const oldIdx = lista.indexOf(active.id as string);
    const newIdx = lista.indexOf(over.id as string);
    if (oldIdx < 0 || newIdx < 0) return; // soltou em outro grupo → ignora
    const nova = arrayMove(lista, oldIdx, newIdx);
    const full = emAtivas
      ? [...nova, ...pausadasIds]
      : [...naoPausadasIds, ...nova];
    setCampanhasOrdem(full);
  }

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
          <h1 className="font-brand text-[clamp(34px,4.4vw,58px)] leading-[0.95] font-light tracking-[-0.045em] text-carvao lowercase">
            campanhas
          </h1>
          <p className="mt-3 max-w-2xl text-[clamp(15px,1.1vw,17px)] leading-relaxed text-muted-fg">
            Crie, edite e acompanhe o desempenho de cada campanha. Arraste pelo{" "}
            <span aria-hidden>⋮⋮</span> para reordenar.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle view={view} onChange={aplicarView} />
          <Button onClick={abrirNova}>+ nova campanha</Button>
        </div>
      </div>

      <PeriodFilter periodo={periodo} onChange={setPeriodo} />

      {campanhas.length === 0 ? (
        <EmptyState
          title="Nenhuma campanha ainda"
          description="Cadastre sua primeira campanha para começar a medir reservas e retorno."
          action={<Button onClick={abrirNova}>+ nova campanha</Button>}
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-8">
            {grupos.map((g) => (
              <section key={g.key} className="space-y-3">
                <h2 className="flex items-center gap-2 text-sm font-normal uppercase tracking-wide text-muted-foreground">
                  {g.titulo}
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                    {g.itens.length}
                  </span>
                </h2>
                <SortableContext
                  items={g.itens.map((m) => m.campanha.id)}
                  strategy={
                    view === "grid"
                      ? rectSortingStrategy
                      : verticalListSortingStrategy
                  }
                >
                  <div
                    className={
                      view === "grid"
                        ? "grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
                        : "space-y-3"
                    }
                  >
                    {g.itens.map((m) => (
                      <SortableCampaign
                        key={m.campanha.id}
                        m={m}
                        view={view}
                        onEdit={() => abrirEdicao(m.campanha)}
                        onToggle={() => toggleCampanhaStatus(m.campanha.id)}
                        onDelete={() => setExcluir(m.campanha)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </section>
            ))}
          </div>
        </DndContext>
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

function ViewToggle({
  view,
  onChange,
}: {
  view: Visualizacao;
  onChange: (v: Visualizacao) => void;
}) {
  const baseBtn =
    "inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors";
  const ativo = "bg-carvao text-branco";
  const inativo = "text-muted-fg hover:bg-carvao-50 hover:text-carvao";

  return (
    <div
      role="group"
      aria-label="Tipo de visualização"
      className="inline-flex items-center gap-1 rounded-xl border border-black/10 bg-branco p-1"
    >
      <button
        type="button"
        onClick={() => onChange("grid")}
        aria-pressed={view === "grid"}
        aria-label="Visualizar como cards"
        className={cn(baseBtn, view === "grid" ? ativo : inativo)}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => onChange("list")}
        aria-pressed={view === "list"}
        aria-label="Visualizar como lista"
        className={cn(baseBtn, view === "list" ? ativo : inativo)}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
    </div>
  );
}
