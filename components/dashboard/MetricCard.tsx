import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  hint?: string;
  /** Destaca o card (cor da marca) — usado em métricas principais. */
  accent?: "default" | "colonial" | "laranja";
  icon?: React.ReactNode;
}

export function MetricCard({
  label,
  value,
  hint,
  accent = "default",
  icon,
}: MetricCardProps) {
  const isDark = accent === "colonial";
  const isOrange = accent === "laranja";

  return (
    <Card
      className={cn(
        "flex flex-col justify-between gap-3",
        isDark && "border-transparent bg-colonial text-branco",
        isOrange && "border-transparent bg-laranja text-colonial",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className={cn(
            "text-sm font-medium",
            isDark ? "text-branco/70" : isOrange ? "text-colonial/70" : "text-colonial/60",
          )}
        >
          {label}
        </p>
        {icon && (
          <span
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              isDark
                ? "bg-branco/10 text-laranja"
                : isOrange
                  ? "bg-colonial/10 text-colonial"
                  : "bg-colonial-50 text-colonial",
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <div>
        <p
          className={cn(
            "font-display text-3xl font-semibold leading-tight tracking-tight",
            isDark ? "text-branco" : "text-colonial",
          )}
        >
          {value}
        </p>
        {hint && (
          <p
            className={cn(
              "mt-1 truncate text-xs",
              isDark ? "text-branco/60" : isOrange ? "text-colonial/60" : "text-colonial/50",
            )}
          >
            {hint}
          </p>
        )}
      </div>
    </Card>
  );
}
