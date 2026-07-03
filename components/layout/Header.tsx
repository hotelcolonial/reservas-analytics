"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NavTabs } from "./NavTabs";
import { CampaignForm } from "@/components/campaigns/CampaignForm";
import { ReservationForm } from "@/components/reservations/ReservationForm";

export function Header() {
  const [reservaOpen, setReservaOpen] = useState(false);
  const [campanhaOpen, setCampanhaOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-colonial font-display text-lg font-bold text-laranja">
                R
              </span>
              <div className="leading-tight">
                <p className="font-display text-base font-semibold text-colonial sm:text-lg">
                  ReservaTrack Colonial
                </p>
                <p className="hidden text-xs text-colonial/50 sm:block">
                  Hotel Colonial · WhatsApp Booking Tracker
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-xl bg-colonial-50 px-3 py-1.5 md:flex">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-colonial text-xs font-semibold text-branco">
                  ER
                </span>
                <span className="text-sm font-medium text-colonial">
                  Equipe Reservas
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCampanhaOpen(true)}
              >
                Nova Campanha
              </Button>
              <Button size="sm" onClick={() => setReservaOpen(true)}>
                + Nova Reserva
              </Button>
            </div>
          </div>

          <div className="pb-3">
            <NavTabs />
          </div>
        </div>
      </header>

      <CampaignForm
        key={`header-camp-${campanhaOpen}`}
        open={campanhaOpen}
        onClose={() => setCampanhaOpen(false)}
      />
      <ReservationForm
        key={`header-res-${reservaOpen}`}
        open={reservaOpen}
        onClose={() => setReservaOpen(false)}
      />
    </>
  );
}
