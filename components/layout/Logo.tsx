import Image from "next/image";
import { cn } from "@/lib/utils";
import horizontal from "@/public/logo/growthdirect.png";
import vertical from "@/public/logo/growthdirect-vertical.png";
import simbolo from "@/public/logo/growthdirect-simbolo.png";
import mono from "@/public/logo/growthdirect-mono.png";

/**
 * Logotipo GrowthDirect. Os PNGs (fundo transparente, recortados ao conteúdo)
 * vivem em `public/logo/`. Import estático para o Next conhecer as
 * dimensões e não haver salto de layout.
 *
 *  - `horizontal` — símbolo + wordmark. Header, docs.
 *  - `vertical`   — símbolo em cima do wordmark. Login e telas centradas.
 *  - `simbolo`    — só o símbolo. Spinners, favicon, espaços apertados.
 *  - `mono`       — horizontal em preto. Impressão e fundos coloridos.
 *
 * Controle o tamanho por `className` na ALTURA (`h-8`, `h-40`…): a largura
 * acompanha (`w-auto`).
 */
export type VarianteLogo = "horizontal" | "vertical" | "simbolo" | "mono";

const FONTES = {
  horizontal,
  vertical,
  simbolo,
  mono,
} as const;

export function Logo({
  variante = "horizontal",
  className,
  priority = false,
}: {
  variante?: VarianteLogo;
  className?: string;
  /** True na primeira dobra (login), para o Next carregar antes. */
  priority?: boolean;
}) {
  return (
    <Image
      src={FONTES[variante]}
      alt="GrowthDirect — Hotel Solutions"
      priority={priority}
      className={cn("h-8 w-auto select-none", className)}
      draggable={false}
    />
  );
}
