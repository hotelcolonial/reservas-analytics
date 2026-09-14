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

- **100% client-side.** Toda página é `"use client"`. Não há Route Handlers, Server
  Actions, middleware nem sessão. O navegador fala com o Supabase usando a anon key
  pública — por isso não há lugar para segredos de terceiros nem autenticação.
- **Sem login.** Quem tem a URL vê e edita tudo. As policies RLS do projeto são
  permissivas. Não cadastre dados pessoais de hóspedes.
- **Carga completa em memória.** Ao abrir, o app baixa as tabelas inteiras (paginando de
  1000 em 1000) e todo filtro, ordenação, paginação e cálculo acontece no navegador.
- **Escrita otimista, sem rollback.** Cada ação atualiza o estado local primeiro e dispara
  a gravação no Supabase sem `await`; um erro vai só para o `console.error`.
- **Modo mock.** Sem as variáveis de ambiente, o app roda com os dados de exemplo de
  `data/mockData.ts` e `data/mockDataGastos.ts`, em memória e sem persistência.

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
app/
  layout.tsx            Shell (fontes, Providers, Header)
  page.tsx              Hub de módulos
  providers.tsx         Carga inicial do store do ReservaTrack
  painel/ campanhas/ reservas/ verba/ plataformas/ propriedades/
  gastos/               Módulo Gastos, com layout.tsx e providers.tsx próprios
components/
  ui/                   Primitivas shadcn + ConfirmDialog, EmptyState, Pagination, PeriodFilter
  dashboard/ campaigns/ reservations/ platforms/ verba/ layout/
  gastos/               Formulários, filtros e gráficos do módulo Gastos
lib/
  types.ts              Tipos do domínio ReservaTrack
  typesGastos.ts        Tipos do domínio Gastos
  store.ts              Store Zustand do ReservaTrack (escopo por propriedade)
  storeGastos.ts        Store Zustand do módulo Gastos
  supabase.ts           Cliente Supabase, leitura paginada e mappers row ↔ domínio
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
