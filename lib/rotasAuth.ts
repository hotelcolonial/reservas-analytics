/**
 * Rotas que a autenticação conhece. Módulo sem dependências de propósito:
 * é importado tanto pelo `proxy.ts` (servidor) quanto pelo código de
 * navegador, e nenhum dos dois deve arrastar as dependências do outro.
 */

/** Única rota pública. Tudo o mais exige sessão. */
export const ROTA_LOGIN = "/login";

/** Para onde vai quem acaba de entrar, ou quem já logado abre `/login`. */
export const ROTA_INICIAL = "/";
