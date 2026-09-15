import type { Lancamento } from "@/lib/typesGastos";
import { estaAtrasado } from "@/lib/calculationsGastos";
import {
  cn,
  STATUS_LANCAMENTO_BADGE,
  STATUS_LANCAMENTO_PONTO,
  STATUS_LANCAMENTO_VISUAL_LABELS,
  type StatusLancamentoVisual,
} from "@/lib/utils";

/**
 * Status visual de um lançamento. "Atrasado" continua derivado (pendente já
 * vencido, via `estaAtrasado`) — aqui só se escolhe a cor. Regra: vermelho
 * SÓ para o que já venceu; pendente no prazo é amarelo.
 */
export function statusVisual(
  lancamento: Lancamento,
  hoje: string,
): StatusLancamentoVisual {
  if (estaAtrasado(lancamento, hoje)) return "atrasado";
  return lancamento.status;
}

/** Pill com o texto do status. Usada na tabela de lançamentos. */
export function StatusBadge({
  lancamento,
  hoje,
}: {
  lancamento: Lancamento;
  hoje: string;
}) {
  const status = statusVisual(lancamento, hoje);
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-normal",
        STATUS_LANCAMENTO_BADGE[status],
      )}
    >
      {STATUS_LANCAMENTO_VISUAL_LABELS[status]}
    </span>
  );
}

/** Ponto sólido na cor do status: selects, filtros e listas compactas. */
export function PontoStatus({
  status,
  className,
}: {
  status: StatusLancamentoVisual;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-2.5 shrink-0 rounded-full",
        STATUS_LANCAMENTO_PONTO[status],
        className,
      )}
    />
  );
}
