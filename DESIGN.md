# Design System — GrowthDirect aplicado ao painel

> Fonte: `GrowthDirect - Design System.md`, extraído do **site institucional**.
> Este documento registra como esse sistema foi traduzido para um **painel de
> dados interno**, o que foi trazido literal, o que foi adaptado e o que ficou
> deliberadamente de fora. Aplicado em 2026-09-09.

A fonte da verdade em código é `app/globals.css`. Este arquivo explica o porquê.

---

## 1. A tradução

O DS descreve um site de marketing: hero de 168px, preloader de 7 segundos,
marquee, cursor custom, blog, cards de planos. O painel é uma ferramenta que a
equipe abre todo dia para ler tabelas e preencher formulários. As duas coisas
podem compartilhar a **marca** sem compartilhar a **encenação**.

O critério usado: trouxemos tudo que é identidade (cor, tipografia, raios,
tom, escrita) e deixamos de fora tudo que é espetáculo de primeira visita.

## 2. O que foi trazido literal

| Item | Onde |
|---|---|
| Paleta completa (`#FFFFFF`, `#F6F6F6`, `#101113`, `#5E6166`, `#9DA0A5`, `#1E2024`, creme, areia) | `globals.css` `@theme` |
| Coral unificado em `#F95738` — a nota da §2 manda escolher um só | `--color-coral` |
| `--accent-deep #D63516` para hover de sólido | `--color-coral-dark` |
| Bordas `rgba(16,17,19,0.10)` e `0.20` | `--border` / `--border-strong` |
| Nunca bold: peso máximo 400, títulos em 300 | `@layer base` trava `h1..h4` em 300; nenhum utilitário `font-bold`/`semibold`/`medium` sobrou no código |
| Escala com `clamp()` e `letter-spacing -0.045em` nos títulos | headings de todas as páginas |
| Copy em minúscula, siglas preservadas (ROI, ROAS, PDF) | títulos, botões, nav, labels |
| Pills 999px em botões e abas | `button.tsx`, `NavTabs.tsx` |
| Raios: cards 20px · blocos 28–44px | `--radius`, `card.tsx`, `EmptyState` |
| Nav com `rgba(255,255,255,.78)` + `blur(14px) saturate(150%)` | `Header.tsx` |
| Easings (`--ease-out-expo`, `--ease-smooth`, etc.) | `@theme` |
| Sublinhado hover `scaleX` e destaque "marcador" | utilitários `.link-sublinhado` e `.marcador` |
| Ícones de linha, sem emoji | `lucide-react`; o emoji do Hero foi removido |
| `prefers-reduced-motion` desliga tudo | fim do `globals.css` |

## 3. O que foi adaptado, e por quê

- **Tipografia.** O DS pede HelveticaNeueCyr 300/400. Os `.ttf` não estão no
  repo (a §9 os lista como assets a copiar). Como o próprio DS manda pôr Inter
  logo atrás no stack — porque o arquivo Light não traz glifos acentuados —,
  **Inter 300/400 carrega a marca hoje**. Ver §6 abaixo para ativar a Helvetica.

- **Texto secundário.** O DS diz "títulos sempre em `--fg` pleno, nunca
  opacidade". O painel usava `text-colonial/70`, `/50`, `/45`… Tudo virou os
  dois tokens semânticos: `text-muted-fg` (#5E6166) para descrições e
  `text-subtle-fg` (#9DA0A5) para meta.

- **Cores de status.** O DS só tem coral e cinzas, e não define estados. Num
  painel o status carrega informação, então ficou uma escala mínima e coerente:
  carvão sólido = concluído (pago, confirmada, ativa) · coral = precisa de
  atenção (pendente, pausada) · cinza = inativo · `--destructive #B3261E` =
  atrasado/cancelado. O vermelho destrutivo é mais fechado que o coral **de
  propósito**, para "excluir" nunca ser confundido com o CTA.

- **Gráficos.** Sem paleta categórica no DS. Os charts usam a escala de cinzas
  (`#101113`, `#5E6166`, `#9DA0A5`, `#EAE3DA`) com **coral como único acento**,
  que é exatamente a regra da §2.

- **Escala tipográfica.** Os `clamp()` do DS foram reduzidos: o painel usa
  `clamp(34px,4.4vw,58px)` nos títulos de página, não os 100–168px do site.
  Um h1 de 168px acima de uma tabela de lançamentos não deixa espaço para nada.

- **Scroll reveal.** Virou uma animação de entrada só (`.reveal`), sem
  IntersectionObserver: num painel o conteúdo muda a cada filtro, e re-animar a
  tabela a cada tecla seria hostil.

## 4. O que ficou de fora, e por quê

Nada disto foi esquecido — foi descartado:

- **Preloader** (frase + logo + onda, ~7s). É a pior coisa possível numa
  ferramenta aberta dezenas de vezes por dia.
- **Transição de página** (quadrado creme escalando). Meio segundo em cada
  clique de aba, todo dia.
- **Cursor custom** com `mix-blend-mode`. Atrapalha a leitura de tabelas densas.
- **Marquee, lego drop, flecha treadmill.** Movimento decorativo que compete
  com o dado. A flecha virou um giro simples no hover.
- **Componentes sem contraparte:** cards de plano, comparador antes/depois,
  blog, artigo, página de caso, modal de contato, acordeão de serviços.
- **Hero de `clamp(46px,8.4vw,168px)`.** Ver acima.

## 5. Tokens: de onde vieram e para onde foram

O painel era verde Colonial + laranja. O rename foi mecânico e completo:

| Antes | Depois | Valor |
|---|---|---|
| `colonial` | `carvao` | `#101113` |
| `colonial-50` | `carvao-50` | `#F6F6F6` |
| `colonial-700` | `carvao-700` | `#1E2024` |
| `laranja` / `brand` | `coral` | `#F95738` |
| `laranja-dark` | `coral-dark` | `#D63516` |
| `text-colonial/70..55` | `text-muted-fg` | `#5E6166` |
| `text-colonial/50..35` | `text-subtle-fg` | `#9DA0A5` |
| `font-display` | `font-brand` | Inter → Helvetica |

`branco` manteve nome e valor. Os tokens shadcn (`--primary`, `--border`,
`--radius`…) foram remapeados à paleta nova, e é isso que faz Button, Card,
Input, Select, Sheet, Dialog e Badge seguirem o DS sem reescrita.

⚠️ A string `"colonial"` continua existindo como **dado** (`propriedadeId`,
`Hotel Colonial`, `camp-colonial-junino`) em `lib/store.ts` e `data/mockData.ts`.
Isso é o nome de um hotel cliente, não um token. Não renomeie.

## 6. Pendências

- **Fontes da marca.** Colocar `HelveticaNeueCyr-Light.ttf` e
  `-Roman.ttf` em `public/fonts/`, declarar os `@font-face` (300 e 400) e pôr
  `"HelveticaNeueCyr"` na frente de Inter em `--font-brand`. O stack já está
  montado para isso: é uma linha em `globals.css`.
- **Logotipo.** Hoje a marca é tipográfica (`growthdirect` + ponto coral) no
  `Header`. Quando `logo-growthdirect-t.png` entrar em `public/`, ele
  substitui o bloco marcado em `components/layout/Header.tsx`.
- **Cores das naturezas já gravadas.** O seed novo em `schema-gastos.sql` usa a
  paleta do DS, mas as 6 linhas que já estão no Supabase mantêm as cores
  verdes antigas até serem editadas em `/gastos/naturezas` (ou por um `update`).
