"use client";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}

export function Pagination({ page, totalPages, onPage }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-3">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-black/10 bg-branco px-3.5 text-sm font-medium text-colonial transition-colors hover:bg-colonial-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        Anterior
      </button>

      <span className="text-sm text-colonial/60">
        Página <span className="font-semibold text-colonial">{page}</span> de{" "}
        {totalPages}
      </span>

      <button
        onClick={() => onPage(page + 1)}
        disabled={page >= totalPages}
        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-black/10 bg-branco px-3.5 text-sm font-medium text-colonial transition-colors hover:bg-colonial-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Próxima
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>
    </div>
  );
}
