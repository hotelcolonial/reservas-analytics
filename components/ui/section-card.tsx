import Link from "next/link";
import { ChevronRight } from "lucide-react";
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
      <CardTitle className="font-display text-lg tracking-tight text-colonial">
        {title}
      </CardTitle>
      {subtitle && <CardDescription>{subtitle}</CardDescription>}
      {action && <CardAction>{action}</CardAction>}
      {!action && href && (
        <CardAction>
          <Link
            href={href}
            aria-label={`Ver ${title}`}
            className="flex size-8 items-center justify-center rounded-full text-colonial/40 transition-colors hover:bg-accent hover:text-colonial"
          >
            <ChevronRight className="size-5" />
          </Link>
        </CardAction>
      )}
    </CardHeader>
  );
}
