import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
}

export function Card({ className, as: Tag = "div", ...props }: CardProps) {
  return (
    <Tag
      className={cn(
        "rounded-2xl border border-black/5 bg-branco p-5 shadow-sm sm:p-6",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 className="font-display text-xl font-semibold text-colonial">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-sm text-colonial/60">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}
