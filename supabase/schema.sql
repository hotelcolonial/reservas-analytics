-- ReservaTrack Colonial — Supabase schema
-- Run this in the Supabase SQL Editor to create the required tables.

create table if not exists campanhas (
  id            text primary key,
  nome          text        not null,
  plataforma    text        not null,
  tipo          text        not null,
  status        text        not null default 'ativa',
  created_at    timestamptz not null default now()
);

create table if not exists reservas (
  id                text primary key,
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
  id            text primary key,
  campanha_id   text        not null references campanhas(id) on delete cascade,
  data          text        not null,
  valor         numeric     not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists gastos_campanha_idx on gastos (campanha_id);
create index if not exists gastos_data_idx on gastos (data);

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
