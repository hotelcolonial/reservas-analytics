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
import type { Bandeira, Cartao } from "@/lib/typesGastos";
import { BANDEIRAS, BANDEIRA_LABELS } from "@/lib/typesGastos";

interface CartaoFormProps {
  open: boolean;
  onClose: () => void;
  cartao?: Cartao | null;
}

type FormData = Omit<Cartao, "id">;

/** Só os 4 últimos dígitos, nunca o número completo do cartão. */
function apenasQuatroDigitos(value: string): string {
  return value.replace(/\D/g, "").slice(0, 4);
}

function estadoInicial(c: Cartao | null | undefined, proximaOrdem: number): FormData {
  return {
    nome: c?.nome ?? "",
    bandeira: c?.bandeira ?? "outro",
    final: c?.final ?? "",
    titular: c?.titular ?? "",
    ativo: c?.ativo ?? true,
    // `ordem` não é editável no formulário: ao criar, vai para o fim da lista.
    ordem: c?.ordem ?? proximaOrdem,
  };
}

export function CartaoForm({ open, onClose, cartao }: CartaoFormProps) {
  const cartoes = useGastosStore((s) => s.cartoes);
  const addCartao = useGastosStore((s) => s.addCartao);
  const updateCartao = useGastosStore((s) => s.updateCartao);

  const [form, setForm] = useState<FormData>(() => {
    const proximaOrdem =
      cartoes.reduce((max, c) => Math.max(max, c.ordem ?? 0), 0) + 1;
    return estadoInicial(cartao, proximaOrdem);
  });
  const [erro, setErro] = useState<string | null>(null);

  const editando = Boolean(cartao);

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function salvar() {
    if (!form.nome.trim()) {
      setErro("Informe um apelido para o cartão.");
      return;
    }
    if (form.final.length !== 4) {
      setErro("Informe os 4 últimos dígitos do cartão.");
      return;
    }
    if (cartao) {
      updateCartao(cartao.id, form);
    } else {
      addCartao(form);
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
            {editando ? "Editar cartão" : "Novo cartão"}
          </SheetTitle>
          <SheetDescription>
            {editando
              ? "Atualize os dados do cartão."
              : "Cadastre um cartão para vincular aos lançamentos."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="cart-nome">
                Apelido do cartão <span className="text-primary">*</span>
              </FieldLabel>
              <Input
                id="cart-nome"
                value={form.nome}
                onChange={(e) => set("nome", e.target.value)}
                placeholder="Ex.: Nubank PJ, Inter Empresas..."
              />
            </Field>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="cart-bandeira">
                  Bandeira <span className="text-primary">*</span>
                </FieldLabel>
                <Select
                  value={form.bandeira}
                  onValueChange={(v) => set("bandeira", v as Bandeira)}
                >
                  <SelectTrigger id="cart-bandeira" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BANDEIRAS.map((b) => (
                      <SelectItem key={b} value={b}>
                        {BANDEIRA_LABELS[b]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="cart-final">
                  4 últimos dígitos <span className="text-primary">*</span>
                </FieldLabel>
                <Input
                  id="cart-final"
                  value={form.final}
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="0000"
                  onChange={(e) =>
                    set("final", apenasQuatroDigitos(e.target.value))
                  }
                />
              </Field>
            </div>

            <p className="-mt-3 text-xs text-muted-foreground">
              Guardamos apenas os 4 últimos dígitos, o suficiente para você
              reconhecer o cartão. O número completo nunca é registrado aqui.
            </p>

            <Field>
              <FieldLabel htmlFor="cart-titular">Titular</FieldLabel>
              <Input
                id="cart-titular"
                value={form.titular}
                onChange={(e) => set("titular", e.target.value)}
                placeholder="Ex.: GrowthDirect"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="cart-ativo">Situação</FieldLabel>
              <Select
                value={form.ativo ? "sim" : "nao"}
                onValueChange={(v) => set("ativo", v === "sim")}
              >
                <SelectTrigger id="cart-ativo" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">Ativo</SelectItem>
                  <SelectItem value="nao">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </Field>

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
              {editando ? "Salvar alterações" : "Criar cartão"}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
