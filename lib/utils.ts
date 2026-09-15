import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type {
  Plataforma,
  TipoCampanha,
  StatusCampanha,
  StatusReserva,
} from "./types";
import type { StatusLancamento } from "./typesGastos";

/** Junta classes condicionais e resolve conflitos de Tailwind (padrão shadcn). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
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

/**
 * Timestamp ISO (timestamptz do Postgres, ex. `2026-09-14T02:30:00+00:00`) →
 * `dd/mm/aaaa às hh:mm` no fuso LOCAL de quem lê. Um registro criado às 23:30
 * em São Paulo é 02:30 UTC do dia seguinte: cortar a string em `T` mostraria
 * o dia errado, por isso passa por `Date` e pelos getters locais (nunca por
 * `toISOString`). Uma data pura (`yyyy-mm-dd`, sem hora) vai para `formatDate`
 * sem passar por `Date`, que a leria como UTC e recuaria um dia.
 */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  if (!iso.includes("T")) return formatDate(iso);
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return formatDate(iso);
  const data = formatDate(localISO(d));
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${data} às ${hh}:${mm}`;
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

/**
 * Data de hoje em ISO (`yyyy-mm-dd`) no fuso LOCAL de quem abre a página.
 *
 * ⚠️ Nunca trocar por `new Date().toISOString()`: ele devolve a data em UTC.
 * No Brasil (UTC-3), das 21:00 à meia-noite isso vira o dia SEGUINTE — e o
 * app passa a marcar lançamento como atrasado um dia antes e a sugerir a
 * competência errada no fim do dia.
 */
export function todayISO(): string {
  return localISO(new Date());
}

/* ---------- Período (filtro por datas) ---------- */

/** Intervalo de datas. Campo vazio ("") significa "sem limite" desse lado. */
export interface Periodo {
  de: string; // ISO date ou ""
  ate: string; // ISO date ou ""
}

export const PERIODO_TUDO: Periodo = { de: "", ate: "" };

export type PresetPeriodo = "hoje" | "ontem" | "semana" | "mes" | "ano";

function localISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Constrói um intervalo a partir de um preset, ancorado em hoje. */
export function rangePreset(preset: PresetPeriodo): Periodo {
  const now = new Date();
  const ate = localISO(now);
  if (preset === "hoje") return { de: ate, ate };
  if (preset === "ontem") {
    const ontem = localISO(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
    );
    return { de: ontem, ate: ontem };
  }
  if (preset === "semana") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    return { de: localISO(start), ate };
  }
  if (preset === "mes") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { de: localISO(start), ate };
  }
  const start = new Date(now.getFullYear(), 0, 1);
  return { de: localISO(start), ate };
}

/** Ordena por `ordem` crescente, com desempate por nome para estabilidade. */
export function porOrdem<T extends { ordem: number; nome: string }>(
  arr: T[],
): T[] {
  return [...arr].sort(
    (a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome),
  );
}

/**
 * Campanhas oferecidas num seletor: exclui as pausadas, mas mantém a campanha
 * já vinculada (`manterId`) para não trocá-la em silêncio ao editar.
 */
export function porOrdemSelecionaveis<
  T extends { id: string; ordem: number; nome: string; status: string },
>(arr: T[], manterId?: string | null): T[] {
  return porOrdem(
    arr.filter((c) => c.status !== "pausada" || c.id === manterId),
  );
}

/** True se a data ISO cai dentro do período (limites inclusivos). */
export function dentroDoPeriodo(dataISO: string, periodo: Periodo): boolean {
  if (!dataISO) return false;
  const d = dataISO.split("T")[0];
  if (periodo.de && d < periodo.de) return false;
  if (periodo.ate && d > periodo.ate) return false;
  return true;
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
  ativa: "bg-carvao text-branco",
  pausada: "bg-coral/12 text-coral-dark",
  finalizada: "bg-carvao-50 text-subtle-fg",
};

export const STATUS_RESERVA_BADGE: Record<StatusReserva, string> = {
  confirmada: "bg-carvao text-branco",
  pendente: "bg-coral/12 text-coral-dark",
  cancelada: "bg-destructive/10 text-destructive",
};

/**
 * Status VISUAL de um lançamento: os três guardados + "atrasado", que é
 * derivado (pendente já vencido — `estaAtrasado` em calculationsGastos).
 * Cores: tokens `sucesso` / `atencao` / `destructive` de globals.css.
 * Vermelho só para o que já venceu.
 */
export type StatusLancamentoVisual = StatusLancamento | "atrasado";

export const STATUS_LANCAMENTO_VISUAL_LABELS: Record<
  StatusLancamentoVisual,
  string
> = {
  pago: "Pago",
  pendente: "Pendente",
  atrasado: "Atrasado",
  cancelado: "Cancelado",
};

/** Pill (fundo suave + texto na cor). */
export const STATUS_LANCAMENTO_BADGE: Record<StatusLancamentoVisual, string> = {
  pago: "bg-sucesso/10 text-sucesso",
  pendente: "bg-atencao/12 text-atencao",
  atrasado: "bg-destructive/10 text-destructive",
  cancelado: "bg-carvao-50 text-muted-fg", // subtle-fg não passa de 2.6:1
};

/** Ponto sólido, para selects e listas onde a pill seria pesada. */
export const STATUS_LANCAMENTO_PONTO: Record<StatusLancamentoVisual, string> = {
  pago: "bg-sucesso",
  pendente: "bg-atencao",
  atrasado: "bg-destructive",
  cancelado: "bg-subtle-fg",
};

/** Paleta dos gráficos: escala de cinzas do DS + coral como único acento. */
export const PLATAFORMA_CORES: Record<Plataforma, string> = {
  google_ads: "#101113", // carvão
  meta_ads: "#5e6166", // cinza médio
  organico: "#9da0a5", // cinza claro
  whatsapp_direto: "#f95738", // coral: o único acento
  outro: "#eae3da", // areia
};
