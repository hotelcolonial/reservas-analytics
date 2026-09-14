"use client";

import { useStore } from "@/lib/store";
import { cn, formatDateTime } from "@/lib/utils";

/**
 * Linha discreta de autoria: "criado por Raquel em 14/09/2026 às 14:32 ·
 * atualizado em 15/09/2026 às 09:10".
 *
 * Regras:
 *  - sem `criadoPor` (registro anterior à auditoria, ou perfil que não existe
 *    mais): só a data, sem autor;
 *  - sem nenhum dos três: não renderiza nada;
 *  - `atualizadoEm` só aparece se for diferente de `criadoEm` (com 1 s de
 *    tolerância: no insert o trigger grava os dois com o mesmo `now()`).
 *
 * Tipografia menor e cor atenuada (`text-subtle-fg`), copy em minúscula,
 * nome próprio preservado — DESIGN.md §2.
 */
export interface AutoriaProps {
  criadoPor?: string | null;
  criadoEm?: string | null;
  atualizadoEm?: string | null;
  className?: string;
}

const TOLERANCIA_MS = 1000;

function diferentes(a: string, b: string): boolean {
  const ta = new Date(a).getTime();
  const tb = new Date(b).getTime();
  if (Number.isNaN(ta) || Number.isNaN(tb)) return a !== b;
  return Math.abs(ta - tb) >= TOLERANCIA_MS;
}

export function Autoria({
  criadoPor,
  criadoEm,
  atualizadoEm,
  className,
}: AutoriaProps) {
  const perfilPorId = useStore((s) => s.perfilPorId);
  // Assina a lista para re-renderizar quando os perfis chegarem.
  useStore((s) => s.perfis);

  if (!criadoPor && !criadoEm && !atualizadoEm) return null;

  const perfil = perfilPorId(criadoPor);
  const autor = perfil?.nome || perfil?.email || null;

  const partes: string[] = [];
  if (criadoEm) {
    partes.push(
      autor
        ? `criado por ${autor} em ${formatDateTime(criadoEm)}`
        : `criado em ${formatDateTime(criadoEm)}`,
    );
  } else if (autor) {
    partes.push(`criado por ${autor}`);
  }
  if (atualizadoEm && (!criadoEm || diferentes(criadoEm, atualizadoEm))) {
    partes.push(`atualizado em ${formatDateTime(atualizadoEm)}`);
  }
  if (partes.length === 0) return null;

  return (
    <p
      data-slot="autoria"
      className={cn("text-xs leading-relaxed text-subtle-fg", className)}
    >
      {partes.join(" · ")}
    </p>
  );
}
