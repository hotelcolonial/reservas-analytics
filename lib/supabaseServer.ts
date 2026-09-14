/**
 * Cliente de SERVIDOR do Supabase (`@supabase/ssr`), usado só pelo `proxy.ts`.
 *
 * É o primeiro pedaço de código de servidor do projeto. Ele não faz query
 * nenhuma: só lê os cookies de sessão que o cliente de navegador gravou,
 * renova o token se estiver vencido e diz se há usuário. Toda leitura e
 * escrita de dados continua acontecendo no navegador (ver ARQUITETURA.md §3).
 *
 * Padrão oficial do Supabase para o App Router: `getAll`/`setAll` sobre os
 * cookies do request, e a resposta é recriada sempre que o Supabase pede para
 * gravar um cookie novo, para o token renovado chegar ao navegador.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_URL, SUPABASE_ANON_KEY, supabaseConfigured } from "./supabase";

export interface ResultadoSessao {
  /** Resposta a devolver, já com os cookies renovados (se houve renovação). */
  resposta: NextResponse;
  /** True se há usuário autenticado. */
  autenticado: boolean;
}

/**
 * Resposta de erro quando o Supabase não está configurado em PRODUÇÃO.
 *
 * Fail-closed: sem env vars não há como validar sessão, e deixar passar
 * serviria o painel inteiro sem login. Vira um 503 com a causa explícita.
 */
function respostaErroConfiguracao(): NextResponse {
  return new NextResponse(
    [
      "Painel indisponível: Supabase não configurado.",
      "",
      "Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no",
      "ambiente de produção e faça o deploy de novo.",
    ].join("\n"),
    {
      status: 503,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
      },
    },
  );
}

/**
 * Renova a sessão a partir dos cookies do request e informa se há usuário.
 *
 * Usa `auth.getUser()` e não `getSession()`: o primeiro valida o token com o
 * servidor do Supabase, o segundo só decodifica o cookie e confia nele.
 *
 * Sem env vars:
 *  - fora de produção → modo mock, deixa passar (não há sessão possível);
 *  - em produção → NÃO deixa passar. `autenticado: false` faz o proxy mandar
 *    toda rota para `/login`, e a `resposta` (503 com a causa) é o que ele
 *    serve ao chegar lá. Um deploy com env vars erradas falha visível, em vez
 *    de abrir o painel sem login.
 */
export async function atualizarSessao(
  request: NextRequest,
): Promise<ResultadoSessao> {
  let resposta = NextResponse.next({ request });

  if (!supabaseConfigured) {
    if (process.env.NODE_ENV !== "production") {
      return { resposta, autenticado: true };
    }
    console.error(
      "Supabase não configurado em produção: faltam NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. Bloqueando acesso.",
    );
    return { resposta: respostaErroConfiguracao(), autenticado: false };
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookies) {
        for (const { name, value } of cookies) {
          request.cookies.set(name, value);
        }
        resposta = NextResponse.next({ request });
        for (const { name, value, options } of cookies) {
          resposta.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { resposta, autenticado: user !== null };
}

/**
 * Redirect que preserva os cookies renovados por `atualizarSessao`. Sem isto,
 * um token renovado no mesmo request em que se redireciona se perderia.
 */
export function redirecionarComCookies(
  request: NextRequest,
  destino: string,
  origem: NextResponse,
): NextResponse {
  const redirect = NextResponse.redirect(new URL(destino, request.url));
  for (const cookie of origem.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }
  return redirect;
}
