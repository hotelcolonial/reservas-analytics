import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card";

/**
 * Cabeçalho de card de seção: título + descrição, com um chevron opcional que
 * leva a `href`. Envolve a composição oficial (CardHeader/CardTitle/...) para
 * não repetir o padrão nas páginas de dashboard.
 */
export function SectionCardHeader({
  title,
  subtitle,
  href,
  action,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  action?: React.ReactNode;
}) {
  return (
    <CardHeader>
      <CardTitle className="font-brand text-[clamp(19px,1.7vw,24px)] leading-tight font-light tracking-[-0.03em] text-carvao lowercase">
        {title}
      </CardTitle>
      {subtitle && <CardDescription>{subtitle}</CardDescription>}
      {action && <CardAction>{action}</CardAction>}
      {!action && href && (
        <CardAction>
          <Link
            href={href}
            aria-label={`ver ${title}`}
            className="flex size-9 items-center justify-center rounded-full text-subtle-fg transition-colors duration-300 hover:bg-coral hover:text-branco"
          >
            <ArrowUpRight className="size-4.5" />
          </Link>
        </CardAction>
      )}
    </CardHeader>
  );
}
