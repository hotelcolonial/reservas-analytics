"use client";

import { useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useGastosStore } from "@/lib/storeGastos";
import type { Natureza } from "@/lib/typesGastos";
import { GRUPOS_NATUREZA, GRUPO_NATUREZA_LABELS } from "@/lib/typesGastos";
import { porOrdem } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { NaturezaForm } from "@/components/gastos/NaturezaForm";

export default function NaturezasPage() {
  const naturezas = useGastosStore((s) => s.naturezas);
  const lancamentos = useGastosStore((s) => s.lancamentos);
  const despesasRecorrentes = useGastosStore((s) => s.despesasRecorrentes);
  const removeNatureza = useGastosStore((s) => s.removeNatureza);

  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState<Natureza | null>(null);
  const [excluir, setExcluir] = useState<Natureza | null>(null);

  /** Quantos registros dependem de cada natureza. */
  const contagens = useMemo(() => {
    const mapa = new Map<string, { lancamentos: number; recorrentes: number }>();
    for (const n of naturezas) {
      mapa.set(n.id, {
        lancamentos: lancamentos.filter((l) => l.naturezaId === n.id).length,
        recorrentes: despesasRecorrentes.filter((d) => d.naturezaId === n.id)
          .length,
      });
    }
    return mapa;
  }, [naturezas, lancamentos, despesasRecorrentes]);

  // Um bloco por grupo, na ordem canônica, escondendo os grupos vazios.
  const grupos = useMemo(
    () =>
      GRUPOS_NATUREZA.map((grupo) => ({
        grupo,
        itens: porOrdem(naturezas.filter((n) => n.grupo === grupo)),
      })).filter((g) => g.itens.length > 0),
    [naturezas],
  );

  function abrirNova() {
    setEditando(null);
    setFormOpen(true);
  }

  function abrirEdicao(n: Natureza) {
    setEditando(n);
    setFormOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-brand text-[clamp(34px,4.4vw,58px)] leading-[0.95] font-light tracking-[-0.045em] text-carvao lowercase">
            naturezas
          </h1>
          <p className="mt-3 max-w-2xl text-[clamp(15px,1.1vw,17px)] leading-relaxed text-muted-fg">
            Categorias que classificam os lançamentos. A cor é usada nos
            gráficos do painel de gastos.
          </p>
        </div>
        <Button onClick={abrirNova}>+ nova natureza</Button>
      </div>

      {naturezas.length === 0 ? (
        <EmptyState
          title="Nenhuma natureza cadastrada"
          description="Cadastre a primeira natureza para começar a classificar os gastos."
          action={<Button onClick={abrirNova}>+ nova natureza</Button>}
        />
      ) : (
        <div className="space-y-8">
          {grupos.map(({ grupo, itens }) => (
            <section key={grupo} className="space-y-3">
              <h2 className="flex items-center gap-2 text-sm font-normal uppercase tracking-wide text-muted-foreground">
                {GRUPO_NATUREZA_LABELS[grupo]}
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                  {itens.length}
                </span>
              </h2>

              <Card>
                <CardContent className="-mx-2 overflow-x-auto">
                  <table className="w-full min-w-[560px] border-collapse text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-subtle-fg">
                        <th className="px-3 py-2 font-normal">Natureza</th>
                        <th className="px-3 py-2 text-right font-normal">
                          Lançamentos
                        </th>
                        <th className="px-3 py-2 text-right font-normal">
                          Recorrentes
                        </th>
                        <th className="px-3 py-2 text-right font-normal">
                          Ordem
                        </th>
                        <th className="px-3 py-2 text-right font-normal">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {itens.map((n) => {
                        const cont = contagens.get(n.id);
                        const bloqueada = Boolean(cont && cont.lancamentos > 0);
                        return (
                          <tr key={n.id} className="hover:bg-carvao-50/50">
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2.5">
                                <span
                                  aria-hidden
                                  className="size-4 shrink-0 rounded-full border border-black/10"
                                  style={{ backgroundColor: n.cor }}
                                />
                                <span className="font-normal text-carvao">
                                  {n.nome}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-right text-muted-fg">
                              {cont?.lancamentos ?? 0}
                            </td>
                            <td className="px-3 py-3 text-right text-muted-fg">
                              {cont?.recorrentes ?? 0}
                            </td>
                            <td className="px-3 py-3 text-right text-muted-fg">
                              {n.ordem}
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label={`Editar ${n.nome}`}
                                  onClick={() => abrirEdicao(n)}
                                >
                                  <Pencil className="size-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label={`Excluir ${n.nome}`}
                                  disabled={bloqueada}
                                  title={
                                    bloqueada
                                      ? `Não é possível excluir: há ${cont?.lancamentos} lançamento(s) com esta natureza.`
                                      : undefined
                                  }
                                  onClick={() => setExcluir(n)}
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </section>
          ))}
        </div>
      )}

      <NaturezaForm
        key={`nat-${formOpen}-${editando?.id ?? "nova"}`}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        natureza={editando}
      />

      <ConfirmDialog
        open={Boolean(excluir)}
        title="Excluir natureza"
        message={`Tem certeza que deseja excluir "${excluir?.nome}"? Esta ação não pode ser desfeita.`}
        onConfirm={() => excluir && removeNatureza(excluir.id)}
        onClose={() => setExcluir(null)}
      />
    </div>
  );
}
