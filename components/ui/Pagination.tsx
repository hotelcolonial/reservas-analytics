"use client";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
  /**
   * Seletor de itens por página. Opcional: sem `onPageSize`, o componente
   * se comporta exatamente como antes (e some quando há uma página só).
   * Quem chama é responsável por voltar à página 1 ao mudar o tamanho.
   */
  pageSize?: number;
  pageSizeOptions?: readonly number[];
  onPageSize?: (n: number) => void;
}

const OPCOES_PADRAO = [5, 10, 20, 50, 100] as const;

function Seta({ direita }: { direita?: boolean }) {
  return (
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
      <path d={direita ? "m9 18 6-6-6-6" : "m15 18-6-6 6-6"} />
    </svg>
  );
}

const BOTAO =
  "inline-flex h-9 items-center gap-1.5 rounded-xl border border-black/10 bg-branco px-3.5 text-sm font-normal text-carvao transition-colors hover:bg-carvao-50 disabled:cursor-not-allowed disabled:opacity-40";

export function Pagination({
  page,
  totalPages,
  onPage,
  pageSize,
  pageSizeOptions = OPCOES_PADRAO,
  onPageSize,
}: PaginationProps) {
  const comTamanho = typeof onPageSize === "function" && pageSize !== undefined;

  // Sem seletor de tamanho, uma página só não precisa de paginação (comportamento
  // original). Com seletor, ele fica visível mesmo com uma página, para poder
  // mostrar menos itens.
  if (!comTamanho && totalPages <= 1) return null;

  const navegacao = (
    <>
      <button onClick={() => onPage(page - 1)} disabled={page <= 1} className={BOTAO}>
        <Seta />
        Anterior
      </button>

      <span className="text-sm text-muted-fg">
        Página <span className="font-normal text-carvao">{page}</span> de{" "}
        {totalPages}
      </span>

      <button
        onClick={() => onPage(page + 1)}
        disabled={page >= totalPages}
        className={BOTAO}
      >
        Próxima
        <Seta direita />
      </button>
    </>
  );

  if (!comTamanho) {
    return (
      <div className="flex items-center justify-between gap-3">{navegacao}</div>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <label className="flex items-center gap-2 text-sm text-muted-fg">
        <Select
          value={String(pageSize)}
          onValueChange={(v) => onPageSize(Number(v))}
        >
          <SelectTrigger aria-label="itens por página" className="h-9 w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        por página
      </label>

      <div className="flex items-center justify-between gap-3">{navegacao}</div>
    </div>
  );
}
