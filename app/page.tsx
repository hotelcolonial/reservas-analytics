"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { metricasDashboard, metricasTodasCampanhas } from "@/lib/calculations";
import { PERIODO_TUDO, dentroDoPeriodo, type Periodo } from "@/lib/utils";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PeriodFilter } from "@/components/ui/PeriodFilter";
import { Hero } from "@/components/dashboard/Hero";
import { MetricsGrid } from "@/components/dashboard/MetricsGrid";
import { CampaignSummaryTable } from "@/components/dashboard/CampaignSummaryTable";
import { MonthlyRevenueChart } from "@/components/dashboard/MonthlyRevenueChart";
import { ReservationsByPlatformChart } from "@/components/dashboard/ReservationsByPlatformChart";
import { ConfirmationGauge } from "@/components/dashboard/ConfirmationGauge";
import { CampaignRanking } from "@/components/dashboard/CampaignRanking";
import { RecentReservations } from "@/components/dashboard/RecentReservations";
import { ReservationForm } from "@/components/reservations/ReservationForm";

export default function DashboardPage() {
  const campanhas = useStore((s) => s.campanhas);
  const reservas = useStore((s) => s.reservas);
  const gastos = useStore((s) => s.gastos);
  const [reservaOpen, setReservaOpen] = useState(false);
  const [periodo, setPeriodo] = useState<Periodo>(PERIODO_TUDO);

  const reservasFiltradas = useMemo(
    () => reservas.filter((r) => dentroDoPeriodo(r.dataReserva, periodo)),
    [reservas, periodo],
  );
  const gastosFiltrados = useMemo(
    () => gastos.filter((g) => dentroDoPeriodo(g.data, periodo)),
    [gastos, periodo],
  );

  const dashboard = useMemo(
    () => metricasDashboard(campanhas, reservasFiltradas, gastosFiltrados),
    [campanhas, reservasFiltradas, gastosFiltrados],
  );
  const metricasCampanhas = useMemo(
    () => metricasTodasCampanhas(campanhas, reservasFiltradas, gastosFiltrados),
    [campanhas, reservasFiltradas, gastosFiltrados],
  );
  const confirmadas = useMemo(
    () => reservasFiltradas.filter((r) => r.status === "confirmada").length,
    [reservasFiltradas],
  );

  return (
    <div className="space-y-6">
      <Hero>
        <Button variant="primary" onClick={() => setReservaOpen(true)}>
          + Nova Reserva
        </Button>
      </Hero>

      <PeriodFilter periodo={periodo} onChange={setPeriodo} />

      <MetricsGrid m={dashboard} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Receita × Investimento por mês"
            subtitle="Receita confirmada e verba gasta, por mês."
            href="/reservas"
          />
          <MonthlyRevenueChart
            reservas={reservasFiltradas}
            gastos={gastosFiltrados}
          />
        </Card>
        <Card>
          <CardHeader
            title="Reservas por plataforma"
            subtitle="Distribuição de origem."
            href="/plataformas"
          />
          <ReservationsByPlatformChart reservas={reservasFiltradas} />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Taxa de confirmação" subtitle="Reservas confirmadas." />
          <ConfirmationGauge
            confirmadas={confirmadas}
            total={dashboard.totalReservas}
          />
        </Card>
        <Card>
          <CardHeader
            title="Ranking de campanhas"
            subtitle="As que mais geram receita."
            href="/campanhas"
          />
          <CampaignRanking metricas={metricasCampanhas} />
        </Card>
        <Card>
          <CardHeader
            title="Reservas recentes"
            subtitle="Últimos registros."
            href="/reservas"
          />
          <RecentReservations reservas={reservasFiltradas} campanhas={campanhas} />
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Resumo de campanhas"
          subtitle="Resultado consolidado por campanha, ordenado por receita."
          href="/campanhas"
        />
        <CampaignSummaryTable metricas={metricasCampanhas} />
      </Card>

      <ReservationForm
        key={`dash-res-${reservaOpen}`}
        open={reservaOpen}
        onClose={() => setReservaOpen(false)}
      />
    </div>
  );
}
