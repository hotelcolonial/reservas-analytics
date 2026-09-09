/**
 * Domínio do módulo Gastos — GrowthDirect (ver GASTOS.md).
 *
 * Estas entidades vivem FORA do escopo de propriedade: nenhuma tem
 * `propriedadeId`. É a exceção declarada à regra 4 do checklist de
 * ARQUITETURA.md.
 */

export type Bandeira = "visa" | "mastercard" | "elo" | "amex" | "outro";

export type GrupoNatureza = "interno" | "plataformas" | "outro";

export type Periodicidade = "semanal" | "mensal" | "anual";

export type FormaPagamento =
  | "cartao_credito"
  | "pix"
  | "boleto"
  | "debito"
  | "dinheiro";

export type StatusLancamento = "pendente" | "pago" | "cancelado";

/** Cartão usado para pagar despesas. */
export interface Cartao {
  id: string;
  nome: string;
  bandeira: Bandeira;
  final: string; // exatamente 4 dígitos — NUNCA o número completo
  titular: string;
  ativo: boolean;
  ordem: number; // ordem manual nas listas e selects
}

/** Categoria de gasto. `cor` alimenta os gráficos. */
export interface Natureza {
  id: string;
  nome: string;
  grupo: GrupoNatureza;
  cor: string; // hex
  ordem: number;
}

/** Modelo de gasto que se repete. Gera lançamentos. */
export interface DespesaRecorrente {
  id: string;
  nome: string;
  descricao: string;
  naturezaId: string;
  fornecedor: string;
  formaPagamento: FormaPagamento;
  cartaoId: string | null; // só quando formaPagamento === "cartao_credito"
  valorPrevisto: number;
  periodicidade: Periodicidade;
  /** Semanal: dia da semana 0-6 (0 = domingo). Mensal e anual: dia do mês 1-31. */
  diaVencimento: number;
  mesVencimento: number | null; // 1-12, só para anual
  ativa: boolean;
  inicio: string; // ISO date (yyyy-mm-dd)
  fim: string | null; // ISO date, nullable
}

/** Um gasto concreto. */
export interface Lancamento {
  id: string;
  descricao: string;
  naturezaId: string;
  fornecedor: string;
  formaPagamento: FormaPagamento;
  cartaoId: string | null; // só quando formaPagamento === "cartao_credito"
  valor: number;
  competencia: string; // yyyy-mm — mês a que o gasto pertence
  dataVencimento: string; // ISO date
  dataPagamento: string | null; // ISO date. Se preenchida, status deve ser "pago"
  status: StatusLancamento;
  comprovanteUrl: string | null;
  observacoes: string;
  despesaRecorrenteId: string | null; // null = gasto avulso
  criadoEm: string; // ISO date
}

/* ---------- Labels PT-BR e ordens para os selects ---------- */

export const BANDEIRAS: Bandeira[] = [
  "visa",
  "mastercard",
  "elo",
  "amex",
  "outro",
];

export const BANDEIRA_LABELS: Record<Bandeira, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  elo: "Elo",
  amex: "Amex",
  outro: "Outro",
};

export const GRUPOS_NATUREZA: GrupoNatureza[] = [
  "interno",
  "plataformas",
  "outro",
];

export const GRUPO_NATUREZA_LABELS: Record<GrupoNatureza, string> = {
  interno: "Interno",
  plataformas: "Plataformas",
  outro: "Outro",
};

export const PERIODICIDADES: Periodicidade[] = ["semanal", "mensal", "anual"];

export const PERIODICIDADE_LABELS: Record<Periodicidade, string> = {
  semanal: "Semanal",
  mensal: "Mensal",
  anual: "Anual",
};

export const FORMAS_PAGAMENTO: FormaPagamento[] = [
  "cartao_credito",
  "pix",
  "boleto",
  "debito",
  "dinheiro",
];

export const FORMA_PAGAMENTO_LABELS: Record<FormaPagamento, string> = {
  cartao_credito: "Cartão de crédito",
  pix: "Pix",
  boleto: "Boleto",
  debito: "Débito",
  dinheiro: "Dinheiro",
};

export const STATUS_LANCAMENTO: StatusLancamento[] = [
  "pendente",
  "pago",
  "cancelado",
];

export const STATUS_LANCAMENTO_LABELS: Record<StatusLancamento, string> = {
  pendente: "Pendente",
  pago: "Pago",
  cancelado: "Cancelado",
};

/** Dias da semana, para `diaVencimento` quando a periodicidade é semanal. */
export const DIAS_SEMANA: number[] = [0, 1, 2, 3, 4, 5, 6];

export const DIAS_SEMANA_LABELS: Record<number, string> = {
  0: "Domingo",
  1: "Segunda-feira",
  2: "Terça-feira",
  3: "Quarta-feira",
  4: "Quinta-feira",
  5: "Sexta-feira",
  6: "Sábado",
};

/** Forma plural usada nas frases: "Semanal, às segundas". */
export const DIAS_SEMANA_PLURAL: Record<number, string> = {
  0: "aos domingos",
  1: "às segundas",
  2: "às terças",
  3: "às quartas",
  4: "às quintas",
  5: "às sextas",
  6: "aos sábados",
};

/** Meses 1-12, para `mesVencimento` quando a periodicidade é anual. */
export const MESES: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export const MESES_LABELS: Record<number, string> = {
  1: "Janeiro",
  2: "Fevereiro",
  3: "Março",
  4: "Abril",
  5: "Maio",
  6: "Junho",
  7: "Julho",
  8: "Agosto",
  9: "Setembro",
  10: "Outubro",
  11: "Novembro",
  12: "Dezembro",
};
