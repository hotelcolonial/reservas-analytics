"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { metricasCampanha } from "@/lib/calculations";
import type { Reserva } from "@/lib/types";
import {
  formatBRL,
  formatPercent,
  formatMultiplier,
  PLATAFORMA_LABELS,
  TIPO_CAMPANHA_LABELS,
  STATUS_CAMPANHA_LABELS,
  STATUS_CAMPANHA_BADGE,
  PERIODO_TUDO,
  dentroDoPeriodo,
  type Periodo,
} from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { SectionCardHeader } from "@/components/ui/section-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PeriodFilter } from "@/components/ui/PeriodFilter";
import { Pagination } from "@/components/ui/Pagination";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { MonthlyRevenueChart } from "@/components/dashboard/MonthlyRevenueChart";
import { SpendByDateChart } from "@/components/verba/SpendByDateChart";
import { ReservationTable } from "@/components/reservations/ReservationTable";
import { ReservationForm } from "@/components/reservations/ReservationForm";
import { CampaignForm } from "@/components/campaigns/CampaignForm";

const POR_PAGINA = 8;

export default function CampanhaDetalhePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const campanhas = useStore((s) => s.campanhas);
  const reservas = useStore((s) => s.reservas);
  const gastos = useStore((s) => s.gastos);
  const removeCampanha = useStore((s) => s.removeCampanha);
  const toggleCampanhaStatus = useStore((s) => s.toggleCampanhaStatus);
  const removeReserva = useStore((s) => s.removeReserva);

  const campanha = campanhas.find((c) => c.id === id);

  const [periodo, setPeriodo] = useState<Periodo>(PERIODO_TUDO);
  const [page, setPage] = useState(1);
  const [editCampOpen, setEditCampOpen] = useState(false);
  const [excluirCamp, setExcluirCamp] = useState(false);
  const [resEditando, setResEditando] = useState<Reserva | null>(null);
  const [resFormOpen, setResFormOpen] = useState(false);
  const [excluirRes, setExcluirRes] = useState<Reserva | null>(null);

  const reservasCampanha = useMemo(
    () =>
      reservas
        .filter(
          (r) => r.campanhaId === id && dentroDoPeriodo(r.dataReserva, periodo),
        )
        .sort((a, b) => b.dataReserva.localeCompare(a.dataReserva)),
    [reservas, id, periodo],
  );

  const gastosCampanha = useMemo(
    () =>
      gastos
        .filter((g) => g.campanhaId === id && dentroDoPeriodo(g.data, periodo))
        .sort((a, b) => b.data.localeCompare(a.data)),
    [gastos, id, periodo],
  );

  const metricas = useMemo(
    () =>
      campanha
        ? metricasCampanha(campanha, reservasCampanha, gastosCampanha)
        : null,
    [campanha, reservasCampanha, gastosCampanha],
  );

  if (!campanha || !metricas) {
    return (
      <div className="space-y-6">
        <Link
          href="/campanhas"
          className="text-sm font-medium text-laranja-dark hover:underline"
        >
          ← Voltar para campanhas
        </Link>
        <EmptyState
          title="Campanha não encontrada"
          description="Ela pode ter sido excluída. Volte para a lista de campanhas."
          action={
            <Link href="/campanhas">
              <Button>Ver campanhas</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const totalPaginas = Math.max(
    1,
    Math.ceil(reservasCampanha.length / POR_PAGINA),
  );
  const paginaAtual = Math.min(page, totalPaginas);
  const reservasPaginadas = reservasCampanha.slice(
    (paginaAtual - 1) * POR_PAGINA,
    paginaAtual * POR_PAGINA,
  );

  const totalGasto = gastosCampanha.reduce((acc, g) => acc + g.valor, 0);

  function aplicarPeriodo(p: Periodo) {
    setPeriodo(p);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <Link
        href="/campanhas"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-laranja-dark hover:underline"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        Voltar para campanhas
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-semibold text-colonial">
            {campanha.nome}
          </h1>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge className="bg-colonial-50 text-colonial">
              {PLATAFORMA_LABELS[campanha.plataforma]}
            </Badge>
            <Badge className="bg-colonial-50 text-colonial/70">
              {TIPO_CAMPANHA_LABELS[campanha.tipo]}
            </Badge>
            <Badge className={STATUS_CAMPANHA_BADGE[campanha.status]}>
              {STATUS_CAMPANHA_LABELS[campanha.status]}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditCampOpen(true)}>
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleCampanhaStatus(campanha.id)}
            disabled={campanha.status === "finalizada"}
          >
            {campanha.status === "ativa" ? "Pausar" : "Ativar"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setExcluirCamp(true)}>
            Excluir
          </Button>
        </div>
      </div>

      <PeriodFilter periodo={periodo} onChange={aplicarPeriodo} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Verba gasta"
          value={formatBRL(metricas.investimento)}
          hint="No período"
        />
        <MetricCard
          label="Receita"
          value={formatBRL(metricas.receita)}
          hint="Reservas confirmadas"
        />
        <MetricCard
          label="ROI"
          value={formatPercent(metricas.roi)}
          hint="Retorno sobre investimento"
          trend={
            metricas.roi === null
              ? null
              : {
                  direction: metricas.roi >= 0 ? "up" : "down",
                  label: metricas.roi >= 0 ? "lucro" : "prejuízo",
                }
          }
        />
        <MetricCard
          label="ROAS"
          value={formatMultiplier(metricas.roas)}
          hint="Receita por R$ investido"
        />
        <MetricCard
          label="Reservas"
          value={`${metricas.reservasConfirmadas}/${metricas.totalReservas}`}
          hint="Confirmadas / total"
        />
        <MetricCard
          label="Ticket médio"
          value={
            metricas.ticketMedio === null
              ? "N/A"
              : formatBRL(metricas.ticketMedio)
          }
          hint="Por reserva confirmada"
        />
        <MetricCard
          label="Custo / reserva"
          value={
            metricas.custoPorReserva === null
              ? "N/A"
              : formatBRL(metricas.custoPorReserva)
          }
          hint="Verba por reserva confirmada"
        />
        <MetricCard
          label="Pax / Noites"
          value={`${metricas.pax} / ${metricas.noites}`}
          hint="Hóspedes e diárias"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg text-colonial">
              Verba gasta por data
            </CardTitle>
            <CardAction>
              <p className="text-sm text-muted-foreground">
                Total{" "}
                <span className="font-semibold text-colonial">
                  {formatBRL(totalGasto)}
                </span>
              </p>
            </CardAction>
          </CardHeader>
          <CardContent>
            <SpendByDateChart gastos={gastosCampanha} />
          </CardContent>
        </Card>

        <Card>
          <SectionCardHeader
            title="Receita × Investimento por mês"
            subtitle="Receita confirmada e verba gasta da campanha."
          />
          <CardContent>
            <MonthlyRevenueChart
              reservas={reservasCampanha}
              gastos={gastosCampanha}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <SectionCardHeader
          title="Reservas desta campanha"
          subtitle={`${reservasCampanha.length} reserva(s) no período.`}
        />
        <CardContent>
          {reservasCampanha.length === 0 ? (
            <EmptyState
              title="Nenhuma reserva no período"
              description="Ajuste o filtro de datas ou registre reservas vinculadas a esta campanha."
            />
          ) : (
            <div className="space-y-4">
              <ReservationTable
                reservas={reservasPaginadas}
                campanhas={campanhas}
                onEdit={(r) => {
                  setResEditando(r);
                  setResFormOpen(true);
                }}
                onDelete={setExcluirRes}
              />
              <Pagination
                page={paginaAtual}
                totalPages={totalPaginas}
                onPage={setPage}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <CampaignForm
        key={`camp-edit-${editCampOpen}`}
        open={editCampOpen}
        onClose={() => setEditCampOpen(false)}
        campanha={campanha}
      />

      <ReservationForm
        key={`res-${resFormOpen}-${resEditando?.id ?? "x"}`}
        open={resFormOpen}
        onClose={() => setResFormOpen(false)}
        reserva={resEditando}
      />

      <ConfirmDialog
        open={excluirCamp}
        title="Excluir campanha"
        message={`Tem certeza que deseja excluir "${campanha.nome}"? Os gastos diários dela serão removidos e as reservas vinculadas ficarão sem campanha.`}
        onConfirm={() => {
          removeCampanha(campanha.id);
          router.push("/campanhas");
        }}
        onClose={() => setExcluirCamp(false)}
      />

      <ConfirmDialog
        open={Boolean(excluirRes)}
        title="Excluir reserva"
        message={`Tem certeza que deseja excluir a reserva "${excluirRes?.codigo}"? Esta ação não pode ser desfeita.`}
        onConfirm={() => excluirRes && removeReserva(excluirRes.id)}
        onClose={() => setExcluirRes(null)}
      />
    </div>
  );
}
