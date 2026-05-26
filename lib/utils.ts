import type {
  Plataforma,
  TipoCampanha,
  StatusCampanha,
  StatusReserva,
} from "./types";

/** Junta classes condicionais (substituto leve de clsx). */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/* ---------- Formatação ---------- */

const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatBRL(value: number): string {
  return brlFormatter.format(value || 0);
}

/** Versão compacta para eixos de gráfico: R$ 12,5 mil */
export function formatBRLCompact(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `R$ ${(value / 1000).toLocaleString("pt-BR", {
      maximumFractionDigits: 1,
    })} mil`;
  }
  return formatBRL(value);
}

/** Recebe data ISO (yyyy-mm-dd) e devolve dd/mm/aaaa sem problemas de fuso. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [year, month, day] = iso.split("T")[0].split("-");
  if (!year || !month || !day) return "—";
  return `${day}/${month}/${year}`;
}

export function formatPercent(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "N/A";
  return `${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })}%`;
}

export function formatNumber(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "N/A";
  return value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

export function formatMultiplier(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "N/A";
  return `${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  })}x`;
}

/** Diferença em noites entre check-in e check-out (>= 0). */
export function calcNoites(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);
  const ms = outDate.getTime() - inDate.getTime();
  if (Number.isNaN(ms)) return 0;
  const dias = Math.round(ms / (1000 * 60 * 60 * 24));
  return dias > 0 ? dias : 0;
}

export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

/* ---------- Labels PT-BR ---------- */

export const PLATAFORMA_LABELS: Record<Plataforma, string> = {
  google_ads: "Google Ads",
  meta_ads: "Meta Ads",
  organico: "Orgânico",
  whatsapp_direto: "WhatsApp Direto",
  outro: "Outro",
};

export const PLATAFORMAS: Plataforma[] = [
  "google_ads",
  "meta_ads",
  "organico",
  "whatsapp_direto",
  "outro",
];

export const TIPO_CAMPANHA_LABELS: Record<TipoCampanha, string> = {
  promocao: "Promoção",
  feriado: "Feriado",
  pacote: "Pacote",
  day_use: "Day Use",
  institucional: "Institucional",
  remarketing: "Remarketing",
  outro: "Outro",
};

export const TIPOS_CAMPANHA: TipoCampanha[] = [
  "promocao",
  "feriado",
  "pacote",
  "day_use",
  "institucional",
  "remarketing",
  "outro",
];

export const STATUS_CAMPANHA_LABELS: Record<StatusCampanha, string> = {
  ativa: "Ativa",
  pausada: "Pausada",
  finalizada: "Finalizada",
};

export const STATUS_RESERVA_LABELS: Record<StatusReserva, string> = {
  confirmada: "Confirmada",
  pendente: "Pendente",
  cancelada: "Cancelada",
};

/* ---------- Estilos de badge por status ---------- */

export const STATUS_CAMPANHA_BADGE: Record<StatusCampanha, string> = {
  ativa: "bg-colonial text-branco",
  pausada: "bg-laranja/15 text-laranja-dark",
  finalizada: "bg-neutral-200 text-neutral-600",
};

export const STATUS_RESERVA_BADGE: Record<StatusReserva, string> = {
  confirmada: "bg-emerald-100 text-emerald-700",
  pendente: "bg-amber-100 text-amber-700",
  cancelada: "bg-rose-100 text-rose-700",
};

/** Paleta usada nos gráficos por plataforma (tons da marca). */
export const PLATAFORMA_CORES: Record<Plataforma, string> = {
  google_ads: "#122b1c", // verde principal
  meta_ads: "#233d20", // verde secundário
  organico: "#6b8f71", // verde médio
  whatsapp_direto: "#f3a42c", // laranja destaque
  outro: "#c9bfae", // bege
};
