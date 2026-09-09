"use client";

import { useMemo, useState } from "react";
import { Pencil, Trash2, Paperclip } from "lucide-react";
import { useGastosStore } from "@/lib/storeGastos";
import type { Lancamento } from "@/lib/typesGastos";
import { FORMA_PAGAMENTO_LABELS } from "@/lib/typesGastos";
import { estaAtrasado } from "@/lib/calculationsGastos";
import { cn, formatBRL, formatDate, todayISO } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Pagination } from "@/components/ui/Pagination";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { LancamentoForm } from "@/components/gastos/LancamentoForm";
import {
  LancamentoFilters,
  filtrosVazios,
  SEM_CARTAO,
  STATUS_ATRASADO,
  COM_COMPROVANTE,
  SEM_COMPROVANTE,
  type FiltrosLancamento,
} from "@/components/gastos/LancamentoFilters";

const POR_PAGINA = 10;

export default function LancamentosPage() {
  const lancamentos = useGastosStore((s) => s.lancamentos);
  const naturezas = useGastosStore((s) => s.naturezas);
  const cartoes = useGastosStore((s) => s.cartoes);
  const removeLancamento = useGastosStore((s) => s.removeLancamento);
  const novoLancamentoPedido = useGastosStore((s) => s.novoLancamentoPedido);
  const consumirNovoLancamento = useGastosStore(
    (s) => s.consumirNovoLancamento,
  );

  const [filtros, setFiltros] = useState<FiltrosLancamento>(filtrosVazios);
  const [page, setPage] = useState(1);
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<Lancamento | null>(null);
  const [excluir, setExcluir] = useState<Lancamento | null>(null);

  // O Sheet abre por ação daqui OU pelo sinal do botão do header — derivado,
  // sem efeito de sincronização. Um pedido do header sempre abre em branco.
  const formOpen = aberto || novoLancamentoPedido;
  const emEdicao = novoLancamentoPedido ? null : editando;

  const hoje = todayISO();

  const naturezaPorId = useMemo(
    () => new Map(naturezas.map((n) => [n.id, n])),
    [naturezas],
  );
  const cartaoPorId = useMemo(
    () => new Map(cartoes.map((c) => [c.id, c])),
    [cartoes],
  );

  function abrirNovo() {
    setEditando(null);
    setAberto(true);
  }

  function fecharForm() {
    setAberto(false);
    setEditando(null);
    consumirNovoLancamento();
  }

  function aplicarFiltros(f: FiltrosLancamento) {
    setFiltros(f);
    setPage(1);
  }

  const filtrados = useMemo(() => {
    const busca = filtros.busca.trim().toLowerCase();
    return lancamentos
      .filter((l) => {
        if (busca) {
          const alvo = `${l.descricao} ${l.fornecedor}`.toLowerCase();
          if (!alvo.includes(busca)) return false;
        }
        if (filtros.naturezaId && l.naturezaId !== filtros.naturezaId)
          return false;
        if (filtros.cartaoId === SEM_CARTAO && l.cartaoId !== null) return false;
        if (
          filtros.cartaoId &&
          filtros.cartaoId !== SEM_CARTAO &&
          l.cartaoId !== filtros.cartaoId
        )
          return false;
        if (
          filtros.formaPagamento &&
          l.formaPagamento !== filtros.formaPagamento
        )
          return false;
        if (filtros.status === STATUS_ATRASADO) {
          if (!estaAtrasado(l, hoje)) return false;
        } else if (filtros.status && l.status !== filtros.status) {
          return false;
        }
        if (filtros.comprovante === COM_COMPROVANTE && !l.comprovanteUrl)
          return false;
        if (filtros.comprovante === SEM_COMPROVANTE && l.comprovanteUrl)
          return false;
        if (filtros.vencimentoDe && l.dataVencimento < filtros.vencimentoDe)
          return false;
        if (filtros.vencimentoAte && l.dataVencimento > filtros.vencimentoAte)
          return false;
        if (filtros.competenciaDe && l.competencia < filtros.competenciaDe)
          return false;
        if (filtros.competenciaAte && l.competencia > filtros.competenciaAte)
          return false;
        return true;
      })
      .sort((a, b) => b.dataVencimento.localeCompare(a.dataVencimento));
  }, [lancamentos, filtros, hoje]);

  // Cancelados ficam fora de todos os totais (ver GASTOS.md).
  const totais = useMemo(() => {
    let total = 0;
    let pago = 0;
    let pendente = 0;
    for (const l of filtrados) {
      if (l.status === "cancelado") continue;
      total += l.valor;
      if (l.status === "pago") pago += l.valor;
      if (l.status === "pendente") pendente += l.valor;
    }
    return { total, pago, pendente };
  }, [filtrados]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaAtual = Math.min(page, totalPaginas);
  const paginados = filtrados.slice(
    (paginaAtual - 1) * POR_PAGINA,
    paginaAtual * POR_PAGINA,
  );

  function abrirEdicao(l: Lancamento) {
    setEditando(l);
    setAberto(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-brand text-[clamp(34px,4.4vw,58px)] leading-[0.95] font-light tracking-[-0.045em] text-carvao lowercase">
            lançamentos
          </h1>
          <p className="mt-3 max-w-2xl text-[clamp(15px,1.1vw,17px)] leading-relaxed text-muted-fg">
            {filtrados.length} lançamento(s) no filtro atual.
          </p>
        </div>
        <Button onClick={abrirNovo}>+ novo lançamento</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          label="Total filtrado"
          value={formatBRL(totais.total)}
          hint="Sem os cancelados"
        />
        <MetricCard
          label="Total pago"
          value={formatBRL(totais.pago)}
          hint="Lançamentos quitados"
        />
        <MetricCard
          label="Total pendente"
          value={formatBRL(totais.pendente)}
          hint="Ainda a pagar"
        />
      </div>

      <LancamentoFilters
        filtros={filtros}
        onChange={aplicarFiltros}
        naturezas={naturezas}
        cartoes={cartoes}
      />

      {filtrados.length === 0 ? (
        <EmptyState
          title={
            lancamentos.length === 0
              ? "Nenhum lançamento registrado"
              : "Nenhum lançamento encontrado"
          }
          description={
            lancamentos.length === 0
              ? "Registre o primeiro gasto do escritório para começar a acompanhar."
              : "Ajuste os filtros ou limpe a busca para ver mais resultados."
          }
          action={
            lancamentos.length === 0 ? (
              <Button onClick={abrirNovo}>+ novo lançamento</Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <Card>
            <CardContent className="-mx-2 overflow-x-auto">
              <table className="w-full min-w-[880px] border-collapse text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-subtle-fg">
                    <th className="px-3 py-2 font-normal">Descrição</th>
                    <th className="px-3 py-2 font-normal">Natureza</th>
                    <th className="px-3 py-2 font-normal">Pagamento</th>
                    <th className="px-3 py-2 font-normal">Vencimento</th>
                    <th className="px-3 py-2 text-right font-normal">Valor</th>
                    <th className="px-3 py-2 font-normal">Status</th>
                    <th className="px-3 py-2 text-right font-normal">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {paginados.map((l) => {
                    const natureza = naturezaPorId.get(l.naturezaId);
                    const cartao = l.cartaoId
                      ? cartaoPorId.get(l.cartaoId)
                      : null;
                    return (
                      <tr key={l.id} className="hover:bg-carvao-50/50">
                        <td className="px-3 py-3">
                          <p className="flex items-center gap-1.5 font-normal text-carvao">
                            <span className="min-w-0">{l.descricao}</span>
                            {l.comprovanteUrl && (
                              <a
                                href={l.comprovanteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Abrir comprovante"
                                aria-label={`Abrir comprovante de ${l.descricao}`}
                                className="shrink-0 text-subtle-fg transition-colors hover:text-coral-dark"
                              >
                                <Paperclip className="size-4" />
                              </a>
                            )}
                          </p>
                          {l.fornecedor && (
                            <p className="text-xs text-subtle-fg">
                              {l.fornecedor}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          {natureza ? (
                            <span className="inline-flex items-center gap-2">
                              <span
                                aria-hidden
                                className="size-3 shrink-0 rounded-full border border-black/10"
                                style={{ backgroundColor: natureza.cor }}
                              />
                              <span className="text-muted-fg">
                                {natureza.nome}
                              </span>
                            </span>
                          ) : (
                            <span className="text-subtle-fg">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-muted-fg">
                          {FORMA_PAGAMENTO_LABELS[l.formaPagamento]}
                          {cartao && (
                            <span className="block text-xs text-subtle-fg">
                              {cartao.nome} · •••• {cartao.final}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-muted-fg">
                          {formatDate(l.dataVencimento)}
                        </td>
                        <td className="px-3 py-3 text-right font-normal text-carvao tabular-nums">
                          {formatBRL(l.valor)}
                        </td>
                        <td className="px-3 py-3">
                          <StatusBadge lancamento={l} hoje={hoje} />
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Editar ${l.descricao}`}
                              onClick={() => abrirEdicao(l)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Excluir ${l.descricao}`}
                              onClick={() => setExcluir(l)}
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

          <Pagination
            page={paginaAtual}
            totalPages={totalPaginas}
            onPage={setPage}
          />
        </>
      )}

      <LancamentoForm
        key={`lanc-${formOpen}-${emEdicao?.id ?? "novo"}`}
        open={formOpen}
        onClose={fecharForm}
        lancamento={emEdicao}
      />

      <ConfirmDialog
        open={Boolean(excluir)}
        title="Excluir lançamento"
        message={`Tem certeza que deseja excluir "${excluir?.descricao}"? Esta ação não pode ser desfeita.`}
        onConfirm={() => excluir && removeLancamento(excluir.id)}
        onClose={() => setExcluir(null)}
      />
    </div>
  );
}

/** Badge de status, com o "atrasado" derivado em vermelho. */
function StatusBadge({
  lancamento,
  hoje,
}: {
  lancamento: Lancamento;
  hoje: string;
}) {
  const atrasado = estaAtrasado(lancamento, hoje);
  const label = atrasado
    ? "Atrasado"
    : lancamento.status === "pago"
      ? "Pago"
      : lancamento.status === "pendente"
        ? "Pendente"
        : "Cancelado";

  const estilo = atrasado
    ? "bg-destructive/10 text-destructive"
    : lancamento.status === "pago"
      ? "bg-carvao text-branco"
      : lancamento.status === "pendente"
        ? "bg-coral/12 text-coral-dark"
        : "bg-carvao-50 text-subtle-fg";

  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-normal",
        estilo,
      )}
    >
      {label}
    </span>
  );
}
