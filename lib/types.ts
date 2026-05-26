export type Plataforma =
  | "google_ads"
  | "meta_ads"
  | "organico"
  | "whatsapp_direto"
  | "outro";

export type TipoCampanha =
  | "promocao"
  | "feriado"
  | "pacote"
  | "day_use"
  | "institucional"
  | "remarketing"
  | "outro";

export type StatusCampanha = "ativa" | "pausada" | "finalizada";

export type StatusReserva = "confirmada" | "pendente" | "cancelada";

export interface Campanha {
  id: string;
  nome: string;
  plataforma: Plataforma;
  tipo: TipoCampanha;
  dataInicio: string; // ISO date (yyyy-mm-dd)
  dataFim: string; // ISO date (yyyy-mm-dd)
  investimento: number; // em BRL
  status: StatusCampanha;
  observacoes?: string;
  utm?: string;
}

export interface Reserva {
  id: string;
  cliente: string;
  telefone: string;
  dataReserva: string; // ISO date — quando a reserva foi registrada
  checkIn: string; // ISO date
  checkOut: string; // ISO date
  campanhaId: string | null;
  plataforma: Plataforma;
  valor: number; // valor total em BRL
  pax: number; // hóspedes
  noites: number; // diárias
  tipoQuarto?: string;
  status: StatusReserva;
  atendente: string;
  observacoes?: string;
}

/** Métricas agregadas de uma campanha. Campos com divisão por zero ficam `null` → "N/A". */
export interface MetricasCampanha {
  campanha: Campanha;
  investimento: number;
  totalReservas: number; // todas as reservas vinculadas
  reservasConfirmadas: number;
  receita: number; // soma das confirmadas
  roi: number | null; // %
  roas: number | null;
  ticketMedio: number | null;
  custoPorReserva: number | null;
  pax: number;
  noites: number;
}

export interface MetricasPlataforma {
  plataforma: Plataforma;
  investimento: number;
  totalReservas: number;
  reservasConfirmadas: number;
  receita: number;
  roi: number | null;
  roas: number | null;
  custoPorReserva: number | null;
}

export interface MetricasDashboard {
  totalReservas: number;
  receitaTotal: number;
  investimentoTotal: number;
  roiGeral: number | null;
  roasGeral: number | null;
  ticketMedio: number | null;
  totalPax: number;
  totalNoites: number;
  campanhaMaiorReceita: MetricasCampanha | null;
  campanhaMelhorRoi: MetricasCampanha | null;
}
