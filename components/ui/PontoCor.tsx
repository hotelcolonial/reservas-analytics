import { cn } from "@/lib/utils";

/**
 * Cinza neutro do DS (`--color-subtle-fg`) para quem não tem cor definida.
 * É a mesma cor inicial que o formulário de naturezas usa.
 */
export const COR_NEUTRA = "#9da0a5";

/**
 * O ponto colorido que a tabela de lançamentos já usa ao lado da natureza,
 * extraído para as propriedades usarem o mesmo. O texto ao lado continua em
 * carvão — o contraste nunca depende da cor escolhida.
 */
export function PontoCor({
  cor,
  className,
}: {
  cor?: string | null;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-3 shrink-0 rounded-full border border-black/10",
        className,
      )}
      style={{ backgroundColor: cor || COR_NEUTRA }}
    />
  );
}
