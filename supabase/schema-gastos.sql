-- ─────────────────────────────────────────────────────────────────────────
-- Módulo Gastos — GrowthDirect
-- Rode este bloco UMA vez no SQL Editor do Supabase.
--
-- Estas tabelas vivem FORA do escopo de propriedade (ver GASTOS.md): os
-- gastos são da empresa, não de um hotel. Por isso nenhuma delas tem
-- `propriedade_id`.
--
-- Convenções herdadas de ARQUITETURA.md:
--   • `id` é `text primary key` SEM default — quem gera é o cliente
--     (`crypto.randomUUID()`).
--   • Datas são `text` em ISO `yyyy-mm-dd`; `competencia` é `text` `yyyy-mm`.
--     A comparação é lexicográfica, e é por isso que o formato importa.
--   • Dinheiro é `numeric`.
--   • Colunas em snake_case.
-- ─────────────────────────────────────────────────────────────────────────

-- ── Cartões ──────────────────────────────────────────────────────────────
-- `final` guarda SOMENTE os 4 últimos dígitos. Nunca o número completo.
create table if not exists cartoes (
  id             text primary key,
  nome           text        not null,
  bandeira       text        not null default 'outro',
  final          text        not null,
  titular        text        not null default '',
  ativo          boolean     not null default true,
  ordem          integer     not null default 0,
  created_at     timestamptz not null default now(),
  constraint cartoes_final_4_digitos check (final ~ '^[0-9]{4}$')
);

-- ── Naturezas ────────────────────────────────────────────────────────────
create table if not exists naturezas (
  id         text primary key,
  nome       text        not null,
  grupo      text        not null default 'outro',
  cor        text        not null default '#5e6166',
  ordem      integer     not null default 0,
  created_at timestamptz not null default now()
);

-- ── Despesas recorrentes ─────────────────────────────────────────────────
-- Modelos que geram lançamentos. `dia_vencimento` é dia da semana (0-6, 0 =
-- domingo) quando a periodicidade é semanal, e dia do mês (1-31) quando é
-- mensal ou anual. `mes_vencimento` (1-12) só vale para anual.
create table if not exists despesas_recorrentes (
  id              text primary key,
  nome            text        not null,
  descricao       text        not null default '',
  natureza_id     text        references naturezas(id) on delete set null,
  fornecedor      text        not null default '',
  forma_pagamento text        not null default 'pix',
  cartao_id       text        references cartoes(id) on delete set null,
  valor_previsto  numeric     not null default 0,
  periodicidade   text        not null default 'mensal',
  dia_vencimento  integer     not null default 1,
  mes_vencimento  integer,
  ativa           boolean     not null default true,
  inicio          text        not null,
  fim             text,
  created_at      timestamptz not null default now(),
  constraint despesas_recorrentes_mes_vencimento_valido
    check (mes_vencimento is null or mes_vencimento between 1 and 12)
);

-- ── Lançamentos ──────────────────────────────────────────────────────────
-- `competencia` é o mês a que o gasto pertence (`yyyy-mm`), que não é
-- necessariamente o mês do vencimento nem o do pagamento.
-- `despesa_recorrente_id` nulo = gasto avulso.
create table if not exists lancamentos (
  id                    text        primary key,
  descricao             text        not null,
  natureza_id           text        references naturezas(id) on delete set null,
  fornecedor            text        not null default '',
  forma_pagamento       text        not null default 'pix',
  cartao_id             text        references cartoes(id) on delete set null,
  valor                 numeric     not null default 0,
  competencia           text        not null,
  data_vencimento       text        not null,
  data_pagamento        text,
  status                text        not null default 'pendente',
  comprovante_url       text,
  observacoes           text        not null default '',
  despesa_recorrente_id text        references despesas_recorrentes(id) on delete set null,
  criado_em             text        not null,
  created_at            timestamptz not null default now()
);

create index if not exists lancamentos_competencia_idx  on lancamentos (competencia);
create index if not exists lancamentos_status_idx       on lancamentos (status);
create index if not exists lancamentos_vencimento_idx   on lancamentos (data_vencimento);
create index if not exists lancamentos_natureza_idx     on lancamentos (natureza_id);
create index if not exists lancamentos_cartao_idx       on lancamentos (cartao_id);
create index if not exists lancamentos_recorrente_idx   on lancamentos (despesa_recorrente_id);
create index if not exists despesas_recorrentes_natureza_idx on despesas_recorrentes (natureza_id);

-- ── RLS ──────────────────────────────────────────────────────────────────
-- Mesmo padrão de migration-multipropriedade.sql: o app lê e escreve com a
-- chave pública (anon) e NÃO autentica, então as policies são permissivas.
-- Não usar `auth.role() = 'authenticated'` aqui — nada seria lido.
alter table cartoes              enable row level security;
alter table naturezas            enable row level security;
alter table despesas_recorrentes enable row level security;
alter table lancamentos          enable row level security;

create policy "cartoes read"  on cartoes for select using (true);
create policy "cartoes write" on cartoes for all    using (true) with check (true);

create policy "naturezas read"  on naturezas for select using (true);
create policy "naturezas write" on naturezas for all    using (true) with check (true);

create policy "despesas_recorrentes read"
  on despesas_recorrentes for select using (true);
create policy "despesas_recorrentes write"
  on despesas_recorrentes for all    using (true) with check (true);

create policy "lancamentos read"  on lancamentos for select using (true);
create policy "lancamentos write" on lancamentos for all    using (true) with check (true);

-- ── Naturezas iniciais ───────────────────────────────────────────────────
insert into naturezas (id, nome, grupo, cor, ordem) values
  ('nat-material-escritorio', 'Material de escritório',   'interno',     '#101113', 1),
  ('nat-limpeza',             'Limpeza',                  'interno',     '#5e6166', 2),
  ('nat-trafego-pago',        'Tráfego pago',             'plataformas', '#f95738', 3),
  ('nat-email-marketing',     'Email marketing',          'plataformas', '#d63516', 4),
  ('nat-softwares',           'Softwares e assinaturas',  'plataformas', '#9da0a5', 5),
  ('nat-dominios',            'Domínios e hospedagem',    'plataformas', '#eae3da', 6)
on conflict (id) do nothing;
