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
              stroke="#e6ded2"
              strokeWidth={stroke}
              strokeDasharray={trackDash}
              strokeLinecap="round"
            />
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="#f3a42c"
              strokeWidth={stroke}
              strokeDasharray={progressDash}
              strokeLinecap="round"
            />
          </g>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs font-medium text-colonial/45">Confirmação</span>
          <span className="font-display text-3xl font-extrabold tracking-tight text-colonial">
            {Math.round(pct * 100)}%
          </span>
        </div>
      </div>

      <div className="text-center sm:text-left">
        <p className="font-display text-3xl font-extrabold tracking-tight text-colonial">
          {confirmadas}
          <span className="text-xl font-semibold text-colonial/35"> / {total}</span>
        </p>
        <p className="mt-1 text-sm text-colonial/55">
          reservas confirmadas do total registrado
        </p>
      </div>
    </div>
  );
}
