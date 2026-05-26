import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Campanha, Reserva } from "./types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** True when Supabase credentials are present. Falls back to mock data if false. */
export const supabaseConfigured = Boolean(url && key);

// Lazy initialization — avoids "supabaseUrl is required" error at build time
// when env vars are not set.
let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_client) {
    if (!supabaseConfigured) {
      throw new Error("Supabase credentials not configured");
    }
    _client = createClient(url, key);
  }
  return _client;
}

// ── Row ↔ Domain mappers ──────────────────────────────────────────────────────

type Row = Record<string, unknown>;

export function rowToCampanha(row: Row): Campanha {
  return {
    id: row.id as string,
    nome: row.nome as string,
    plataforma: row.plataforma as Campanha["plataforma"],
    tipo: row.tipo as Campanha["tipo"],
    dataInicio: row.data_inicio as string,
    dataFim: row.data_fim as string,
    investimento: Number(row.investimento),
    status: row.status as Campanha["status"],
    observacoes: (row.observacoes as string) || undefined,
    utm: (row.utm as string) || undefined,
  };
}

export function campanhaToRow(c: Campanha) {
  return {
    id: c.id,
    nome: c.nome,
    plataforma: c.plataforma,
    tipo: c.tipo,
    data_inicio: c.dataInicio,
    data_fim: c.dataFim,
    investimento: c.investimento,
    status: c.status,
    observacoes: c.observacoes ?? null,
    utm: c.utm ?? null,
  };
}

export function rowToReserva(row: Row): Reserva {
  return {
    id: row.id as string,
    codigo: row.codigo as string,
    dataReserva: row.data_reserva as string,
    checkIn: row.check_in as string,
    checkOut: row.check_out as string,
    campanhaId: (row.campanha_id as string | null) ?? null,
    plataforma: row.plataforma as Reserva["plataforma"],
    valor: Number(row.valor),
    pax: Number(row.pax),
    noites: Number(row.noites),
    tipoQuarto: (row.tipo_quarto as string) || undefined,
    status: row.status as Reserva["status"],
    atendente: (row.atendente as string) ?? "",
    observacoes: (row.observacoes as string) || undefined,
  };
}

export function reservaToRow(r: Reserva) {
  return {
    id: r.id,
    codigo: r.codigo,
    data_reserva: r.dataReserva,
    check_in: r.checkIn,
    check_out: r.checkOut,
    campanha_id: r.campanhaId,
    plataforma: r.plataforma,
    valor: r.valor,
    pax: r.pax,
    noites: r.noites,
    tipo_quarto: r.tipoQuarto ?? null,
    status: r.status,
    atendente: r.atendente,
    observacoes: r.observacoes ?? null,
  };
}
