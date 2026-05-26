"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import {
  metricasDashboard,
  metricasTodasCampanhas,
} from "@/lib/calculations";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Hero } from "@/components/dashboard/Hero";
import { MetricsGrid } from "@/components/dashboard/MetricsGrid";
import { CampaignSummaryTable } from "@/components/dashboard/CampaignSummaryTable";
import { RevenueByCampaignChart } from "@/components/dashboard/RevenueByCampaignChart";
import { ReservationsByPlatformChart } from "@/components/dashboard/ReservationsByPlatformChart";
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

  return (
    <div className="space-y-8">
      <Hero>
        <Button variant="primary" onClick={() => setReservaOpen(true)}>
          + Registrar nova reserva
        </Button>
      </Hero>

      <MetricsGrid m={dashboard} />

      <Card>
        <CardHeader
          title="Resumo de campanhas"
          subtitle="Resultado consolidado por campanha, ordenado por receita."
        />
        <CampaignSummaryTable metricas={metricasCampanhas} />
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader
            title="Receita por campanha"
            subtitle="Top campanhas por receita confirmada."
          />
          <RevenueByCampaignChart metricas={metricasCampanhas} />
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader
            title="Reservas por plataforma"
            subtitle="Distribuição de origem das reservas."
          />
          <ReservationsByPlatformChart reservas={reservas} />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Ranking de campanhas"
            subtitle="As que mais geram receita."
          />
          <CampaignRanking metricas={metricasCampanhas} />
        </Card>
        <Card>
          <CardHeader
            title="Reservas recentes"
            subtitle="Últimos registros da equipe."
          />
          <RecentReservations reservas={reservas} campanhas={campanhas} />
        </Card>
      </div>

      <ReservationForm
        key={`dash-res-${reservaOpen}`}
        open={reservaOpen}
        onClose={() => setReservaOpen(false)}
      />
    </div>
  );
}
