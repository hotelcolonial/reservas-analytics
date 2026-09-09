"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
import { useGastosStore } from "@/lib/storeGastos";
import { NavTabs, TABS_RESERVAS, TABS_GASTOS } from "./NavTabs";
import { CampaignForm } from "@/components/campaigns/CampaignForm";
import { ReservationForm } from "@/components/reservations/ReservationForm";

/** Qual módulo está aberto, derivado do pathname. */
type Modulo = "hub" | "reservas" | "gastos";

function moduloDoPathname(pathname: string): Modulo {
  if (pathname === "/") return "hub";
  if (pathname === "/gastos" || pathname.startsWith("/gastos/")) return "gastos";
  return "reservas";
}

/**
 * Marca. Sempre leva ao hub ("/") para trocar de módulo.
 * `nome` acompanha o módulo aberto: "ReservaTrack" no painel de reservas,
 * "GrowthDirect" (a marca guarda-chuva) no hub e no módulo de gastos.
 */
function Marca({ nome, subtitulo }: { nome: string; subtitulo?: string }) {
  return (
    <Link href="/" className="group flex items-center gap-2.5">
      {/* O logotipo é a marca em minúscula com o ponto coral (§1). Quando o
          logo-growthdirect-t.png entrar no repo, ele substitui este bloco. */}
      <span className="font-brand text-lg font-light tracking-tighter text-carvao lowercase sm:text-xl">
        {nome}
        <span className="text-coral">.</span>
      </span>
      {subtitulo && (
        <>
          <span className="hidden h-4 w-px bg-border lg:block" />
          <span className="hidden text-xs font-normal text-subtle-fg lowercase lg:block">
            {subtitulo}
          </span>
        </>
      )}
    </Link>
  );
}

function PropriedadeSelector() {
  const propriedades = useStore((s) => s.propriedades);
  const propriedadeAtivaId = useStore((s) => s.propriedadeAtivaId);
  const setPropriedadeAtiva = useStore((s) => s.setPropriedadeAtiva);

  if (propriedades.length === 0) return null;

  return (
    <Select value={propriedadeAtivaId} onValueChange={setPropriedadeAtiva}>
      <SelectTrigger
        aria-label="propriedade"
        className="h-9 gap-2 border-border bg-card font-normal text-carvao"
      >
        <Building2 className="size-4 text-muted-fg" />
        <SelectValue placeholder="propriedade" />
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

const ROTA_LANCAMENTOS = "/gastos/lancamentos";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const modulo = moduloDoPathname(pathname);
  const pedirNovoLancamento = useGastosStore((s) => s.pedirNovoLancamento);
  const [reservaOpen, setReservaOpen] = useState(false);
  const [campanhaOpen, setCampanhaOpen] = useState(false);

  const barra = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8";

  /**
   * Liga o sinal que a página de lançamentos escuta para abrir o Sheet. Se
   * estivermos em outra rota do módulo, navega para lá primeiro — a página
   * consome o sinal ao montar.
   */
  function novoLancamento() {
    pedirNovoLancamento();
    if (pathname !== ROTA_LANCAMENTOS) router.push(ROTA_LANCAMENTOS);
  }

  // Hub: só a marca, sem nav e sem seletor de propriedade.
  if (modulo === "hub") {
    return (
      <header className="sticky top-0 z-30 border-b border-border bg-branco/78 backdrop-blur-[14px] backdrop-saturate-150">
        <div className={barra}>
          <div className="flex h-16 items-center">
            <Marca nome="GrowthDirect" />
          </div>
        </div>
      </header>
    );
  }

  // Gastos: nav próprio, sem seletor de propriedade e sem os botões do
  // módulo de reservas (gastos vivem fora do escopo de propriedade).
  if (modulo === "gastos") {
    return (
      <header className="sticky top-0 z-30 border-b border-border bg-branco/78 backdrop-blur-[14px] backdrop-saturate-150">
        <div className={barra}>
          <div className="flex h-16 items-center justify-between gap-4">
            <Marca nome="GrowthDirect" subtitulo="gastos do escritório" />
            <Button size="sm" onClick={novoLancamento}>
              + novo lançamento
            </Button>
          </div>
          <div className="pb-3">
            <NavTabs tabs={TABS_GASTOS} />
          </div>
        </div>
      </header>
    );
  }

  // Reservas: o header completo de sempre.
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-branco/78 backdrop-blur-[14px] backdrop-saturate-150">
        <div className={barra}>
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Marca nome="ReservaTrack" subtitulo="campanhas e reservas" />
              <span className="hidden h-6 w-px bg-border sm:block" />
              <PropriedadeSelector />
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCampanhaOpen(true)}
              >
                nova campanha
              </Button>
              <Button size="sm" onClick={() => setReservaOpen(true)}>
                + nova reserva
              </Button>
            </div>
          </div>

          <div className="pb-3">
            <NavTabs tabs={TABS_RESERVAS} />
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
