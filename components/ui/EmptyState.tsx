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
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-colonial/15 bg-branco/60 px-6 py-12 text-center">
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-colonial-50 text-colonial">
          {icon}
        </div>
      )}
      <h3 className="font-display text-lg font-semibold text-colonial">
        {title}
      </h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-colonial/60">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
