import { Card } from "@/components/ui/Card";
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
    <Card className="flex flex-col gap-3 p-5">
      <p className="text-sm font-medium text-colonial/55">{label}</p>
      <div className="flex items-end justify-between gap-2">
        <p className="font-display text-3xl font-extrabold leading-none tracking-tight text-colonial sm:text-[2rem]">
          {value}
        </p>
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
              trend.direction === "up"
                ? "bg-emerald-50 text-emerald-600"
                : "bg-rose-50 text-rose-600",
            )}
          >
            {trend.direction === "up" ? <ArrowUp /> : <ArrowDown />}
            {trend.label}
          </span>
        )}
      </div>
      {hint && <p className="truncate text-xs text-colonial/45">{hint}</p>}
    </Card>
  );
}
