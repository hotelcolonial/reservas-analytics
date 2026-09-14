# GrowthDirect — painel interno

Painel web interno da GrowthDirect com dois módulos independentes:

- **ReservaTrack** — mede o retorno das campanhas de marketing que geram reservas nos
  hotéis clientes (multipropriedade). A equipe cadastra campanhas, a verba gasta por dia e
  as reservas; o app cruza os três e calcula ROI, ROAS, ticket médio e custo por reserva,
  por campanha e por plataforma, com filtro de período.
- **Gastos** — controle das despesas do escritório: lançamentos, despesas recorrentes,
  cartões e naturezas, com comprovante anexado.

A rota `/` é um hub que escolhe entre os dois módulos.

Idioma da UI e do domínio: **pt-BR**. Os identificadores no código também são em
português (`campanha`, `reserva`, `gasto`, `lancamento`, `propriedade`).

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** (strict)
- **Tailwind CSS v4** + **shadcn/ui** (sobre Radix)
- **Zustand** (estado global, um store por módulo)
- **Supabase** (Postgres via PostgREST + Storage), chamado **direto do navegador** com a
  chave anon
- **Recharts** (gráficos) · **@dnd-kit** (reordenar campanhas)

## Como funciona

- **Dados no navegador; sessão no servidor.** Toda página é `"use client"` e toda
  leitura/escrita de dados vai direto do navegador ao Supabase com a anon key. O único
  código de servidor é o `proxy.ts` (o "middleware" do Next 16), que renova a sessão a
  cada request e barra quem não está logado. Não há Route Handlers nem Server Actions,
  então continua não havendo lugar para segredos de terceiros.
- **Login com e-mail e senha (Supabase Auth).** Sem sessão, qualquer rota redireciona
  para `/login`. Não há roles: todo usuário autenticado vê e edita tudo. Os usuários são
  criados no Dashboard do Supabase (Authentication → Users), não pelo app. As policies
  RLS ainda são permissivas (próxima fase). Não cadastre dados pessoais de hóspedes.
- **Carga completa em memória.** Ao abrir, o app baixa as tabelas inteiras (paginando de
  1000 em 1000) e todo filtro, ordenação, paginação e cálculo acontece no navegador.
- **Escrita otimista, sem rollback.** Cada ação atualiza o estado local primeiro e dispara
  a gravação no Supabase sem `await`; um erro vai só para o `console.error`.
- **Modo mock.** Sem as variáveis de ambiente, o app roda com os dados de exemplo de
  `data/mockData.ts` e `data/mockDataGastos.ts`, em memória e sem persistência — e sem
  login: o proxy deixa tudo passar, porque não há sessão possível.

Os detalhes (modelo de dados, padrão do store, regras de cálculo e convenções de UI)
estão em **`ARQUITETURA.md`**. O módulo de gastos está em **`GASTOS.md`**. A identidade
visual está em **`DESIGN.md`**.

## Instalação e execução

Pré-requisito: **Node.js 20.9+** (o ambiente de desenvolvimento usa Node 24).

```bash
npm install
cp .env.example .env.local   # e preencha as duas variáveis
npm run dev
```

Acesse **http://localhost:3000**.

### Variáveis de ambiente

| Variável | O que é |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase (Dashboard → Project Settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon/publishable do projeto |

As duas são expostas ao navegador (prefixo `NEXT_PUBLIC_`). Os arquivos `.env*` são
ignorados pelo git, exceto o `.env.example`. Se faltar alguma, o app sobe em modo mock.

### Usuários

O login usa **Supabase Auth com e-mail e senha**. Não há tela de cadastro: crie cada
pessoa no Dashboard do Supabase (Authentication → Users → Add user), com a opção de
auto-confirmar o e-mail. Todos os usuários têm o mesmo acesso.

### Banco de dados

Não há ferramenta de migração: os scripts de `supabase/` são executados **à mão, no SQL
Editor do Supabase**, uma vez cada, nesta ordem:

1. `supabase/schema.sql` — tabelas do ReservaTrack (`propriedades`, `campanhas`,
   `reservas`, `gastos`).
2. `supabase/migration-multipropriedade.sql` — só para projetos criados antes da
   multipropriedade: adiciona `propriedades` e a coluna `propriedade_id`.
3. `supabase/schema-gastos.sql` — tabelas do módulo Gastos (`cartoes`, `naturezas`,
   `despesas_recorrentes`, `lancamentos`) e as naturezas iniciais.

O anexo de comprovantes usa o bucket **`comprovantes`** do Supabase Storage. Ele não é
criado por nenhum script: crie-o no Dashboard (Storage → New bucket), como bucket público.

## Scripts

```bash
npm run dev         # servidor de desenvolvimento
npm run build       # build de produção
npm start           # roda o build de produção
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
```

## Rotas

| Rota | O que faz |
|---|---|
| `/login` | Entrar com e-mail e senha. Única rota pública |
| `/` | Hub: escolhe entre ReservaTrack e Gastos |
| `/painel` | Dashboard do ReservaTrack: filtro de período, métricas, gráficos, ranking e resumo de campanhas |
| `/campanhas` · `/campanhas/[id]` | Cadastro de campanhas (grid ou lista, drag & drop) e detalhe de cada uma |
| `/reservas` | Tabela paginada com busca e filtros por campanha, plataforma, status e datas |
| `/verba` | Verba gasta por dia em cada campanha |
| `/plataformas` | Comparativo por plataforma |
| `/propriedades` | Cadastro dos hotéis (propriedades) |
| `/gastos` | Dashboard de gastos: totais, gráfico mensal, por natureza e por cartão, contas a pagar |
| `/gastos/lancamentos` | Lançamentos com filtros, alta/edição e comprovante |
| `/gastos/recorrentes` | Despesas recorrentes e geração dos lançamentos de uma competência |
| `/gastos/cartoes` · `/gastos/naturezas` | Cadastros de cartões e naturezas |

## Estrutura do projeto

```
proxy.ts                Código de servidor: renova a sessão e protege as rotas
app/
  layout.tsx            Shell (fontes, Providers, Header)
  page.tsx              Hub de módulos
  providers.tsx         Carga inicial do store do ReservaTrack (ignora /login)
  login/                Tela de login
  painel/ campanhas/ reservas/ verba/ plataformas/ propriedades/
  gastos/               Módulo Gastos, com layout.tsx e providers.tsx próprios
components/
  ui/                   Primitivas shadcn + ConfirmDialog, EmptyState, Pagination, PeriodFilter
  layout/               Header, NavTabs, UserMenu
  dashboard/ campaigns/ reservations/ platforms/ verba/
  gastos/               Formulários, filtros e gráficos do módulo Gastos
lib/
  types.ts              Tipos do domínio ReservaTrack
  typesGastos.ts        Tipos do domínio Gastos
  store.ts              Store Zustand do ReservaTrack (escopo por propriedade)
  storeGastos.ts        Store Zustand do módulo Gastos
  supabase.ts           Cliente Supabase de navegador, leitura paginada e mappers
  supabaseServer.ts     Cliente Supabase de servidor (cookies), usado só pelo proxy
  auth.ts               Login, logout e hook do usuário logado
  rotasAuth.ts          Constantes de rota da autenticação
  supabaseGastos.ts     Mappers do módulo Gastos
  storageGastos.ts      Upload de comprovantes (Supabase Storage)
  calculations.ts       Métricas do ReservaTrack
  calculationsGastos.ts Métricas do módulo Gastos
  recorrencia.ts        Ocorrências das despesas recorrentes
  utils.ts              Formatação (BRL, datas), período, labels
data/
  mockData.ts           Dados de exemplo do ReservaTrack (modo mock)
  mockDataGastos.ts     Dados de exemplo do módulo Gastos (modo mock)
supabase/
  schema.sql  migration-multipropriedade.sql  schema-gastos.sql
```
