"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { metricasDashboard, metricasTodasCampanhas } from "@/lib/calculations";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
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
  const [reservaOpen, setReservaOpen] = useState(false);

  const dashboard = useMemo(
    () => metricasDashboard(campanhas, reservas),
    [campanhas, reservas],
  );
  const metricasCampanhas = useMemo(
    () => metricasTodasCampanhas(campanhas, reservas),
    [campanhas, reservas],
  );
  const confirmadas = useMemo(
    () => reservas.filter((r) => r.status === "confirmada").length,
    [reservas],
  );

  return (
    <div className="space-y-6">
      <Hero>
        <Button variant="primary" onClick={() => setReservaOpen(true)}>
          + Nova Reserva
        </Button>
      </Hero>

      <MetricsGrid m={dashboard} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Receita por mês"
            subtitle="Confirmada e pendente, por mês de check-in."
            href="/reservas"
          />
          <MonthlyRevenueChart reservas={reservas} />
        </Card>
        <Card>
          <CardHeader
            title="Reservas por plataforma"
            subtitle="Distribuição de origem."
            href="/plataformas"
          />
          <ReservationsByPlatformChart reservas={reservas} />
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
          <RecentReservations reservas={reservas} campanhas={campanhas} />
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
