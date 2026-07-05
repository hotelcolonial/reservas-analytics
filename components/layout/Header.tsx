"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { NavTabs } from "./NavTabs";
import { CampaignForm } from "@/components/campaigns/CampaignForm";
import { ReservationForm } from "@/components/reservations/ReservationForm";

function PropriedadeSelector() {
  const propriedades = useStore((s) => s.propriedades);
  const propriedadeAtivaId = useStore((s) => s.propriedadeAtivaId);
  const setPropriedadeAtiva = useStore((s) => s.setPropriedadeAtiva);

  if (propriedades.length === 0) return null;

  return (
    <Select value={propriedadeAtivaId} onValueChange={setPropriedadeAtiva}>
      <SelectTrigger
        aria-label="Propriedade"
        className="h-9 gap-2 border-border bg-card font-medium text-colonial"
      >
        <Building2 className="size-4 text-colonial/60" />
        <SelectValue placeholder="Propriedade" />
      </SelectTrigger>
      <SelectContent>
        {propriedades.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.nome}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function Header() {
  const [reservaOpen, setReservaOpen] = useState(false);
  const [campanhaOpen, setCampanhaOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Link href="/" className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-colonial font-display text-lg font-bold text-laranja">
                  R
                </span>
                <div className="hidden leading-tight sm:block">
                  <p className="font-display text-base font-semibold text-colonial sm:text-lg">
                    ReservaTrack
                  </p>
                  <p className="hidden text-xs text-colonial/50 lg:block">
                    Painel de campanhas · reservas
                  </p>
                </div>
              </Link>
              <span className="hidden h-6 w-px bg-border sm:block" />
              <PropriedadeSelector />
            </div>

            <div className="flex items-center gap-3">
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
