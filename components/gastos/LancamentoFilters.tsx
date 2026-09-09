"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Cartao, Natureza } from "@/lib/typesGastos";
import {
  FORMAS_PAGAMENTO,
  FORMA_PAGAMENTO_LABELS,
  STATUS_LANCAMENTO,
  STATUS_LANCAMENTO_LABELS,
} from "@/lib/typesGastos";
import { porOrdem } from "@/lib/utils";

export interface FiltrosLancamento {
  busca: string;
  naturezaId: string; // "" = todas
  cartaoId: string; // "" = todos, "sem" = sem cartão
  formaPagamento: string; // "" = todas
  status: string; // "" = todos; aceita também o derivado "atrasado"
  comprovante: string; // "" = todos, "com" | "sem"
  vencimentoDe: string;
  vencimentoAte: string;
  competenciaDe: string; // yyyy-mm
  competenciaAte: string; // yyyy-mm
}

export const filtrosVazios: FiltrosLancamento = {
  busca: "",
  naturezaId: "",
  cartaoId: "",
  formaPagamento: "",
  status: "",
  comprovante: "",
  vencimentoDe: "",
  vencimentoAte: "",
  competenciaDe: "",
  competenciaAte: "",
};

// Radix Select não aceita value="" — sentinels para as opções "todas/todos".
const TODAS = "__todas__";
const TODOS = "__todos__";

/** Sentinel do filtro de cartão: lançamentos que não foram no crédito. */
export const SEM_CARTAO = "sem";

/** Status derivado, não guardado: pendente e já vencido. */
export const STATUS_ATRASADO = "atrasado";

/** Sentinels do filtro de comprovante. */
export const COM_COMPROVANTE = "com";
export const SEM_COMPROVANTE = "sem";

export function LancamentoFilters({
  filtros,
  onChange,
  naturezas,
  cartoes,
}: {
  filtros: FiltrosLancamento;
  onChange: (f: FiltrosLancamento) => void;
  naturezas: Natureza[];
  cartoes: Cartao[];
}) {
  function set<K extends keyof FiltrosLancamento>(
    key: K,
    value: FiltrosLancamento[K],
  ) {
    onChange({ ...filtros, [key]: value });
  }

  const algumFiltro = Object.values(filtros).some(Boolean);

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <Input
        placeholder="Buscar por descrição ou fornecedor..."
        value={filtros.busca}
        onChange={(e) => set("busca", e.target.value)}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          value={filtros.naturezaId === "" ? TODAS : filtros.naturezaId}
          onValueChange={(v) => set("naturezaId", v === TODAS ? "" : v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODAS}>Todas as naturezas</SelectItem>
            {porOrdem(naturezas).map((n) => (
              <SelectItem key={n.id} value={n.id}>
                {n.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filtros.cartaoId === "" ? TODOS : filtros.cartaoId}
          onValueChange={(v) => set("cartaoId", v === TODOS ? "" : v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos os cartões</SelectItem>
            <SelectItem value={SEM_CARTAO}>Sem cartão</SelectItem>
            {porOrdem(cartoes).map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nome} · •••• {c.final}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filtros.formaPagamento === "" ? TODAS : filtros.formaPagamento}
          onValueChange={(v) => set("formaPagamento", v === TODAS ? "" : v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODAS}>Todas as formas</SelectItem>
            {FORMAS_PAGAMENTO.map((f) => (
              <SelectItem key={f} value={f}>
                {FORMA_PAGAMENTO_LABELS[f]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filtros.status === "" ? TODOS : filtros.status}
          onValueChange={(v) => set("status", v === TODOS ? "" : v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos os status</SelectItem>
            {STATUS_LANCAMENTO.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LANCAMENTO_LABELS[s]}
              </SelectItem>
            ))}
            <SelectItem value={STATUS_ATRASADO}>Atrasado</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filtros.comprovante === "" ? TODOS : filtros.comprovante}
          onValueChange={(v) => set("comprovante", v === TODOS ? "" : v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Com e sem comprovante</SelectItem>
            <SelectItem value={COM_COMPROVANTE}>Com comprovante</SelectItem>
            <SelectItem value={SEM_COMPROVANTE}>Sem comprovante</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <p className="mb-1.5 text-xs font-normal uppercase tracking-wide text-muted-foreground">
            Vencimento
          </p>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              aria-label="Vencimento de"
              value={filtros.vencimentoDe}
              onChange={(e) => set("vencimentoDe", e.target.value)}
            />
            <span className="text-muted-foreground">—</span>
            <Input
              type="date"
              aria-label="Vencimento até"
              value={filtros.vencimentoAte}
              onChange={(e) => set("vencimentoAte", e.target.value)}
            />
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-normal uppercase tracking-wide text-muted-foreground">
            Competência
          </p>
          <div className="flex items-center gap-2">
            <Input
              type="month"
              aria-label="Competência de"
              value={filtros.competenciaDe}
              onChange={(e) => set("competenciaDe", e.target.value)}
            />
            <span className="text-muted-foreground">—</span>
            <Input
              type="month"
              aria-label="Competência até"
              value={filtros.competenciaAte}
              onChange={(e) => set("competenciaAte", e.target.value)}
            />
          </div>
        </div>
      </div>

      {algumFiltro && (
        <Button
          variant="link"
          onClick={() => onChange(filtrosVazios)}
          className="h-auto px-0 text-coral-dark"
        >
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
