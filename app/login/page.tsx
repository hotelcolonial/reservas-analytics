"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Logo } from "@/components/layout/Logo";
import { entrar } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/supabase";
import { ROTA_INICIAL } from "@/lib/rotasAuth";

/**
 * Login com e-mail e senha (Supabase Auth).
 *
 * Fica fora do carregamento de dados do `Providers` (ele ignora esta rota) e
 * sem `Header` (ele devolve null aqui), então a página desenha a própria marca.
 * Quem já está logado nem chega aqui: o `proxy.ts` redireciona para o hub.
 */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

  const podeEnviar = email.trim() !== "" && senha !== "" && !entrando;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!podeEnviar) return;
    setErro(null);
    setEntrando(true);

    const resultado = await entrar(email.trim(), senha);

    if (resultado.erro) {
      setErro(resultado.erro);
      setEntrando(false);
      return;
    }
    // Sessão gravada em cookie; `refresh` faz o proxy reavaliar a rota.
    router.replace(ROTA_INICIAL);
    router.refresh();
  }

  return (
    <div className="reveal flex min-h-[calc(100dvh-6.5rem)] flex-col items-center justify-center">
      <div className="w-full max-w-md">
        {/* Logotipo empilhado: símbolo sobre o wordmark, centrado. */}
        <Logo variante="vertical" priority className="mx-auto h-28 sm:h-32" />

        <h1 className="mt-10 text-center font-brand text-[clamp(30px,4vw,44px)] leading-[0.95] font-light tracking-[-0.045em] text-carvao lowercase">
          painel <span className="text-coral">administrativo</span>
        </h1>
        <p className="mt-3 text-center text-[clamp(15px,1.1vw,17px)] leading-relaxed text-muted-fg">
          Acesso restrito à equipe. Entre com seu e-mail e senha.
        </p>

        <Card className="mt-8">
          <CardContent>
            {supabaseConfigured ? (
              <form onSubmit={onSubmit} noValidate className="space-y-5">
                <Field>
                  <FieldLabel htmlFor="login-email">E-mail</FieldLabel>
                  <Input
                    id="login-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={entrando}
                    aria-invalid={erro !== null || undefined}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="login-senha">Senha</FieldLabel>
                  <Input
                    id="login-senha"
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    disabled={entrando}
                    aria-invalid={erro !== null || undefined}
                  />
                </Field>

                {erro && <FieldError>{erro}</FieldError>}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={!podeEnviar}
                  aria-busy={entrando}
                >
                  {entrando ? (
                    <>
                      <span className="size-4 animate-spin rounded-full border-2 border-branco/40 border-t-branco" />
                      entrando…
                    </>
                  ) : (
                    "entrar"
                  )}
                </Button>
              </form>
            ) : (
              // Modo mock: sem Supabase não há login possível.
              <div className="space-y-4">
                <p className="text-sm leading-relaxed text-muted-fg">
                  Supabase não configurado. O app está rodando com dados de
                  exemplo, sem login. Preencha{" "}
                  <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
                  e{" "}
                  <code className="font-mono text-xs">
                    NEXT_PUBLIC_SUPABASE_ANON_KEY
                  </code>{" "}
                  para ativar a autenticação.
                </p>
                <Button asChild variant="outline">
                  <Link href={ROTA_INICIAL}>
                    abrir o painel
                    <ArrowUpRight />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-subtle-fg">
          Sem conta? Peça acesso a quem administra o painel.
        </p>
      </div>
    </div>
  );
}
