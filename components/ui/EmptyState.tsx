export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[clamp(28px,3vw,44px)] bg-carvao-50 px-6 py-[clamp(48px,7vw,80px)] text-center">
      {icon && (
        <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-branco text-carvao">
          {icon}
        </div>
      )}
      <h3 className="font-brand text-[clamp(22px,2.4vw,32px)] leading-tight font-light tracking-[-0.045em] text-carvao lowercase">
        {title}
      </h3>
      {description && (
        <p className="mt-2 max-w-sm text-[clamp(14px,1vw,15px)] leading-relaxed text-muted-fg">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
