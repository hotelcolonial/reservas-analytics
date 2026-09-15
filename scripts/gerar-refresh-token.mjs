#!/usr/bin/env node
/**
 * Gera um refresh token OAuth 2.0 para a Google Ads API.
 *
 * Passo ÚNICO de setup, fora do app. Não tem dependências: só `node:http`,
 * `node:crypto` e o `fetch` nativo (Node 18+).
 *
 * O que faz:
 *   1. lê GOOGLE_ADS_CLIENT_ID e GOOGLE_ADS_CLIENT_SECRET do ambiente;
 *   2. sobe um servidor HTTP em localhost para receber o callback do Google;
 *   3. abre (ou imprime) a URL de autorização com scope adwords,
 *      access_type=offline e prompt=consent — sem o `consent`, o Google só
 *      devolve refresh_token na PRIMEIRA autorização da conta;
 *   4. troca o `code` do callback por tokens e imprime o refresh_token;
 *   5. derruba o servidor e encerra.
 *
 * NADA é gravado em disco. O token sai só no terminal: copie para onde vai
 * ser usado (ambiente do servidor, cofre de segredos) e NUNCA para o repo.
 *
 * Uso (PowerShell):
 *   $env:GOOGLE_ADS_CLIENT_ID = "…"
 *   $env:GOOGLE_ADS_CLIENT_SECRET = "…"
 *   node scripts/gerar-refresh-token.mjs
 *
 * Opcional: GOOGLE_ADS_OAUTH_PORT (padrão 8765). Se o client OAuth for do
 * tipo "Aplicativo da Web", http://localhost:<porta> precisa estar cadastrado
 * como URI de redirecionamento no Google Cloud Console. Se for do tipo
 * "Computador" (desktop), qualquer porta de localhost é aceita.
 */

import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { exec } from "node:child_process";
import { platform } from "node:os";

const CLIENT_ID = process.env.GOOGLE_ADS_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_ADS_CLIENT_SECRET;
const PORTA = Number(process.env.GOOGLE_ADS_OAUTH_PORT ?? 8765);

const SCOPE = "https://www.googleapis.com/auth/adwords";
const URL_AUTORIZACAO = "https://accounts.google.com/o/oauth2/v2/auth";
const URL_TOKEN = "https://oauth2.googleapis.com/token";
const CAMINHO_CALLBACK = "/oauth2callback";
const TEMPO_LIMITE_MS = 5 * 60 * 1000; // 5 minutos esperando o callback

// ── Pré-condições ──────────────────────────────────────────────────────────

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    [
      "Faltam variáveis de ambiente.",
      "",
      "Defina antes de rodar (PowerShell):",
      '  $env:GOOGLE_ADS_CLIENT_ID = "seu-client-id"',
      '  $env:GOOGLE_ADS_CLIENT_SECRET = "seu-client-secret"',
      "  node scripts/gerar-refresh-token.mjs",
    ].join("\n"),
  );
  process.exit(1);
}
if (!Number.isInteger(PORTA) || PORTA < 1 || PORTA > 65535) {
  console.error(`GOOGLE_ADS_OAUTH_PORT inválida: ${process.env.GOOGLE_ADS_OAUTH_PORT}`);
  process.exit(1);
}

const REDIRECT_URI = `http://localhost:${PORTA}${CAMINHO_CALLBACK}`;

// `state` aleatório: o callback só é aceito se devolver o mesmo valor
// (protege contra um redirect forjado para esta porta).
const state = randomBytes(16).toString("hex");

const urlAutorizacao =
  URL_AUTORIZACAO +
  "?" +
  new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  }).toString();

// ── Troca do código por tokens ─────────────────────────────────────────────

async function trocarCodigoPorTokens(code) {
  const resposta = await fetch(URL_TOKEN, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });
  const corpo = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    const motivo = corpo.error_description || corpo.error || `HTTP ${resposta.status}`;
    throw new Error(`Google recusou a troca do código: ${motivo}`);
  }
  return corpo;
}

// ── Página mínima que o navegador mostra no fim ────────────────────────────

function html(titulo, texto) {
  return `<!doctype html><meta charset="utf-8"><title>${titulo}</title>
<body style="font-family:system-ui;max-width:32rem;margin:4rem auto;line-height:1.5">
<h1 style="font-weight:300">${titulo}</h1><p>${texto}</p></body>`;
}

// ── Servidor local ─────────────────────────────────────────────────────────

let encerrado = false;

function encerrar(codigoSaida) {
  if (encerrado) return;
  encerrado = true;
  clearTimeout(temporizador);
  servidor.close(() => process.exit(codigoSaida));
  // Se alguma conexão ficar pendurada (keep-alive), não espera por ela.
  setTimeout(() => process.exit(codigoSaida), 1000).unref();
}

const servidor = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORTA}`);

  if (url.pathname !== CAMINHO_CALLBACK) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Nada aqui. Aguardando o callback do Google em " + CAMINHO_CALLBACK);
    return;
  }

  const erro = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const stateRecebido = url.searchParams.get("state");

  if (erro) {
    res.writeHead(400, { "content-type": "text/html; charset=utf-8" });
    res.end(html("Autorização negada", `O Google devolveu: <code>${erro}</code>.`));
    console.error(`\nAutorização negada pelo Google: ${erro}`);
    encerrar(1);
    return;
  }
  if (!code || stateRecebido !== state) {
    res.writeHead(400, { "content-type": "text/html; charset=utf-8" });
    res.end(html("Callback inválido", "Faltou o código ou o <code>state</code> não confere. Rode o script de novo."));
    console.error("\nCallback inválido (sem code, ou state diferente). Rode de novo.");
    encerrar(1);
    return;
  }

  try {
    const tokens = await trocarCodigoPorTokens(code);

    if (!tokens.refresh_token) {
      // Acontece quando a conta já tinha autorizado este client e o Google
      // não repete o refresh_token. O prompt=consent evita isso; se ainda
      // assim vier vazio, revogue o acesso em myaccount.google.com/permissions
      // e rode de novo.
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(html("Sem refresh_token", "O Google não devolveu refresh_token. Revogue o acesso deste app na sua Conta Google e rode o script de novo."));
      console.error(
        "\nO Google não devolveu refresh_token.\n" +
          "Revogue o acesso deste app em https://myaccount.google.com/permissions e rode de novo.",
      );
      encerrar(1);
      return;
    }

    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(html("Pronto", "O refresh token está no terminal. Pode fechar esta aba."));

    console.log("\n──────────────────────────────────────────────────────────");
    console.log("REFRESH TOKEN (guarde num cofre de segredos, nunca no repo):");
    console.log("");
    console.log(tokens.refresh_token);
    console.log("");
    console.log(`scope concedido: ${tokens.scope ?? "(não informado)"}`);
    console.log("──────────────────────────────────────────────────────────\n");
    encerrar(0);
  } catch (e) {
    res.writeHead(500, { "content-type": "text/html; charset=utf-8" });
    res.end(html("Falha na troca do código", String(e.message ?? e)));
    console.error(`\n${e.message ?? e}`);
    encerrar(1);
  }
});

servidor.on("error", (e) => {
  if (e.code === "EADDRINUSE") {
    console.error(
      `A porta ${PORTA} já está em uso. Feche o que está nela ou rode com outra:\n` +
        `  $env:GOOGLE_ADS_OAUTH_PORT = "8766"`,
    );
  } else {
    console.error(`Não foi possível subir o servidor local: ${e.message}`);
  }
  process.exit(1);
});

const temporizador = setTimeout(() => {
  console.error("\nTempo esgotado (5 min) sem receber o callback do Google. Rode de novo.");
  encerrar(1);
}, TEMPO_LIMITE_MS);

servidor.listen(PORTA, "localhost", () => {
  console.log(`Servidor local ouvindo em ${REDIRECT_URI}`);
  console.log("\nAbra esta URL no navegador (tentando abrir automaticamente):\n");
  console.log(urlAutorizacao + "\n");
  console.log("Faça login com a conta que administra o Google Ads e autorize o acesso.");
  console.log("Aguardando o callback…");
  abrirNoNavegador(urlAutorizacao);
});

// ── Abrir o navegador (melhor esforço; a URL já foi impressa acima) ────────

function abrirNoNavegador(url) {
  const so = platform();
  // No Windows, `start` trata `&` como separador de comando: a URL vai entre
  // aspas e o primeiro argumento vazio é o título da janela.
  const comando =
    so === "win32"
      ? `start "" "${url}"`
      : so === "darwin"
        ? `open "${url}"`
        : `xdg-open "${url}"`;
  exec(comando, (e) => {
    if (e) console.log("(não consegui abrir o navegador sozinho — copie a URL acima)");
  });
}
