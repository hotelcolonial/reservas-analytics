"use client";

import { useMemo, useState } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Propriedade } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function PropriedadesPage() {
  const propriedades = useStore((s) => s.propriedades);
  const propriedadeAtivaId = useStore((s) => s.propriedadeAtivaId);
  const campanhasAll = useStore((s) => s.campanhasAll);
  const reservasAll = useStore((s) => s.reservasAll);
  const gastosAll = useStore((s) => s.gastosAll);
  const setPropriedadeAtiva = useStore((s) => s.setPropriedadeAtiva);
  const addPropriedade = useStore((s) => s.addPropriedade);
  const updatePropriedade = useStore((s) => s.updatePropriedade);
  const removePropriedade = useStore((s) => s.removePropriedade);

  const [novoNome, setNovoNome] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState("");
  const [excluir, setExcluir] = useState<Propriedade | null>(null);

  const contagens = useMemo(() => {
    const mapa = new Map<
      string,
      { campanhas: number; reservas: number; gastos: number }
    >();
    for (const p of propriedades) {
      mapa.set(p.id, {
        campanhas: campanhasAll.filter((c) => c.propriedadeId === p.id).length,
        reservas: reservasAll.filter((r) => r.propriedadeId === p.id).length,
        gastos: gastosAll.filter((g) => g.propriedadeId === p.id).length,
      });
    }
    return mapa;
  }, [propriedades, campanhasAll, reservasAll, gastosAll]);

  function adicionar() {
    const nome = novoNome.trim();
    if (!nome) return;
    const proximaOrdem =
      propriedades.reduce((max, p) => Math.max(max, p.ordem), 0) + 1;
    addPropriedade({ nome, ordem: proximaOrdem });
    setNovoNome("");
  }

  function iniciarEdicao(p: Propriedade) {
    setEditId(p.id);
    setEditNome(p.nome);
  }

  function salvarEdicao() {
    const nome = editNome.trim();
    if (editId && nome) updatePropriedade(editId, { nome });
    setEditId(null);
    setEditNome("");
  }

  function temDados(id: string) {
    const c = contagens.get(id);
    return !!c && c.campanhas + c.reservas + c.gastos > 0;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-brand text-[clamp(34px,4.4vw,58px)] leading-[0.95] font-light tracking-[-0.045em] text-carvao lowercase">
          propriedades
        </h1>
        <p className="mt-3 max-w-2xl text-[clamp(15px,1.1vw,17px)] leading-relaxed text-muted-fg">
          Cada propriedade (hotel/pousada) tem seu próprio painel. Use o seletor
          no topo para trocar de propriedade; os dados são sempre isolados.
        </p>
      </div>

      <Card>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Field className="flex-1">
              <FieldLabel htmlFor="nova-prop">Nova propriedade</FieldLabel>
              <Input
                id="nova-prop"
                value={novoNome}
                placeholder="Ex.: Posada Cataratas"
                onChange={(e) => setNovoNome(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && adicionar()}
              />
            </Field>
            <Button onClick={adicionar} disabled={!novoNome.trim()}>
              Adicionar propriedade
            </Button>
          </div>
        </CardContent>
      </Card>

      {propriedades.length === 0 ? (
        <EmptyState
          title="Nenhuma propriedade cadastrada"
          description="Adicione a primeira propriedade acima. Se você usa Supabase, rode antes a migração que cria a tabela de propriedades."
        />
      ) : (
        <div className="space-y-3">
          {propriedades.map((p) => {
            const c = contagens.get(p.id);
            const ativa = p.id === propriedadeAtivaId;
            const bloqueada = temDados(p.id);
            return (
              <Card key={p.id} className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    {editId === p.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editNome}
                          autoFocus
                          onChange={(e) => setEditNome(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") salvarEdicao();
                            if (e.key === "Escape") setEditId(null);
                          }}
                          className="max-w-xs"
                        />
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label="Salvar"
                          onClick={salvarEdicao}
                        >
                          <Check className="size-4" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label="Cancelar"
                          onClick={() => setEditId(null)}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-brand text-lg font-normal text-carvao">
                          {p.nome}
                        </span>
                        {ativa && (
                          <Badge className="bg-primary/15 text-coral-dark">
                            Ativa
                          </Badge>
                        )}
                      </div>
                    )}
                    {c && (
                      <p className="mt-1 text-xs text-subtle-fg">
                        {c.campanhas} campanha(s) · {c.reservas} reserva(s) ·{" "}
                        {c.gastos} lançamento(s) de verba
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {!ativa && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPropriedadeAtiva(p.id)}
                      >
                        Ver painel
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => iniciarEdicao(p)}
                    >
                      <Pencil className="size-4" />
                      Renomear
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={bloqueada}
                      title={
                        bloqueada
                          ? "Não é possível excluir: há dados vinculados a esta propriedade."
                          : undefined
                      }
                      onClick={() => setExcluir(p)}
                    >
                      <Trash2 className="size-4" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(excluir)}
        title="Excluir propriedade"
        message={`Tem certeza que deseja excluir "${excluir?.nome}"? Esta ação não pode ser desfeita.`}
        onConfirm={() => excluir && removePropriedade(excluir.id)}
        onClose={() => setExcluir(null)}
      />
    </div>
  );
}
