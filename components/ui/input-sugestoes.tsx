"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * Input de texto livre com sugestões (combobox "editável").
 *
 * Diferença para um Select: NUNCA bloqueia um valor novo — as sugestões são
 * só um atalho. O foco fica sempre no input: a lista abre num Popover
 * ancorado, sem roubar foco, e responde a ↓ ↑ Enter Esc.
 *
 * `sugestoes` vem já ordenado por quem chama (aqui, por frequência de uso);
 * o componente só filtra pelo texto digitado (sem acento, sem caixa).
 */
export interface InputSugestoesProps
  extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange"> {
  value: string;
  onChange: (value: string) => void;
  sugestoes: string[];
  /** Quantas mostrar no máximo. */
  limite?: number;
}

/** Normaliza para comparar: minúsculas e sem acento. */
function chave(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function InputSugestoes({
  value,
  onChange,
  sugestoes,
  limite = 8,
  className,
  id,
  ...props
}: InputSugestoesProps) {
  const [aberto, setAberto] = React.useState(false);
  const [ativo, setAtivo] = React.useState(-1);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listaId = React.useId();

  const filtradas = React.useMemo(() => {
    const q = chave(value);
    const lista = q
      ? sugestoes.filter((s) => chave(s).includes(q) && chave(s) !== q)
      : sugestoes;
    return lista.slice(0, limite);
  }, [sugestoes, value, limite]);

  const mostrar = aberto && filtradas.length > 0;

  function escolher(texto: string) {
    onChange(texto);
    setAberto(false);
    setAtivo(-1);
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!mostrar) {
      if (e.key === "ArrowDown" && filtradas.length > 0) {
        setAberto(true);
        setAtivo(0);
        e.preventDefault();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      setAtivo((i) => (i + 1) % filtradas.length);
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      setAtivo((i) => (i <= 0 ? filtradas.length - 1 : i - 1));
      e.preventDefault();
    } else if (e.key === "Enter" && ativo >= 0) {
      // Só intercepta o Enter quando há um item realçado; sem realce, o
      // Enter segue para o formulário como sempre.
      escolher(filtradas[ativo]);
      e.preventDefault();
    } else if (e.key === "Escape") {
      setAberto(false);
      setAtivo(-1);
      e.stopPropagation(); // não fecha o Sheet junto
    }
  }

  return (
    <Popover open={mostrar} onOpenChange={setAberto}>
      <PopoverAnchor asChild>
        <Input
          {...props}
          id={id}
          ref={inputRef}
          value={value}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={mostrar}
          aria-controls={mostrar ? listaId : undefined}
          aria-activedescendant={
            mostrar && ativo >= 0 ? `${listaId}-${ativo}` : undefined
          }
          autoComplete="off"
          className={className}
          onChange={(e) => {
            onChange(e.target.value);
            setAberto(true);
            setAtivo(-1);
          }}
          onFocus={() => setAberto(true)}
          onBlur={() => {
            setAberto(false);
            setAtivo(-1);
          }}
          onKeyDown={onKeyDown}
        />
      </PopoverAnchor>

      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) min-w-[16rem] p-1.5"
        // O foco fica no input; a lista é só visual + mouse.
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          // Clicar no próprio input não é "fora".
          if (inputRef.current?.contains(e.target as Node)) e.preventDefault();
        }}
      >
        <ul id={listaId} role="listbox" className="max-h-64 overflow-y-auto">
          {filtradas.map((s, i) => (
            <li
              key={s}
              id={`${listaId}-${i}`}
              role="option"
              aria-selected={i === ativo}
              // mousedown preventDefault: não tira o foco do input (senão o
              // blur fecharia a lista antes do click chegar).
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setAtivo(i)}
              onClick={() => escolher(s)}
              className={cn(
                "cursor-default truncate rounded-xl px-2.5 py-2 text-sm font-normal text-carvao select-none",
                i === ativo && "bg-accent text-accent-foreground",
              )}
            >
              {s}
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
