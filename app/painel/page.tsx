"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { metricasDashboard, metricasTodasCampanhas } from "@/lib/calculations";
import { PERIODO_TUDO, dentroDoPeriodo, type Periodo } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { SectionCardHeader } from "@/components/ui/section-card";
import { Button } from "@/components/ui/button";
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
        <Button onClick={() => setReservaOpen(true)}>+ nova reserva</Button>
      </Hero>

      <PeriodFilter periodo={periodo} onChange={setPeriodo} />

      <MetricsGrid m={dashboard} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionCardHeader
            title="Receita × Investimento por mês"
            subtitle="Receita confirmada e verba gasta, por mês."
            href="/reservas"
          />
          <CardContent>
            <MonthlyRevenueChart
              reservas={reservasFiltradas}
              gastos={gastosFiltrados}
            />
          </CardContent>
        </Card>
        <Card>
          <SectionCardHeader
            title="Reservas por plataforma"
            subtitle="Distribuição de origem."
            href="/plataformas"
          />
          <CardContent>
            <ReservationsByPlatformChart reservas={reservasFiltradas} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <SectionCardHeader
            title="Taxa de confirmação"
            subtitle="Reservas confirmadas."
          />
          <CardContent>
            <ConfirmationGauge
              confirmadas={confirmadas}
              total={dashboard.totalReservas}
            />
          </CardContent>
        </Card>
        <Card>
          <SectionCardHeader
            title="Ranking de campanhas"
            subtitle="As que mais geram receita."
            href="/campanhas"
          />
          <CardContent>
            <CampaignRanking metricas={metricasCampanhas} />
          </CardContent>
        </Card>
        <Card>
          <SectionCardHeader
            title="Reservas recentes"
            subtitle="Últimos registros."
            href="/reservas"
          />
          <CardContent>
            <RecentReservations
              reservas={reservasFiltradas}
              campanhas={campanhas}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <SectionCardHeader
          title="Resumo de campanhas"
          subtitle="Resultado consolidado por campanha, ordenado por receita."
          href="/campanhas"
        />
        <CardContent>
          <CampaignSummaryTable metricas={metricasCampanhas} />
        </CardContent>
      </Card>

      <ReservationForm
        key={`dash-res-${reservaOpen}`}
        open={reservaOpen}
        onClose={() => setReservaOpen(false)}
      />
    </div>
  );
}
