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
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useGastosStore } from "@/lib/storeGastos";
import type {
  DespesaRecorrente,
  FormaPagamento,
  Periodicidade,
} from "@/lib/typesGastos";
import {
  FORMAS_PAGAMENTO,
  FORMA_PAGAMENTO_LABELS,
  PERIODICIDADES,
  PERIODICIDADE_LABELS,
  DIAS_SEMANA,
  DIAS_SEMANA_LABELS,
  MESES,
  MESES_LABELS,
} from "@/lib/typesGastos";
import { porOrdem, todayISO } from "@/lib/utils";

interface DespesaRecorrenteFormProps {
  open: boolean;
  onClose: () => void;
  despesa?: DespesaRecorrente | null;
}

type FormData = Omit<DespesaRecorrente, "id">;

// Radix Select não aceita value="" — sentinels para "nada escolhido ainda".
const SEM_CARTAO = "sem";
const SEM_NATUREZA = "sem-natureza";

/** Dia padrão ao trocar de periodicidade: segunda-feira ou dia 1. */
const DIA_SEMANA_PADRAO = 1;
const DIA_MES_PADRAO = 1;

function estadoInicial(d: DespesaRecorrente | null | undefined): FormData {
  return {
    nome: d?.nome ?? "",
    descricao: d?.descricao ?? "",
    naturezaId: d?.naturezaId ?? "",
    fornecedor: d?.fornecedor ?? "",
    formaPagamento: d?.formaPagamento ?? "pix",
    cartaoId: d?.cartaoId ?? null,
    valorPrevisto: d?.valorPrevisto ?? 0,
    periodicidade: d?.periodicidade ?? "mensal",
    diaVencimento: d?.diaVencimento ?? DIA_MES_PADRAO,
    mesVencimento: d?.mesVencimento ?? null,
    ativa: d?.ativa ?? true,
    inicio: d?.inicio ?? todayISO(),
    fim: d?.fim ?? null,
  };
}

export function DespesaRecorrenteForm({
  open,
  onClose,
  despesa,
}: DespesaRecorrenteFormProps) {
  const naturezas = useGastosStore((s) => s.naturezas);
  const cartoes = useGastosStore((s) => s.cartoes);
  const addDespesaRecorrente = useGastosStore((s) => s.addDespesaRecorrente);
  const updateDespesaRecorrente = useGastosStore(
    (s) => s.updateDespesaRecorrente,
  );

  const naturezasOrdenadas = porOrdem(naturezas);

  const [form, setForm] = useState<FormData>(() => {
    const inicial = estadoInicial(despesa);
    if (!inicial.naturezaId) {
      inicial.naturezaId = porOrdem(naturezas)[0]?.id ?? "";
    }
    return inicial;
  });
  const [erro, setErro] = useState<string | null>(null);

  const editando = Boolean(despesa);
  const noCartao = form.formaPagamento === "cartao_credito";
  const semanal = form.periodicidade === "semanal";
  const anual = form.periodicidade === "anual";

  const cartoesSelecionaveis = porOrdem(
    cartoes.filter((c) => c.ativo || c.id === form.cartaoId),
  );

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setFormaPagamento(value: FormaPagamento) {
    setForm((f) => ({
      ...f,
      formaPagamento: value,
      cartaoId: value === "cartao_credito" ? f.cartaoId : null,
    }));
  }

  /**
   * Trocar de periodicidade muda o significado de `diaVencimento`: no semanal
   * é 0-6, no mensal e no anual é 1-31. Reajusta para não deixar um valor
   * inválido para o novo modo.
   */
  function setPeriodicidade(value: Periodicidade) {
    setForm((f) => {
      if (value === "semanal") {
        return {
          ...f,
          periodicidade: value,
          diaVencimento:
            f.diaVencimento >= 0 && f.diaVencimento <= 6
              ? f.diaVencimento
              : DIA_SEMANA_PADRAO,
          mesVencimento: null,
        };
      }
      const dia = f.diaVencimento >= 1 ? f.diaVencimento : DIA_MES_PADRAO;
      return {
        ...f,
        periodicidade: value,
        diaVencimento: dia,
        // Só o anual tem mês; sair dele limpa o campo.
        mesVencimento: value === "anual" ? (f.mesVencimento ?? 1) : null,
      };
    });
  }

  function salvar() {
    if (!form.nome.trim()) {
      setErro("Informe o nome da despesa recorrente.");
      return;
    }
    if (!form.naturezaId) {
      setErro("Selecione a natureza do gasto.");
      return;
    }
    if (!form.valorPrevisto || form.valorPrevisto <= 0) {
      setErro("Informe um valor previsto maior que zero.");
      return;
    }
    if (noCartao && !form.cartaoId) {
      setErro("Selecione o cartão usado no pagamento.");
      return;
    }
    if (semanal && (form.diaVencimento < 0 || form.diaVencimento > 6)) {
      setErro("Selecione o dia da semana.");
      return;
    }
    if (!semanal && (form.diaVencimento < 1 || form.diaVencimento > 31)) {
      setErro("O dia do vencimento deve estar entre 1 e 31.");
      return;
    }
    if (anual && !form.mesVencimento) {
      setErro("Selecione o mês do vencimento.");
      return;
    }
    if (!form.inicio) {
      setErro("Informe a data de início.");
      return;
    }
    if (form.fim && form.fim < form.inicio) {
      setErro("A data de fim não pode ser anterior ao início.");
      return;
    }
    if (despesa) {
      updateDespesaRecorrente(despesa.id, form);
    } else {
      addDespesaRecorrente(form);
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
            {editando ? "Editar recorrente" : "Nova despesa recorrente"}
          </SheetTitle>
          <SheetDescription>
            {editando
              ? "Atualize o modelo da despesa."
              : "Um modelo que gera lançamentos quando você pedir."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="rec-nome">
                Nome <span className="text-primary">*</span>
              </FieldLabel>
              <Input
                id="rec-nome"
                value={form.nome}
                onChange={(e) => set("nome", e.target.value)}
                placeholder="Ex.: Google Workspace"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="rec-descricao">Descrição</FieldLabel>
              <Textarea
                id="rec-descricao"
                rows={2}
                value={form.descricao}
                onChange={(e) => set("descricao", e.target.value)}
                placeholder="Para que serve esta despesa."
              />
            </Field>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="rec-natureza">
                  Natureza <span className="text-primary">*</span>
                </FieldLabel>
                <Select
                  value={form.naturezaId || SEM_NATUREZA}
                  onValueChange={(v) =>
                    set("naturezaId", v === SEM_NATUREZA ? "" : v)
                  }
                >
                  <SelectTrigger id="rec-natureza" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {naturezasOrdenadas.length === 0 && (
                      <SelectItem value={SEM_NATUREZA}>
                        Nenhuma natureza cadastrada
                      </SelectItem>
                    )}
                    {naturezasOrdenadas.map((n) => (
                      <SelectItem key={n.id} value={n.id}>
                        {n.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="rec-fornecedor">Fornecedor</FieldLabel>
                <Input
                  id="rec-fornecedor"
                  value={form.fornecedor}
                  onChange={(e) => set("fornecedor", e.target.value)}
                  placeholder="Ex.: Google"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="rec-forma">
                  Forma de pagamento <span className="text-primary">*</span>
                </FieldLabel>
                <Select
                  value={form.formaPagamento}
                  onValueChange={(v) => setFormaPagamento(v as FormaPagamento)}
                >
                  <SelectTrigger id="rec-forma" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMAS_PAGAMENTO.map((f) => (
                      <SelectItem key={f} value={f}>
                        {FORMA_PAGAMENTO_LABELS[f]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="rec-valor">
                  Valor previsto (R$) <span className="text-primary">*</span>
                </FieldLabel>
                <Input
                  id="rec-valor"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0"
                  value={form.valorPrevisto === 0 ? "" : form.valorPrevisto}
                  onChange={(e) =>
                    set(
                      "valorPrevisto",
                      e.target.value === "" ? 0 : Number(e.target.value),
                    )
                  }
                />
              </Field>
            </div>

            {noCartao && (
              <Field>
                <FieldLabel htmlFor="rec-cartao">
                  Cartão <span className="text-primary">*</span>
                </FieldLabel>
                <Select
                  value={form.cartaoId ?? SEM_CARTAO}
                  onValueChange={(v) =>
                    set("cartaoId", v === SEM_CARTAO ? null : v)
                  }
                >
                  <SelectTrigger id="rec-cartao" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SEM_CARTAO}>
                      Selecione um cartão
                    </SelectItem>
                    {cartoesSelecionaveis.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome} · •••• {c.final}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}

            <Field>
              <FieldLabel htmlFor="rec-periodicidade">
                Periodicidade <span className="text-primary">*</span>
              </FieldLabel>
              <Select
                value={form.periodicidade}
                onValueChange={(v) => setPeriodicidade(v as Periodicidade)}
              >
                <SelectTrigger id="rec-periodicidade" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODICIDADES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PERIODICIDADE_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {semanal ? (
                <Field>
                  <FieldLabel htmlFor="rec-dia-semana">
                    Dia da semana <span className="text-primary">*</span>
                  </FieldLabel>
                  <Select
                    value={String(form.diaVencimento)}
                    onValueChange={(v) => set("diaVencimento", Number(v))}
                  >
                    <SelectTrigger id="rec-dia-semana" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIAS_SEMANA.map((d) => (
                        <SelectItem key={d} value={String(d)}>
                          {DIAS_SEMANA_LABELS[d]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              ) : (
                <Field>
                  <FieldLabel htmlFor="rec-dia-mes">
                    Dia do mês <span className="text-primary">*</span>
                  </FieldLabel>
                  <Input
                    id="rec-dia-mes"
                    type="number"
                    min={1}
                    max={31}
                    placeholder="1"
                    value={form.diaVencimento === 0 ? "" : form.diaVencimento}
                    onChange={(e) =>
                      set(
                        "diaVencimento",
                        e.target.value === "" ? 0 : Number(e.target.value),
                      )
                    }
                  />
                </Field>
              )}

              {anual && (
                <Field>
                  <FieldLabel htmlFor="rec-mes">
                    Mês <span className="text-primary">*</span>
                  </FieldLabel>
                  <Select
                    value={String(form.mesVencimento ?? 1)}
                    onValueChange={(v) => set("mesVencimento", Number(v))}
                  >
                    <SelectTrigger id="rec-mes" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MESES.map((m) => (
                        <SelectItem key={m} value={String(m)}>
                          {MESES_LABELS[m]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </div>

            {!semanal && (
              <p className="-mt-3 text-xs text-muted-foreground">
                Se o dia escolhido não existir no mês (ex.: 31 em fevereiro), o
                lançamento cai no último dia do mês.
              </p>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="rec-inicio">
                  Início <span className="text-primary">*</span>
                </FieldLabel>
                <Input
                  id="rec-inicio"
                  type="date"
                  value={form.inicio}
                  onChange={(e) => set("inicio", e.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="rec-fim">Fim (opcional)</FieldLabel>
                <Input
                  id="rec-fim"
                  type="date"
                  value={form.fim ?? ""}
                  onChange={(e) => set("fim", e.target.value || null)}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="rec-ativa">Situação</FieldLabel>
              <Select
                value={form.ativa ? "sim" : "nao"}
                onValueChange={(v) => set("ativa", v === "sim")}
              >
                <SelectTrigger id="rec-ativa" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">Ativa</SelectItem>
                  <SelectItem value="nao">Inativa</SelectItem>
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
              {editando ? "Salvar alterações" : "Criar recorrente"}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
