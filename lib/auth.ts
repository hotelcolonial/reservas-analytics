"use client";

/**
 * Autenticação no navegador (Supabase Auth, e-mail + senha).
 *
 * Sem roles: quem está logado vê tudo. O que protege as rotas é o `proxy.ts`;
 * aqui só ficam o login, o logout e o hook que diz quem está logado para o
 * Header mostrar o e-mail.
 */
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase, supabaseConfigured } from "./supabase";
import { ROTA_LOGIN } from "./rotasAuth";

export interface ResultadoLogin {
  /** Mensagem em pt-BR pronta para a tela, ou null se entrou. */
  erro: string | null;
}

/**
 * Traduz o erro do Supabase para uma frase que a pessoa entende. As mensagens
 * do Supabase vêm em inglês e algumas são genéricas de propósito (segurança),
 * então o mapeamento é por família, não por texto exato.
 */
function mensagemDeErro(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  const m = msg.toLowerCase();

  if (m.includes("invalid login credentials") || m.includes("invalid_credentials")) {
    return "E-mail ou senha incorretos.";
  }
  if (m.includes("email not confirmed")) {
    return "Este e-mail ainda não foi confirmado.";
  }
  if (m.includes("rate limit") || m.includes("too many requests")) {
    return "Muitas tentativas. Aguarde um instante e tente de novo.";
  }
  if (
    m.includes("failed to fetch") ||
    m.includes("networkerror") ||
    m.includes("network request failed") ||
    m.includes("load failed") ||
    m.includes("fetch failed")
  ) {
    return "Não foi possível conectar. Verifique sua internet e tente de novo.";
  }
  return "Não foi possível entrar. Tente de novo em instantes.";
}

/** Login com e-mail e senha. Nunca lança: devolve a mensagem de erro. */
export async function entrar(
  email: string,
  senha: string,
): Promise<ResultadoLogin> {
  if (!supabaseConfigured) {
    return { erro: "Supabase não configurado: o app está em modo de exemplo." };
  }
  try {
    const { error } = await getSupabase().auth.signInWithPassword({
      email,
      password: senha,
    });
    return { erro: error ? mensagemDeErro(error) : null };
  } catch (err) {
    // `signInWithPassword` devolve erros de auth em `error`, mas rede caída
    // pode chegar como exceção.
    return { erro: mensagemDeErro(err) };
  }
}

/**
 * Logout. Navegação completa (não `router.push`) de propósito: descarta os
 * stores Zustand da memória, para a próxima pessoa que logar neste navegador
 * não ver por um instante os dados da sessão anterior.
 */
export async function sair(): Promise<void> {
  if (supabaseConfigured) {
    const { error } = await getSupabase().auth.signOut();
    if (error) console.error("Supabase signOut:", error.message);
  }
  window.location.assign(ROTA_LOGIN);
}

/**
 * Usuário logado, ou null (deslogado, carregando, ou modo mock).
 * Assina `onAuthStateChange` para o Header acompanhar login/logout.
 */
export function useUsuario(): User | null {
  const [usuario, setUsuario] = useState<User | null>(null);

  useEffect(() => {
    if (!supabaseConfigured) return;
    const auth = getSupabase().auth;

    auth.getUser().then(({ data }) => setUsuario(data.user));

    const {
      data: { subscription },
    } = auth.onAuthStateChange((_evento, sessao) => {
      setUsuario(sessao?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  return usuario;
}
