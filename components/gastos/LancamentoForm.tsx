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
import { Paperclip, FileText, X, Loader2 } from "lucide-react";
import { useGastosStore, novoId } from "@/lib/storeGastos";
import {
  ACCEPT_COMPROVANTE,
  TAMANHO_MAXIMO_MB,
  apagarComprovante,
  ehPdf,
  nomeDoArquivo,
  subirComprovante,
  validarComprovante,
} from "@/lib/storageGastos";
import type {
  FormaPagamento,
  Lancamento,
  StatusLancamento,
} from "@/lib/typesGastos";
import {
  FORMAS_PAGAMENTO,
  FORMA_PAGAMENTO_LABELS,
  STATUS_LANCAMENTO,
  STATUS_LANCAMENTO_LABELS,
} from "@/lib/typesGastos";
import { porOrdem, todayISO } from "@/lib/utils";

interface LancamentoFormProps {
  open: boolean;
  onClose: () => void;
  lancamento?: Lancamento | null;
}

type FormData = Omit<Lancamento, "id" | "criadoEm">;

// Radix Select não aceita value="" — sentinels para "nada escolhido ainda".
const SEM_CARTAO = "sem";
const SEM_NATUREZA = "sem-natureza";

/** A competência de uma data ISO é o seu `yyyy-mm`. */
function competenciaDe(dataISO: string): string {
  return dataISO ? dataISO.slice(0, 7) : "";
}

function estadoInicial(l: Lancamento | null | undefined): FormData {
  return {
    descricao: l?.descricao ?? "",
    naturezaId: l?.naturezaId ?? "",
    fornecedor: l?.fornecedor ?? "",
    formaPagamento: l?.formaPagamento ?? "pix",
    cartaoId: l?.cartaoId ?? null,
    valor: l?.valor ?? 0,
    competencia: l?.competencia ?? competenciaDe(todayISO()),
    dataVencimento: l?.dataVencimento ?? todayISO(),
    dataPagamento: l?.dataPagamento ?? null,
    status: l?.status ?? "pendente",
    // Não editáveis por aqui, mas preservados ao salvar.
    comprovanteUrl: l?.comprovanteUrl ?? null,
    observacoes: l?.observacoes ?? "",
    despesaRecorrenteId: l?.despesaRecorrenteId ?? null,
  };
}

export function LancamentoForm({
  open,
  onClose,
  lancamento,
}: LancamentoFormProps) {
  const naturezas = useGastosStore((s) => s.naturezas);
  const cartoes = useGastosStore((s) => s.cartoes);
  const addLancamento = useGastosStore((s) => s.addLancamento);
  const updateLancamento = useGastosStore((s) => s.updateLancamento);

  const naturezasOrdenadas = porOrdem(naturezas);

  const [form, setForm] = useState<FormData>(() => {
    const inicial = estadoInicial(lancamento);
    // Ao criar, já deixa a primeira natureza escolhida.
    if (!inicial.naturezaId) {
      inicial.naturezaId = porOrdem(naturezas)[0]?.id ?? "";
    }
    return inicial;
  });
  // Enquanto true, a competência acompanha o vencimento. Editar a competência
  // à mão desliga isto para esta edição (mesmo padrão do `noitesAuto`).
  const [competenciaAuto, setCompetenciaAuto] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Comprovante: arquivo escolhido nesta edição (ainda não enviado) e o
  // estado de envio, que trava o botão enquanto o upload acontece.
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [erroArquivo, setErroArquivo] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  // URL que já estava salva quando o Sheet abriu — serve para apagar o
  // arquivo antigo do bucket depois de trocar ou remover o comprovante.
  const urlOriginal = lancamento?.comprovanteUrl ?? null;

  const editando = Boolean(lancamento);
  const noCartao = form.formaPagamento === "cartao_credito";

  // Esconde cartões inativos, mas mantém o que já está vinculado.
  const cartoesSelecionaveis = porOrdem(
    cartoes.filter((c) => c.ativo || c.id === form.cartaoId),
  );

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setDataVencimento(value: string) {
    setForm((f) => ({
      ...f,
      dataVencimento: value,
      competencia: competenciaAuto ? competenciaDe(value) : f.competencia,
    }));
  }

  function setCompetencia(value: string) {
    setCompetenciaAuto(false);
    set("competencia", value);
  }

  function setFormaPagamento(value: FormaPagamento) {
    setForm((f) => ({
      ...f,
      formaPagamento: value,
      // Fora do crédito não existe cartão vinculado.
      cartaoId: value === "cartao_credito" ? f.cartaoId : null,
    }));
  }

  function setStatus(value: StatusLancamento) {
    setForm((f) => ({
      ...f,
      status: value,
      // "pago" sem data assume hoje; qualquer outro status limpa a data.
      dataPagamento:
        value === "pago" ? (f.dataPagamento ?? todayISO()) : null,
    }));
  }

  /** Valida tipo e tamanho na hora de escolher, antes de qualquer upload. */
  function escolherArquivo(file: File | null) {
    if (!file) {
      setArquivo(null);
      setErroArquivo(null);
      return;
    }
    const problema = validarComprovante(file);
    if (problema) {
      setArquivo(null);
      setErroArquivo(problema);
      return;
    }
    setArquivo(file);
    setErroArquivo(null);
  }

  /** Tira o comprovante do formulário; o arquivo só some do bucket ao salvar. */
  function removerComprovante() {
    setArquivo(null);
    setErroArquivo(null);
    set("comprovanteUrl", null);
  }

  async function salvar() {
    if (!form.descricao.trim()) {
      setErro("Informe a descrição do lançamento.");
      return;
    }
    if (!form.naturezaId) {
      setErro("Selecione a natureza do gasto.");
      return;
    }
    if (!form.valor || form.valor <= 0) {
      setErro("Informe um valor maior que zero.");
      return;
    }
    if (!form.dataVencimento) {
      setErro("Informe a data de vencimento.");
      return;
    }
    if (!form.competencia) {
      setErro("Informe a competência.");
      return;
    }
    if (noCartao && !form.cartaoId) {
      setErro("Selecione o cartão usado no pagamento.");
      return;
    }

    // O id precisa existir ANTES do upload: ele faz parte do caminho no bucket.
    const id = lancamento?.id ?? novoId();
    let comprovanteUrl = form.comprovanteUrl;

    if (arquivo) {
      // Único ponto do módulo que espera resposta do servidor. Ver o comentário
      // em `subirComprovante`: sem o await, salvaríamos uma URL que aponta para
      // um arquivo que talvez nunca tenha chegado.
      setEnviando(true);
      setErro(null);
      const { url, erro: erroUpload } = await subirComprovante(
        arquivo,
        form.competencia,
        id,
      );
      setEnviando(false);

      if (erroUpload || !url) {
        // Não salva com link quebrado: a pessoa remove o arquivo e salva sem ele.
        setErroArquivo(
          `${erroUpload ?? "Não foi possível enviar o comprovante."} O lançamento não foi salvo. Tente de novo ou remova o arquivo para salvar sem comprovante.`,
        );
        return;
      }
      comprovanteUrl = url;
    }

    // Trocou ou removeu o comprovante: o arquivo antigo vira lixo no bucket.
    if (urlOriginal && urlOriginal !== comprovanteUrl) {
      void apagarComprovante(urlOriginal);
    }

    const dados = { ...form, comprovanteUrl };
    if (lancamento) {
      updateLancamento(lancamento.id, dados);
    } else {
      addLancamento({ ...dados, id });
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
            {editando ? "Editar lançamento" : "Novo lançamento"}
          </SheetTitle>
          <SheetDescription>
            {editando
              ? "Atualize os dados do lançamento."
              : "Registre um gasto do escritório."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="lanc-descricao">
                Descrição <span className="text-primary">*</span>
              </FieldLabel>
              <Input
                id="lanc-descricao"
                value={form.descricao}
                onChange={(e) => set("descricao", e.target.value)}
                placeholder="Ex.: Tráfego pago — Meta Ads"
              />
            </Field>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="lanc-natureza">
                  Natureza <span className="text-primary">*</span>
                </FieldLabel>
                <Select
                  value={form.naturezaId || SEM_NATUREZA}
                  onValueChange={(v) =>
                    set("naturezaId", v === SEM_NATUREZA ? "" : v)
                  }
                >
                  <SelectTrigger id="lanc-natureza" className="w-full">
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
                <FieldLabel htmlFor="lanc-fornecedor">Fornecedor</FieldLabel>
                <Input
                  id="lanc-fornecedor"
                  value={form.fornecedor}
                  onChange={(e) => set("fornecedor", e.target.value)}
                  placeholder="Ex.: Google, Kalunga..."
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="lanc-forma">
                Forma de pagamento <span className="text-primary">*</span>
              </FieldLabel>
              <Select
                value={form.formaPagamento}
                onValueChange={(v) => setFormaPagamento(v as FormaPagamento)}
              >
                <SelectTrigger id="lanc-forma" className="w-full">
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

            {noCartao && (
              <Field>
                <FieldLabel htmlFor="lanc-cartao">
                  Cartão <span className="text-primary">*</span>
                </FieldLabel>
                <Select
                  value={form.cartaoId ?? SEM_CARTAO}
                  onValueChange={(v) =>
                    set("cartaoId", v === SEM_CARTAO ? null : v)
                  }
                >
                  <SelectTrigger id="lanc-cartao" className="w-full">
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

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="lanc-valor">
                  Valor (R$) <span className="text-primary">*</span>
                </FieldLabel>
                <Input
                  id="lanc-valor"
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

              <Field>
                <FieldLabel htmlFor="lanc-competencia">
                  Competência <span className="text-primary">*</span>
                </FieldLabel>
                <Input
                  id="lanc-competencia"
                  type="month"
                  value={form.competencia}
                  onChange={(e) => setCompetencia(e.target.value)}
                />
              </Field>
            </div>

            <p className="-mt-3 text-xs text-muted-foreground">
              A competência é o mês a que o gasto pertence. Ela acompanha o
              vencimento automaticamente, mas você pode ajustá-la à mão.
            </p>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="lanc-vencimento">
                  Vencimento <span className="text-primary">*</span>
                </FieldLabel>
                <Input
                  id="lanc-vencimento"
                  type="date"
                  value={form.dataVencimento}
                  onChange={(e) => setDataVencimento(e.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="lanc-status">Status</FieldLabel>
                <Select
                  value={form.status}
                  onValueChange={(v) => setStatus(v as StatusLancamento)}
                >
                  <SelectTrigger id="lanc-status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_LANCAMENTO.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LANCAMENTO_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {form.status === "pago" && (
              <Field>
                <FieldLabel htmlFor="lanc-pagamento">
                  Data de pagamento
                </FieldLabel>
                <Input
                  id="lanc-pagamento"
                  type="date"
                  value={form.dataPagamento ?? ""}
                  onChange={(e) =>
                    set("dataPagamento", e.target.value || null)
                  }
                />
              </Field>
            )}

            <Field>
              <FieldLabel htmlFor="lanc-comprovante">Comprovante</FieldLabel>

              {form.comprovanteUrl ? (
                <div className="rounded-xl border border-border bg-card p-3">
                  {ehPdf(form.comprovanteUrl) ? (
                    <a
                      href={form.comprovanteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm font-normal text-coral-dark hover:underline"
                    >
                      <FileText className="size-4 shrink-0" />
                      <span className="truncate">
                        {nomeDoArquivo(form.comprovanteUrl)}
                      </span>
                    </a>
                  ) : (
                    <a
                      href={form.comprovanteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={form.comprovanteUrl}
                        alt={nomeDoArquivo(form.comprovanteUrl)}
                        className="max-h-48 w-full rounded-lg object-contain"
                      />
                      <span className="mt-2 block truncate text-xs text-subtle-fg">
                        {nomeDoArquivo(form.comprovanteUrl)}
                      </span>
                    </a>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={removerComprovante}
                  >
                    <X className="size-4" />
                    Remover comprovante
                  </Button>
                </div>
              ) : (
                <>
                  <Input
                    id="lanc-comprovante"
                    type="file"
                    accept={ACCEPT_COMPROVANTE}
                    className="h-auto py-2 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-sm file:font-normal file:text-carvao"
                    onChange={(e) =>
                      escolherArquivo(e.target.files?.[0] ?? null)
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG, WEBP ou PDF, até {TAMANHO_MAXIMO_MB} MB. O arquivo
                    fica num bucket público: quem tiver o link consegue abrir.
                  </p>
                </>
              )}

              {arquivo && (
                <p className="flex items-center gap-2 text-xs text-muted-fg">
                  <Paperclip className="size-3.5 shrink-0" />
                  <span className="truncate">
                    {arquivo.name} ({(arquivo.size / 1024 / 1024).toFixed(1)} MB)
                  </span>
                </p>
              )}

              {erroArquivo && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {erroArquivo}
                </p>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="lanc-obs">Observações</FieldLabel>
              <Textarea
                id="lanc-obs"
                rows={3}
                value={form.observacoes}
                onChange={(e) => set("observacoes", e.target.value)}
                placeholder="Anotações internas sobre este gasto."
              />
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
            <Button variant="outline" onClick={onClose} disabled={enviando}>
              Cancelar
            </Button>
            <Button onClick={salvar} disabled={enviando}>
              {enviando && <Loader2 className="size-4 animate-spin" />}
              {enviando
                ? "Enviando comprovante..."
                : editando
                  ? "Salvar alterações"
                  : "Registrar lançamento"}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
