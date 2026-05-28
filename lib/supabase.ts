import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Campanha, Reserva, GastoDiario } from "./types";

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
    status: row.status as Campanha["status"],
    ordem: Number(row.ordem ?? 0),
  };
}

export function campanhaToRow(c: Campanha) {
  return {
    id: c.id,
    nome: c.nome,
    plataforma: c.plataforma,
    tipo: c.tipo,
    status: c.status,
    ordem: c.ordem,
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
    veioDaCampanha: Boolean(row.veio_da_campanha),
    status: row.status as Reserva["status"],
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
    veio_da_campanha: r.veioDaCampanha,
    status: r.status,
  };
}

export function rowToGasto(row: Row): GastoDiario {
  return {
    id: row.id as string,
    campanhaId: row.campanha_id as string,
    data: row.data as string,
    valor: Number(row.valor),
  };
}

export function gastoToRow(g: GastoDiario) {
  return {
    id: g.id,
    campanha_id: g.campanhaId,
    data: g.data,
    valor: g.valor,
  };
}
