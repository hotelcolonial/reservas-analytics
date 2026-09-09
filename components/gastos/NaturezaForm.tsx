"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useGastosStore } from "@/lib/storeGastos";
import type { GrupoNatureza, Natureza } from "@/lib/typesGastos";
import { GRUPOS_NATUREZA, GRUPO_NATUREZA_LABELS } from "@/lib/typesGastos";

interface NaturezaFormProps {
  open: boolean;
  onClose: () => void;
  natureza?: Natureza | null;
}

type FormData = Omit<Natureza, "id">;

/** Cor inicial de uma natureza nova: verde médio da marca. */
const COR_PADRAO = "#9da0a5";

function estadoInicial(
  n: Natureza | null | undefined,
  proximaOrdem: number,
): FormData {
  return {
    nome: n?.nome ?? "",
    grupo: n?.grupo ?? "interno",
    cor: n?.cor ?? COR_PADRAO,
    ordem: n?.ordem ?? proximaOrdem,
  };
}

export function NaturezaForm({ open, onClose, natureza }: NaturezaFormProps) {
  const naturezas = useGastosStore((s) => s.naturezas);
  const addNatureza = useGastosStore((s) => s.addNatureza);
  const updateNatureza = useGastosStore((s) => s.updateNatureza);

  const [form, setForm] = useState<FormData>(() => {
    const proximaOrdem =
      naturezas.reduce((max, n) => Math.max(max, n.ordem ?? 0), 0) + 1;
    return estadoInicial(natureza, proximaOrdem);
  });
  const [erro, setErro] = useState<string | null>(null);

  const editando = Boolean(natureza);

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function salvar() {
    if (!form.nome.trim()) {
      setErro("Informe o nome da natureza.");
      return;
    }
    if (natureza) {
      updateNatureza(natureza.id, form);
    } else {
      addNatureza(form);
    }
    onClose();
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="font-brand text-xl text-carvao">
            {editando ? "Editar natureza" : "Nova natureza"}
          </SheetTitle>
          <SheetDescription>
            {editando
              ? "Atualize os dados da natureza."
              : "Cadastre uma categoria para classificar os lançamentos."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="nat-nome">
                Nome <span className="text-primary">*</span>
              </FieldLabel>
              <Input
                id="nat-nome"
                value={form.nome}
                onChange={(e) => set("nome", e.target.value)}
                placeholder="Ex.: Material de escritório, Tráfego pago..."
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="nat-grupo">
                Grupo <span className="text-primary">*</span>
              </FieldLabel>
              <Select
                value={form.grupo}
                onValueChange={(v) => set("grupo", v as GrupoNatureza)}
              >
                <SelectTrigger id="nat-grupo" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRUPOS_NATUREZA.map((g) => (
                    <SelectItem key={g} value={g}>
                      {GRUPO_NATUREZA_LABELS[g]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="nat-cor">Cor nos gráficos</FieldLabel>
                <div className="flex items-center gap-3">
                  <Input
                    id="nat-cor"
                    type="color"
                    value={form.cor}
                    onChange={(e) => set("cor", e.target.value)}
                    className="h-9 w-16 cursor-pointer p-1"
                  />
                  <span className="font-mono text-sm text-muted-foreground">
                    {form.cor}
                  </span>
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="nat-ordem">Ordem</FieldLabel>
                <Input
                  id="nat-ordem"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={form.ordem === 0 ? "" : form.ordem}
                  onChange={(e) =>
                    set("ordem", e.target.value === "" ? 0 : Number(e.target.value))
                  }
                />
              </Field>
            </div>

            {erro && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {erro}
              </p>
            )}
          </FieldGroup>
        </div>

        <SheetFooter>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={salvar}>
              {editando ? "Salvar alterações" : "Criar natureza"}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
