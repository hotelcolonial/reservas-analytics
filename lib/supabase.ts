import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Campanha, Reserva, GastoDiario, Propriedade } from "./types";

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

// ── Leitura paginada ──────────────────────────────────────────────────────────

/** Uma linha crua vinda do PostgREST, antes de passar por um mapper. */
export type Row = Record<string, unknown>;

/**
 * Fetches every row of a table, paginating in batches of 1000.
 *
 * Supabase/PostgREST caps a single `select` at 1000 rows by default, so a
 * plain `.select("*")` silently drops anything beyond the first 1000. This
 * loops with `.range()` until fewer than a full page comes back.
 */
export async function fetchAll(
  table: string,
  orderColumn: string,
): Promise<{ data: Row[]; error: string | null }> {
  const PAGE = 1000;
  const all: Row[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await getSupabase()
      .from(table)
      .select("*")
      .order(orderColumn, { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) return { data: all, error: error.message };
    if (!data || data.length === 0) break;
    all.push(...(data as Row[]));
    if (data.length < PAGE) break;
  }
  return { data: all, error: null };
}

// ── Row ↔ Domain mappers ──────────────────────────────────────────────────────

export function rowToPropriedade(row: Row): Propriedade {
  return {
    id: row.id as string,
    nome: row.nome as string,
    ordem: Number(row.ordem ?? 0),
  };
}

export function propriedadeToRow(p: Propriedade) {
  return {
    id: p.id,
    nome: p.nome,
    ordem: p.ordem,
  };
}

export function rowToCampanha(row: Row): Campanha {
  return {
    id: row.id as string,
    propriedadeId: (row.propriedade_id as string | null) ?? "",
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
    propriedade_id: c.propriedadeId,
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
    propriedadeId: (row.propriedade_id as string | null) ?? "",
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
    propriedade_id: r.propriedadeId,
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
    propriedadeId: (row.propriedade_id as string | null) ?? "",
    campanhaId: row.campanha_id as string,
    data: row.data as string,
    valor: Number(row.valor),
  };
}

export function gastoToRow(g: GastoDiario) {
  return {
    id: g.id,
    propriedade_id: g.propriedadeId,
    campanha_id: g.campanhaId,
    data: g.data,
    valor: g.valor,
  };
}
