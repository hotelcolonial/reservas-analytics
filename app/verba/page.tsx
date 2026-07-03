"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import type { GastoDiario } from "@/lib/types";
import {
  formatBRL,
  formatDate,
  todayISO,
  PERIODO_TUDO,
  dentroDoPeriodo,
  porOrdemSelecionaveis,
  PLATAFORMA_LABELS,
  type Periodo,
} from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardAction,
  CardContent,
} from "@/components/ui/card";
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
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PeriodFilter } from "@/components/ui/PeriodFilter";
import { Pagination } from "@/components/ui/Pagination";
import { SpendByDateChart } from "@/components/verba/SpendByDateChart";

const POR_PAGINA = 10;

interface FormGasto {
  campanhaId: string;
  data: string;
  valor: number;
}

function formVazio(campanhaId: string): FormGasto {
  return { campanhaId, data: todayISO(), valor: 0 };
}

export default function VerbaPage() {
  const campanhas = useStore((s) => s.campanhas);
  const gastos = useStore((s) => s.gastos);
  const addGasto = useStore((s) => s.addGasto);
  const updateGasto = useStore((s) => s.updateGasto);
  const removeGasto = useStore((s) => s.removeGasto);

  // Campanhas oferecidas para lançar verba: só as ativas (exclui pausadas).
  const campanhasAtivas = useMemo(
    () => porOrdemSelecionaveis(campanhas),
    [campanhas],
  );

  const [periodo, setPeriodo] = useState<Periodo>(PERIODO_TUDO);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<FormGasto>(() =>
    formVazio(porOrdemSelecionaveis(campanhas)[0]?.id ?? ""),
  );
  const [editId, setEditId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [excluir, setExcluir] = useState<GastoDiario | null>(null);

  function aplicarPeriodo(p: Periodo) {
    setPeriodo(p);
    setPage(1);
  }

  const nomeCampanha = (id: string) =>
    campanhas.find((c) => c.id === id)?.nome ?? "—";
  const plataformaCampanha = (id: string) => {
    const c = campanhas.find((x) => x.id === id);
    return c ? PLATAFORMA_LABELS[c.plataforma] : "—";
  };

  const filtrados = useMemo(
    () =>
      gastos
        .filter((g) => dentroDoPeriodo(g.data, periodo))
        .sort((a, b) => b.data.localeCompare(a.data)),
    [gastos, periodo],
  );

  const total = useMemo(
    () => filtrados.reduce((acc, g) => acc + g.valor, 0),
    [filtrados],
  );

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaAtual = Math.min(page, totalPaginas);
  const paginados = filtrados.slice(
    (paginaAtual - 1) * POR_PAGINA,
    paginaAtual * POR_PAGINA,
  );

  function set<K extends keyof FormGasto>(key: K, value: FormGasto[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function salvar() {
    if (!form.campanhaId) {
      setErro("Selecione uma campanha.");
      return;
    }
    if (!form.data) {
      setErro("Informe a data do gasto.");
      return;
    }
    if (!form.valor || form.valor <= 0) {
      setErro("Informe um valor maior que zero.");
      return;
    }
    if (editId) {
      updateGasto(editId, form);
    } else {
      addGasto(form);
    }
    setForm(formVazio(form.campanhaId));
    setEditId(null);
    setErro(null);
  }

  function editar(g: GastoDiario) {
    setEditId(g.id);
    setForm({ campanhaId: g.campanhaId, data: g.data, valor: g.valor });
    setErro(null);
    document
      .getElementById("gasto-form")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function cancelarEdicao() {
    setEditId(null);
    setForm(formVazio(campanhasAtivas[0]?.id ?? ""));
    setErro(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-colonial">
          Verba diária
        </h1>
        <p className="mt-1 text-sm text-colonial/60">
          Registre quanto foi gasto em cada campanha, por dia. O investimento de
          cada campanha é a soma desses lançamentos.
        </p>
      </div>

      {campanhas.length === 0 ? (
        <EmptyState
          title="Cadastre uma campanha primeiro"
          description="A verba é sempre vinculada a uma campanha. Crie uma campanha para começar a lançar gastos."
        />
      ) : (
        <>
          <Card
            id="gasto-form"
            className={`scroll-mt-24 transition-shadow ${
              editId ? "ring-2 ring-primary/40" : ""
            }`}
          >
            <CardHeader>
              <CardTitle className="font-display text-lg text-colonial">
                {editId ? "Editar gasto" : "Lançar gasto do dia"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field>
                  <FieldLabel htmlFor="gasto-campanha">
                    Campanha <span className="text-primary">*</span>
                  </FieldLabel>
                  <Select
                    value={form.campanhaId}
                    onValueChange={(v) => set("campanhaId", v)}
                  >
                    <SelectTrigger id="gasto-campanha" className="w-full">
                      <SelectValue placeholder="Selecione uma campanha" />
                    </SelectTrigger>
                    <SelectContent>
                      {porOrdemSelecionaveis(campanhas, form.campanhaId).map(
                        (c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nome}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="gasto-data">
                    Data <span className="text-primary">*</span>
                  </FieldLabel>
                  <Input
                    id="gasto-data"
                    type="date"
                    value={form.data}
                    onChange={(e) => set("data", e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="gasto-valor">
                    Valor gasto (R$) <span className="text-primary">*</span>
                  </FieldLabel>
                  <Input
                    id="gasto-valor"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0"
                    value={form.valor === 0 ? "" : form.valor}
                    onChange={(e) =>
                      set(
                        "valor",
                        e.target.value === "" ? 0 : Number(e.target.value),
                      )
                    }
                  />
                </Field>
              </div>
              {erro && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {erro}
                </p>
              )}
              <div className="flex items-center gap-3">
                <Button onClick={salvar}>
                  {editId ? "Salvar alterações" : "Registrar gasto"}
                </Button>
                {editId && (
                  <Button variant="ghost" onClick={cancelarEdicao}>
                    Cancelar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <PeriodFilter periodo={periodo} onChange={aplicarPeriodo} />

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg text-colonial">
                Verba gasta por data
              </CardTitle>
              <CardAction>
                <p className="text-sm text-muted-foreground">
                  Total no período{" "}
                  <span className="font-semibold text-colonial">
                    {formatBRL(total)}
                  </span>
                </p>
              </CardAction>
            </CardHeader>
            <CardContent>
              <SpendByDateChart gastos={filtrados} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg text-colonial">
                Lançamentos
              </CardTitle>
              <CardAction>
                <p className="text-sm text-muted-foreground">
                  {filtrados.length} lançamento(s) · total{" "}
                  <span className="font-semibold text-colonial">
                    {formatBRL(total)}
                  </span>
                </p>
              </CardAction>
            </CardHeader>
            <CardContent>
            {filtrados.length === 0 ? (
              <EmptyState
                title="Nenhum gasto no período"
                description="Lance o primeiro gasto acima ou ajuste o filtro de datas."
              />
            ) : (
              <div className="-mx-2 overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-colonial/50">
                      <th className="px-3 py-2 font-semibold">Data</th>
                      <th className="px-3 py-2 font-semibold">Campanha</th>
                      <th className="px-3 py-2 font-semibold">Plataforma</th>
                      <th className="px-3 py-2 text-right font-semibold">Valor</th>
                      <th className="px-3 py-2 text-right font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {paginados.map((g) => (
                      <tr key={g.id} className="hover:bg-colonial-50/50">
                        <td className="px-3 py-3 font-medium text-colonial">
                          {formatDate(g.data)}
                        </td>
                        <td className="px-3 py-3">
                          <Link
                            href={`/campanhas/${g.campanhaId}`}
                            className="font-medium text-colonial hover:text-laranja-dark hover:underline"
                          >
                            {nomeCampanha(g.campanhaId)}
                          </Link>
                        </td>
                        <td className="px-3 py-3 text-colonial/70">
                          {plataformaCampanha(g.campanhaId)}
                        </td>
                        <td className="px-3 py-3 text-right font-semibold text-colonial">
                          {formatBRL(g.valor)}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => editar(g)}
                              className="rounded-lg p-1.5 text-colonial/50 transition-colors hover:bg-colonial-50 hover:text-colonial"
                              aria-label="Editar gasto"
                            >
                              <svg
                                width="17"
                                height="17"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setExcluir(g)}
                              className="rounded-lg p-1.5 text-colonial/40 transition-colors hover:bg-rose-50 hover:text-rose-600"
                              aria-label="Excluir gasto"
                            >
                              <svg
                                width="17"
                                height="17"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {filtrados.length > 0 && (
              <div className="mt-4">
                <Pagination
                  page={paginaAtual}
                  totalPages={totalPaginas}
                  onPage={setPage}
                />
              </div>
            )}
            </CardContent>
          </Card>
        </>
      )}

      <ConfirmDialog
        open={Boolean(excluir)}
        title="Excluir gasto"
        message={`Tem certeza que deseja excluir o gasto de ${
          excluir ? formatBRL(excluir.valor) : ""
        } em ${excluir ? formatDate(excluir.data) : ""}?`}
        onConfirm={() => excluir && removeGasto(excluir.id)}
        onClose={() => setExcluir(null)}
      />
    </div>
  );
}
