import Link from "next/link";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
}

export function Card({ className, as: Tag = "div", ...props }: CardProps) {
  return (
    <Tag
      className={cn(
        "rounded-3xl bg-branco p-5 shadow-[0_1px_3px_rgba(16,24,40,0.04),0_8px_24px_-12px_rgba(16,24,40,0.10)] sm:p-6",
        className,
      )}
      {...props}
    />
  );
}

function Chevron() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  href,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  /** Quando informado, mostra um chevron que leva a esta rota. */
  href?: string;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 className="font-display text-lg font-bold tracking-tight text-colonial">
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-sm text-colonial/55">{subtitle}</p>}
      </div>
      {action}
      {!action && href && (
        <Link
          href={href}
          aria-label={`Ver ${title}`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-colonial/40 transition-colors hover:bg-colonial-50 hover:text-colonial"
        >
          <Chevron />
        </Link>
      )}
    </div>
  );
}
