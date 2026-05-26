import type {
  Campanha,
  Reserva,
  GastoDiario,
  Plataforma,
  MetricasCampanha,
  MetricasPlataforma,
  MetricasDashboard,
} from "./types";

/** Divisão segura: retorna null se o divisor for 0 (→ "N/A" na UI). */
function safeDiv(num: number, den: number): number | null {
  if (!den) return null;
  return num / den;
}

function roi(receita: number, investimento: number): number | null {
  if (!investimento) return null;
  return ((receita - investimento) / investimento) * 100;
}

function isConfirmada(r: Reserva): boolean {
  return r.status === "confirmada";
}

/** Verba total gasta numa campanha (soma dos gastos diários informados). */
export function investimentoDaCampanha(
  campanhaId: string,
  gastos: GastoDiario[],
): number {
  return gastos
    .filter((g) => g.campanhaId === campanhaId)
    .reduce((acc, g) => acc + g.valor, 0);
}

/**
 * Métricas de uma campanha. `reservas` e `gastos` já vêm filtrados pelo
 * período selecionado na página (quando houver filtro).
 */
export function metricasCampanha(
  campanha: Campanha,
  reservas: Reserva[],
  gastos: GastoDiario[],
): MetricasCampanha {
  const doCampanha = reservas.filter((r) => r.campanhaId === campanha.id);
  const confirmadas = doCampanha.filter(isConfirmada);
  const receita = confirmadas.reduce((acc, r) => acc + r.valor, 0);
  const investimento = investimentoDaCampanha(campanha.id, gastos);

  return {
    campanha,
    investimento,
    totalReservas: doCampanha.length,
    reservasConfirmadas: confirmadas.length,
    receita,
    roi: roi(receita, investimento),
    roas: safeDiv(receita, investimento),
    ticketMedio: safeDiv(receita, confirmadas.length),
    custoPorReserva: safeDiv(investimento, confirmadas.length),
    pax: confirmadas.reduce((acc, r) => acc + r.pax, 0),
    noites: confirmadas.reduce((acc, r) => acc + r.noites, 0),
  };
}

export function metricasTodasCampanhas(
  campanhas: Campanha[],
  reservas: Reserva[],
  gastos: GastoDiario[],
): MetricasCampanha[] {
  return campanhas.map((c) => metricasCampanha(c, reservas, gastos));
}

/** Investimento de uma plataforma = soma dos gastos das campanhas dela. */
function investimentoDaPlataforma(
  plataforma: Plataforma,
  campanhas: Campanha[],
  gastos: GastoDiario[],
): number {
  const idsDaPlataforma = new Set(
    campanhas.filter((c) => c.plataforma === plataforma).map((c) => c.id),
  );
  return gastos
    .filter((g) => idsDaPlataforma.has(g.campanhaId))
    .reduce((acc, g) => acc + g.valor, 0);
}

export function metricasPlataforma(
  plataforma: Plataforma,
  campanhas: Campanha[],
  reservas: Reserva[],
  gastos: GastoDiario[],
): MetricasPlataforma {
  const investimento = investimentoDaPlataforma(plataforma, campanhas, gastos);

  const daPlataforma = reservas.filter((r) => r.plataforma === plataforma);
  const confirmadas = daPlataforma.filter(isConfirmada);
  const receita = confirmadas.reduce((acc, r) => acc + r.valor, 0);

  return {
    plataforma,
    investimento,
    totalReservas: daPlataforma.length,
    reservasConfirmadas: confirmadas.length,
    receita,
    roi: roi(receita, investimento),
    roas: safeDiv(receita, investimento),
    custoPorReserva: safeDiv(investimento, confirmadas.length),
  };
}

/** Métricas globais para os cards do dashboard. */
export function metricasDashboard(
  campanhas: Campanha[],
  reservas: Reserva[],
  gastos: GastoDiario[],
): MetricasDashboard {
  const confirmadas = reservas.filter(isConfirmada);
  const receitaTotal = confirmadas.reduce((acc, r) => acc + r.valor, 0);
  const investimentoTotal = gastos.reduce((acc, g) => acc + g.valor, 0);

  const porCampanha = metricasTodasCampanhas(campanhas, reservas, gastos);

  const campanhaMaiorReceita =
    porCampanha.length > 0
      ? porCampanha.reduce((best, m) => (m.receita > best.receita ? m : best))
      : null;

  // Melhor ROI considerando apenas campanhas com ROI calculável e ao menos 1 reserva.
  const comRoi = porCampanha.filter(
    (m) => m.roi !== null && m.reservasConfirmadas > 0,
  );
  const campanhaMelhorRoi =
    comRoi.length > 0
      ? comRoi.reduce((best, m) =>
          (m.roi ?? -Infinity) > (best.roi ?? -Infinity) ? m : best,
        )
      : null;

  return {
    totalReservas: reservas.length,
    receitaTotal,
    investimentoTotal,
    roiGeral: roi(receitaTotal, investimentoTotal),
    roasGeral: safeDiv(receitaTotal, investimentoTotal),
    ticketMedio: safeDiv(receitaTotal, confirmadas.length),
    totalPax: confirmadas.reduce((acc, r) => acc + r.pax, 0),
    totalNoites: confirmadas.reduce((acc, r) => acc + r.noites, 0),
    campanhaMaiorReceita,
    campanhaMelhorRoi,
  };
}

export function metricasTodasPlataformas(
  campanhas: Campanha[],
  reservas: Reserva[],
  gastos: GastoDiario[],
): MetricasPlataforma[] {
  const usadas = new Set<Plataforma>();
  campanhas.forEach((c) => usadas.add(c.plataforma));
  reservas.forEach((r) => usadas.add(r.plataforma));
  const ordem: Plataforma[] = [
    "google_ads",
    "meta_ads",
    "organico",
    "whatsapp_direto",
    "outro",
  ];
  return ordem
    .filter((p) => usadas.has(p))
    .map((p) => metricasPlataforma(p, campanhas, reservas, gastos));
}
