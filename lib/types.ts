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

/**
 * Quem criou e quando (e quando mexeu por último). As 8 tabelas têm estas
 * colunas, preenchidas por TRIGGER no banco: o app só LÊ. Nunca mandar em
 * insert/update (o trigger de update ignora e força os valores anteriores).
 * Opcionais porque registros anteriores à auditoria não têm autor, e porque
 * um registro recém-criado (otimista) só ganha os valores no próximo load.
 */
export interface Auditoria {
  readonly criadoPor?: string | null; // uuid → perfis.id
  readonly criadoEm?: string | null; // timestamptz ISO
  readonly atualizadoEm?: string | null; // timestamptz ISO
}

/** Usuário do painel (public.perfis). Só leitura; quem cadastra é o Supabase. */
export interface Perfil {
  id: string; // uuid (auth.users.id)
  nome: string;
  email: string;
  papel: string;
  ativo: boolean;
}

/** Um negócio/hotel medido no painel (multipropriedade). */
export interface Propriedade extends Auditoria {
  id: string;
  nome: string;
  ordem: number; // ordem no seletor de propriedade
}

export interface Campanha extends Auditoria {
  id: string;
  propriedadeId: string; // a qual propriedade pertence
  nome: string;
  plataforma: Plataforma;
  tipo: TipoCampanha;
  status: StatusCampanha;
  ordem: number; // ordem manual usada nos selectores e listas
}

/** Verba gastada numa campanha num dia específico (o investimento é variável). */
export interface GastoDiario extends Auditoria {
  id: string;
  propriedadeId: string;
  campanhaId: string;
  data: string; // ISO date (yyyy-mm-dd) — dia em que a verba foi gasta
  valor: number; // em BRL
}

export interface Reserva extends Auditoria {
  id: string;
  propriedadeId: string;
  codigo: string; // identificador legível da reserva, ex.: "RES-0001"
  dataReserva: string; // ISO date — quando a reserva foi registrada
  checkIn: string; // ISO date
  checkOut: string; // ISO date
  campanhaId: string | null;
  plataforma: Plataforma;
  valor: number; // valor total em BRL
  pax: number; // hóspedes
  noites: number; // diárias
  veioDaCampanha: boolean; // marca informativa: a reserva realmente veio da campanha?
  status: StatusReserva; // interno; novas reservas entram como "confirmada"
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
