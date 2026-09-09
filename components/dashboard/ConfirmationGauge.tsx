"use client";

interface ConfirmationGaugeProps {
  confirmadas: number;
  total: number;
}

/** Gauge circular (taxa de confirmação) inspirado no card "Sales Targets". */
export function ConfirmationGauge({ confirmadas, total }: ConfirmationGaugeProps) {
  const pct = total > 0 ? confirmadas / total : 0;
  const size = 168;
  const stroke = 16;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;

  // Arco de 270° (deixa 90° aberto na base).
  const sweep = 0.75;
  const circ = 2 * Math.PI * r;
  const trackDash = `${circ * sweep} ${circ}`;
  const progressDash = `${circ * sweep * pct} ${circ}`;
  // Gira para abrir na base (centro do gap embaixo).
  const rotation = 135;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-7">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          <g transform={`rotate(${rotation} ${cx} ${cy})`}>
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="rgba(16,17,19,0.10)"
              strokeWidth={stroke}
              strokeDasharray={trackDash}
              strokeLinecap="round"
            />
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="#f95738"
              strokeWidth={stroke}
              strokeDasharray={progressDash}
              strokeLinecap="round"
            />
          </g>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs font-normal text-subtle-fg">Confirmação</span>
          <span className="font-brand text-3xl font-light tracking-tight text-carvao">
            {Math.round(pct * 100)}%
          </span>
        </div>
      </div>

      <div className="text-center sm:text-left">
        <p className="font-brand text-3xl font-light tracking-tight text-carvao">
          {confirmadas}
          <span className="text-xl font-normal text-subtle-fg"> / {total}</span>
        </p>
        <p className="mt-3 max-w-2xl text-[clamp(15px,1.1vw,17px)] leading-relaxed text-muted-fg">
          reservas confirmadas do total registrado
        </p>
      </div>
    </div>
  );
}
