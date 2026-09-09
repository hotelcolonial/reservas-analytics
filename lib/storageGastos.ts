/**
 * Anexo de comprovante de um lançamento (Supabase Storage).
 *
 * ⚠️ O bucket `comprovantes` é PÚBLICO. Qualquer pessoa com a URL abre o
 * arquivo, sem autenticação — coerente com o resto do app, que também lê e
 * escreve com a chave anon (ver ARQUITETURA.md §7). O que protege na prática é
 * o caminho: ele carrega o id (UUID) do lançamento, então a URL não é
 * adivinhável. Ainda assim, não suba aqui documento que não possa vazar.
 */
import { getSupabase, supabaseConfigured } from "./supabase";

export const BUCKET_COMPROVANTES = "comprovantes";

/** Tipos aceitos: imagem (jpg, png, webp) e PDF. */
export const TIPOS_COMPROVANTE = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

export const TAMANHO_MAXIMO_MB = 5;
const TAMANHO_MAXIMO_BYTES = TAMANHO_MAXIMO_MB * 1024 * 1024;

/** Aceita no seletor de arquivo do navegador. */
export const ACCEPT_COMPROVANTE = ".jpg,.jpeg,.png,.webp,.pdf,image/*,application/pdf";

/**
 * Valida tipo e tamanho ANTES de subir.
 * Devolve a mensagem de erro, ou null quando o arquivo passa.
 */
export function validarComprovante(file: File): string | null {
  const tipoOk = (TIPOS_COMPROVANTE as readonly string[]).includes(file.type);
  if (!tipoOk) {
    return "Formato não aceito. Envie uma imagem (JPG, PNG ou WEBP) ou um PDF.";
  }
  if (file.size > TAMANHO_MAXIMO_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return `Arquivo de ${mb} MB. O limite é ${TAMANHO_MAXIMO_MB} MB.`;
  }
  return null;
}

/** Nome de arquivo seguro para virar caminho: sem acento, espaço nem símbolo. */
export function sanitizarNome(nome: string): string {
  // ̀-ͯ = marcas de acento que o NFD separa da letra.
  const semAcento = nome.normalize("NFD").replace(/[̀-ͯ]/g, "");
  const limpo = semAcento
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const curto = limpo.slice(0, 80);
  // Nome que sobrou vazio ou só com a extensão (ex.: "日本語.png") ganha um
  // nome base, para não virar um arquivo chamado só ".png".
  if (!curto || curto.startsWith(".")) return `comprovante${curto}`;
  return curto;
}

/** Caminho dentro do bucket: `${competencia}/${lancamentoId}-${nome}`. */
export function caminhoComprovante(
  competencia: string,
  lancamentoId: string,
  nomeArquivo: string,
): string {
  return `${competencia}/${lancamentoId}-${sanitizarNome(nomeArquivo)}`;
}

/** Extrai o caminho no bucket a partir da URL pública, para poder apagar. */
export function caminhoDaUrl(url: string): string | null {
  const marca = `/object/public/${BUCKET_COMPROVANTES}/`;
  const i = url.indexOf(marca);
  if (i < 0) return null;
  const caminho = url.slice(i + marca.length).split("?")[0];
  return caminho ? decodeURIComponent(caminho) : null;
}

/** Nome legível do arquivo, para mostrar quando é PDF. */
export function nomeDoArquivo(url: string): string {
  const caminho = caminhoDaUrl(url) ?? url;
  const nome = caminho.split("/").pop() ?? "comprovante";
  // Tira o prefixo do id, que não interessa a quem lê.
  return nome.replace(/^[0-9a-f-]{36}-/i, "");
}

export function ehPdf(url: string): boolean {
  return nomeDoArquivo(url).toLowerCase().endsWith(".pdf");
}

export interface ResultadoUpload {
  url?: string;
  erro?: string;
}

/**
 * Sobe o comprovante e devolve a URL pública.
 *
 * Esta é a ÚNICA escrita do módulo que espera resposta (`await`), e é uma
 * exceção consciente ao padrão otimista descrito em ARQUITETURA.md §5. Motivo:
 * o resto do app grava um dado que ele mesmo já tem em mãos, então um erro só
 * custa uma linha desatualizada até o próximo reload. Aqui não — a URL só
 * existe DEPOIS que o servidor aceita o arquivo. Salvar otimista guardaria uma
 * `comprovanteUrl` que aponta para um arquivo que nunca chegou, e o lançamento
 * ficaria com um link quebrado para sempre.
 */
export async function subirComprovante(
  file: File,
  competencia: string,
  lancamentoId: string,
): Promise<ResultadoUpload> {
  if (!supabaseConfigured) {
    return { erro: "Supabase não configurado: não é possível anexar arquivos." };
  }
  const caminho = caminhoComprovante(competencia, lancamentoId, file.name);
  const { error } = await getSupabase()
    .storage.from(BUCKET_COMPROVANTES)
    .upload(caminho, file, { upsert: true, contentType: file.type });

  if (error) return { erro: `Falha ao enviar o comprovante: ${error.message}` };

  const { data } = getSupabase()
    .storage.from(BUCKET_COMPROVANTES)
    .getPublicUrl(caminho);

  return { url: data.publicUrl };
}

/**
 * Apaga o arquivo do bucket. Diferente do upload, esta pode ser disparada sem
 * `await`: um arquivo órfão é lixo, não um dado errado na tela.
 */
export async function apagarComprovante(url: string | null): Promise<void> {
  if (!url || !supabaseConfigured) return;
  const caminho = caminhoDaUrl(url);
  if (!caminho) return;
  const { error } = await getSupabase()
    .storage.from(BUCKET_COMPROVANTES)
    .remove([caminho]);
  if (error) console.error("Supabase remove comprovante:", error.message);
}
