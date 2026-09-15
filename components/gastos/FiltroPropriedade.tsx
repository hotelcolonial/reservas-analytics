"use client";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { PontoCor } from "@/components/ui/PontoCor";
import type { Propriedade } from "@/lib/types";
import type { Lancamento } from "@/lib/typesGastos";
import { porOrdem } from "@/lib/utils";

/**
 * Filtro de propriedade do módulo Gastos. Cada tela que o usa guarda o seu
 * próprio estado (dashboard e lançamentos não compartilham nem persistem):
 * mudar numa tela nunca altera a outra.
 *
 * Valores: "" = todas · SEM_PROPRIEDADE = só os sem propriedade (escritório /
 * geral) · id = só os dessa propriedade. O filtro é ESTRITO: escolher uma
 * propriedade não soma nem rateia os gastos gerais.
 */

/** Só os lançamentos sem propriedade (escritório / compartilhados). */
export const SEM_PROPRIEDADE = "geral";

// Radix Select não aceita value="" — sentinel para "todas".
const TODAS = "__todas__";

export function filtrarPorPropriedade<T extends Pick<Lancamento, "propriedadeId">>(
  lancamentos: T[],
  valor: string,
): T[] {
  if (!valor) return lancamentos;
  if (valor === SEM_PROPRIEDADE) return lancamentos.filter((l) => !l.propriedadeId);
  return lancamentos.filter((l) => l.propriedadeId === valor);
}

export function FiltroPropriedade({
  valor,
  onChange,
  propriedades,
  className,
}: {
  valor: string;
  onChange: (valor: string) => void;
  propriedades: Propriedade[];
  className?: string;
}) {
  return (
    <Select
      value={valor === "" ? TODAS : valor}
      onValueChange={(v) => onChange(v === TODAS ? "" : v)}
    >
      <SelectTrigger aria-label="propriedade" className={className ?? "w-full"}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={TODAS}>Todas as propriedades</SelectItem>
        <SelectItem value={SEM_PROPRIEDADE}>
          <PontoCor cor={null} />
          Escritório / Geral
        </SelectItem>
        {porOrdem(propriedades).map((p) => (
          <SelectItem key={p.id} value={p.id}>
            <PontoCor cor={p.cor} />
            {p.nome}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
