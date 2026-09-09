"use client";

import { useMemo, useState } from "react";
import { Pencil, Trash2, Sparkles } from "lucide-react";
import { useGastosStore } from "@/lib/storeGastos";
import type { DespesaRecorrente } from "@/lib/typesGastos";
import { FORMA_PAGAMENTO_LABELS } from "@/lib/typesGastos";
import { descreverRecorrencia, planejarGeracao } from "@/lib/recorrencia";
import { formatBRL, formatDate, todayISO } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DespesaRecorrenteForm } from "@/components/gastos/DespesaRecorrenteForm";

export default function RecorrentesPage() {
  const despesasRecorrentes = useGastosStore((s) => s.despesasRecorrentes);
  const lancamentos = useGastosStore((s) => s.lancamentos);
  const naturezas = useGastosStore((s) => s.naturezas);
  const cartoes = useGastosStore((s) => s.cartoes);
  const addLancamento = useGastosStore((s) => s.addLancamento);
  const removeDespesaRecorrente = useGastosStore(
    (s) => s.removeDespesaRecorrente,
  );

  const [competencia, setCompetencia] = useState(() => todayISO().slice(0, 7));
  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState<DespesaRecorrente | null>(null);
  const [excluir, setExcluir] = useState<DespesaRecorrente | null>(null);
  const [confirmarGeracao, setConfirmarGeracao] = useState(false);

  const naturezaPorId = useMemo(
    () => new Map(naturezas.map((n) => [n.id, n])),
    [naturezas],
  );
  const cartaoPorId = useMemo(
    () => new Map(cartoes.map((c) => [c.id, c])),
    [cartoes],
  );

  /**
   * O plano é derivado do estado atual do store. Depois de gerar, o store
   * muda e este memo recalcula sozinho — é o que faz o segundo "Gerar" achar
   * tudo já existente e não criar nada.
   */
  const plano = useMemo(
    () => planejarGeracao(despesasRecorrentes, lancamentos, competencia),
    [despesasRecorrentes, lancamentos, competencia],
  );

  /** Quantos lançamentos já existem de cada recorrente nesta competência. */
  const geradosPorDespesa = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const l of lancamentos) {
      if (!l.despesaRecorrenteId || l.competencia !== competencia) continue;
      mapa.set(
        l.despesaRecorrenteId,
        (mapa.get(l.despesaRecorrenteId) ?? 0) + 1,
      );
    }
    return mapa;
  }, [lancamentos, competencia]);

  const ativas = despesasRecorrentes.filter((d) => d.ativa);
  const inativas = despesasRecorrentes.filter((d) => !d.ativa);
  const grupos = [
    { key: "ativas", titulo: "Ativas", itens: ativas },
    { key: "inativas", titulo: "Inativas", itens: inativas },
  ].filter((g) => g.itens.length > 0);

  function abrirNova() {
    setEditando(null);
    setFormOpen(true);
  }

  function abrirEdicao(d: DespesaRecorrente) {
    setEditando(d);
    setFormOpen(true);
  }

  /** Só escreve depois do ConfirmDialog. */
  function gerar() {
    for (const { despesa, data } of plano.criar) {
      addLancamento({
        descricao: despesa.nome,
        naturezaId: despesa.naturezaId,
        fornecedor: despesa.fornecedor,
        formaPagamento: despesa.formaPagamento,
        cartaoId: despesa.cartaoId,
        valor: despesa.valorPrevisto,
        competencia,
        dataVencimento: data,
        dataPagamento: null,
        status: "pendente",
        comprovanteUrl: null,
        observacoes: "",
        despesaRecorrenteId: despesa.id,
      });
    }
  }

  const mensagemGeracao =
    plano.criar.length === 0
      ? plano.omitidos > 0
        ? `Nada a gerar: os ${plano.omitidos} lançamento(s) desta competência já existem.`
        : "Nenhuma recorrente ativa vence nesta competência."
      : `Serão criados ${plano.criar.length} lançamento(s), somando ${formatBRL(
          plano.total,
        )}.` +
        (plano.omitidos > 0
          ? ` Outros ${plano.omitidos} são omitidos por já existirem.`
          : "") +
        " Todos nascem como pendentes.";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-brand text-[clamp(34px,4.4vw,58px)] leading-[0.95] font-light tracking-[-0.045em] text-carvao lowercase">
            recorrentes
          </h1>
          <p className="mt-3 max-w-2xl text-[clamp(15px,1.1vw,17px)] leading-relaxed text-muted-fg">
            Modelos de gastos que se repetem. Os lançamentos não aparecem
            sozinhos: você escolhe a competência e manda gerar.
          </p>
        </div>
        <Button onClick={abrirNova}>+ nova recorrente</Button>
      </div>

      <Card>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Field className="sm:w-56">
                <FieldLabel htmlFor="ger-competencia">Competência</FieldLabel>
                <Input
                  id="ger-competencia"
                  type="month"
                  value={competencia}
                  onChange={(e) => setCompetencia(e.target.value)}
                />
              </Field>
              <p className="text-sm text-muted-fg sm:pb-2">
                {plano.criar.length > 0 ? (
                  <>
                    <span className="font-normal text-carvao">
                      {plano.criar.length}
                    </span>{" "}
                    a gerar · {formatBRL(plano.total)}
                    {plano.omitidos > 0 && (
                      <> · {plano.omitidos} já existem</>
                    )}
                  </>
                ) : plano.omitidos > 0 ? (
                  <>Tudo em dia: {plano.omitidos} já gerado(s).</>
                ) : (
                  <>Nenhum vencimento nesta competência.</>
                )}
              </p>
            </div>

            <Button
              onClick={() => setConfirmarGeracao(true)}
              disabled={plano.criar.length === 0}
              title={
                plano.criar.length === 0
                  ? "Não há lançamentos novos para gerar nesta competência."
                  : undefined
              }
            >
              <Sparkles className="size-4" />
              Gerar
            </Button>
          </div>
        </CardContent>
      </Card>

      {despesasRecorrentes.length === 0 ? (
        <EmptyState
          title="Nenhuma despesa recorrente"
          description="Cadastre a primeira para gerar os lançamentos que se repetem todo mês."
          action={<Button onClick={abrirNova}>+ nova recorrente</Button>}
        />
      ) : (
        <div className="space-y-8">
          {grupos.map((g) => (
            <section key={g.key} className="space-y-3">
              <h2 className="flex items-center gap-2 text-sm font-normal uppercase tracking-wide text-muted-foreground">
                {g.titulo}
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                  {g.itens.length}
                </span>
              </h2>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {g.itens.map((d) => {
                  const natureza = naturezaPorId.get(d.naturezaId);
                  const cartao = d.cartaoId ? cartaoPorId.get(d.cartaoId) : null;
                  const gerados = geradosPorDespesa.get(d.id) ?? 0;
                  return (
                    <Card key={d.id} className="gap-0 p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate font-brand text-lg font-normal text-carvao">
                            {d.nome}
                          </h3>
                          <p className="mt-3 max-w-2xl text-[clamp(15px,1.1vw,17px)] leading-relaxed text-muted-fg">
                            {descreverRecorrencia(d)}
                          </p>
                        </div>
                        <Badge
                          className={
                            d.ativa
                              ? "bg-carvao text-branco"
                              : "bg-carvao-50 text-subtle-fg"
                          }
                        >
                          {d.ativa ? "Ativa" : "Inativa"}
                        </Badge>
                      </div>

                      <p className="mt-4 font-brand text-2xl font-light tracking-tight text-carvao tabular-nums">
                        {formatBRL(d.valorPrevisto)}
                      </p>
                      <p className="text-xs text-subtle-fg">Valor previsto</p>

                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {natureza && (
                          <Badge className="bg-carvao-50 text-carvao">
                            <span
                              aria-hidden
                              className="mr-1 inline-block size-2 rounded-full"
                              style={{ backgroundColor: natureza.cor }}
                            />
                            {natureza.nome}
                          </Badge>
                        )}
                        <Badge className="bg-carvao-50 text-carvao">
                          {FORMA_PAGAMENTO_LABELS[d.formaPagamento]}
                        </Badge>
                        {cartao && (
                          <Badge className="bg-carvao-50 text-carvao">
                            •••• {cartao.final}
                          </Badge>
                        )}
                      </div>

                      <p className="mt-4 text-xs text-subtle-fg">
                        Vigência: {formatDate(d.inicio)} —{" "}
                        {d.fim ? formatDate(d.fim) : "sem fim"}
                      </p>
                      <p className="mt-1 text-xs text-subtle-fg">
                        {gerados} lançamento(s) gerado(s) em {competencia}
                      </p>

                      <div className="mt-5 flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => abrirEdicao(d)}
                        >
                          <Pencil className="size-4" />
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExcluir(d)}
                        >
                          <Trash2 className="size-4" />
                          Excluir
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <DespesaRecorrenteForm
        key={`rec-${formOpen}-${editando?.id ?? "nova"}`}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        despesa={editando}
      />

      <ConfirmDialog
        open={confirmarGeracao}
        title={`Gerar lançamentos de ${competencia}`}
        message={mensagemGeracao}
        confirmLabel="Gerar"
        onConfirm={gerar}
        onClose={() => setConfirmarGeracao(false)}
      />

      <ConfirmDialog
        open={Boolean(excluir)}
        title="Excluir recorrente"
        message={`Tem certeza que deseja excluir "${excluir?.nome}"? Os lançamentos já gerados por ela continuam existindo, mas ficam sem vínculo.`}
        onConfirm={() => excluir && removeDespesaRecorrente(excluir.id)}
        onClose={() => setExcluir(null)}
      />
    </div>
  );
}
