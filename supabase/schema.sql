-- ReservaTrack — Supabase schema (multipropriedade)
-- Run this in the Supabase SQL Editor to create the required tables.

-- Cada propriedade (hotel/pousada) tem seu próprio painel isolado.
create table if not exists propriedades (
  id            text primary key,
  nome          text        not null,
  ordem         integer     not null default 0,
  created_at    timestamptz not null default now()
);

insert into propriedades (id, nome, ordem) values
  ('colonial',         'Hotel Colonial',   1),
  ('posada-cataratas', 'Posada Cataratas', 2)
on conflict (id) do nothing;

create table if not exists campanhas (
  id             text primary key,
  propriedade_id text        references propriedades(id),
  nome           text        not null,
  plataforma     text        not null,
  tipo           text        not null,
  status         text        not null default 'ativa',
  ordem          integer     not null default 0,
  created_at     timestamptz not null default now()
);

-- Se a tabela já existia sem a coluna `ordem`, rode:
--   alter table campanhas add column if not exists ordem integer not null default 0;

create table if not exists reservas (
  id                text primary key,
  propriedade_id    text        references propriedades(id),
  codigo            text        not null,
  data_reserva      text        not null,
  check_in          text        not null,
  check_out         text        not null,
  campanha_id       text        references campanhas(id) on delete set null,
  plataforma        text        not null,
  valor             numeric     not null default 0,
  pax               integer     not null default 1,
  noites            integer     not null default 0,
  veio_da_campanha  boolean     not null default true,
  status            text        not null default 'confirmada',
  created_at        timestamptz not null default now()
);

-- Verba gastada por dia em cada campanha (investimento variável).
create table if not exists gastos (
  id             text primary key,
  propriedade_id text        references propriedades(id),
  campanha_id    text        not null references campanhas(id) on delete cascade,
  data           text        not null,
  valor          numeric     not null default 0,
  created_at     timestamptz not null default now()
);

create index if not exists gastos_campanha_idx on gastos (campanha_id);
create index if not exists gastos_data_idx on gastos (data);
create index if not exists campanhas_prop_idx on campanhas (propriedade_id);
create index if not exists reservas_prop_idx  on reservas  (propriedade_id);
create index if not exists gastos_prop_idx    on gastos    (propriedade_id);

-- Enable Row Level Security (RLS) — adjust policies to your auth setup.
alter table campanhas enable row level security;
alter table reservas   enable row level security;
alter table gastos     enable row level security;

-- Allow full access for authenticated users (adjust as needed).
create policy "Authenticated users can read campanhas"
  on campanhas for select using (auth.role() = 'authenticated');
create policy "Authenticated users can write campanhas"
  on campanhas for all using (auth.role() = 'authenticated');

create policy "Authenticated users can read reservas"
  on reservas for select using (auth.role() = 'authenticated');
create policy "Authenticated users can write reservas"
  on reservas for all using (auth.role() = 'authenticated');

create policy "Authenticated users can read gastos"
  on gastos for select using (auth.role() = 'authenticated');
create policy "Authenticated users can write gastos"
  on gastos for all using (auth.role() = 'authenticated');
