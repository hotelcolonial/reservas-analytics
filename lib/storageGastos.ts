/**
 * Anexo de comprovante de um lançamento (Supabase Storage).
 *
 * O bucket `comprovantes` é PRIVADO. Quem controla o acesso é a policy de
 * `storage.objects` para o role `authenticated`: só quem está logado no
 * painel lê, grava ou apaga. Por isso o arquivo nunca tem URL fixa — para
 * exibir, pede-se uma URL assinada de curta duração (`urlAssinada`).
 *
 * O que o lançamento guarda em `comprovanteUrl` é o CAMINHO dentro do bucket
 * (`${competencia}/${lancamentoId}-${nome}`), não uma URL. O nome do campo
 * ficou por compatibilidade com a coluna `comprovante_url` do banco.
 *
 * Compatibilidade: lançamentos antigos guardaram a URL pública da época em que
 * o bucket era público. Todas as funções que recebem `valor` aceitam os dois
 * formatos — `caminhoDaUrl` normaliza — e nada precisa ser migrado no banco.
 */
import { toast } from "sonner";
import { getSupabase } from "./supabase";

export const BUCKET_COMPROVANTES = "comprovantes";

/** Validade da URL assinada, em segundos (1 hora). */
export const VALIDADE_URL_ASSINADA = 60 * 60;

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

/** Marca da URL pública antiga, de quando o bucket era público. */
const MARCA_URL_PUBLICA = `/object/public/${BUCKET_COMPROVANTES}/`;

/**
 * Normaliza o que está guardado em `comprovanteUrl` para o caminho no bucket.
 *
 *  - URL pública antiga (`…/object/public/comprovantes/<caminho>`) → extrai o
 *    caminho, como sempre fez.
 *  - Caminho direto (formato atual) → devolve como está, sem barra inicial.
 *  - Qualquer outra URL absoluta → null: não é nosso, não dá para assinar.
 */
export function caminhoDaUrl(valor: string): string | null {
  const i = valor.indexOf(MARCA_URL_PUBLICA);
  if (i >= 0) {
    const caminho = valor.slice(i + MARCA_URL_PUBLICA.length).split("?")[0];
    return caminho ? decodeURIComponent(caminho) : null;
  }
  if (/^https?:\/\//i.test(valor)) return null;
  const caminho = valor.replace(/^\/+/, "");
  return caminho || null;
}

/** Nome legível do arquivo, para mostrar quando é PDF. Aceita URL ou caminho. */
export function nomeDoArquivo(valor: string): string {
  const caminho = caminhoDaUrl(valor) ?? valor;
  const nome = caminho.split("/").pop() ?? "comprovante";
  // Tira o prefixo do id, que não interessa a quem lê.
  return nome.replace(/^[0-9a-f-]{36}-/i, "");
}

/** Aceita URL ou caminho. */
export function ehPdf(valor: string): boolean {
  return nomeDoArquivo(valor).toLowerCase().endsWith(".pdf");
}

export interface ResultadoUpload {
  /** Caminho dentro do bucket. É isto que vai para `comprovanteUrl`. */
  caminho?: string;
  erro?: string;
}

/**
 * Sobe o comprovante e devolve o CAMINHO no bucket (não uma URL).
 *
 * Esta é a ÚNICA escrita do módulo que espera resposta (`await`), e é uma
 * exceção consciente ao padrão otimista descrito em ARQUITETURA.md §5. Motivo:
 * o resto do app grava um dado que ele mesmo já tem em mãos, então um erro só
 * custa uma linha desatualizada até o próximo reload. Aqui não — o caminho só
 * vale DEPOIS que o servidor aceita o arquivo. Salvar otimista guardaria um
 * caminho que aponta para um arquivo que nunca chegou.
 *
 * Nunca lança: falha (inclusive Supabase sem configurar) vira `erro` — e o
 * mesmo motivo sai num toast, para o feedback ser o das outras escritas (ver
 * lib/escritaOtimista.ts). Sem "tentar novamente" aqui: o retry é salvar o
 * formulário de novo, que reenvia o arquivo.
 */
export async function subirComprovante(
  file: File,
  competencia: string,
  lancamentoId: string,
): Promise<ResultadoUpload> {
  const caminho = caminhoComprovante(competencia, lancamentoId, file.name);
  try {
    const { error } = await getSupabase()
      .storage.from(BUCKET_COMPROVANTES)
      .upload(caminho, file, { upsert: true, contentType: file.type });
    if (error) return falhaUpload(error.message);
    return { caminho };
  } catch (err) {
    return falhaUpload(err instanceof Error ? err.message : String(err));
  }
}

function falhaUpload(motivo: string): ResultadoUpload {
  console.error("Supabase upload comprovante:", motivo);
  toast.error("Não foi possível enviar o comprovante.", {
    description: motivo,
  });
  return { erro: `Falha ao enviar o comprovante: ${motivo}` };
}

/**
 * URL assinada, válida por 1 hora, para exibir ou baixar o comprovante.
 * Aceita URL antiga ou caminho. Devolve null se não der para assinar (valor
 * inválido, arquivo inexistente, sem sessão, rede…). Não guarde o resultado
 * além da vida da tela: ele expira.
 */
export async function urlAssinada(valor: string): Promise<string | null> {
  const caminho = caminhoDaUrl(valor);
  if (!caminho) return null;
  try {
    const { data, error } = await getSupabase()
      .storage.from(BUCKET_COMPROVANTES)
      .createSignedUrl(caminho, VALIDADE_URL_ASSINADA);
    if (error) {
      console.error("Supabase createSignedUrl:", error.message);
      return null;
    }
    return data?.signedUrl ?? null;
  } catch (err) {
    console.error("Supabase createSignedUrl:", err);
    return null;
  }
}

/**
 * Apaga o arquivo do bucket. Aceita URL antiga ou caminho. Diferente do
 * upload, esta pode ser disparada sem `await`: um arquivo órfão é lixo, não um
 * dado errado na tela.
 */
export async function apagarComprovante(valor: string | null): Promise<void> {
  if (!valor) return;
  const caminho = caminhoDaUrl(valor);
  if (!caminho) return;
  try {
    const { error } = await getSupabase()
      .storage.from(BUCKET_COMPROVANTES)
      .remove([caminho]);
    if (error) console.error("Supabase remove comprovante:", error.message);
  } catch (err) {
    console.error("Supabase remove comprovante:", err);
  }
}
