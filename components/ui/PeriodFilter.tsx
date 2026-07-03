"use client";

import { Input } from "@/components/ui/input";
import {
  cn,
  formatDate,
  rangePreset,
  PERIODO_TUDO,
  type Periodo,
  type PresetPeriodo,
} from "@/lib/utils";

const presets: { key: PresetPeriodo | "tudo"; label: string }[] = [
  { key: "tudo", label: "Tudo" },
  { key: "hoje", label: "Hoje" },
  { key: "ontem", label: "Ontem" },
  { key: "semana", label: "7 dias" },
  { key: "mes", label: "Este mês" },
  { key: "ano", label: "Este ano" },
];

function mesmoPeriodo(a: Periodo, b: Periodo): boolean {
  return a.de === b.de && a.ate === b.ate;
}

export function PeriodFilter({
  periodo,
  onChange,
}: {
  periodo: Periodo;
  onChange: (p: Periodo) => void;
}) {
  function aplicar(key: PresetPeriodo | "tudo") {
    onChange(key === "tudo" ? PERIODO_TUDO : rangePreset(key));
  }

  const ativo = (key: PresetPeriodo | "tudo") =>
    key === "tudo"
      ? mesmoPeriodo(periodo, PERIODO_TUDO)
      : mesmoPeriodo(periodo, rangePreset(key));

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-2.5 shadow-sm">
      <div className="flex flex-wrap gap-1">
        {presets.map((p) => (
          <button
            key={p.key}
            onClick={() => aplicar(p.key)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              ativo(p.key)
                ? "bg-colonial text-branco"
                : "text-colonial/70 hover:bg-colonial-50 hover:text-colonial",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Input
          type="date"
          aria-label="De"
          value={periodo.de}
          onChange={(e) => onChange({ ...periodo, de: e.target.value })}
          className="h-9 w-auto py-1.5"
        />
        <span className="text-colonial/40">—</span>
        <Input
          type="date"
          aria-label="Até"
          value={periodo.ate}
          onChange={(e) => onChange({ ...periodo, ate: e.target.value })}
          className="h-9 w-auto py-1.5"
        />
      </div>

      {(periodo.de || periodo.ate) && (
        <p className="w-full text-xs text-colonial/45 sm:w-auto">
          {periodo.de ? formatDate(periodo.de) : "início"} até{" "}
          {periodo.ate ? formatDate(periodo.ate) : "hoje"}
        </p>
      )}
    </div>
  );
}
