# ReservaTrack Colonial

Aplicação web para **controle e análise de reservas geradas por campanhas de WhatsApp**
do Hotel Colonial. Permite cadastrar campanhas (Google Ads, Meta Ads, Orgânico, WhatsApp
Direto), registrar reservas manualmente, vinculá-las à campanha de origem e acompanhar
métricas de retorno (ROI, ROAS, ticket médio, custo por reserva) em um dashboard.

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4**
- **Zustand** (estado global + persistência em `localStorage`)
- **Recharts** (gráficos)

## Instalação e execução

Pré-requisito: **Node.js 18+** (recomendado 20+).

```bash
npm install
npm run dev
```

Acesse **http://localhost:3000**.

Outros comandos:

```bash
npm run build   # build de produção (valida tipos)
npm start       # roda o build de produção
npm run lint    # ESLint
```

## Como funciona

- **Sem backend:** os dados ficam no `localStorage` do navegador. No primeiro acesso a
  app é populada com dados de exemplo (5 campanhas + 12 reservas), que podem ser editados
  ou excluídos livremente.
- **Tudo é funcional e reativo:** criar/editar/excluir campanhas e reservas atualiza
  imediatamente as listas e **recalcula todas as métricas** do dashboard.
- **Persistência:** ao recarregar a página, seus dados continuam salvos.

### Módulos

| Tela | O que faz |
|------|-----------|
| **Dashboard** (`/`) | Cards de métricas, resumo de campanhas, gráficos de receita por campanha e reservas por plataforma, ranking e reservas recentes. |
| **Campanhas** (`/campanhas`) | Criar, editar, excluir e ativar/pausar campanhas. Cada card mostra investimento, receita, ROI, ROAS e custo por reserva. |
| **Reservas** (`/reservas`) | Tabela com busca e filtros (campanha, plataforma, status, período de check-in). Criar, editar e excluir reservas. As noites são calculadas automaticamente pelo check-in/check-out (com ajuste manual). |
| **Plataformas** (`/plataformas`) | Comparativo de investimento, reservas, receita, ROI, ROAS e custo por reserva entre as plataformas. |

### Fórmulas de métricas

- **Receita** = soma do valor das reservas **confirmadas**
- **ROI** = `((Receita − Investimento) / Investimento) × 100`
- **ROAS** = `Receita / Investimento`
- **Ticket médio** = `Receita / nº de reservas confirmadas`
- **Custo por reserva** = `Investimento / nº de reservas confirmadas`

Quando o investimento é `0` (ou não há reservas), os indicadores que dividiriam por zero
exibem **"N/A"** em vez de erro.

## Estrutura do projeto

```
app/
  layout.tsx          Shell (header + navegação), fontes e providers
  page.tsx            Dashboard
  providers.tsx       Hidratação do store (localStorage)
  campanhas/page.tsx
  reservas/page.tsx
  plataformas/page.tsx
components/
  dashboard/  campaigns/  reservations/  platforms/  layout/  ui/
lib/
  types.ts            Tipos do domínio
  utils.ts            Formatação (BRL, datas), labels e helpers
  calculations.ts     Métricas (campanha, plataforma, dashboard)
  storage.ts          Camada de persistência abstraída
  store.ts            Store Zustand (campanhas + reservas + ações CRUD)
data/
  mockData.ts         Dados de exemplo iniciais
```

## Migração futura para Supabase / PostgreSQL

A persistência é isolada atrás da interface `StorageAdapter` em `lib/storage.ts`. Para
trocar o `localStorage` por um backend, basta criar um adapter (ex.: `supabaseAdapter`)
que implemente a mesma interface e apontar a constante `storage` para ele — os componentes
e o store não precisam mudar.
