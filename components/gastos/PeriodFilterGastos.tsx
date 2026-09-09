"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { rotuloCompetencia, somarMeses } from "@/lib/calculationsGastos";

/**
 * Filtro de período do módulo Gastos.
 *
 * Diferente do `PeriodFilter` das reservas: aqui a granularidade é o MÊS, não
 * o dia, porque o que se filtra é a `competencia` (`yyyy-mm`). Campo vazio de
 * um lado significa "sem limite" desse lado, igual ao outro filtro.
 */
export interface PeriodoCompetencia {
  de: string; // yyyy-mm ou ""
  ate: string; // yyyy-mm ou ""
}

export const COMPETENCIA_TUDO: PeriodoCompetencia = { de: "", ate: "" };

export type PresetCompetencia =
  | "mes"
  | "mesPassado"
  | "tres"
  | "seis"
  | "ano";

/** Intervalo de um preset, ancorado no mês de referência (`yyyy-mm`). */
export function rangeCompetencia(
  preset: PresetCompetencia,
  mesAtual: string,
): PeriodoCompetencia {
  if (preset === "mes") return { de: mesAtual, ate: mesAtual };
  if (preset === "mesPassado") {
    const anterior = somarMeses(mesAtual, -1);
    return { de: anterior, ate: anterior };
  }
  if (preset === "tres") return { de: somarMeses(mesAtual, -2), ate: mesAtual };
  if (preset === "seis") return { de: somarMeses(mesAtual, -5), ate: mesAtual };
  const ano = mesAtual.slice(0, 4);
  return { de: `${ano}-01`, ate: mesAtual };
}

/** True se a competência cai dentro do período (limites inclusivos). */
export function dentroDaCompetencia(
  competencia: string,
  periodo: PeriodoCompetencia,
): boolean {
  if (!competencia) return false;
  if (periodo.de && competencia < periodo.de) return false;
  if (periodo.ate && competencia > periodo.ate) return false;
  return true;
}

const presets: { key: PresetCompetencia | "tudo"; label: string }[] = [
  { key: "tudo", label: "Tudo" },
  { key: "mes", label: "Este mês" },
  { key: "mesPassado", label: "Mês passado" },
  { key: "tres", label: "3 meses" },
  { key: "seis", label: "6 meses" },
  { key: "ano", label: "Este ano" },
];

function mesmoPeriodo(a: PeriodoCompetencia, b: PeriodoCompetencia): boolean {
  return a.de === b.de && a.ate === b.ate;
}

export function PeriodFilterGastos({
  periodo,
  onChange,
  mesAtual,
}: {
  periodo: PeriodoCompetencia;
  onChange: (p: PeriodoCompetencia) => void;
  mesAtual: string;
}) {
  function aplicar(key: PresetCompetencia | "tudo") {
    onChange(
      key === "tudo" ? COMPETENCIA_TUDO : rangeCompetencia(key, mesAtual),
    );
  }

  const ativo = (key: PresetCompetencia | "tudo") =>
    key === "tudo"
      ? mesmoPeriodo(periodo, COMPETENCIA_TUDO)
      : mesmoPeriodo(periodo, rangeCompetencia(key, mesAtual));

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-2.5 shadow-sm">
      <div className="flex flex-wrap gap-1">
        {presets.map((p) => (
          <button
            key={p.key}
            onClick={() => aplicar(p.key)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-normal transition-colors",
              ativo(p.key)
                ? "bg-carvao text-branco"
                : "text-muted-fg hover:bg-carvao-50 hover:text-carvao",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Input
          type="month"
          aria-label="Competência de"
          className="h-9 w-auto"
          value={periodo.de}
          onChange={(e) => onChange({ ...periodo, de: e.target.value })}
        />
        <span className="text-muted-foreground">—</span>
        <Input
          type="month"
          aria-label="Competência até"
          className="h-9 w-auto"
          value={periodo.ate}
          onChange={(e) => onChange({ ...periodo, ate: e.target.value })}
        />
      </div>

      {(periodo.de || periodo.ate) && (
        <p className="w-full text-xs text-subtle-fg">
          Mostrando {periodo.de ? rotuloCompetencia(periodo.de) : "o início"} até{" "}
          {periodo.ate ? rotuloCompetencia(periodo.ate) : "hoje"}.
        </p>
      )}
    </div>
  );
}
