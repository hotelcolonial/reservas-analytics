import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  hint?: string;
  trend?: {
    direction: "up" | "down";
    label: string;
  } | null;
}

function ArrowUp() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}

function ArrowDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 7 17 17M17 9v8H9" />
    </svg>
  );
}

export function MetricCard({ label, value, hint, trend }: MetricCardProps) {
  return (
    <Card className="flex flex-col gap-2.5 border-0 bg-carvao-50 p-[clamp(18px,2vw,26px)] shadow-none">
      {/* O selo de tendência fica na linha do rótulo, não na do valor: quando
          dividia a linha com o número, "receita total" (a única métrica com
          selo) perdia largura e quebrava em duas linhas. */}
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-xs font-normal tracking-[0.02em] text-muted-fg lowercase">
          {label}
        </p>
        {trend && (
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-normal lowercase",
              trend.direction === "up"
                ? "bg-branco text-carvao"
                : "bg-destructive/10 text-destructive",
            )}
          >
            {trend.direction === "up" ? <ArrowUp /> : <ArrowDown />}
            {trend.label}
          </span>
        )}
      </div>

      {/* Largura inteira do card e sem quebra: o valor é o dado, não pode
          partir nem ser cortado. A escala fica abaixo da do DS por isso. */}
      <p className="font-brand text-[clamp(19px,1.75vw,26px)] leading-[1.15] font-light tracking-[-0.04em] whitespace-nowrap text-carvao tabular-nums">
        {value}
      </p>

      {hint && <p className="truncate text-xs lowercase text-subtle-fg">{hint}</p>}
    </Card>
  );
}
