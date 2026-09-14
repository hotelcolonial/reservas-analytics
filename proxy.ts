/**
 * Proxy (o antigo `middleware.ts`, renomeado no Next 16). Roda no servidor
 * antes de qualquer rota:
 *
 *   1. Renova a sessão do Supabase a cada request (cookies).
 *   2. Sem sessão e fora de `/login` → manda para `/login`.
 *   3. Com sessão em `/login` → manda para `/` (hub).
 *
 * Em modo mock (sem env vars) deixa tudo passar: não há sessão possível.
 * Não há roles: qualquer usuário autenticado entra em tudo.
 */
import type { NextRequest } from "next/server";
import { atualizarSessao, redirecionarComCookies } from "@/lib/supabaseServer";
import { ROTA_LOGIN, ROTA_INICIAL } from "@/lib/rotasAuth";

export async function proxy(request: NextRequest) {
  const { resposta, autenticado } = await atualizarSessao(request);
  const emLogin = request.nextUrl.pathname === ROTA_LOGIN;

  if (!autenticado && !emLogin) {
    return redirecionarComCookies(request, ROTA_LOGIN, resposta);
  }
  if (autenticado && emLogin) {
    return redirecionarComCookies(request, ROTA_INICIAL, resposta);
  }
  return resposta;
}

export const config = {
  matcher: [
    /*
     * Tudo, exceto:
     *  - _next/static (arquivos do build)
     *  - _next/image (otimização de imagem)
     *  - favicon.ico
     *  - arquivos estáticos por extensão (svg, png, jpg, fontes, etc.)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|woff2?|ttf)$).*)",
  ],
};
