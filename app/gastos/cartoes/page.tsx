"use client";

import { useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useGastosStore } from "@/lib/storeGastos";
import type { Cartao } from "@/lib/typesGastos";
import { BANDEIRA_LABELS } from "@/lib/typesGastos";
import { porOrdem } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CartaoForm } from "@/components/gastos/CartaoForm";

export default function CartoesPage() {
  const cartoes = useGastosStore((s) => s.cartoes);
  const lancamentos = useGastosStore((s) => s.lancamentos);
  const despesasRecorrentes = useGastosStore((s) => s.despesasRecorrentes);
  const removeCartao = useGastosStore((s) => s.removeCartao);

  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState<Cartao | null>(null);
  const [excluir, setExcluir] = useState<Cartao | null>(null);

  /** Quantos registros dependem de cada cartão. */
  const contagens = useMemo(() => {
    const mapa = new Map<string, { lancamentos: number; recorrentes: number }>();
    for (const c of cartoes) {
      mapa.set(c.id, {
        lancamentos: lancamentos.filter((l) => l.cartaoId === c.id).length,
        recorrentes: despesasRecorrentes.filter((d) => d.cartaoId === c.id)
          .length,
      });
    }
    return mapa;
  }, [cartoes, lancamentos, despesasRecorrentes]);

  const ordenados = useMemo(() => porOrdem(cartoes), [cartoes]);

  function abrirNovo() {
    setEditando(null);
    setFormOpen(true);
  }

  function abrirEdicao(c: Cartao) {
    setEditando(c);
    setFormOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-brand text-[clamp(34px,4.4vw,58px)] leading-[0.95] font-light tracking-[-0.045em] text-carvao lowercase">
            cartões
          </h1>
          <p className="mt-3 max-w-2xl text-[clamp(15px,1.1vw,17px)] leading-relaxed text-muted-fg">
            Cartões usados para pagar as despesas do escritório. Guardamos
            apenas os 4 últimos dígitos.
          </p>
        </div>
        <Button onClick={abrirNovo}>+ novo cartão</Button>
      </div>

      {cartoes.length === 0 ? (
        <EmptyState
          title="Nenhum cartão cadastrado"
          description="Cadastre o primeiro cartão para vinculá-lo aos lançamentos pagos no crédito."
          action={<Button onClick={abrirNovo}>+ novo cartão</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {ordenados.map((c) => {
            const cont = contagens.get(c.id);
            const bloqueado = Boolean(cont && cont.lancamentos > 0);
            return (
              <Card key={c.id} className="gap-0 p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-brand text-xl font-normal text-carvao">
                      {c.nome}
                    </h2>
                    <p className="mt-1 font-mono text-sm text-muted-fg">
                      •••• {c.final}
                    </p>
                  </div>
                  <Badge
                    className={
                      c.ativo
                        ? "bg-carvao text-branco"
                        : "bg-carvao-50 text-subtle-fg"
                    }
                  >
                    {c.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  <Badge className="bg-carvao-50 text-carvao">
                    {BANDEIRA_LABELS[c.bandeira]}
                  </Badge>
                  {c.titular && (
                    <Badge className="bg-carvao-50 text-carvao">
                      {c.titular}
                    </Badge>
                  )}
                </div>

                {cont && (
                  <p className="mt-4 text-xs text-subtle-fg">
                    {cont.lancamentos} lançamento(s) · {cont.recorrentes}{" "}
                    recorrente(s)
                  </p>
                )}

                <div className="mt-5 flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => abrirEdicao(c)}
                  >
                    <Pencil className="size-4" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={bloqueado}
                    title={
                      bloqueado
                        ? `Não é possível excluir: há ${cont?.lancamentos} lançamento(s) vinculado(s) a este cartão.`
                        : undefined
                    }
                    onClick={() => setExcluir(c)}
                  >
                    <Trash2 className="size-4" />
                    Excluir
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <CartaoForm
        key={`cart-${formOpen}-${editando?.id ?? "novo"}`}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        cartao={editando}
      />

      <ConfirmDialog
        open={Boolean(excluir)}
        title="Excluir cartão"
        message={`Tem certeza que deseja excluir "${excluir?.nome}"? Esta ação não pode ser desfeita.`}
        onConfirm={() => excluir && removeCartao(excluir.id)}
        onClose={() => setExcluir(null)}
      />
    </div>
  );
}
