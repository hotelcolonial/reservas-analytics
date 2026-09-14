"use client";

import { useEffect, useState } from "react";
import { FileText, Paperclip, AlertCircle } from "lucide-react";
import { ehPdf, nomeDoArquivo, urlAssinada } from "@/lib/storageGastos";
import { cn } from "@/lib/utils";

/**
 * Exibição do comprovante de um lançamento.
 *
 * O bucket é privado, então o que está guardado (caminho, ou URL pública
 * antiga) não abre sozinho: cada tela pede uma URL assinada ao montar. A URL
 * vive só no estado do componente — some ao desmontar e nunca é cacheada,
 * porque expira em 1 hora.
 */

export type EstadoComprovante =
  | { status: "carregando"; url: null }
  | { status: "pronto"; url: string }
  | { status: "erro"; url: null };

/**
 * Resolve a URL assinada de `valor` (caminho ou URL antiga).
 *
 * Guarda o par `{ valor, url }` que foi resolvido; "carregando" é derivado
 * (o par guardado ainda não é do `valor` atual), sem `setState` síncrono no
 * efeito. Trocar o `valor` volta a "carregando" sozinho.
 */
export function useUrlAssinada(valor: string | null): EstadoComprovante {
  const [resolvido, setResolvido] = useState<{
    valor: string;
    url: string | null;
  } | null>(null);

  useEffect(() => {
    if (!valor) return;
    let ativo = true;
    urlAssinada(valor).then((url) => {
      // Ignora a resposta se o valor mudou ou a tela fechou no meio.
      if (ativo) setResolvido({ valor, url });
    });
    return () => {
      ativo = false;
    };
  }, [valor]);

  if (!valor || resolvido?.valor !== valor) {
    return { status: "carregando", url: null };
  }
  return resolvido.url
    ? { status: "pronto", url: resolvido.url }
    : { status: "erro", url: null };
}

/**
 * Prévia no formulário: imagem inline ou link de PDF, com os estados de
 * carregando e erro. `valor` nunca é null aqui — o pai só renderiza quando há
 * comprovante.
 */
export function ComprovantePreview({ valor }: { valor: string }) {
  const { status, url } = useUrlAssinada(valor);
  const nome = nomeDoArquivo(valor);

  if (status === "carregando") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-fg">
        <span className="size-4 animate-spin rounded-full border-2 border-border-strong border-t-coral" />
        Carregando comprovante…
      </div>
    );
  }

  if (status === "erro") {
    return (
      <div className="flex items-start gap-2 text-sm text-destructive">
        <AlertCircle className="mt-0.5 size-4 shrink-0" />
        <span>
          Não foi possível abrir o comprovante{" "}
          <span className="text-muted-fg">({nome})</span>. Tente fechar e abrir
          de novo; se persistir, o arquivo pode ter sido removido do bucket.
        </span>
      </div>
    );
  }

  if (ehPdf(valor)) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-sm font-normal text-coral-dark hover:underline"
      >
        <FileText className="size-4 shrink-0" />
        <span className="truncate">{nome}</span>
      </a>
    );
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="block">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={nome}
        className="max-h-48 w-full rounded-lg object-contain"
      />
      <span className="mt-2 block truncate text-xs text-subtle-fg">{nome}</span>
    </a>
  );
}

/**
 * Ícone-link para a tabela. Enquanto assina, fica opaco e sem link; em erro,
 * mostra o ícone de alerta com a explicação no `title`.
 */
export function ComprovanteLink({
  valor,
  descricao,
  className,
}: {
  valor: string;
  descricao: string;
  className?: string;
}) {
  const { status, url } = useUrlAssinada(valor);

  if (status === "erro") {
    return (
      <span
        title="Não foi possível abrir o comprovante"
        aria-label={`Comprovante de ${descricao} indisponível`}
        className={cn("shrink-0 text-destructive", className)}
      >
        <AlertCircle className="size-4" />
      </span>
    );
  }

  if (status === "carregando") {
    return (
      <span
        title="Carregando comprovante…"
        aria-busy="true"
        className={cn("shrink-0 text-subtle-fg opacity-50", className)}
      >
        <Paperclip className="size-4" />
      </span>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title="Abrir comprovante"
      aria-label={`Abrir comprovante de ${descricao}`}
      className={cn(
        "shrink-0 text-subtle-fg transition-colors hover:text-coral-dark",
        className,
      )}
    >
      <Paperclip className="size-4" />
    </a>
  );
}
